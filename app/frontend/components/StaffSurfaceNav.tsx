import { router, usePage } from '@inertiajs/react'
import type { SharedProps } from '@/types'

// admin だけに見せる画面切り替えナビ。CONTEXT.md の正準名（キッチン / レジ / 管理者）に揃える。
// 管理者の起点はダッシュボード（ADR-0005 更新で admin ホームを /admin/dashboard に移動）。
type Surface = 'kitchen' | 'cashier' | 'admin'

const surfaces: { key: Surface; label: string; href: string }[] = [
  { key: 'kitchen', label: 'キッチン', href: '/kitchen' },
  { key: 'cashier', label: 'レジ', href: '/cashier' },
  { key: 'admin', label: '管理者', href: '/admin/dashboard' },
]

// ヘッダー背景に合わせた配色。light=明るいヘッダー（キッチン / 管理者）、dark=暗いヘッダー（レジ）。
const toneStyles = {
  light: {
    active: { backgroundColor: '#171717', color: '#fafafa', borderColor: '#171717' },
    inactive: { backgroundColor: 'transparent', color: '#525252', borderColor: '#e5e5e5' },
  },
  dark: {
    active: { backgroundColor: '#fafafa', color: '#171717', borderColor: '#fafafa' },
    inactive: { backgroundColor: '#262626', color: '#a3a3a3', borderColor: '#262626' },
  },
} as const

// admin 以外（および未ログイン）では何も描画しない＝非 admin には UI 上も非表示。
// バックエンドの認可は別途各 controller が担保する（本コンポーネントは導線の出し分けのみ）。
export default function StaffSurfaceNav({
  current,
  tone = 'light',
}: {
  current: Surface
  tone?: 'light' | 'dark'
}) {
  const { auth } = usePage<SharedProps>().props
  if (auth.staff?.role !== 'admin') return null

  const palette = toneStyles[tone]

  return (
    <nav className="flex items-center gap-1" aria-label="画面切り替え">
      {surfaces.map((surface) => {
        const isCurrent = surface.key === current
        const style = isCurrent ? palette.active : palette.inactive

        return (
          <button
            key={surface.key}
            type="button"
            disabled={isCurrent}
            onClick={isCurrent ? undefined : () => router.visit(surface.href)}
            aria-current={isCurrent ? 'page' : undefined}
            className="rounded-lg border px-3 py-1.5"
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: 13,
              fontWeight: 600,
              cursor: isCurrent ? 'default' : 'pointer',
              ...style,
            }}
          >
            {surface.label}
          </button>
        )
      })}
    </nav>
  )
}
