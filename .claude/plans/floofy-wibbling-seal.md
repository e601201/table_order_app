# 商品ごとの個数上限（max_quantity）対応

## Context

現状、商品の注文個数は「1〜99」の固定範囲でしかバリデーションされておらず、商品ごとの上限を設定できない（`orders_controller.rb:36` の `clamp(1, 99)`）。商品によっては在庫や提供能力に応じて上限を変えたい。

ゴール:
- 各メニュー商品が個別の `max_quantity` を持つ
- 商品詳細画面（/order/item/:id）で上限を表示し、+ボタンを上限到達時に無効化する
- カート画面（/order/cart）でも各カート行の +ボタンを上限到達時に無効化する
- 上限はカート行単位で適用（同一商品でも size/addon の組み合わせが異なれば別行扱い）

## 変更ファイル

### 1. `app/controllers/concerns/menu_catalog.rb`
全11商品それぞれに `max_quantity` フィールドを追加。商品特性に応じて個別値を設定:

| id | 商品 | max_quantity |
|----|------|---|
| 1 | Classic Burger | 10 |
| 2 | Double Cheese | 8 |
| 3 | Teriyaki Burger | 10 |
| 4 | Chicken Burger | 10 |
| 5 | Spicy Burger | 8 |
| 6 | Fish Burger | 6 |
| 7 | Crispy Fries | 15 |
| 8 | Cheese Fries | 10 |
| 9 | Iced Lemon Tea | 20 |
| 10 | Cola | 20 |
| 11 | Kids Meal | 5 |

### 2. `app/frontend/types/index.ts`
- `MenuItem` に `max_quantity: number` を追加
- `CartLine` に `max_quantity: number` を追加（カート画面でも上限判定に使うため）

### 3. `app/controllers/concerns/cart_session.rb`
- `cart_lines` (`cart_session.rb:13-38`): 戻り値ハッシュに `max_quantity: item[:max_quantity]` を追加
- `update_cart_quantity` (`cart_session.rb:79-89`): `quantity` を `1..item[:max_quantity]` にクランプ。対象アイテムを `find_menu_item` で取得して上限を適用

### 4. `app/controllers/orders_controller.rb`
- `add_to_cart` (`orders_controller.rb:31-39`): `clamp(1, 99)` を `clamp(1, item[:max_quantity])` に置換（item は `find_menu_item` で取得し、未存在なら早期 return）

### 5. `app/frontend/pages/orders/ItemDetail.tsx`
- 13行目: `quantity` の初期値はそのまま `1`
- 200行目（- ボタン）: 既存のまま `Math.max(1, q - 1)`
- 209行目（+ ボタン）: `Math.min(item.max_quantity, q + 1)` に変更
- + ボタンに `disabled={quantity >= item.max_quantity}` と `disabled:opacity-40` クラスを追加
- 197行目（Quantity ラベル行）: ラベルの右側、ステッパーの左に小さく `Max: {item.max_quantity}` を表示
  - `text-xs text-[#9E8E7E]` 程度のスタイル

### 6. `app/frontend/pages/orders/CartReview.tsx`
- `updateQuantity` (16-24行目): `if (delta > 0 && line.quantity >= line.max_quantity) return` を追加
- + ボタン (115-120行目): `disabled={item.quantity >= item.max_quantity}` と `disabled:opacity-40` クラスを追加

## 実装ポリシー

- カート行単位で上限を適用するため、カート内に同一商品の別行が複数あっても各行が独立に上限まで増やせる（ユーザー確認済み）
- バックエンド側でも必ずクランプし、フロントの無効化をすり抜けても安全にする
- 多言語対応や i18n は対象外（既存通り英語ラベル "Max: N"）

## 検証手順

1. `bin/dev` で開発サーバーを起動
2. `npm run check` で型チェックがパスすること
3. ブラウザで `/order` を開く
4. 「Fish Burger」(max=6) を選択 → 詳細画面で「Max: 6」が表示されること
5. + を 6 回押下 → 数値が 6 で停止し、+ボタンがグレーアウトすること
6. Add to Cart で追加し `/order/cart` を開く
7. カート内で同商品行の + を押下 → 6 で停止し、+ボタンがグレーアウトすること
8. 別の商品（例: Cola, max=20）でも上限が個別に効くことを確認
9. devtools などで cart 更新リクエストの quantity に上限超過値を直接送り、サーバー側でクランプされることを確認（`update_cart_quantity` / `add_to_cart!`）
