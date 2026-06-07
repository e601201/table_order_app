import { Head, Link, router } from '@inertiajs/react'
import { useMemo, useState } from 'react'
import { ShoppingBag, ChefHat, Wallet, Clock, Search, Eye, RefreshCw } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import AdminLayout, { adminColors } from '@/components/AdminLayout'
import { kitchenStatusMeta, kitchenStatusOrder, paymentStatusMeta } from '@/lib/orderStatus'
import type { AdminOrderRow, AdminOrderStats, KitchenOrderStatus, PaymentStatus } from '@/types'

interface OrdersProps {
  orders: AdminOrderRow[]
  stats: AdminOrderStats
}

type KitchenFilter = 'all' | KitchenOrderStatus
type PaymentFilter = 'all' | PaymentStatus

const kitchenTabs: { key: KitchenFilter; label: string }[] = [
  { key: 'all', label: 'すべて' },
  ...kitchenStatusOrder.map((s) => ({ key: s as KitchenFilter, label: kitchenStatusMeta[s].label })),
]

const paymentTabs: { key: PaymentFilter; label: string }[] = [
  { key: 'all', label: 'すべて' },
  { key: 'unpaid', label: paymentStatusMeta.unpaid.label },
  { key: 'paid', label: paymentStatusMeta.paid.label },
]

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
      style={{ backgroundColor: bg, color, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}
    >
      {label}
    </span>
  )
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string
  value: string | number
  icon: LucideIcon
  color: string
}) {
  return (
    <div
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
        {value}
      </p>
    </div>
  )
}

