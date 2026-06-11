require "test_helper"

# Takeout 客の LINE ログイン（ADR-0008）。LIFF の ID トークンを検証 API でチャネル照合し、
# line_user_id で LineAccount を find_or_create → session[:line_account_id] を確立する。
# Staff の session[:staff_id] とは完全独立。ID トークン検証は自動テストでは常にスタブ。
class LineSessionsControllerTest < ActionDispatch::IntegrationTest
  test "ログイン誘導ページを表示できる" do
    get line_login_path

    assert_response :success
    assert_inertia_component "orders/LineLogin"
    # 未ログインでは logged_in: false — クライアントは現行どおり liff.login → ID トークン POST へ進む
    assert_inertia_props logged_in: false, entry_path: "/order?order_type=takeout"
  end

  test "有効な ID トークンで LineAccount が作成されセッションが確立する" do
    assert_difference "LineAccount.count" => 1 do
      LineIdTokenVerifier.stub(:verify, { "sub" => "U-new-user", "name" => "新規ユーザー" }) do
        post line_login_path, params: { id_token: "valid-token" }
      end
    end

    # 退避した戻り先がない = LIFF エンドポイント直開きの入場なので、takeout モードへ送る
    assert_redirected_to "/order?order_type=takeout"
    account = LineAccount.find_by!(line_user_id: "U-new-user")
    assert_equal "新規ユーザー", account.display_name
  end

  test "既知の line_user_id では LineAccount を増やさず再ログインできる" do
    assert_no_difference "LineAccount.count" do
      line_login_as(line_accounts(:taro))
    end

    assert_redirected_to "/order?order_type=takeout"
  end

  test "検証に失敗した ID トークンではセッションを確立せずログイン誘導へ戻す" do
    LineIdTokenVerifier.stub(:verify, nil) do
      post line_login_path, params: { id_token: "broken-token" }
    end

    assert_redirected_to line_login_path

    # セッション未確立のまま: takeout 面へ入ろうとすると再びログイン誘導へ
    get "/order", params: { order_type: "takeout" }
    assert_redirected_to line_login_path
  end

  test "ログイン成功後は退避していた元の URL に戻る" do
    get "/order", params: { order_type: "takeout" } # ゲートが return_to を退避
    assert_redirected_to line_login_path

    line_login_as(line_accounts(:taro))
    assert_redirected_to "/order?order_type=takeout"
  end

  test "ログイン済みでもログイン誘導ページを描画し logged_in と入場先を渡す" do
    # LIFF エンドポイントは /order/line_login なので、2回目以降のミニアプリ起動もここに来る。
    # ここで 302 すると liff.init がエンドポイント URL 上で一度も走らず、注文確定時に
    # エンドポイント階層外で初 init → LINE が 400 を返す（イシュー #35）。入場はクライアント側で行う。
    line_login_as(line_accounts(:taro))

    get line_login_path
    assert_response :success
    assert_inertia_component "orders/LineLogin"
    assert_inertia_props logged_in: true, entry_path: "/order?order_type=takeout"
  end
end
