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
    assert_redirected_to admin_staffs_path
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

  private

  def login_as(fixture_name)
    post login_path, params: { login_id: staffs(fixture_name).login_id, password: "password" }
  end
end
