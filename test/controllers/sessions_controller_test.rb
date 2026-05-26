require "test_helper"

class SessionsControllerTest < ActionDispatch::IntegrationTest
  test "ログインページを表示できる" do
    get login_path
    assert_response :success
  end

  test "ログイン済みならホームへリダイレクト" do
    login_as(:kitchen_staff)
    get login_path
    assert_redirected_to kitchen_path
  end

  test "正しい認証情報でログインでき、ロールのホームへ遷移する" do
    post login_path, params: { login_id: "admin1", password: "password" }
    assert_redirected_to admin_staffs_path
    assert_equal "ログインしました", flash[:notice]
  end

  test "kitchen はログイン後 /kitchen へ遷移する" do
    post login_path, params: { login_id: "kitchen1", password: "password" }
    assert_redirected_to kitchen_path
  end

  test "cashier はログイン後 /cashier へ遷移する" do
    post login_path, params: { login_id: "cashier1", password: "password" }
    assert_redirected_to cashier_path
  end

  test "誤ったパスワードではログインできない" do
    post login_path, params: { login_id: "kitchen1", password: "wrong" }
    assert_redirected_to login_path
  end

  test "存在しないログイン名ではログインできない" do
    post login_path, params: { login_id: "nobody", password: "password" }
    assert_redirected_to login_path
  end

  test "ログイン後は退避した元 URL に戻る" do
    get kitchen_path # 未ログインで保護画面へ → return_to に保存
    post login_path, params: { login_id: "kitchen1", password: "password" }
    assert_redirected_to kitchen_path
  end

  test "ログアウトできる" do
    login_as(:cashier_staff)
    delete logout_path
    assert_redirected_to login_path
    assert_equal "ログアウトしました", flash[:notice]

    get cashier_path
    assert_redirected_to login_path # ログアウト後は保護画面に入れない
  end

  private

  def login_as(fixture_name)
    post login_path, params: { login_id: staffs(fixture_name).login_id, password: "password" }
  end
end
