class CreatePaymentMethods < ActiveRecord::Migration[8.1]
  # 決済方法マスタ（ADR-0014）。Order へは FK を張らず、会計時に name を
  # スナップショットする（マスタの改名・削除が会計済みの歴史を書き換えないため）。
  def up
    create_table :payment_methods do |t|
      t.string  :name,    null: false
      t.boolean :enabled, null: false, default: true

      t.timestamps
    end
    add_index :payment_methods, :name, unique: true

    # 初期マスタ（既存環境用）。新規環境は db/seeds.rb が同じ行を冪等に投入する。
    execute <<~SQL
      INSERT INTO payment_methods (name, enabled, created_at, updated_at)
      VALUES ('現金', TRUE, NOW(), NOW()), ('クレジットカード', TRUE, NOW(), NOW())
    SQL

    # 既存注文のスラッグを名前スナップショットへ一括移行（ADR-0014）。
    # 以後 orders.payment_method は常に「決済方法の name がそのまま入っている」単一意味論。
    execute "UPDATE orders SET payment_method = '現金' WHERE payment_method = 'cash'"
    execute "UPDATE orders SET payment_method = 'クレジットカード' WHERE payment_method = 'credit_card'"
  end

  def down
    execute "UPDATE orders SET payment_method = 'cash' WHERE payment_method = '現金'"
    execute "UPDATE orders SET payment_method = 'credit_card' WHERE payment_method = 'クレジットカード'"
    drop_table :payment_methods
  end
end
