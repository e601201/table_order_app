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

export type PlacedOrder = {
  order_number: string
  table_number: number | null
  order_type: OrderType
  items: CartLine[]
  totals: CartTotals
  placed_at: string
}

export type KitchenOrderStatus = 'pending' | 'in_progress' | 'ready' | 'completed'

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
