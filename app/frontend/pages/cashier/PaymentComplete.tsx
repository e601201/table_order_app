import { Head, Link } from '@inertiajs/react'
import { ChefHat, ArrowLeft, Check, ArrowRight, LayoutDashboard } from 'lucide-react'
import { formatDateTimeJST, formatTimeJST } from '@/lib/time'
import type { CashierOrder } from '@/types'

// --- サブコンポーネント ---

function DetailRow({
  label,
  value,
  hasBorder = true,
}: {
  label: string
  value: string
  hasBorder?: boolean
}) {
  return (
    <div
      className="flex items-center justify-between"
      style={{
        padding: '16px 20px',
        borderBottom: hasBorder ? '1px solid #e5e5e5' : 'none',
      }}
    >
      <span style={{ fontSize: 14, fontWeight: 400, color: '#737373' }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 600, color: '#0a0a0a' }}>{value}</span>
    </div>
  )
}

function formatPaidAt(iso: string | null): string {
  return iso ? formatDateTimeJST(iso) : '—'
}

function paymentMethodLabel(method: string | null): string {
  if (method === 'credit_card') return 'クレジットカード'
  if (method === 'cash') return '現金'
  return '—'
}

// --- メインコンポーネント ---

export default function PaymentComplete({ payment }: { payment: CashierOrder }) {
  const timeLabel = formatTimeJST(new Date())

  return (
    <>
      <Head title="お支払い完了" />
      <div
        className="flex flex-col h-screen"
        style={{ backgroundColor: '#fafafa', fontFamily: 'Inter, sans-serif' }}
      >
        {/* トップヘッダー */}
        <header
          className="flex items-center justify-between shrink-0"
          style={{
            height: 56,
            padding: '0 24px',
            backgroundColor: '#171717',
            borderBottom: '1px solid #e5e5e5',
          }}
        >
          <div className="flex items-center gap-3">
            <ChefHat size={22} color="#fafafa" />
            <span style={{ fontSize: 18, fontWeight: 700, color: '#fafafa' }}>
              Sakura Kitchen
            </span>
            <span style={{ fontSize: 18, fontWeight: 700, color: '#fafafa', opacity: 0.6 }}>
              ·
            </span>
            <span style={{ fontSize: 14, fontWeight: 500, color: '#fafafa', opacity: 0.8 }}>
              Cashier Terminal
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75 animate-ping" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
              </span>
              <span style={{ fontSize: 13, fontWeight: 500, color: '#fafafa', opacity: 0.8 }}>
                オンライン
              </span>
            </div>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 14, fontWeight: 600, color: '#fafafa' }}>
              {timeLabel}
            </span>
          </div>
        </header>

        {/* ナビゲーションバー */}
        <div
          className="flex items-center justify-between shrink-0"
          style={{
            height: 64,
            padding: '0 24px',
            backgroundColor: '#fafafa',
            borderBottom: '1px solid #e5e5e5',
          }}
        >
          <Link
            href="/cashier"
            className="flex items-center gap-3"
            style={{ fontSize: 18, fontWeight: 600, color: '#0a0a0a', textDecoration: 'none' }}
          >
            <ArrowLeft size={20} />
            ダッシュボードに戻る
          </Link>
          <div className="flex items-center gap-3">
            <span
              className="flex items-center justify-center"
              style={{
                padding: '2px 8px',
                borderRadius: 16,
                backgroundColor: '#171717',
                fontSize: 12,
                fontWeight: 600,
                lineHeight: 1.333,
                color: '#fafafa',
                textAlign: 'center',
              }}
            >
              注文 {payment.order_number}
            </span>
            <span
              className="flex items-center justify-center"
              style={{
                padding: '2px 8px',
                borderRadius: 16,
                backgroundColor: '#f5f5f5',
                fontSize: 12,
                fontWeight: 600,
                lineHeight: 1.333,
                color: '#171717',
                textAlign: 'center',
              }}
            >
              {payment.order_type === 'takeout' ? 'テイクアウト' : `テーブル ${payment.table_number}`}
            </span>
          </div>
        </div>

        {/* メインコンテンツ — 中央寄せ */}
        <div className="flex flex-1 items-center justify-center flex-col">
          <div className="flex flex-col items-center" style={{ width: 420, gap: 32 }}>
            {/* 成功アイコン */}
            <div
              className="flex items-center justify-center"
              style={{
                width: 96,
                height: 96,
                borderRadius: 48,
                backgroundColor: '#22c55e20',
              }}
            >
              <div
                className="flex items-center justify-center"
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 36,
                  backgroundColor: '#22c55e',
                }}
              >
                <Check size={36} color="#ffffff" />
              </div>
            </div>

            {/* 成功メッセージ */}
            <div className="flex flex-col items-center" style={{ gap: 8, width: '100%' }}>
              <h1 style={{ fontSize: 28, fontWeight: 700, color: '#0a0a0a', margin: 0 }}>
                お支払いが完了しました
              </h1>
              <p
                style={{
                  fontSize: 15,
                  fontWeight: 400,
                  color: '#737373',
                  textAlign: 'center',
                  margin: 0,
                  maxWidth: 340,
                }}
              >
                お支払いの処理が正常に完了しました。
              </p>
            </div>

            {/* 詳細カード */}
            <div
              className="w-full"
              style={{
                borderRadius: 12,
                backgroundColor: '#fafafa',
                border: '1px solid #e5e5e5',
                overflow: 'hidden',
              }}
            >
              <DetailRow label="注文番号" value={payment.order_number} />
              <DetailRow
                label={payment.order_type === 'takeout' ? '注文タイプ' : 'テーブル'}
                value={payment.order_type === 'takeout' ? 'テイクアウト' : `テーブル ${payment.table_number}`}
              />
              <DetailRow label="お支払い方法" value={paymentMethodLabel(payment.payment_method)} />
              <DetailRow label="日時" value={formatPaidAt(payment.paid_at)} />
              <div
                className="flex items-center justify-between"
                style={{
                  padding: 20,
                  backgroundColor: '#f5f5f5',
                }}
              >
                <span style={{ fontSize: 16, fontWeight: 600, color: '#0a0a0a' }}>
                  お支払い金額
                </span>
                <span style={{ fontSize: 24, fontWeight: 700, color: '#0a0a0a' }}>
                  ¥{payment.total.toLocaleString()}
                </span>
              </div>
            </div>

            {/* ボタングループ */}
            <div className="flex flex-col items-center w-full" style={{ gap: 12 }}>
              <Link
                href="/cashier"
                className="flex items-center justify-center w-full"
                style={{
                  height: 52,
                  borderRadius: 8,
                  backgroundColor: '#171717',
                  color: '#fafafa',
                  fontSize: 16,
                  fontWeight: 600,
                  gap: 8,
                  textDecoration: 'none',
                }}
              >
                <ArrowRight size={20} />
                次の注文へ
              </Link>
              <Link
                href="/cashier"
                className="flex items-center justify-center"
                style={{
                  padding: '8px 16px',
                  gap: 6,
                  color: '#737373',
                  fontSize: 14,
                  fontWeight: 500,
                  textDecoration: 'none',
                }}
              >
                <LayoutDashboard size={16} />
                ダッシュボードに戻る
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
