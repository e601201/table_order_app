class OrderItem < ApplicationRecord
  belongs_to :order

  validates :name, :quantity, :unit_price, :line_total, presence: true
end
