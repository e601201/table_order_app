class AddOrderTypeAndAllowNullTableNumberToOrders < ActiveRecord::Migration[8.1]
  def change
    add_column :orders, :order_type, :integer, default: 0, null: false
    change_column_null :orders, :table_number, true
  end
end
