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

# Menu のシード（ADR-0004）。
# 既存の id 1〜11 を明示指定し、進行中カート（item_id）・過去の order_items.menu_item_id
# （由来メモ）の参照を真実のまま保つ。同梱画像（db/seeds/images/）を attach する。
default_sizes = [
  { "id" => "regular", "label" => "レギュラー", "extra" => 0 },
  { "id" => "large",   "label" => "ラージ",     "extra" => 100 },
  { "id" => "set",     "label" => "セット (フライドポテト + ドリンク)", "extra" => 250 }
]
burger_addons = [
  { "id" => "cheese", "label" => "チーズ追加", "extra" => 50 },
  { "id" => "patty",  "label" => "パティ追加", "extra" => 200 },
  { "id" => "bacon",  "label" => "ベーコン",   "extra" => 100 },
  { "id" => "egg",    "label" => "エッグ",     "extra" => 80 }
]
drink_sizes = [
  { "id" => "regular", "label" => "ミディアム", "extra" => 0 },
  { "id" => "large",   "label" => "ラージ",     "extra" => 80 }
]

menu_seed = [
  { id: 1, category: "burgers", name: "クラシックバーガー", base_price: 580, calories: 620, recommended: true, max_quantity: 10, image: "01_classic_burger.webp",
    description: "当店自慢のビーフパティに、とろけるチェダーチーズ、新鮮なレタス、完熟トマト、ピクルス、特製ハウスソースを合わせ、香ばしくトーストしたゴマ付きバンズでサンドしました。",
    sizes: default_sizes, addons: burger_addons },
  { id: 2, category: "burgers", name: "ダブルチーズ", base_price: 780, calories: 880, recommended: false, max_quantity: 8, image: "02_double_cheese.webp",
    description: "ジューシーなビーフパティを2枚重ね、ダブルチェダーチーズ、キャラメリゼした玉ねぎ、スモーキーな自家製BBQソースを合わせました。",
    sizes: default_sizes, addons: burger_addons },
  { id: 3, category: "burgers", name: "フィッシュバーガー", base_price: 600, calories: 580, recommended: false, max_quantity: 6, image: "03_fish_burger.webp",
    description: "衣がサクサクの白身魚フライに、タルタルソース、レタス、ピクルスを合わせ、ふんわりバンズでサンドしました。",
    sizes: default_sizes, addons: burger_addons },
  { id: 4, category: "sides", name: "クリスピーフライ", base_price: 320, calories: 380, recommended: false, max_quantity: 15, image: "04_crispy_fries.webp",
    description: "黄金色に揚げたフライドポテトに、海塩を軽く振りました。",
    sizes: [
      { "id" => "regular", "label" => "レギュラー", "extra" => 0 },
      { "id" => "large",   "label" => "ラージ",     "extra" => 80 }
    ],
    addons: [
      { "id" => "cheese-sauce", "label" => "チーズソース", "extra" => 60 },
      { "id" => "truffle-salt", "label" => "トリュフ塩",   "extra" => 80 }
    ] },
  { id: 5, category: "sides", name: "チーズフライ", base_price: 380, calories: 460, recommended: true, max_quantity: 10, image: "05_cheese_fries.webp",
    description: "サクサクのフライドポテトに、とろけるチェダーチーズとベーコンビッツをたっぷりかけました。",
    sizes: [
      { "id" => "regular", "label" => "レギュラー", "extra" => 0 },
      { "id" => "large",   "label" => "ラージ",     "extra" => 100 }
    ],
    addons: [] },
  { id: 6, category: "drinks", name: "アイスレモンティー", base_price: 250, calories: 90, recommended: false, max_quantity: 20, image: "06_lemon_tea.webp",
    description: "自家製の紅茶に、フレッシュレモンとほのかなハチミツを加えた爽やかなドリンクです。",
    sizes: drink_sizes, addons: [] },
  { id: 7, category: "drinks", name: "コーラ", base_price: 220, calories: 140, recommended: false, max_quantity: 20, image: "07_cola.webp",
    description: "キンキンに冷えたクラシックコーラを、霜付きグラスでお出しします。",
    sizes: drink_sizes, addons: [] },
  { id: 8, category: "kids", name: "キッズミール", base_price: 490, calories: 540, recommended: true, max_quantity: 5, image: "08_kids_meal.webp",
    description: "ミニバーガー、ミニフライドポテト、ジュースのセット。おまけのおもちゃ付きです。",
    sizes: [ { "id" => "regular", "label" => "レギュラー", "extra" => 0 } ],
    addons: [ { "id" => "extra-juice", "label" => "ジュース追加", "extra" => 80 } ] }
]

menu_seed.each do |attrs|
  image_file = attrs.delete(:image)
  item = MenuItem.find_or_initialize_by(id: attrs[:id])
  item.assign_attributes(attrs)
  item.save!

  unless item.image.attached?
    path = Rails.root.join("db/seeds/images", image_file)
    item.image.attach(io: File.open(path), filename: image_file, content_type: "image/webp")
  end
end

# 明示 id で投入したため、sequence を次の値（最大 id + 1）にリセットする。
ActiveRecord::Base.connection.reset_pk_sequence!("menu_items")
puts "Menu を #{MenuItem.count} 件シードしました"
