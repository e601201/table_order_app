# 決済方法マスタ（ADR-0014）。会計（Settlement）でお金を受け取る手段の名前。
# 振る舞いを持たない純粋な記録ラベルで、Order へは FK ではなく会計時に name を
# スナップショットする — マスタの改名・削除は会計済みの歴史に影響しない。
# ライフサイクルは MenuItem と同型: 有効/無効トグル（一時停止）＋物理削除（恒久撤去）。
class PaymentMethod < ApplicationRecord
  # 前後空白を除去して保存・照合する（「現金 」のような見えない重複を防ぐ）。
  normalizes :name, with: ->(value) { value.to_s.strip }

  validates :name, presence: true, uniqueness: true

  scope :enabled, -> { where(enabled: true) }

  # 不変条件「有効な決済方法 ≥ 1」（ADR-0014）: レジが Paid を書けない状態を作らない。
  # Staff の「管理者 ≥ 1」（last_admin?）と同型。現金の特別扱いはしない。
  validate :cannot_disable_last_enabled, on: :update
  before_destroy :cannot_destroy_last_enabled

  # この決済方法が有効で、かつ有効な方法が他にない（自分が最後の1つ）なら true。
  def last_enabled?
    enabled? && PaymentMethod.enabled.where.not(id: id).none?
  end

  private

  def cannot_disable_last_enabled
    return unless enabled_changed?(from: true, to: false)

    errors.add(:enabled, "有効な決済方法は最低1つ必要です") if PaymentMethod.enabled.where.not(id: id).none?
  end

  def cannot_destroy_last_enabled
    return unless last_enabled?

    errors.add(:base, "有効な決済方法は最低1つ必要です")
    throw :abort
  end
end
