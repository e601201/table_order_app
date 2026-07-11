require "test_helper"

# 決済方法マスタ（ADR-0014）。不変条件は「有効な決済方法 ≥ 1」のみ —
# レジが Paid を書けない状態を作らない。現金の特別扱いはしない。
class PaymentMethodTest < ActiveSupport::TestCase
  test "name は必須" do
    method = PaymentMethod.new(name: "")
    assert_not method.valid?
  end

  test "name は一意（前後の空白は除去して照合する）" do
    method = PaymentMethod.new(name: " 現金 ")
    assert_not method.valid?
    assert method.errors.details[:name].any? { |d| d[:error] == :taken }
  end

  test "有効な方法が他に残るなら無効化できる" do
    assert payment_methods(:credit_card).update(enabled: false)
  end

  test "最後の有効な決済方法は無効化できない" do
    payment_methods(:credit_card).update!(enabled: false)

    cash = payment_methods(:cash)
    assert_not cash.update(enabled: false)
    assert cash.reload.enabled
  end

  test "有効な方法が他に残るなら削除できる" do
    assert payment_methods(:credit_card).destroy
    assert_not PaymentMethod.exists?(payment_methods(:credit_card).id)
  end

  test "最後の有効な決済方法は削除できない" do
    payment_methods(:credit_card).update!(enabled: false)

    cash = payment_methods(:cash)
    assert_not cash.destroy
    assert PaymentMethod.exists?(cash.id)
  end

  test "無効な決済方法は削除できる" do
    assert payment_methods(:paypay).destroy
    assert_not PaymentMethod.exists?(payment_methods(:paypay).id)
  end

  test "last_enabled? は有効な方法が自分だけのとき true" do
    payment_methods(:credit_card).update!(enabled: false)

    assert payment_methods(:cash).last_enabled?
    assert_not payment_methods(:paypay).last_enabled? # 無効な行は最後の1つになり得ない
  end
end
