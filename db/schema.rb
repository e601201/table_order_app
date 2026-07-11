# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_07_12_090000) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "active_storage_attachments", force: :cascade do |t|
    t.bigint "blob_id", null: false
    t.datetime "created_at", null: false
    t.string "name", null: false
    t.bigint "record_id", null: false
    t.string "record_type", null: false
    t.index ["blob_id"], name: "index_active_storage_attachments_on_blob_id"
    t.index ["record_type", "record_id", "name", "blob_id"], name: "index_active_storage_attachments_uniqueness", unique: true
  end

  create_table "active_storage_blobs", force: :cascade do |t|
    t.bigint "byte_size", null: false
    t.string "checksum"
    t.string "content_type"
    t.datetime "created_at", null: false
    t.string "filename", null: false
    t.string "key", null: false
    t.text "metadata"
    t.string "service_name", null: false
    t.index ["key"], name: "index_active_storage_blobs_on_key", unique: true
  end

  create_table "active_storage_variant_records", force: :cascade do |t|
    t.bigint "blob_id", null: false
    t.string "variation_digest", null: false
    t.index ["blob_id", "variation_digest"], name: "index_active_storage_variant_records_uniqueness", unique: true
  end

  create_table "line_accounts", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "display_name"
    t.string "line_user_id", null: false
    t.datetime "updated_at", null: false
    t.index ["line_user_id"], name: "index_line_accounts_on_line_user_id", unique: true
  end

  create_table "menu_items", force: :cascade do |t|
    t.jsonb "addons", default: [], null: false
    t.integer "base_price", default: 0, null: false
    t.integer "calories", default: 0, null: false
    t.string "category", null: false
    t.datetime "created_at", null: false
    t.text "description", default: "", null: false
    t.integer "max_quantity", default: 1, null: false
    t.string "name", null: false
    t.boolean "recommended", default: false, null: false
    t.jsonb "sizes", default: [], null: false
    t.integer "stock"
    t.boolean "suspended", default: false, null: false
    t.datetime "updated_at", null: false
  end

  create_table "order_items", force: :cascade do |t|
    t.jsonb "addons", default: [], null: false
    t.datetime "created_at", null: false
    t.integer "line_total", null: false
    t.integer "menu_item_id", null: false
    t.string "name", null: false
    t.bigint "order_id", null: false
    t.integer "quantity", null: false
    t.string "size_id"
    t.string "size_label"
    t.integer "unit_price", null: false
    t.datetime "updated_at", null: false
    t.index ["order_id"], name: "index_order_items_on_order_id"
  end

  create_table "orders", force: :cascade do |t|
    t.datetime "closed_at"
    t.integer "closure_reason"
    t.datetime "created_at", null: false
    t.bigint "line_account_id"
    t.string "order_number", null: false
    t.integer "order_type", default: 0, null: false
    t.datetime "paid_at"
    t.string "payment_method"
    t.datetime "placed_at", null: false
    t.string "service_notification_token"
    t.integer "status", default: 0, null: false
    t.integer "subtotal", null: false
    t.integer "table_number"
    t.integer "tax", null: false
    t.integer "total", null: false
    t.datetime "updated_at", null: false
    t.index ["closed_at"], name: "index_orders_on_closed_at"
    t.index ["line_account_id"], name: "index_orders_on_line_account_id"
    t.index ["order_number"], name: "index_orders_on_order_number", unique: true
    t.index ["paid_at"], name: "index_orders_on_paid_at"
  end

  create_table "payment_methods", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.boolean "enabled", default: true, null: false
    t.string "name", null: false
    t.datetime "updated_at", null: false
    t.index ["name"], name: "index_payment_methods_on_name", unique: true
  end

  create_table "staffs", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "login_id", null: false
    t.string "name", null: false
    t.string "password_digest", null: false
    t.integer "role", null: false
    t.datetime "updated_at", null: false
    t.index ["login_id"], name: "index_staffs_on_login_id", unique: true
  end

  add_foreign_key "active_storage_attachments", "active_storage_blobs", column: "blob_id"
  add_foreign_key "active_storage_variant_records", "active_storage_blobs", column: "blob_id"
  add_foreign_key "order_items", "orders"
  add_foreign_key "orders", "line_accounts"
end
