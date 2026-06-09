require "test_helper"

# レジ（会計）導線。会計の前提は調理進捗が Served（提供済み）に達していること（ADR-0001 / ADR-0006）。
# 未提供（Ready 以前）の注文は会計確認・会計処理ともにレジ盤面へ差し戻す。
class CashierControllerTest < ActionDispatch::IntegrationTest
  # --- 会計確認（payment_confirm）の Served ガード ---

  test "提供済みかつ未会計の注文は会計確認画面を表示できる" do
    login_as(:cashier_staff)
    order = create_order(status: :served, paid: false)

    get cashier_payment_path(order)
    assert_response :success
    assert_inertia_component "cashier/PaymentConfirm"
    assert_equal order.id, inertia.props[:order][:id]
  end

  test "未提供（Ready 以前）の注文は会計確認できずレジ盤面へ戻す" do
    login_as(:cashier_staff)
    order = create_order(status: :ready, paid: false)

    get cashier_payment_path(order)
    assert_redirected_to cashier_path
  end

  test "会計済みの注文は会計確認から会計完了画面へ送る" do
    login_as(:cashier_staff)
    order = create_order(status: :served, paid: true)

    get cashier_payment_path(order)
    assert_redirected_to cashier_payment_complete_path(order)
  end

  # --- 会計処理（process_payment）の Served ガード ---

  test "提供済みかつ未会計の注文は会計処理で Paid になり会計完了へ進む" do
    login_as(:cashier_staff)
    order = create_order(status: :served, paid: false)

    post cashier_payment_path(order), params: { payment_method: "cash" }
    assert_redirected_to cashier_payment_complete_path(order)
    assert order.reload.paid?
  end

  test "未提供の注文は会計処理されずレジ盤面へ戻す" do
    login_as(:cashier_staff)
    order = create_order(status: :ready, paid: false)

    post cashier_payment_path(order), params: { payment_method: "cash" }
    assert_redirected_to cashier_path
    assert_not order.reload.paid?
  end

  private

  def login_as(fixture_name)
    post login_path, params: { login_id: staffs(fixture_name).login_id, password: "password" }
  end

  def create_order(status:, paid:, total: 1000)
    placed_at = Time.zone.now
    order = Order.create!(
      order_number: "#C-#{SecureRandom.hex(3)}",
      order_type: :in_store,
      table_number: 5,
      status: status,
      subtotal: total,
      tax: 0,
      total: total,
      placed_at: placed_at,
      paid_at: paid ? placed_at : nil,
      payment_method: paid ? "cash" : nil
    )
    order.order_items.create!(
      menu_item_id: 1, name: "テスト商品", quantity: 1,
      unit_price: total, line_total: total, addons: []
    )
    order
  end
end
