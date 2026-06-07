require "test_helper"

class Admin::DashboardControllerTest < ActionDispatch::IntegrationTest
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

  private

  def login_as(fixture_name)
    post login_path, params: { login_id: staffs(fixture_name).login_id, password: "password" }
  end
end