function FilterTabs<T extends string>({
  tabs,
  active,
  onSelect,
}: {
  tabs: { key: T; label: string }[]
  active: T
  onSelect: (key: T) => void
}) {
  return (
    <div className="flex items-center gap-1.5">
      {tabs.map((tab) => {
        const isActive = active === tab.key
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onSelect(tab.key)}
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
  )
}

function orderTypeLabel(order: AdminOrderRow): string {
  return order.order_type === 'takeout' ? 'テイクアウト' : `テーブル ${order.table_number}`
}

export default function Orders({ orders, stats }: OrdersProps) {
  const [query, setQuery] = useState('')
  const [kitchenFilter, setKitchenFilter] = useState<KitchenFilter>('all')
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>('all')

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return orders.filter((order) => {
      const matchesKitchen = kitchenFilter === 'all' || order.status === kitchenFilter
      const matchesPayment = paymentFilter === 'all' || order.payment_status === paymentFilter
      const matchesQuery = q === '' || order.order_number.toLowerCase().includes(q)
      return matchesKitchen && matchesPayment && matchesQuery
    })
  }, [orders, query, kitchenFilter, paymentFilter])

  const columns = ['注文番号', '商品', '金額', '状態', '受注時刻', '操作']

  return (
    <>
      <Head title="注文管理" />
      <AdminLayout
        active="orders"
        breadcrumb="注文管理"
        title="注文管理"
        description="本日の注文を確認します（閲覧専用）"
        headerActions={
          <button
            type="button"
            onClick={() => router.reload({ only: ['orders', 'stats'] })}
            className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition hover:opacity-90"
            style={{ color: adminColors.textPrimary, border: `1px solid ${adminColors.border}` }}
          >
            <RefreshCw size={16} />
            更新
          </button>
        }
      >
        {/* 統計カード */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="本日の注文数" value={stats.orders_count} icon={ShoppingBag} color={adminColors.textPrimary} />
          <StatCard label="調理中" value={stats.in_progress_count} icon={ChefHat} color={kitchenStatusMeta.in_progress.color} />
          <StatCard label="本日の売上" value={yen(stats.sales_total)} icon={Wallet} color={paymentStatusMeta.paid.color} />
          <StatCard label="会計待ち" value={stats.awaiting_payment_count} icon={Clock} color={paymentStatusMeta.unpaid.color} />
        </div>

        {/* テーブルカード */}
        <div
          className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl"
          style={{ backgroundColor: adminColors.bg, border: `1px solid ${adminColors.border}` }}
        >
          {/* ツールバー: 検索 + 調理タブ + 支払いフィルタ */}
          <div
            className="flex flex-wrap items-center gap-3 p-4"
            style={{ borderBottom: `1px solid ${adminColors.border}` }}
          >
            <div
              className="flex items-center gap-2 rounded-lg px-3"
              style={{ height: 36, width: 260, border: `1px solid ${adminColors.border}` }}
            >
              <Search size={16} color={adminColors.textSecondary} />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="注文番号で検索..."
                className="w-full bg-transparent text-sm outline-none"
                style={{ color: adminColors.textPrimary }}
              />
            </div>

            <FilterTabs tabs={kitchenTabs} active={kitchenFilter} onSelect={setKitchenFilter} />

            <div className="ml-auto flex items-center gap-2">
              <span style={{ fontSize: 12, fontWeight: 600, color: adminColors.textSecondary }}>支払い</span>
              <FilterTabs tabs={paymentTabs} active={paymentFilter} onSelect={setPaymentFilter} />
            </div>
          </div>

          {/* テーブルヘッダー */}
          <div
            className="flex items-center px-4 py-2.5"
            style={{ backgroundColor: '#f5f5f5', borderBottom: `1px solid ${adminColors.border}` }}
          >
            <span className="flex-1" style={hcell}>{columns[0]}</span>
            <span className="flex-1" style={hcell}>{columns[1]}</span>
            <span style={{ ...hcell, width: 110, textAlign: 'right' }}>{columns[2]}</span>
            <span style={{ ...hcell, width: 200 }}>{columns[3]}</span>
            <span style={{ ...hcell, width: 80 }}>{columns[4]}</span>
            <span style={{ ...hcell, width: 80, textAlign: 'right' }}>{columns[5]}</span>
          </div>

          {/* テーブル本体 */}
          <div className="min-h-0 flex-1 overflow-y-auto">
            {visible.map((order) => {
              const k = kitchenStatusMeta[order.status]
              const p = paymentStatusMeta[order.payment_status]
              return (
                <div
                  key={order.id}
                  className="flex items-center px-4 py-3"
                  style={{ borderBottom: `1px solid ${adminColors.border}` }}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-mono" style={{ fontSize: 14, fontWeight: 700, color: adminColors.textPrimary }}>
                      {order.order_number}
                    </p>
                    <p className="truncate" style={{ fontSize: 12, color: adminColors.textSecondary }}>
                      {orderTypeLabel(order)}
                    </p>
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate" style={{ fontSize: 14, color: adminColors.textPrimary }}>
                      {order.items_summary}
                    </p>
                    <p style={{ fontSize: 12, color: adminColors.textSecondary }}>{order.item_count} 点</p>
                  </div>

                  <span style={{ width: 110, textAlign: 'right', fontSize: 14, fontWeight: 700, color: adminColors.textPrimary }}>
                    {yen(order.total)}
                  </span>

                  <div className="flex items-center gap-1.5" style={{ width: 200 }}>
                    <Badge label={k.label} color={k.color} bg={k.bg} />
                    <Badge label={p.label} color={p.color} bg={p.bg} />
                  </div>

                  <span style={{ width: 80, fontSize: 13, fontWeight: 500, color: adminColors.textSecondary }}>
                    {formatTime(order.placed_at)}
                  </span>

                  <div className="flex items-center justify-end" style={{ width: 80 }}>
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="flex items-center gap-1.5 rounded-md px-2.5 py-1"
                      style={{ fontSize: 13, fontWeight: 600, color: adminColors.textPrimary, border: `1px solid ${adminColors.border}` }}
                    >
                      <Eye size={14} />
                      詳細
                    </Link>
                  </div>
                </div>
              )
            })}

            {visible.length === 0 && (
              <div className="px-4 py-10 text-center" style={{ fontSize: 14, color: adminColors.textSecondary }}>
                {orders.length === 0 ? '本日の注文はまだありません' : '該当する注文がありません'}
              </div>
            )}
          </div>

          {/* フッター: 件数 */}
          <div
            className="flex items-center px-4 py-3"
            style={{ borderTop: `1px solid ${adminColors.border}` }}
          >
            <span style={{ fontSize: 12, fontWeight: 500, color: adminColors.textSecondary }}>
              {visible.length} 件 / 本日 {orders.length} 件
            </span>
          </div>
        </div>
      </AdminLayout>
    </>
  )
}

const hcell: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: adminColors.textSecondary,
  letterSpacing: 0.4,
}
