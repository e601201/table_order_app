module Admin
  class SettingsController < ApplicationController
    before_action :require_login!
    before_action -> { authorize_roles!(:admin) }

    # 設定（ADR-0014）。現在の中身は決済方法マスタのみ。
    # 将来の設定項目はこのページにセクションとして追い足す。
    def index
      render inertia: "admin/Settings", props: {
        payment_methods: PaymentMethod.order(:id).map { |method| serialize_payment_method(method) }
      }
    end

    private

    def serialize_payment_method(method)
      {
        id: method.id,
        name: method.name,
        enabled: method.enabled
      }
    end
  end
end
