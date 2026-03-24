import { Head, Link } from '@inertiajs/react'
import { Check, Home, Clock, CreditCard } from 'lucide-react'

interface OrderItem {
  id: number
  name: string
  detail: string
  price: number
  quantity: number
}

interface OrderCompleteProps {
  order_number: string
}

const mockItems: OrderItem[] = [
  { id: 1, name: 'Classic Burger', detail: 'Large · Extra Cheese', price: 580, quantity: 2 },
  { id: 2, name: 'Crispy Fries', detail: 'Regular · Sea Salt', price: 380, quantity: 1 },
  { id: 3, name: 'Iced Lemon Tea', detail: 'Medium · Less Ice', price: 590, quantity: 1 },
]

const TAX_RATE = 0.1

export default function OrderComplete({order_number}: OrderCompleteProps) {
  const subtotal = mockItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const tax = Math.floor(subtotal * TAX_RATE)
  const total = subtotal + tax
  const totalItems = mockItems.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <>
      <Head title="Order Confirmed" />
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
            Order Confirmed!
          </h1>
          <p className="text-[13px] text-[#6D5D4B] text-center">
            Your order has been placed successfully
          </p>

          {/* Order Number Card */}
          <div className="flex flex-col items-center gap-0.5 w-full rounded-2xl bg-[#FFEBEE] border-[1.5px] border-[#E53935] px-4 py-2.5">
            <span className="text-xs font-medium text-[#6D5D4B]">Order Number</span>
            <span className="text-[28px] font-extrabold text-[#E53935] tracking-[-1px]">
              {order_number}
            </span>
          </div>

          {/* Prep Time Card */}
          <div className="flex items-center gap-3 w-full rounded-2xl bg-[#FFF8E1] border-[1.5px] border-[#FFB300] px-3.5 py-2">
            <Clock className="w-6 h-6 text-[#FB8C00] shrink-0" />
            <div className="flex flex-col gap-px">
              <span className="text-[11px] font-medium text-[#6D5D4B]">
                Estimated Preparation Time
              </span>
              <span className="text-base font-bold text-[#1A1210]">10 - 15 minutes</span>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-1.5 bg-[#FFF3E0]" />

        {/* Order Summary Section */}
        <div className="flex flex-col">
          {/* Summary Header */}
          <div className="flex items-center justify-between px-5 py-2.5">
            <span className="text-base font-semibold text-[#1A1210]">Order Summary</span>
            <span className="text-[13px] text-[#9E8E7E]">{totalItems} items</span>
          </div>

          {/* Items List */}
          <div className="flex flex-col px-5">
            {mockItems.map((item, index) => (
              <div
                key={item.id}
                className={`flex items-center justify-between py-2 ${
                  index < mockItems.length - 1 ? 'border-b border-[#F0E0D0]' : ''
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
                    <span className="text-xs text-[#9E8E7E]">{item.detail}</span>
                  </div>
                </div>
                {/* Price */}
                <span className="text-sm font-semibold text-[#1A1210]">
                  ¥{(item.price * item.quantity).toLocaleString()}
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
            <span className="text-sm text-[#6D5D4B]">Subtotal</span>
            <span className="text-sm font-medium text-[#1A1210]">
              ¥{subtotal.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#6D5D4B]">Tax (10%)</span>
            <span className="text-sm font-medium text-[#1A1210]">¥{tax.toLocaleString()}</span>
          </div>
          <div className="h-px bg-[#F0E0D0]" />
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-[#1A1210]">Total</span>
            <span className="text-[22px] font-bold text-[#E53935] tracking-[-0.5px]">
              ¥{total.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Divider */}
        <div className="h-1.5 bg-[#FFF3E0]" />

        {/* Instruction Section */}
        <div className="flex flex-col items-center gap-1.5 px-5 py-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#FFF3E0]">
            <CreditCard className="w-[22px] h-[22px] text-[#FB8C00]" />
          </div>
          <span className="text-[15px] font-bold text-[#1A1210] text-center">
            Please proceed to the cashier
          </span>
          <p className="text-xs text-[#6D5D4B] text-center leading-[1.4]">
            Show your order number to the cashier to complete payment. Your order will be prepared
            once payment is confirmed.
          </p>
        </div>

        {/* Footer */}
        <div className="flex flex-col items-center gap-2 px-5 pb-5">
          <Link
            href="/order"
            className="flex items-center justify-center gap-2.5 w-full h-12 rounded-2xl bg-[#FFF3E0] border-[1.5px] border-[#F0E0D0]"
          >
            <Home className="w-5 h-5 text-[#1A1210]" />
            <span className="text-base font-semibold text-[#1A1210]">Return to Menu</span>
          </Link>
          <span className="text-xs text-[#9E8E7E]">Thank you for your order!</span>
        </div>
      </div>
    </>
  )
}
