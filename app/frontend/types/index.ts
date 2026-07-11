export type FlashData = {
  notice?: string | null
  alert?: string | null
}

export type StaffRole = 'kitchen' | 'cashier' | 'admin'

export type AuthStaff = {
  id: number
  name: string
  role: StaffRole
  login_id: string
}

export type Auth = {
  staff: AuthStaff | null
  signed_in: boolean
}

export type SharedProps = {
  auth: Auth
  flash: FlashData
}

export type SizeOption = {
  id: string
  label: string
  extra: number
}

export type AddonOption = {
  id: string
  label: string
  extra: number
}

export type MenuItem = {
  id: number
  category: string
  name: string
  description: string
  base_price: number
  calories: number
  image: string
  recommended: boolean
  max_quantity: number
  sizes: SizeOption[]
  addons: AddonOption[]
  // 販売可否の二値（売り切れ・販売停止を畳んだ結果）。残数は渡さない（ADR-0011）。
  sellable: boolean
}

// Admin のメニュー管理画面が扱う MenuItem（顧客向け MenuItem に image_url / has_image を加えた形）。
export type AdminMenuItem = {
  id: number
  category: string
  name: string
  description: string
  base_price: number
  calories: number
  recommended: boolean
  max_quantity: number
  sizes: SizeOption[]
  addons: AddonOption[]
  image_url: string
  has_image: boolean
  // 在庫操作 UI 用。Admin には実数を見せる（ADR-0011）。stock=null は在庫無制限。
  stock: number | null
  suspended: boolean
  sold_out: boolean
}

export type CartLine = {
  line_id: string
  item_id: number
  name: string
  size_id: string | null
  size_label: string | null
  addons: AddonOption[]
  customization: string
  unit_price: number
  quantity: number
  line_total: number
  image: string
  max_quantity: number
  // 売り切れ・販売停止になった line を確定前に警告するための二値（ADR-0011）。
  sellable: boolean
}

export type CartTotals = {
  subtotal: number
  tax: number
  total: number
  item_count: number
}

export type OrderType = 'in_store' | 'takeout'

// 完了画面が描画する永続 Order の1明細（ADR-0007）。セッション Cart の CartLine ではなく
// 永続 OrderItem のスナップショット（line_id ではなく DB の id を持つ）。
export type PlacedOrderItem = {
  id: number
  name: string
  size_label: string | null
  addons: AddonOption[]
  customization: string
  unit_price: number
  quantity: number
  line_total: number
}

// 完了画面（/order/complete/:id）が読む永続 Order。order_number は客への表示用の
// 当日連番 NNN（display_number）。
export type PlacedOrder = {
  id: number
  order_number: string
  table_number: number | null
  order_type: OrderType
  placed_at: string
  items: PlacedOrderItem[]
  totals: CartTotals
}

export type KitchenOrderStatus = 'pending' | 'in_progress' | 'ready' | 'served'

// 注文履歴（ADR-0008）の1明細。customization は size / addon の連結ラベル。
export type HistoryOrderItem = {
  id: number
  name: string
  quantity: number
  customization: string
  line_total: number
}

// 注文履歴の1行。現在進行中＋過去を兼ね、status の表示文言は orderStatus.ts の
// 正準コピー（kitchenStatusMeta）から引く。order_number は当日連番（display_number）。
export type HistoryOrder = {
  id: number
  order_number: string
  status: KitchenOrderStatus
  // 打ち切り済み（ADR-0010）。客向け表示は理由を問わず「キャンセル」バッジ1種のため
  // boolean だけが届く（理由は送られない）。
  closed: boolean
  placed_at: string
  total: number
  item_count: number
  items: HistoryOrderItem[]
}

// 注文状況（ADR-0012）の1明細。調理軸ライブ画面の表示に必要な最小限。
export type StatusOrderItem = {
  id: number
  name: string
  quantity: number
  customization: string
}

