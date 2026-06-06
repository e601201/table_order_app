import { useForm, router } from '@inertiajs/react'
import { useRef, useState } from 'react'
import { Plus, Trash2, Save, ImagePlus } from 'lucide-react'
import { adminColors } from '@/components/AdminLayout'
import Field, { inputClass, inputStyle } from '@/components/Field'
import { categoryLabel } from '@/lib/menuCategory'
import type { SizeOption, AddonOption } from '@/types'

// _key は React の安定キー専用のクライアント値。strong params が落とすためサーバへは渡らない。
type OptionRow = { _key: string; id: string; label: string; extra: number }

let rowKeySeq = 0
const nextRowKey = () => `row-${rowKeySeq++}`

export type MenuItemFormValues = {
  category: string
  name: string
  description: string
  base_price: number
  calories: number
  max_quantity: number
  recommended: boolean
  sizes: SizeOption[]
  addons: AddonOption[]
}

type FormData = Omit<MenuItemFormValues, 'sizes' | 'addons'> & {
  sizes: OptionRow[]
  addons: OptionRow[]
  image: File | null
  remove_image: boolean
}

interface MenuItemFormProps {
  categories: string[]
  initial: MenuItemFormValues
  currentImageUrl?: string
  submitUrl: string
  method: 'post' | 'patch'
  submitLabel: string
}

// label + extra の繰り返しフィールド。id は安定識別子のため UI には出さず保持する（ADR-0004）。
function OptionRepeater({
  title,
  required,
  rows,
  error,
  onChange,
}: {
  title: string
  required?: boolean
  rows: OptionRow[]
  error?: string | string[]
  onChange: (rows: OptionRow[]) => void
}) {
  const message = Array.isArray(error) ? error.join(' / ') : error

  const update = (index: number, patch: Partial<OptionRow>) =>
    onChange(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)))
  const add = () => onChange([...rows, { _key: nextRowKey(), id: '', label: '', extra: 0 }])
  const remove = (index: number) => onChange(rows.filter((_, i) => i !== index))

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span style={{ fontSize: 13, fontWeight: 600, color: adminColors.textPrimary }}>
          {title}
          {required && <span style={{ color: '#E53935' }}> *</span>}
        </span>
        <button
          type="button"
          onClick={add}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium"
          style={{ color: adminColors.textPrimary, border: `1px solid ${adminColors.border}` }}
        >
          <Plus size={13} />
          追加
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {rows.length === 0 && (
          <p style={{ fontSize: 12, color: adminColors.textSecondary }}>項目はありません。</p>
        )}
        {rows.map((row, index) => (
          <div key={row._key} className="flex items-center gap-2">
            <input
              type="text"
              value={row.label}
              onChange={(e) => update(index, { label: e.target.value })}
              placeholder="名称（例: ラージ）"
              className={`${inputClass} flex-1`}
              style={inputStyle}
            />
            <div className="flex items-center gap-1">
              <span style={{ fontSize: 13, color: adminColors.textSecondary }}>+¥</span>
              <input
                type="number"
                min={0}
                value={row.extra}
                onChange={(e) => update(index, { extra: Number(e.target.value) })}
                className={`${inputClass} w-24`}
                style={inputStyle}
              />
            </div>
            <button
              type="button"
              onClick={() => remove(index)}
              title="削除"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md"
              style={{ border: `1px solid ${adminColors.border}` }}
            >
              <Trash2 size={15} color="#dc2626" />
            </button>
          </div>
        ))}
      </div>

      {message && (
        <p className="mt-1.5" style={{ fontSize: 12, color: '#E53935' }}>
          {message}
        </p>
      )}
    </div>
  )
}

