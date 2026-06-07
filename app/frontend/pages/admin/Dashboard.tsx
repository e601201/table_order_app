import { Head, router } from '@inertiajs/react'
import { ShoppingBag, Utensils, Users, ChefHat, CreditCard, ChevronRight } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import AdminLayout, { adminColors } from '@/components/AdminLayout'

// 管理者コンソールの入口ハブ。集計は持たず、各画面への導線（リンク）のみを並べる（ADR-0005 更新）。
type LinkCard = { label: string; description: string; href: string; icon: LucideIcon }

const sections: { title: string; items: LinkCard[] }[] = [
  {
    title: '運営管理',
    items: [
      { label: '注文管理', description: '本日の注文を俯瞰・詳細閲覧', href: '/admin/orders', icon: ShoppingBag },
      { label: 'メニュー管理', description: 'メニューの登録・編集・削除', href: '/admin/menu_items', icon: Utensils },
      { label: 'スタッフ管理', description: 'スタッフアカウントの管理', href: '/admin/staffs', icon: Users },
    ],
  },
  {
    title: 'スタッフ画面',
    items: [
      { label: 'キッチン', description: '調理の進捗を管理', href: '/kitchen', icon: ChefHat },
      { label: 'レジ', description: '会計・支払いの処理', href: '/cashier', icon: CreditCard },
    ],
  },
]

export default function Dashboard() {
  return (
    <>
      <Head title="ダッシュボード" />
      <AdminLayout
        active="dashboard"
        breadcrumb="ダッシュボード"
        title="ダッシュボード"
        description="各管理画面・スタッフ画面への入口です。"
      >
        <div className="flex flex-col gap-8">
          {sections.map((section) => (
            <section key={section.title}>
              <p
                className="mb-3"
                style={{ fontSize: 12, fontWeight: 600, letterSpacing: 1, color: adminColors.textSecondary }}
              >
                {section.title}
              </p>
              <div className="grid grid-cols-2 gap-3">
                {section.items.map((item) => {
                  const Icon = item.icon
                  return (
                    <button
                      key={item.href}
                      type="button"
                      onClick={() => router.visit(item.href)}
                      className="flex items-center gap-3 rounded-xl border p-4 text-left"
                      style={{ borderColor: adminColors.border, backgroundColor: '#ffffff' }}
                    >
                      <span
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                        style={{ backgroundColor: '#f5f5f5' }}
                      >
                        <Icon size={20} color={adminColors.textPrimary} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block" style={{ fontSize: 15, fontWeight: 700, color: adminColors.textPrimary }}>
                          {item.label}
                        </span>
                        <span className="block truncate" style={{ fontSize: 13, color: adminColors.textSecondary }}>
                          {item.description}
                        </span>
                      </span>
                      <ChevronRight size={18} color={adminColors.textSecondary} />
                    </button>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      </AdminLayout>
    </>
  )
}
