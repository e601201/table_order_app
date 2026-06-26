import { Deferred, Head, Link } from '@inertiajs/react'
import { Wallet, ShoppingBag, Receipt, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import AdminLayout, { adminColors } from '@/components/AdminLayout'
import { kitchenStatusMeta, paymentStatusMeta } from '@/lib/orderStatus'
import type { AdminDashboardData, AdminOrderRow, DashboardSalesTrendPoint, DashboardPopularItem } from '@/types'

// 遅延ロード中のスケルトン背景（カード白地より一段暗いニュートラルグレー）。
const SKELETON_BG = '#ececec'

// 統計ダッシュボード（ADR-0005 更新）。KPI3枚（売上=paid基準 / 注文数=placed基準 / 平均注文単価=paid売上÷paid注文数）、
// 売上推移（paid×paid_at の直近7日を CSS バーで描画・gem/chartライブラリなし）、人気メニュー TOP5、最近の注文プレビュー。

function yen(value: number): string {
  return `¥${value.toLocaleString()}`
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

function orderTypeLabel(order: AdminOrderRow): string {
  return order.order_type === 'takeout' ? 'テイクアウト' : `テーブル ${order.table_number}`
}

function Badge({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5"
      style={{ backgroundColor: bg, color, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}
    >
      {label}
    </span>
  )
}

// 前日比。null（前日0・paid0件などゼロ除算ガード）は「—」、それ以外は符号付き％＋上下アイコン。
function ChangeBadge({ pct }: { pct: number | null }) {
  if (pct === null) {
    return <span style={{ fontSize: 12, fontWeight: 600, color: adminColors.textSecondary }}>—</span>
  }
  const flat = pct === 0
  const up = pct > 0
  const color = flat ? adminColors.textSecondary : up ? '#16a34a' : '#dc2626'
  const Icon = up ? TrendingUp : TrendingDown
  return (
    <span className="inline-flex items-center gap-0.5" style={{ fontSize: 12, fontWeight: 600, color }}>
      {!flat && <Icon size={13} />}
      {up ? '+' : ''}
      {pct}%
    </span>
  )
}

function KpiCard({
  label,
  value,
  change,
  icon: Icon,
  iconColor,
}: {
  label: string
  value: string
  change: number | null
  icon: LucideIcon
  iconColor: string
}) {
  return (
    <div className="rounded-xl p-5" style={{ backgroundColor: '#ffffff', border: `1px solid ${adminColors.border}` }}>
      <div className="flex items-center justify-between">
        <span style={{ fontSize: 13, fontWeight: 500, color: adminColors.textSecondary }}>{label}</span>
        <span className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: `${iconColor}1a` }}>
          <Icon size={18} color={iconColor} />
        </span>
      </div>
      <p className="mt-2" style={{ fontSize: 28, fontWeight: 700, lineHeight: 1.2, color: adminColors.textPrimary }}>
        {value}
      </p>
      <div className="mt-1 flex items-center gap-1.5">
        <span style={{ fontSize: 12, color: adminColors.textSecondary }}>前日比</span>
        <ChangeBadge pct={change} />
      </div>
    </div>
  )
}

function Card({
  title,
  subtitle,
  action,
  children,
}: {
  title: string
  subtitle?: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl p-5" style={{ backgroundColor: '#ffffff', border: `1px solid ${adminColors.border}` }}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: adminColors.textPrimary }}>{title}</h2>
          {subtitle && (
            <p className="mt-0.5" style={{ fontSize: 12, color: adminColors.textSecondary }}>
              {subtitle}
            </p>
          )}
        </div>
        {action}
      </div>
      {children}
    </div>
  )
}

function SalesTrend({ points }: { points: DashboardSalesTrendPoint[] }) {
  const maxAmount = Math.max(...points.map((p) => p.amount), 0)
  return (
    <div>
      <div className="flex items-end justify-between gap-2" style={{ height: 160 }}>
        {points.map((point) => {
          const heightPct = maxAmount > 0 ? (point.amount / maxAmount) * 100 : 0
          return (
            <div key={point.date} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
              <span style={{ fontSize: 10, fontWeight: 600, color: adminColors.textSecondary }}>
                {point.amount > 0 ? yen(point.amount) : ''}
              </span>
              <div
                className="w-full rounded-t"
                title={yen(point.amount)}
                style={{
                  height: `${heightPct}%`,
                  minHeight: point.amount > 0 ? 4 : 0,
                  backgroundColor: paymentStatusMeta.paid.color,
                }}
              />
            </div>
          )
        })}
      </div>
      {/* X 軸（実日付ラベル） */}
      <div
        className="mt-2 flex justify-between gap-2"
        style={{ borderTop: `1px solid ${adminColors.border}`, paddingTop: 8 }}
      >
        {points.map((point) => (
          <span
            key={point.date}
            className="flex-1 text-center"
            style={{ fontSize: 11, color: adminColors.textSecondary }}
          >
            {point.label}
          </span>
        ))}
      </div>
    </div>
  )
}

function PopularItems({ items }: { items: DashboardPopularItem[] }) {
  if (items.length === 0) {
    return (
      <p className="py-8 text-center" style={{ fontSize: 14, color: adminColors.textSecondary }}>
        本日の注文はまだありません
      </p>
    )
  }
  return (
    <ol className="flex flex-col gap-2.5">
      {items.map((item, index) => (
        <li key={item.name} className="flex items-center gap-3">
          <span
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md"
            style={{ backgroundColor: '#f5f5f5', fontSize: 12, fontWeight: 700, color: adminColors.textPrimary }}
          >
            {index + 1}
          </span>
          <span className="min-w-0 flex-1 truncate" style={{ fontSize: 14, color: adminColors.textPrimary }}>
            {item.name}
          </span>
          <span style={{ fontSize: 13, fontWeight: 600, color: adminColors.textSecondary, whiteSpace: 'nowrap' }}>
            販売数 {item.quantity}個
          </span>
        </li>
      ))}
    </ol>
  )
}

function RecentOrders({ orders }: { orders: AdminOrderRow[] }) {
  if (orders.length === 0) {
    return (
      <p className="py-8 text-center" style={{ fontSize: 14, color: adminColors.textSecondary }}>
        本日の注文はまだありません
      </p>
    )
  }
  return (
    <div className="flex flex-col">
      {orders.map((order) => {
        const k = kitchenStatusMeta[order.status]
        const p = paymentStatusMeta[order.payment_status]
        return (
          <div
            key={order.id}
            className="flex items-center gap-3 py-3"
            style={{ borderTop: `1px solid ${adminColors.border}` }}
          >
            <div className="min-w-0" style={{ width: 130 }}>
              <p className="truncate font-mono" style={{ fontSize: 14, fontWeight: 700, color: adminColors.textPrimary }}>
                {order.order_number}
              </p>
              <p className="truncate" style={{ fontSize: 12, color: adminColors.textSecondary }}>
                {orderTypeLabel(order)}
              </p>
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate" style={{ fontSize: 14, color: adminColors.textPrimary }}>
                {order.items_summary}
              </p>
              <p style={{ fontSize: 12, color: adminColors.textSecondary }}>{order.item_count} 点</p>
            </div>

            <span style={{ width: 90, textAlign: 'right', fontSize: 14, fontWeight: 700, color: adminColors.textPrimary }}>
              {yen(order.total)}
            </span>

            <div className="flex items-center gap-1.5" style={{ width: 180 }}>
              <Badge label={k.label} color={k.color} bg={k.bg} />
              <Badge label={p.label} color={p.color} bg={p.bg} />
            </div>

            <span
              style={{ width: 56, textAlign: 'right', fontSize: 13, fontWeight: 500, color: adminColors.textSecondary }}
            >
              {formatTime(order.placed_at)}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// --- 遅延ロード中のスケルトン（実コンテンツの寸法に寄せてレイアウトシフトを防ぐ） ---

// 売上推移グラフのプレースホルダ（固定高のバー7本＋X軸ラベル）。
function SalesTrendSkeleton() {
  const barHeights = [40, 70, 55, 90, 45, 75, 60]
  return (
    <div>
      <div className="flex items-end justify-between gap-2" style={{ height: 160 }}>
        {barHeights.map((h, i) => (
          <div
            key={i}
            className="flex-1 animate-pulse rounded-t"
            style={{ height: `${h}%`, backgroundColor: SKELETON_BG }}
          />
        ))}
      </div>
      <div
        className="mt-2 flex justify-between gap-2"
        style={{ borderTop: `1px solid ${adminColors.border}`, paddingTop: 8 }}
      >
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="h-3 flex-1 animate-pulse rounded" style={{ backgroundColor: SKELETON_BG }} />
        ))}
      </div>
    </div>
  )
}

// 人気メニューのプレースホルダ（5行）。
function PopularItemsSkeleton() {
  return (
    <ol className="flex flex-col gap-2.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <li key={i} className="flex items-center gap-3">
          <div className="h-6 w-6 shrink-0 animate-pulse rounded-md" style={{ backgroundColor: SKELETON_BG }} />
          <div className="h-4 flex-1 animate-pulse rounded" style={{ backgroundColor: SKELETON_BG }} />
          <div className="h-4 w-16 animate-pulse rounded" style={{ backgroundColor: SKELETON_BG }} />
        </li>
      ))}
    </ol>
  )
}

// 最近の注文のプレースホルダ（5行・本体の行レイアウトに合わせる）。
function RecentOrdersSkeleton() {
  return (
    <div className="flex flex-col">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 py-3"
          style={{ borderTop: `1px solid ${adminColors.border}` }}
        >
          <div className="animate-pulse rounded" style={{ width: 130, height: 32, backgroundColor: SKELETON_BG }} />
          <div className="h-8 flex-1 animate-pulse rounded" style={{ backgroundColor: SKELETON_BG }} />
          <div className="h-4 animate-pulse rounded" style={{ width: 90, backgroundColor: SKELETON_BG }} />
          <div className="h-6 animate-pulse rounded" style={{ width: 180, backgroundColor: SKELETON_BG }} />
          <div className="h-4 animate-pulse rounded" style={{ width: 56, backgroundColor: SKELETON_BG }} />
        </div>
      ))}
    </div>
  )
}

