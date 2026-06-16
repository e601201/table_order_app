require "test_helper"

# 顧客画面（/order）は DB の MenuItem を真実として表示する（ADR-0004）。
class CustomerMenuTest < ActionDispatch::IntegrationTest
  test "/order は DB の MenuItem を menu_items prop で渡す" do
    get "/order", params: { order_type: "in_store", table_number: 5 }
    items = inertia.props[:menu_items]
    names = items.map { |i| i[:name] }
    assert_includes names, "クラシックバーガー"
    assert_includes names, "コーラ"
  end

  test "menu_items の各要素は image URL（文字列）と sizes / addons を持つ" do
    get "/order", params: { order_type: "in_store", table_number: 5 }
    burger = inertia.props[:menu_items].find { |i| i[:name] == "クラシックバーガー" }
    assert_kind_of String, burger[:image]
    assert burger[:image].present?
    assert_equal "large", burger[:sizes].find { |s| s[:label] == "ラージ" }[:id]
    assert_equal 50, burger[:addons].first[:extra]
  end

  test "商品詳細は detail variant の画像を渡す" do
    item = menu_items(:classic_burger)
    get "/order/item/#{item.id}"
    assert_equal "クラシックバーガー", inertia.props[:item][:name]
    assert inertia.props[:item][:image].present?
  end

  test "存在しない商品詳細は /order へリダイレクト" do
    get "/order/item/999999"
    assert_redirected_to "/order"
  end
end
