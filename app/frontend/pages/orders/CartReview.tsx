import { Head, Link, router } from '@inertiajs/react'
import { useState } from 'react'
import { ArrowLeft, Trash2, Minus, Plus, ShoppingBag, Check } from 'lucide-react'
import type { CartLine, CartTotals, OrderType } from '@/types'

interface CartReviewProps {
  table_number: number | null
  order_type: OrderType
  cart_items: CartLine[]
  totals: CartTotals
}

export default function CartReview({ table_number, order_type, cart_items, totals }: CartReviewProps) {
  const [specialInstructions, setSpecialInstructions] = useState('')
  const [showConfirmModal, setShowConfirmModal] = useState(false)

  const updateQuantity = (line: CartLine, delta: number) => {
    const next = line.quantity + delta
    if (next < 1) return
    if (next > line.max_quantity) return
    router.patch(
      `/order/cart/${line.line_id}`,
      { quantity: next },
      { preserveScroll: true },
    )
  }

  const removeItem = (line: CartLine) => {
    router.delete(`/order/cart/${line.line_id}`, { preserveScroll: true })
  }

  const placeOrder = () => {
    router.post('/order/checkout')
  }

  return (
    <>
      <Head title="カート" />
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
            <span className="text-lg font-bold text-[#1A1210] tracking-[-0.3px]">カート</span>
          </div>
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#FFF8E1] border-[1.5px] border-[#FFB300]">
            <span className="text-xs font-semibold text-[#1A1210]">
              {order_type === 'takeout' ? 'テイクアウト' : `テーブル ${table_number}`}
            </span>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto pb-[180px]">
          {/* Items Header */}
          <div className="flex items-center justify-between px-5 pt-4 pb-2">
            <span className="text-base font-semibold text-[#1A1210]">{totals.item_count} 点</span>
          </div>

          {/* Cart Items */}
          <div className="flex flex-col px-5">
            {cart_items.map((item, index) => (
              <div
                key={item.line_id}
                className={`flex items-center gap-3 py-4 ${
                  index < cart_items.length - 1 ? 'border-b border-[#F0E0D0]' : ''
                }`}
              >
                {/* Thumbnail */}
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-[72px] h-[72px] rounded-xl object-cover shrink-0"
                />

                {/* Item Info */}
                <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                  {/* Name Row */}
                  <div className="flex items-center justify-between">
                    <span className="text-[15px] font-semibold text-[#1A1210] truncate">
                      {item.name}
                    </span>
                    <button
                      onClick={() => removeItem(item)}
                      className="flex items-center justify-center w-7 h-7 rounded-full bg-[#FFEBEE] shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-[#E53935]" />
                    </button>
                  </div>

                  {/* Customization */}
                  <span className="text-xs text-[#9E8E7E]">{item.customization}</span>

                  {/* Price & Qty */}
                  <div className="flex items-center justify-between">
                    <span className="text-base font-bold text-[#E53935] tracking-[-0.5px]">
                      ¥{item.unit_price.toLocaleString()}
                    </span>

                    {/* Qty Stepper */}
                    <div className="flex items-center rounded-[10px] border-[1.5px] border-[#F0E0D0] bg-white overflow-hidden">
                      <button
                        onClick={() => updateQuantity(item, -1)}
                        className="flex items-center justify-center w-8 h-8"
                      >
                        <Minus className="w-3.5 h-3.5 text-[#6D5D4B]" />
                      </button>
                      <div className="flex items-center justify-center w-8 h-8 border-x border-[#F0E0D0]">
                        <span className="text-sm font-bold text-[#1A1210]">{item.quantity}</span>
                      </div>
                      <button
                        onClick={() => updateQuantity(item, 1)}
                        disabled={item.quantity >= item.max_quantity}
                        className="flex items-center justify-center w-8 h-8 disabled:opacity-40"
                      >
                        <Plus className="w-3.5 h-3.5 text-[#E53935]" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {cart_items.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <ShoppingBag className="w-12 h-12 text-[#C8B8A8]" />
                <span className="text-sm text-[#9E8E7E]">カートは空です</span>
                <Link
                  href="/order"
                  className="text-sm font-semibold text-[#E53935]"
                >
                  メニューを見る
                </Link>
              </div>
            )}
          </div>

          {/* Special Instructions */}
          <div className="flex flex-col gap-2 px-5 py-4">
            <span className="text-sm font-semibold text-[#1A1210]">特別なご要望</span>
            <textarea
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              placeholder="特別なご要望があればご記入ください…"
              className="w-full h-14 px-4 py-3 rounded-xl bg-[#FFF3E0] border border-[#F0E0D0] text-[13px] text-[#6D5D4B] placeholder-[#C8B8A8] resize-none outline-none focus:border-[#E53935] transition-colors"
              style={{ fontFamily: 'Outfit, sans-serif' }}
            />
          </div>

          {/* Divider */}
          <div className="h-2 bg-[#FFF3E0]" />

          {/* Order Summary */}
          <div className="flex flex-col gap-3 px-5 py-4">
            <span className="text-base font-semibold text-[#1A1210]">ご注文内容</span>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#6D5D4B]">小計</span>
              <span className="text-sm font-medium text-[#1A1210]">
                ¥{totals.subtotal.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#6D5D4B]">消費税 (10%)</span>
              <span className="text-sm font-medium text-[#1A1210]">
                ¥{totals.tax.toLocaleString()}
              </span>
            </div>
            <div className="h-px bg-[#F0E0D0]" />
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-[#1A1210]">合計</span>
              <span className="text-[22px] font-bold text-[#E53935] tracking-[-0.5px]">
                ¥{totals.total.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Fixed Footer */}
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[390px] bg-white border-t border-[#F0E0D0] shadow-[0_-4px_16px_rgba(26,18,16,0.06)] px-5 pt-3 pb-7 flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-medium text-[#9E8E7E]">お支払い金額</span>
              <span className="text-xl font-bold text-[#1A1210] tracking-[-0.5px]">
                ¥{totals.total.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#FFF3E0] border border-[#F0E0D0]">
              <ShoppingBag className="w-3.5 h-3.5 text-[#6D5D4B]" />
              <span className="text-xs font-semibold text-[#6D5D4B]">{totals.item_count} 点</span>
            </div>
          </div>
          <button
            disabled={cart_items.length === 0}
            onClick={() => setShowConfirmModal(true)}
            className="flex items-center justify-center gap-2.5 h-[52px] rounded-2xl bg-[#E53935] shadow-[0_4px_16px_rgba(229,57,53,0.38),0_2px_4px_rgba(229,57,53,0.19)] hover:bg-[#C62828] disabled:opacity-50 disabled:hover:bg-[#E53935] transition-colors"
          >
            <Check className="w-5 h-5 text-white" />
            <span className="text-base font-bold text-white">注文を確定</span>
          </button>
          <p className="text-[11px] text-[#9E8E7E] text-center">
            ご注文確定後、レジでお支払いください
          </p>
        </div>
      </div>

        {/* 確認モーダル */}
        {showConfirmModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            onClick={() => setShowConfirmModal(false)}
          >
            <div
              className="flex flex-col gap-4 w-[320px] rounded-2xl bg-white p-6 shadow-xl"
              style={{ fontFamily: 'Outfit, sans-serif' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[#FFF3E0]">
                  <ShoppingBag className="w-6 h-6 text-[#FB8C00]" />
                </div>
                <h2 className="text-lg font-bold text-[#1A1210]">ご注文を確定しますか?</h2>
                <p className="text-sm text-[#6D5D4B]">
                  {totals.item_count} 点 · ¥{totals.total.toLocaleString()}
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 h-11 rounded-xl bg-[#FFF3E0] border border-[#F0E0D0] text-sm font-semibold text-[#1A1210]"
                >
                  キャンセル
                </button>
                <button
                  onClick={placeOrder}
                  className="flex-1 h-11 rounded-xl bg-[#E53935] text-sm font-bold text-white shadow-[0_4px_12px_rgba(229,57,53,0.3)] hover:bg-[#C62828] transition-colors"
                >
                  注文する
                </button>
              </div>
            </div>
          </div>
        )}
    </>
  )
}