export default function Dashboard({ kpi, sales_trend, popular_items, recent_orders }: AdminDashboardData) {
  return (
    <>
      <Head title="ダッシュボード" />
      <AdminLayout
        active="dashboard"
        breadcrumb="ダッシュボード"
        title="ダッシュボード"
        description="本日の売上・注文の概況です。"
      >
        <div className="flex flex-col gap-6">
          {/* KPI 行（3カード） */}
          <div className="grid grid-cols-3 gap-4">
            <KpiCard
              label="本日の売上"
              value={kpi.sales.value === null ? '—' : yen(kpi.sales.value)}
              change={kpi.sales.change_pct}
              icon={Wallet}
              iconColor={paymentStatusMeta.paid.color}
            />
            <KpiCard
              label="注文数"
              value={kpi.orders.value === null ? '—' : kpi.orders.value.toLocaleString()}
              change={kpi.orders.change_pct}
              icon={ShoppingBag}
              iconColor={adminColors.textPrimary}
            />
            <KpiCard
              label="平均注文単価"
              value={kpi.average_order_value.value === null ? '—' : yen(kpi.average_order_value.value)}
              change={kpi.average_order_value.change_pct}
              icon={Receipt}
              iconColor={kitchenStatusMeta.in_progress.color}
            />
          </div>

          {/* 売上推移 ＋ 人気メニュー */}
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <Card title="売上推移" subtitle="過去7日間の売上">
                <Deferred data="sales_trend" fallback={<SalesTrendSkeleton />}>
                  <SalesTrend points={sales_trend ?? []} />
                </Deferred>
              </Card>
            </div>
            <Card title="人気メニュー" subtitle="本日の注文数ランキング">
              <Deferred data="popular_items" fallback={<PopularItemsSkeleton />}>
                <PopularItems items={popular_items ?? []} />
              </Deferred>
            </Card>
          </div>

          {/* 最近の注文プレビュー */}
          <Card
            title="最近の注文"
            subtitle="本日の最新注文（閲覧専用）"
            action={
              <Link
                href="/admin/orders"
                className="flex items-center gap-1 rounded-lg px-3 py-1.5"
                style={{ fontSize: 13, fontWeight: 600, color: adminColors.textPrimary, border: `1px solid ${adminColors.border}` }}
              >
                すべて見る
                <ArrowRight size={15} />
              </Link>
            }
          >
            <Deferred data="recent_orders" fallback={<RecentOrdersSkeleton />}>
              <RecentOrders orders={recent_orders ?? []} />
            </Deferred>
          </Card>
        </div>
      </AdminLayout>
    </>
  )
}
