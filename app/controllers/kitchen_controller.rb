class KitchenController < ApplicationController
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
        completed:   serialize_orders(grouped["completed"] || [])
      }
    }
  end

  def update_order_status
    order = Order.find(params[:id])
    order.update!(status: params.require(:status))
    redirect_to kitchen_path
  end

  private

  def serialize_orders(orders)
    orders.map do |order|
      {
        id: order.id,
        order_number: order.order_number,
        table_number: order.table_number,
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
