require "test_helper"

# キッチン盤面。注文を調理進捗（axis 1）で4レーンに分けて返す。終端状態は Served（提供済み）。
# 用語集 CONTEXT.md:91-93 / ADR-0001。props キーは enum シンボルと一致させる。
class KitchenControllerTest < ActionDispatch::IntegrationTest
  test "盤面は調理進捗の4レーン（pending/in_progress/ready/served）を返す" do
    login_as(:kitchen_staff)

    get kitchen_path
    assert_response :success
    assert_inertia_component "kitchen/Dashboard"
    assert_equal %w[pending in_progress ready served].sort,
                 inertia.props[:ordersByStatus].keys.map(&:to_s).sort
  end

  test "提供済みの注文は served レーンに入る" do
    login_as(:kitchen_staff)
    order = create_order(status: :served)

    get kitchen_path
    served_ids = inertia.props[:ordersByStatus][:served].map { |o| o[:id] }
    assert_includes served_ids, order.id
  end

  test "調理進捗ごとに正しいレーンへ振り分ける" do
    login_as(:kitchen_staff)
    pending = create_order(status: :pending)
    served = create_order(status: :served)

    get kitchen_path
    grouped = inertia.props[:ordersByStatus]
    assert_includes grouped[:pending].map { |o| o[:id] }, pending.id
    assert_not_includes grouped[:served].map { |o| o[:id] }, pending.id
    assert_includes grouped[:served].map { |o| o[:id] }, served.id
  end

  private

  def login_as(fixture_name)
    post login_path, params: { login_id: staffs(fixture_name).login_id, password: "password" }
  end

  def create_order(status:)
    order = Order.create!(
      order_number: "#K-#{SecureRandom.hex(3)}",
      order_type: :in_store,
      table_number: 5,
      status: status,
      subtotal: 1000,
      tax: 0,
      total: 1000,
      placed_at: Time.zone.now
    )
    order.order_items.create!(
      menu_item_id: 1, name: "テスト商品", quantity: 1,
      unit_price: 1000, line_total: 1000, addons: []
    )
    order
  end
end
