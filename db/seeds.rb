# This file should ensure the existence of records required to run the application in every environment (production,
# development, test). The code here should be idempotent so that it can be executed at any point in every environment.
# The data can then be loaded with the bin/rails db:seed command (or created alongside the database with db:setup).
#
# Example:
#
#   ["Action", "Comedy", "Drama", "Horror"].each do |genre_name|
#     MovieGenre.find_or_create_by!(name: genre_name)
#   end

# 初回 Admin の投入（鶏卵問題の回避）。
# 公開サインアップは持たないため、最初の Admin はここで作成する。
# 本番環境では INITIAL_ADMIN_PASSWORD を設定すること。
if Staff.where(role: :admin).none?
  Staff.create!(
    login_id: "admin",
    name:     "管理者",
    role:     :admin,
    password: ENV.fetch("INITIAL_ADMIN_PASSWORD", "password")
  )
  puts "初回 Admin を作成しました (login_id: admin)"
end
