# 客側（Takeout）の LINE 認証（ADR-0008）。Staff 認証（session[:staff_id]）とは
# 完全に独立で、session[:line_account_id] のみを使う。In-store フローはこのコードを通らない。
module LineAuthentication
  extend ActiveSupport::Concern

  private

  def current_line_account
    @current_line_account ||= LineAccount.find_by(id: session[:line_account_id]) if session[:line_account_id]
  end

  def line_logged_in?
    current_line_account.present?
  end

  # 未ログインならログイン誘導ページへ（LIFF 内なら liff.login() → ID トークン POST で即復帰）。
  # GET/HEAD は元 URL を退避してログイン成功後に戻す（StaffAuthentication#require_login! と対称。
  # POST 等は退避しない — ログイン後の再 POST はできないため）。
  def require_line_login!
    return if line_logged_in?

    session[:line_return_to] = request.fullpath if request.get? || request.head?
    redirect_to line_login_path
  end
end
