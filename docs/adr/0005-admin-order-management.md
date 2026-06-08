---
status: accepted
---

# Admin 注文管理は閲覧専用の日次俯瞰（デザインの複数店舗・キャンセル・操作は意図的に不採用）

Admin に `/admin/orders` を追加し、**本日の全 `Order` を閲覧専用で俯瞰**できるようにする。Admin は `Order` の二軸（調理進捗 / 支払い）どちらも進めず、一覧と詳細を「見る」だけで、軸遷移は従来どおり Kitchen（調理進捗）と Cashier（支払い）が所有する。デザイン comp（`mobileOrder.pen` の「Admin - Order Management」, node `b0QQW`）は複数店舗チェーン本部向けに描かれており、本アプリ（単一レストランの POC・二軸オーダー状態）と複数箇所で食い違う。その差分を POC スコープとして意図的に切り落としたことを記録する。ADR-0003（Staff 画面のデザイン機能をスコープアウトした記録）と同じ構図。

## Considered Options

- **複数店舗（Store/Shop エンティティ）** — 却下。デザインは「全店舗の注文」前提で店舗カラム・店舗フィルタ・店舗検索を持つが、ドメインは単一レストランで `orders` に店舗カラムはなく `CONTEXT.md` にも Store 概念がない。導入すると `Order` / `Staff` / `Menu` / `table_number` を全て店舗スコープに作り直す大改修になり POC 過剰。`AdminLayout` の `店舗管理` ナビは `enabled: false` のまま据え置く。
- **Admin にオーダー操作権を与える** — 却下。`CONTEXT.md` の Admin は「どちらの軸も進めない」役割で、ADR-0002 の1人1ロール・役割境界に従う。デザインの操作列も `詳細`（閲覧）のみ。強制遷移やキャンセル等の介入が必要になったら別 ADR に委ねる。
- **キャンセル状態の導入** — 却下。デザインは統計とフィルタタブにキャンセルを持つが、ドメインにキャンセル状態はなく、本画面は閲覧専用でキャンセルを発生させるサーフェスが存在しない（常に空になる）。ADR-0001 は payment 軸の refund/void を想定しており kitchen 側 cancel は持たない。必要になればトリガーするサーフェスとセットで別 ADR。
- **単一「ステータス」列（二軸を1本に collapse）** — 却下。デザインは `受付済み / 調理中 / 完了 / キャンセル` の単一ステータスだが、ADR-0001 が明示的に「二軸を1本に潰すな」とした決定に反する。`Served + Unpaid`（レジ作業キュー）と `Served + Paid` を区別できなくなる。代わりに**調理進捗バッジ＋支払いバッジの2バッジ**で表示し、地雷ワード「完了」を「提供済み」「会計済み」に分解する。
- **対象期間・ページネーション・リアルタイム push** — いずれも POC では簡素化。一覧は**本日のみ**（`placed_at`=本日、デザイン副題「本日の注文一覧です」と整合）、**ページネーションなし**で全件描画、更新は Cashier ダッシュボードと同じ**手動更新ボタン**（`router.reload`）。日付選択・期間レポートは将来の別機能、Action Cable push は既存3画面と非整合のため不採用。

## Consequences

- ルートは `namespace :admin { resources :orders, only: %i[index show] }`。`Admin::OrdersController` は `require_login!` ＋ `authorize_roles!(:admin)` で Admin に限定する（Kitchen/Cashier はアクセス不可）。
- 一覧は本日の `Order` を全件渡し、検索（注文番号）・調理軸タブ・支払いフィルタはフロント側のクライアントフィルタで行う。サーバーは集計（本日の注文数 / 調理中 / 本日の売上 / 未会計件数）と全件を渡すだけ。
- **本日の売上**は会計済み（`paid_at` あり）の `Order` の `total` 合計とする。未会計（提供済みだが未回収）は売上に数えない。デザインの「前日比」差分は持たない。
- `AdminLayout` の `orders` ナビ項目を `enabled: true, href: '/admin/orders'` に切り替える。`店舗管理` / `売上レポート` / `ダッシュボード` / `設定` は引き続き `enabled: false`。
- `CONTEXT.md` の Admin 定義に「`/admin/orders` で本日の Order を閲覧監視（両軸・合計を見るだけで軸は進めない）」を追記済み。Store 概念なし・キャンセル状態なしも本 ADR に紐づけて明記した。
- 将来 Admin にオーダー介入（強制遷移・キャンセル・払い戻し）や複数店舗・期間レポートが必要になった場合は、本 ADR の「意図的な不採用」を覆す形で別 ADR を起こす。実装漏れではなく決定であることに注意。

