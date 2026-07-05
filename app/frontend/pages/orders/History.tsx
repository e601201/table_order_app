import { ShoppingBag } from 'lucide-react'
import CustomerOrderListShell from '@/components/CustomerOrderListShell'
import StatusBadge from '@/components/StatusBadge'
import { customerClosedBadge, takeoutCustomerStatusMeta } from '@/lib/orderStatus'
import { formatMonthDayTimeJST } from '@/lib/time'
import type { HistoryOrder } from '@/types'

interface HistoryProps {
  display_name: string | null
  orders: HistoryOrder[]
}

// 注文履歴（ADR-0008）: 現在進行中＋過去を兼ねる本人限定の一覧。
// 更新はページロード時のスナップショット（polling なし）。
export default function History({ display_name, orders }: HistoryProps) {
  return (
    <CustomerOrderListShell
      title="注文履歴"
      headerRight={
        display_name && (
          <span className="text-xs font-semibold text-[#6D5D4B] truncate max-w-[120px]">
            {display_name} さん
          </span>
        )
      }
      empty={orders.length === 0}
      emptyIcon={ShoppingBag}
      emptyMessage="ご注文の履歴はまだありません"
      emptyLinkHref="/order"
      emptyLinkLabel="メニューを見る"
    >
      {orders.map((order) => {
        // 履歴はテイクアウト専用面 — 終端は「受取済み」（ADR-0009）。
        // 打ち切り済みは理由を問わず「キャンセル」1種（ADR-0010）。
        const status = order.closed ? customerClosedBadge : takeoutCustomerStatusMeta[order.status]
        return (
          <div
            key={order.id}
            className="flex flex-col gap-2.5 rounded-2xl bg-white border border-[#F0E0D0] shadow-[0_2px_8px_rgba(26,18,16,0.03)] p-4"
          >
            {/* Row: number + status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold text-[#E53935] tracking-[-0.5px]">
                  #{order.order_number}
                </span>
                <span className="text-xs text-[#9E8E7E]">{formatMonthDayTimeJST(order.placed_at)}</span>
              </div>
              <StatusBadge {...status} />
            </div>

            {/* Items */}
            <div className="flex flex-col gap-1.5">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[13px] font-semibold text-[#1A1210]">
                      {item.quantity}x {item.name}
                    </span>
                    {item.customization && (
                      <span className="text-[11px] text-[#9E8E7E]">{item.customization}</span>
                    )}
                  </div>
                  <span className="text-[13px] font-medium text-[#6D5D4B]">
                    ¥{item.line_total.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="flex items-center justify-between pt-2 border-t border-[#F0E0D0]">
              <span className="text-xs text-[#9E8E7E]">{order.item_count} 点</span>
              <span className="text-base font-bold text-[#1A1210] tracking-[-0.5px]">
                ¥{order.total.toLocaleString()}
              </span>
            </div>
          </div>
        )
      })}
    </CustomerOrderListShell>
  )
}
