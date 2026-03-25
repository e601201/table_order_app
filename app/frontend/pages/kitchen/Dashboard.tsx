import { Head } from '@inertiajs/react'
import { useState } from 'react'
import { ChefHat, LayoutList, CircleCheck, Timer, Flame, Check, Bell } from 'lucide-react'

// --- 型定義 ---

type OrderStatus = 'new' | 'preparing' | 'ready' | 'completed'

interface OrderItem {
  id: number
  name: string
  quantity: number
}

interface Order {
  id: number
  orderNumber: string
  tableNumber: number
  status: OrderStatus
  elapsedMinutes: number
  items: OrderItem[]
}

// --- モックデータ ---

const initialOrders: Order[] = [
  {
    id: 1, orderNumber: '#1042', tableNumber: 4, status: 'new', elapsedMinutes: 2,
    items: [
      { id: 1, name: 'Tonkotsu Ramen', quantity: 2 },
      { id: 2, name: 'Gyoza (6pc)', quantity: 1 },
      { id: 3, name: 'Edamame', quantity: 1 },
    ],
  },
  {
    id: 2, orderNumber: '#1041', tableNumber: 7, status: 'new', elapsedMinutes: 1,
    items: [
      { id: 4, name: 'Chicken Katsu Curry', quantity: 1 },
      { id: 5, name: 'Miso Soup', quantity: 2 },
    ],
  },
  {
    id: 3, orderNumber: '#1040', tableNumber: 12, status: 'new', elapsedMinutes: 0,
    items: [
      { id: 6, name: 'Salmon Sashimi', quantity: 1 },
      { id: 7, name: 'Tempura Udon', quantity: 1 },
    ],
  },
  {
    id: 4, orderNumber: '#1039', tableNumber: 2, status: 'preparing', elapsedMinutes: 8,
    items: [
      { id: 8, name: 'Beef Teriyaki Don', quantity: 1 },
      { id: 9, name: 'Green Tea', quantity: 1 },
    ],
  },
  {
    id: 5, orderNumber: '#1038', tableNumber: 9, status: 'preparing', elapsedMinutes: 5,
    items: [
      { id: 10, name: 'Spicy Tuna Roll', quantity: 1 },
      { id: 11, name: 'Agedashi Tofu', quantity: 1 },
    ],
  },
  {
    id: 6, orderNumber: '#1036', tableNumber: 5, status: 'preparing', elapsedMinutes: 2,
    items: [
      { id: 12, name: 'Katsu Sando', quantity: 1 },
      { id: 13, name: 'Karaage', quantity: 2 },
      { id: 14, name: 'Nasi Bowl', quantity: 1 },
    ],
  },
  {
    id: 7, orderNumber: '#1037', tableNumber: 1, status: 'ready', elapsedMinutes: 14,
    items: [
      { id: 15, name: 'Chicken Ramen', quantity: 1 },
      { id: 16, name: 'Takoyaki (8pc)', quantity: 2 },
    ],
  },
  {
    id: 8, orderNumber: '#1035', tableNumber: 6, status: 'ready', elapsedMinutes: 11,
    items: [
      { id: 17, name: 'Pork Katsu', quantity: 1 },
      { id: 18, name: 'Matcha Ice Cream', quantity: 1 },
    ],
  },
]

// --- ステータス設定 ---

const statusConfig: Record<OrderStatus, { color: string; bg: string; label: string }> = {
  new: { color: '#dc2626', bg: '#fef2f2', label: 'New Orders' },
  preparing: { color: '#ea580c', bg: '#fff7ed', label: 'Preparing' },
  ready: { color: '#16a34a', bg: '#f0fdf4', label: 'Ready to Serve' },
  completed: { color: '#737373', bg: '#f5f5f5', label: 'Completed' },
}

// --- サブコンポーネント ---

function SidebarNavItem({
  active,
  icon,
  label,
  count,
  color,
  bg,
  onClick,
}: {
  active: boolean
  icon: React.ReactNode
  label: string
  count: number
  color: string
  bg: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-between w-full rounded-lg px-3 py-2.5"
      style={active ? { backgroundColor: '#171717' } : {}}
    >
      <div className="flex items-center gap-2.5">
        {icon}
        <span
          className="text-sm"
          style={{
            fontFamily: 'Inter, sans-serif',
            fontWeight: active ? 600 : 500,
            color: active ? '#fafafa' : '#0a0a0a',
          }}
        >
          {label}
        </span>
      </div>
      {active ? (
        <span
          className="text-xs font-bold rounded-xl px-2 py-0.5"
          style={{ fontFamily: 'Inter, sans-serif', backgroundColor: '#fafafa', color: '#171717' }}
        >
          {count}
        </span>
      ) : (
        <span
          className="text-xs font-bold rounded-xl px-2 py-0.5"
          style={{ fontFamily: 'Inter, sans-serif', backgroundColor: bg, color }}
        >
          {count}
        </span>
      )}
    </button>
  )
}

