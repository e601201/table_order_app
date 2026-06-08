class OrdersController < ApplicationController
  include MenuCatalog
  include CartSession

  def home
    # ウェルカム画面からの遷移は「新しい客のセッション開始」として Cart をクリアする
    clear_cart if params[:order_type].present?

    lines = cart_lines
    render inertia: "orders/Home", props: {
      table_number: table_number,
      order_type: order_type,
      restaurant_name: "Burger House",
      menu_items: MenuItem.with_attached_image.order(:id).map { |item| item.as_customer_json(image_variant: :thumb) },
      cart_count: lines.sum { |l| l[:quantity] }
    }
  end

  def item_detail
    item = find_menu_item(params[:id])
    return redirect_to("/order") unless item

    render inertia: "orders/ItemDetail", props: { item: item.as_customer_json(image_variant: :detail) }
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
      item_id: item.id,
      size_id: params[:size_id],
      addon_ids: Array(params[:addon_ids]),
      quantity: params[:quantity].to_i.clamp(1, item.max_quantity)
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

  # Checkout = `OrderPlaced` 書き込み境界（ADR-0007）。Cart の Line をここで
  # 永続 Order / OrderItem に書き出す。客が完了画面に到達しなくても注文は残り、
  # キッチンキューに現れる。order_number は採番＋INSERT を同一トランザクションに
  # 包み、当日キーの advisory lock で直列化する（Order.next_order_number 参照）。
  def checkout
    lines = cart_lines
    return redirect_to("/order/cart") if lines.empty?

    totals = cart_totals(lines)
    order = Order.transaction do
      new_order = Order.create!(
        order_number: Order.next_order_number,
        order_type:   order_type,
        table_number: table_number,
        subtotal:     totals[:subtotal],
        tax:          totals[:tax],
        total:        totals[:total],
        placed_at:    Time.current
      )
      lines.each do |line|
        new_order.order_items.create!(
          menu_item_id: line[:item_id],
          name:         line[:name],
          size_id:      line[:size_id],
          size_label:   line[:size_label],
          addons:       line[:addons],
          unit_price:   line[:unit_price],
          quantity:     line[:quantity],
          line_total:   line[:line_total]
        )
      end
      new_order
    end

    clear_cart
    redirect_to "/order/complete/#{order.id}"
  end

  # 完了画面は永続 Order を :id で読むだけ（副作用なし）。再表示可能。
  # 備忘録（ADR-0007 / イシュー #29）: :id は連番で列挙可能。将来は session か
  # 推測不能トークンで「自分の注文だけ」に絞るガードを足す。POC では未ガード。
  def order_complete
    order = Order.includes(:order_items).find_by(id: params[:id])
    return redirect_to("/order") unless order

    render inertia: "orders/OrderComplete", props: { order: serialize_placed_order(order) }
  end

  private

  def serialize_placed_order(order)
    {
      id:           order.id,
      order_number: order.display_number,
      table_number: order.table_number,
      order_type:   order.order_type,
      placed_at:    order.placed_at.iso8601,
      items: order.order_items.map do |item|
        {
          id:            item.id,
          name:          item.name,
          size_label:    item.size_label,
          addons:        item.addons,
          customization: order_item_customization(item),
          unit_price:    item.unit_price,
          quantity:      item.quantity,
          line_total:    item.line_total
        }
      end,
      totals: {
        subtotal:   order.subtotal,
        tax:        order.tax,
        total:      order.total,
        item_count: order.order_items.sum(&:quantity)
      }
    }
  end

  # 永続 OrderItem の size_label + addon ラベルを " · " 連結（CartSession と対称）。
  def order_item_customization(item)
    parts = []
    parts << item.size_label if item.size_label.present?
    labels = Array(item.addons).filter_map { |a| a["label"] || a[:label] }
    parts << labels.join(", ") if labels.any?
    parts.join(" · ")
  end

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
