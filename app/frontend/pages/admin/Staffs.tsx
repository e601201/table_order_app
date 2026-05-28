import { Head, Link, router } from '@inertiajs/react'
import { useMemo, useState } from 'react'
import { Users, ShieldCheck, ChefHat, Receipt, Search, Pencil, Trash2, UserPlus } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import AdminLayout, { adminColors } from '@/components/AdminLayout'
import { roleMeta, roleOrder, staffInitials } from '@/lib/staffRole'
import type { StaffRole } from '@/types'

type StaffRow = {
  id: number
  login_id: string
  name: string
  role: StaffRole
  created_at: string
}

interface StaffsProps {
  staffs: StaffRow[]
  currentStaffId: number
}

type RoleFilter = 'all' | StaffRole

const filterTabs: { key: RoleFilter; label: string }[] = [
  { key: 'all', label: 'すべて' },
  ...roleOrder.map((role) => ({ key: role as RoleFilter, label: roleMeta[role].label })),
]

const statCards: { role: StaffRole | 'all'; label: string; icon: LucideIcon; color: string }[] = [
  { role: 'all', label: '総数', icon: Users, color: adminColors.textPrimary },
  { role: 'admin', label: '管理者', icon: ShieldCheck, color: roleMeta.admin.color },
  { role: 'kitchen', label: 'キッチン', icon: ChefHat, color: roleMeta.kitchen.color },
  { role: 'cashier', label: 'レジ', icon: Receipt, color: roleMeta.cashier.color },
]

