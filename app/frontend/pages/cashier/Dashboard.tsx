import { Head, Link, router } from '@inertiajs/react'
import { useMemo, useState } from 'react'
import { Search, RefreshCw, CreditCard, X, ChefHat } from 'lucide-react'
import type { CashierOrder, PaymentStatus } from '@/types'

// --- サブコンポーネント ---

function StatusBadge({ status }: { status: PaymentStatus }) {
  const isUnpaid = status === 'unpaid'
  return (
    <span
      className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold"
      style={{
        fontFamily: 'Inter, sans-serif',
        backgroundColor: isUnpaid ? '#fef2f2' : '#f0fdf4',
        color: isUnpaid ? '#dc2626' : '#16a34a',
      }}
    >
      {isUnpaid ? 'Unpaid' : 'Paid'}
    </span>
  )
}

function formatTime(iso: string): string {
  const date = new Date(iso)
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`
}

function OrderTable({
  orders,
  selectedOrderId,
  onSelectOrder,
}: {
  orders: CashierOrder[]
  selectedOrderId: number | null
  onSelectOrder: (id: number) => void
}) {
  return (
    <table className="w-full" style={{ fontFamily: 'Inter, sans-serif' }}>
      <thead>
        <tr style={{ borderBottom: '1px solid #e5e5e5' }}>
          {['ORDER #', 'TABLE', 'ITEMS', 'AMOUNT', 'TIME', 'STATUS'].map((header) => (
            <th
              key={header}
              className="text-left px-4 py-2.5"
              style={{ fontSize: 11, fontWeight: 600, color: '#a3a3a3', letterSpacing: 0.5 }}
            >
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {orders.map((order) => (
          <tr
            key={order.id}
            onClick={() => onSelectOrder(order.id)}
            className="cursor-pointer"
            style={{
              borderBottom: '1px solid #f5f5f5',
              backgroundColor: selectedOrderId === order.id ? '#f5f5f5' : 'transparent',
            }}
          >
            <td className="px-4 py-3" style={{ fontSize: 14, fontWeight: 700, color: '#0a0a0a' }}>
              {order.order_number}
            </td>
            <td className="px-4 py-3">
              <span className="flex items-center gap-1.5" style={{ fontSize: 13, fontWeight: 500, color: '#525252' }}>
                <span style={{ fontSize: 12, color: '#a3a3a3' }}>🪑</span>
                T-{order.table_number}
              </span>
            </td>
            <td className="px-4 py-3" style={{ fontSize: 13, fontWeight: 500, color: '#525252' }}>
              {order.items.reduce((sum, item) => sum + item.quantity, 0)}
            </td>
            <td className="px-4 py-3" style={{ fontSize: 13, fontWeight: 700, color: '#0a0a0a' }}>
              ¥{order.total.toLocaleString()}
            </td>
            <td className="px-4 py-3" style={{ fontSize: 13, fontWeight: 500, color: '#737373' }}>
              {formatTime(order.placed_at)}
            </td>
            <td className="px-4 py-3">
              <StatusBadge status={order.payment_status} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function OrderSummary({
  order,
  onCancel,
}: {
  order: CashierOrder | null
  onCancel: () => void
}) {
  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3" style={{ color: '#a3a3a3' }}>
        <CreditCard size={40} strokeWidth={1.5} />
        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500 }}>
          Select an order to view details
        </span>
      </div>
    )
  }

  const isPaid = order.payment_status === 'paid'

  return (
    <div className="flex flex-col h-full" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* ヘッダー */}
      <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #e5e5e5' }}>
        <span style={{ fontSize: 16, fontWeight: 700, color: '#0a0a0a', fontFamily: 'Outfit, sans-serif' }}>
          Order Summary
        </span>
        <span
          className="flex items-center justify-center rounded-md px-2.5 py-1"
          style={{ fontSize: 13, fontWeight: 700, color: '#fafafa', backgroundColor: '#171717' }}
        >
          {order.order_number}
        </span>
      </div>

      {/* 注文メタ情報 */}
      <div
        className="flex items-center gap-4 px-5 py-3"
        style={{ borderBottom: '1px solid #f5f5f5' }}
      >
        <span className="flex items-center gap-1" style={{ fontSize: 12, fontWeight: 500, color: '#737373' }}>
          🪑 Table {order.table_number}
        </span>
        <span className="flex items-center gap-1" style={{ fontSize: 12, fontWeight: 500, color: '#737373' }}>
          🕐 {formatTime(order.placed_at)}
        </span>
        <span className="flex items-center gap-1" style={{ fontSize: 12, fontWeight: 500, color: '#737373' }}>
          📦 {order.items.length} items
        </span>
      </div>

      {/* 注文アイテム */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-5 py-3">
          <span
            className="block pb-2"
            style={{ fontSize: 11, fontWeight: 600, color: '#a3a3a3', letterSpacing: 1.5 }}
          >
            ORDERED ITEMS
          </span>
          <div className="flex flex-col gap-2">
            {order.items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between py-1.5"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="flex items-center justify-center w-6 h-6 rounded"
                    style={{ backgroundColor: '#f5f5f5', fontSize: 12, fontWeight: 700, color: '#525252' }}
                  >
                    {item.quantity}
                  </span>
                  <span style={{ fontSize: 14, fontWeight: 500, color: '#0a0a0a' }}>
                    {item.name}
                    {item.size_label && (
                      <span style={{ fontSize: 12, fontWeight: 400, color: '#a3a3a3', marginLeft: 6 }}>
                        ({item.size_label})
                      </span>
                    )}
                  </span>
                </div>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#0a0a0a' }}>
                  ¥{item.line_total.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 合計セクション */}
      <div className="px-5 py-4" style={{ borderTop: '1px solid #e5e5e5' }}>
        <div className="flex flex-col gap-2 pb-3">
          <div className="flex items-center justify-between">
            <span style={{ fontSize: 13, fontWeight: 500, color: '#737373' }}>Subtotal</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#0a0a0a' }}>¥{order.subtotal.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between">
            <span style={{ fontSize: 13, fontWeight: 500, color: '#737373' }}>Tax</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#0a0a0a' }}>¥{order.tax.toLocaleString()}</span>
          </div>
        </div>
        <div
          className="flex items-center justify-between pt-3"
          style={{ borderTop: '1px solid #e5e5e5' }}
        >
          <span style={{ fontSize: 16, fontWeight: 700, color: '#0a0a0a' }}>Total</span>
          <span style={{ fontSize: 22, fontWeight: 800, color: '#0a0a0a', fontFamily: 'Outfit, sans-serif' }}>
            ¥{order.total.toLocaleString()}
          </span>
        </div>
      </div>

      {/* アクションボタン */}
      <div className="px-5 pb-5 flex flex-col gap-2">
        {isPaid ? (
          <div
            className="flex items-center justify-center gap-2 w-full rounded-lg"
            style={{
              height: 48,
              backgroundColor: '#f0fdf4',
              color: '#16a34a',
              fontFamily: 'Inter, sans-serif',
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            Paid · ¥{order.total.toLocaleString()}
          </div>
        ) : (
          <Link
            href={`/cashier/payment/${order.id}`}
            className="flex items-center justify-center gap-2 w-full rounded-lg"
            style={{
              height: 48,
              backgroundColor: '#171717',
              color: '#fafafa',
              fontFamily: 'Inter, sans-serif',
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            <CreditCard size={18} />
            Proceed to Payment — ¥{order.total.toLocaleString()}
          </Link>
        )}
        <button
          onClick={onCancel}
          className="flex items-center justify-center w-full rounded-lg"
          style={{
            height: 40,
            backgroundColor: 'transparent',
            color: '#737373',
            fontFamily: 'Inter, sans-serif',
            fontSize: 13,
            fontWeight: 500,
          }}
        >
          Cancel Selection
        </button>
      </div>
    </div>
  )
}

// --- メインコンポーネント ---

export default function CashierDashboard({ orders }: { orders: CashierOrder[] }) {
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const filteredOrders = useMemo(() => {
    if (!searchQuery.trim()) return orders
    const q = searchQuery.toLowerCase()
    return orders.filter(
      (order) =>
        order.order_number.toLowerCase().includes(q) ||
        String(order.table_number).includes(q),
    )
  }, [orders, searchQuery])

  const selectedOrder = orders.find((o) => o.id === selectedOrderId) ?? null
  const unpaidCount = orders.filter((o) => o.payment_status === 'unpaid').length

  const now = new Date()
  const timeLabel = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`

  return (
    <>
      <Head title="Cashier Dashboard" />
      <div className="flex flex-col h-screen" style={{ backgroundColor: '#ffffff', fontFamily: 'Inter, sans-serif' }}>
        {/* ヘッダーバー */}
        <header
          className="flex items-center justify-between h-12 px-5 shrink-0"
          style={{ backgroundColor: '#171717' }}
        >
          <div className="flex items-center gap-3">
            <ChefHat size={22} color="#fafafa" />
            <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: 16, fontWeight: 800, color: '#fafafa' }}>
              Sakura Kitchen
            </span>
            <span
              className="rounded px-2 py-0.5"
              style={{ fontSize: 11, fontWeight: 600, color: '#a3a3a3', backgroundColor: '#262626' }}
            >
              Cashier Terminal
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75 animate-ping" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
              </span>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#22c55e' }}>Online</span>
            </div>
            <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: 16, fontWeight: 700, color: '#fafafa' }}>
              {timeLabel}
            </span>
          </div>
        </header>

        {/* メインレイアウト */}
        <div className="flex flex-1 min-h-0">
          {/* 左パネル — 注文一覧 */}
          <div className="flex flex-col flex-1 min-w-0">
            {/* 検索バー */}
            <div className="flex items-center gap-3 px-5 py-3" style={{ borderBottom: '1px solid #e5e5e5' }}>
              <div
                className="flex items-center flex-1 gap-2 rounded-lg px-3"
                style={{ height: 40, backgroundColor: '#f5f5f5' }}
              >
                <Search size={16} color="#a3a3a3" />
                <input
                  type="text"
                  placeholder="Search by order # or table #..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent outline-none"
                  style={{ fontSize: 13, fontWeight: 500, color: '#0a0a0a' }}
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')}>
                    <X size={14} color="#a3a3a3" />
                  </button>
                )}
              </div>
              <button
                className="flex items-center justify-center rounded-lg px-4"
                style={{
                  height: 40,
                  backgroundColor: '#171717',
                  color: '#fafafa',
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                Search
              </button>
            </div>

            {/* テーブル */}
            <div className="flex-1 overflow-y-auto">
              {filteredOrders.length === 0 ? (
                <div
                  className="flex flex-col items-center justify-center h-full gap-3"
                  style={{ color: '#a3a3a3', fontFamily: 'Inter, sans-serif' }}
                >
                  <CreditCard size={40} strokeWidth={1.5} />
                  <span style={{ fontSize: 14, fontWeight: 500 }}>No orders to display</span>
                </div>
              ) : (
                <OrderTable
                  orders={filteredOrders}
                  selectedOrderId={selectedOrderId}
                  onSelectOrder={setSelectedOrderId}
                />
              )}
            </div>

            {/* フッター */}
            <div
              className="flex items-center justify-between px-5 py-3 shrink-0"
              style={{ borderTop: '1px solid #e5e5e5' }}
            >
              <span style={{ fontSize: 12, fontWeight: 500, color: '#a3a3a3' }}>
                {unpaidCount} unpaid orders found
              </span>
              <button
                onClick={() => router.reload({ only: ['orders'] })}
                className="flex items-center gap-1.5"
                style={{ fontSize: 12, fontWeight: 600, color: '#525252' }}
              >
                <RefreshCw size={14} />
                Refresh
              </button>
            </div>
          </div>

          {/* 右パネル — 注文サマリー */}
          <aside
            className="flex flex-col w-[340px] shrink-0"
            style={{ borderLeft: '1px solid #e5e5e5', backgroundColor: '#fafafa' }}
          >
            <OrderSummary
              order={selectedOrder}
              onCancel={() => setSelectedOrderId(null)}
            />
          </aside>
        </div>
      </div>
    </>
  )
}
