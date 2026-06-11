# Takeout 客の LINE ログイン（ADR-0008）。LIFF が取得した ID トークンを LINE の
# 検証 API でチャネル照合し、line_user_id で LineAccount を find_or_create して
# session[:line_account_id] を確立する。スタッフ認証には一切触れない。
#
# このページ（GET /order/line_login）は **LIFF のエンドポイント URL** でもある。
# エンドポイントをゲートの内側（/order）にすると、LINE 認証コールバック
# （?code=...&state=...）が require_line_login! の 302 で code ごと剥がされ、
# LIFF SDK がログインを完了できず無限ループするため、必ずゲート外のここで受ける。
class LineSessionsController < ApplicationController
  include LineAuthentication

  # LIFF 直接入場（エンドポイント直開き・退避した戻り先なし）の行き先。
  # テイクアウト面への正規の入口なので、必ず takeout モードで /order に入れる。
  TAKEOUT_ENTRY = "/order?order_type=takeout".freeze

  # ログイン誘導ページ。LIFF 内で liff.init → liff.login → ID トークンを POST して復帰する。
  # ログイン済み（再訪）でもここで 302 せず必ず描画する — エンドポイント URL 上で liff.init を
  # 済ませてからクライアント側で入場しないと、注文確定時にエンドポイント階層外で初 init が走り
  # LINE が 400 を返す（イシュー #35）。
  def new
    render inertia: "orders/LineLogin", props: {
      liff_id: ENV["LINE_LIFF_ID"],
      logged_in: line_logged_in?,
      entry_path: TAKEOUT_ENTRY
    }
  end

  def create
    claims = LineIdTokenVerifier.verify(params[:id_token])
    if claims.nil? || claims["sub"].blank?
      return redirect_to(line_login_path, alert: "LINE ログインに失敗しました。もう一度お試しください")
    end

    account = LineAccount.find_or_create_by!(line_user_id: claims["sub"])
    # LINE プロフィール表示名は変わりうるのでログインのたびに追従する
    account.update!(display_name: claims["name"]) if claims["name"].present? && claims["name"] != account.display_name
    session[:line_account_id] = account.id

    redirect_to(session.delete(:line_return_to) || TAKEOUT_ENTRY)
  end
end
