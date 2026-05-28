import { Head, useForm, router } from '@inertiajs/react'
import { UserPlus } from 'lucide-react'
import AdminLayout, { adminColors } from '@/components/AdminLayout'
import Field, { inputClass, inputStyle } from '@/components/Field'
import { roleMeta, roleOrder } from '@/lib/staffRole'
import type { StaffRole } from '@/types'

interface StaffNewProps {
  roles: StaffRole[]
}

export default function StaffNew({ roles }: StaffNewProps) {
  const order = roleOrder.filter((r) => roles.includes(r))
  const { data, setData, post, processing, errors } = useForm({
    login_id: '',
    name: '',
    role: order[0] ?? 'kitchen',
    password: '',
    password_confirmation: '',
  })

  function submit(e: React.FormEvent) {
    e.preventDefault()
    post('/admin/staffs')
  }

  return (
    <>
      <Head title="スタッフ新規登録" />
      <AdminLayout
        active="staffs"
        breadcrumb="スタッフ新規登録"
        title="スタッフ新規登録"
        description="新しいスタッフアカウントを作成します。すべての項目が必須です。"
      >
        <form onSubmit={submit} className="max-w-2xl">
          <div
            className="flex flex-col gap-5 rounded-xl p-6"
            style={{ backgroundColor: adminColors.bg, border: `1px solid ${adminColors.border}` }}
          >
            <h2 style={{ fontSize: 15, fontWeight: 700, color: adminColors.textPrimary }}>アカウント情報</h2>

            <Field label="ログイン名" htmlFor="login_id" required error={errors.login_id} hint="ログイン時に使う識別子。半角英数字。">
              <input
                id="login_id"
                type="text"
                autoComplete="off"
                value={data.login_id}
                onChange={(e) => setData('login_id', e.target.value)}
                placeholder="yamada.taro"
                className={inputClass}
                style={inputStyle}
              />
            </Field>

            <Field label="表示名" htmlFor="name" required error={errors.name}>
              <input
                id="name"
                type="text"
                value={data.name}
                onChange={(e) => setData('name', e.target.value)}
                placeholder="山田 太郎"
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

            <Field label="パスワード" htmlFor="password" required error={errors.password} hint="8文字以上。">
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

            <Field label="パスワード（確認）" htmlFor="password_confirmation" required error={errors.password_confirmation}>
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
              <UserPlus size={16} />
              {processing ? '登録中…' : 'スタッフを登録'}
            </button>
          </div>
        </form>
      </AdminLayout>
    </>
  )
}
