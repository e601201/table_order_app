import type { AdminOrderRow, KitchenOrderStatus, OrderType, PaymentStatus } from '@/types'

// 'all' は「この軸では絞らない」を表す番兵。各軸の正準 enum と合成する。
export type OrderTypeFilter = 'all' | OrderType
export type KitchenFilter = 'all' | KitchenOrderStatus
export type PaymentFilter = 'all' | PaymentStatus

// Admin 注文管理（ADR-0005）の一覧で効く4軸の絞り込み条件。すべて AND で合成する。
export interface OrderFilters {
  query: string
  kitchen: KitchenFilter
  payment: PaymentFilter
  orderType: OrderTypeFilter
}

// 本日分の AdminOrderRow をクライアント側で絞り込む純粋関数。サーバーへは問い合わせず、
// props で来た全行から該当行だけを返す（issue #43）。
export function filterOrders(orders: AdminOrderRow[], f: OrderFilters): AdminOrderRow[] {
  const q = f.query.trim().toLowerCase()
  return orders.filter((o) => {
    const matchesType = f.orderType === 'all' || o.order_type === f.orderType
    const matchesKitchen = f.kitchen === 'all' || o.status === f.kitchen
    const matchesPayment = f.payment === 'all' || o.payment_status === f.payment
    const matchesQuery = q === '' || o.order_number.toLowerCase().includes(q)
    return matchesType && matchesKitchen && matchesPayment && matchesQuery
  })
}
