require "test_helper"

# order_number の採番（ADR-0007）。保存値は日付プレフィックス付き `YYYYMMDD-NNN` で
# グローバル一意、客への表示は末尾の当日連番 `NNN`。連番は暦日（`all_day` 規約）で当日件数+1。
class OrderTest < ActiveSupport::TestCase
  def create_order(order_number:, placed_at:, order_type: :in_store, table_number: 5)
    Order.create!(
      order_number: order_number,
      order_type: order_type,
      table_number: order_type == :takeout ? nil : table_number,
      subtotal: 100, tax: 10, total: 110,
      placed_at: placed_at
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
end
