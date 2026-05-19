import { Head, Link } from '@inertiajs/react'
import { useMemo, useState } from 'react'
import { ShoppingCart, Flame, Star } from 'lucide-react'
import type { MenuItem, OrderType } from '@/types'

const categories = [
  { id: 'burgers', label: 'バーガー', emoji: '🍔' },
  { id: 'sides', label: 'サイド', emoji: '🍟' },
  { id: 'drinks', label: 'ドリンク', emoji: '🥤' },
  { id: 'kids', label: 'キッズ', emoji: '🧒' },
]

interface OrderHomeProps {
  table_number: number | null
  order_type: OrderType
  restaurant_name: string
  menu_items: MenuItem[]
  cart_count: number
}

export default function OrderHome({
  table_number,
  order_type,
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
    categories.find((c) => c.id === activeCategory)?.label ?? 'メニュー'

  return (
    <>
      <Head title="注文" />
      <div className="relative mx-auto max-w-[390px] md:max-w-[1024px] min-h-screen bg-[#FFF8F0] overflow-hidden" style={{ fontFamily: 'Outfit, sans-serif' }}>
        {/* Sticky Header */}
        <header className="sticky top-0 z-20 flex items-center justify-between h-14 md:h-[60px] px-4 md:px-6 bg-white border-b border-[#F0E0D0] shadow-[0_2px_8px_rgba(26,18,16,0.03)]">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="flex items-center justify-center w-9 h-9 md:w-10 md:h-10 rounded-full bg-[#E53935]">
              <span className="text-lg md:text-xl">🍔</span>
            </div>
            <span className="text-lg md:text-xl font-bold text-[#1A1210] tracking-tight">{restaurant_name}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 md:gap-1.5 px-2.5 py-1 md:px-3 md:py-1.5 rounded-lg md:rounded-lg bg-[#FFF8E1] border-[1.5px] border-[#FFB300]">
              {order_type === 'in_store' ? (
                <>
                  <Star className="w-4 h-4 md:w-5 md:h-5 text-[#FB8C00]" fill="#FB8C00" />
                  <span className="text-xs md:text-sm font-semibold text-[#1A1210]">テーブル {table_number}</span>
                </>
              ) : (
                <span className="text-xs md:text-sm font-semibold text-[#1A1210]">テイクアウト</span>
              )}
            </div>
          </div>
        </header>

        {/* Scroll Content */}
        <div className="pt-4 md:pt-5 pb-20 md:pb-24 flex flex-col gap-5 md:gap-6">
          {/* Category Tabs */}
          <div className="flex gap-2 md:gap-2.5 px-4 md:px-6 overflow-x-auto scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-1.5 md:gap-2 px-4 py-2 md:px-5 md:py-2.5 rounded-full text-[13px] md:text-sm font-semibold whitespace-nowrap transition-colors ${
                  activeCategory === cat.id
                    ? 'bg-[#E53935] text-white'
                    : 'bg-[#FFF3E0] text-[#6D5D4B] border border-[#F0E0D0]'
                }`}
              >
                <span className="text-sm md:text-base">{cat.emoji}</span>
                {cat.label}
              </button>
            ))}
          </div>

          {/* Recommended Section */}
          {recommendedItems.length > 0 && (
            <section className="flex flex-col gap-3 md:gap-3.5">
              <div className="flex items-center justify-between px-4 md:px-6">
                <div className="flex items-center gap-1.5 md:gap-2">
                  <Flame className="w-5 h-5 text-[#FB8C00]" />
                  <span className="text-lg md:text-[18px] font-bold text-[#1A1210] tracking-tight">おすすめ</span>
                </div>
              </div>
              <div className="flex gap-3 md:gap-4 px-4 md:px-6 overflow-x-auto scrollbar-hide">
                {recommendedItems.map((item) => (
                  <Link key={item.id} href={`/order/item/${item.id}`} className="shrink-0 w-[155px] md:w-[220px] rounded-2xl bg-white shadow-[0_2px_8px_rgba(26,18,16,0.03)]">
                    <div className="relative h-[120px] md:h-[140px] rounded-t-xl overflow-hidden">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 rounded-full bg-[#FFB300]">
                        <Star className="w-3 h-3 text-[#1A1210]" />
                        <span className="text-[10px] font-semibold text-[#1A1210]">おすすめ</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5 md:gap-2 p-2.5 px-3 md:p-3 md:px-3.5">
                      <span className="text-sm md:text-[15px] font-semibold text-[#1A1210] truncate">{item.name}</span>
                      <div className="flex items-center justify-between">
                        <span className="text-base md:text-lg font-bold text-[#E53935] tracking-tight">¥{item.base_price}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Menu Section */}
          <section className="flex flex-col gap-3 md:gap-4 px-4 md:px-6">
            <div className="flex items-center justify-between">
              <span className="text-lg md:text-xl font-bold text-[#1A1210] tracking-tight">{activeCategoryLabel}</span>
              <span className="text-[13px] md:text-sm font-medium text-[#9E8E7E]">{categoryItems.length} 件</span>
            </div>
            {categoryItems.length === 0 ? (
              <div className="py-10 text-center text-sm text-[#9E8E7E]">このカテゴリーには商品がまだありません。</div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                {categoryItems.map((item) => (
                  <Link key={item.id} href={`/order/item/${item.id}`} className="rounded-2xl bg-white shadow-[0_2px_8px_rgba(26,18,16,0.03)]">
                    <div className="h-[120px] md:h-[160px] rounded-t-xl overflow-hidden">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex flex-col gap-1.5 md:gap-2 p-2.5 px-3 md:p-3 md:px-3.5">
                      <span className="text-sm md:text-[15px] font-semibold text-[#1A1210] truncate">{item.name}</span>
                      <div className="flex items-center justify-between">
                        <span className="text-base md:text-lg font-bold text-[#E53935] tracking-tight">¥{item.base_price}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
          {/* Floating Cart Button */}
          <Link href="/order/cart" className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-30 flex items-center gap-2.5 md:gap-3 px-5 py-3 md:px-6 md:py-3.5 rounded-full bg-[#E53935] shadow-[0_4px_16px_rgba(229,57,53,0.5),0_2px_4px_rgba(229,57,53,0.25)] hover:bg-[#C62828] transition-colors">
            <ShoppingCart className="w-5 h-5 md:w-[22px] md:h-[22px] text-white" />
            <span className="text-[15px] md:text-base font-semibold text-white">カート</span>
            <span className="flex items-center justify-center w-6 h-6 md:w-[26px] md:h-[26px] rounded-full bg-[#FFB300] text-xs md:text-[13px] font-bold text-[#1A1210]">
              {cart_count}
            </span>
          </Link>
        </div>
      </div>
    </>
  )
}
