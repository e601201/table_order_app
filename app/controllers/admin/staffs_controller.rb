module Admin
  class StaffsController < ApplicationController
    before_action :require_login!
    before_action -> { authorize_roles!(:admin) }

    def index
      render inertia: "admin/Staffs", props: {
        staffs: Staff.order(:role, :login_id).map { |staff| serialize_staff(staff) },
        currentStaffId: current_staff.id
      }
    end

    def new
      render inertia: "admin/StaffNew", props: {
        roles: Staff.roles.keys
      }
    end

    def create
      staff = Staff.new(staff_params)

      if staff.save
        redirect_to admin_staffs_path, notice: "スタッフ「#{staff.name}」を登録しました"
      else
        redirect_to new_admin_staff_path, inertia: { errors: staff.errors }
      end
    end

    def edit
      staff = Staff.find(params[:id])
      render inertia: "admin/StaffEdit", props: {
        staff: serialize_staff(staff),
        roles: Staff.roles.keys
      }
    end

    def update
      staff = Staff.find(params[:id])

      if demoting_last_admin?(staff)
        return redirect_to edit_admin_staff_path(staff),
                           alert: "管理者は最低1人必要です。最後の管理者のロールは変更できません"
      end

      if staff.update(staff_update_params)
        redirect_to admin_staffs_path, notice: "スタッフ「#{staff.name}」を更新しました"
      else
        redirect_to edit_admin_staff_path(staff), inertia: { errors: staff.errors }
      end
    end

    def destroy
      staff = Staff.find(params[:id])

      if staff.last_admin?
        return redirect_to admin_staffs_path,
                           alert: "管理者は最低1人必要です。最後の管理者は削除できません"
      end

      if staff == current_staff
        return redirect_to admin_staffs_path, alert: "自分自身は削除できません"
      end

      staff.destroy
      redirect_to admin_staffs_path, notice: "スタッフ「#{staff.name}」を削除しました"
    end

    private

    def staff_params
      params.permit(:login_id, :name, :role, :password, :password_confirmation)
    end

    # 編集では login_id は不変。password は空欄なら has_secure_password が据え置く。
    def staff_update_params
      params.permit(:name, :role, :password, :password_confirmation)
    end

    # 最後の管理者を管理者以外のロールに変更しようとしているか。
    def demoting_last_admin?(staff)
      new_role = staff_update_params[:role]
      staff.last_admin? && new_role.present? && new_role.to_s != "admin"
    end

    def serialize_staff(staff)
      {
        id: staff.id,
        login_id: staff.login_id,
        name: staff.name,
        role: staff.role,
        created_at: staff.created_at.iso8601
      }
    end
  end
end
