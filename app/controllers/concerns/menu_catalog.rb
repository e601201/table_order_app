module MenuCatalog
  extend ActiveSupport::Concern

  # メニューは DB（menu_items テーブル）が真実（ADR-0004）。
  # 旧静的定数 MENU_ITEMS は廃止し、MenuItem レコードを参照する。

  def find_menu_item(id)
    MenuItem.find_by(id: id)
  end
end
