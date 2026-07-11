import { Head, router } from '@inertiajs/react'
import { useState } from 'react'
import { CreditCard, Plus, Pencil, Trash2, Check, X } from 'lucide-react'
import AdminLayout, { adminColors } from '@/components/AdminLayout'
import type { AdminPaymentMethod } from '@/types'

interface SettingsProps {
  payment_methods: AdminPaymentMethod[]
}

// 設定（ADR-0014）。現在の中身は決済方法マスタのみ。将来の設定項目はセクションとして追い足す。
// 行の追加・改名・トグル・削除はページ内でインラインに行う（New/Edit の別ページを持たない）。
export default function Settings({ payment_methods }: SettingsProps) {
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingName, setEditingName] = useState('')

  // 不変条件「有効な決済方法 ≥ 1」（ADR-0014）。最後の有効な1つは無効化も削除も
  // できない — サーバー（モデル）が境界だが、ボタンも先に無効化して意図を見せる。
  const enabledCount = payment_methods.filter((m) => m.enabled).length

  function addMethod() {
    const name = newName.trim()
    if (name === '') return
    router.post('/admin/payment_methods', { name }, { preserveScroll: true, onSuccess: () => setNewName('') })
  }

  function startEditing(method: AdminPaymentMethod) {
    setEditingId(method.id)
    setEditingName(method.name)
  }

  function submitRename(method: AdminPaymentMethod) {
    const name = editingName.trim()
    if (name === '' || name === method.name) {
      setEditingId(null)
      return
    }
    router.patch(`/admin/payment_methods/${method.id}`, { name }, { preserveScroll: true, onFinish: () => setEditingId(null) })
  }

  function toggleEnabled(method: AdminPaymentMethod) {
    router.patch(`/admin/payment_methods/${method.id}`, { enabled: !method.enabled }, { preserveScroll: true })
  }

  function destroy(method: AdminPaymentMethod) {
    if (!window.confirm(`決済方法「${method.name}」を削除しますか？この操作は取り消せません。\n（会計済みの注文の記録は変わりません）`)) return
    router.delete(`/admin/payment_methods/${method.id}`, { preserveScroll: true })
  }

  return (
    <>
      <Head title="設定" />
      <AdminLayout
        active="settings"
        breadcrumb="設定"
        title="設定"
        description="店舗運用のパラメータを管理します"
      >
        {/* 決済方法セクション（ADR-0014） */}
        <div
          className="flex flex-col overflow-hidden rounded-xl"
          style={{ backgroundColor: adminColors.bg, border: `1px solid ${adminColors.border}` }}
        >
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${adminColors.border}` }}>
            <div className="flex items-center gap-2.5">
              <CreditCard size={18} color={adminColors.textPrimary} />
              <div>
                <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: 16, fontWeight: 700, color: adminColors.textPrimary }}>
                  決済方法
                </p>
                <p style={{ fontSize: 12, color: adminColors.textSecondary }}>
                  レジの会計で選択できる決済方法を管理します。無効化した方法は選択肢に出ません
                </p>
              </div>
            </div>
            <span style={{ fontSize: 13, fontWeight: 500, color: adminColors.textSecondary }}>
              有効 {enabledCount} / {payment_methods.length} 件
            </span>
          </div>

          {/* 追加フォーム */}
          <div className="flex items-center gap-2 px-5 py-3" style={{ borderBottom: `1px solid ${adminColors.border}` }}>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addMethod()}
              placeholder="決済方法の名前（例: PayPay）"
              className="rounded-lg px-3 text-sm outline-none"
              style={{ height: 36, width: 280, border: `1px solid ${adminColors.border}`, color: adminColors.textPrimary }}
            />
            <button
              type="button"
              onClick={addMethod}
              disabled={newName.trim() === ''}
              className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-40"
              style={{ backgroundColor: adminColors.active }}
            >
              <Plus size={16} />
              追加
            </button>
          </div>

          {/* 一覧 */}
          <div>
            {payment_methods.map((method) => {
              const lastEnabled = method.enabled && enabledCount <= 1
              const editing = editingId === method.id

              return (
                <div
                  key={method.id}
                  className="flex items-center px-5 py-3"
                  style={{ borderBottom: `1px solid ${adminColors.border}`, opacity: method.enabled ? 1 : 0.6 }}
                >
                  <div className="flex flex-1 items-center gap-2.5">
                    {editing ? (
                      <>
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') submitRename(method)
                            if (e.key === 'Escape') setEditingId(null)
                          }}
                          autoFocus
                          className="rounded-lg px-3 text-sm outline-none"
                          style={{ height: 32, width: 240, border: `1px solid ${adminColors.border}`, color: adminColors.textPrimary }}
                        />
                        <button
                          type="button"
                          onClick={() => submitRename(method)}
                          title="保存"
                          className="flex h-7 w-7 items-center justify-center rounded-md"
                          style={{ border: `1px solid ${adminColors.border}` }}
                        >
                          <Check size={14} color="#16a34a" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          title="キャンセル"
                          className="flex h-7 w-7 items-center justify-center rounded-md"
                          style={{ border: `1px solid ${adminColors.border}` }}
                        >
                          <X size={14} color={adminColors.textSecondary} />
                        </button>
                      </>
                    ) : (
                      <>
                        <span style={{ fontSize: 14, fontWeight: 600, color: adminColors.textPrimary }}>{method.name}</span>
                        {!method.enabled && (
                          <span
                            className="rounded-full px-2 py-0.5"
                            style={{ backgroundColor: '#f5f5f5', color: adminColors.textSecondary, fontSize: 11, fontWeight: 700 }}
                          >
                            無効
                          </span>
                        )}
                      </>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => toggleEnabled(method)}
                      disabled={lastEnabled}
                      title={lastEnabled ? '有効な決済方法は最低1つ必要です' : method.enabled ? '無効化する（会計の選択肢から外す）' : '有効化する'}
                      className="rounded-md px-2 py-1 disabled:opacity-40"
                      style={{ border: `1px solid ${adminColors.border}`, fontSize: 11, fontWeight: 600, color: method.enabled ? '#dc2626' : '#16a34a' }}
                    >
                      {method.enabled ? '無効化' : '有効化'}
                    </button>
                    <button
                      type="button"
                      onClick={() => startEditing(method)}
                      title="名前を変更"
                      className="flex h-7 w-7 items-center justify-center rounded-md"
                      style={{ border: `1px solid ${adminColors.border}` }}
                    >
                      <Pencil size={14} color={adminColors.textPrimary} />
                    </button>
                    <button
                      type="button"
                      onClick={() => destroy(method)}
                      disabled={lastEnabled}
                      title={lastEnabled ? '有効な決済方法は最低1つ必要です' : '削除'}
                      className="flex h-7 w-7 items-center justify-center rounded-md disabled:opacity-40"
                      style={{ border: `1px solid ${adminColors.border}` }}
                    >
                      <Trash2 size={14} color="#dc2626" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </AdminLayout>
    </>
  )
}
