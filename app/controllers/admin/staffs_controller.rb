module Admin
  class StaffsController < ApplicationController
    before_action :require_login!
    before_action -> { authorize_roles!(:admin) }

    def index
      render inertia: "admin/Staffs", props: {
        staffs: Staff.order(:role, :login_id).map { |staff| serialize_staff(staff) },
        roles: Staff.roles.keys
      }
    end

    def create
      staff = Staff.new(staff_params)

      if staff.save
        redirect_to admin_staffs_path, notice: "スタッフ「#{staff.name}」を登録しました"
      else
        redirect_to admin_staffs_path, inertia: { errors: staff.errors }
      end
    end

    private

    def staff_params
      params.permit(:login_id, :name, :role, :password, :password_confirmation)
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
