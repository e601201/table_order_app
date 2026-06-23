class AddInventoryToMenuItems < ActiveRecord::Migration[8.1]
  def change
    # stock: nil = 在庫無制限（追跡しない）。整数 = 追跡し、0 で売り切れ（ADR-0011）。
    add_column :menu_items, :stock, :integer
    # suspended: Admin の手動販売停止。在庫と独立したゲート（ADR-0011）。
    add_column :menu_items, :suspended, :boolean, null: false, default: false
  end
end
