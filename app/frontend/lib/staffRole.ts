import type { StaffRole } from '@/types'

// ロールの表示ラベルとバッジ配色。CONTEXT.md の正準名（管理者 / キッチン / レジ）に揃える。
// 配色は mobileOrder.pen のスタッフ管理画面に準拠（管理者=紫 / キッチン=青 / レジ=緑）。
type RoleMeta = {
  label: string
  color: string
  badgeBg: string
  badgeBorder: string
}

export const roleMeta: Record<StaffRole, RoleMeta> = {
  admin: { label: '管理者', color: '#7c3aed', badgeBg: '#7c3aed1a', badgeBorder: '#7c3aed40' },
  kitchen: { label: 'キッチン', color: '#1d4ed8', badgeBg: '#1d4ed81a', badgeBorder: '#1d4ed840' },
  cashier: { label: 'レジ', color: '#16a34a', badgeBg: '#16a34a1a', badgeBorder: '#16a34a40' },
}

// 一覧・編集で並べるロールの順序（管理者を先頭に）。
export const roleOrder: StaffRole[] = ['admin', 'kitchen', 'cashier']

// アバターのイニシャル。日本語表示名の先頭2文字を使う。
export function staffInitials(name: string): string {
  return name.trim().slice(0, 2)
}
