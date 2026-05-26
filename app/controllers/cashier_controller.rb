class CashierController < ApplicationController
  before_action :require_login!
  before_action -> { authorize_roles!(:cashier, :admin) }

  def dashboard
    orders = Order.for_cashier_today.includes(:order_items)
    render inertia: "cashier/Dashboard", props: {
      orders: orders.map { |o| serialize_order(o) }
    }
  end

  def payment_confirm
    order = Order.includes(:order_items).find_by(id: params[:id])
    return redirect_to(cashier_path) if order.nil?
    return redirect_to(cashier_payment_complete_path(order)) if order.paid?
    return redirect_to(cashier_path) unless order.completed?

    render inertia: "cashier/PaymentConfirm", props: {
      order: serialize_order(order)
    }
  end

  def process_payment
    order = Order.find_by(id: params[:id])
    return redirect_to(cashier_path) if order.nil?
    return redirect_to(cashier_payment_complete_path(order)) if order.paid?
    return redirect_to(cashier_path) unless order.completed?

    order.update!(
      paid_at: Time.zone.now,
      payment_method: permitted_payment_method
    )
    redirect_to cashier_payment_complete_path(order)
  end

  def payment_complete
    order = Order.includes(:order_items).find_by(id: params[:id])
    return redirect_to(cashier_path) if order.nil? || !order.paid?

    render inertia: "cashier/PaymentComplete", props: {
      payment: serialize_order(order)
    }
  end

  private

  def permitted_payment_method
    method = params[:payment_method].to_s
    %w[cash credit_card].include?(method) ? method : "cash"
  end

  def serialize_order(order)
    {
      id: order.id,
      order_number: order.order_number,
      table_number: order.table_number,
      order_type: order.order_type,
      status: order.status,
      payment_status: order.payment_status,
      paid_at: order.paid_at&.iso8601,
      placed_at: order.placed_at.iso8601,
      subtotal: order.subtotal,
      tax: order.tax,
      total: order.total,
      payment_method: order.payment_method,
      items: order.order_items.map do |item|
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
    }
  end
end
