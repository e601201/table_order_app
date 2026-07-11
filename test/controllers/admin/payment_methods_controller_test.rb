require "test_helper"

# 決済方法マスタの操作（ADR-0014）。インライン操作は成功・失敗とも設定ページへ差し戻す。
# orders.payment_method は会計時の名前スナップショットのため、改名・削除は履歴に影響しない。
class Admin::PaymentMethodsControllerTest < ActionDispatch::IntegrationTest
  test "admin は決済方法を追加できる（初期状態は有効）" do
    login_as(:admin_staff)
    assert_difference "PaymentMethod.count", 1 do
      post admin_payment_methods_path, params: { name: "QRコード決済" }
    end
    assert_redirected_to admin_settings_path
    assert PaymentMethod.find_by(name: "QRコード決済").enabled
  end

  test "空の名前は追加できない" do
    login_as(:admin_staff)
    assert_no_difference "PaymentMethod.count" do
      post admin_payment_methods_path, params: { name: "  " }
    end
    assert_redirected_to admin_settings_path
  end

  test "重複する名前は追加できない" do
    login_as(:admin_staff)
    assert_no_difference "PaymentMethod.count" do
      post admin_payment_methods_path, params: { name: "現金" }
    end
    assert_redirected_to admin_settings_path
  end

  test "改名しても会計済み注文のスナップショットは変わらない" do
    login_as(:admin_staff)
    order = create_paid_order(payment_method: "現金")

    patch admin_payment_method_path(payment_methods(:cash)), params: { name: "現金（日本円）" }
    assert_redirected_to admin_settings_path
    assert_equal "現金（日本円）", payment_methods(:cash).reload.name
    assert_equal "現金", order.reload.payment_method # 名前スナップショット（ADR-0014）
  end

  test "有効な方法が他に残るなら無効化できる" do
    login_as(:admin_staff)
    patch admin_payment_method_path(payment_methods(:credit_card)), params: { enabled: false }
    assert_redirected_to admin_settings_path
    assert_not payment_methods(:credit_card).reload.enabled
  end

  test "最後の有効な決済方法は無効化できない" do
    login_as(:admin_staff)
    payment_methods(:credit_card).update!(enabled: false)

    patch admin_payment_method_path(payment_methods(:cash)), params: { enabled: false }
    assert_redirected_to admin_settings_path
    assert payment_methods(:cash).reload.enabled
  end

  test "admin は決済方法を削除でき、会計済み注文の記録は残る" do
    login_as(:admin_staff)
    order = create_paid_order(payment_method: "PayPay")

    assert_difference "PaymentMethod.count", -1 do
      delete admin_payment_method_path(payment_methods(:paypay))
    end
    assert_redirected_to admin_settings_path
    assert_equal "PayPay", order.reload.payment_method # 削除しても履歴は無傷（ADR-0014）
  end

  test "最後の有効な決済方法は削除できない" do
    login_as(:admin_staff)
    payment_methods(:credit_card).update!(enabled: false)

    assert_no_difference "PaymentMethod.count" do
      delete admin_payment_method_path(payment_methods(:cash))
    end
    assert_redirected_to admin_settings_path
  end

  test "非 admin は決済方法を操作できない" do
    login_as(:cashier_staff)
    assert_no_difference "PaymentMethod.count" do
      post admin_payment_methods_path, params: { name: "こっそり決済" }
    end
    assert_redirected_to cashier_path
  end

  private

  def login_as(fixture_name)
    post login_path, params: { login_id: staffs(fixture_name).login_id, password: "password" }
  end

  def create_paid_order(payment_method:)
    now = Time.zone.now
    Order.create!(
      order_number: "#PM-#{SecureRandom.hex(3)}",
      order_type: :in_store,
      table_number: 5,
      status: :served,
      subtotal: 1000, tax: 100, total: 1100,
      placed_at: now, paid_at: now,
      payment_method: payment_method
    )
  end
end