## 更新（2026-06-07）

`AdminLayout` の `店舗管理`（`stores`）ナビ項目と `Store` アイコン import を削除した。複数店舗（Store）が今回スコープ対象外で確定し、`enabled: false` の無効ナビが「近日実装」を誤って示唆するのを避けるため。本文 Considered Options / Consequences の「`enabled: false` のまま据え置く」「引き続き `enabled: false`」は、`店舗管理` に関してはこの追記で上書きされる（`売上レポート` / `ダッシュボード` / `設定` は引き続き `enabled: false` で据え置き）。Store/Shop を却下するという判断自体は不変で、`CONTEXT.md` の「there is no Store/Shop concept」も有効。

## 更新（2026-06-07）— Admin ダッシュボード新設と admin ホーム移動

`/admin/dashboard`（`Admin::DashboardController#index` → `admin/Dashboard`、`require_login!` ＋ `authorize_roles!(:admin)`）を新設し、`AdminLayout` の `dashboard` ナビ項目を `enabled: true, href: '/admin/dashboard'` に反転した。直前の更新「`ダッシュボード` は引き続き `enabled: false`」は `ダッシュボード` に関して本追記で上書きされる（`売上レポート` / `設定` は引き続き `enabled: false`）。

- ダッシュボードは**各管理画面・スタッフ画面への導線（リンク）のみ**のハブとし、集計（注文数 / 調理中 / 売上 / 未会計）は**意図的に載せない**。`/admin/orders` と表示が重複するため。必要になれば後から `order_stats` を再掲する余地は残す（実装漏れではなく先送り）。
- admin のホーム（`staff_home_path`）を `admin_staffs_path` から `admin_dashboard_path` に移動した。ログイン後の着地・ログイン済み再訪・権限エラー時の戻り先がすべてダッシュボードに統一される（`sessions_controller_test` のログイン遷移先アサートも更新）。
- あわせて admin 専用の画面切り替えナビ（`StaffSurfaceNav`：キッチン / レジ / 管理者）を3つのスタッフ画面（`/kitchen` / `/cashier` / 管理者コンソール）のヘッダーに常駐させ、現在地はハイライト＋無効化、非 admin・未ログインでは非表示とした。これは ADR-0002 の既定「Admin が全画面アクセス」の UI 実装であり、バックエンドの認可（Kitchen/Cashier は admin も許可、`/admin/*` は admin 限定）は不変なので新規 ADR は起こさない。

## 更新（2026-06-08）— Admin ダッシュボードを導線ハブから統計ダッシュボードへ格上げ

デザイン comp `mobileOrder.pen` の「Admin - Dashboard」（node `DKQLL`）を起点に `/admin/dashboard` を作り直す。デザインは複数店舗チェーン本部向けの統計ダッシュボード（全店舗・アクティブ店舗 8/8・店舗別売上・店舗列・通知ベル・エクスポート・期間ピッカー・キャンセル含む単一ステータス列）として描かれているが、本アプリは単一レストランの POC・二軸オーダー状態・手動更新であり、`b0QQW`（Admin - Order Management）と同じ食い違いを持つ。デザインの数値はすべて無定義のため、ドメインに落とすにあたり定義を確定した。直前2つの更新（「集計は意図的に載せない」「前日比差分は持たない」）を本追記で上書きする。新規ルート・新規ページは作らず、既存 `Admin::DashboardController#index` と `admin/Dashboard.tsx` の**中身を置換**する（`require_login!` ＋ `authorize_roles!(:admin)` は不変）。

**上書きする決定:**

- **集計を載せる（前更新の「導線リンクのみ・集計は意図的に載せない」を上書き）** — ダッシュボードに集計を載せる。前更新が懸念した `/admin/orders` との重複は、**最近の注文を上位 N 件の閲覧専用プレビューに留め、検索・調理タブ・支払いフィルタ・操作列は持たせず `/admin/orders` に集約**することで回避する（「すべて見る」リンクで遷移）。現状の導線リンクカードは撤去し、ナビは `AdminLayout` サイドバー＋`StaffSurfaceNav` に一本化する。本画面は `AdminLayout` の children として Content（KPI / チャート / 最近の注文）だけを描画し、サイドバー/トップバーは再実装しない。
- **前日比を導入する（前更新の「前日比差分は持たない」を上書き）** — KPI に前日比を載せる。分母は**前日の同定義の全日確定値**、前日比% =（本日 − 前日）/ 前日。時間スコープは**前日比＋過去7日間の単一系列トレンド**に限定し、今週/先週の二系列比較・任意期間ピッカー・エクスポートは引き続き将来の別機能として不採用（本 ADR 当初の Considered Options「対象期間…リアルタイム push」を維持）。

