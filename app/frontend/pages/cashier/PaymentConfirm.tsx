import { Head, Link } from '@inertiajs/react'
import { useState } from 'react'
import { ChefHat, ArrowLeft, CheckCircle, Banknote, CreditCard, X } from 'lucide-react'

// --- 型定義 ---

interface OrderItem {
  id: number
  name: string
  description: string
  quantity: number
  price: number
}

type PaymentMethod = 'cash' | 'credit_card'

// --- モックデータ ---

const mockOrder = {
  orderNumber: '#0012',
  tableNumber: 7,
  items: [
    { id: 1, name: 'Teriyaki Chicken Bowl', description: 'Rice included, No onions', quantity: 2, price: 25.86 },
    { id: 2, name: 'Salmon Sashimi (Rice)', description: 'Plain noodle', quantity: 1, price: 18.50 },
    { id: 3, name: 'Miso Soup', description: 'Regular', quantity: 1, price: 10.50 },
    { id: 4, name: 'Matcha Latte', description: 'Iced, oat milk', quantity: 1, price: 8.50 },
    { id: 5, name: 'Edamame', description: 'With sea salt', quantity: 2, price: 9.00 },
  ] as OrderItem[],
}

// --- サブコンポーネント ---

function OrderedItemRow({ item }: { item: OrderItem }) {
  return (
    <div
      className="flex items-center justify-between py-3"
      style={{ borderBottom: '1px solid #f5f5f5' }}
    >
      <div className="flex items-start gap-3">
        <span
          className="flex items-center justify-center shrink-0 w-6 h-6 rounded"
          style={{ fontSize: 14, fontWeight: 700, color: '#0a0a0a' }}
        >
          {item.quantity}
        </span>
        <div className="flex flex-col">
          <span style={{ fontSize: 14, fontWeight: 600, color: '#0a0a0a' }}>
            {item.name}
          </span>
          <span style={{ fontSize: 12, fontWeight: 400, color: '#a3a3a3' }}>
            {item.description}
          </span>
        </div>
      </div>
      <span style={{ fontSize: 14, fontWeight: 600, color: '#0a0a0a' }}>
        ${item.price.toFixed(2)}
      </span>
    </div>
  )
}

function PaymentMethodButton({
  method,
  label,
  icon: Icon,
  selected,
  onSelect,
}: {
  method: PaymentMethod
  label: string
  icon: typeof Banknote
  selected: boolean
  onSelect: (method: PaymentMethod) => void
}) {
  return (
    <button
      onClick={() => onSelect(method)}
      className="flex flex-col items-center justify-center gap-1.5 rounded-lg flex-1"
      style={{
        height: 72,
        backgroundColor: selected ? '#171717' : '#ffffff',
        color: selected ? '#fafafa' : '#525252',
        border: selected ? 'none' : '1px solid #e5e5e5',
        fontSize: 12,
        fontWeight: 600,
        fontFamily: 'Inter, sans-serif',
      }}
    >
      <Icon size={20} />
      {label}
    </button>
  )
}

// --- メインコンポーネント ---

