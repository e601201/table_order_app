import { Head, router } from '@inertiajs/react'
import { useState } from 'react'
import { ChefHat, LayoutList, CircleCheck, Clock, Flame, Check, Bell } from 'lucide-react'
import type { KitchenOrder, KitchenOrderStatus, OrdersByStatus } from '@/types'

// --- ステータス設定 ---

const statusConfig: Record<KitchenOrderStatus, { color: string; bg: string; label: string }> = {
  pending:     { color: '#dc2626', bg: '#fef2f2', label: 'New Orders' },
  in_progress: { color: '#ea580c', bg: '#fff7ed', label: 'Preparing' },
  ready:       { color: '#16a34a', bg: '#f0fdf4', label: 'Ready to Serve' },
  completed:   { color: '#737373', bg: '#f5f5f5', label: 'Completed' },
}

const nextStatus: Record<KitchenOrderStatus, KitchenOrderStatus | null> = {
  pending: 'in_progress',
  in_progress: 'ready',
  ready: 'completed',
  completed: null,
}

// --- フォーマッタ ---

function formatPlacedAt(iso: string): string {
  const d = new Date(iso)
  const hh = d.getHours().toString().padStart(2, '0')
  const mm = d.getMinutes().toString().padStart(2, '0')
  return `${hh}:${mm}`
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
  order: KitchenOrder
  onAction: (order: KitchenOrder) => void
}) {
  const config = statusConfig[order.status]

  const buttonConfig: Record<KitchenOrderStatus, { label: string; icon: React.ReactNode; bg: string; textColor: string; border?: string }> = {
    pending:     { label: 'Start Preparing', icon: <Flame size={16} color="#FFFFFF" />, bg: '#ea580c', textColor: '#FFFFFF' },
    in_progress: { label: 'Mark Ready', icon: <Check size={16} color="#FFFFFF" />, bg: '#16a34a', textColor: '#FFFFFF' },
    ready:       { label: 'Notify Server', icon: <Bell size={16} color="#0a0a0a" />, bg: '#f5f5f5', textColor: '#0a0a0a', border: '1px solid #e5e5e5' },
    completed:   { label: '', icon: null, bg: '', textColor: '' },
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
            Table {order.table_number}
          </span>
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: 500, color: '#737373' }}>
            {order.order_number}
          </span>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span
            className="rounded-md px-2 py-0.5"
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: 0.5,
              textTransform: 'uppercase',
              backgroundColor: config.bg,
              color: config.color,
            }}
          >
            {config.label}
          </span>
          <div className="flex items-center gap-1">
            <Clock size={12} color="#737373" />
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: 600, color: '#737373' }}>
              {formatPlacedAt(order.placed_at)}
            </span>
          </div>
        </div>
      </div>

      {/* 注文アイテム */}
      <div className="flex flex-col gap-2 px-3.5 py-2.5">
        {order.items.map((item) => (
          <div key={item.id} className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
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
                {item.size_label && (
                  <span style={{ marginLeft: 6, fontSize: 12, fontWeight: 400, color: '#737373' }}>
                    ({item.size_label})
                  </span>
                )}
              </span>
            </div>
            {item.addons.length > 0 && (
              <span
                className="pl-7"
                style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: 400, color: '#737373' }}
              >
                {item.addons.map((a) => `+ ${a.label}`).join(', ')}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* アクションボタン */}
      {order.status !== 'completed' && (
        <div className="px-3.5 py-2.5" style={{ borderTop: '1px solid #e5e5e5' }}>
          <button
            onClick={() => onAction(order)}
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

export default function KitchenDashboard({ ordersByStatus }: { ordersByStatus: OrdersByStatus }) {
  const [activeFilter, setActiveFilter] = useState<'all' | KitchenOrderStatus>('all')

  const handleAction = (order: KitchenOrder) => {
    const next = nextStatus[order.status]
    if (!next) return
    router.patch(`/kitchen/orders/${order.id}`, { status: next }, { preserveScroll: true })
  }

  const countByStatus = (status: KitchenOrderStatus) => ordersByStatus[status].length
  const activeCount =
    countByStatus('pending') + countByStatus('in_progress') + countByStatus('ready')

  const sectionOrders = (status: KitchenOrderStatus): KitchenOrder[] => {
    if (activeFilter === 'all') {
      return status === 'completed' ? [] : ordersByStatus[status]
    }
    return activeFilter === status ? ordersByStatus[status] : []
  }

  const now = new Date()
  const timeLabel = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`

  const visibleSections: KitchenOrderStatus[] = ['pending', 'in_progress', 'ready', 'completed']
  const hasAny = visibleSections.some((s) => sectionOrders(s).length > 0)

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
              count={activeCount}
              color="#171717"
              bg="#f5f5f5"
              onClick={() => setActiveFilter('all')}
            />
            <SidebarNavItem
              active={activeFilter === 'pending'}
              icon={<span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#dc2626' }} />}
              label="New Orders"
              count={countByStatus('pending')}
              color="#dc2626"
              bg="#fef2f2"
              onClick={() => setActiveFilter('pending')}
            />
            <SidebarNavItem
              active={activeFilter === 'in_progress'}
              icon={<span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#ea580c' }} />}
              label="Preparing"
              count={countByStatus('in_progress')}
              color="#ea580c"
              bg="#fff7ed"
              onClick={() => setActiveFilter('in_progress')}
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
              onClick={() => setActiveFilter('completed')}
              className="flex items-center justify-between w-full rounded-lg px-3 py-2.5"
              style={activeFilter === 'completed' ? { backgroundColor: '#171717' } : {}}
            >
              <div className="flex items-center gap-2.5">
                <CircleCheck size={18} color={activeFilter === 'completed' ? '#fafafa' : '#737373'} />
                <span
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: 14,
                    fontWeight: activeFilter === 'completed' ? 600 : 500,
                    color: activeFilter === 'completed' ? '#fafafa' : '#737373',
                  }}
                >
                  Completed
                </span>
              </div>
              <span
                className="text-xs font-bold rounded-xl px-2 py-0.5"
                style={{
                  fontFamily: 'Inter, sans-serif',
                  backgroundColor: activeFilter === 'completed' ? '#fafafa' : '#f5f5f5',
                  color: activeFilter === 'completed' ? '#171717' : '#737373',
                }}
              >
                {countByStatus('completed')}
              </span>
            </button>
          </aside>

          {/* メインコンテンツ */}
          <main className="flex-1 overflow-y-auto p-5" style={{ backgroundColor: '#fafafa' }}>
            <div className="flex flex-col gap-5">
              {visibleSections.map((status) => {
                const orders = sectionOrders(status)
                if (orders.length === 0) return null
                return (
                  <OrderSection
                    key={status}
                    status={status}
                    orders={orders}
                    onAction={handleAction}
                  />
                )
              })}

              {!hasAny && (
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
  status: KitchenOrderStatus
  orders: KitchenOrder[]
  onAction: (order: KitchenOrder) => void
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
      <div className="flex gap-3.5 flex-wrap">
        {orders.map((order) => (
          <OrderCard key={order.id} order={order} onAction={onAction} />
        ))}
      </div>
    </section>
  )
}
