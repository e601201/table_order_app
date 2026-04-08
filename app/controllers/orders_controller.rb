class OrdersController < ApplicationController
  include MenuCatalog
  include CartSession

  def home
    lines = cart_lines
    render inertia: "orders/Home", props: {
      table_number: table_number,
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

    render inertia: "orders/OrderComplete", props: { order: last }
  end

  private

  def table_number
    params[:table_number]&.to_i || session[:table_number] || 5
  end
end
