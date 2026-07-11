require "test_helper"

# 設定ページ（ADR-0014）。中身は決済方法マスタのインライン管理。
class Admin::SettingsControllerTest < ActionDispatch::IntegrationTest
  test "admin は設定ページを表示でき、決済方法マスタが渡る" do
    login_as(:admin_staff)
    get admin_settings_path
    assert_response :success
    assert_inertia_component "admin/Settings"

    names = inertia.props[:payment_methods].map { |method| method[:name] }
    assert_includes names, "現金"
    assert_includes names, "クレジットカード"
    assert_includes names, "PayPay" # 無効な方法もマスタ管理には出る（レジの選択肢に出ないだけ）
  end

  test "非 admin は設定ページに入れない" do
    login_as(:cashier_staff)
    get admin_settings_path
    assert_redirected_to cashier_path
  end

  test "未ログインはログインページへ" do
    get admin_settings_path
    assert_redirected_to login_path
  end

  private

  def login_as(fixture_name)
    post login_path, params: { login_id: staffs(fixture_name).login_id, password: "password" }
  end
end
