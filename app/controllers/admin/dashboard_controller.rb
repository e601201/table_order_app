module Admin
  # 管理者コンソールの入口ハブ。各管理画面・スタッフ画面への導線のみを提供し、
  # 集計は持たない（意図的な先送り。ADR-0005 更新ノート参照）。
  class DashboardController < ApplicationController
    before_action :require_login!
    before_action -> { authorize_roles!(:admin) }

    def index
      render inertia: "admin/Dashboard"
    end
  end
end
