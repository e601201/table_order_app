class Staff < ApplicationRecord
  has_secure_password

  # 1人1ロール。Admin は全スタッフ画面にアクセスできる（認可は controller 側で吸収）。
  enum :role, { kitchen: 0, cashier: 1, admin: 2 }

  # login_id は大文字小文字を区別せず、前後空白を除去して保存・照合する。
  normalizes :login_id, with: ->(value) { value.to_s.strip.downcase }

  validates :login_id, presence: true, uniqueness: { case_sensitive: false }
  validates :name, presence: true
  validates :role, presence: true
  validates :password, length: { minimum: 8 }, allow_nil: true
end
