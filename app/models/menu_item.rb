class MenuItem < ApplicationRecord
  include Rails.application.routes.url_helpers

  # 顧客画面がカテゴリ slug でフィルタするため、enum ではなく string + inclusion で持つ（ADR-0004）。
  CATEGORIES = %w[burgers sides drinks kids].freeze

  ALLOWED_IMAGE_TYPES = %w[image/png image/jpeg image/webp image/gif].freeze
  MAX_IMAGE_BYTES = 5.megabytes

  # 画像未設定時のフォールバック（グレーのプレースホルダ）。原本ではなく即時返せる data URI。
  PLACEHOLDER_IMAGE =
    "data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='400'%20height='400'%3E" \
    "%3Crect%20width='400'%20height='400'%20fill='%23F0E0D0'/%3E%3Ctext%20x='50%25'%20y='50%25'%20" \
    "font-size='120'%20text-anchor='middle'%20dominant-baseline='central'%3E%F0%9F%8D%BD%EF%B8%8F%3C/text%3E%3C/svg%3E"

  # 一覧サムネ用 / 詳細用 variant。原本は保持し、表示時に variant を配信する（ADR-0004）。
  has_one_attached :image do |attachable|
    attachable.variant :thumb,  resize_to_limit: [ 400, 400 ]
    attachable.variant :detail, resize_to_limit: [ 1000, 1000 ]
  end

  validates :name, presence: true
  validates :category, inclusion: { in: CATEGORIES }
  validates :base_price, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
  validates :calories, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
  validates :max_quantity, numericality: { only_integer: true, greater_than_or_equal_to: 1 }
  # stock: nil = 在庫無制限（追跡しない）。present のとき 0 以上の整数（ADR-0011）。
  validates :stock, numericality: { only_integer: true, greater_than_or_equal_to: 0 }, allow_nil: true

  before_validation :normalize_options

  validate :sizes_must_have_at_least_one
  validate :options_must_be_well_formed
  validate :image_must_be_a_valid_image

  # 顧客画面へ渡す variant の URL。未設定時は placeholder を返す（同一オリジンなので only_path）。
  def image_url(variant_name)
    return PLACEHOLDER_IMAGE unless image.attached?

    rails_representation_url(image.variant(variant_name), only_path: true)
  end

  # 顧客画面（Home / ItemDetail）へ渡す props 形状。一覧は :thumb、詳細は :detail variant。
  def as_customer_json(image_variant:)
    {
      id: id,
      category: category,
      name: name,
      description: description,
      base_price: base_price,
      calories: calories,
      image: image_url(image_variant),
      recommended: recommended,
      max_quantity: max_quantity,
      sizes: sizes,
      addons: addons,
      # 顧客には販売可否の二値だけ渡す。残数（stock）は漏らさない（ADR-0011）。
      sellable: sellable?
    }
  end

  # 売り切れは stock からの派生（独立フラグではない）。nil（無制限）は売り切れにならない（ADR-0011）。
  def sold_out?
    stock == 0
  end

  # 販売可否 = 手動停止でない かつ 売り切れでない（ADR-0011）。
  def sellable?
    !suspended? && !sold_out?
  end

  private

  # フォーム送信（文字列値・symbol/string キー混在）と jsonb 読み出しを正規化する。
  # extra は整数化。id が空の新規行のみ採番し、既存 id は保持する（ADR-0004）。
  def normalize_options
    self.sizes  = Array(sizes).map { |opt| normalize_option(opt) }
    self.addons = Array(addons).map { |opt| normalize_option(opt) }
  end

  def normalize_option(opt)
    opt = opt.respond_to?(:with_indifferent_access) ? opt.with_indifferent_access : {}
    id    = opt[:id].to_s.strip
    label = opt[:label].to_s.strip
    {
      "id"    => id.presence || generate_option_id(label),
      "label" => label,
      "extra" => Integer(opt[:extra].to_s, exception: false) || 0
    }
  end

  # 新規 option の id。label から ASCII slug を起こし、不能なら hex にフォールバック。
  def generate_option_id(label)
    slug = label.downcase.gsub(/[^a-z0-9]+/, "-").delete_prefix("-").delete_suffix("-")
    slug.presence || SecureRandom.hex(4)
  end

  def sizes_must_have_at_least_one
    errors.add(:sizes, "は最低1つ必要です") unless sizes.is_a?(Array) && sizes.any?
  end

  # sizes / addons は各要素が { id, label, extra } の値オブジェクト。
  # id / label は presence、extra は 0 以上の整数であること（ADR-0004）。
  def options_must_be_well_formed
    { sizes: sizes, addons: addons }.each do |attr, options|
      next unless options.is_a?(Array)

      options.each do |opt|
        opt = opt.respond_to?(:with_indifferent_access) ? opt.with_indifferent_access : {}
        errors.add(attr, "の id は必須です") if opt[:id].to_s.strip.empty?
        errors.add(attr, "の label は必須です") if opt[:label].to_s.strip.empty?
        errors.add(attr, "の extra は0以上の整数で指定してください") unless valid_extra?(opt[:extra])
      end
    end
  end

  def valid_extra?(extra)
    Integer(extra.to_s, exception: false).then { |n| n && n >= 0 }
  end

  def image_must_be_a_valid_image
    return unless image.attached?

    unless image.content_type.in?(ALLOWED_IMAGE_TYPES)
      errors.add(:image, "は画像ファイルを指定してください")
    end
    if image.byte_size > MAX_IMAGE_BYTES
      errors.add(:image, "は#{MAX_IMAGE_BYTES / 1.megabyte}MB以下にしてください")
    end
  end
end
