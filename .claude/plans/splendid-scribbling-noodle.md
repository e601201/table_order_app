# モバイルオーダー実装計画

## Context

現状、`/order` 配下の 4 ページ（Home / ItemDetail / CartReview / OrderComplete）は揃っており UI も実装済みだが、すべてが各ページ内のハードコードされたモックデータで動いている。ItemDetail で「カートに追加」してもどこにも保存されず、CartReview の中身は固定で、OrderComplete の表示もハードコード。ページ間でカート状態がまったく共有されていない。

本対応では、Rails セッションを唯一の真実とする「動くモバイルオーダーフロー」を POC として通す。マイグレーションや AR モデルは作らない。メニューマスタはコントローラ内の Ruby 定数として持つ。

確定済みの方針（ユーザー回答）:
- カート永続化: **Rails セッション** (`session[:cart]`)
- メニューデータ: **コントローラ内の定数モック**
- 「カートに追加」後の遷移先: **/order のまま**（直近 commit 59ae640 を尊重し、要件文の `/order/cart` 遷移は採用しない）

---

## 全体フロー

1. `/order` … `MENU_ITEMS` から一覧表示・カート個数バッジはセッションから算出
2. `/order/item/:id` … `MENU_ITEMS` から該当商品を取得、サイズ/アドオン/数量を選んで `POST /order/cart` → `/order` にリダイレクト
3. `/order/cart` … セッションのカートを表示。数量変更は `PATCH`、削除は `DELETE`、確認モーダルから `POST /order/checkout` → セッションのカートを `session[:last_order]` へ移しクリア → `/order/complete`
4. `/order/complete` … `session.delete(:last_order)` で取り出して表示（1 回きり。リロードや再訪は `/order` にリダイレクト）

---

## 1. メニューマスタ（新規）

新規ファイル: `app/controllers/concerns/menu_catalog.rb`

`OrdersController` に include するモジュール。`MENU_ITEMS` 定数（id をキーにしたハッシュ配列）と `find_menu_item(id)` を提供する。Home.tsx / ItemDetail.tsx / CartReview.tsx 各所のモックを単一のソースに集約する。

各メニュー項目の構造:

```ruby
{
  id: 1,
  category: "burgers",          # "burgers" | "sides" | "drinks" | "kids"
  name: "Classic Burger",
  description: "...",
  base_price: 580,
  calories: 620,
  image: "https://...",
  recommended: true,
  sizes: [
    { id: "regular", label: "Regular", extra: 0 },
    { id: "large",   label: "Large",   extra: 100 },
    { id: "set",     label: "Set Meal", extra: 250 }
  ],
  addons: [
    { id: "cheese", label: "Extra Cheese", extra: 50 },
    { id: "patty",  label: "Extra Patty",  extra: 200 },
    { id: "bacon",  label: "Bacon",        extra: 100 },
    { id: "egg",    label: "Egg",          extra: 80 }
  ]
}
```

現在 `Home.tsx` / `ItemDetail.tsx` / `CartReview.tsx` にバラバラに存在するモック商品を、ここに統合する（カテゴリ別に 8〜10 件程度。サイドや飲み物にはサイズのみ／アドオンなしも許容）。

---

## 2. カートヘルパー（新規）

新規ファイル: `app/controllers/concerns/cart_session.rb`

`OrdersController` に include。`session[:cart]` を配列として扱い、以下を提供:

- `current_cart` … `session[:cart] ||= []`
- `cart_lines` … セッションの生データに `MENU_ITEMS` を結合し、view 用のハッシュ配列に整形（後述「カートライン形」）
- `cart_totals(lines)` … `{ subtotal:, tax:, total:, item_count: }` を返す。`TAX_RATE = 0.10`
- `add_to_cart(item_id:, size_id:, addon_ids:, quantity:)` … 同一の `item_id+size_id+addon_ids` 組合せがあれば数量加算、なければ新規 line（`line_id = SecureRandom.hex(4)`）を append
- `update_cart_quantity(line_id, quantity)` / `remove_cart_line(line_id)` / `clear_cart`

セッション保存形（最小限）:
```ruby
{ line_id:, item_id:, size_id:, addon_ids: [], quantity: }
```

カートライン形（フロントへ渡す形）:
```ruby
{
  line_id:,
  item_id:,
  name:,
  customization: "Large · Extra Cheese, Bacon", # size + addons を結合
  unit_price:,    # base_price + size.extra + sum(addon.extra)
  quantity:,
  line_total:,    # unit_price * quantity
  image:
}
```

---

## 3. ルート追加

修正: `config/routes.rb` (L24-28 付近)

`get "order/cart"` の後に追加:

```ruby
post   "order/cart",          to: "orders#add_to_cart"
patch  "order/cart/:line_id", to: "orders#update_cart_item"
delete "order/cart/:line_id", to: "orders#remove_cart_item"
post   "order/checkout",      to: "orders#checkout"
```

`order/complete` は GET のまま（`session[:last_order]` があればそれを表示、なければ `/order` にリダイレクト）。

---

## 4. OrdersController 改修

修正: `app/controllers/orders_controller.rb`

