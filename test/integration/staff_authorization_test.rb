require "test_helper"

class StaffAuthorizationTest < ActionDispatch::IntegrationTest
  test "/order と / は未ログインでも公開されている" do
    get root_path
    assert_response :success

    get "/order", params: { order_type: "takeout" }
    assert_response :success
  end

  test "未ログインで /kitchen にアクセスすると /login へリダイレクト" do
    get kitchen_path
    assert_redirected_to login_path
    assert_equal "ログインしてください", flash[:alert]
  end

  test "未ログインで /cashier にアクセスすると /login へリダイレクト" do
    get cashier_path
    assert_redirected_to login_path
  end

  test "未ログインで /admin/staffs にアクセスすると /login へリダイレクト" do
    get admin_staffs_path
    assert_redirected_to login_path
  end

  test "kitchen は /kitchen にアクセスできる" do
    login_as(:kitchen_staff)
    get kitchen_path
    assert_response :success
  end

  test "kitchen が /cashier にアクセスすると自ロールのホームへ + 権限エラー" do
    login_as(:kitchen_staff)
    get cashier_path
    assert_redirected_to kitchen_path
    assert_equal "権限がありません", flash[:alert]
  end

  test "kitchen は /admin/staffs にアクセスできない" do
    login_as(:kitchen_staff)
    get admin_staffs_path
    assert_redirected_to kitchen_path
    assert_equal "権限がありません", flash[:alert]
  end

  test "cashier は /cashier にアクセスできる" do
    login_as(:cashier_staff)
    get cashier_path
    assert_response :success
  end

  test "admin は全スタッフ画面にアクセスできる" do
    login_as(:admin_staff)
    get kitchen_path
    assert_response :success
    get cashier_path
    assert_response :success
    get admin_staffs_path
    assert_response :success
  end

  private

  def login_as(fixture_name)
    post login_path, params: { login_id: staffs(fixture_name).login_id, password: "password" }
  end
end
