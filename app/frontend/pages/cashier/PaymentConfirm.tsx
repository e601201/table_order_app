import { Head, Link, router } from '@inertiajs/react'
import { useState } from 'react'
import { ChefHat, ArrowLeft, CheckCircle, Banknote, CreditCard, Wallet, X } from 'lucide-react'
import { formatTimeJST } from '@/lib/time'
import type { CashierOrder, CashierOrderItem } from '@/types'

// --- サブコンポーネント ---

function OrderedItemRow({ item }: { item: CashierOrderItem }) {
  const description = [item.size_label, ...item.addons.map((a) => a.label)]
    .filter(Boolean)
    .join(', ')

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
          {description && (
            <span style={{ fontSize: 12, fontWeight: 400, color: '#a3a3a3' }}>
              {description}
            </span>
          )}
        </div>
      </div>
      <span style={{ fontSize: 14, fontWeight: 600, color: '#0a0a0a' }}>
        ¥{item.line_total.toLocaleString()}
      </span>
    </div>
  )
}

// 決済方法は名前だけのラベル（ADR-0014）。アイコンは見た目の便宜で名前から引き、
// 未知の名前（Admin が追加した方法）は汎用の Wallet に落とす。
function methodIcon(name: string): typeof Banknote {
  if (name === '現金') return Banknote
  if (name === 'クレジットカード') return CreditCard
  return Wallet
}

function PaymentMethodButton({
  method,
  selected,
  onSelect,
}: {
  method: string
  selected: boolean
  onSelect: (method: string) => void
}) {
  const Icon = methodIcon(method)
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
      {method}
    </button>
  )
}

// --- メインコンポーネント ---

export default function PaymentConfirm({
  order,
  payment_methods,
}: {
  order: CashierOrder
  // 有効な決済方法の名前一覧（ADR-0014）。マスタから動的に描画し、デフォルトは先頭。
  payment_methods: string[]
}) {
  const [paymentMethod, setPaymentMethod] = useState<string>(payment_methods[0] ?? '')
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const timeLabel = formatTimeJST(new Date())

  const handleConfirm = () => {
    if (submitting) return
    setSubmitting(true)
    router.post(
      `/cashier/payment/${order.id}`,
      { payment_method: paymentMethod },
      {
        onFinish: () => setSubmitting(false),
      },
    )
  }

  return (
    <>
      <Head title="お支払い確認" />
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
            注文一覧
          </Link>
          <div className="flex items-center gap-3">
            <span
              className="rounded-md px-3 py-1"
              style={{ fontSize: 13, fontWeight: 700, color: '#fafafa', backgroundColor: '#171717' }}
            >
              注文 {order.order_number}
            </span>
            <span style={{ fontSize: 13, fontWeight: 500, color: '#737373' }}>
              {order.order_type === 'takeout' ? 'テイクアウト' : `テーブル ${order.table_number}`}
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
                注文アイテム
              </span>
              <span style={{ fontSize: 13, fontWeight: 500, color: '#a3a3a3' }}>
                {order.items.length} 点
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
                  ご注文内容
                </h3>
                <div
                  className="rounded-lg p-4 flex flex-col gap-3"
                  style={{ backgroundColor: '#ffffff', border: '1px solid #e5e5e5' }}
                >
                  <div className="flex items-center justify-between">
                    <span style={{ fontSize: 13, fontWeight: 500, color: '#737373' }}>小計</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#0a0a0a' }}>¥{order.subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span style={{ fontSize: 13, fontWeight: 500, color: '#737373' }}>消費税</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#0a0a0a' }}>¥{order.tax.toLocaleString()}</span>
                  </div>
                  <div
                    className="flex items-center justify-between pt-3"
                    style={{ borderTop: '1px solid #e5e5e5' }}
                  >
                    <span style={{ fontSize: 15, fontWeight: 700, color: '#0a0a0a' }}>合計</span>
                    <span style={{ fontSize: 22, fontWeight: 800, color: '#0a0a0a', fontFamily: 'Outfit, sans-serif' }}>
                      ¥{order.total.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* 支払い方法 */}
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0a0a0a', fontFamily: 'Outfit, sans-serif', marginBottom: 12 }}>
                  お支払い方法
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {payment_methods.map((method) => (
                    <PaymentMethodButton
                      key={method}
                      method={method}
                      selected={paymentMethod === method}
                      onSelect={setPaymentMethod}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* フッター — ステータス & 確定ボタン */}
            <div className="px-6 pb-6 flex flex-col gap-4 mt-auto">
              <div className="flex items-center justify-center gap-2">
                <span className="inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
                <span style={{ fontSize: 13, fontWeight: 500, color: '#16a34a' }}>
                  お支払い準備完了
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
                支払いを確定 · ¥{order.total.toLocaleString()}
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
                支払いの確定
              </h3>
              <p style={{ fontSize: 14, fontWeight: 400, color: '#737373', textAlign: 'center' }}>
                この支払いを処理してよろしいですか?
              </p>
            </div>

            <div
              className="rounded-lg p-4 flex flex-col gap-2"
              style={{ backgroundColor: '#fafafa', border: '1px solid #e5e5e5' }}
            >
              <div className="flex items-center justify-between">
                <span style={{ fontSize: 13, fontWeight: 500, color: '#737373' }}>注文番号</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#0a0a0a' }}>{order.order_number}</span>
              </div>
              <div className="flex items-center justify-between">
                <span style={{ fontSize: 13, fontWeight: 500, color: '#737373' }}>お支払い方法</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#0a0a0a' }}>
                  {paymentMethod}
                </span>
              </div>
              <div
                className="flex items-center justify-between pt-2"
                style={{ borderTop: '1px solid #e5e5e5' }}
              >
                <span style={{ fontSize: 15, fontWeight: 700, color: '#0a0a0a' }}>合計</span>
                <span style={{ fontSize: 20, fontWeight: 800, color: '#0a0a0a', fontFamily: 'Outfit, sans-serif' }}>
                  ¥{order.total.toLocaleString()}
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
                disabled={submitting}
              >
                キャンセル
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg"
                style={{
                  height: 46,
                  backgroundColor: '#171717',
                  color: '#fafafa',
                  fontSize: 14,
                  fontWeight: 700,
                  opacity: submitting ? 0.6 : 1,
                }}
                disabled={submitting}
              >
                <CheckCircle size={16} />
                {submitting ? '処理中…' : '確定'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
