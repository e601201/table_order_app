import { Head } from '@inertiajs/react'
import { useState } from 'react'
import { X, Flame, Minus, Plus, ShoppingCart } from 'lucide-react'

interface SizeOption {
  id: string
  label: string
  price: number
  priceLabel: string
}

interface AddonOption {
  id: string
  label: string
  price: number
}

interface ItemDetailProps {
  item?: {
    name: string
    description: string
    basePrice: number
    calories: number
    image: string
  }
  onClose?: () => void
  onAddToCart?: (item: { size: string; addons: string[]; quantity: number; total: number }) => void
}

const defaultItem = {
  name: 'Classic Cheeseburger',
  description:
    'Our signature beef patty with melted cheddar, fresh lettuce, ripe tomato, pickles, and our special house sauce on a toasted sesame bun.',
  basePrice: 580,
  calories: 520,
  image: 'https://images.unsplash.com/photo-1639339468012-528c6bc0361f?w=800&fit=crop',
}

const sizeOptions: SizeOption[] = [
  { id: 'regular', label: 'Regular', price: 0, priceLabel: '¥580' },
  { id: 'large', label: 'Large', price: 100, priceLabel: '+¥100' },
  { id: 'set', label: 'Set Meal (Fries + Drink)', price: 250, priceLabel: '+¥250' },
]

const addonOptions: AddonOption[] = [
  { id: 'cheese', label: 'Extra Cheese', price: 50 },
  { id: 'patty', label: 'Extra Patty', price: 200 },
  { id: 'bacon', label: 'Bacon', price: 100 },
  { id: 'egg', label: 'Egg', price: 80 },
]

export default function ItemDetail({ item = defaultItem, onClose, onAddToCart }: ItemDetailProps) {
  const [selectedSize, setSelectedSize] = useState('regular')
  const [selectedAddons, setSelectedAddons] = useState<string[]>([])
  const [quantity, setQuantity] = useState(1)

  const sizePrice = sizeOptions.find((s) => s.id === selectedSize)?.price ?? 0
  const addonsPrice = selectedAddons.reduce((sum, id) => {
    const addon = addonOptions.find((a) => a.id === id)
    return sum + (addon?.price ?? 0)
  }, 0)
  const totalPrice = (item.basePrice + sizePrice + addonsPrice) * quantity

  const toggleAddon = (id: string) => {
    setSelectedAddons((prev) => (prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]))
  }

  const handleAddToCart = () => {
    onAddToCart?.({ size: selectedSize, addons: selectedAddons, quantity, total: totalPrice })
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
            <button
              onClick={onClose}
              className="absolute top-4 left-4 flex items-center justify-center w-9 h-9 rounded-full bg-white shadow-[0_2px_8px_rgba(26,18,16,0.09)]"
            >
              <X className="w-5 h-5 text-[#1A1210]" />
            </button>
          </div>

          {/* Item Info */}
          <div className="flex flex-col gap-2 px-5 py-4">
            <h1 className="text-[22px] font-bold text-[#1A1210] tracking-[-0.3px]">{item.name}</h1>
            <p className="text-sm text-[#6D5D4B] leading-normal">{item.description}</p>
            <div className="flex items-center gap-2 pt-1">
              <span className="text-2xl font-bold text-[#E53935] tracking-[-0.5px]">
                ¥{item.basePrice}
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
          <div className="flex flex-col gap-3 px-5 py-3">
            <div className="flex items-center justify-between">
              <span className="text-base font-semibold text-[#1A1210]">Size</span>
              <span className="px-2 py-0.5 rounded-full bg-[#FFEBEE] text-[11px] font-semibold text-[#E53935]">
                Required
              </span>
            </div>
            <div className="flex flex-col">
              {sizeOptions.map((size, index) => (
                <button
                  key={size.id}
                  onClick={() => setSelectedSize(size.id)}
                  className={`flex items-center justify-between py-2.5 ${
                    index < sizeOptions.length - 1 ? 'border-b border-[#F0E0D0]' : ''
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
                  <span className="text-sm font-medium text-[#9E8E7E]">{size.priceLabel}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-[#F0E0D0]" />

          {/* Add-ons */}
          <div className="flex flex-col gap-3 px-5 py-3">
            <div className="flex items-center justify-between">
              <span className="text-base font-semibold text-[#1A1210]">Add-ons</span>
              <span className="px-2 py-0.5 rounded-full bg-[#FFF3E0] text-[11px] font-semibold text-[#9E8E7E]">
                Optional
              </span>
            </div>
            <div className="flex flex-col">
              {addonOptions.map((addon, index) => (
                <button
                  key={addon.id}
                  onClick={() => toggleAddon(addon.id)}
                  className={`flex items-center justify-between py-2.5 ${
                    index < addonOptions.length - 1 ? 'border-b border-[#F0E0D0]' : ''
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
                  <span className="text-sm font-medium text-[#9E8E7E]">+¥{addon.price}</span>
                </button>
              ))}
            </div>
          </div>

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
            className="flex items-center justify-center gap-2.5 h-[52px] rounded-2xl bg-[#E53935] shadow-[0_4px_16px_rgba(229,57,53,0.38),0_2px_4px_rgba(229,57,53,0.19)] hover:bg-[#C62828] transition-colors"
          >
            <ShoppingCart className="w-5 h-5 text-white" />
            <span className="text-base font-bold text-white">Add to Cart</span>
          </button>
        </div>
      </div>
    </>
  )
}
