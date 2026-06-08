---
status: accepted
---

# Order は Checkout で永続化する（`OrderPlaced` 書き込み境界）＋ `order_number` は日次リセット連番

`Order` 行が生まれる瞬間を、完了画面（GET `/order/complete`）から **Checkout（POST `/order/checkout`）** に移す。Checkout は用語集（`CONTEXT.md`）が "writes the first persistent row" と定義する `OrderPlaced` の発火点であり、永続化の境界はここ一点に揃える。あわせて `order_number` を `rand` から**日次リセットの連番**に置き換える。

従来は `checkout` が `session[:last_order]` に詰めるだけで、`order_complete`（GET）が `find_or_create_by!` で初めて DB 行を作っていた。これは (1) GET に副作用がある、(2) 客が会計確定後にタブを閉じる／通信断で完了画面に到達しないと `Order` 行が永遠に生まれず**キッチンキューに現れない**、(3) `order_number = rand(1000..9999)` が衝突すると `find_or_create_by!` が既存注文に相乗りし**新注文を取りこぼす**、という三つの欠陥を抱えていた。

## Considered Options

### いつ永続化するか

- **eager-at-checkout（採用）** — `Order` ＋ `order_items` を Checkout トランザクションで書く。完了画面は `:id` で永続 `Order` を読むだけ（副作用なし・再表示可）。注文は完了画面に依存せず残り、キッチンキュー（`placed_at` のある行）に必ず現れる。
- **lazy-on-GET（却下）** — 従来方式。GET に副作用があり、完了画面未到達で注文が消える。安全であるべき GET が書き込み境界を兼ねるのは Checkout の意味（`OrderPlaced`）とも食い違う。

### `order_number` の採番

- **daily-reset 連番（採用）** — 暦日（`all_day` 規約に整合）ごとに「当日件数 + 1」。店員・客が口頭でやり取りする番号は短い当日連番が現実的。In-store / Takeout は単一カウンタを共有。
- **global sequence（却下）** — 通し番号は日が進むと桁が増え、口頭運用に向かない。
- 採番の保存形は **`YYYYMMDD-NNN`**（例 `20260608-001`）。`orders.order_number` は**グローバル unique index** のため、素の日次連番だと翌日衝突する。日付プレフィックスでグローバル一意を担保し、**客への表示は末尾の当日連番 `NNN`**（`Order#display_number`）。

### 採番の同時実行制御

- **advisory lock（採用）** — Checkout トランザクション内で当日キー（`pg_advisory_xact_lock(YYYYMMDD)`）を取り、件数カウントと INSERT を直列化。同日キーは直列化されるが別日キーは競合しない。unique index は最後の砦として残す。
- **unique-violation retry（却下）** — 衝突時に再採番してリトライする方式。POC の規模では advisory lock の方が単純で、相乗り取りこぼしの懸念もない。

## Consequences

- `checkout` が `Order.transaction` で `Order` ＋ `order_items` を作り、`/order/complete/#{order.id}` へリダイレクトする。`session[:last_order]` は廃止。
- ルートは `get "order/complete/:id"`。bare `/order/complete` は `/order` へリダイレクト。
- `order_complete` は `Order.includes(:order_items).find_by(id:)` を引いて永続 `Order` をシリアライズするだけ。`find_or_create_by!` は撤去。
- `Order.next_order_number` は **採番した注文を作る同一トランザクション内**で呼ぶこと。`pg_advisory_xact_lock` はトランザクション終了まで保持されるため、autocommit 下で呼ぶと直列化が効かない。
- **完了画面 `/complete/:id` は未ガード**（POC タブレット運用）。`:id` は連番で列挙可能。将来 session または推測不能トークンで「自分の注文だけ」に絞る（コードコメントと イシュー #29 に備忘録）。本 ADR のスコープ外。
- 正典フローは**後会計（テーブルサービス）**: 注文 → 調理 → `Served` → 食事 → レジ会計 → `Paid`。キッチンは `OrderPlaced` 直後に着手し、会計は最後。完了画面フッターはこの後会計の案内に揃えた（先会計コピーは撤去。ADR-0006 を amend）。
- 鮮度はポーリング（Inertia 部分リロード）で担保。キッチン／レジ盤面が手動更新なしで最新化する。transport（polling / websocket / manual）は実装選択（`CONTEXT.md` の通知の項）。
