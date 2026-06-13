import type { ClosureReason, KitchenOrderStatus, OrderType, PaymentStatus } from '@/types'

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
  served: badge('提供済み', '#475569'),
}

// 調理タブの並び順（すべて を先頭に）。
export const kitchenStatusOrder: KitchenOrderStatus[] = [
  'pending',
  'in_progress',
  'ready',
  'served',
]

// 支払い（axis 2）: Unpaid → Paid | Closed（ADR-0010）。CONTEXT.md の業務側正準語に揃える
// — スタッフ面の Closed は「打ち切り」（キャンセルとは呼ばない）。
export const paymentStatusMeta: Record<PaymentStatus, BadgeMeta> = {
  unpaid: badge('未会計', '#dc2626'),
  paid: badge('会計済み', '#16a34a'),
  closed: badge('打ち切り', '#737373'),
}

// 打ち切り理由（ADR-0010）のスタッフ面ラベル。4値固定・other なし。
export const closureReasonLabel: Record<ClosureReason, string> = {
  no_show: '来店なし',
  out_of_stock: '品切れ',
  customer_request: 'お客様都合',
  walkout: '未払い離店',
}

// order type ごとに選べる理由（構造整合。ADR-0010）: no_show は Takeout 限定（着席客に
// 「来なかった」はない）、walkout は In-store 限定（Takeout に Served + Unpaid は存在しない）。
// サーバー側バリデーションが境界 — ここは UI が無効な選択肢を出さないためのミラー。
export const closureReasonsByOrderType: Record<OrderType, ClosureReason[]> = {
  takeout: ['no_show', 'out_of_stock', 'customer_request'],
  in_store: ['out_of_stock', 'customer_request', 'walkout'],
}

// 客向けの打ち切り表示（ADR-0010）: 理由を問わず「キャンセル」バッジ1種だけ。
// 「キャンセル」が嘘をつく唯一のケース（walkout）は In-store 限定で、In-store の客に
// 履歴 surface は存在しない — 客の目に触れる場所ではこの言葉は常に正直（CONTEXT.md: Closed）。
export const customerClosedBadge: BadgeMeta = badge('キャンセル', '#737373')

// Takeout の客向け表示（ADR-0009）: 手渡しが会計と同時に起きるため、終端の Served は
// 「受取済み」と表記する。スタッフ面の正準コピー（提供済み）は変えない — 客向けの
// 言い分けはこの1箇所だけで定義し、第3の表記揺れを作らない（CONTEXT.md: Served）。
export const takeoutCustomerStatusMeta: Record<KitchenOrderStatus, BadgeMeta> = {
  ...kitchenStatusMeta,
  served: badge('受取済み', '#16a34a'),
}
