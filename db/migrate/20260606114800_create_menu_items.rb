class CreateMenuItems < ActiveRecord::Migration[8.1]
  def change
    create_table :menu_items do |t|
      t.string  :category,     null: false
      t.string  :name,         null: false
      t.text    :description,  null: false, default: ""
      t.integer :base_price,   null: false, default: 0
      t.integer :calories,     null: false, default: 0
      t.boolean :recommended,  null: false, default: false
      t.integer :max_quantity, null: false, default: 1
      t.jsonb   :sizes,        null: false, default: []
      t.jsonb   :addons,       null: false, default: []

      t.timestamps
    end
  end
end
