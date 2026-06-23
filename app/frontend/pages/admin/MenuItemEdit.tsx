import { Head } from '@inertiajs/react'
import AdminLayout from '@/components/AdminLayout'
import MenuItemForm from '@/components/MenuItemForm'
import type { AdminMenuItem } from '@/types'

interface MenuItemEditProps {
  menu_item: AdminMenuItem
  categories: string[]
}

export default function MenuItemEdit({ menu_item, categories }: MenuItemEditProps) {
  return (
    <>
      <Head title={`メニュー編集 - ${menu_item.name}`} />
      <AdminLayout
        active="menu"
        breadcrumb="メニュー編集"
        title="メニュー編集"
        description="商品情報を編集します。価格やサイズの変更は進行中のカートにも反映されます。"
      >
        <MenuItemForm
          categories={categories}
          initial={{
            category: menu_item.category,
            name: menu_item.name,
            description: menu_item.description,
            base_price: menu_item.base_price,
            calories: menu_item.calories,
            max_quantity: menu_item.max_quantity,
            recommended: menu_item.recommended,
            stock: menu_item.stock,
            suspended: menu_item.suspended,
            sizes: menu_item.sizes,
            addons: menu_item.addons,
          }}
          currentImageUrl={menu_item.has_image ? menu_item.image_url : undefined}
          submitUrl={`/admin/menu_items/${menu_item.id}`}
          method="patch"
          submitLabel="変更を保存"
        />
      </AdminLayout>
    </>
  )
}
