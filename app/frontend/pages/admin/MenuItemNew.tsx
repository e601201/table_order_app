import { Head } from '@inertiajs/react'
import AdminLayout from '@/components/AdminLayout'
import MenuItemForm from '@/components/MenuItemForm'

interface MenuItemNewProps {
  categories: string[]
}

export default function MenuItemNew({ categories }: MenuItemNewProps) {
  return (
    <>
      <Head title="メニュー新規登録" />
      <AdminLayout
        active="menu"
        breadcrumb="メニュー新規登録"
        title="メニュー新規登録"
        description="新しい商品を登録します。サイズは最低1つ必要です。"
      >
        <MenuItemForm
          categories={categories}
          initial={{
            category: categories[0] ?? 'burgers',
            name: '',
            description: '',
            base_price: 0,
            calories: 0,
            max_quantity: 1,
            recommended: false,
            sizes: [{ id: '', label: 'レギュラー', extra: 0 }],
            addons: [],
          }}
          submitUrl="/admin/menu_items"
          method="post"
          submitLabel="商品を登録"
        />
      </AdminLayout>
    </>
  )
}
