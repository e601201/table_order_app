require "test_helper"

class Admin::OrdersControllerTest < ActionDispatch::IntegrationTest
  # --- 認可（ADR-0002 の役割境界。Admin のみ閲覧可）---

  test "未ログインは login へリダイレクト" do
    get admin_orders_path
    assert_redirected_to login_path
  end

  test "kitchen は注文管理にアクセスできない" do
    login_as(:kitchen_staff)
    get admin_orders_path
    assert_redirected_to kitchen_path
    assert_equal "権限がありません", flash[:alert]
  end

  test "cashier は注文管理にアクセスできない" do
    login_as(:cashier_staff)
    get admin_orders_path
    assert_redirected_to cashier_path
  end

  test "kitchen は詳細にアクセスできない" do
    login_as(:kitchen_staff)
    order = create_order
    get admin_order_path(order)
    assert_redirected_to kitchen_path
  end

  # --- index ---

  test "admin は一覧を表示できる" do
    login_as(:admin_staff)
    get admin_orders_path
    assert_response :success
    assert_inertia_component "admin/Orders"
  end

  test "一覧は本日の注文のみを含む" do
    login_as(:admin_staff)
    today = create_order(order_number: "#A-TODAY")
    create_order(order_number: "#A-YESTERDAY", placed_at: 1.day.ago)

    get admin_orders_path
    numbers = inertia.props[:orders].map { |o| o[:order_number] }
    assert_includes numbers, today.order_number
    assert_not_includes numbers, "#A-YESTERDAY"
  end

  test "一覧は受注時刻の降順" do
    login_as(:admin_staff)
    create_order(order_number: "#A-OLD", placed_at: 2.hours.ago)
    create_order(order_number: "#A-NEW", placed_at: 1.minute.ago)

    get admin_orders_path
    numbers = inertia.props[:orders].map { |o| o[:order_number] }
    assert_equal [ "#A-NEW", "#A-OLD" ], numbers
  end

  test "各行に調理状態・支払い状態・合計・商品サマリが含まれる" do
    login_as(:admin_staff)
    create_order(status: :in_progress, paid: false, total: 1980, item_name: "テリヤキバーガー", quantity: 2)

    get admin_orders_path
    row = inertia.props[:orders].first
    assert_equal "in_progress", row[:status]
    assert_equal "unpaid", row[:payment_status]
    assert_equal 1980, row[:total]
    assert_equal 2, row[:item_count]
    assert_equal "テリヤキバーガー ×2", row[:items_summary]
  end

  test "単品で数量1のサマリは商品名のみ（×を付けない）" do
    login_as(:admin_staff)
    create_order(item_name: "テリヤキバーガー", quantity: 1)

    get admin_orders_path
    assert_equal "テリヤキバーガー", inertia.props[:orders].first[:items_summary]
  end

  test "複数明細のサマリは商品名をカンマ区切り・点数は数量合計" do
    login_as(:admin_staff)
    create_order(items: [
      { name: "カフェラテ", quantity: 2, unit_price: 500 },
      { name: "チーズケーキ", quantity: 3, unit_price: 600 }
    ])

    get admin_orders_path
    row = inertia.props[:orders].first
    assert_equal "カフェラテ, チーズケーキ", row[:items_summary]
    assert_equal 5, row[:item_count]
  end

  # --- 集計（grill 決定: 売上=会計済みのみ / 会計待ち=Served+Unpaid）---

  test "本日の注文数を集計する" do
    login_as(:admin_staff)
    create_order
    create_order
    create_order(placed_at: 1.day.ago) # 前日分はカウントしない

    get admin_orders_path
    assert_equal 2, inertia.props[:stats][:orders_count]
  end

  test "調理中の件数を集計する" do
    login_as(:admin_staff)
    create_order(status: :in_progress)
    create_order(status: :in_progress)
    create_order(status: :pending)

    get admin_orders_path
    assert_equal 2, inertia.props[:stats][:in_progress_count]
  end

  test "本日の売上は会計済みの total 合計のみ" do
    login_as(:admin_staff)
    create_order(status: :served, paid: true, total: 2400)
    create_order(status: :served, paid: true, total: 600)
    create_order(status: :served, paid: false, total: 1000) # 未会計は売上に含めない
    create_order(status: :pending, paid: false, total: 500)

    get admin_orders_path
    assert_equal 3000, inertia.props[:stats][:sales_total]
  end

  test "会計待ち件数は提供済みかつ未会計のみ" do
    login_as(:admin_staff)
    create_order(status: :served, paid: false) # Served + Unpaid → カウント
    create_order(status: :served, paid: true)  # Served + Paid → 含めない
    create_order(status: :ready, paid: false)     # 未提供 → 含めない
    create_order(status: :pending, paid: false)   # 未提供 → 含めない

    get admin_orders_path
    assert_equal 1, inertia.props[:stats][:awaiting_payment_count]
  end

  # --- show ---

  test "admin は詳細を表示できる（明細・金額内訳・支払い情報を含む）" do
    login_as(:admin_staff)
    order = create_order(
      status: :served, paid: true, total: 2400, tax: 218,
      items: [ {
        name: "ハンバーガーセット", quantity: 2, unit_price: 1200,
        size_label: "ラージ", addons: [ { "id" => "cheese", "label" => "チーズ追加", "extra" => 50 } ]
      } ]
    )

    get admin_order_path(order)
    assert_response :success
    assert_inertia_component "admin/OrderDetail"

    detail = inertia.props[:order]
    assert_equal order.order_number, detail[:order_number]
    assert_equal 2400, detail[:subtotal]
    assert_equal 218, detail[:tax]
    assert_equal "cash", detail[:payment_method]
    assert_match(/\dT\d/, detail[:paid_at], "paid_at は iso8601 文字列であるべき")

    item = detail[:items].first
    assert_equal "ハンバーガーセット", item[:name]
    assert_equal 2, item[:quantity]
    assert_equal 1200, item[:unit_price]
    assert_equal 2400, item[:line_total]
    assert_equal "ラージ", item[:size_label]
    assert_equal "チーズ追加", item[:addons].first[:label]
  end

  test "未会計注文の詳細は paid_at と payment_method が nil" do
    login_as(:admin_staff)
    order = create_order(status: :served, paid: false)

    get admin_order_path(order)
    detail = inertia.props[:order]
    assert_nil detail[:paid_at]
    assert_nil detail[:payment_method]
  end

  test "存在しない注文の詳細は一覧へリダイレクト" do
    login_as(:admin_staff)
    get admin_order_path(id: 999_999)
    assert_redirected_to admin_orders_path
  end

  private

  def login_as(fixture_name)
    post login_path, params: { login_id: staffs(fixture_name).login_id, password: "password" }
  end

  def create_order(
    status: :pending, paid: false, placed_at: Time.zone.now, total: 1000, tax: 0,
    order_type: :in_store, table_number: 5, order_number: nil,
    item_name: "テスト商品", quantity: 1, items: nil
  )
    order_number ||= "#A-#{SecureRandom.hex(3)}"
    order = Order.create!(
      order_number: order_number,
      order_type: order_type,
      table_number: order_type.to_sym == :takeout ? nil : table_number,
      status: status,
      subtotal: total,
      tax: tax,
      total: total,
      placed_at: placed_at,
      paid_at: paid ? placed_at : nil,
      payment_method: paid ? "cash" : nil
    )
    lines = items || [ { name: item_name, quantity: quantity, unit_price: total } ]
    lines.each do |line|
      order.order_items.create!(
        menu_item_id: line[:menu_item_id] || 1,
        name: line[:name],
        quantity: line[:quantity],
        unit_price: line[:unit_price],
        line_total: line[:unit_price] * line[:quantity],
        size_label: line[:size_label],
        addons: line[:addons] || []
      )
    end
    order
  end
end
