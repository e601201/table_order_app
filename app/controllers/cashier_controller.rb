class CashierController < ApplicationController
  def dashboard
    render inertia: "cashier/Dashboard"
  end
end