```ruby
class OrdersController < ApplicationController
  include MenuCatalog
  include CartSession

  def home
    render inertia: "orders/Home", props: {
      table_number: table_number,
      restaurant_name: "Burger House",
      menu_items: MENU_ITEMS,            # 全件渡す（POC なのでフィルタは FE 側）
      cart_count: cart_lines.sum { _1[:quantity] }
    }
  end

  def item_detail
    item = find_menu_item(params[:id])
    return redirect_to("/order") unless item
    render inertia: "orders/ItemDetail", props: { item: item }
  end

  def cart_review
    lines   = cart_lines
    totals  = cart_totals(lines)
    render inertia: "orders/CartReview", props: {
      table_number: table_number,
      cart_items: lines,
      totals: totals
    }
  end

  def add_to_cart
    add_to_cart!(
      item_id:   params[:item_id].to_i,
      size_id:   params[:size_id],
      addon_ids: Array(params[:addon_ids]),
      quantity:  params[:quantity].to_i.clamp(1, 99)
    )
    redirect_to "/order"   # ← commit 59ae640 を踏襲
  end

  def update_cart_item
    update_cart_quantity(params[:line_id], params[:quantity].to_i)
    redirect_to "/order/cart"
  end

  def remove_cart_item
    remove_cart_line(params[:line_id])
    redirect_to "/order/cart"
  end

  def checkout
    lines  = cart_lines
    return redirect_to("/order/cart") if lines.empty?

    session[:last_order] = {
      order_number: "#A-#{rand(1000..9999)}",
      table_number: table_number,
      items:        lines,
      totals:       cart_totals(lines),
      placed_at:    Time.current.iso8601
    }
    clear_cart
    redirect_to "/order/complete"
  end

  def order_complete
    last = session.delete(:last_order)   # 表示は 1 回きり。リロード/再訪は /order へ
    return redirect_to("/order") unless last
    render inertia: "orders/OrderComplete", props: { order: last }
  end

  private

  def table_number
    params[:table_number]&.to_i || session[:table_number] || 5
  end
end
```

(`add_to_cart!` のように helper 側はメソッド名衝突を避けて `!` を付ける、もしくは `add_line` などにする。命名は実装時調整)

---

## 5. フロントエンド改修

すべてのページから自前モックを削除し、props を信頼する。

### `app/frontend/pages/orders/Home.tsx`
- props を `{ table_number, restaurant_name, menu_items, cart_count }` に拡張
- ローカルの `menuItems` / `recommendedItems` 定数を削除し、`menu_items.filter(i => i.category === activeCategory)` で表示
- `recommendedItems = menu_items.filter(i => i.recommended)`
- カートバッジ件数は `cart_count` を使用（ローカル `cartCount` state 撤廃）
- メニュータイル全体を `<Link href={\`/order/item/\${item.id}\`}>` でラップ

### `app/frontend/pages/orders/ItemDetail.tsx`
- props を必須化: `{ item: MenuItem }`
- ローカルの `currentItem` フォールバックを削除し、`item.sizes` / `item.addons` を使う
- 「Add to Cart」を `Link` ではなく `router.post` に変更:
  ```tsx
  router.post('/order/cart', {
    item_id: item.id,
    size_id: selectedSize,
    addon_ids: selectedAddons,
    quantity,
  })
  ```
- リダイレクトはサーバ側で `/order` に行うので Inertia がそのまま遷移する

### `app/frontend/pages/orders/CartReview.tsx`
- props を `{ table_number, cart_items, totals }` に変更し、`initialCartItems` を全削除
- `cart_items` が空のときは empty state を表示（既存の disabled ボタン分岐は活用）
- 数量 +/- は `router.patch(\`/order/cart/\${line.line_id}\`, { quantity: newQty }, { preserveScroll: true })`
- ゴミ箱は `router.delete(\`/order/cart/\${line.line_id}\`, { preserveScroll: true })`
- 確認モーダルの「Place Order」を `router.post('/order/checkout')` に変更（既存の `router.visit('/order/complete')` を置換）
- subtotal / tax / total の計算を撤廃し `totals` をそのまま表示

### `app/frontend/pages/orders/OrderComplete.tsx`
- props を `{ order: { order_number, table_number, items[], totals, placed_at } }` に変更
- 既存の `OrderItem` モックを削除し `order.items` を表示
- 数量バッジ・カスタマイズ表示・合計セクションを `order.items` / `order.totals` ベースで再構成

### `app/frontend/types/index.ts`
共有型を追加（重複定義回避）:
```ts
export type MenuItem = { id: number; category: string; name: string; description: string; base_price: number; calories: number; image: string; recommended: boolean; sizes: SizeOption[]; addons: AddonOption[] }
export type SizeOption = { id: string; label: string; extra: number }
export type AddonOption = { id: string; label: string; extra: number }
export type CartLine = { line_id: string; item_id: number; name: string; customization: string; unit_price: number; quantity: number; image: string }
export type CartTotals = { subtotal: number; tax: number; total: number; item_count: number }
```

---

## 修正・追加ファイル一覧

**追加**
- `app/controllers/concerns/menu_catalog.rb`
- `app/controllers/concerns/cart_session.rb`

**修正**
- `config/routes.rb`
- `app/controllers/orders_controller.rb`
- `app/frontend/pages/orders/Home.tsx`
- `app/frontend/pages/orders/ItemDetail.tsx`
- `app/frontend/pages/orders/CartReview.tsx`
- `app/frontend/pages/orders/OrderComplete.tsx`
- `app/frontend/types/index.ts`

---

## 検証手順

1. `bin/dev` でサーバ起動
2. `npm run check` で TS 型エラーがないこと
3. ブラウザで `/order` を開く
   - メニューが表示され、カートバッジが 0
4. 任意のメニュータイルをタップ → `/order/item/:id` で正しい商品が表示
5. サイズ/アドオン/数量を選び「Add to Cart」 → `/order` に戻り、バッジが増えていること
6. 別の商品も追加 → 同一構成は数量加算、別構成は別 line になること
7. フローティングカートボタン → `/order/cart` でカート内容と合計が一致
8. 数量変更/削除でセッションが更新される（リロードしても保持）
9. 「Confirm Order」→ モーダル → 「Place Order」 → `/order/complete`
10. OrderComplete に注文番号・明細・合計が表示され、`/order` のカートバッジが 0 に戻っていること
11. `bin/rubocop` を通す
