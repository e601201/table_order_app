require "test_helper"

# order_number の採番（ADR-0007）。保存値は日付プレフィックス付き `YYYYMMDD-NNN` で
# グローバル一意、客への表示は末尾の当日連番 `NNN`。連番は暦日（`all_day` 規約）で当日件数+1。
class OrderTest < ActiveSupport::TestCase
  def create_order(order_number:, placed_at:, order_type: :in_store, table_number: 5,
                   status: :pending, paid_at: nil, line_account: nil)
    takeout = order_type == :takeout
    Order.create!(
      order_number: order_number,
      order_type: order_type,
      table_number: takeout ? nil : table_number,
      line_account: line_account || (takeout ? line_accounts(:taro) : nil),
      subtotal: 100, tax: 10, total: 110,
      placed_at: placed_at,
      status: status,
      paid_at: paid_at
    )
  end

  def build_order(order_type:, table_number: nil, line_account: nil)
    Order.new(
      order_number: "#V-#{SecureRandom.hex(3)}",
      order_type: order_type,
      table_number: table_number,
      line_account: line_account,
      subtotal: 100, tax: 10, total: 110,
      placed_at: Time.current
    )
  end

  test "当日最初の注文には YYYYMMDD-001 を採番する" do
    travel_to Time.zone.local(2026, 6, 8, 12, 0, 0) do
      assert_equal "20260608-001", Order.next_order_number
    end
  end

  test "当日件数+1 の連番を採番する" do
    travel_to Time.zone.local(2026, 6, 8, 12, 0, 0) do
      create_order(order_number: "20260608-001", placed_at: Time.current)
      create_order(order_number: "20260608-002", placed_at: Time.current)
      assert_equal "20260608-003", Order.next_order_number
    end
  end

  test "保存値は日付プレフィックス付きでグローバル一意、display_number は当日連番" do
    travel_to Time.zone.local(2026, 6, 8, 12, 0, 0) do
      number = Order.next_order_number
      assert_match(/\A\d{8}-\d{3}\z/, number)
      order = create_order(order_number: number, placed_at: Time.current)
      assert_equal "001", order.display_number
    end
  end

  test "日付が変われば連番は 001 にリセットされ、プレフィックスで衝突しない" do
    travel_to Time.zone.local(2026, 6, 8, 23, 0, 0) do
      create_order(order_number: "20260608-001", placed_at: Time.current)
      assert_equal "20260608-002", Order.next_order_number
    end
    travel_to Time.zone.local(2026, 6, 9, 9, 0, 0) do
      assert_equal "20260609-001", Order.next_order_number
    end
  end

  test "In-store と Takeout は同一カウンタを共有する" do
    travel_to Time.zone.local(2026, 6, 8, 12, 0, 0) do
      create_order(order_number: "20260608-001", placed_at: Time.current, order_type: :in_store)
      create_order(order_number: "20260608-002", placed_at: Time.current, order_type: :takeout, table_number: nil)
      assert_equal "20260608-003", Order.next_order_number
    end
  end

  # --- kitchen-axis 終端状態 Served（提供済み）。用語集 CONTEXT.md:91-93 / ADR-0001 ---

  test "提供済み（Served）かつ未会計の注文は会計待ち（awaiting_payment）に入る" do
    served_unpaid = create_order(order_number: "#S-1", placed_at: Time.current, status: :served)

    assert served_unpaid.served?
    assert_includes Order.awaiting_payment, served_unpaid
  end

  test "提供済みかつ会計済みの注文は会計待ちに入らない" do
    served_paid = create_order(
      order_number: "#S-2", placed_at: Time.current, status: :served, paid_at: Time.current
    )

    assert_not_includes Order.awaiting_payment, served_paid
  end

  test "未提供（Ready 以前）の注文は会計待ちに入らない" do
    ready = create_order(order_number: "#S-3", placed_at: Time.current, status: :ready)

    assert_not_includes Order.awaiting_payment, ready
  end

  test "レジ当日キュー（for_cashier_today）は本日の提供済み注文を含む" do
    served_today = create_order(order_number: "#S-4", placed_at: Time.current, status: :served)

    assert_includes Order.for_cashier_today, served_today
  end

  # --- 会計待ちキューの order type 分岐（ADR-0009）。In-store は Served + Unpaid、
  # Takeout は手渡しが会計と同時のため Ready + Unpaid が会計待ち ---

  test "takeout の Ready + Unpaid は会計待ちに入る" do
    takeout_ready = create_order(order_number: "#Q-1", placed_at: Time.current,
                                 order_type: :takeout, status: :ready)

    assert_includes Order.awaiting_payment, takeout_ready
  end

  test "takeout の Ready + Unpaid はレジ当日キュー（for_cashier_today）にも入る" do
    takeout_ready = create_order(order_number: "#Q-2", placed_at: Time.current,
                                 order_type: :takeout, status: :ready)

    assert_includes Order.for_cashier_today, takeout_ready
  end

  test "in_store の Ready + Unpaid は会計待ちに入らない（従来どおり）" do
    in_store_ready = create_order(order_number: "#Q-3", placed_at: Time.current, status: :ready)

    assert_not_includes Order.awaiting_payment, in_store_ready
  end

  test "in_store の Ready + Unpaid はレジ当日キュー（for_cashier_today）にも入らない" do
    in_store_ready = create_order(order_number: "#Q-5", placed_at: Time.current, status: :ready)

    assert_not_includes Order.for_cashier_today, in_store_ready
  end

  test "旧フローの Served + Unpaid な takeout は会計待ちに入らない（リセット容認）" do
    legacy = create_order(order_number: "#Q-4", placed_at: Time.current,
                          order_type: :takeout, status: :served)

    assert_not_includes Order.awaiting_payment, legacy
  end

  # --- Takeout × LineAccount 相互排他（ADR-0008 / CONTEXT.md: LineAccount）。
  # table_number の相互排他（in_store 必須 / takeout 不在）と対をなす ---

  test "takeout 注文は LineAccount が必須" do
    order = build_order(order_type: :takeout)

    assert_not order.valid?
    assert order.errors.added?(:line_account, :blank)
  end

  test "takeout 注文は LineAccount 付きで有効" do
    order = build_order(order_type: :takeout, line_account: line_accounts(:taro))

    assert_predicate order, :valid?
  end

  test "in_store 注文に LineAccount は付けられない" do
    order = build_order(order_type: :in_store, table_number: 5, line_account: line_accounts(:taro))

    assert_not order.valid?
    assert order.errors.added?(:line_account, :present)
  end

  test "in_store 注文は LineAccount なしで有効（従来どおり）" do
    order = build_order(order_type: :in_store, table_number: 5)

    assert_predicate order, :valid?
  end

  # --- payment 軸の第2終端 Closed / 打ち切り（ADR-0010）。Unpaid → Paid | Closed。
  # kitchen 軸は凍結（触らない）、理由コード4値必須 ---

  test "理由付きで打ち切られた注文は closed? になり payment_status は closed" do
    order = create_order(order_number: "#X-1", placed_at: Time.current,
                         order_type: :takeout, status: :ready)
    order.update!(closed_at: Time.current, closure_reason: :no_show)

    assert_predicate order, :closed?
    assert_equal "closed", order.payment_status
  end

  test "会計済み（Paid）の注文は打ち切れない（paid_at と closed_at は排他）" do
    order = create_order(order_number: "#X-2", placed_at: Time.current,
                         status: :served, paid_at: Time.current)
    order.assign_attributes(closed_at: Time.current, closure_reason: :walkout)

    assert_not order.valid?
    assert order.errors.added?(:closed_at, :present)
  end

  test "理由なしでは打ち切れない（closure_reason は closed_at と同時必須）" do
    order = create_order(order_number: "#X-3", placed_at: Time.current, status: :ready,
                         order_type: :takeout)
    order.assign_attributes(closed_at: Time.current)

    assert_not order.valid?
    assert order.errors.added?(:closure_reason, :blank)
  end

  test "打ち切っていない注文に理由だけは付けられない" do
    order = create_order(order_number: "#X-4", placed_at: Time.current, status: :ready,
                         order_type: :takeout)
    order.assign_attributes(closure_reason: :no_show)

    assert_not order.valid?
    assert order.errors.added?(:closure_reason, :present)
  end

  # order type 構造整合のみ強制（ADR-0010）: テーブルに座っている客に no_show はあり得ず、
  # 新フローの Takeout に Served + Unpaid（walkout の前提）は存在し得ない。

  test "in_store 注文を no_show では打ち切れない（no_show は Takeout 限定）" do
    order = create_order(order_number: "#X-5", placed_at: Time.current, status: :ready)
    order.assign_attributes(closed_at: Time.current, closure_reason: :no_show)

    assert_not order.valid?
    assert order.errors.added?(:closure_reason, :invalid)
  end

  test "takeout 注文を walkout では打ち切れない（walkout は In-store 限定）" do
    order = create_order(order_number: "#X-6", placed_at: Time.current,
                         order_type: :takeout, status: :ready)
    order.assign_attributes(closed_at: Time.current, closure_reason: :walkout)

    assert_not order.valid?
    assert order.errors.added?(:closure_reason, :invalid)
  end

  test "kitchen 軸はどこにいても打ち切れて、凍結される（Pending の out_of_stock）" do
    order = create_order(order_number: "#X-7", placed_at: Time.current, status: :pending)
    order.update!(closed_at: Time.current, closure_reason: :out_of_stock)

    assert_predicate order, :closed?
    assert_predicate order, :pending?
  end

  test "打ち切られた注文は会計待ちにもレジ当日キューにも入らない" do
    closed_takeout = create_order(order_number: "#X-8", placed_at: Time.current,
                                  order_type: :takeout, status: :ready)
    closed_takeout.update!(closed_at: Time.current, closure_reason: :no_show)
    closed_in_store = create_order(order_number: "#X-9", placed_at: Time.current, status: :served)
    closed_in_store.update!(closed_at: Time.current, closure_reason: :walkout)

    assert_not_includes Order.awaiting_payment, closed_takeout
    assert_not_includes Order.awaiting_payment, closed_in_store
    assert_not_includes Order.for_cashier_today, closed_takeout
    assert_not_includes Order.for_cashier_today, closed_in_store
  end
end
