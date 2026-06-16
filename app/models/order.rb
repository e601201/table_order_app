class Order < ApplicationRecord
  has_many :order_items, dependent: :destroy
  belongs_to :line_account, optional: true

  enum :status, { pending: 0, in_progress: 1, ready: 2, served: 3 }, default: :pending
  enum :order_type, { in_store: 0, takeout: 1 }, default: :in_store
  # 打ち切り理由（ADR-0010）。4値固定・other なし。それぞれ損失の種類が違う:
  # no_show=廃棄 / out_of_stock=供給失敗 / customer_request=取り下げ / walkout=未収。
  enum :closure_reason, { no_show: 0, out_of_stock: 1, customer_request: 2, walkout: 3 }

  validates :order_number, presence: true, uniqueness: true
  validates :subtotal, :tax, :total, :placed_at, presence: true
  validates :table_number, presence: true, if: :in_store?
  validates :table_number, absence: true, if: :takeout?
  # table_number は所在を示す正の整数ラベル（CONTEXT.md: Table number / イシュー #41）。
  # Table エンティティや母集合は持たないため上限は設けず、0・負の不正値だけを弾く。
  validates :table_number, numericality: { only_integer: true, greater_than: 0 }, if: :in_store?
  # table_number と対をなす相互排他（ADR-0008）: Takeout の身元は LineAccount、
  # In-store の所在は table_number。既存 takeout 行はリセット容認で一本化。
  validates :line_account, presence: true, if: :takeout?
  validates :line_account, absence: true, if: :in_store?
  # payment 軸の終端は Paid | Closed の排他二択（ADR-0010）。Paid は打ち切れない（返金なし）。
  validates :closed_at, absence: true, if: :paid?
  # 理由コードは打ち切りと運命を共にする（同時必須・同時不在）。
  validates :closure_reason, presence: true, if: :closed?
  validates :closure_reason, absence: true, unless: :closed?
  # 構造的にあり得ない組合せだけ弾く（ADR-0010）: no_show は Takeout 限定（着席客に
  # 「来なかった」はない）、walkout は In-store 限定（新フローの Takeout に Served +
  # Unpaid は存在しない）。kitchen 状態 × reason の整合は現場判断に委ね強制しない。
  validate :closure_reason_matches_order_type

  scope :for_cashier_today, -> {
    today_orders = where(placed_at: Time.zone.today.all_day)
    today_orders.merge(awaiting_payment)
                .or(today_orders.where.not(paid_at: nil))
                .order(Arel.sql("paid_at IS NULL DESC"))
                .order(placed_at: :desc)
  }

  # Admin 注文管理（ADR-0005）が使う日次俯瞰スコープ。
  scope :placed_today, -> { where(placed_at: Time.zone.today.all_day) }
  # 会計待ち = レジ作業キュー。In-store は提供済み（Served + Unpaid）、Takeout は
  # 手渡しが会計と同時に起きるため できあがり（Ready + Unpaid）が会計待ち（ADR-0009）。
  # 旧フローの Served + Unpaid な takeout はキューに出ない（リセット容認・救済分岐なし）。
  # 打ち切り済み（Closed）は全作業キュー外（ADR-0010）。
  scope :awaiting_payment, -> {
    in_store.served.where(paid_at: nil, closed_at: nil)
            .or(takeout.ready.where(paid_at: nil, closed_at: nil))
  }

  # 当日の打ち切り済み（ADR-0010）。レジ盤面の打ち切り一覧 = 打ち切り解除（reopen）の
  # 到達経路と、Admin の俯瞰が読む。
  scope :closed_today, -> { placed_today.where.not(closed_at: nil).order(closed_at: :desc) }
  # 当日の未決済（未会計・未打ち切り）のうち会計待ちキュー外（ADR-0010）。品切れ等で
  # Pending / In progress のまま打ち切る対象に、レジが届くための導線。
  scope :open_outside_cashier_queue, -> {
    placed_today.where(paid_at: nil, closed_at: nil)
                .where.not(id: awaiting_payment)
                .order(placed_at: :desc)
  }

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

  # 打ち切り済み（ADR-0010）: payment 軸の第2終端。paid? と同形の timestamp 判定。
  def closed?
    closed_at.present?
  end

  def payment_status
    return "paid" if paid?
    return "closed" if closed?

    "unpaid"
  end

  private

  def closure_reason_matches_order_type
    errors.add(:closure_reason, :invalid) if no_show? && in_store?
    errors.add(:closure_reason, :invalid) if walkout? && takeout?
  end
end
