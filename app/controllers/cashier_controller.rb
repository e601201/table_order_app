class CashierController < ApplicationController
  before_action :require_login!
  before_action -> { authorize_roles!(:cashier, :admin) }

  def dashboard
    orders = Order.for_cashier_today.includes(:order_items)
    render inertia: "cashier/Dashboard", props: {
      orders: orders.map { |o| serialize_order(o) },
      # キュー外の未払い（品切れ等の打ち切り対象）と当日の打ち切り一覧（reopen 導線）。ADR-0010
      outsideQueueOrders: Order.open_outside_cashier_queue.includes(:order_items).map { |o| serialize_order(o) },
      closedOrders: Order.closed_today.includes(:order_items).map { |o| serialize_order(o) }
    }
  end

  def payment_confirm
    order = Order.includes(:order_items).find_by(id: params[:id])
    return redirect_to(cashier_path) if order.nil?
    return redirect_to(cashier_payment_complete_path(order)) if order.paid?
    return redirect_to(cashier_path) unless payable?(order)

    render inertia: "cashier/PaymentConfirm", props: {
      order: serialize_order(order)
    }
  end

  def process_payment
    order = Order.find_by(id: params[:id])
    return redirect_to(cashier_path) if order.nil?
    return redirect_to(cashier_payment_complete_path(order)) if order.paid?
    return redirect_to(cashier_path) unless payable?(order)

    attributes = { paid_at: Time.zone.now, payment_method: permitted_payment_method }
    # テイクアウトは会計が手渡しを兼ねる（ADR-0009）。Served + Unpaid の中間状態を
    # 作らないよう、kitchen 軸の Served を同一更新で書く。LINE への追加通知は送らない。
    attributes[:status] = :served if order.takeout?
    order.update!(attributes)
    redirect_to cashier_payment_complete_path(order)
  end

  # 打ち切り（ADR-0010）: 未払い注文を支払いなしで閉じる。kitchen 軸（status）には
  # 一切触れない — 止まっていた場所で凍結する。Unpaid 限定・理由必須・order type 整合は
  # モデルのバリデーションが境界（不正な組合せは update が false を返し盤面へ差し戻す）。
  def close_order
    order = Order.find_by(id: params[:id])
    return redirect_to(cashier_path) if order.nil?
    # 再打ち切りは理由の上書きになるため拒否（Paid はモデルの排他バリデーションが弾く）。
    return redirect_to(cashier_path, alert: "この注文は打ち切れません") if order.closed?

    if order.update(closed_at: Time.zone.now, closure_reason: permitted_closure_reason)
      redirect_to cashier_path
    else
      redirect_to cashier_path, alert: "この注文は打ち切れません"
    end
  end

  # 打ち切り解除（ADR-0010）: 早すぎた判断の訂正。Unpaid に戻すと kitchen 軸は凍結された
  # ままなので、元のキュー（Takeout なら Ready + Unpaid の会計待ち）に自然に再出現する。
  # 正準シナリオは「no_show で打ち切った直後に客が現れた」。イベントは発生させない。
  def reopen_order
    order = Order.find_by(id: params[:id])
    return redirect_to(cashier_path) if order.nil?
    return redirect_to(cashier_path, alert: "打ち切られていない注文です") unless order.closed?

    order.update!(closed_at: nil, closure_reason: nil)
    redirect_to cashier_path
  end

  def payment_complete
    order = Order.includes(:order_items).find_by(id: params[:id])
    return redirect_to(cashier_path) if order.nil? || !order.paid?

    render inertia: "cashier/PaymentComplete", props: {
      payment: serialize_order(order)
    }
  end

  private

  # 会計の前提（ADR-0009）: In-store は提供済み（Served）が前提。Takeout は手渡しが
  # 会計と同時のため できあがり（Ready）が前提 — 旧フローの Served + Unpaid は通らない。
  # 打ち切り済み（Closed）は会計不可 — 先に打ち切り解除が必要（ADR-0010）。
  def payable?(order)
    return false if order.closed?

    order.takeout? ? order.ready? : order.served?
  end

  def permitted_payment_method
    method = params[:payment_method].to_s
    %w[cash credit_card].include?(method) ? method : "cash"
  end

  # enum 外の値は nil に落とし、closure_reason の presence バリデーションに委ねる
  # （enum への不正値代入は ArgumentError になるため事前に濾す）。
  def permitted_closure_reason
    reason = params[:closure_reason].to_s
    Order.closure_reasons.key?(reason) ? reason : nil
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
      closed_at: order.closed_at&.iso8601,
      closure_reason: order.closure_reason,
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
