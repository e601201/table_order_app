class CreateOrderItems < ActiveRecord::Migration[8.1]
  def change
    create_table :order_items do |t|
      t.references :order, null: false, foreign_key: true
      t.integer :menu_item_id, null: false
      t.string :name, null: false
      t.string :size_id
      t.string :size_label
      t.jsonb :addons, null: false, default: []
      t.integer :unit_price, null: false
      t.integer :quantity, null: false
      t.integer :line_total, null: false

      t.timestamps
    end
  end
end
