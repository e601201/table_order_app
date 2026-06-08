module Admin
  # 閲覧専用の注文管理（ADR-0005）。Admin は本日の全注文を俯瞰・詳細閲覧できるが、
  # 二軸（調理進捗 / 支払い）の遷移は行わない。それらは Kitchen / Cashier が所有する。
  class OrdersController < ApplicationController
    include Admin::OrderRows

    before_action :require_login!
    before_action -> { authorize_roles!(:admin) }

    def index
      orders = Order.placed_today.includes(:order_items).order(placed_at: :desc)
      render inertia: "admin/Orders", props: {
        orders: orders.map { |order| serialize_row(order) },
        stats: order_stats
      }
    end

    def show
      order = Order.includes(:order_items).find_by(id: params[:id])
      return redirect_to(admin_orders_path) if order.nil?

      render inertia: "admin/OrderDetail", props: {
        order: serialize_detail(order)
      }
    end

    private

    # 本日のみ。売上は会計済み（Paid）の total 合計、会計待ちは Served + Unpaid のみ（ADR-0005）。
    def order_stats
      today = Order.placed_today
      {
        orders_count: today.count,
        in_progress_count: today.in_progress.count,
        sales_total: today.where.not(paid_at: nil).sum(:total),
        awaiting_payment_count: today.awaiting_payment.count
      }
    end

    # 詳細。行の情報に加えて全明細と金額内訳・支払い情報を含める。
    def serialize_detail(order)
      serialize_row(order).merge(
        subtotal: order.subtotal,
        tax: order.tax,
        paid_at: order.paid_at&.iso8601,
        payment_method: order.payment_method,
        items: order.order_items.map { |item| serialize_item(item) }
      )
    end

    def serialize_item(item)
      {
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        line_total: item.line_total,
        size_label: item.size_label,
        addons: item.addons
      }
    end
  end
end
