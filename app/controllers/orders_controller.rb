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

  def cart_review
    render inertia: "orders/CartReview", props: {
      table_number: params[:table_number]&.to_i || 5
    }
  end

  def order_complete
    render inertia: "orders/OrderComplete", props: {
      order_number: params[:order_number] || "#A-0247"
    }
  end
end
