require "test_helper"

class Admin::MenuItemsControllerTest < ActionDispatch::IntegrationTest
  def valid_params(overrides = {})
    {
      category: "burgers",
      name: "新メニュー",
      description: "説明",
      base_price: 600,
      calories: 700,
      recommended: false,
      max_quantity: 8,
      sizes: [ { id: "regular", label: "レギュラー", extra: 0 } ],
      addons: []
    }.merge(overrides)
  end

  test "admin は一覧を表示できる" do
    login_as(:admin_staff)
    get admin_menu_items_path
    assert_response :success
  end

  test "admin は新規登録ページを表示できる" do
    login_as(:admin_staff)
    get new_admin_menu_item_path
    assert_response :success
  end

  test "admin は新しいメニューを登録できる" do
    login_as(:admin_staff)
    assert_difference "MenuItem.count", 1 do
      post admin_menu_items_path, params: valid_params(name: "ベジバーガー")
    end
    assert_redirected_to admin_menu_items_path
    assert MenuItem.find_by(name: "ベジバーガー")
  end

  test "バリデーションエラー時は登録されない" do
    login_as(:admin_staff)
    assert_no_difference "MenuItem.count" do
      post admin_menu_items_path, params: valid_params(name: "", sizes: [])
    end
    assert_redirected_to new_admin_menu_item_path
  end

  test "非 admin は登録できない" do
    login_as(:kitchen_staff)
    assert_no_difference "MenuItem.count" do
      post admin_menu_items_path, params: valid_params
    end
    assert_redirected_to kitchen_path
  end

  test "admin は編集ページを表示できる" do
    login_as(:admin_staff)
    get edit_admin_menu_item_path(menu_items(:classic_burger))
    assert_response :success
  end

  test "admin はメニューを更新できる" do
    login_as(:admin_staff)
    item = menu_items(:classic_burger)
    patch admin_menu_item_path(item), params: valid_params(name: "改名バーガー", base_price: 999)
    assert_redirected_to admin_menu_items_path
    item.reload
    assert_equal "改名バーガー", item.name
    assert_equal 999, item.base_price
  end

  test "admin はメニューを物理削除できる" do
    login_as(:admin_staff)
    item = menu_items(:cola)
    assert_difference "MenuItem.count", -1 do
      delete admin_menu_item_path(item)
    end
    assert_redirected_to admin_menu_items_path
    assert_nil MenuItem.find_by(id: item.id)
  end

  test "admin は画像付きでメニューを登録できる" do
    login_as(:admin_staff)
    image = fixture_file_upload("menu_item.png", "image/png")
    post admin_menu_items_path, params: valid_params(name: "画像バーガー", image: image)
    assert_redirected_to admin_menu_items_path
    assert MenuItem.find_by(name: "画像バーガー").image.attached?
  end

  test "admin は添付済みの画像を削除できる" do
    login_as(:admin_staff)
    item = menu_items(:classic_burger)
    item.image.attach(fixture_file_upload("menu_item.png", "image/png"))
    assert item.image.attached?

    patch admin_menu_item_path(item), params: valid_params(remove_image: true)
    assert_redirected_to admin_menu_items_path
    assert_not item.reload.image.attached?
  end

  test "新しい画像を選んだ場合は remove_image があっても置き換える" do
    login_as(:admin_staff)
    item = menu_items(:classic_burger)
    item.image.attach(fixture_file_upload("menu_item.png", "image/png"))
    original_blob_id = item.image.blob.id

    patch admin_menu_item_path(item), params: valid_params(
      image: fixture_file_upload("menu_item.png", "image/png"), remove_image: true
    )
    assert_redirected_to admin_menu_items_path
    assert item.reload.image.attached?
    assert_not_equal original_blob_id, item.image.blob.id
  end

  test "未ログインは login へリダイレクト" do
    get admin_menu_items_path
    assert_redirected_to login_path
  end

  # --- 在庫操作（ADR-0011）: 補充＝絶対値セット / 売切トグル / Admin 専有 ---

  test "admin は在庫を補充（絶対値セット）できる" do
    login_as(:admin_staff)
    item = menu_items(:classic_burger)
    patch availability_admin_menu_item_path(item), params: { stock: 20 }
    assert_redirected_to admin_menu_items_path
    assert_equal 20, item.reload.stock
  end

  test "admin は販売停止を切り替えられる" do
    login_as(:admin_staff)
    item = menu_items(:classic_burger)
    patch availability_admin_menu_item_path(item), params: { suspended: true }
    assert item.reload.suspended?
  end

  test "admin は在庫を空にして無制限(nil)に戻せる" do
    login_as(:admin_staff)
    item = menu_items(:classic_burger)
    item.update!(stock: 5)
    patch availability_admin_menu_item_path(item), params: { stock: "" }
    assert_nil item.reload.stock
  end

  test "負の在庫は拒否され在庫は変わらない" do
    login_as(:admin_staff)
    item = menu_items(:classic_burger)
    item.update!(stock: 5)
    patch availability_admin_menu_item_path(item), params: { stock: -1 }
    assert_equal 5, item.reload.stock
  end

  test "非 admin は在庫操作できない" do
    login_as(:kitchen_staff)
    item = menu_items(:classic_burger)
    patch availability_admin_menu_item_path(item), params: { suspended: true }
    assert_redirected_to kitchen_path
    assert_not item.reload.suspended?
  end

  test "未ログインの在庫操作は login へリダイレクト" do
    item = menu_items(:classic_burger)
    patch availability_admin_menu_item_path(item), params: { suspended: true }
    assert_redirected_to login_path
    assert_not item.reload.suspended?
  end

  test "一覧の各メニューは stock と suspended を持つ（在庫操作 UI 用）" do
    login_as(:admin_staff)
    item = menu_items(:classic_burger)
    item.update!(stock: 8, suspended: true)
    get admin_menu_items_path
    row = inertia.props[:menu_items].find { |i| i[:id] == item.id }
    assert_equal 8, row[:stock]
    assert_equal true, row[:suspended]
  end

  test "編集フォームからも stock と suspended を更新できる" do
    login_as(:admin_staff)
    item = menu_items(:classic_burger)
    patch admin_menu_item_path(item), params: valid_params(stock: 15, suspended: true)
    item.reload
    assert_equal 15, item.stock
    assert item.suspended?
  end

  test "編集フォームで stock を空にすると無制限(nil)になる" do
    login_as(:admin_staff)
    item = menu_items(:classic_burger)
    item.update!(stock: 9)
    patch admin_menu_item_path(item), params: valid_params(stock: "")
    assert_nil item.reload.stock
  end

  private

  def login_as(fixture_name)
    post login_path, params: { login_id: staffs(fixture_name).login_id, password: "password" }
  end
end
