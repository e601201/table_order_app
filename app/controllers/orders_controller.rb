class OrdersController < ApplicationController
  include MenuCatalog
  include CartSession

  def home
    lines = cart_lines
    render inertia: "orders/Home", props: {
      table_number: table_number,
      order_type: order_type,
      restaurant_name: "Burger House",
      menu_items: MENU_ITEMS,
      cart_count: lines.sum { |l| l[:quantity] }
    }
  end

  def item_detail
    item = find_menu_item(params[:id])
    return redirect_to("/order") unless item

    render inertia: "orders/ItemDetail", props: { item: item }
  end

  def cart_review
    lines = cart_lines
    render inertia: "orders/CartReview", props: {
      table_number: table_number,
      order_type: order_type,
      cart_items: lines,
      totals: cart_totals(lines)
    }
  end

  def add_to_cart
    item = find_menu_item(params[:item_id])
    return redirect_to("/order") unless item

    add_to_cart!(
      item_id: item[:id],
      size_id: params[:size_id],
      addon_ids: Array(params[:addon_ids]),
      quantity: params[:quantity].to_i.clamp(1, item[:max_quantity])
    )
    redirect_to "/order"
  end

  def update_cart_item
    update_cart_quantity(params[:line_id], params[:quantity].to_i)
    redirect_to "/order/cart"
  end

  def remove_cart_item
    remove_cart_line(params[:line_id])
    redirect_to "/order/cart"
  end

  def checkout
    lines = cart_lines
    return redirect_to("/order/cart") if lines.empty?

    session[:last_order] = {
      order_number: "#A-#{rand(1000..9999)}",
      table_number: table_number,
      order_type: order_type,
      items: lines,
      totals: cart_totals(lines),
      placed_at: Time.current.iso8601
    }
    clear_cart
    redirect_to "/order/complete"
  end

  def order_complete
    last = session.delete(:last_order)
    return redirect_to("/order") unless last

    Order.transaction do
      # 注文番号がすでに存在する場合は、注文を作成しない。
      order = Order.find_or_create_by!(order_number: last["order_number"] || last[:order_number]) do |o|
        o.order_type   = last["order_type"]   || last[:order_type] || "in_store"
        o.table_number = last["table_number"] || last[:table_number]
        o.subtotal     = last.dig("totals", "subtotal") || last.dig(:totals, :subtotal)
        o.tax          = last.dig("totals", "tax")      || last.dig(:totals, :tax)
        o.total        = last.dig("totals", "total")    || last.dig(:totals, :total)
        o.placed_at    = last["placed_at"] || last[:placed_at]
      end

      # 注文項目が空の場合は、注文項目を作成する。
      if order.order_items.empty?
        (last["items"] || last[:items]).each do |line|
          order.order_items.create!(
            menu_item_id: line["item_id"]    || line[:item_id],
            name:         line["name"]       || line[:name],
            size_id:      line["size_id"]    || line[:size_id],
            size_label:   line["size_label"] || line[:size_label],
            addons:       line["addons"]     || line[:addons] || [],
            unit_price:   line["unit_price"] || line[:unit_price],
            quantity:     line["quantity"]   || line[:quantity],
            line_total:   line["line_total"] || line[:line_total]
          )
        end
      end
    end

    render inertia: "orders/OrderComplete", props: { order: last }
  end

  private

  def order_type
    if params[:order_type].present? && Order.order_types.key?(params[:order_type])
      session[:order_type] = params[:order_type]
    end
    session[:order_type] || "in_store"
  end

  def table_number
    if params[:table_number].present?
      session[:table_number] = params[:table_number].to_i
    end
    return nil if order_type == "takeout"
    session[:table_number] || 5
  end
end
