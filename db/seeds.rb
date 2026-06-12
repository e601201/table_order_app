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

# Admin 統計ダッシュボード（ADR-0005）の動作確認用デモ注文。dev のみ。
# 日付は実行日基準（過去7日／前日／本日）で散らす。再実行時は接頭辞付きのみ作り直し、
# 実データ・本番には触れない。KPI=本日 paid 売上 / placed 注文数 / 平均注文単価＋前日比、
# 売上推移=paid×paid_at の7日、人気メニュー=本日 placed の Σquantity、最近の注文=本日 desc。
if Rails.env.development?
  Order.where("order_number LIKE ?", "#DEMO-%").destroy_all

  # テイクアウトのデモ注文用 LineAccount（Takeout Order は LineAccount 必須。ADR-0008）
  demo_line_account = LineAccount.find_or_create_by!(line_user_id: "U-demo-0000000000000000000001") do |account|
    account.display_name = "デモ太郎"
  end

  # menu_item_id => [ 商品名（order_items.name はスナップショット）, 単価 ]
  catalog = {
    1 => [ "クラシックバーガー", 580 ],
    2 => [ "ダブルチーズ", 780 ],
    3 => [ "フィッシュバーガー", 600 ],
    4 => [ "クリスピーフライ", 320 ],
    5 => [ "チーズフライ", 380 ],
    6 => [ "アイスレモンティー", 250 ],
    7 => [ "コーラ", 220 ],
    8 => [ "キッズミール", 490 ]
  }

  demo_seq = 0
  build_demo_order = lambda do |placed_at:, status:, lines:, paid_at: nil, table_number: nil,
                                 closed_at: nil, closure_reason: nil|
    demo_seq += 1
    subtotal = lines.sum { |id, qty| catalog.fetch(id)[1] * qty }
    tax = (subtotal * 0.1).round
    order = Order.create!(
      order_number: format("#DEMO-%03d", demo_seq),
      order_type: table_number ? :in_store : :takeout,
      table_number: table_number,
      line_account: table_number ? nil : demo_line_account, # takeout は LineAccount 必須（ADR-0008）
      status: status,
      subtotal: subtotal,
      tax: tax,
      total: subtotal + tax,
      placed_at: placed_at,
      paid_at: paid_at,
      payment_method: paid_at ? "cash" : nil,
      closed_at: closed_at,
      closure_reason: closure_reason
    )
    lines.each do |id, qty|
      name, price = catalog.fetch(id)
      order.order_items.create!(
        menu_item_id: id, name: name, quantity: qty,
        unit_price: price, line_total: price * qty, size_label: "レギュラー", addons: []
      )
    end
    order
  end

  # 日付は実行日（Time.zone.today）基準で固定する。now 相対のオフセットは日跨ぎで
  # 集計母集団が揺れるため使わない（ダッシュボードも同じ today を見るので必ず整合する）。
  today = Time.zone.today
  day_at = ->(date, hour) { date.in_time_zone.change(hour: hour) }

  # 売上推移（6〜2日前）: 会計済み注文を paid_at で日割り。バー高さが変わるよう金額を散らす。
  {
    6 => [ [ 1, 2 ], [ 4, 1 ] ],
    5 => [ [ 2, 1 ], [ 7, 2 ] ],
    4 => [ [ 1, 1 ], [ 3, 1 ], [ 6, 1 ] ],
    3 => [ [ 2, 2 ], [ 5, 1 ] ],
    2 => [ [ 8, 2 ], [ 7, 1 ] ]
  }.each do |days_ago, lines|
    at = day_at.call(today - days_ago, 12)
    build_demo_order.call(placed_at: at, paid_at: at, status: :served, table_number: 5, lines: lines)
  end

  # 前日（前日比の分母＋7日トレンドの前日バー）: 会計済み3件。
  yday = today - 1
  build_demo_order.call(placed_at: day_at.call(yday, 12), paid_at: day_at.call(yday, 12), status: :served, table_number: 3, lines: [ [ 1, 1 ], [ 7, 1 ] ])
  build_demo_order.call(placed_at: day_at.call(yday, 12), paid_at: day_at.call(yday, 12), status: :served, table_number: 6, lines: [ [ 2, 2 ] ])
  build_demo_order.call(placed_at: day_at.call(yday, 13), paid_at: day_at.call(yday, 13), status: :served, table_number: 8, lines: [ [ 5, 1 ], [ 6, 2 ] ])

  # 本日・会計済み（KPI 売上／平均注文単価／本日トレンドバー）。
  build_demo_order.call(placed_at: day_at.call(today, 9), paid_at: day_at.call(today, 9), status: :served, table_number: 1, lines: [ [ 1, 2 ], [ 7, 2 ] ])
  build_demo_order.call(placed_at: day_at.call(today, 10), paid_at: day_at.call(today, 10), status: :served, table_number: 2, lines: [ [ 2, 1 ], [ 4, 1 ] ])
  build_demo_order.call(placed_at: day_at.call(today, 11), paid_at: day_at.call(today, 11), status: :served, lines: [ [ 8, 1 ], [ 6, 1 ] ]) # テイクアウト

  # 本日・未会計（注文数・人気メニューには入るが売上には入らない。最近の注文で2バッジを確認）。
  # 後ろの時刻ほど新しいため、未会計（多様な調理状態）が「最近の注文」上位に並ぶ。
  build_demo_order.call(placed_at: day_at.call(today, 12), status: :pending, table_number: 4, lines: [ [ 3, 1 ] ])
  build_demo_order.call(placed_at: day_at.call(today, 13), status: :in_progress, table_number: 7, lines: [ [ 1, 1 ], [ 5, 1 ] ])
  build_demo_order.call(placed_at: day_at.call(today, 14), status: :ready, table_number: 9, lines: [ [ 2, 1 ] ])
  build_demo_order.call(placed_at: day_at.call(today, 15), status: :served, table_number: 10, lines: [ [ 6, 3 ] ]) # 提供済み・未会計（会計待ち）
  build_demo_order.call(placed_at: day_at.call(today, 16), status: :ready, lines: [ [ 3, 1 ], [ 7, 1 ] ]) # テイクアウト・できあがり（Ready + Unpaid = 会計待ち。ADR-0009）

  # 本日・打ち切り済み（ADR-0010）: kitchen 軸は凍結のまま payment 軸だけ Closed。
  # 全作業キュー外に出てレジの「打ち切り済み」タブ（reopen 導線）と Admin 俯瞰でだけ見える。
  build_demo_order.call(placed_at: day_at.call(today, 13), status: :ready,
                        closed_at: day_at.call(today, 14), closure_reason: :no_show,
                        lines: [ [ 1, 1 ], [ 6, 1 ] ]) # テイクアウト・来店なし（Ready で凍結）
  build_demo_order.call(placed_at: day_at.call(today, 14), status: :pending, table_number: 11,
                        closed_at: day_at.call(today, 14), closure_reason: :customer_request,
                        lines: [ [ 4, 1 ] ]) # In-store・お客様都合（Pending で凍結）

  puts "デモ注文を #{Order.where('order_number LIKE ?', '#DEMO-%').count} 件シードしました（dev のみ）"
end
