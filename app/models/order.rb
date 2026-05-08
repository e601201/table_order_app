class Order < ApplicationRecord
  has_many :order_items, dependent: :destroy

  enum :status, { pending: 0, in_progress: 1, ready: 2, completed: 3 }, default: :pending

  validates :order_number, presence: true, uniqueness: true
  validates :table_number, :subtotal, :tax, :total, :placed_at, presence: true

  scope :for_cashier_today, -> {
    today_orders = where(placed_at: Time.zone.today.all_day)
    today_orders.where(status: :completed)
                .or(today_orders.where.not(paid_at: nil))
                .order(Arel.sql("paid_at IS NULL DESC"))
                .order(placed_at: :desc)
  }

  def paid?
    paid_at.present?
  end

  def payment_status
    paid? ? "paid" : "unpaid"
  end
end