function OrderCard({
  order,
  onAction,
}: {
  order: Order
  onAction: (orderId: number) => void
}) {
  const config = statusConfig[order.status]

  const buttonConfig: Record<OrderStatus, { label: string; icon: React.ReactNode; bg: string; textColor: string; border?: string }> = {
    new: { label: 'Start Preparing', icon: <Flame size={16} color="#FFFFFF" />, bg: '#ea580c', textColor: '#FFFFFF' },
    preparing: { label: 'Mark Ready', icon: <Check size={16} color="#FFFFFF" />, bg: '#16a34a', textColor: '#FFFFFF' },
    ready: { label: 'Notify Server', icon: <Bell size={16} color="#0a0a0a" />, bg: '#f5f5f5', textColor: '#0a0a0a', border: '1px solid #e5e5e5' },
    completed: { label: '', icon: null, bg: '', textColor: '' },
  }

  const btn = buttonConfig[order.status]

  const qtyBg = order.status === 'ready' ? '#f0fdf4' : '#f5f5f5'
  const qtyColor = order.status === 'ready' ? '#16a34a' : '#0a0a0a'

  return (
    <div
      className="flex flex-col rounded-[10px] min-w-0"
      style={{
        backgroundColor: '#fafafa',
        borderTop: `3px solid ${config.color}`,
        boxShadow: 'inset 0 0 0 1px #e5e5e5',
        flex: '1 1 0',
      }}
    >
      {/* カードヘッダー */}
      <div
        className="flex items-center justify-between px-3.5 py-3"
        style={{ borderBottom: '1px solid #e5e5e5' }}
      >
        <div className="flex flex-col gap-0.5">
          <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: 16, fontWeight: 800, color: '#0a0a0a' }}>
            Table {order.tableNumber}
          </span>
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: 500, color: '#737373' }}>
            {order.orderNumber}
          </span>
        </div>
        <div
          className="flex items-center gap-1 rounded-md px-2 py-1"
          style={{ backgroundColor: config.bg }}
        >
          <Timer size={12} color={config.color} />
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: 600, color: config.color }}>
            {order.elapsedMinutes}m
          </span>
        </div>
      </div>

      {/* 注文アイテム */}
      <div className="flex flex-col gap-1.5 px-3.5 py-2.5">
        {order.items.map((item) => (
          <div key={item.id} className="flex items-center gap-2">
            <div
              className="flex items-center justify-center rounded"
              style={{
                width: 22, height: 22, backgroundColor: qtyBg,
                fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 700, color: qtyColor,
              }}
            >
              {item.quantity}
            </div>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 500, color: '#0a0a0a' }}>
              {item.name}
            </span>
          </div>
        ))}
      </div>

      {/* アクションボタン */}
      {order.status !== 'completed' && (
        <div className="px-3.5 py-2.5" style={{ borderTop: '1px solid #e5e5e5' }}>
          <button
            onClick={() => onAction(order.id)}
            className="flex items-center justify-center gap-1.5 w-full rounded-lg"
            style={{
              height: 36,
              backgroundColor: btn.bg,
              color: btn.textColor,
              border: btn.border,
              fontFamily: 'Inter, sans-serif',
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            {btn.icon}
            {btn.label}
          </button>
        </div>
      )}
    </div>
  )
}

// --- メインコンポーネント ---

