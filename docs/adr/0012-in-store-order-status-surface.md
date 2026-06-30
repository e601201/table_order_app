---
status: accepted
---

# In-store の「注文状況」は session 紐付け・調理軸のみの来店中ライブ surface

店内客（未認証）に、当日このタブレットの `session` が出した `Order` 群の**調理進捗だけ**をライブ表示する `注文状況` 画面（`/order/status`）を追加する。`session` 紐付け（`:id` URL でも `table_number` でもない）、**`In-store` 限定**、`usePoll` 部分リロードで更新。会計軸（`Paid` / `Closed`）は一切描かない — これにより、ADR-0010 が「In-store に履歴 surface が無いから walkout の『キャンセル』は表示され得ない」とした不変条件の**根拠を載せ替える**: 嘘が出ないのは surface が無いからではなく、status surface が会計軸を描かず、提供前クローズを中立文言で表すから。

背景: 店内客は OrderComplete（注文確定の静的レシート、ADR-0006 / ADR-0007）以降、自分の料理の進捗を知る術が無かった（Takeout は ADR-0008 の `注文履歴` ＋ `OrderReady` の LINE 通知で解決済み）。店内客は identity を持たず（CONTEXT.md: `Customer` / `Table number`）、識別子はタブレットの `session` だけ。一方 ADR-0010 は「In-store に履歴 surface が存在しない」ことを、walkout の「キャンセル」表示が嘘にならない根拠に使っていた — In-store に新 surface を足すと、この前提に正面からぶつかる。

## Considered Options

### 表示する軸
- **調理軸のみ（採用）** — 店内客の関心は「料理は今どこ」。会計は後会計でレジでまとめて払うため、客タブレットに `未会計 / 会計済み` を出す意味が薄く、むしろ「ここで払うのか」という誤解を生む。会計軸（特に `Closed`）を描かないこと自体が、walkout の「キャンセル」を構造的に出さない仕掛けになる。ETA（分数）も ADR-0006 で禁止済み。
- **調理軸＋会計軸（却下）** — walkout（`Served + Closed`）に「キャンセル」を出すと、ADR-0010 / CONTEXT.md の言葉の嘘を In-store 客の目に持ち込む。

### 注文の紐付け
- **`session` 紐付け・複数（採用）** — タブレット `session` が実質的な「この客の入れ物」。Checkout 時に `order.id` を session に積み、その session が出した当日の `Order` 群だけを描く。`:id` 列挙負債（イシュー #29 / ADR-0007 の残存負債）を**ライブ監視に格上げせずに済む**。店内のラウンド注文（追加注文）が自然に複数並ぶ。新セッション開始（welcome 入口の `order_type` param）で `clear_cart` と並んで placed-order リストもクリアする — さもないと席使い回しで前の客の注文が漏れる。
- **URL `:id` で単一注文（却下）** — OrderComplete と同方式で実装は最小だが、列挙可能負債をライブ進捗フィードに広げ、他テーブルの注文を id 推測で覗ける穴を悪化させる。ラウンド複数注文も見せられない。
- **`table_number` で当日集約（却下）** — 席をパーティ単位で扱えるが、`table_number` は自由ラベル（CONTEXT.md: `Table number`）で席の使い回し時に前の客の注文が混ざる。`session` で絞らない限り privacy 漏れ。

### 打ち切られた注文の表示
- **提供前クローズだけ中立文言（採用）** — `walkout` は必ず `Served` で凍結（ADR-0010）→ 調理軸表示は「提供済み」のままで真実、特別扱い不要。`out_of_stock` / 早期 `customer_request` は提供前で凍結 → 調理ラベルのままだと「来ないのに来る顔」で逆向きに嘘をつくため、中立文言「ご用意できませんでした」に差し替える。`out_of_stock` の発見はどのみち口頭でレジへ伝わり（ADR-0010）、客への説明も対面で起きる。
- **Closed は一律ドロップ（却下）** — 語彙漏れは無いが、`out_of_stock` の客の注文が無言で消え「あれ？」となる。
- **理由別の正直コピー（却下）** — 最も親切だが `closure_reason` を客へ送る必要が出る（`注文履歴` も送っていない）。In-store では理由説明が対面で起きるため割に合わない。
- **既存「キャンセル」バッジ流用（却下）** — 最小実装だが walkout で嘘 → CONTEXT.md / ADR-0010 の不変条件を明確に破る。

### OrderComplete との関係
- **`/order/status` を新設・OrderComplete 現状維持（採用）** — OrderComplete は「Checkout is done」の単一注文確定レシート（ADR-0006 / ADR-0007）のまま。新 `/order/status` は session 紐付け複数注文・ライブ。動線は OrderComplete の in_store フッター「注文状況を見る」（takeout の「注文履歴を見る」と対称）＋ `/order` ヘッダーの常設入口。
- **OrderComplete をライブ化（却下）** — `:id` 単数・確定レシートの意味を変質させ、複数ラウンドと噛み合わない。
- **Checkout 後に直接 status（却下）** — 確定レシートの再表示性（ADR-0007）を失う。

### 更新方式
- **`usePoll` 部分リロード（採用）** — 既存規約（kitchen `usePoll(7000)` / cashier `setInterval` ＋ `router.reload`）に従う。`config/cable.yml` はあるが `app/channels/` は空で Action Cable は未導入。「通知 = イベント伝播、transport は実装選択」（CONTEXT.md: 通知）とも整合。

## Consequences
- `session[:placed_order_ids]`（配列）を追加。Checkout（`in_store` のみ）で `order.id` を append、welcome 入口で `clear_cart` と同時にクリア。
- ルートは `GET /order/status`（`:id` を取らない）。session の id 群を読み、`in_store` ＋本日でフィルタ。URL からの列挙は不可。
- **新 canonical 用語 `注文状況`**（CONTEXT.md）と、対の `注文履歴`（従来 Takeout 限定だが未定義だったものを明文化）。
- **ADR-0010 Consequence #5 を改訂**: walkout の「キャンセル」が嘘にならない根拠を「In-store に履歴 surface が無い」→「In-store の唯一の surface（`注文状況`）が会計軸を描かず、提供前クローズを中立文言で表す」に載せ替え。ADR-0010 自体は accepted のまま（状態機械は不変）、本 ADR が理由を上書きする。
- 提供済み注文は来店中ずっと「提供済み」で残る（畳む / secondary 表示可）。会計軸は出さないので「お会計はお食事のあとでレジへ」は静的リマインダ文言として添える程度に留める。
- Takeout は従来どおり `/order/history`（`注文履歴`）＋ `OrderReady` LINE 通知。`注文状況` は `In-store` 限定で takeout には出さない。
- `:id` 列挙負債（イシュー #29）は OrderComplete 側に依然残る — 本 ADR はそれを**広げない**ことを選んだに留まり、解消はしない。

## 参照
- ADR-0006（注文完了に調理時間を出さない）/ ADR-0007（Checkout で Order を永続・完了画面は再表示可）/ ADR-0008（Takeout の LINE identity・注文履歴）/ ADR-0010（打ち切り・walkout の「キャンセル」表示根拠 ← 本 ADR が改訂）
- CONTEXT.md: `注文状況` / `注文履歴` / `Closed` / `Served` / `Customer` / `Table number` / 通知
- イシュー #29（in_store の `:id` 列挙負債）
