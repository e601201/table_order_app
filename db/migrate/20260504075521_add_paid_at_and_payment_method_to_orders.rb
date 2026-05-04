class AddPaidAtAndPaymentMethodToOrders < ActiveRecord::Migration[8.1]
  def change
    add_column :orders, :paid_at, :datetime
    add_column :orders, :payment_method, :string
    add_index :orders, :paid_at
  end
end
