class ApplicationController < ActionController::Base
  include StaffAuthentication

  # Only allow modern browsers supporting webp images, web push, badges, import maps, CSS nesting, and CSS :has.
  allow_browser versions: :modern

  inertia_share do
    {
      auth: {
        staff: current_staff&.as_json(only: %i[id name role login_id]),
        signed_in: staff_signed_in?
      },
      flash: {
        notice: flash.notice,
        alert: flash.alert
      }
    }
  end
end
