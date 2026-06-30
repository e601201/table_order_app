import { Head, Link } from '@inertiajs/react'
import { Check, Home, CreditCard, History, CookingPot } from 'lucide-react'
import type { PlacedOrder } from '@/types'

interface OrderCompleteProps {
  order: PlacedOrder
}

export default function OrderComplete({ order }: OrderCompleteProps) {
  const { order_number, items, totals, table_number, order_type } = order
  const locationLabel = order_type === 'takeout' ? 'テイクアウト' : `テーブル ${table_number}`

  return (
    <>
      <Head title="注文完了" />
      <div
        className="relative mx-auto max-w-[390px] min-h-screen bg-[#FFF8F0] flex flex-col"
        style={{ fontFamily: 'Outfit, sans-serif' }}
      >
        {/* Confirmation Section */}
        <div className="flex flex-col items-center gap-2 px-5 pt-6 pb-2">
          {/* Check Circle */}
          <div className="flex items-center justify-center w-[72px] h-[72px] rounded-full bg-[#43A047]">
            <Check className="w-9 h-9 text-white" strokeWidth={3} />
          </div>

          <h1 className="text-2xl font-bold text-[#1A1210] tracking-[-0.5px] text-center">
            ご注文を承りました!
          </h1>
          <p className="text-[13px] text-[#6D5D4B] text-center">
            ご注文が正常に確定しました
          </p>

          {/* Order Number Card */}
          <div className="flex flex-col items-center gap-0.5 w-full rounded-2xl bg-[#FFEBEE] border-[1.5px] border-[#E53935] px-4 py-2.5">
            <span className="text-xs font-medium text-[#6D5D4B]">注文番号</span>
            <span className="text-[28px] font-extrabold text-[#E53935] tracking-[-1px]">
              {order_number}
            </span>
            <span className="text-xs font-semibold text-[#6D5D4B]">{locationLabel}</span>
          </div>
        </div>

        {/* Divider */}
        <div className="h-1.5 bg-[#FFF3E0]" />

        {/* Order Summary Section */}
        <div className="flex flex-col">
          {/* Summary Header */}
          <div className="flex items-center justify-between px-5 py-2.5">
            <span className="text-base font-semibold text-[#1A1210]">ご注文内容</span>
            <span className="text-[13px] text-[#9E8E7E]">{totals.item_count} 点</span>
          </div>

          {/* Items List */}
          <div className="flex flex-col px-5">
            {items.map((item, index) => (
              <div
                key={item.id}
                className={`flex items-center justify-between py-2 ${
                  index < items.length - 1 ? 'border-b border-[#F0E0D0]' : ''
                }`}
              >
                {/* Item Left */}
                <div className="flex items-center gap-2.5">
                  {/* Qty Badge */}
                  <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#FFF3E0]">
                    <span className="text-xs font-semibold text-[#1A1210]">{item.quantity}x</span>
                  </div>
                  {/* Item Info */}
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-semibold text-[#1A1210]">{item.name}</span>
                    <span className="text-xs text-[#9E8E7E]">{item.customization}</span>
                  </div>
                </div>
                {/* Price */}
                <span className="text-sm font-semibold text-[#1A1210]">
                  ¥{item.line_total.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="h-1.5 bg-[#FFF3E0]" />

        {/* Total Section */}
        <div className="flex flex-col gap-2 px-5 py-2.5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#6D5D4B]">小計</span>
            <span className="text-sm font-medium text-[#1A1210]">
              ¥{totals.subtotal.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#6D5D4B]">消費税 (10%)</span>
            <span className="text-sm font-medium text-[#1A1210]">¥{totals.tax.toLocaleString()}</span>
          </div>
          <div className="h-px bg-[#F0E0D0]" />
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-[#1A1210]">合計</span>
            <span className="text-[22px] font-bold text-[#E53935] tracking-[-0.5px]">
              ¥{totals.total.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Divider */}
        <div className="h-1.5 bg-[#FFF3E0]" />

        {/* Instruction Section（後会計は In-store / Takeout 共通。ADR-0001 / ADR-0008） */}
        <div className="flex flex-col items-center gap-1.5 px-5 py-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#FFF3E0]">
            <CreditCard className="w-[22px] h-[22px] text-[#FB8C00]" />
          </div>
          {order_type === 'takeout' ? (
            <>
              <span className="text-[15px] font-bold text-[#1A1210] text-center">
                できあがりは LINE でお知らせします
              </span>
              <p className="text-xs text-[#6D5D4B] text-center leading-[1.4]">
                「お作りできました」の通知が届きましたら、カウンターでお受け取りください。お支払いはお受け取りの際にレジで、注文番号をお伝えください。
              </p>
            </>
          ) : (
            <>
              <span className="text-[15px] font-bold text-[#1A1210] text-center">
                お会計はお食事のあとで
              </span>
              <p className="text-xs text-[#6D5D4B] text-center leading-[1.4]">
                お料理ができ次第、お席までお持ちします。お会計はお食事後にレジで、注文番号をお伝えください。
              </p>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-col items-center gap-2 px-5 pb-5">
          {order_type === 'takeout' && (
            <Link
              href="/order/history"
              className="flex items-center justify-center gap-2.5 w-full h-12 rounded-2xl bg-[#FFF3E0] border-[1.5px] border-[#F0E0D0]"
            >
              <History className="w-5 h-5 text-[#1A1210]" />
              <span className="text-base font-semibold text-[#1A1210]">注文履歴を見る</span>
            </Link>
          )}
          {/* In-store は session 紐づきの注文状況（調理進捗）へ（ADR-0012） */}
          {order_type === 'in_store' && (
            <Link
              href="/order/status"
              className="flex items-center justify-center gap-2.5 w-full h-12 rounded-2xl bg-[#FFF3E0] border-[1.5px] border-[#F0E0D0]"
            >
              <CookingPot className="w-5 h-5 text-[#1A1210]" />
              <span className="text-base font-semibold text-[#1A1210]">注文状況を見る</span>
            </Link>
          )}
          <Link
            href="/order"
            className="flex items-center justify-center gap-2.5 w-full h-12 rounded-2xl bg-[#FFF3E0] border-[1.5px] border-[#F0E0D0]"
          >
            <Home className="w-5 h-5 text-[#1A1210]" />
            <span className="text-base font-semibold text-[#1A1210]">メニューに戻る</span>
          </Link>
          <span className="text-xs text-[#9E8E7E]">ご注文ありがとうございました!</span>
        </div>
      </div>
    </>
  )
}
