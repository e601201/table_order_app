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

  # --- OrderReady 通知（ADR-0008）。「ready への遷移」を検出して takeout かつ
  # サービス通知トークンありの注文にだけ1通送る。送信はベストエフォート ---

  test "takeout 注文を ready に遷移させるとサービスメッセージが送られトークンが更新される" do
    login_as(:kitchen_staff)
    order = create_takeout_order(status: :in_progress, token: "token-before")

    sent = []
    sender = ->(token, template_params = {}) { sent << [ token, template_params ]; "token-after" }
    original_liff_id = ENV["LINE_LIFF_ID"]
    ENV["LINE_LIFF_ID"] = "1234567890-test"
    LineServiceMessenger.stub(:send_ready_message, sender) do
      patch kitchen_order_path(order), params: { status: "ready" }
    end

    assert_redirected_to kitchen_path
    assert_predicate order.reload, :ready?
    # テンプレート order_remind_s_o_ja の変数: number（注文番号 ${number}）と
    # btn1_url（「詳細はこちら」ボタン。ボタンは1つ以上必須なのでミニアプリの LIFF URL を渡す）
    assert_equal [ [ "token-before",
                     { number: order.display_number, btn1_url: "https://liff.line.me/1234567890-test" } ] ], sent
    # API が返す更新後トークンを保存（将来拡張用）
    assert_equal "token-after", order.service_notification_token
  ensure
    ENV["LINE_LIFF_ID"] = original_liff_id
  end

  test "ready 以外への遷移ではサービスメッセージを送らない" do
    login_as(:kitchen_staff)
    order = create_takeout_order(status: :pending, token: "token-1")

    assert_no_service_message_sent do
      patch kitchen_order_path(order), params: { status: "in_progress" }
    end
    assert_predicate order.reload, :in_progress?
  end

  test "すでに ready の注文を ready のまま更新しても再送しない（遷移検出）" do
    login_as(:kitchen_staff)
    order = create_takeout_order(status: :ready, token: "token-1")

    assert_no_service_message_sent do
      patch kitchen_order_path(order), params: { status: "ready" }
    end
  end

  test "in_store 注文の ready 遷移ではサービスメッセージを送らない" do
    login_as(:kitchen_staff)
    order = create_order(status: :in_progress)

    assert_no_service_message_sent do
      patch kitchen_order_path(order), params: { status: "ready" }
    end
    assert_predicate order.reload, :ready?
  end

  test "サービス通知トークンのない takeout 注文には送らない（発行失敗後の注文）" do
    login_as(:kitchen_staff)
    order = create_takeout_order(status: :in_progress, token: nil)

    assert_no_service_message_sent do
      patch kitchen_order_path(order), params: { status: "ready" }
    end
    assert_predicate order.reload, :ready?
  end

  # --- テイクアウトの Served はレジの会計経由のみ（ADR-0009）。盤面からは拒否する ---

  test "テイクアウトを盤面から served にはできない" do
    login_as(:kitchen_staff)
    order = create_takeout_order(status: :ready, token: nil)

    patch kitchen_order_path(order), params: { status: "served" }

    assert_redirected_to kitchen_path
    assert_predicate order.reload, :ready? # 遷移していない
    assert flash[:alert].present?
  end

  test "in_store は盤面から served にできる（従来どおり）" do
    login_as(:kitchen_staff)
    order = create_order(status: :ready)

    patch kitchen_order_path(order), params: { status: "served" }

    assert_predicate order.reload, :served?
  end

  # --- 打ち切り済み（Closed）は盤面から消える・遷移もできない（ADR-0010）---

  test "打ち切られた注文は盤面のどのレーンにも出ない" do
    login_as(:kitchen_staff)
    order = create_order(status: :in_progress)
    order.update!(closed_at: Time.zone.now, closure_reason: :customer_request)

    get kitchen_path
    all_ids = inertia.props[:ordersByStatus].values.flatten.map { |o| o[:id] }
    assert_not_includes all_ids, order.id
  end

  test "打ち切られた注文は盤面から遷移できない" do
    login_as(:kitchen_staff)
    order = create_order(status: :in_progress)
    order.update!(closed_at: Time.zone.now, closure_reason: :out_of_stock)

    patch kitchen_order_path(order), params: { status: "ready" }

    assert_redirected_to kitchen_path
    assert_predicate order.reload, :in_progress? # 凍結されたまま
    assert flash[:alert].present?
  end

  test "サービスメッセージの送信失敗でもステータス遷移は成功する（ベストエフォート）" do
    login_as(:kitchen_staff)
    order = create_takeout_order(status: :in_progress, token: "token-1")

    raiser = ->(_token, _template_params = {}) { raise "LINE API down" }
    LineServiceMessenger.stub(:send_ready_message, raiser) do
      patch kitchen_order_path(order), params: { status: "ready" }
    end

    assert_redirected_to kitchen_path
    assert_predicate order.reload, :ready?
  end

  private

  def login_as(fixture_name)
    post login_path, params: { login_id: staffs(fixture_name).login_id, password: "password" }
  end

  def assert_no_service_message_sent(&block)
    called = false
    LineServiceMessenger.stub(:send_ready_message, ->(*_args) { called = true }, &block)
    assert_not called, "サービスメッセージが送信されてしまった"
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

  def create_takeout_order(status:, token:)
    order = Order.create!(
      order_number: "#K-#{SecureRandom.hex(3)}",
      order_type: :takeout,
      line_account: line_accounts(:taro),
      service_notification_token: token,
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
