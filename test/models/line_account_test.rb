require "test_helper"

# LineAccount = Takeout 時に Customer が名乗る永続化された LINE 身元（ADR-0008 / CONTEXT.md）。
# line_user_id（LINE の userId）で一意に識別し、1つの LineAccount は多数の Order を持ちうる。
class LineAccountTest < ActiveSupport::TestCase
  test "line_user_id があれば有効" do
    account = LineAccount.new(line_user_id: "U#{SecureRandom.hex(16)}", display_name: "テスト太郎")
    assert account.valid?
  end

  test "line_user_id は必須" do
    account = LineAccount.new(display_name: "名無し")
    assert_not account.valid?
    assert account.errors.added?(:line_user_id, :blank)
  end

  test "line_user_id は一意" do
    existing = line_accounts(:taro)
    dup = LineAccount.new(line_user_id: existing.line_user_id)
    assert_not dup.valid?
    assert dup.errors.added?(:line_user_id, :taken, value: existing.line_user_id)
  end

  test "1つの LineAccount は複数の Order を持てる" do
    account = line_accounts(:taro)
    2.times do |i|
      Order.create!(
        order_number: "#LA-#{i}", order_type: :takeout, line_account: account,
        subtotal: 100, tax: 10, total: 110, placed_at: Time.current
      )
    end
    assert_equal 2, account.orders.count
  end
end
