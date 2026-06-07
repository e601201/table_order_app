import type { KitchenOrderStatus, PaymentStatus } from '@/types'

// 二軸オーダー状態（ADR-0001）の表示メタ。Admin 注文管理は調理進捗バッジと支払いバッジの
// 2つを並べる（ADR-0005）。「完了」は曖昧なため使わず、CONTEXT.md の正準 UI コピーに揃える
// （提供済み / 会計済み）。配色は2軸が同じ緑で被らないよう、調理は進捗パレット、支払いは
// 未会計=赤 / 会計済み=緑 とする。
type BadgeMeta = {
  label: string
  color: string
  bg: string
}

function badge(label: string, color: string): BadgeMeta {
  return { label, color, bg: `${color}1a` }
}

// 調理進捗（axis 1）: Pending → In progress → Ready → Served。
export const kitchenStatusMeta: Record<KitchenOrderStatus, BadgeMeta> = {
  pending: badge('受付', '#d97706'),
  in_progress: badge('調理中', '#2563eb'),
  ready: badge('提供待ち', '#0891b2'),
  completed: badge('提供済み', '#475569'),
}

// 調理タブの並び順（すべて を先頭に）。
export const kitchenStatusOrder: KitchenOrderStatus[] = [
  'pending',
  'in_progress',
  'ready',
  'completed',
]

// 支払い（axis 2）: Unpaid → Paid。CONTEXT.md の業務側正準語「会計」に揃える。
export const paymentStatusMeta: Record<PaymentStatus, BadgeMeta> = {
  unpaid: badge('未会計', '#dc2626'),
  paid: badge('会計済み', '#16a34a'),
}