export default function KitchenDashboard() {
  const [orders, setOrders] = useState<Order[]>(initialOrders)
  const [activeFilter, setActiveFilter] = useState<'all' | OrderStatus>('all')

  const handleAction = (orderId: number) => {
    setOrders((prev) =>
      prev.map((order) => {
        if (order.id !== orderId) return order
        const next: Record<OrderStatus, OrderStatus> = {
          new: 'preparing',
          preparing: 'ready',
          ready: 'completed',
          completed: 'completed',
        }
        return { ...order, status: next[order.status] }
      }),
    )
  }

  const countByStatus = (status: OrderStatus) => orders.filter((o) => o.status === status).length
  const activeOrders = orders.filter((o) => o.status !== 'completed')
  const completedCount = countByStatus('completed')

  const filterOrders = (status: OrderStatus) =>
    activeFilter === 'all' || activeFilter === status
      ? orders.filter((o) => o.status === status)
      : []

  const now = new Date()
  const timeLabel = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`

  return (
    <>
      <Head title="Kitchen Dashboard" />
      <div className="flex flex-col h-screen" style={{ backgroundColor: '#fafafa', fontFamily: 'Inter, sans-serif' }}>
        {/* ヘッダーバー */}
        <header
          className="flex items-center justify-between h-14 px-5 shrink-0"
          style={{ backgroundColor: '#fafafa', borderBottom: '1px solid #e5e5e5' }}
        >
          <div className="flex items-center gap-3">
            <ChefHat size={28} color="#171717" />
            <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: 20, fontWeight: 800, color: '#0a0a0a', letterSpacing: -0.5 }}>
              Kitchen Orders
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75 animate-ping" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
              </span>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 600, color: '#16a34a' }}>
                Live
              </span>
            </div>
            <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: 20, fontWeight: 700, color: '#0a0a0a', letterSpacing: -0.5 }}>
              {timeLabel}
            </span>
          </div>
        </header>

        {/* メインレイアウト */}
        <div className="flex flex-1 min-h-0">
          {/* サイドバー */}
          <aside
            className="flex flex-col gap-2 w-[220px] shrink-0 p-3"
            style={{ backgroundColor: '#fafafa', borderRight: '1px solid #e5e5e5' }}
          >
            <span
              className="px-3 pt-1 pb-2"
              style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 600, color: '#737373', letterSpacing: 2 }}
            >
              ORDER STATUS
            </span>

            <SidebarNavItem
              active={activeFilter === 'all'}
              icon={<LayoutList size={18} color={activeFilter === 'all' ? '#fafafa' : '#171717'} />}
              label="All Active"
              count={activeOrders.length}
              color="#171717"
              bg="#f5f5f5"
              onClick={() => setActiveFilter('all')}
            />
            <SidebarNavItem
              active={activeFilter === 'new'}
              icon={<span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#dc2626' }} />}
              label="New Orders"
              count={countByStatus('new')}
              color="#dc2626"
              bg="#fef2f2"
              onClick={() => setActiveFilter('new')}
            />
            <SidebarNavItem
              active={activeFilter === 'preparing'}
              icon={<span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#ea580c' }} />}
              label="Preparing"
              count={countByStatus('preparing')}
              color="#ea580c"
              bg="#fff7ed"
              onClick={() => setActiveFilter('preparing')}
            />
            <SidebarNavItem
              active={activeFilter === 'ready'}
              icon={<span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#16a34a' }} />}
              label="Ready"
              count={countByStatus('ready')}
              color="#16a34a"
              bg="#f0fdf4"
              onClick={() => setActiveFilter('ready')}
            />

            <div className="h-px mx-3" style={{ backgroundColor: '#e5e5e5' }} />

            <button
              onClick={() => setActiveFilter('completed' as any)}
              className="flex items-center justify-between w-full rounded-lg px-3 py-2.5"
            >
              <div className="flex items-center gap-2.5">
                <CircleCheck size={18} color="#737373" />
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#737373' }}>
                  Completed
                </span>
              </div>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: 500, color: '#737373' }}>
                {completedCount}
              </span>
            </button>
          </aside>

          {/* メインコンテンツ */}
          <main className="flex-1 overflow-y-auto p-5" style={{ backgroundColor: '#fafafa' }}>
            <div className="flex flex-col gap-5">
              {/* New Orders セクション */}
              {filterOrders('new').length > 0 && (
                <OrderSection status="new" orders={filterOrders('new')} onAction={handleAction} />
              )}

              {/* Preparing セクション */}
              {filterOrders('preparing').length > 0 && (
                <OrderSection status="preparing" orders={filterOrders('preparing')} onAction={handleAction} />
              )}

              {/* Ready セクション */}
              {filterOrders('ready').length > 0 && (
                <OrderSection status="ready" orders={filterOrders('ready')} onAction={handleAction} />
              )}

              {/* 空の状態 */}
              {filterOrders('new').length === 0 &&
                filterOrders('preparing').length === 0 &&
                filterOrders('ready').length === 0 && (
                  <div className="flex items-center justify-center h-64">
                    <span style={{ fontSize: 15, color: '#737373' }}>No orders to display</span>
                  </div>
                )}
            </div>
          </main>
        </div>
      </div>
    </>
  )
}

function OrderSection({
  status,
  orders,
  onAction,
}: {
  status: OrderStatus
  orders: Order[]
  onAction: (orderId: number) => void
}) {
  const config = statusConfig[status]

  return (
    <section className="flex flex-col gap-3">
      {/* セクションヘッダー */}
      <div className="flex items-center gap-2.5">
        <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: config.color }} />
        <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: 18, fontWeight: 700, color: '#0a0a0a', letterSpacing: -0.3 }}>
          {config.label}
        </span>
        <span
          className="text-xs font-bold rounded-xl px-2.5 py-0.5"
          style={{ fontFamily: 'Inter, sans-serif', backgroundColor: config.bg, color: config.color }}
        >
          {orders.length}
        </span>
      </div>

      {/* カードグリッド */}
      <div className="flex gap-3.5">
        {orders.map((order) => (
          <OrderCard key={order.id} order={order} onAction={onAction} />
        ))}
      </div>
    </section>
  )
}
