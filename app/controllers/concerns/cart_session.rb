module CartSession
  extend ActiveSupport::Concern

  TAX_RATE = 0.10

  # Returns the raw cart array stored in session.
  # Each entry: { line_id:, item_id:, size_id:, addon_ids: [], quantity: }
  def current_cart
    session[:cart] ||= []
  end

  # Returns view-friendly cart lines, joining session entries with the menu catalog.
  def cart_lines
    current_cart.filter_map do |entry|
      item = find_menu_item(entry["item_id"] || entry[:item_id])
      next unless item

      size_id   = entry["size_id"]   || entry[:size_id]
      addon_ids = entry["addon_ids"] || entry[:addon_ids] || []
      quantity  = (entry["quantity"] || entry[:quantity]).to_i

      size  = item[:sizes].find { |s| s[:id] == size_id } || item[:sizes].first
      addons = item[:addons].select { |a| addon_ids.include?(a[:id]) }

      unit_price = item[:base_price] + (size&.dig(:extra) || 0) + addons.sum { |a| a[:extra] }

      {
        line_id: entry["line_id"] || entry[:line_id],
        item_id: item[:id],
        name: item[:name],
        customization: build_customization(size, addons),
        unit_price: unit_price,
        quantity: quantity,
        line_total: unit_price * quantity,
        image: item[:image]
      }
    end
  end

  def cart_totals(lines)
    subtotal   = lines.sum { |l| l[:line_total] }
    tax        = (subtotal * TAX_RATE).floor
    item_count = lines.sum { |l| l[:quantity] }
    {
      subtotal: subtotal,
      tax: tax,
      total: subtotal + tax,
      item_count: item_count
    }
  end

  def add_to_cart!(item_id:, size_id:, addon_ids:, quantity:)
    return if find_menu_item(item_id).nil?

    cart = current_cart
    normalized_addons = Array(addon_ids).sort
    existing = cart.find do |entry|
      (entry["item_id"] || entry[:item_id]) == item_id &&
        (entry["size_id"] || entry[:size_id]) == size_id &&
        Array(entry["addon_ids"] || entry[:addon_ids]).sort == normalized_addons
    end

    if existing
      existing["quantity"] = (existing["quantity"] || existing[:quantity]).to_i + quantity
      existing.delete(:quantity)
    else
      cart << {
        "line_id" => SecureRandom.hex(4),
        "item_id" => item_id,
        "size_id" => size_id,
        "addon_ids" => normalized_addons,
        "quantity" => quantity
      }
    end

    session[:cart] = cart
  end

  def update_cart_quantity(line_id, quantity)
    quantity = quantity.to_i
    cart = current_cart
    if quantity <= 0
      cart.reject! { |entry| (entry["line_id"] || entry[:line_id]) == line_id }
    else
      entry = cart.find { |e| (e["line_id"] || e[:line_id]) == line_id }
      entry["quantity"] = quantity if entry
    end
    session[:cart] = cart
  end

  def remove_cart_line(line_id)
    cart = current_cart
    cart.reject! { |entry| (entry["line_id"] || entry[:line_id]) == line_id }
    session[:cart] = cart
  end

  def clear_cart
    session[:cart] = []
  end

  private

  def build_customization(size, addons)
    parts = []
    parts << size[:label] if size
    parts << addons.map { |a| a[:label] }.join(", ") if addons.any?
    parts.join(" · ")
  end
end