export default function Staffs({ staffs, currentStaffId }: StaffsProps) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<RoleFilter>('all')

  const counts = useMemo(() => {
    const byRole = (role: StaffRole) => staffs.filter((s) => s.role === role).length
    return { all: staffs.length, admin: byRole('admin'), kitchen: byRole('kitchen'), cashier: byRole('cashier') }
  }, [staffs])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return staffs.filter((staff) => {
      const matchesRole = filter === 'all' || staff.role === filter
      const matchesQuery =
        q === '' || staff.name.toLowerCase().includes(q) || staff.login_id.toLowerCase().includes(q)
      return matchesRole && matchesQuery
    })
  }, [staffs, query, filter])

  function destroy(staff: StaffRow) {
    if (!window.confirm(`スタッフ「${staff.name}」を削除しますか？この操作は取り消せません。`)) return
    router.delete(`/admin/staffs/${staff.id}`, { preserveScroll: true })
  }

  return (
    <>
      <Head title="スタッフ管理" />
      <AdminLayout
        active="staffs"
        breadcrumb="スタッフ管理"
        title="スタッフ管理"
        description="スタッフアカウントの登録・編集・削除を行います"
        headerActions={
          <Link
            href="/admin/staffs/new"
            className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
            style={{ backgroundColor: '#E53935' }}
          >
            <UserPlus size={16} />
            スタッフ新規登録
          </Link>
        }
      >
        {/* 統計カード */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {statCards.map(({ role, label, icon: Icon, color }) => (
            <div
              key={role}
              className="rounded-xl p-5"
              style={{ backgroundColor: adminColors.bg, border: `1px solid ${adminColors.border}` }}
            >
              <div className="flex items-center justify-between">
                <span style={{ fontSize: 13, fontWeight: 500, color: adminColors.textSecondary }}>{label}</span>
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-lg"
                  style={{ backgroundColor: `${color}1a` }}
                >
                  <Icon size={18} color={color} />
                </span>
              </div>
              <p className="mt-2" style={{ fontSize: 28, fontWeight: 700, lineHeight: 1.2, color: adminColors.textPrimary }}>
                {counts[role]}
              </p>
            </div>
          ))}
        </div>

        {/* テーブルカード */}
        <div
          className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl"
          style={{ backgroundColor: adminColors.bg, border: `1px solid ${adminColors.border}` }}
        >
          {/* ツールバー: 検索 + ロールタブ */}
          <div
            className="flex flex-wrap items-center gap-3 p-4"
            style={{ borderBottom: `1px solid ${adminColors.border}` }}
          >
            <div
              className="flex items-center gap-2 rounded-lg px-3"
              style={{ height: 36, width: 280, border: `1px solid ${adminColors.border}` }}
            >
              <Search size={16} color={adminColors.textSecondary} />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="名前・ログイン名で検索..."
                className="w-full bg-transparent text-sm outline-none"
                style={{ color: adminColors.textPrimary }}
              />
            </div>
            <div className="flex items-center gap-1.5">
              {filterTabs.map((tab) => {
                const isActive = filter === tab.key
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setFilter(tab.key)}
                    className="rounded-lg px-3 py-1.5 text-sm font-medium transition"
                    style={{
                      backgroundColor: isActive ? adminColors.active : adminColors.bg,
                      color: isActive ? adminColors.bg : adminColors.textPrimary,
                      border: isActive ? 'none' : `1px solid ${adminColors.border}`,
                    }}
                  >
                    {tab.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* テーブルヘッダー */}
          <div
            className="flex items-center px-4 py-2.5"
            style={{ backgroundColor: '#f5f5f5', borderBottom: `1px solid ${adminColors.border}` }}
          >
            <span className="flex-1" style={{ fontSize: 12, fontWeight: 600, color: adminColors.textSecondary, letterSpacing: 0.4 }}>
              スタッフ
            </span>
            <span style={{ width: 130, fontSize: 12, fontWeight: 600, color: adminColors.textSecondary, letterSpacing: 0.4 }}>
              ロール
            </span>
            <span style={{ width: 80, fontSize: 12, fontWeight: 600, color: adminColors.textSecondary, letterSpacing: 0.4, textAlign: 'right' }}>
              操作
            </span>
          </div>

          {/* テーブル本体 */}
          <div className="min-h-0 flex-1 overflow-y-auto">
            {visible.map((staff) => {
              const meta = roleMeta[staff.role]
              return (
                <div
                  key={staff.id}
                  className="flex items-center px-4 py-3"
                  style={{ borderBottom: `1px solid ${adminColors.border}` }}
                >
                  <div className="flex flex-1 items-center gap-3">
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white"
                      style={{ backgroundColor: meta.color, fontSize: 13, fontWeight: 600 }}
                    >
                      {staffInitials(staff.name)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate" style={{ fontSize: 14, fontWeight: 600, color: adminColors.textPrimary }}>
                        {staff.name}
                      </p>
                      <p className="truncate font-mono" style={{ fontSize: 12, color: adminColors.textSecondary }}>
                        {staff.login_id}
                      </p>
                    </div>
                  </div>

                  <div style={{ width: 130 }}>
                    <span
                      className="inline-flex items-center rounded-full px-2.5 py-0.5"
                      style={{ backgroundColor: meta.badgeBg, color: meta.color, border: `1px solid ${meta.badgeBorder}`, fontSize: 12, fontWeight: 600 }}
                    >
                      {meta.label}
                    </span>
                  </div>

                  <div className="flex items-center justify-end gap-1.5" style={{ width: 80 }}>
                    <Link
                      href={`/admin/staffs/${staff.id}/edit`}
                      title="編集"
                      className="flex h-7 w-7 items-center justify-center rounded-md"
                      style={{ border: `1px solid ${adminColors.border}` }}
                    >
                      <Pencil size={14} color={adminColors.textPrimary} />
                    </Link>
                    <button
                      type="button"
                      onClick={() => destroy(staff)}
                      disabled={staff.id === currentStaffId}
                      title={staff.id === currentStaffId ? '自分自身は削除できません' : '削除'}
                      className="flex h-7 w-7 items-center justify-center rounded-md disabled:opacity-40"
                      style={{ border: `1px solid ${adminColors.border}` }}
                    >
                      <Trash2 size={14} color="#dc2626" />
                    </button>
                  </div>
                </div>
              )
            })}

            {visible.length === 0 && (
              <div className="px-4 py-10 text-center" style={{ fontSize: 14, color: adminColors.textSecondary }}>
                該当するスタッフがいません
              </div>
            )}
          </div>
        </div>
      </AdminLayout>
    </>
  )
}
