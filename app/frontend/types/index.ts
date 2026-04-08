export type FlashData = {
  notice?: string
  alert?: string
}

export type SharedProps = {}

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
  sizes: SizeOption[]
  addons: AddonOption[]
}

export type CartLine = {
  line_id: string
  item_id: number
  name: string
  customization: string
  unit_price: number
  quantity: number
  line_total: number
  image: string
}

export type CartTotals = {
  subtotal: number
  tax: number
  total: number
  item_count: number
}

export type PlacedOrder = {
  order_number: string
  table_number: number
  items: CartLine[]
  totals: CartTotals
  placed_at: string
}