export default function MenuItemForm({
  categories,
  initial,
  currentImageUrl,
  submitUrl,
  method,
  submitLabel,
}: MenuItemFormProps) {
  const { data, setData, post, processing, errors, transform } = useForm<FormData>({
    ...initial,
    sizes: initial.sizes.map((s) => ({ ...s, _key: nextRowKey() })),
    addons: initial.addons.map((a) => ({ ...a, _key: nextRowKey() })),
    image: null,
    remove_image: false,
  })
  const [preview, setPreview] = useState<string | null>(currentImageUrl ?? null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const objectUrlRef = useRef<string | null>(null)

  function revokePreview() {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current)
      objectUrlRef.current = null
    }
  }

  function pickImage(file: File | null) {
    if (!file) return
    revokePreview()
    const url = URL.createObjectURL(file)
    objectUrlRef.current = url
    setData('image', file)
    setData('remove_image', false)
    setPreview(url)
  }

  // 添付済み画像・選択中の画像を取り消す。送信時に既存画像を purge する（remove_image）。
  function clearImage() {
    revokePreview()
    setData('image', null)
    setData('remove_image', true)
    setPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    // 登録・保存の前に確認する。
    const message = method === 'patch' ? '変更を保存します。よろしいですか？' : '商品を登録します。よろしいですか？'
    if (!window.confirm(message)) return
    // multipart で PATCH を送れないため、編集はメソッドスプーフィングで POST する。
    transform((d) => (method === 'patch' ? { ...d, _method: 'patch' } : d))
    post(submitUrl, { forceFormData: true })
  }

  // 入力欄での Enter（IME の変換確定を含む）でフォームが送信されないようにする。
  // 送信は明示的に「決定」ボタンを押したときだけ行い、入力の確定と送信を切り離す。
  function preventEnterSubmit(e: React.KeyboardEvent<HTMLFormElement>) {
    const target = e.target as HTMLElement
    if (e.key === 'Enter' && target.tagName === 'INPUT') {
      e.preventDefault()
    }
  }

  return (
    <form onSubmit={submit} onKeyDown={preventEnterSubmit} className="max-w-3xl">
      <div className="flex flex-col gap-6">
        {/* 基本情報 */}
        <div
          className="flex flex-col gap-5 rounded-xl p-6"
          style={{ backgroundColor: adminColors.bg, border: `1px solid ${adminColors.border}` }}
        >
          <h2 style={{ fontSize: 15, fontWeight: 700, color: adminColors.textPrimary }}>基本情報</h2>

          <Field label="商品名" htmlFor="name" required error={errors.name}>
            <input
              id="name"
              type="text"
              value={data.name}
              onChange={(e) => setData('name', e.target.value)}
              placeholder="クラシックバーガー"
              className={inputClass}
              style={inputStyle}
            />
          </Field>

          <Field label="カテゴリ" htmlFor="category" required error={errors.category}>
            <select
              id="category"
              value={data.category}
              onChange={(e) => setData('category', e.target.value)}
              className={inputClass}
              style={inputStyle}
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {categoryLabel(c)}
                </option>
              ))}
            </select>
          </Field>

          <Field label="説明" htmlFor="description" error={errors.description}>
            <textarea
              id="description"
              rows={3}
              value={data.description}
              onChange={(e) => setData('description', e.target.value)}
              className={inputClass}
              style={inputStyle}
            />
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="基本価格（円）" htmlFor="base_price" required error={errors.base_price}>
              <input
                id="base_price"
                type="number"
                min={0}
                value={data.base_price}
                onChange={(e) => setData('base_price', Number(e.target.value))}
                className={inputClass}
                style={inputStyle}
              />
            </Field>
            <Field label="カロリー（kcal）" htmlFor="calories" required error={errors.calories}>
              <input
                id="calories"
                type="number"
                min={0}
                value={data.calories}
                onChange={(e) => setData('calories', Number(e.target.value))}
                className={inputClass}
                style={inputStyle}
              />
            </Field>
            <Field label="最大注文数" htmlFor="max_quantity" required error={errors.max_quantity}>
              <input
                id="max_quantity"
                type="number"
                min={1}
                value={data.max_quantity}
                onChange={(e) => setData('max_quantity', Number(e.target.value))}
                className={inputClass}
                style={inputStyle}
              />
            </Field>
          </div>

          <label className="flex items-center gap-2" style={{ fontSize: 14, color: adminColors.textPrimary }}>
            <input
              type="checkbox"
              checked={data.recommended}
              onChange={(e) => setData('recommended', e.target.checked)}
            />
            おすすめとして表示する
          </label>
        </div>

        {/* 画像 */}
        <div
          className="flex flex-col gap-4 rounded-xl p-6"
          style={{ backgroundColor: adminColors.bg, border: `1px solid ${adminColors.border}` }}
        >
          <h2 style={{ fontSize: 15, fontWeight: 700, color: adminColors.textPrimary }}>商品画像</h2>
          <div className="flex items-center gap-4">
            <div
              className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg"
              style={{ backgroundColor: '#f5f5f5', border: `1px solid ${adminColors.border}` }}
            >
              {preview ? (
                <img src={preview} alt="プレビュー" className="h-full w-full object-cover" />
              ) : (
                <ImagePlus size={24} color={adminColors.textSecondary} />
              )}
            </div>
            <div className="flex flex-col gap-2">
              {/* ネイティブの input は隠し、分かりやすいボタンから呼び出す。 */}
              <input
                ref={fileInputRef}
                id="image"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => pickImage(e.target.files?.[0] ?? null)}
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition hover:opacity-90"
                  style={{ color: '#fff', backgroundColor: adminColors.active }}
                >
                  <ImagePlus size={16} />
                  {preview ? '画像を変更' : '画像を選択'}
                </button>
                {preview && (
                  <button
                    type="button"
                    onClick={clearImage}
                    className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium"
                    style={{ color: '#dc2626', border: `1px solid ${adminColors.border}` }}
                  >
                    <Trash2 size={14} />
                    削除
                  </button>
                )}
              </div>
              {data.image && (
                <p className="truncate" style={{ fontSize: 12, color: adminColors.textPrimary }}>
                  選択中: {data.image.name}
                </p>
              )}
              <p style={{ fontSize: 12, color: adminColors.textSecondary }}>
                PNG / JPEG / WebP（5MBまで）。未設定でも登録できます。
              </p>
              {errors.image && <p style={{ fontSize: 12, color: '#E53935' }}>{errors.image}</p>}
            </div>
          </div>
        </div>

        {/* サイズ / トッピング */}
        <div
          className="flex flex-col gap-6 rounded-xl p-6"
          style={{ backgroundColor: adminColors.bg, border: `1px solid ${adminColors.border}` }}
        >
          <OptionRepeater
            title="サイズ"
            required
            rows={data.sizes}
            error={errors.sizes}
            onChange={(rows) => setData('sizes', rows)}
          />
          <div className="h-px" style={{ backgroundColor: adminColors.border }} />
          <OptionRepeater
            title="追加トッピング"
            rows={data.addons}
            error={errors.addons}
            onChange={(rows) => setData('addons', rows)}
          />
        </div>
      </div>

      <div className="mt-6 flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => router.visit('/admin/menu_items')}
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
          {processing ? '保存中…' : submitLabel}
        </button>
      </div>
    </form>
  )
}
