import { Head, Link, router } from '@inertiajs/react'
import { useState } from 'react'
import { X, Flame, Minus, Plus, ShoppingCart } from 'lucide-react'
import type { MenuItem } from '@/types'

interface ItemDetailProps {
  item: MenuItem
}

export default function ItemDetail({ item }: ItemDetailProps) {
  const [selectedSize, setSelectedSize] = useState(item.sizes[0]?.id ?? '')
  const [selectedAddons, setSelectedAddons] = useState<string[]>([])
  const [quantity, setQuantity] = useState(1)
  const [submitting, setSubmitting] = useState(false)

  const sizePrice = item.sizes.find((s) => s.id === selectedSize)?.extra ?? 0
  const addonsPrice = selectedAddons.reduce((sum, id) => {
    const addon = item.addons.find((a) => a.id === id)
    return sum + (addon?.extra ?? 0)
  }, 0)
  const totalPrice = (item.base_price + sizePrice + addonsPrice) * quantity

  const toggleAddon = (id: string) => {
    setSelectedAddons((prev) => (prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]))
  }

  const handleAddToCart = () => {
    if (submitting) return
    setSubmitting(true)
    router.post(
      '/order/cart',
      {
        item_id: item.id,
        size_id: selectedSize,
        addon_ids: selectedAddons,
        quantity,
      },
      {
        onFinish: () => setSubmitting(false),
      },
    )
  }

  const formatExtra = (extra: number) => {
    if (extra === 0) return `¥${item.base_price}`
    return `+¥${extra}`
  }

  return (
    <>
      <Head title={item.name} />
      <div
        className="relative mx-auto max-w-[390px] md:max-w-[900px] min-h-screen bg-[#FFF8F0] flex flex-col"
        style={{ fontFamily: 'Outfit, sans-serif' }}
      >
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto pb-[120px] md:pb-[140px]">
          <div className="md:grid md:grid-cols-2 md:gap-0 md:items-stretch">
            {/* Item Image */}
            <div className="relative h-[260px] md:h-full md:min-h-[560px] bg-[#F0E0D0]">
              <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
              <Link
                href="/order"
                className="absolute top-4 left-4 md:top-5 md:left-5 flex items-center justify-center w-9 h-9 md:w-11 md:h-11 rounded-full bg-white shadow-[0_2px_8px_rgba(26,18,16,0.09)]"
              >
                <X className="w-5 h-5 md:w-6 md:h-6 text-[#1A1210]" />
              </Link>
            </div>

            <div className="md:flex md:flex-col">
              {/* Item Info */}
              <div className="flex flex-col gap-2 md:gap-3 px-5 py-4 md:px-7 md:py-6">
                <h1 className="text-[22px] md:text-[26px] font-bold text-[#1A1210] tracking-[-0.3px]">{item.name}</h1>
                <p className="text-sm md:text-base text-[#6D5D4B] leading-normal">{item.description}</p>
                <div className="flex items-center gap-2 md:gap-3 pt-1">
                  <span className="text-2xl md:text-[28px] font-bold text-[#E53935] tracking-[-0.5px]">
                    ¥{item.base_price}
                  </span>
                  <span className="flex items-center gap-1 px-2.5 py-1 md:px-3 md:py-1.5 rounded-full bg-[#FFF3E0]">
                    <Flame className="w-3.5 h-3.5 md:w-4 md:h-4 text-[#FB8C00]" />
                    <span className="text-xs md:text-sm font-medium text-[#9E8E7E]">{item.calories} kcal</span>
                  </span>
                </div>
              </div>

              {/* Divider */}
              <div className="h-px bg-[#F0E0D0]" />

              {/* Size Selection */}
              {item.sizes.length > 0 && (
                <div className="flex flex-col gap-3 md:gap-4 px-5 py-3 md:px-7 md:py-4">
                  <div className="flex items-center justify-between">
                    <span className="text-base md:text-lg font-semibold text-[#1A1210]">Size</span>
                    <span className="px-2 py-0.5 md:px-2.5 md:py-1 rounded-full bg-[#FFEBEE] text-[11px] md:text-xs font-semibold text-[#E53935]">
                      Required
                    </span>
                  </div>
                  <div className="flex flex-col">
                    {item.sizes.map((size, index) => (
                      <button
                        key={size.id}
                        onClick={() => setSelectedSize(size.id)}
                        className={`flex items-center justify-between py-2.5 md:py-3 ${
                          index < item.sizes.length - 1 ? 'border-b border-[#F0E0D0]' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2 md:gap-3">
                          <div
                            className={`w-[18px] h-[18px] md:w-5 md:h-5 rounded-full border-[1.5px] flex items-center justify-center ${
                              selectedSize === size.id
                                ? 'border-[#E53935]'
                                : 'border-[#C8B8A8]'
                            }`}
                          >
                            {selectedSize === size.id && (
                              <div className="w-[10px] h-[10px] md:w-3 md:h-3 rounded-full bg-[#E53935]" />
                            )}
                          </div>
                          <span
                            className={`text-sm md:text-base ${
                              selectedSize === size.id
                                ? 'font-semibold text-[#1A1210]'
                                : 'font-medium text-[#6D5D4B]'
                            }`}
                          >
                            {size.label}
                          </span>
                        </div>
                        <span className="text-sm md:text-base font-medium text-[#9E8E7E]">{formatExtra(size.extra)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Divider */}
              {item.addons.length > 0 && <div className="h-px bg-[#F0E0D0]" />}

              {/* Add-ons */}
              {item.addons.length > 0 && (
                <div className="flex flex-col gap-3 md:gap-4 px-5 py-3 md:px-7 md:py-4">
                  <div className="flex items-center justify-between">
                    <span className="text-base md:text-lg font-semibold text-[#1A1210]">Add-ons</span>
                    <span className="px-2 py-0.5 md:px-2.5 md:py-1 rounded-full bg-[#FFF3E0] text-[11px] md:text-xs font-semibold text-[#9E8E7E]">
                      Optional
                    </span>
                  </div>
                  <div className="flex flex-col">
                    {item.addons.map((addon, index) => (
                      <button
                        key={addon.id}
                        onClick={() => toggleAddon(addon.id)}
                        className={`flex items-center justify-between py-2.5 md:py-3 ${
                          index < item.addons.length - 1 ? 'border-b border-[#F0E0D0]' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2 md:gap-3">
                          <div
                            className={`w-[18px] h-[18px] md:w-5 md:h-5 rounded-[4px] border-[1.5px] flex items-center justify-center ${
                              selectedAddons.includes(addon.id)
                                ? 'bg-[#1A1210] border-[#1A1210]'
                                : 'border-[#C8B8A8]'
                            }`}
                          >
                            {selectedAddons.includes(addon.id) && (
                              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                <path
                                  d="M2.5 6L5 8.5L9.5 3.5"
                                  stroke="white"
                                  strokeWidth="1.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            )}
                          </div>
                          <span
                            className={`text-sm md:text-base ${
                              selectedAddons.includes(addon.id)
                                ? 'font-semibold text-[#1A1210]'
                                : 'font-medium text-[#6D5D4B]'
                            }`}
                          >
                            {addon.label}
                          </span>
                        </div>
                        <span className="text-sm md:text-base font-medium text-[#9E8E7E]">+¥{addon.extra}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Divider */}
              <div className="h-px bg-[#F0E0D0]" />

              {/* Quantity */}
              <div className="flex items-center justify-between px-5 py-4 md:px-7 md:py-5">
                <div className="flex items-center gap-2 md:gap-3">
                  <span className="text-base md:text-lg font-semibold text-[#1A1210]">Quantity</span>
                  <span className="text-xs md:text-sm font-medium text-[#9E8E7E]">Max: {item.max_quantity}</span>
                </div>
                <div className="flex items-center rounded-xl border-[1.5px] border-[#F0E0D0] bg-white overflow-hidden">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="flex items-center justify-center w-11 h-10 md:w-12 md:h-11"
                  >
                    <Minus className="w-[18px] h-[18px] md:w-5 md:h-5 text-[#6D5D4B]" />
                  </button>
                  <div className="flex items-center justify-center w-11 h-10 md:w-12 md:h-11 border-x border-[#F0E0D0]">
                    <span className="text-lg md:text-xl font-bold text-[#1A1210]">{quantity}</span>
                  </div>
                  <button
                    onClick={() => setQuantity((q) => Math.min(item.max_quantity, q + 1))}
                    disabled={quantity >= item.max_quantity}
                    className="flex items-center justify-center w-11 h-10 md:w-12 md:h-11 disabled:opacity-40"
                  >
                    <Plus className="w-[18px] h-[18px] md:w-5 md:h-5 text-[#E53935]" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Fixed Footer */}
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[390px] md:max-w-[900px] bg-white border-t border-[#F0E0D0] shadow-[0_-4px_16px_rgba(26,18,16,0.06)] px-5 pt-3 pb-6 md:px-7 md:pt-4 md:pb-7 flex flex-col gap-3 md:gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center justify-between md:gap-3">
            <span className="text-sm md:text-base font-medium text-[#6D5D4B]">Total</span>
            <span className="text-[22px] md:text-[26px] font-bold text-[#1A1210] tracking-[-0.5px]">
              ¥{totalPrice.toLocaleString()}
            </span>
          </div>
          <button
            onClick={handleAddToCart}
            disabled={submitting}
            className="flex items-center justify-center gap-2.5 md:gap-3 h-[52px] md:h-[56px] md:px-10 md:min-w-[280px] rounded-2xl bg-[#E53935] shadow-[0_4px_16px_rgba(229,57,53,0.38),0_2px_4px_rgba(229,57,53,0.19)] hover:bg-[#C62828] disabled:opacity-60 transition-colors"
          >
            <ShoppingCart className="w-5 h-5 md:w-6 md:h-6 text-white" />
            <span className="text-base md:text-lg font-bold text-white">Add to Cart</span>
          </button>
        </div>
      </div>
    </>
  )
}
