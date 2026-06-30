import { Head, Link, usePoll } from '@inertiajs/react'
import { useEffect } from 'react'
import { ArrowLeft, CookingPot } from 'lucide-react'
import { inStoreOrderStatusMeta } from '@/lib/orderStatus'
import type { StatusOrder } from '@/types'

interface StatusProps {
  table_number: number | null
  orders: StatusOrder[]
}

function formatPlacedAt(iso: string): string {
  return new Date(iso).toLocaleString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
  })
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
    <>
      <Head title="注文状況" />
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
            <span className="text-lg font-bold text-[#1A1210] tracking-[-0.3px]">注文状況</span>
          </div>
          {table_number != null && (
            <span className="text-xs font-semibold text-[#6D5D4B]">テーブル {table_number}</span>
          )}
        </div>

        {/* Orders */}
        <div className="flex-1 flex flex-col gap-3 px-5 py-4">
          {orders.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <CookingPot className="w-12 h-12 text-[#C8B8A8]" />
              <span className="text-sm text-[#9E8E7E]">進行中のご注文はありません</span>
              <Link href="/order" className="text-sm font-semibold text-[#E53935]">
                メニューを見る
              </Link>
            </div>
          )}

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
        </div>
      </div>
    </>
  )
}
