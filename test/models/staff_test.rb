require "test_helper"

class StaffTest < ActiveSupport::TestCase
  test "有効なスタッフは保存できる" do
    staff = Staff.new(login_id: "newstaff", name: "新人", role: :kitchen, password: "password")
    assert staff.valid?
  end

  test "login_id は必須" do
    staff = Staff.new(name: "名無し", role: :kitchen, password: "password")
    assert_not staff.valid?
    assert_includes staff.errors[:login_id], "can't be blank"
  end

  test "login_id は一意（大文字小文字を区別しない）" do
    staff = Staff.new(login_id: "KITCHEN1", name: "重複", role: :cashier, password: "password")
    assert_not staff.valid?
    assert_includes staff.errors[:login_id], "has already been taken"
  end

  test "login_id は前後空白を除去し小文字化して保存される" do
    staff = Staff.create!(login_id: "  ZoZo  ", name: "ぞぞ", role: :kitchen, password: "password")
    assert_equal "zozo", staff.login_id
  end

  test "name は必須" do
    staff = Staff.new(login_id: "noname", role: :kitchen, password: "password")
    assert_not staff.valid?
    assert_includes staff.errors[:name], "can't be blank"
  end

  test "パスワードは8文字以上" do
    staff = Staff.new(login_id: "shortpw", name: "短い", role: :kitchen, password: "short")
    assert_not staff.valid?
    assert_includes staff.errors[:password], "is too short (minimum is 8 characters)"
  end

  test "authenticate は正しいパスワードで Staff を返す" do
    staff = staffs(:admin_staff)
    assert staff.authenticate("password")
    assert_not staff.authenticate("wrong-password")
  end

  test "role enum が定義されている" do
    assert_equal %w[kitchen cashier admin], Staff.roles.keys
  end

  test "last_admin? は管理者が1人だけのとき true" do
    admin = staffs(:admin_staff)
    assert_equal 1, Staff.admin.count
    assert admin.last_admin?
  end

  test "last_admin? は管理者が複数いるとき false" do
    admin = staffs(:admin_staff)
    Staff.create!(login_id: "admin2", name: "副管理者", role: :admin, password: "password")
    assert_not admin.last_admin?
  end

  test "last_admin? は管理者でないスタッフでは false" do
    assert_not staffs(:kitchen_staff).last_admin?
  end
end