**確定した数値定義（ドメイン語）:**

- **本日の売上** = 会計済み（`paid_at` あり）の `Order` の `total` 合計（当初 Consequences の定義を踏襲）。
- **注文数** = `placed_today` の全 `Order` 件数（キャンセル状態がないため除外行なし）。
- **平均注文単価** = paid売上 ÷ paid注文数（分子分母とも paid で統一）。デザインの「客単価」は採らない。`Order` に客の人数識別（`party_size` / `cover` / `customer_id`）がなく真の per-`Customer` は算出不能で、実体は per-`Order`。canonical「客」との混同を避けるため `CONTEXT.md` に「客単価 vs 平均注文単価」を追記済み。
- **KPI は 3 枚**（売上 / 注文数 / 平均注文単価）。デザインの4枚目「アクティブ店舗」は Store 概念がなく削除し、4枚目は置かない（会計待ち件数は最近の注文プレビューの支払いバッジで読める）。
- **売上推移** = paid 注文の `total` を **`paid_at` で日割り**、今日を末尾とする直近7日（実日付ラベル）、単一系列。副題は「過去7日間の売上」（「店舗別」を削除）。`groupdate` gem もチャートライブラリも追加せず、コントローラで7日分の日付配列＋`Time.zone` 範囲の日別合計＋ゼロ埋め、フロントは CSS 高さ % バーで描画する。
- **人気メニュー TOP5** = `OrderItem.joins(:order).where(orders: { placed_at: 本日 }).group(:name).sum(:quantity)` を降順、上位5件、同数は `name` 昇順。母集団は `placed_today` の全注文（需要指標のため売上の paid 基準とは別系統）。集計キーは `order_items.name`（スナップショット名、ADR-0004 整合・結合不要）。ラベルは「販売数 ○個」（「○件」は Order 件数と混同するため不採用）。
- **最近の注文プレビュー** — 列は 注文番号 / 商品 / 金額 / 調理進捗バッジ＋支払いバッジ / 受注時刻。店舗列は削除。単一ステータス列は採らず、当初 Considered Options の2バッジ方針（`orderStatus.ts` の正準ラベル：受付 / 調理中 / 提供待ち / 提供済み ＋ 未会計 / 会計済み）を再利用。地雷「完了」は「提供済み / 会計済み」に分解。金額は各行 `Order.total` の額面（支払いバッジで判別できるため注記なし）。受注時刻 = `Order.placed_at`。

**空状態・ゼロ除算:** 前日比の分母 0、平均注文単価の分母 0 は「—」表示。人気メニュー 0 行は「本日の注文はまだありません」。7日トレンド全日 0 はバー高さ 0 で描画（軸は残す）。`NaN`/`Infinity` をテンプレートに出さないガードを `order_stats`（バックエンド）側で保証する。

**削除した要素（D1/前日比方針の帰結）:** 全店舗 / 店舗別 / 店舗列 / アクティブ店舗（Store 概念なし、本 ADR Considered Options）、通知ベル（`CONTEXT.md` の予約語「通知」＝イベント伝播専用に抵触）、期間ピッカー・エクスポート（期間レポートは将来の別機能）、今週/先週の二系列、キャンセル行（cancelled 状態なし）、ハードコード `admin@example.com`（`staffs` に email 列なし）、導線リンクカード。

**不変の再確認:** Store/Shop 概念なし、キャンセル状態なし、二軸の2バッジ表示、手動更新（`router.reload` の `only:` で集計プロップ再取得）、`/admin/dashboard` は admin 限定。`売上レポート`（`reports`）ナビは統計をダッシュボード本体に集約するため `enabled: false` のまま据え置く。

**未反映:** `CONTEXT.md` の Admin 定義にある「ダッシュボード = 導線リンクのみ・統計なし」の記述は本決定で覆るが、`CONTEXT.md` は現状を記述する文書のため、実装完了時に書き換える（本追記時点では決定の記録のみ）。
