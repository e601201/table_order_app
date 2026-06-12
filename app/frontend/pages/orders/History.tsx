import { Head, Link } from '@inertiajs/react'
import { ArrowLeft, ShoppingBag } from 'lucide-react'
import { customerClosedBadge, takeoutCustomerStatusMeta } from '@/lib/orderStatus'
import type { HistoryOrder } from '@/types'

interface HistoryProps {
  display_name: string | null
  orders: HistoryOrder[]
}

function formatPlacedAt(iso: string): string {
  return new Date(iso).toLocaleString('ja-JP', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// 注文履歴（ADR-0008）: 現在進行中＋過去を兼ねる本人限定の一覧。
// 更新はページロード時のスナップショット（polling なし）。
export default function History({ display_name, orders }: HistoryProps) {
  return (
    <>
      <Head title="注文履歴" />
      <div
        className="relative mx-auto max-w-[390px] min-h-screen bg-[#FFF8F0] flex flex-col"
        style={{ fontFamily: 'Outfit, sans-serif' }}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between h-14 px-4 bg-white border-b border-[#F0E0D0] shadow-[0_2px_8px_rgba(26,18,16,0.03)]">
          <div className="flex items-center gap-3">
            <Link
              href="/order"
              className="flex items-center justify-center w-9 h-9 rounded-full bg-[#FFF3E0] border border-[#F0E0D0]"
            >
              <ArrowLeft className="w-5 h-5 text-[#1A1210]" />
            </Link>
            <span className="text-lg font-bold text-[#1A1210] tracking-[-0.3px]">注文履歴</span>
          </div>
          {display_name && (
            <span className="text-xs font-semibold text-[#6D5D4B] truncate max-w-[120px]">
              {display_name} さん
            </span>
          )}
        </div>

        {/* Orders */}
        <div className="flex-1 flex flex-col gap-3 px-5 py-4">
          {orders.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <ShoppingBag className="w-12 h-12 text-[#C8B8A8]" />
              <span className="text-sm text-[#9E8E7E]">ご注文の履歴はまだありません</span>
              <Link href="/order" className="text-sm font-semibold text-[#E53935]">
                メニューを見る
              </Link>
            </div>
          )}

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
                    <span className="text-xs text-[#9E8E7E]">{formatPlacedAt(order.placed_at)}</span>
                  </div>
                  <span
                    className="px-2.5 py-1 rounded-full text-xs font-bold"
                    style={{ color: status.color, backgroundColor: status.bg }}
                  >
                    {status.label}
                  </span>
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
        </div>
      </div>
    </>
  )
}
