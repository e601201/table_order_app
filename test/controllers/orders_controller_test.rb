require "test_helper"

# テイクアウト面の LINE ログインゲート（ADR-0008）。takeout モードの全アクションを
# require_line_login! で守る。order_type の判定は既存ヘルパーと同じく params 優先 —
# session のみ参照すると、セッション未確立の初回 GET /order?order_type=takeout が
# 未ログインのまま takeout メニューを描画してすり抜けるため。
# In-store（客席タブレット）は従来どおり完全未認証で無風であること（回帰）。
class OrdersControllerTest < ActionDispatch::IntegrationTest
  setup do
    @item = menu_items(:classic_burger)
  end

  # --- 未ログイン takeout はログイン誘導へ ---

  test "未ログインの初回 GET /order?order_type=takeout はログイン誘導へ（params 優先判定）" do
    get "/order", params: { order_type: "takeout" }

    assert_redirected_to line_login_path
  end

  test "セッションが takeout のままの GET /order もログイン誘導へ" do
    get "/order", params: { order_type: "takeout" } # session に takeout が焼かれる

    get "/order"
    assert_redirected_to line_login_path
  end

  test "未ログイン takeout は商品詳細・カート閲覧もログイン誘導へ" do
    get "/order", params: { order_type: "takeout" }

    get "/order/item/#{@item.id}"
    assert_redirected_to line_login_path

    get "/order/cart"
    assert_redirected_to line_login_path
  end

  test "未ログイン takeout はカート操作・checkout もログイン誘導へ" do
    get "/order", params: { order_type: "takeout" }

    post "/order/cart", params: { item_id: @item.id, size_id: "regular", addon_ids: [], quantity: 1 }
    assert_redirected_to line_login_path

    assert_no_difference "Order.count" do
      post "/order/checkout"
    end
    assert_redirected_to line_login_path
  end

  test "未ログイン takeout はカート明細の数量変更・削除もログイン誘導へ" do
    # ゲートは明細の解決より先に効くため、line_id は実在しなくてよい
    get "/order", params: { order_type: "takeout" }

    patch "/order/cart/abc123", params: { quantity: 2 }
    assert_redirected_to line_login_path

    delete "/order/cart/abc123"
    assert_redirected_to line_login_path
  end

  # --- ログイン済み takeout は通れる ---

  test "LINE ログイン済みなら takeout のメニュー閲覧ができる" do
    line_login_as(line_accounts(:taro))

    get "/order", params: { order_type: "takeout" }
    assert_response :success
    assert_inertia_component "orders/Home"
  end

  # --- In-store 無風の回帰 ---

  test "in_store は未ログインのままメニュー閲覧・カート閲覧できる（従来どおり）" do
    get "/order", params: { order_type: "in_store", table_number: 5 }
    assert_response :success

    get "/order/cart"
    assert_response :success
  end

  test "in_store は未ログインのままカート操作・checkout できる（従来どおり）" do
    get "/order", params: { order_type: "in_store", table_number: 5 }
    post "/order/cart", params: { item_id: @item.id, size_id: "regular", addon_ids: [], quantity: 1 }

    assert_difference "Order.count" => 1 do
      post "/order/checkout"
    end
  end

  # --- サービス通知トークンの発行（Checkout 時。ADR-0008） ---

  test "takeout の checkout はサービス通知トークンを発行して Order に保存する" do
    takeout_cart_for(line_accounts(:taro))

    LineServiceMessenger.stub(:issue_token, "notif-token-123") do
      post "/order/checkout", params: { liff_access_token: "liff-at" }
    end

    assert_equal "notif-token-123", Order.last.service_notification_token
  end

  test "サービス通知トークンの発行失敗は注文を止めない（通知なしで続行）" do
    takeout_cart_for(line_accounts(:taro))

    raiser = ->(_liff_access_token) { raise "LINE API down" }
    assert_difference "Order.count" => 1 do
      LineServiceMessenger.stub(:issue_token, raiser) do
        post "/order/checkout", params: { liff_access_token: "liff-at" }
      end
    end

    order = Order.last
    assert_nil order.service_notification_token
    assert_redirected_to "/order/complete/#{order.id}"
  end

  test "in_store の checkout はサービス通知トークン発行を呼ばない" do
    get "/order", params: { order_type: "in_store", table_number: 5 }
    post "/order/cart", params: { item_id: @item.id, size_id: "regular", addon_ids: [], quantity: 1 }

    called = false
    LineServiceMessenger.stub(:issue_token, ->(_t) { called = true }) do
      post "/order/checkout"
    end

    assert_not called
    assert_nil Order.last.service_notification_token
  end

  # --- 完了画面の所有ガード（#29 の Takeout 側解消） ---

  test "takeout 注文の完了画面は本人だけが見える" do
    order = create_takeout_order(line_accounts(:taro), number: "#O-1")
    line_login_as(line_accounts(:taro))

    get "/order/complete/#{order.id}"
    assert_response :success
    assert_inertia_component "orders/OrderComplete"
  end

  test "他人の takeout 注文の完了画面は /order へ退避する" do
    order = create_takeout_order(line_accounts(:taro), number: "#O-2")
    line_login_as(line_accounts(:hanako))

    get "/order/complete/#{order.id}"
    assert_redirected_to "/order"
  end

  test "未ログインでは takeout 注文の完了画面は見えない" do
    order = create_takeout_order(line_accounts(:taro), number: "#O-3")

    # in_store セッションのためゲートには掛からないが、所有チェックで /order へ退避する
    get "/order/complete/#{order.id}"
    assert_redirected_to "/order"
  end

  # --- 注文履歴（本人限定。現在進行中＋過去のスナップショット） ---

  test "未ログインの /order/history はログイン誘導へ" do
    get "/order/history"
    assert_redirected_to line_login_path
  end

  test "履歴は自分の注文だけを新しい順に返す" do
    taro = line_accounts(:taro)
    old_order = create_takeout_order(taro, number: "#H-1", placed_at: 2.days.ago)
    new_order = create_takeout_order(taro, number: "#H-2", placed_at: 1.hour.ago, status: :in_progress)
    create_takeout_order(line_accounts(:hanako), number: "#H-3") # 他人の注文は含まれない

    line_login_as(taro)
    get "/order/history"

    assert_response :success
    assert_inertia_component "orders/History"
    assert_equal [ new_order.id, old_order.id ], inertia.props[:orders].map { |o| o[:id] }
  end

  test "履歴の各注文は kitchen progress の現在状態と明細・合計を持つ" do
    order = create_takeout_order(line_accounts(:taro), number: "#H-4", status: :ready)
    line_login_as(line_accounts(:taro))

    get "/order/history"

    row = inertia.props[:orders].find { |o| o[:id] == order.id }
    assert_equal "ready", row[:status]
    assert_equal order.display_number, row[:order_number]
    assert_equal 1, row[:items].length
    assert_equal order.total, row[:total]
  end

  private

  # takeout モードでログイン済みのカートを用意する（checkout 系テストの前段）
  def takeout_cart_for(account)
    line_login_as(account)
    get "/order", params: { order_type: "takeout" }
    post "/order/cart", params: { item_id: @item.id, size_id: "regular", addon_ids: [], quantity: 1 }
  end

  def create_takeout_order(account, number:, placed_at: Time.current, status: :pending)
    order = Order.create!(
      order_number: number, order_type: :takeout, line_account: account,
      status: status, subtotal: 1000, tax: 100, total: 1100, placed_at: placed_at
    )
    order.order_items.create!(
      menu_item_id: @item.id, name: @item.name, quantity: 1,
      unit_price: 1000, line_total: 1000, addons: []
    )
    order
  end
end
