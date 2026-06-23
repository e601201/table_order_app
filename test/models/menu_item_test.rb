require "test_helper"

class MenuItemTest < ActiveSupport::TestCase
  def valid_attrs(overrides = {})
    {
      category: "burgers",
      name: "テストバーガー",
      description: "説明",
      base_price: 500,
      calories: 600,
      recommended: false,
      max_quantity: 10,
      sizes: [ { "id" => "regular", "label" => "レギュラー", "extra" => 0 } ],
      addons: []
    }.merge(overrides)
  end

  test "有効な MenuItem は保存できる" do
    item = MenuItem.new(valid_attrs)
    assert item.valid?, item.errors.full_messages.to_sentence
  end

  test "name は必須" do
    item = MenuItem.new(valid_attrs(name: ""))
    assert_not item.valid?
    assert_includes item.errors[:name], "can't be blank"
  end

  test "category は CATEGORIES に含まれる必要がある" do
    assert_not MenuItem.new(valid_attrs(category: "unknown")).valid?
    MenuItem::CATEGORIES.each do |c|
      assert MenuItem.new(valid_attrs(category: c)).valid?, "#{c} は有効なはず"
    end
  end

  test "base_price は 0 以上" do
    assert_not MenuItem.new(valid_attrs(base_price: -1)).valid?
    assert MenuItem.new(valid_attrs(base_price: 0)).valid?
  end

  test "calories は 0 以上" do
    assert_not MenuItem.new(valid_attrs(calories: -1)).valid?
    assert MenuItem.new(valid_attrs(calories: 0)).valid?
  end

  test "max_quantity は 1 以上" do
    assert_not MenuItem.new(valid_attrs(max_quantity: 0)).valid?
    assert MenuItem.new(valid_attrs(max_quantity: 1)).valid?
  end

  # 在庫（ADR-0011）: 売り切れは stock からの派生で、独立フラグではない。
  test "sold_out? は stock が 0 のときだけ true（nil は無制限で false）" do
    assert MenuItem.new(valid_attrs(stock: 0)).sold_out?, "stock=0 は売り切れ"
    assert_not MenuItem.new(valid_attrs(stock: 5)).sold_out?, "stock>0 は売り切れでない"
    assert_not MenuItem.new(valid_attrs(stock: nil)).sold_out?, "stock=nil（無制限）は売り切れでない"
  end

  # 販売可否は suspended（手動停止）と stock（売り切れ）の AND（ADR-0011）。
  test "sellable? は suspended と stock の AND で決まる" do
    assert MenuItem.new(valid_attrs(stock: 3, suspended: false)).sellable?, "在庫あり・未停止 → 可"
    assert MenuItem.new(valid_attrs(stock: nil, suspended: false)).sellable?, "無制限・未停止 → 可"
    assert_not MenuItem.new(valid_attrs(stock: 0, suspended: false)).sellable?, "売り切れ → 不可"
    assert_not MenuItem.new(valid_attrs(stock: 3, suspended: true)).sellable?, "在庫あっても停止 → 不可"
    assert_not MenuItem.new(valid_attrs(stock: nil, suspended: true)).sellable?, "無制限でも停止 → 不可"
  end

  test "stock は present のとき 0 以上の整数（nil は無制限で許容）" do
    assert MenuItem.new(valid_attrs(stock: nil)).valid?, "nil は許容"
    assert MenuItem.new(valid_attrs(stock: 0)).valid?
    assert MenuItem.new(valid_attrs(stock: 5)).valid?
    assert_not MenuItem.new(valid_attrs(stock: -1)).valid?, "負数は不可"
  end

  test "as_customer_json は sellable を含み、残数(stock)を漏らさない" do
    sold = MenuItem.new(valid_attrs(stock: 0)).as_customer_json(image_variant: :thumb)
    assert_equal false, sold[:sellable]
    assert_not sold.key?(:stock), "残数は顧客に漏らさない"

    available = MenuItem.new(valid_attrs(stock: 5)).as_customer_json(image_variant: :thumb)
    assert_equal true, available[:sellable]
  end

  test "sizes は最低1要素が必要" do
    item = MenuItem.new(valid_attrs(sizes: []))
    assert_not item.valid?
    assert_includes item.errors[:sizes], "は最低1つ必要です"
  end

  test "size の extra は 0 以上" do
    item = MenuItem.new(valid_attrs(sizes: [ { "id" => "r", "label" => "R", "extra" => -1 } ]))
    assert_not item.valid?
  end

  test "size は label が必須" do
    assert_not MenuItem.new(valid_attrs(sizes: [ { "id" => "r", "label" => "", "extra" => 0 } ])).valid?
  end

  test "size の id 未指定は label から採番され有効になる" do
    assert MenuItem.new(valid_attrs(sizes: [ { "id" => "", "label" => "Regular", "extra" => 0 } ])).valid?
  end

  test "addons は空でもよい" do
    assert MenuItem.new(valid_attrs(addons: [])).valid?
  end

  test "addon は id と label が必須・extra は 0 以上" do
    assert_not MenuItem.new(valid_attrs(addons: [ { "id" => "c", "label" => "", "extra" => 0 } ])).valid?
    assert_not MenuItem.new(valid_attrs(addons: [ { "id" => "c", "label" => "チーズ", "extra" => -1 } ])).valid?
    assert MenuItem.new(valid_attrs(addons: [ { "id" => "c", "label" => "チーズ", "extra" => 50 } ])).valid?
  end

  test "extra は文字列で来ても整数として保存される" do
    item = MenuItem.create!(valid_attrs(
      sizes: [ { "id" => "large", "label" => "ラージ", "extra" => "100" } ]
    ))
    assert_equal 100, item.reload.sizes.first["extra"]
  end

  test "id が空の新規 option には安定 id が採番される" do
    item = MenuItem.create!(valid_attrs(
      sizes: [ { "id" => "", "label" => "レギュラー", "extra" => 0 } ]
    ))
    assert item.reload.sizes.first["id"].present?
  end

  test "既存 option の id は保存時に再生成されない（進行中カートを壊さない）" do
    item = MenuItem.create!(valid_attrs(
      sizes: [ { "id" => "large", "label" => "ラージ", "extra" => 100 } ]
    ))
    item.update!(name: "改名")
    assert_equal "large", item.reload.sizes.first["id"]
  end

  # 1x1 透過 PNG
  PNG_BYTES = Base64.decode64(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
  )

  def attach_png(item)
    item.image.attach(io: StringIO.new(PNG_BYTES), filename: "x.png", content_type: "image/png")
  end

  test "画像は画像ファイルのみ許可する" do
    item = MenuItem.new(valid_attrs)
    item.image.attach(io: StringIO.new("not an image"), filename: "x.txt", content_type: "text/plain")
    assert_not item.valid?
    assert_includes item.errors[:image], "は画像ファイルを指定してください"
  end

  test "画像 PNG は有効" do
    item = MenuItem.new(valid_attrs)
    attach_png(item)
    assert item.valid?, item.errors.full_messages.to_sentence
  end

  test "image_url は画像未設定なら placeholder を返す" do
    item = MenuItem.new(valid_attrs)
    assert_match(/\Adata:image\/svg/, item.image_url(:thumb))
  end

  test "image_url は画像設定済みなら representation のパスを返す" do
    item = MenuItem.create!(valid_attrs)
    attach_png(item)
    assert_match(%r{/rails/active_storage/}, item.image_url(:thumb))
  end
end
