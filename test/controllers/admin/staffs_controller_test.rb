require "test_helper"

class Admin::StaffsControllerTest < ActionDispatch::IntegrationTest
  test "admin は一覧を表示できる" do
    login_as(:admin_staff)
    get admin_staffs_path
    assert_response :success
  end

  test "admin は新しいスタッフを登録できる" do
    login_as(:admin_staff)
    assert_difference "Staff.count", 1 do
      post admin_staffs_path, params: {
        login_id: "newkitchen",
        name: "新キッチン",
        role: "kitchen",
        password: "password",
        password_confirmation: "password"
      }
    end
    assert_redirected_to admin_staffs_path
    assert Staff.find_by(login_id: "newkitchen")
  end

  test "バリデーションエラー時は登録されない" do
    login_as(:admin_staff)
    assert_no_difference "Staff.count" do
      post admin_staffs_path, params: {
        login_id: "",
        name: "",
        role: "kitchen",
        password: "short",
        password_confirmation: "short"
      }
    end
    assert_redirected_to new_admin_staff_path
  end

  test "非 admin は登録できない" do
    login_as(:kitchen_staff)
    assert_no_difference "Staff.count" do
      post admin_staffs_path, params: {
        login_id: "sneaky",
        name: "侵入者",
        role: "admin",
        password: "password",
        password_confirmation: "password"
      }
    end
    assert_redirected_to kitchen_path
  end

  test "admin は新規登録ページを表示できる" do
    login_as(:admin_staff)
    get new_admin_staff_path
    assert_response :success
  end

  test "admin は編集ページを表示できる" do
    login_as(:admin_staff)
    get edit_admin_staff_path(staffs(:kitchen_staff))
    assert_response :success
  end

  test "admin はスタッフの表示名とロールを更新できる" do
    login_as(:admin_staff)
    staff = staffs(:kitchen_staff)
    patch admin_staff_path(staff), params: { name: "新しい名前", role: "cashier" }
    assert_redirected_to admin_staffs_path
    staff.reload
    assert_equal "新しい名前", staff.name
    assert_equal "cashier", staff.role
  end

  test "password 空欄での更新は既存パスワードを据え置く" do
    login_as(:admin_staff)
    staff = staffs(:kitchen_staff)
    patch admin_staff_path(staff), params: { name: "改名", password: "", password_confirmation: "" }
    assert_redirected_to admin_staffs_path
    assert staff.reload.authenticate("password"), "空欄なら従来のパスワードで認証できるべき"
  end

  test "password を指定するとパスワードを変更できる" do
    login_as(:admin_staff)
    staff = staffs(:kitchen_staff)
    patch admin_staff_path(staff), params: { password: "newpassword", password_confirmation: "newpassword" }
    assert_redirected_to admin_staffs_path
    assert staff.reload.authenticate("newpassword")
  end

  test "login_id は更新できない" do
    login_as(:admin_staff)
    staff = staffs(:kitchen_staff)
    patch admin_staff_path(staff), params: { login_id: "changed", name: "改名" }
    assert_redirected_to admin_staffs_path
    assert_equal "kitchen1", staff.reload.login_id
  end

  test "最後の管理者は降格できない" do
    login_as(:admin_staff)
    admin = staffs(:admin_staff)
    patch admin_staff_path(admin), params: { role: "kitchen" }
    assert_equal "admin", admin.reload.role
    assert_match(/管理者/, flash[:alert])
  end

  test "管理者が2人以上いれば降格できる" do
    login_as(:admin_staff)
    other_admin = Staff.create!(login_id: "admin2", name: "副管理者", role: :admin, password: "password")
    patch admin_staff_path(other_admin), params: { role: "kitchen" }
    assert_redirected_to admin_staffs_path
    assert_equal "kitchen", other_admin.reload.role
  end

  test "admin はスタッフを削除できる" do
    login_as(:admin_staff)
    staff = staffs(:kitchen_staff)
    assert_difference "Staff.count", -1 do
      delete admin_staff_path(staff)
    end
    assert_redirected_to admin_staffs_path
    assert_nil Staff.find_by(id: staff.id)
  end

  test "自分自身は削除できない" do
    login_as(:admin_staff)
    Staff.create!(login_id: "admin2", name: "副管理者", role: :admin, password: "password")
    assert_no_difference "Staff.count" do
      delete admin_staff_path(staffs(:admin_staff))
    end
    assert_redirected_to admin_staffs_path
    assert_match(/自分自身/, flash[:alert])
  end

  test "最後の管理者は削除できない" do
    login_as(:admin_staff)
    assert_no_difference "Staff.count" do
      delete admin_staff_path(staffs(:admin_staff))
    end
    assert_match(/管理者/, flash[:alert])
  end

  private

  def login_as(fixture_name)
    post login_path, params: { login_id: staffs(fixture_name).login_id, password: "password" }
  end
end