export default function PaymentConfirm() {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash')
  const [showConfirmModal, setShowConfirmModal] = useState(false)

  const order = mockOrder
  const subtotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const taxRate = 0.1
  const tax = Math.round(subtotal * taxRate * 100) / 100
  const total = Math.round((subtotal + tax) * 100) / 100

  const now = new Date()
  const timeLabel = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`

  return (
    <>
      <Head title="Payment Confirmation" />
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
              <span style={{ fontSize: 12, fontWeight: 600, color: '#22c55e' }}>Online</span>
            </div>
            <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: 16, fontWeight: 700, color: '#fafafa' }}>
              {timeLabel}
            </span>
          </div>
        </header>

        {/* ナビゲーションバー */}
        <div
          className="flex items-center justify-between h-14 px-5 shrink-0"
          style={{ borderBottom: '1px solid #e5e5e5' }}
        >
          <Link
            href="/cashier"
            className="flex items-center gap-2"
            style={{ fontSize: 14, fontWeight: 600, color: '#0a0a0a' }}
          >
            <ArrowLeft size={18} />
            Order List
          </Link>
          <div className="flex items-center gap-3">
            <span
              className="rounded-md px-3 py-1"
              style={{ fontSize: 13, fontWeight: 700, color: '#fafafa', backgroundColor: '#171717' }}
            >
              Order {order.orderNumber}
            </span>
            <span style={{ fontSize: 13, fontWeight: 500, color: '#737373' }}>
              Table {order.tableNumber}
            </span>
          </div>
        </div>

        {/* メインコンテンツ */}
        <div className="flex flex-1 min-h-0">
          {/* 左パネル — 注文アイテム一覧 */}
          <div
            className="flex flex-col flex-1 min-w-0"
            style={{ borderRight: '1px solid #e5e5e5' }}
          >
            {/* セクションヘッダー */}
            <div className="flex items-center justify-between px-6 py-4">
              <span style={{ fontSize: 16, fontWeight: 700, color: '#0a0a0a', fontFamily: 'Outfit, sans-serif' }}>
                Ordered Items
              </span>
              <span style={{ fontSize: 13, fontWeight: 500, color: '#a3a3a3' }}>
                {order.items.length} items
              </span>
            </div>

            {/* アイテムリスト */}
            <div className="flex-1 overflow-y-auto px-6">
              {order.items.map((item) => (
                <OrderedItemRow key={item.id} item={item} />
              ))}
            </div>
          </div>

          {/* 右パネル — 注文サマリー & 決済 */}
          <aside
            className="flex flex-col w-[380px] shrink-0"
            style={{ backgroundColor: '#fafafa' }}
          >
            <div className="flex flex-col flex-1 px-6 py-5 gap-6">
              {/* 注文サマリー */}
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0a0a0a', fontFamily: 'Outfit, sans-serif', marginBottom: 16 }}>
                  Order Summary
                </h3>
                <div
                  className="rounded-lg p-4 flex flex-col gap-3"
                  style={{ backgroundColor: '#ffffff', border: '1px solid #e5e5e5' }}
                >
                  <div className="flex items-center justify-between">
                    <span style={{ fontSize: 13, fontWeight: 500, color: '#737373' }}>Subtotal</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#0a0a0a' }}>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span style={{ fontSize: 13, fontWeight: 500, color: '#737373' }}>Tax (10%)</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#0a0a0a' }}>${tax.toFixed(2)}</span>
                  </div>
                  <div
                    className="flex items-center justify-between pt-3"
                    style={{ borderTop: '1px solid #e5e5e5' }}
                  >
                    <span style={{ fontSize: 15, fontWeight: 700, color: '#0a0a0a' }}>Total</span>
                    <span style={{ fontSize: 22, fontWeight: 800, color: '#0a0a0a', fontFamily: 'Outfit, sans-serif' }}>
                      ${total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* 支払い方法 */}
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0a0a0a', fontFamily: 'Outfit, sans-serif', marginBottom: 12 }}>
                  Payment Method
                </h3>
                <div className="flex gap-3">
                  <PaymentMethodButton
                    method="cash"
                    label="Cash"
                    icon={Banknote}
                    selected={paymentMethod === 'cash'}
                    onSelect={setPaymentMethod}
                  />
                  <PaymentMethodButton
                    method="credit_card"
                    label="Credit Card"
                    icon={CreditCard}
                    selected={paymentMethod === 'credit_card'}
                    onSelect={setPaymentMethod}
                  />
                </div>
              </div>
            </div>

            {/* フッター — ステータス & 確定ボタン */}
            <div className="px-6 pb-6 flex flex-col gap-4 mt-auto">
              <div className="flex items-center justify-center gap-2">
                <span className="inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
                <span style={{ fontSize: 13, fontWeight: 500, color: '#16a34a' }}>
                  Ready for Payment
                </span>
              </div>
              <button
                className="flex items-center justify-center gap-2 w-full rounded-lg"
                style={{
                  height: 52,
                  backgroundColor: '#171717',
                  color: '#fafafa',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: 15,
                  fontWeight: 700,
                }}
                onClick={() => setShowConfirmModal(true)}
              >
                <CheckCircle size={18} />
                Confirm Payment · ${total.toFixed(2)}
              </button>
            </div>
          </aside>
        </div>
      </div>

      {/* 確認モーダル */}
      {showConfirmModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          onClick={() => setShowConfirmModal(false)}
        >
          <div
            className="relative rounded-xl p-6 w-[400px] flex flex-col gap-5"
            style={{ backgroundColor: '#ffffff' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-4 right-4 flex items-center justify-center"
              style={{ color: '#a3a3a3' }}
              onClick={() => setShowConfirmModal(false)}
            >
              <X size={20} />
            </button>

            <div className="flex flex-col items-center gap-3 pt-2">
              <div
                className="flex items-center justify-center w-12 h-12 rounded-full"
                style={{ backgroundColor: '#f0fdf4' }}
              >
                <CheckCircle size={24} color="#16a34a" />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0a0a0a', fontFamily: 'Outfit, sans-serif' }}>
                Confirm Payment
              </h3>
              <p style={{ fontSize: 14, fontWeight: 400, color: '#737373', textAlign: 'center' }}>
                Are you sure you want to process this payment?
              </p>
            </div>

            <div
              className="rounded-lg p-4 flex flex-col gap-2"
              style={{ backgroundColor: '#fafafa', border: '1px solid #e5e5e5' }}
            >
              <div className="flex items-center justify-between">
                <span style={{ fontSize: 13, fontWeight: 500, color: '#737373' }}>Order</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#0a0a0a' }}>{order.orderNumber}</span>
              </div>
              <div className="flex items-center justify-between">
                <span style={{ fontSize: 13, fontWeight: 500, color: '#737373' }}>Method</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#0a0a0a' }}>
                  {paymentMethod === 'cash' ? 'Cash' : 'Credit Card'}
                </span>
              </div>
              <div
                className="flex items-center justify-between pt-2"
                style={{ borderTop: '1px solid #e5e5e5' }}
              >
                <span style={{ fontSize: 15, fontWeight: 700, color: '#0a0a0a' }}>Total</span>
                <span style={{ fontSize: 20, fontWeight: 800, color: '#0a0a0a', fontFamily: 'Outfit, sans-serif' }}>
                  ${total.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                className="flex-1 rounded-lg"
                style={{
                  height: 46,
                  backgroundColor: '#ffffff',
                  color: '#525252',
                  fontSize: 14,
                  fontWeight: 600,
                  border: '1px solid #e5e5e5',
                }}
                onClick={() => setShowConfirmModal(false)}
              >
                Cancel
              </button>
              <Link
                href="/cashier/payment/complete"
                className="flex-1 flex items-center justify-center gap-2 rounded-lg"
                style={{
                  height: 46,
                  backgroundColor: '#171717',
                  color: '#fafafa',
                  fontSize: 14,
                  fontWeight: 700,
                }}
              >
                <CheckCircle size={16} />
                Confirm
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
