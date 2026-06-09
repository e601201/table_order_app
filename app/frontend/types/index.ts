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

export type PaymentStatus = 'unpaid' | 'paid'

export type PaymentMethod = 'cash' | 'credit_card'

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
  placed_at: string
  subtotal: number
  tax: number
  total: number
  payment_method: PaymentMethod | null
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
  payment_method: PaymentMethod | null
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
  sales_trend: DashboardSalesTrendPoint[]
  popular_items: DashboardPopularItem[]
  recent_orders: AdminOrderRow[]
}
