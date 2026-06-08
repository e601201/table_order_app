class Order < ApplicationRecord
  has_many :order_items, dependent: :destroy

  enum :status, { pending: 0, in_progress: 1, ready: 2, completed: 3 }, default: :pending
  enum :order_type, { in_store: 0, takeout: 1 }, default: :in_store

  validates :order_number, presence: true, uniqueness: true
  validates :subtotal, :tax, :total, :placed_at, presence: true
  validates :table_number, presence: true, if: :in_store?
  validates :table_number, absence: true, if: :takeout?

  scope :for_cashier_today, -> {
    today_orders = where(placed_at: Time.zone.today.all_day)
    today_orders.where(status: :completed)
                .or(today_orders.where.not(paid_at: nil))
                .order(Arel.sql("paid_at IS NULL DESC"))
                .order(placed_at: :desc)
  }

  # Admin 注文管理（ADR-0005）が使う日次俯瞰スコープ。
  scope :placed_today, -> { where(placed_at: Time.zone.today.all_day) }
  # 会計待ち = 提供済み（Served）かつ未会計（Unpaid）。レジ作業キューと同義。
  scope :awaiting_payment, -> { completed.where(paid_at: nil) }

  # 日次リセットの連番を採番する（ADR-0007）。
  # 保存形は日付プレフィックス付き `YYYYMMDD-NNN`。`orders.order_number` は
  # グローバル unique index のため、素の連番では翌日衝突する。プレフィックスで
  # グローバル一意を担保し、客への表示は末尾の当日連番 `NNN`（#display_number）。
  #
  # 暦日（`all_day` 規約）で「当日件数 + 1」を seq とする。同一暦日キーに対する
  # `pg_advisory_xact_lock` で、件数カウントと INSERT の間を直列化する。**この呼び出しは
  # 採番した注文を作る Checkout トランザクション内で行うこと**（xact ロックは
  # トランザクション終了まで保持される。autocommit 下では即時解放され直列化が効かない）。
  # In-store / Takeout は単一カウンタを共有する。
  def self.next_order_number(today = Time.zone.today)
    date_key = today.strftime("%Y%m%d")
    connection.execute("SELECT pg_advisory_xact_lock(#{date_key.to_i})")
    seq = where(placed_at: today.all_day).count + 1
    format("%<date>s-%<seq>03d", date: date_key, seq: seq)
  end

  # 客への表示用。保存形 `YYYYMMDD-NNN` の末尾連番 `NNN` を返す（ADR-0007）。
  def display_number
    order_number.to_s.split("-").last
  end

  def paid?
    paid_at.present?
  end

  def payment_status
    paid? ? "paid" : "unpaid"
  end
end
