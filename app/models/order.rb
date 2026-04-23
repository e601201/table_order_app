class Order < ApplicationRecord
  has_many :order_items, dependent: :destroy

  enum :status, { pending: 0, in_progress: 1, ready: 2, completed: 3 }, default: :pending

  validates :order_number, presence: true, uniqueness: true
  validates :table_number, :subtotal, :tax, :total, :placed_at, presence: true
end
