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

  # --- テイクアウトは Ready から会計＝手渡し（ADR-0009）。会計が Served + Paid を
  # 同一アクションで進め、Served + Unpaid の中間状態を作らない ---

  test "Ready かつ未会計のテイクアウトは会計確認画面を表示できる" do
    login_as(:cashier_staff)
    order = create_order(status: :ready, paid: false, order_type: :takeout)

    get cashier_payment_path(order)
    assert_response :success
    assert_inertia_component "cashier/PaymentConfirm"
  end

  test "テイクアウトの会計処理は Served と Paid に同時遷移する" do
    login_as(:cashier_staff)
    order = create_order(status: :ready, paid: false, order_type: :takeout)

    post cashier_payment_path(order), params: { payment_method: "cash" }
    assert_redirected_to cashier_payment_complete_path(order)

    order.reload
    assert_predicate order, :served?
    assert_predicate order, :paid?
  end

  test "調理中のテイクアウトは会計できずレジ盤面へ戻す" do
    login_as(:cashier_staff)
    order = create_order(status: :in_progress, paid: false, order_type: :takeout)

    post cashier_payment_path(order), params: { payment_method: "cash" }
    assert_redirected_to cashier_path
    assert_not order.reload.paid?
  end

  test "旧フローの Served + Unpaid なテイクアウトは会計ガードを通らない（リセット容認）" do
    login_as(:cashier_staff)
    order = create_order(status: :served, paid: false, order_type: :takeout)

    get cashier_payment_path(order)
    assert_redirected_to cashier_path
  end

  test "テイクアウトの会計では LINE 通知を送らない（呼び出しは OrderReady で済んでいる）" do
    login_as(:cashier_staff)
    order = create_order(status: :ready, paid: false, order_type: :takeout)

    called = false
    LineServiceMessenger.stub(:send_ready_message, ->(*_args) { called = true }) do
      post cashier_payment_path(order), params: { payment_method: "cash" }
    end

    assert_not called
    assert_predicate order.reload, :served?
  end

  # --- 打ち切り（Close）と打ち切り解除（Reopen）。payment 軸の第2終端（ADR-0010）。
  # actor は Cashier のみ・Unpaid 限定・kitchen 軸は凍結 ---

  test "未会計の注文を理由付きで打ち切れる（kitchen 軸は凍結）" do
    login_as(:cashier_staff)
    order = create_order(status: :ready, paid: false, order_type: :takeout)

    post cashier_order_close_path(order), params: { closure_reason: "no_show" }
    assert_redirected_to cashier_path

    order.reload
    assert_predicate order, :closed?
    assert_equal "no_show", order.closure_reason
    assert_predicate order, :ready?
  end

  test "会計済みの注文は打ち切れない（Paid と Closed は排他）" do
    login_as(:cashier_staff)
    order = create_order(status: :served, paid: true)

    post cashier_order_close_path(order), params: { closure_reason: "walkout" }
    assert_redirected_to cashier_path

    order.reload
    assert_not order.closed?
    assert_predicate order, :paid?
  end

  test "打ち切り済みの注文を再打ち切りしても理由は上書きされない" do
    login_as(:cashier_staff)
    order = create_order(status: :in_progress, paid: false)
    order.update!(closed_at: Time.zone.now, closure_reason: :customer_request)

    post cashier_order_close_path(order), params: { closure_reason: "out_of_stock" }
    assert_redirected_to cashier_path

    assert_equal "customer_request", order.reload.closure_reason
  end

  test "理由なし・不正な理由では打ち切れない" do
    login_as(:cashier_staff)
    order = create_order(status: :ready, paid: false, order_type: :takeout)

    post cashier_order_close_path(order), params: { closure_reason: "bogus" }
    assert_redirected_to cashier_path

    assert_not order.reload.closed?
  end

  test "打ち切り解除（reopen）で Unpaid に戻り会計待ちに再出現する" do
    login_as(:cashier_staff)
    order = create_order(status: :ready, paid: false, order_type: :takeout)
    order.update!(closed_at: Time.zone.now, closure_reason: :no_show)

    post cashier_order_reopen_path(order)
    assert_redirected_to cashier_path

    order.reload
    assert_not order.closed?
    assert_nil order.closure_reason
    assert_includes Order.awaiting_payment, order
  end

  test "打ち切り済みの注文は会計確認・会計処理ともに通らない" do
    login_as(:cashier_staff)
    order = create_order(status: :ready, paid: false, order_type: :takeout)
    order.update!(closed_at: Time.zone.now, closure_reason: :no_show)

    get cashier_payment_path(order)
    assert_redirected_to cashier_path

    post cashier_payment_path(order), params: { payment_method: "cash" }
    assert_redirected_to cashier_path
    assert_not order.reload.paid?
  end

  test "打ち切り解除後は通常の会計で Served + Paid にできる（no-show 客が現れた）" do
    login_as(:cashier_staff)
    order = create_order(status: :ready, paid: false, order_type: :takeout)
    order.update!(closed_at: Time.zone.now, closure_reason: :no_show)

    post cashier_order_reopen_path(order)
    post cashier_payment_path(order), params: { payment_method: "cash" }

    order.reload
    assert_predicate order, :served?
    assert_predicate order, :paid?
  end

  test "打ち切り・打ち切り解除では LINE 通知を送らない（OrderClosed の購読者はゼロ）" do
    login_as(:cashier_staff)
    order = create_order(status: :ready, paid: false, order_type: :takeout)

    called = false
    LineServiceMessenger.stub(:send_ready_message, ->(*_args) { called = true }) do
      post cashier_order_close_path(order), params: { closure_reason: "no_show" }
      post cashier_order_reopen_path(order)
    end

    assert_not called
    assert_not order.reload.closed?
  end

  test "レジ盤面に当日の打ち切り一覧とキュー外の未払い注文が乗る" do
    login_as(:cashier_staff)
    queue_order = create_order(status: :served, paid: false)
    pending_order = create_order(status: :pending, paid: false)
    closed_order = create_order(status: :ready, paid: false, order_type: :takeout)
    closed_order.update!(closed_at: Time.zone.now, closure_reason: :no_show)

    get cashier_path
    assert_response :success

    queue_ids = inertia.props[:orders].map { |o| o[:id] }
    outside_ids = inertia.props[:outsideQueueOrders].map { |o| o[:id] }
    closed = inertia.props[:closedOrders]

    assert_includes queue_ids, queue_order.id
    assert_not_includes queue_ids, closed_order.id
    assert_includes outside_ids, pending_order.id
    assert_not_includes outside_ids, queue_order.id
    assert_not_includes outside_ids, closed_order.id
    assert_equal [ closed_order.id ], closed.map { |o| o[:id] }
    assert_equal "no_show", closed.first[:closure_reason]
  end

  private

  def login_as(fixture_name)
    post login_path, params: { login_id: staffs(fixture_name).login_id, password: "password" }
  end

  def create_order(status:, paid:, total: 1000, order_type: :in_store)
    takeout = order_type == :takeout
    placed_at = Time.zone.now
    order = Order.create!(
      order_number: "#C-#{SecureRandom.hex(3)}",
      order_type: order_type,
      table_number: takeout ? nil : 5,
      line_account: takeout ? line_accounts(:taro) : nil,
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
