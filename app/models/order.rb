class Order < ApplicationRecord
  has_many :order_items, dependent: :destroy

  enum :status, { pending: 0, in_progress: 1, ready: 2, completed: 3 }, default: :pending
  enum :order_type, { in_store: 0, takeout: 1 }, default: :in_store

  validates :order_number, presence: true, uniqueness: true
  validates :subtotal, :tax, :total, :placed_at, presence: true
  validates :table_number, presence: true, if: :in_store?
  validates :table_number, absence: true, if: :takeout?

  scope :for_cashier_today, -> {
    today_orders = where(placed_at: Time.zone.today.all_day)
    today_orders.where(status: :completed)
                .or(today_orders.where.not(paid_at: nil))
                .order(Arel.sql("paid_at IS NULL DESC"))
                .order(placed_at: :desc)
  }

  # Admin 注文管理（ADR-0005）が使う日次俯瞰スコープ。
  scope :placed_today, -> { where(placed_at: Time.zone.today.all_day) }
  # 会計待ち = 提供済み（Served）かつ未会計（Unpaid）。レジ作業キューと同義。
  scope :awaiting_payment, -> { completed.where(paid_at: nil) }

  def paid?
    paid_at.present?
  end

  def payment_status
    paid? ? "paid" : "unpaid"
  end
end
