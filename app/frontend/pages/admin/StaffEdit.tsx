import { Head, useForm, router } from '@inertiajs/react'
import { Save } from 'lucide-react'
import AdminLayout, { adminColors } from '@/components/AdminLayout'
import Field, { inputClass, inputStyle } from '@/components/Field'
import { roleMeta, roleOrder } from '@/lib/staffRole'
import type { StaffRole } from '@/types'

type StaffData = {
  id: number
  login_id: string
  name: string
  role: StaffRole
}

interface StaffEditProps {
  staff: StaffData
  roles: StaffRole[]
}

export default function StaffEdit({ staff, roles }: StaffEditProps) {
  const order = roleOrder.filter((r) => roles.includes(r))
  const { data, setData, patch, processing, errors } = useForm({
    name: staff.name,
    role: staff.role,
    password: '',
    password_confirmation: '',
  })

  function submit(e: React.FormEvent) {
    e.preventDefault()
    patch(`/admin/staffs/${staff.id}`)
  }

  return (
    <>
      <Head title={`スタッフ編集 - ${staff.name}`} />
      <AdminLayout
        active="staffs"
        breadcrumb="スタッフ編集"
        title="スタッフ編集"
        description="ログイン名は変更できません。パスワードは変更する場合のみ入力してください。"
      >
        <form onSubmit={submit} className="max-w-2xl">
          <div
            className="flex flex-col gap-5 rounded-xl p-6"
            style={{ backgroundColor: adminColors.bg, border: `1px solid ${adminColors.border}` }}
          >
            <h2 style={{ fontSize: 15, fontWeight: 700, color: adminColors.textPrimary }}>アカウント情報</h2>

            <Field label="ログイン名" hint="ログイン名は変更できません。">
              <div
                className="flex items-center rounded-lg px-3 py-2.5 font-mono"
                style={{ backgroundColor: '#f5f5f5', border: `1px solid ${adminColors.border}`, fontSize: 14, color: adminColors.textSecondary }}
              >
                {staff.login_id}
              </div>
            </Field>

            <Field label="表示名" htmlFor="name" required error={errors.name}>
              <input
                id="name"
                type="text"
                value={data.name}
                onChange={(e) => setData('name', e.target.value)}
                className={inputClass}
                style={inputStyle}
              />
            </Field>

            <Field label="ロール" htmlFor="role" required error={errors.role}>
              <select
                id="role"
                value={data.role}
                onChange={(e) => setData('role', e.target.value as StaffRole)}
                className={inputClass}
                style={inputStyle}
              >
                {order.map((role) => (
                  <option key={role} value={role}>
                    {roleMeta[role].label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="新しいパスワード" htmlFor="password" error={errors.password} hint="変更する場合のみ入力（8文字以上）。空欄なら据え置き。">
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                value={data.password}
                onChange={(e) => setData('password', e.target.value)}
                className={inputClass}
                style={inputStyle}
              />
            </Field>

            <Field label="新しいパスワード（確認）" htmlFor="password_confirmation" error={errors.password_confirmation}>
              <input
                id="password_confirmation"
                type="password"
                autoComplete="new-password"
                value={data.password_confirmation}
                onChange={(e) => setData('password_confirmation', e.target.value)}
                className={inputClass}
                style={inputStyle}
              />
            </Field>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => router.visit('/admin/staffs')}
              className="rounded-lg px-4 py-2.5 text-sm font-medium"
              style={{ color: adminColors.textPrimary, border: `1px solid ${adminColors.border}` }}
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={processing}
              className="flex items-center gap-1.5 rounded-lg px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: '#E53935' }}
            >
              <Save size={16} />
              {processing ? '保存中…' : '変更を保存'}
            </button>
          </div>
        </form>
      </AdminLayout>
    </>
  )
}
