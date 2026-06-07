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
