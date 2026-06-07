# スタッフ認証・認可の共通ロジック。
# `/order`（客席タブレット）は公開のため ApplicationController でグローバルには適用せず、
# 保護対象の controller が個別に before_action として呼び出す。
module StaffAuthentication
  extend ActiveSupport::Concern

  included do
    helper_method :current_staff, :staff_signed_in?
  end

  private

  def current_staff
    @current_staff ||= Staff.find_by(id: session[:staff_id]) if session[:staff_id]
  end

  def staff_signed_in?
    current_staff.present?
  end

  # 未ログインなら元の URL を退避して /login へ。ログイン成功後に元ページへ戻す。
  def require_login!
    return if staff_signed_in?

    session[:return_to] = request.fullpath
    redirect_to login_path, alert: "ログインしてください"
  end

  # 許可ロール以外なら自ロールのホームへ戻す（専用 403 ページは作らない）。
  def authorize_roles!(*roles)
    return if current_staff && roles.map(&:to_s).include?(current_staff.role)

    redirect_to staff_home_path(current_staff), alert: "権限がありません"
  end

  # ロールごとのホーム画面。Admin の起点はダッシュボード（各画面への入口ハブ）。
  def staff_home_path(staff)
    case staff&.role
    when "kitchen" then kitchen_path
    when "cashier" then cashier_path
    when "admin"   then admin_dashboard_path
    else login_path
    end
  end
end
