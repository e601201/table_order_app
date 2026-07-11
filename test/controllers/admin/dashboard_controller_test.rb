require "test_helper"

class Admin::DashboardControllerTest < ActionDispatch::IntegrationTest
  # 「本日」は JST 暦日（CONTEXT.md「本日 / 営業日」）。placed_at の相対オフセットが
  # 壁時計次第で日付をまたがないよう、全テストを JST 正午に固定する（order_test.rb と同じ慣習）。
  setup { travel_to Time.zone.local(2026, 6, 16, 12, 0, 0) }

  # --- 認可（ADR-0002 の役割境界。Admin のみアクセス可）---

  test "未ログインは login へリダイレクト" do
    get admin_dashboard_path
    assert_redirected_to login_path
  end

  test "kitchen はダッシュボードにアクセスできない" do
    login_as(:kitchen_staff)
    get admin_dashboard_path
    assert_redirected_to kitchen_path
    assert_equal "権限がありません", flash[:alert]
  end

  test "cashier はダッシュボードにアクセスできない" do
    login_as(:cashier_staff)
    get admin_dashboard_path
    assert_redirected_to cashier_path
    assert_equal "権限がありません", flash[:alert]
  end

  # --- index ---

  test "admin はダッシュボードを表示できる" do
    login_as(:admin_staff)
    get admin_dashboard_path
    assert_response :success
    assert_inertia_component "admin/Dashboard"
  end

  # KPI は above the fold で即時、それ以外は初期描画後に遅延ロードする（flicker-free 化の意図を固定）。
  test "KPI は即時・グラフ/人気/最近の注文は secondary グループで遅延ロードする" do
    login_as(:admin_staff)
    get admin_dashboard_path

    # KPI は初期レスポンスに含まれる。
    assert inertia.props.key?(:kpi)
    # 残り3つは初期レスポンスには値を含まず、deferredProps（secondary グループ）に載る。
    assert_inertia_deferred_props :sales_trend, :popular_items, :recent_orders, group: :secondary
  end

  # --- KPI（grill 決定 / ADR-0005 更新: 売上=paid基準 / 注文数=placed基準 / 平均=paid売上÷paid注文数）---

  test "本日の売上は会計済み注文の total 合計のみ" do
    login_as(:admin_staff)
    create_order(paid: true, total: 2400)
    create_order(paid: true, total: 600)
    create_order(paid: false, total: 1000) # 未会計は含めない

    get admin_dashboard_path
    assert_equal 3000, inertia.props[:kpi][:sales][:value]
  end

  test "注文数は本日 placed の全件数（会計状態を問わない）" do
    login_as(:admin_staff)
    create_order(paid: true)
    create_order(paid: false)
    create_order(placed_at: 1.day.ago) # 前日分は数えない

    get admin_dashboard_path
    assert_equal 2, inertia.props[:kpi][:orders][:value]
  end

  test "打ち切られた注文も注文数に含む（placed 基準は需要を映す。ADR-0010）" do
    login_as(:admin_staff)
    create_order(paid: false)
    closed = create_order(paid: false, status: :served)
    closed.update!(closed_at: Time.zone.now, closure_reason: :walkout)

    get admin_dashboard_path
    assert_equal 2, inertia.props[:kpi][:orders][:value]
  end

  test "平均注文単価は paid売上 ÷ paid注文数" do
    login_as(:admin_staff)
    create_order(paid: true, total: 2400)
    create_order(paid: true, total: 600)
    create_order(paid: false, total: 1000) # 分子分母とも paid のみ

    get admin_dashboard_path
    assert_equal 1500, inertia.props[:kpi][:average_order_value][:value]
  end

  test "前日比は前日の同定義の全日確定値を分母にする" do
    login_as(:admin_staff)
    create_order(paid: true, total: 2000, placed_at: 1.day.ago) # 前日売上 2000
    create_order(paid: true, total: 3000)                       # 本日売上 3000

    get admin_dashboard_path
    assert_equal 50.0, inertia.props[:kpi][:sales][:change_pct]
  end

  test "前日が0の指標の前日比は nil（ゼロ除算ガード）" do
    login_as(:admin_staff)
    create_order(paid: true, total: 3000) # 本日のみ・前日0

    get admin_dashboard_path
    assert_nil inertia.props[:kpi][:sales][:change_pct]
  end

  test "本日の paid 注文が0なら平均注文単価は nil（ゼロ除算ガード）" do
    login_as(:admin_staff)
    create_order(paid: false, total: 1000) # placed today だが未会計

    get admin_dashboard_path
    assert_nil inertia.props[:kpi][:average_order_value][:value]
  end

  # --- 売上推移（paid×paid_at 日割り・直近7日・ゼロ埋め・gem/chartなし）---

  test "売上推移は7日分で末尾が本日・先頭が6日前" do
    login_as(:admin_staff)
    get admin_dashboard_path
    inertia_load_deferred_props

    trend = inertia.props[:sales_trend]
    assert_equal 7, trend.length
    assert_equal Time.zone.today.iso8601, trend.last[:date]
    assert_equal (Time.zone.today - 6).iso8601, trend.first[:date]
  end

  test "売上推移は paid_at で日割りし未会計を除外する" do
    login_as(:admin_staff)
    create_order(paid: true, total: 1000)                      # paid_at 本日
    create_order(paid: true, total: 500, placed_at: 2.days.ago) # paid_at 2日前
    create_order(paid: false, total: 9999)                     # 未会計は除外

    get admin_dashboard_path
    inertia_load_deferred_props
    by_date = inertia.props[:sales_trend].index_by { |d| d[:date] }
    assert_equal 1000, by_date[Time.zone.today.iso8601][:amount]
    assert_equal 500, by_date[(Time.zone.today - 2).iso8601][:amount]
  end

  # --- 人気メニュー TOP5（order_items.name × Σquantity・placed 全注文）---

  test "人気メニューは数量合計の降順・上位5・同数は名前昇順" do
    login_as(:admin_staff)
    create_order(items: [
      { name: "A", quantity: 5, unit_price: 100 },
      { name: "B", quantity: 3, unit_price: 100 },
      { name: "C", quantity: 3, unit_price: 100 }, # B と同数 → 名前昇順で B が先
      { name: "D", quantity: 2, unit_price: 100 },
      { name: "E", quantity: 1, unit_price: 100 },
      { name: "F", quantity: 1, unit_price: 100 }  # 6件目は上位5で切る（E と同数 → E が先）
    ])

    get admin_dashboard_path
    inertia_load_deferred_props
    popular = inertia.props[:popular_items].map { |p| [ p[:name], p[:quantity] ] }
    assert_equal [ [ "A", 5 ], [ "B", 3 ], [ "C", 3 ], [ "D", 2 ], [ "E", 1 ] ], popular
  end

  test "人気メニューの母集団は本日 placed の全注文（会計状態を問わず合算）" do
    login_as(:admin_staff)
    create_order(items: [ { name: "唐揚げ", quantity: 2, unit_price: 100 } ])                       # 本日・未会計
    create_order(items: [ { name: "唐揚げ", quantity: 3, unit_price: 100 } ], paid: true)            # 本日・会計済み
    create_order(items: [ { name: "唐揚げ", quantity: 9, unit_price: 100 } ], placed_at: 1.day.ago)  # 前日は除外

    get admin_dashboard_path
    inertia_load_deferred_props
    popular = inertia.props[:popular_items]
    assert_equal 1, popular.length
    assert_equal "唐揚げ", popular.first[:name]
    assert_equal 5, popular.first[:quantity]
  end

  test "本日の注文が無ければ人気メニューは空" do
    login_as(:admin_staff)
    create_order(items: [ { name: "唐揚げ", quantity: 9, unit_price: 100 } ], placed_at: 1.day.ago)

    get admin_dashboard_path
    inertia_load_deferred_props
    assert_empty inertia.props[:popular_items]
  end

  # --- 最近の注文プレビュー（本日のみ・受注降順・2バッジ用の状態・上位N件）---

  test "最近の注文は本日のみ・受注時刻の降順・2バッジ用の状態を含む" do
    login_as(:admin_staff)
    create_order(order_number: "#A-OLD", placed_at: 2.hours.ago, status: :in_progress, paid: false,
                 total: 1980, item_name: "テリヤキバーガー", quantity: 2)
    create_order(order_number: "#A-NEW", placed_at: 1.minute.ago, status: :served, paid: true)
    create_order(order_number: "#A-YDAY", placed_at: 1.day.ago)

    get admin_dashboard_path
    inertia_load_deferred_props
    recent = inertia.props[:recent_orders]
    numbers = recent.map { |o| o[:order_number] }
    assert_equal [ "#A-NEW", "#A-OLD" ], numbers
    assert_not_includes numbers, "#A-YDAY"

    old = recent.find { |o| o[:order_number] == "#A-OLD" }
    assert_equal "in_progress", old[:status]
    assert_equal "unpaid", old[:payment_status]
    assert_equal 1980, old[:total]
    assert_equal "テリヤキバーガー ×2", old[:items_summary]
  end

  test "最近の注文は上位5件に制限する" do
    login_as(:admin_staff)
    7.times { |i| create_order(order_number: "#A-#{i}", placed_at: i.minutes.ago) }

    get admin_dashboard_path
    inertia_load_deferred_props
    assert_equal 5, inertia.props[:recent_orders].length
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
      payment_method: paid ? "現金" : nil # 名前スナップショット（ADR-0014）
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
