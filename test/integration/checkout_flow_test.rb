require "test_helper"

# 注文確定（Checkout）で Cart の Line が Order / OrderItem に永続化される。
# OrderItem は name / unit_price / size_label / addons をスナップショットするため、
# 元の MenuItem を物理削除しても履歴は壊れない（ADR-0003 と対称・ADR-0004）。
class CheckoutFlowTest < ActionDispatch::IntegrationTest
  setup do
    @item = menu_items(:classic_burger)
  end

  test "checkout で Order と OrderItem がスナップショット付きで永続化される" do
    post "/order/cart", params: { item_id: @item.id, size_id: "large", addon_ids: [ "cheese" ], quantity: 2 }
    post "/order/checkout"

    assert_difference -> { Order.count } => 1, -> { OrderItem.count } => 1 do
      get "/order/complete"
    end

    item = OrderItem.last
    assert_equal @item.id, item.menu_item_id
    assert_equal "クラシックバーガー", item.name
    assert_equal "ラージ", item.size_label
    assert_equal 730, item.unit_price # 580 + 100(large) + 50(cheese)
    assert_equal 2, item.quantity
  end

  test "MenuItem を物理削除しても過去の OrderItem スナップショットは壊れない" do
    post "/order/cart", params: { item_id: @item.id, size_id: "regular", addon_ids: [], quantity: 1 }
    post "/order/checkout"
    get "/order/complete"
    item = OrderItem.last

    assert_nothing_raised { @item.destroy }
    assert_equal "クラシックバーガー", item.reload.name
  end
end
