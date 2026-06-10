# LineAccount = Takeout 時に Customer が名乗る永続化された LINE 身元（ADR-0008）。
class CreateLineAccounts < ActiveRecord::Migration[8.1]
  def change
    create_table :line_accounts do |t|
      t.string :line_user_id, null: false
      t.string :display_name

      t.timestamps
    end
    add_index :line_accounts, :line_user_id, unique: true
  end
end
