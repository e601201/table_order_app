class KitchenController < ApplicationController
  before_action :require_login!
  before_action -> { authorize_roles!(:kitchen, :admin) }

  def dashboard
    orders = Order.includes(:order_items)
                  .where(placed_at: Time.zone.now.all_day)
                  .order(placed_at: :desc)
    grouped = orders.group_by(&:status)

    render inertia: "kitchen/Dashboard", props: {
      ordersByStatus: {
        pending:     serialize_orders(grouped["pending"] || []),
        in_progress: serialize_orders(grouped["in_progress"] || []),
        ready:       serialize_orders(grouped["ready"] || []),
        served:      serialize_orders(grouped["served"] || [])
      }
    }
  end

  def update_order_status
    order = Order.find(params[:id])
    order.update!(status: params.require(:status))
    notify_order_ready(order)
    redirect_to kitchen_path
  end

  private

  # OrderReady（ADR-0008）: 「ready への遷移」を保存後の変更検出で拾って通知する。
  # 厳密な「In progress → Ready」一致だと変則遷移（pending から直接 ready 等）で
  # 通知が漏れるため、遷移先が ready かどうかだけを見る。同値更新では発火しない。
  def notify_order_ready(order)
    return unless order.ready? && order.status_previously_changed?

    OrderReadyNotifier.call(order)
  end

  def serialize_orders(orders)
    orders.map do |order|
      {
        id: order.id,
        order_number: order.order_number,
        table_number: order.table_number,
        order_type: order.order_type,
        status: order.status,
        placed_at: order.placed_at.iso8601,
        items: order.order_items.map do |item|
          {
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            size_label: item.size_label,
            addons: item.addons
          }
        end
      }
    end
  end
end
