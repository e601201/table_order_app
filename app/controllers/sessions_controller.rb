class SessionsController < ApplicationController
  def new
    return redirect_to(staff_home_path(current_staff)) if staff_signed_in?

    render inertia: "Login"
  end

  def create
    staff = Staff.find_by(login_id: params[:login_id])

    if staff&.authenticate(params[:password])
      destination = session[:return_to]
      reset_session # セッション固定化攻撃を防ぐ
      session[:staff_id] = staff.id
      redirect_to destination || staff_home_path(staff), notice: "ログインしました"
    else
      redirect_to login_path, inertia: {
        errors: { login_id: "ログイン名またはパスワードが正しくありません" }
      }
    end
  end

  def destroy
    reset_session
    redirect_to login_path, notice: "ログアウトしました"
  end
end
