module Admin
  # 決済方法マスタの操作（ADR-0014）。設定ページ内のインライン操作専用で、
  # 成功・失敗とも常に設定ページへ差し戻す（専用の New/Edit ページは持たない）。
  # 「有効な決済方法 ≥ 1」の不変条件はモデルが境界（違反は update/destroy が false を返す）。
  class PaymentMethodsController < ApplicationController
    before_action :require_login!
    before_action -> { authorize_roles!(:admin) }

    def create
      method = PaymentMethod.new(payment_method_params)

      if method.save
        redirect_to admin_settings_path, notice: "決済方法「#{method.name}」を追加しました"
      else
        redirect_to admin_settings_path, alert: failure_alert(method)
      end
    end

    def update
      method = PaymentMethod.find(params[:id])

      if method.update(payment_method_params)
        redirect_to admin_settings_path, notice: "決済方法「#{method.name}」を更新しました"
      else
        redirect_to admin_settings_path, alert: failure_alert(method)
      end
    end

    # 物理削除（ADR-0003 流）。orders.payment_method は会計時の名前スナップショットのため
    # 履歴は壊れない。最後の有効な1つはモデルの before_destroy が abort する。
    def destroy
      method = PaymentMethod.find(params[:id])

      if method.destroy
        redirect_to admin_settings_path, notice: "決済方法「#{method.name}」を削除しました"
      else
        redirect_to admin_settings_path, alert: failure_alert(method)
      end
    end

    private

    def payment_method_params
      params.permit(:name, :enabled)
    end

    # インライン操作の失敗は設定ページの flash に日本語で出す（フォーム別ページを持たないため）。
    def failure_alert(method)
      details = method.errors.details

      if details[:enabled].present? || details[:base].present?
        "有効な決済方法は最低1つ必要です"
      elsif details[:name].to_a.any? { |d| d[:error] == :taken }
        "決済方法「#{method.name}」は既に登録されています"
      elsif details[:name].to_a.any? { |d| d[:error] == :blank }
        "決済方法の名前を入力してください"
      else
        "決済方法を保存できませんでした"
      end
    end
  end
end
