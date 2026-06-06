import { router, usePage } from '@inertiajs/react'
import {
  LayoutDashboard,
  ShoppingBag,
  Utensils,
  Users,
  Store,
  TrendingUp,
  Settings,
  ChevronRight,
  LogOut,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import FlashMessage from '@/components/FlashMessage'
import { roleMeta } from '@/lib/staffRole'
import type { SharedProps } from '@/types'

// サイドバー項目。実装済み項目は href を持つ。未実装はグレーアウト・クリック不可（ADR 0002）。
type NavItem = { key: string; label: string; icon: LucideIcon; enabled: boolean; href?: string }

const navSections: { title: string; items: NavItem[] }[] = [
  {
    title: '運営管理',
    items: [
      { key: 'dashboard', label: 'ダッシュボード', icon: LayoutDashboard, enabled: false },
      { key: 'orders', label: '注文管理', icon: ShoppingBag, enabled: true, href: '/admin/orders' },
      { key: 'menu', label: 'メニュー管理', icon: Utensils, enabled: true, href: '/admin/menu_items' },
      { key: 'staffs', label: 'スタッフ管理', icon: Users, enabled: true, href: '/admin/staffs' },
      { key: 'stores', label: '店舗管理', icon: Store, enabled: false },
    ],
  },
  {
    title: '分析',
    items: [
      { key: 'reports', label: '売上レポート', icon: TrendingUp, enabled: false },
      { key: 'settings', label: '設定', icon: Settings, enabled: false },
    ],
  },
]

const colors = {
  bg: '#fafafa',
  border: '#e5e5e5',
  active: '#171717',
  textPrimary: '#0a0a0a',
  textSecondary: '#737373',
  textDisabled: '#a3a3a3',
}

function SidebarItem({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon
  const color = active ? colors.bg : item.enabled ? colors.textPrimary : colors.textDisabled

  return (
    <button
      type="button"
      disabled={!item.enabled}
      onClick={item.enabled && item.href ? () => router.visit(item.href!) : undefined}
      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left"
      style={{
        backgroundColor: active ? colors.active : 'transparent',
        cursor: item.enabled ? 'pointer' : 'not-allowed',
      }}
    >
      <Icon size={18} color={color} />
      <span style={{ fontSize: 14, fontWeight: active ? 600 : 500, color }}>{item.label}</span>
    </button>
  )
}

export default function AdminLayout({
  active,
  breadcrumb,
  title,
  description,
  headerActions,
  children,
}: {
  active: string
  breadcrumb: string
  title: string
  description?: string
  headerActions?: React.ReactNode
  children: React.ReactNode
}) {
  const { auth } = usePage<SharedProps>().props
  const staff = auth.staff

  return (
    <div
      className="flex h-screen"
      style={{ backgroundColor: colors.bg, fontFamily: 'Inter, sans-serif' }}
    >
      <FlashMessage />

      {/* サイドバー */}
      <aside
        className="flex w-[240px] shrink-0 flex-col"
        style={{ backgroundColor: colors.bg, borderRight: `1px solid ${colors.border}` }}
      >
        <div className="px-5 py-4" style={{ borderBottom: `1px solid ${colors.border}` }}>
          <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: 16, fontWeight: 800, color: colors.textPrimary }}>
            モバイルオーダー
          </p>
          <p style={{ fontSize: 12, color: colors.textSecondary }}>管理コンソール</p>
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
          {navSections.map((section) => (
            <div key={section.title} className="mb-2">
              <p
                className="px-3 pb-2 pt-1"
                style={{ fontSize: 11, fontWeight: 600, color: colors.textSecondary, letterSpacing: 2 }}
              >
                {section.title}
              </p>
              {section.items.map((item) => (
                <SidebarItem key={item.key} item={item} active={item.key === active} />
              ))}
            </div>
          ))}
        </nav>

        {/* スタッフ情報（ログアウトはヘッダー右上のボタンに統一） */}
        {staff && (
          <div className="flex items-center gap-2 px-4 py-3" style={{ borderTop: `1px solid ${colors.border}` }}>
            <div className="min-w-0">
              <p className="truncate" style={{ fontSize: 13, fontWeight: 600, color: colors.textPrimary }}>
                {staff.name}
              </p>
              <p style={{ fontSize: 12, color: roleMeta[staff.role].color }}>{roleMeta[staff.role].label}</p>
            </div>
          </div>
        )}
      </aside>

      {/* メインコンテンツ */}
      <div className="flex min-w-0 flex-1 flex-col" style={{ backgroundColor: colors.bg }}>
        {/* トップバー（パンくず） */}
        <header
          className="flex h-16 shrink-0 items-center justify-between px-6"
          style={{ borderBottom: `1px solid ${colors.border}` }}
        >
          <div className="flex items-center gap-2" style={{ fontSize: 13 }}>
            <span style={{ color: colors.textSecondary }}>ホーム</span>
            <ChevronRight size={14} color={colors.textSecondary} />
            <span style={{ color: colors.textPrimary, fontWeight: 600 }}>{breadcrumb}</span>
          </div>
          {staff && (
            <button
              type="button"
              onClick={() => router.delete('/logout')}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5"
              style={{ fontSize: 13, fontWeight: 600, color: colors.textSecondary, border: `1px solid ${colors.border}` }}
            >
              <LogOut size={15} />
              ログアウト
            </button>
          )}
        </header>

        {/* コンテンツエリア */}
        <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 24, fontWeight: 800, color: colors.textPrimary }}>
                {title}
              </h1>
              {description && (
                <p className="mt-1" style={{ fontSize: 14, color: colors.textSecondary }}>
                  {description}
                </p>
              )}
            </div>
            {headerActions && <div className="flex shrink-0 items-center gap-2">{headerActions}</div>}
          </div>

          {children}
        </div>
      </div>
    </div>
  )
}

export { colors as adminColors }
