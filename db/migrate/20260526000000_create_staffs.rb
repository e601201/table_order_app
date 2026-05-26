class CreateStaffs < ActiveRecord::Migration[8.1]
  def change
    create_table :staffs do |t|
      t.string  :login_id,        null: false
      t.string  :password_digest, null: false
      t.integer :role,            null: false
      t.string  :name,            null: false

      t.timestamps
    end

    add_index :staffs, :login_id, unique: true
  end
end
