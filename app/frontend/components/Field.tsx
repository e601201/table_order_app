import { adminColors } from '@/components/AdminLayout'

// ラベル + 入力欄 + エラーメッセージをまとめたフォーム1項目。
export default function Field({
  label,
  htmlFor,
  required,
  error,
  hint,
  children,
}: {
  label: string
  htmlFor?: string
  required?: boolean
  error?: string | string[]
  hint?: string
  children: React.ReactNode
}) {
  const message = Array.isArray(error) ? error.join(' / ') : error
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block" style={{ fontSize: 13, fontWeight: 500, color: adminColors.textPrimary }}>
        {label}
        {required && <span style={{ color: '#E53935' }}> *</span>}
      </label>
      {children}
      {hint && !message && (
        <p className="mt-1" style={{ fontSize: 12, color: adminColors.textSecondary }}>
          {hint}
        </p>
      )}
      {message && (
        <p className="mt-1" style={{ fontSize: 12, color: '#E53935' }}>
          {message}
        </p>
      )}
    </div>
  )
}

export const inputClass =
  'w-full rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-[#E53935] focus:border-[#E53935]'

export const inputStyle = { border: '1px solid #e5e5e5', color: '#0a0a0a' }
