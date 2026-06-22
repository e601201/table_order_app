---
status: accepted
---

# DB 化された Menu（Admin 編集・物理削除・jsonb・ActiveStorage バリアント）

静的定数 `MENU_ITEMS`（`MenuCatalog` concern）を `menu_items` テーブルに移し、Admin が管理画面から CRUD できるようにする。`sizes` / `addons` は item 内に閉じた jsonb 列、`category` は固定値を string + inclusion バリデーション（`CATEGORIES` 定数）で持つ。画像は ActiveStorage（ローカルディスク + Kamal 永続ボリューム）に保存し、`image_processing` で生成した variant を顧客画面へ配信する。ADR-0002 が「DB 化は別 ADR に委ねる」と先送りした決定をここで確定する。

## Considered Options

- **sizes / addons を正規化テーブルにする** — 却下。POC では item 内に閉じた値オブジェクトで十分で、現行の定数構造（item にネストした配列）とも一致し移行が最小。共有 size/addon エンティティや category テーブル化は将来スコープ。
- **論理削除 / availability（売り切れ）ライフサイクル** — 却下。`order_items` が `name` / `unit_price` / `size_label` / `addons` を全てスナップショット済みのため、`MenuItem` を物理削除しても注文履歴は壊れない。これは ADR-0003（Staff 物理削除）と対称の論理。「今日だけ売り切れ」を毎回再入力せず扱いたいなら別 ADR に委ねる（→ ADR-0011 で在庫・売り切れ・補充として解決）。
- **`order_items.menu_item_id` を FK 化する** — 却下。FK にすると物理削除がブロックされるか on_delete nullify が必要になる。履歴表示は `menu_item_id` を参照せずスナップショットだけで描画するため、plain integer の「由来メモ」で足りる。
- **`category` を Rails enum（integer）にする** — 却下。`Order` の `status` / `order_type` は enum だが、category は状態機械ではなく、顧客画面が文字列 slug（`"burgers"` 等）でフィルタしている。string + inclusion が素直で frontend も無変更。
- **画像を URL 文字列のまま持つ** — 却下。実店舗ではファイルアップロードが自然で、Kamal 側に永続ボリューム（`table_order_app_storage:/rails/storage`）が既にあり追加インフラがほぼ不要なため ActiveStorage を採用。

## Consequences

- カートは従来どおりライブ再ジョイン（menu-is-truth）。Admin の編集は進行中のセッションカートに即時反映され、価格は「注文時点の menu 価格」が真実となる。削除された商品を含む line は黙って drop される（既知の制約）。
- `cart_session.rb` の size フォールバック（選択された size が消えると先頭 size に化けて価格まで変わる挙動）は修正する。構成（size / addon）が消滅した line は、別構成に化けさせず drop する。
- size / addon の jsonb 内 `id` は安定識別子として扱い、Admin 編集時に再生成しない。`add_to_cart!` は `(item_id, size_id, sorted addon_ids)` で照合し `order_items` も `size_id` をスナップするため、id を再生成すると進行中カートが drop してしまう。新規行のみ slug / 連番で採番する。
- 「メニュー ≥ 1 件」不変条件は持たない。ADR-0003 の「管理者 ≥ 1」と異なり、メニューが一時的に空でもロックアウトや破綻は起きない。
- シードは既存 11 品の id 1〜11 を明示指定し Postgres の sequence をリセットする。これにより進行中のセッションカート（`item_id`）と過去の `order_items.menu_item_id`（由来メモ）の参照が真実のまま保たれる。同梱画像（`db/seeds/images/`）を attach する。
- 実装が入った時点で `CONTEXT.md` の `Menu` / `Admin` 定義（「静的定数」「future capability」の記述）と ADR-0002 の Consequences（「Menu は静的定数のまま」）を、本 ADR に解決済みとして更新する。
