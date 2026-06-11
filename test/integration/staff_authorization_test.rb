require "test_helper"

class StaffAuthorizationTest < ActionDispatch::IntegrationTest
  # takeout 面は ADR-0008 で LINE ログイン必須になったため、公開なのは In-store のみ
  # （takeout のゲートは orders_controller_test で担保）。
  test "/order（In-store）と / は未ログインでも公開されている" do
    get root_path
    assert_response :success

    get "/order", params: { order_type: "in_store", table_number: 5 }
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

  test "kitchen はスタッフの編集・更新・削除ができない" do
    login_as(:kitchen_staff)
    target = staffs(:cashier_staff)

    get edit_admin_staff_path(target)
    assert_redirected_to kitchen_path

    patch admin_staff_path(target), params: { name: "侵入" }
    assert_redirected_to kitchen_path
    assert_equal "レジ担当", target.reload.name

    assert_no_difference "Staff.count" do
      delete admin_staff_path(target)
    end
    assert_redirected_to kitchen_path
  end

  test "cashier は /cashier にアクセスできる" do
    login_as(:cashier_staff)
    get cashier_path
    assert_response :success
  end

  test "admin は全スタッフ画面にアクセスできる" do
    login_as(:admin_staff)
    get admin_dashboard_path
    assert_response :success
    get kitchen_path
    assert_response :success
    get cashier_path
    assert_response :success
    get admin_staffs_path
    assert_response :success
  end

  test "admin はログイン後ダッシュボードへ遷移する" do
    login_as(:admin_staff)
    assert_redirected_to admin_dashboard_path
  end

  private

  def login_as(fixture_name)
    post login_path, params: { login_id: staffs(fixture_name).login_id, password: "password" }
  end
end
