import { Head, Link } from '@inertiajs/react'
import { useMemo, useState } from 'react'
import { ShoppingCart, Flame, Star } from 'lucide-react'
import type { MenuItem } from '@/types'

const categories = [
  { id: 'burgers', label: 'Burgers', emoji: '🍔' },
  { id: 'sides', label: 'Sides', emoji: '🍟' },
  { id: 'drinks', label: 'Drinks', emoji: '🥤' },
  { id: 'kids', label: 'Kids', emoji: '🧒' },
]

interface OrderHomeProps {
  table_number: number
  restaurant_name: string
  menu_items: MenuItem[]
  cart_count: number
}

export default function OrderHome({
  table_number,
  restaurant_name,
  menu_items,
  cart_count,
}: OrderHomeProps) {
  const [activeCategory, setActiveCategory] = useState('burgers')

  const recommendedItems = useMemo(
    () => menu_items.filter((item) => item.recommended),
    [menu_items],
  )

  const categoryItems = useMemo(
    () => menu_items.filter((item) => item.category === activeCategory),
    [menu_items, activeCategory],
  )

  const activeCategoryLabel =
    categories.find((c) => c.id === activeCategory)?.label ?? 'Menu'

  return (
    <>
      <Head title="Order" />
      <div className="relative mx-auto max-w-[390px] min-h-screen bg-[#FFF8F0] overflow-hidden" style={{ fontFamily: 'Outfit, sans-serif' }}>
        {/* Sticky Header */}
        <header className="sticky top-0 z-20 flex items-center justify-between h-14 px-4 bg-white border-b border-[#F0E0D0] shadow-[0_2px_8px_rgba(26,18,16,0.03)]">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-9 h-9 rounded-full bg-[#E53935]">
              <span className="text-lg">🍔</span>
            </div>
            <span className="text-lg font-bold text-[#1A1210] tracking-tight">{restaurant_name}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#FFF8E1] border-[1.5px] border-[#FFB300]">
              <Star className="w-4 h-4 text-[#FB8C00]" fill="#FB8C00" />
              <span className="text-xs font-semibold text-[#1A1210]">Table {table_number}</span>
            </div>
          </div>
        </header>

        {/* Scroll Content */}
        <div className="pt-4 pb-20 flex flex-col gap-5">
          {/* Category Tabs */}
          <div className="flex gap-2 px-4 overflow-x-auto scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-semibold whitespace-nowrap transition-colors ${
                  activeCategory === cat.id
                    ? 'bg-[#E53935] text-white'
                    : 'bg-[#FFF3E0] text-[#6D5D4B] border border-[#F0E0D0]'
                }`}
              >
                <span className="text-sm">{cat.emoji}</span>
                {cat.label}
              </button>
            ))}
          </div>

          {/* Recommended Section */}
          {recommendedItems.length > 0 && (
            <section className="flex flex-col gap-3">
              <div className="flex items-center justify-between px-4">
                <div className="flex items-center gap-1.5">
                  <Flame className="w-5 h-5 text-[#FB8C00]" />
                  <span className="text-lg font-bold text-[#1A1210] tracking-tight">Recommended</span>
                </div>
              </div>
              <div className="flex gap-3 px-4 overflow-x-auto scrollbar-hide">
                {recommendedItems.map((item) => (
                  <Link key={item.id} href={`/order/item/${item.id}`} className="shrink-0 w-[155px] rounded-2xl bg-white shadow-[0_2px_8px_rgba(26,18,16,0.03)]">
                    <div className="relative h-[120px] rounded-t-xl overflow-hidden">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 rounded-full bg-[#FFB300]">
                        <Star className="w-3 h-3 text-[#1A1210]" />
                        <span className="text-[10px] font-semibold text-[#1A1210]">Recommended</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5 p-2.5 px-3">
                      <span className="text-sm font-semibold text-[#1A1210] truncate">{item.name}</span>
                      <div className="flex items-center justify-between">
                        <span className="text-base font-bold text-[#E53935] tracking-tight">¥{item.base_price}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Menu Section */}
          <section className="flex flex-col gap-3 px-4">
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-[#1A1210] tracking-tight">{activeCategoryLabel}</span>
              <span className="text-[13px] font-medium text-[#9E8E7E]">{categoryItems.length} items</span>
            </div>
            {categoryItems.length === 0 ? (
              <div className="py-10 text-center text-sm text-[#9E8E7E]">No items in this category yet.</div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {categoryItems.map((item) => (
                  <Link key={item.id} href={`/order/item/${item.id}`} className="rounded-2xl bg-white shadow-[0_2px_8px_rgba(26,18,16,0.03)]">
                    <div className="h-[120px] rounded-t-xl overflow-hidden">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex flex-col gap-1.5 p-2.5 px-3">
                      <span className="text-sm font-semibold text-[#1A1210] truncate">{item.name}</span>
                      <div className="flex items-center justify-between">
                        <span className="text-base font-bold text-[#E53935] tracking-tight">¥{item.base_price}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
          {/* Floating Cart Button */}
          <Link href="/order/cart" className="fixed bottom-6 right-6 z-30 flex items-center gap-2.5 px-5 py-3 rounded-full bg-[#E53935] shadow-[0_4px_16px_rgba(229,57,53,0.5),0_2px_4px_rgba(229,57,53,0.25)] hover:bg-[#C62828] transition-colors">
            <ShoppingCart className="w-5 h-5 text-white" />
            <span className="text-[15px] font-semibold text-white">Cart</span>
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#FFB300] text-xs font-bold text-[#1A1210]">
              {cart_count}
            </span>
          </Link>
        </div>
      </div>
    </>
  )
}
