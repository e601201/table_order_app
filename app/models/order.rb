class Order < ApplicationRecord
  has_many :order_items, dependent: :destroy

  enum :status, { pending: 0 }, default: :pending

  validates :order_number, presence: true, uniqueness: true
  validates :table_number, :subtotal, :tax, :total, :placed_at, presence: true
end
