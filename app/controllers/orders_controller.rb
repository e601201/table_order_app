class OrdersController < ApplicationController
  def home
    render inertia: "orders/Home", props: {
      table_number: params[:table_number]&.to_i || 5,
      restaurant_name: "Burger House"
    }
  end

  def item_detail
    render inertia: "orders/ItemDetail"
  end
end
