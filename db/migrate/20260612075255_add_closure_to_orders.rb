class AddClosureToOrders < ActiveRecord::Migration[8.1]
  def change
    add_column :orders, :closed_at, :datetime
    add_index :orders, :closed_at
    add_column :orders, :closure_reason, :integer
  end
end
