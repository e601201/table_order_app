module Admin
  class MenuItemsController < ApplicationController
    before_action :require_login!
    before_action -> { authorize_roles!(:admin) }

    def index
      render inertia: "admin/MenuItems", props: {
        menu_items: MenuItem.with_attached_image.order(:category, :name).map { |item| serialize_menu_item(item) },
        categories: MenuItem::CATEGORIES
      }
    end

    def new
      render inertia: "admin/MenuItemNew", props: {
        categories: MenuItem::CATEGORIES
      }
    end

    def create
      item = MenuItem.new(menu_item_params)

      if item.save
        redirect_to admin_menu_items_path, notice: "メニュー「#{item.name}」を登録しました"
      else
        redirect_to new_admin_menu_item_path, inertia: { errors: item.errors }
      end
    end

    def edit
      item = MenuItem.find(params[:id])
      render inertia: "admin/MenuItemEdit", props: {
        menu_item: serialize_menu_item(item),
        categories: MenuItem::CATEGORIES
      }
    end

    def update
      item = MenuItem.find(params[:id])
      # 新しい画像を選ばずに「画像を削除」した場合は既存画像を purge する。
      remove_image = remove_image_requested? && menu_item_params[:image].blank?

      if item.update(menu_item_params)
        item.image.purge if remove_image
        redirect_to admin_menu_items_path, notice: "メニュー「#{item.name}」を更新しました"
      else
        redirect_to edit_admin_menu_item_path(item), inertia: { errors: item.errors }
      end
    end

    # 物理削除（ADR-0004）。order_items はスナップショット済みのため履歴は壊れない。
    def destroy
      item = MenuItem.find(params[:id])
      item.destroy
      redirect_to admin_menu_items_path, notice: "メニュー「#{item.name}」を削除しました"
    end

    # サービス中の素早い在庫操作（ADR-0011）。重い編集フォームを再送せず、
    # 補充（stock の絶対値セット。空 = 無制限 nil）と販売停止トグルだけを更新する。
    # 在庫操作は Admin 専有（クラスの authorize_roles!(:admin) で担保）。
    def availability
      item = MenuItem.find(params[:id])

      if item.update(availability_params)
        redirect_to admin_menu_items_path, notice: "「#{item.name}」の在庫を更新しました"
      else
        redirect_to admin_menu_items_path, inertia: { errors: item.errors }
      end
    end

    private

    # 送られたキーだけ更新する。stock は絶対値セット、空文字は無制限（nil）。
    def availability_params
      attrs = {}
      attrs[:stock] = params[:stock].blank? ? nil : params[:stock] if params.key?(:stock)
      attrs[:suspended] = ActiveModel::Type::Boolean.new.cast(params[:suspended]) if params.key?(:suspended)
      attrs
    end

    def remove_image_requested?
      ActiveModel::Type::Boolean.new.cast(params[:remove_image])
    end

    def menu_item_params
      permitted = params.permit(
        :category, :name, :description, :base_price, :calories,
        :recommended, :max_quantity, :image,
        sizes: %i[id label extra],
        addons: %i[id label extra]
      )
      # ファイル未選択時は空文字が来るため、画像は据え置く。
      permitted.delete(:image) if permitted[:image].blank?
      # フォームが size / addon の全量を送る前提。空配列は「全削除」を意味するため、
      # 未送信（空配列が省略された場合）も空として扱い、フォームを真実とする。
      permitted[:sizes]  ||= []
      permitted[:addons] ||= []
      permitted
    end

    def serialize_menu_item(item)
      {
        id: item.id,
        category: item.category,
        name: item.name,
        description: item.description,
        base_price: item.base_price,
        calories: item.calories,
        recommended: item.recommended,
        max_quantity: item.max_quantity,
        sizes: item.sizes,
        addons: item.addons,
        image_url: item.image_url(:thumb),
        has_image: item.image.attached?
      }
    end
  end
end