// 注文状況（/order/status）の1行。In-store・session 紐付け・調理軸のみ（ADR-0012）。
// 会計軸（payment_status / closed / closure_reason）は意図的に持たない — walkout の
// 「キャンセル」を客に出さない不変条件をサーバ側で畳み、unavailable（提供前クローズの二値）
// と調理 status だけを受け取る。ラベルは orderStatus.ts の inStoreOrderStatusMeta が引く。
export type StatusOrder = {
  id: number
  order_number: string
  status: KitchenOrderStatus
  unavailable: boolean
  placed_at: string
  item_count: number
  items: StatusOrderItem[]
}

export type KitchenOrderItem = {
  id: number
  name: string
  quantity: number
  size_label: string | null
  addons: AddonOption[]
}

export type KitchenOrder = {
  id: number
  order_number: string
  table_number: number | null
  order_type: OrderType
  status: KitchenOrderStatus
  placed_at: string
  items: KitchenOrderItem[]
}

export type OrdersByStatus = Record<KitchenOrderStatus, KitchenOrder[]>

// payment 軸（ADR-0010）: Unpaid → Paid | Closed の二股終端。closed は打ち切り済み。
export type PaymentStatus = 'unpaid' | 'paid' | 'closed'

// 打ち切り理由（ADR-0010）。4値固定: no_show=Takeout 限定 / walkout=In-store 限定。
export type ClosureReason = 'no_show' | 'out_of_stock' | 'customer_request' | 'walkout'

// 決済方法マスタの1行（ADR-0014）。Admin が設定ページでインライン管理する。
// Order 側の payment_method は会計時の名前スナップショット（string）であり、この型を参照しない。
export type AdminPaymentMethod = {
  id: number
  name: string
  enabled: boolean
}

export type CashierOrderItem = {
  id: number
  name: string
  quantity: number
  unit_price: number
  line_total: number
  size_label: string | null
  addons: AddonOption[]
}

export type CashierOrder = {
  id: number
  order_number: string
  table_number: number | null
  order_type: OrderType
  status: KitchenOrderStatus
  payment_status: PaymentStatus
  paid_at: string | null
  closed_at: string | null
  closure_reason: ClosureReason | null
  placed_at: string
  subtotal: number
  tax: number
  total: number
  // 会計時にスナップショットされた決済方法の名前（ADR-0014）。未会計は null。
  payment_method: string | null
  items: CashierOrderItem[]
}

// Admin 注文管理（閲覧専用 ADR-0005）。一覧行は明細を件数とサマリ文字列に集約する。
export type AdminOrderRow = {
  id: number
  order_number: string
  table_number: number | null
  order_type: OrderType
  status: KitchenOrderStatus
  payment_status: PaymentStatus
  closure_reason: ClosureReason | null
  total: number
  placed_at: string
  item_count: number
  items_summary: string
}

// 詳細は行情報に全明細・金額内訳・支払い情報を加えた形。
export type AdminOrderDetail = AdminOrderRow & {
  subtotal: number
  tax: number
  paid_at: string | null
  // 会計時にスナップショットされた決済方法の名前（ADR-0014）。未会計は null。
  payment_method: string | null
  items: CashierOrderItem[]
}

export type AdminOrderStats = {
  orders_count: number
  in_progress_count: number
  sales_total: number
  awaiting_payment_count: number
}

// Admin 統計ダッシュボード（ADR-0005 更新）。KPI 値と前日比%。分母0/paid0件は value/change_pct が null（フロントは「—」）。
export type DashboardKpi = {
  value: number | null
  change_pct: number | null
}

// 売上推移の1点。amount は paid 注文の total を paid_at で日割りした日次合計。
export type DashboardSalesTrendPoint = {
  date: string
  label: string
  amount: number
}

// 人気メニュー1行。quantity は order_items.name 単位の数量合計（販売数）。
export type DashboardPopularItem = {
  name: string
  quantity: number
}

export type AdminDashboardData = {
  kpi: {
    sales: DashboardKpi
    orders: DashboardKpi
    average_order_value: DashboardKpi
  }
  // 遅延ロード（InertiaRails.defer / group: "secondary"）。初期描画時は未取得で undefined。
  sales_trend?: DashboardSalesTrendPoint[]
  popular_items?: DashboardPopularItem[]
  recent_orders?: AdminOrderRow[]
}
