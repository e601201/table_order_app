import { Head, Link, router } from '@inertiajs/react'
import { useEffect, useMemo, useState } from 'react'
import { Search, RefreshCw, CreditCard, X, ChefHat, LogOut } from 'lucide-react'
import StaffSurfaceNav from '@/components/StaffSurfaceNav'
import FlashMessage from '@/components/FlashMessage'
import { closureReasonLabel, closureReasonsByOrderType, kitchenStatusMeta } from '@/lib/orderStatus'
import { formatTimeJST, formatTimeWithSecondsJST } from '@/lib/time'
import type { CashierOrder, ClosureReason, PaymentStatus } from '@/types'

// --- サブコンポーネント ---

// payment 軸の3状態（ADR-0010）。スタッフ面の Closed は「打ち切り」（キャンセルとは呼ばない）。
const paymentBadgeStyles: Record<PaymentStatus, { backgroundColor: string; color: string; label: string }> = {
  unpaid: { backgroundColor: '#fef2f2', color: '#dc2626', label: '未払い' },
  paid: { backgroundColor: '#f0fdf4', color: '#16a34a', label: '支払い済み' },
  closed: { backgroundColor: '#f5f5f5', color: '#525252', label: '打ち切り' },
}

function StatusBadge({ status }: { status: PaymentStatus }) {
  const style = paymentBadgeStyles[status]
  return (
    <span
      className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold"
      style={{
        fontFamily: 'Inter, sans-serif',
        backgroundColor: style.backgroundColor,
        color: style.color,
      }}
    >
      {style.label}
    </span>
  )
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
          {['注文番号', 'テーブル', '点数', '金額', '時刻', 'ステータス'].map((header) => (
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
                {order.order_type === 'takeout' ? 'テイクアウト' : `${order.table_number}番`}
              </span>
            </td>
            <td className="px-4 py-3" style={{ fontSize: 13, fontWeight: 500, color: '#525252' }}>
              {order.items.reduce((sum, item) => sum + item.quantity, 0)}
            </td>
            <td className="px-4 py-3" style={{ fontSize: 13, fontWeight: 700, color: '#0a0a0a' }}>
              ¥{order.total.toLocaleString()}
            </td>
            <td className="px-4 py-3" style={{ fontSize: 13, fontWeight: 500, color: '#737373' }}>
              {formatTimeWithSecondsJST(order.placed_at)}
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
  onClose,
  onReopen,
}: {
  order: CashierOrder | null
  onCancel: () => void
  onClose: (reason: ClosureReason) => void
  onReopen: () => void
}) {
  // 打ち切りは2段階（パネルを開く → 理由を選んで確定）。誤タップで注文を閉じない。
  const [closePanelOpen, setClosePanelOpen] = useState(false)
  const [closeReason, setCloseReason] = useState<ClosureReason | null>(null)

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3" style={{ color: '#a3a3a3' }}>
        <CreditCard size={40} strokeWidth={1.5} />
        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500 }}>
          注文を選択して詳細を表示
        </span>
      </div>
    )
  }

  const isPaid = order.payment_status === 'paid'
  const isClosed = order.payment_status === 'closed'
  // 会計の前提（ADR-0009）のミラー: In-store は Served、Takeout は Ready。
  const payable = order.order_type === 'takeout' ? order.status === 'ready' : order.status === 'served'

  return (
    <div className="flex flex-col h-full" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* ヘッダー */}
      <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #e5e5e5' }}>
        <span style={{ fontSize: 16, fontWeight: 700, color: '#0a0a0a', fontFamily: 'Outfit, sans-serif' }}>
          ご注文内容
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
          🪑 {order.order_type === 'takeout' ? 'テイクアウト' : `テーブル ${order.table_number}`}
        </span>
        <span className="flex items-center gap-1" style={{ fontSize: 12, fontWeight: 500, color: '#737373' }}>
          🕐 {formatTimeWithSecondsJST(order.placed_at)}
        </span>
        <span className="flex items-center gap-1" style={{ fontSize: 12, fontWeight: 500, color: '#737373' }}>
          📦 {order.items.length} 点
        </span>
      </div>

      {/* 注文アイテム */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-5 py-3">
          <span
            className="block pb-2"
            style={{ fontSize: 11, fontWeight: 600, color: '#a3a3a3', letterSpacing: 1.5 }}
          >
            注文アイテム
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
            <span style={{ fontSize: 13, fontWeight: 500, color: '#737373' }}>小計</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#0a0a0a' }}>¥{order.subtotal.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between">
            <span style={{ fontSize: 13, fontWeight: 500, color: '#737373' }}>消費税</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#0a0a0a' }}>¥{order.tax.toLocaleString()}</span>
          </div>
        </div>
        <div
          className="flex items-center justify-between pt-3"
          style={{ borderTop: '1px solid #e5e5e5' }}
        >
          <span style={{ fontSize: 16, fontWeight: 700, color: '#0a0a0a' }}>合計</span>
          <span style={{ fontSize: 22, fontWeight: 800, color: '#0a0a0a', fontFamily: 'Outfit, sans-serif' }}>
            ¥{order.total.toLocaleString()}
          </span>
        </div>
      </div>

      {/* アクションボタン */}
      <div className="px-5 pb-5 flex flex-col gap-2">
        {isPaid && (
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
            支払い済み · ¥{order.total.toLocaleString()}
          </div>
        )}

        {/* 打ち切り済み: 解除（reopen）だけができる。正準シナリオは no-show 後の来店（ADR-0010） */}
        {isClosed && (
          <>
            <div
              className="flex items-center justify-center gap-2 w-full rounded-lg"
              style={{
                height: 48,
                backgroundColor: '#f5f5f5',
                color: '#525252',
                fontFamily: 'Inter, sans-serif',
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              打ち切り済み{order.closure_reason ? ` · ${closureReasonLabel[order.closure_reason]}` : ''}
            </div>
            <button
              onClick={onReopen}
              className="flex items-center justify-center w-full rounded-lg"
              style={{
                height: 44,
                backgroundColor: 'transparent',
                border: '1px solid #e5e5e5',
                color: '#0a0a0a',
                fontFamily: 'Inter, sans-serif',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              打ち切り解除（会計に戻す）
            </button>
          </>
        )}

        {!isPaid && !isClosed && (
          <>
            {payable ? (
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
                決済に進む — ¥{order.total.toLocaleString()}
              </Link>
            ) : (
              <div
                className="flex items-center justify-center w-full rounded-lg"
                style={{
                  height: 48,
                  backgroundColor: '#fafafa',
                  border: '1px dashed #e5e5e5',
                  color: '#a3a3a3',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: 13,
                  fontWeight: 500,
                }}
              >
                {order.order_type === 'takeout' ? kitchenStatusMeta.ready.label : kitchenStatusMeta.served.label}
                になると会計できます（現在: {kitchenStatusMeta[order.status].label}）
              </div>
            )}

            {/* 打ち切り（ADR-0010）: 理由は order type で構造的に絞る */}
            {closePanelOpen ? (
              <div
                className="flex flex-col gap-2 rounded-lg p-3"
                style={{ border: '1px solid #e5e5e5', backgroundColor: '#ffffff' }}
              >
                <span style={{ fontSize: 12, fontWeight: 600, color: '#525252' }}>打ち切り理由を選択</span>
                <div className="flex flex-wrap gap-1.5">
                  {closureReasonsByOrderType[order.order_type].map((reason) => (
                    <button
                      key={reason}
                      onClick={() => setCloseReason(reason)}
                      className="rounded-md px-2.5 py-1.5"
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        backgroundColor: closeReason === reason ? '#171717' : '#f5f5f5',
                        color: closeReason === reason ? '#fafafa' : '#525252',
                      }}
                    >
                      {closureReasonLabel[reason]}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    disabled={!closeReason}
                    onClick={() => closeReason && onClose(closeReason)}
                    className="flex-1 rounded-md py-2"
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      backgroundColor: closeReason ? '#fef2f2' : '#f5f5f5',
                      color: closeReason ? '#dc2626' : '#a3a3a3',
                    }}
                  >
                    打ち切りを確定
                  </button>
                  <button
                    onClick={() => {
                      setClosePanelOpen(false)
                      setCloseReason(null)
                    }}
                    className="rounded-md px-4 py-2"
                    style={{ fontSize: 13, fontWeight: 500, color: '#737373', backgroundColor: 'transparent' }}
                  >
                    やめる
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setClosePanelOpen(true)}
                className="flex items-center justify-center w-full rounded-lg"
                style={{
                  height: 40,
                  backgroundColor: 'transparent',
                  border: '1px solid #e5e5e5',
                  color: '#737373',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: 13,
                  fontWeight: 500,
                }}
              >
                この注文を打ち切る
              </button>
            )}
          </>
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
          選択を解除
        </button>
      </div>
    </div>
  )
}

// --- メインコンポーネント ---

// 一覧の切り替え（ADR-0010）: 本日の会計（キュー∪会計済み）/ キュー外の未払い（品切れ等の
// 打ち切り対象に届く導線）/ 打ち切り済み（打ち切り解除の到達経路）。
type DashboardView = 'today' | 'outside' | 'closed'

export default function CashierDashboard({
  orders,
  outsideQueueOrders,
  closedOrders,
}: {
  orders: CashierOrder[]
  outsideQueueOrders: CashierOrder[]
  closedOrders: CashierOrder[]
}) {
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [view, setView] = useState<DashboardView>('today')

  // 会計待ちキューを手動更新なしで最新化（ADR-0007）。
  // 下部の手動「更新」ボタンは残しつつ、ポーリングで注文系 props のみ部分リロード。
  useEffect(() => {
    const id = setInterval(() => {
      router.reload({ only: ['orders', 'outsideQueueOrders', 'closedOrders'] })
    }, 7000)
    return () => clearInterval(id)
  }, [])

  const viewOrders = view === 'today' ? orders : view === 'outside' ? outsideQueueOrders : closedOrders

  const filteredOrders = useMemo(() => {
    if (!searchQuery.trim()) return viewOrders
    const q = searchQuery.toLowerCase()
    return viewOrders.filter((order) => {
      if (order.order_number.toLowerCase().includes(q)) return true
      if (order.order_type === 'takeout') return 'takeout'.includes(q)
      return order.table_number !== null && String(order.table_number).includes(q)
    })
  }, [viewOrders, searchQuery])

  const selectedOrder =
    [...orders, ...outsideQueueOrders, ...closedOrders].find((o) => o.id === selectedOrderId) ?? null
  const unpaidCount = orders.filter((o) => o.payment_status === 'unpaid').length

  const timeLabel = formatTimeJST(new Date())

  return (
    <>
      <Head title="レジダッシュボード" />
      <FlashMessage />
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
              <span style={{ fontSize: 12, fontWeight: 600, color: '#22c55e' }}>オンライン</span>
            </div>
            <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: 16, fontWeight: 700, color: '#fafafa' }}>
              {timeLabel}
            </span>
            <StaffSurfaceNav current="cashier" tone="dark" />
            <button
              type="button"
              onClick={() => router.delete('/logout')}
              className="flex items-center gap-1.5 rounded px-2 py-1"
              style={{ fontSize: 12, fontWeight: 600, color: '#a3a3a3', backgroundColor: '#262626' }}
            >
              <LogOut size={14} />
              ログアウト
            </button>
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
                  placeholder="注文番号またはテーブル番号で検索..."
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
                検索
              </button>
            </div>

            {/* 一覧タブ（ADR-0010） */}
            <div className="flex items-center gap-2 px-5 py-2" style={{ borderBottom: '1px solid #e5e5e5' }}>
              {(
                [
                  { key: 'today', label: '本日の会計', count: orders.length },
                  { key: 'outside', label: 'キュー外の未払い', count: outsideQueueOrders.length },
                  { key: 'closed', label: '打ち切り済み', count: closedOrders.length },
                ] as { key: DashboardView; label: string; count: number }[]
              ).map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setView(tab.key)}
                  className="rounded-lg px-3 py-1.5"
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    backgroundColor: view === tab.key ? '#171717' : '#f5f5f5',
                    color: view === tab.key ? '#fafafa' : '#525252',
                  }}
                >
                  {tab.label} {tab.count}
                </button>
              ))}
            </div>

            {/* テーブル */}
            <div className="flex-1 overflow-y-auto">
              {filteredOrders.length === 0 ? (
                <div
                  className="flex flex-col items-center justify-center h-full gap-3"
                  style={{ color: '#a3a3a3', fontFamily: 'Inter, sans-serif' }}
                >
                  <CreditCard size={40} strokeWidth={1.5} />
                  <span style={{ fontSize: 14, fontWeight: 500 }}>表示する注文がありません</span>
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
                未払い注文 {unpaidCount} 件
              </span>
              <button
                onClick={() => router.reload({ only: ['orders', 'outsideQueueOrders', 'closedOrders'] })}
                className="flex items-center gap-1.5"
                style={{ fontSize: 12, fontWeight: 600, color: '#525252' }}
              >
                <RefreshCw size={14} />
                更新
              </button>
            </div>
          </div>

          {/* 右パネル — 注文サマリー */}
          <aside
            className="flex flex-col w-[340px] shrink-0"
            style={{ borderLeft: '1px solid #e5e5e5', backgroundColor: '#fafafa' }}
          >
            <OrderSummary
              key={selectedOrder?.id ?? 'none'}
              order={selectedOrder}
              onCancel={() => setSelectedOrderId(null)}
              onClose={(reason) => {
                if (selectedOrder) {
                  router.post(`/cashier/orders/${selectedOrder.id}/close`, { closure_reason: reason })
                }
              }}
              onReopen={() => {
                if (selectedOrder) {
                  router.post(`/cashier/orders/${selectedOrder.id}/reopen`)
                }
              }}
            />
          </aside>
        </div>
      </div>
    </>
  )
}
