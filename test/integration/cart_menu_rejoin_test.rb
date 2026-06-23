require "test_helper"

# ADR-0004: カートは menu-is-truth でライブ再ジョインする。
# 価格編集は進行中カートに反映され、構成（size / addon）が消滅した line は
# 別構成に化けさせず drop する。
class CartMenuRejoinTest < ActionDispatch::IntegrationTest
  setup do
    # classic_burger: base_price 580 / size regular(0)・large(100) / addon cheese(50)
    @item = menu_items(:classic_burger)
  end

  def add_line(size_id:, addon_ids: [], quantity: 1)
    post "/order/cart", params: {
      item_id: @item.id, size_id: size_id, addon_ids: addon_ids, quantity: quantity
    }
  end

  def cart_items
    get "/order/cart"
    inertia.props[:cart_items]
  end

  test "menu-is-truth: base_price の編集が進行中カートに反映される" do
    add_line(size_id: "regular")
    @item.update!(base_price: 1000)
    assert_equal 1000, cart_items.first[:unit_price]
  end

  test "size が残っていれば line は維持され価格に extra が乗る" do
    add_line(size_id: "large")
    line = cart_items.first
    assert_equal "large", line[:size_id]
    assert_equal 680, line[:unit_price]
  end

  test "選択した size が削除されると line は先頭 size に化けず drop される" do
    add_line(size_id: "large", quantity: 2)
    @item.update!(sizes: [ { "id" => "regular", "label" => "レギュラー", "extra" => 0 } ])
    assert_empty cart_items
  end

  test "選択した addon が残っていれば line は維持され価格に extra が乗る" do
    add_line(size_id: "regular", addon_ids: [ "cheese" ])
    line = cart_items.first
    assert_equal 630, line[:unit_price] # 580 + 0(regular) + 50(cheese)
    assert_equal [ "cheese" ], line[:addons].map { |a| a[:id] }
  end

  test "選択した addon が削除されると line は drop される" do
    add_line(size_id: "regular", addon_ids: [ "cheese" ])
    @item.update!(addons: [])
    assert_empty cart_items
  end

  test "MenuItem が物理削除されると line は黙って drop される" do
    add_line(size_id: "regular")
    @item.destroy
    assert_empty cart_items
  end

  # ADR-0011: 売り切れ・販売停止は item も構成も生きているので drop せず、
  # sellable:false で確定前に警告する（物理削除や構成消滅の silent drop とは扱いが違う）。
  test "カート投入後に売り切れた line は drop されず sellable:false で警告される" do
    add_line(size_id: "regular")
    @item.update!(stock: 0)
    line = cart_items.first
    assert_equal @item.id, line[:item_id], "drop されない"
    assert_equal false, line[:sellable]
  end

  test "販売停止になった line も drop されず sellable:false" do
    add_line(size_id: "regular")
    @item.update!(suspended: true)
    assert_equal false, cart_items.first[:sellable]
  end

  test "販売可能な line は sellable:true" do
    add_line(size_id: "regular")
    assert_equal true, cart_items.first[:sellable]
  end
end
