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
        className="relative mx-auto max-w-[390px] min-h-screen bg-[#FFF8F0] flex flex-col"
        style={{ fontFamily: 'Outfit, sans-serif' }}
      >
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto pb-[120px]">
          {/* Item Image */}
          <div className="relative h-[260px] bg-[#F0E0D0]">
            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
            <Link
              href="/order"
              className="absolute top-4 left-4 flex items-center justify-center w-9 h-9 rounded-full bg-white shadow-[0_2px_8px_rgba(26,18,16,0.09)]"
            >
              <X className="w-5 h-5 text-[#1A1210]" />
            </Link>
          </div>

          {/* Item Info */}
          <div className="flex flex-col gap-2 px-5 py-4">
            <h1 className="text-[22px] font-bold text-[#1A1210] tracking-[-0.3px]">{item.name}</h1>
            <p className="text-sm text-[#6D5D4B] leading-normal">{item.description}</p>
            <div className="flex items-center gap-2 pt-1">
              <span className="text-2xl font-bold text-[#E53935] tracking-[-0.5px]">
                ¥{item.base_price}
              </span>
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#FFF3E0]">
                <Flame className="w-3.5 h-3.5 text-[#FB8C00]" />
                <span className="text-xs font-medium text-[#9E8E7E]">{item.calories} kcal</span>
              </span>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-[#F0E0D0]" />

          {/* Size Selection */}
          {item.sizes.length > 0 && (
            <div className="flex flex-col gap-3 px-5 py-3">
              <div className="flex items-center justify-between">
                <span className="text-base font-semibold text-[#1A1210]">Size</span>
                <span className="px-2 py-0.5 rounded-full bg-[#FFEBEE] text-[11px] font-semibold text-[#E53935]">
                  Required
                </span>
              </div>
              <div className="flex flex-col">
                {item.sizes.map((size, index) => (
                  <button
                    key={size.id}
                    onClick={() => setSelectedSize(size.id)}
                    className={`flex items-center justify-between py-2.5 ${
                      index < item.sizes.length - 1 ? 'border-b border-[#F0E0D0]' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-[18px] h-[18px] rounded-full border-[1.5px] flex items-center justify-center ${
                          selectedSize === size.id
                            ? 'border-[#E53935]'
                            : 'border-[#C8B8A8]'
                        }`}
                      >
                        {selectedSize === size.id && (
                          <div className="w-[10px] h-[10px] rounded-full bg-[#E53935]" />
                        )}
                      </div>
                      <span
                        className={`text-sm ${
                          selectedSize === size.id
                            ? 'font-semibold text-[#1A1210]'
                            : 'font-medium text-[#6D5D4B]'
                        }`}
                      >
                        {size.label}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-[#9E8E7E]">{formatExtra(size.extra)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Divider */}
          {item.addons.length > 0 && <div className="h-px bg-[#F0E0D0]" />}

          {/* Add-ons */}
          {item.addons.length > 0 && (
            <div className="flex flex-col gap-3 px-5 py-3">
              <div className="flex items-center justify-between">
                <span className="text-base font-semibold text-[#1A1210]">Add-ons</span>
                <span className="px-2 py-0.5 rounded-full bg-[#FFF3E0] text-[11px] font-semibold text-[#9E8E7E]">
                  Optional
                </span>
              </div>
              <div className="flex flex-col">
                {item.addons.map((addon, index) => (
                  <button
                    key={addon.id}
                    onClick={() => toggleAddon(addon.id)}
                    className={`flex items-center justify-between py-2.5 ${
                      index < item.addons.length - 1 ? 'border-b border-[#F0E0D0]' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-[18px] h-[18px] rounded-[4px] border-[1.5px] flex items-center justify-center ${
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
                        className={`text-sm ${
                          selectedAddons.includes(addon.id)
                            ? 'font-semibold text-[#1A1210]'
                            : 'font-medium text-[#6D5D4B]'
                        }`}
                      >
                        {addon.label}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-[#9E8E7E]">+¥{addon.extra}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Divider */}
          <div className="h-px bg-[#F0E0D0]" />

          {/* Quantity */}
          <div className="flex items-center justify-between px-5 py-4">
            <span className="text-base font-semibold text-[#1A1210]">Quantity</span>
            <div className="flex items-center rounded-xl border-[1.5px] border-[#F0E0D0] bg-white overflow-hidden">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="flex items-center justify-center w-11 h-10"
              >
                <Minus className="w-[18px] h-[18px] text-[#6D5D4B]" />
              </button>
              <div className="flex items-center justify-center w-11 h-10 border-x border-[#F0E0D0]">
                <span className="text-lg font-bold text-[#1A1210]">{quantity}</span>
              </div>
              <button
                onClick={() => setQuantity((q) => q + 1)}
                className="flex items-center justify-center w-11 h-10"
              >
                <Plus className="w-[18px] h-[18px] text-[#E53935]" />
              </button>
            </div>
          </div>
        </div>

        {/* Fixed Footer */}
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[390px] bg-white border-t border-[#F0E0D0] shadow-[0_-4px_16px_rgba(26,18,16,0.06)] px-5 pt-3 pb-6 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[#6D5D4B]">Total</span>
            <span className="text-[22px] font-bold text-[#1A1210] tracking-[-0.5px]">
              ¥{totalPrice.toLocaleString()}
            </span>
          </div>
          <button
            onClick={handleAddToCart}
            disabled={submitting}
            className="flex items-center justify-center gap-2.5 h-[52px] rounded-2xl bg-[#E53935] shadow-[0_4px_16px_rgba(229,57,53,0.38),0_2px_4px_rgba(229,57,53,0.19)] hover:bg-[#C62828] disabled:opacity-60 transition-colors"
          >
            <ShoppingCart className="w-5 h-5 text-white" />
            <span className="text-base font-bold text-white">Add to Cart</span>
          </button>
        </div>
      </div>
    </>
  )
}
