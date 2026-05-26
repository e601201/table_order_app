import { Head, useForm, router } from '@inertiajs/react'
import { UserPlus, LogOut, Users } from 'lucide-react'
import FlashMessage from '@/components/FlashMessage'
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
  roles: StaffRole[]
}

const roleLabel: Record<StaffRole, string> = {
  kitchen: 'キッチン',
  cashier: 'レジ',
  admin: '管理者',
}

export default function Staffs({ staffs, roles }: StaffsProps) {
  const { data, setData, post, processing, errors, reset } = useForm({
    login_id: '',
    name: '',
    role: roles[0] ?? 'kitchen',
    password: '',
    password_confirmation: '',
  })

  function submit(e: React.FormEvent) {
    e.preventDefault()
    post('/admin/staffs', {
      onSuccess: () => reset(),
    })
  }

  function logout() {
    router.delete('/logout')
  }

  return (
    <>
      <Head title="スタッフ管理" />
      <FlashMessage />
      <div className="min-h-screen bg-gray-50" style={{ fontFamily: 'Outfit, sans-serif' }}>
        <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
          <div className="flex items-center gap-2">
            <Users size={20} className="text-gray-700" />
            <h1 className="text-lg font-bold text-gray-900">スタッフ管理</h1>
          </div>
          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <LogOut size={16} />
            ログアウト
          </button>
        </header>

        <div className="mx-auto max-w-3xl px-6 py-8">
          {/* 登録フォーム */}
          <section className="mb-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <UserPlus size={18} className="text-[#E53935]" />
              <h2 className="font-semibold text-gray-900">スタッフを登録</h2>
            </div>
            <form onSubmit={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="ログイン名" error={errors.login_id}>
                <input
                  type="text"
                  value={data.login_id}
                  onChange={(e) => setData('login_id', e.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field label="表示名" error={errors.name}>
                <input
                  type="text"
                  value={data.name}
                  onChange={(e) => setData('name', e.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field label="ロール" error={errors.role}>
                <select
                  value={data.role}
                  onChange={(e) => setData('role', e.target.value as StaffRole)}
                  className={inputClass}
                >
                  {roles.map((role) => (
                    <option key={role} value={role}>
                      {roleLabel[role]}
                    </option>
                  ))}
                </select>
              </Field>
              <div className="hidden sm:block" />
              <Field label="パスワード" error={errors.password}>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={data.password}
                  onChange={(e) => setData('password', e.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field label="パスワード（確認）" error={errors.password_confirmation}>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={data.password_confirmation}
                  onChange={(e) => setData('password_confirmation', e.target.value)}
                  className={inputClass}
                />
              </Field>
              <div className="sm:col-span-2">
                <button
                  type="submit"
                  disabled={processing}
                  className="w-full rounded-lg px-4 py-2.5 font-medium text-white shadow-sm transition hover:opacity-90 disabled:opacity-50 sm:w-auto"
                  style={{ backgroundColor: '#E53935' }}
                >
                  {processing ? '登録中…' : '登録する'}
                </button>
              </div>
            </form>
          </section>

          {/* 一覧 */}
          <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="px-4 py-3">ログイン名</th>
                  <th className="px-4 py-3">表示名</th>
                  <th className="px-4 py-3">ロール</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {staffs.map((staff) => (
                  <tr key={staff.id}>
                    <td className="px-4 py-3 font-mono text-gray-700">{staff.login_id}</td>
                    <td className="px-4 py-3 text-gray-900">{staff.name}</td>
                    <td className="px-4 py-3 text-gray-700">{roleLabel[staff.role]}</td>
                  </tr>
                ))}
                {staffs.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-6 text-center text-gray-400">
                      スタッフが登録されていません
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>
        </div>
      </div>
    </>
  )
}

const inputClass =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-[#E53935] focus:outline-none focus:ring-1 focus:ring-[#E53935]'

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string | string[]
  children: React.ReactNode
}) {
  const message = Array.isArray(error) ? error.join(' / ') : error
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      {children}
      {message && <p className="mt-1 text-sm text-[#E53935]">{message}</p>}
    </div>
  )
}
