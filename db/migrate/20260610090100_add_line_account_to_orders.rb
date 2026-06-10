# Takeout Order は必ず1つの LineAccount を持つ（In-store は決して持たない。ADR-0008）。
# 既存 takeout 行はリセット容認のため、後方互換のデータ移行は行わない。
# service_notification_token は Checkout 時に発行されるサービス通知トークン
# （1年有効・最大5通・送信ごとに値が更新される）。
class AddLineAccountToOrders < ActiveRecord::Migration[8.1]
  def change
    add_reference :orders, :line_account, foreign_key: true
    add_column :orders, :service_notification_token, :string
  end
end
