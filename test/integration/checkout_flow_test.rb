require "test_helper"

# 注文確定（Checkout = `OrderPlaced` 書き込み境界。ADR-0007）で Cart の Line が
# Order / OrderItem に永続化される。永続化は POST /order/checkout の時点で起き、
# 完了画面（GET /order/complete/:id）は永続 Order を読むだけ（副作用なし）。
# OrderItem は name / unit_price / size_label / addons をスナップショットするため、
# 元の MenuItem を物理削除しても履歴は壊れない（ADR-0003 と対称・ADR-0004）。
class CheckoutFlowTest < ActionDispatch::IntegrationTest
  setup do
    @item = menu_items(:classic_burger)
    # In-store の入口でテーブル番号を確定させる（デモ入口で必須。イシュー #41）。
    # takeout テストは後続の get で order_type を上書きし、table_number は nil 扱いになる。
    get "/order", params: { order_type: "in_store", table_number: 5 }
  end

  test "checkout で Order と OrderItem がスナップショット付きで永続化され complete/:id へ遷移する" do
    post "/order/cart", params: { item_id: @item.id, size_id: "large", addon_ids: [ "cheese" ], quantity: 2 }

    assert_difference -> { Order.count } => 1, -> { OrderItem.count } => 1 do
      post "/order/checkout"
    end

    order = Order.last
    assert_redirected_to "/order/complete/#{order.id}"

    item = order.order_items.first
    assert_equal @item.id, item.menu_item_id
    assert_equal "クラシックバーガー", item.name
    assert_equal "large", item.size_id
    assert_equal "ラージ", item.size_label
    assert_equal [ { "id" => "cheese", "label" => "チーズ追加", "extra" => 50 } ], item.addons
    assert_equal 730, item.unit_price # 580 + 100(large) + 50(cheese)
    assert_equal 2, item.quantity
    assert_equal 1460, item.line_total
  end

  # --- 在庫減算（ADR-0011）: 減算は Checkout の瞬間だけ。カートは予約しない。 ---

  test "checkout で追跡品の在庫が注文数量分だけ減る" do
    @item.update!(stock: 10)
    post "/order/cart", params: { item_id: @item.id, size_id: "regular", addon_ids: [], quantity: 3 }
    post "/order/checkout"

    assert_equal 7, @item.reload.stock
  end

  test "checkout で無制限(nil)在庫は減算されない" do
    @item.update!(stock: nil)
    post "/order/cart", params: { item_id: @item.id, size_id: "regular", addon_ids: [], quantity: 2 }
    post "/order/checkout"

    assert_nil @item.reload.stock
  end

  test "takeout のカートを checkout すると LineAccount に紐づき table_number が nil の Order が作られる" do
    # takeout は LINE ログイン必須（ADR-0008）。LIFF 導線と同じく order_type をセッションに焼く
    line_login_as(line_accounts(:taro))
    get "/order", params: { order_type: "takeout" }
    post "/order/cart", params: { item_id: @item.id, size_id: "regular", addon_ids: [], quantity: 1 }

    assert_difference -> { Order.count } => 1 do
      post "/order/checkout"
    end

    order = Order.last
    assert_equal "takeout", order.order_type
    assert_nil order.table_number # controller の takeout→nil 整合が absence バリデーションを満たす
    assert_equal line_accounts(:taro), order.line_account # 持ち主識別（#29 の Takeout 側解消）
    assert_redirected_to "/order/complete/#{order.id}"
  end

  test "完了画面に到達しなくても Order は永続化され、当日のキッチンキューに現れる" do
    post "/order/cart", params: { item_id: @item.id, size_id: "regular", addon_ids: [], quantity: 1 }
    post "/order/checkout"
    order = Order.last

    # 完了画面を一切開かずとも、本日のキッチンキュー（placed_at のある行）に現れる
    assert_includes Order.where(placed_at: Time.zone.today.all_day), order
    assert_equal "pending", order.status
  end

  test "order_number は当日連番で衝突せず、表示は当日連番になる" do
    post "/order/cart", params: { item_id: @item.id, size_id: "regular", addon_ids: [], quantity: 1 }
    post "/order/checkout"
    first = Order.last

    post "/order/cart", params: { item_id: @item.id, size_id: "regular", addon_ids: [], quantity: 1 }
    post "/order/checkout"
    second = Order.last

    assert_not_equal first.order_number, second.order_number
    assert_match(/\A\d{8}-\d{3}\z/, first.order_number)
    assert_equal first.order_number.split("-").last.to_i + 1,
                 second.order_number.split("-").last.to_i
  end

  test "完了画面は :id から永続 Order を読んで描画する（表示番号は当日連番）" do
    post "/order/cart", params: { item_id: @item.id, size_id: "regular", addon_ids: [], quantity: 1 }
    post "/order/checkout"
    order = Order.last

    get "/order/complete/#{order.id}"
    assert_response :success
    assert_inertia_component "orders/OrderComplete"
    assert_equal order.display_number, inertia.props[:order][:order_number]
    assert_equal 1, inertia.props[:order][:items].length
  end

  test "存在しない id の完了画面は /order にリダイレクトする" do
    get "/order/complete/999999"
    assert_redirected_to "/order"
  end

  test "bare /order/complete は /order にリダイレクトする" do
    get "/order/complete"
    assert_redirected_to "/order"
  end

  test "MenuItem を物理削除しても過去の OrderItem スナップショットは壊れない" do
    post "/order/cart", params: { item_id: @item.id, size_id: "regular", addon_ids: [], quantity: 1 }
    post "/order/checkout"
    item = OrderItem.last

    assert_nothing_raised { @item.destroy }
    assert_equal "クラシックバーガー", item.reload.name
  end
end
