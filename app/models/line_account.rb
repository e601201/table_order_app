# Takeout 時に Customer が名乗る永続化された LINE 身元（ADR-0008 / CONTEXT.md: LineAccount）。
# ロールでも Staff でもない。LINE の userId（line_user_id）で一意に識別する。
class LineAccount < ApplicationRecord
  has_many :orders

  validates :line_user_id, presence: true, uniqueness: true
end
