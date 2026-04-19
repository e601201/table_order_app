class CreateOrders < ActiveRecord::Migration[8.1]
  def change
    create_table :orders do |t|
      t.string :order_number, null: false
      t.integer :table_number, null: false
      t.integer :subtotal, null: false
      t.integer :tax, null: false
      t.integer :total, null: false
      t.integer :status, null: false, default: 0
      t.datetime :placed_at, null: false

      t.timestamps
    end

    add_index :orders, :order_number, unique: true
  end
end
