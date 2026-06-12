import { Head, Link } from '@inertiajs/react'
import { ArrowLeft } from 'lucide-react'
import AdminLayout, { adminColors } from '@/components/AdminLayout'
import { closureReasonLabel, kitchenStatusMeta, paymentStatusMeta } from '@/lib/orderStatus'
import type { AdminOrderDetail } from '@/types'

interface OrderDetailProps {
  order: AdminOrderDetail
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

function yen(n: number): string {
  return `¥${n.toLocaleString()}`
}

function Badge({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5"
      style={{ backgroundColor: bg, color, fontSize: 12, fontWeight: 600 }}
    >
      {label}
    </span>
  )
}

function MetaRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2" style={{ borderBottom: `1px solid ${adminColors.border}` }}>
      <span style={{ fontSize: 13, fontWeight: 500, color: adminColors.textSecondary }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 600, color: adminColors.textPrimary }}>{children}</span>
    </div>
  )
}

const paymentMethodLabel: Record<string, string> = {
  cash: '現金',
  credit_card: 'クレジットカード',
}

export default function OrderDetail({ order }: OrderDetailProps) {
  const k = kitchenStatusMeta[order.status]
  const p = paymentStatusMeta[order.payment_status]
  const orderTypeLabel = order.order_type === 'takeout' ? 'テイクアウト' : `テーブル ${order.table_number}`

  return (
    <>
      <Head title={`注文 ${order.order_number}`} />
      <AdminLayout
        active="orders"
        breadcrumb="注文詳細"
        title={order.order_number}
        description="注文の明細（閲覧専用）"
        headerActions={
          <Link
            href="/admin/orders"
            className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition hover:opacity-90"
            style={{ color: adminColors.textPrimary, border: `1px solid ${adminColors.border}` }}
          >
            <ArrowLeft size={16} />
            一覧へ戻る
          </Link>
        }
      >
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          {/* 明細 */}
          <div
            className="flex flex-col overflow-hidden rounded-xl"
            style={{ backgroundColor: adminColors.bg, border: `1px solid ${adminColors.border}` }}
          >
            <div className="px-5 py-4" style={{ borderBottom: `1px solid ${adminColors.border}` }}>
              <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: 16, fontWeight: 700, color: adminColors.textPrimary }}>
                注文アイテム
              </span>
            </div>

            <div>
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start justify-between px-5 py-3"
                  style={{ borderBottom: `1px solid ${adminColors.border}` }}
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <span
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded"
                      style={{ backgroundColor: '#f5f5f5', fontSize: 12, fontWeight: 700, color: adminColors.textPrimary }}
                    >
                      {item.quantity}
                    </span>
                    <div className="min-w-0">
                      <p style={{ fontSize: 14, fontWeight: 600, color: adminColors.textPrimary }}>
                        {item.name}
                        {item.size_label && (
                          <span style={{ fontSize: 12, fontWeight: 400, color: adminColors.textSecondary, marginLeft: 6 }}>
                            ({item.size_label})
                          </span>
                        )}
                      </p>
                      {item.addons.length > 0 && (
                        <p style={{ fontSize: 12, color: adminColors.textSecondary }}>
                          {item.addons.map((a) => a.label).join(', ')}
                        </p>
                      )}
                      <p style={{ fontSize: 12, color: adminColors.textSecondary }}>
                        {yen(item.unit_price)} × {item.quantity}
                      </p>
                    </div>
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 700, color: adminColors.textPrimary, whiteSpace: 'nowrap' }}>
                    {yen(item.line_total)}
                  </span>
                </div>
              ))}
            </div>

            {/* 合計 */}
            <div className="px-5 py-4">
              <div className="flex items-center justify-between py-1">
                <span style={{ fontSize: 13, fontWeight: 500, color: adminColors.textSecondary }}>小計</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: adminColors.textPrimary }}>{yen(order.subtotal)}</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span style={{ fontSize: 13, fontWeight: 500, color: adminColors.textSecondary }}>消費税</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: adminColors.textPrimary }}>{yen(order.tax)}</span>
              </div>
              <div
                className="mt-2 flex items-center justify-between pt-3"
                style={{ borderTop: `1px solid ${adminColors.border}` }}
              >
                <span style={{ fontSize: 16, fontWeight: 700, color: adminColors.textPrimary }}>合計</span>
                <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: 22, fontWeight: 800, color: adminColors.textPrimary }}>
                  {yen(order.total)}
                </span>
              </div>
            </div>
          </div>

          {/* メタ情報 */}
          <div
            className="flex h-fit flex-col rounded-xl px-5 py-4"
            style={{ backgroundColor: adminColors.bg, border: `1px solid ${adminColors.border}` }}
          >
            <span
              className="pb-2"
              style={{ fontFamily: 'Outfit, sans-serif', fontSize: 16, fontWeight: 700, color: adminColors.textPrimary }}
            >
              注文情報
            </span>
            <MetaRow label="調理進捗">
              <Badge label={k.label} color={k.color} bg={k.bg} />
            </MetaRow>
            <MetaRow label="支払い">
              <Badge label={p.label} color={p.color} bg={p.bg} />
            </MetaRow>
            <MetaRow label="種別">{orderTypeLabel}</MetaRow>
            <MetaRow label="受注時刻">{formatTime(order.placed_at)}</MetaRow>
            <MetaRow label="点数">{order.item_count} 点</MetaRow>
            {order.payment_method && (
              <MetaRow label="支払い方法">{paymentMethodLabel[order.payment_method] ?? order.payment_method}</MetaRow>
            )}
            {order.paid_at && <MetaRow label="会計時刻">{formatTime(order.paid_at)}</MetaRow>}
            {/* 打ち切り理由（閲覧専用の表示のみ。ADR-0010） */}
            {order.closure_reason && (
              <MetaRow label="打ち切り理由">{closureReasonLabel[order.closure_reason]}</MetaRow>
            )}
          </div>
        </div>
      </AdminLayout>
    </>
  )
}
