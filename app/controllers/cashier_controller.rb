class CashierController < ApplicationController
  def dashboard
    render inertia: "cashier/Dashboard"
  end

  def payment_confirm
    render inertia: "cashier/PaymentConfirm"
  end

  def payment_complete
    render inertia: "cashier/PaymentComplete"
  end
end
