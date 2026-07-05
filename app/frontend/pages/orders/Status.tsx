import { usePoll } from '@inertiajs/react'
import { useEffect } from 'react'
import { CookingPot } from 'lucide-react'
import CustomerOrderListShell from '@/components/CustomerOrderListShell'
import StatusBadge from '@/components/StatusBadge'
import { inStoreOrderStatusMeta } from '@/lib/orderStatus'
import { formatTimeJST } from '@/lib/time'
import type { StatusOrder } from '@/types'

interface StatusProps {
  table_number: number | null
  orders: StatusOrder[]
}

// 注文状況（ADR-0012）: In-store の客が、この session で出した当日の注文の調理進捗を
// ライブで見る画面。session 紐付け・調理軸のみ・会計軸は描かない。更新は usePoll で
// orders prop だけを差分取得する（キッチン盤面と同じ 7 秒・背景タブで自動スロットリング）。
export default function Status({ table_number, orders }: StatusProps) {
  // 新ラウンドは poll ではなく全画面遷移（checkout→完了→遷移で remount）でしか増えないため、
  // この画面の poll は既存注文の調理進捗を映すだけ。全注文が終端表示（提供済み or 提供前クローズ）に
  // 達したら、以降 poll が取れる差分は無い — 止めて無駄な DB/電池消費を避ける。
  const allTerminal =
    orders.length > 0 && orders.every((order) => order.unavailable || order.status === 'served')
  const { stop } = usePoll(7000, { only: ['orders'] }, { autoStart: !allTerminal })
  useEffect(() => {
    if (allTerminal) stop()
  }, [allTerminal, stop])

  return (
    <CustomerOrderListShell
      title="注文状況"
      headerRight={
        table_number != null && (
          <span className="text-xs font-semibold text-[#6D5D4B]">テーブル {table_number}</span>
        )
      }
      empty={orders.length === 0}
      emptyIcon={CookingPot}
      emptyMessage="進行中のご注文はありません"
      emptyLinkHref="/order"
      emptyLinkLabel="メニューを見る"
    >
      {orders.map((order) => {
        // 調理軸ラベルのみ（ADR-0012）。提供前クローズは中立文言に畳まれる（unavailable）。
        // 会計軸（キャンセル / 打ち切り）は決して描かない — walkout は調理軸 served のまま。
        const status = inStoreOrderStatusMeta(order)
        return (
          <div
            key={order.id}
            className={`flex flex-col gap-2.5 rounded-2xl border p-4 shadow-[0_2px_8px_rgba(26,18,16,0.03)] ${
              order.unavailable
                ? 'bg-[#FAF6F1] border-[#E8DCCC]'
                : 'bg-white border-[#F0E0D0]'
            }`}
          >
            {/* Row: number + status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold text-[#E53935] tracking-[-0.5px]">
                  #{order.order_number}
                </span>
                <span className="text-xs text-[#9E8E7E]">{formatTimeJST(order.placed_at)}</span>
              </div>
              <StatusBadge {...status} />
            </div>

            {/* Items */}
            <div className="flex flex-col gap-1.5">
              {order.items.map((item) => (
                <div key={item.id} className="flex flex-col">
                  <span className="text-[13px] font-semibold text-[#1A1210]">
                    {item.quantity}x {item.name}
                  </span>
                  {item.customization && (
                    <span className="text-[11px] text-[#9E8E7E]">{item.customization}</span>
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end pt-2 border-t border-[#F0E0D0]">
              <span className="text-xs text-[#9E8E7E]">{order.item_count} 点</span>
            </div>
          </div>
        )
      })}

      {orders.length > 0 && (
        <p className="px-1 pt-1 text-[11px] text-[#9E8E7E] leading-[1.5] text-center">
          お会計はお食事のあとで、レジにて注文番号をお伝えください。
        </p>
      )}
    </CustomerOrderListShell>
  )
}
