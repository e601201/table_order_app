import { Head, Link } from '@inertiajs/react'
import { useState } from 'react'
import { ArrowLeft, Trash2, Minus, Plus, ShoppingBag, Check } from 'lucide-react'

interface CartItem {
  id: number
  name: string
  customization: string
  price: number
  quantity: number
  image: string
}

interface CartReviewProps {
  table_number?: number
}

const initialCartItems: CartItem[] = [
  {
    id: 1,
    name: 'Classic Burger',
    customization: 'Large · Extra Cheese',
    price: 780,
    quantity: 2,
    image: 'https://images.unsplash.com/photo-1639339468012-528c6bc0361f?w=400&fit=crop',
  },
  {
    id: 2,
    name: 'Crispy Fries',
    customization: 'Regular · Sea Salt',
    price: 320,
    quantity: 1,
    image: 'https://images.unsplash.com/photo-1626869300065-3bfc3a8b2e42?w=400&fit=crop',
  },
  {
    id: 3,
    name: 'Iced Lemon Tea',
    customization: 'Medium · Less Ice',
    price: 250,
    quantity: 1,
    image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&fit=crop',
  },
]

const TAX_RATE = 0.1

export default function CartReview({ table_number = 5 }: CartReviewProps) {
  const [cartItems, setCartItems] = useState<CartItem[]>(initialCartItems)
  const [specialInstructions, setSpecialInstructions] = useState('No onions on the burger, please.')

  const updateQuantity = (id: number, delta: number) => {
    setCartItems((items) =>
      items.map((item) =>
        item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item,
      ),
    )
  }

  const removeItem = (id: number) => {
    setCartItems((items) => items.filter((item) => item.id !== id))
  }

  const clearAll = () => {
    setCartItems([])
  }

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0)
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const tax = Math.floor(subtotal * TAX_RATE)
  const total = subtotal + tax

  return (
    <>
      <Head title="Your Cart" />
      <div
        className="relative mx-auto max-w-[390px] min-h-screen bg-[#FFF8F0] flex flex-col"
        style={{ fontFamily: 'Outfit, sans-serif' }}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between h-14 px-4 bg-white border-b border-[#F0E0D0] shadow-[0_2px_8px_rgba(26,18,16,0.03)]">
          <div className="flex items-center gap-3">
            <Link
              href="/order"
              className="flex items-center justify-center w-9 h-9 rounded-full bg-[#FFF3E0] border border-[#F0E0D0]"
            >
              <ArrowLeft className="w-5 h-5 text-[#1A1210]" />
            </Link>
            <span className="text-lg font-bold text-[#1A1210] tracking-[-0.3px]">Your Cart</span>
          </div>
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#FFF8E1] border-[1.5px] border-[#FFB300]">
            <span className="text-xs font-semibold text-[#1A1210]">Table {table_number}</span>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto pb-[180px]">
          {/* Items Header */}
          <div className="flex items-center justify-between px-5 pt-4 pb-2">
            <span className="text-base font-semibold text-[#1A1210]">{totalItems} Items</span>
            <button onClick={clearAll} className="text-[13px] font-medium text-[#E53935]">
              Clear All
            </button>
          </div>

          {/* Cart Items */}
          <div className="flex flex-col px-5">
            {cartItems.map((item, index) => (
              <div
                key={item.id}
                className={`flex items-center gap-3 py-4 ${
                  index < cartItems.length - 1 ? 'border-b border-[#F0E0D0]' : ''
                }`}
              >
                {/* Thumbnail */}
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-[72px] h-[72px] rounded-xl object-cover flex-shrink-0"
                />

                {/* Item Info */}
                <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                  {/* Name Row */}
                  <div className="flex items-center justify-between">
                    <span className="text-[15px] font-semibold text-[#1A1210] truncate">
                      {item.name}
                    </span>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="flex items-center justify-center w-7 h-7 rounded-full bg-[#FFEBEE] flex-shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-[#E53935]" />
                    </button>
                  </div>

                  {/* Customization */}
                  <span className="text-xs text-[#9E8E7E]">{item.customization}</span>

                  {/* Price & Qty */}
                  <div className="flex items-center justify-between">
                    <span className="text-base font-bold text-[#E53935] tracking-[-0.5px]">
                      ¥{item.price.toLocaleString()}
                    </span>

                    {/* Qty Stepper */}
                    <div className="flex items-center rounded-[10px] border-[1.5px] border-[#F0E0D0] bg-white overflow-hidden">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        className="flex items-center justify-center w-8 h-8"
                      >
                        <Minus className="w-3.5 h-3.5 text-[#6D5D4B]" />
                      </button>
                      <div className="flex items-center justify-center w-8 h-8 border-x border-[#F0E0D0]">
                        <span className="text-sm font-bold text-[#1A1210]">{item.quantity}</span>
                      </div>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        className="flex items-center justify-center w-8 h-8"
                      >
                        <Plus className="w-3.5 h-3.5 text-[#E53935]" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {cartItems.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <ShoppingBag className="w-12 h-12 text-[#C8B8A8]" />
                <span className="text-sm text-[#9E8E7E]">Your cart is empty</span>
                <Link
                  href="/order"
                  className="text-sm font-semibold text-[#E53935]"
                >
                  Browse Menu
                </Link>
              </div>
            )}
          </div>

          {/* Special Instructions */}
          <div className="flex flex-col gap-2 px-5 py-4">
            <span className="text-sm font-semibold text-[#1A1210]">Special Instructions</span>
            <textarea
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              placeholder="Add any special requests..."
              className="w-full h-14 px-4 py-3 rounded-xl bg-[#FFF3E0] border border-[#F0E0D0] text-[13px] text-[#6D5D4B] placeholder-[#C8B8A8] resize-none outline-none focus:border-[#E53935] transition-colors"
              style={{ fontFamily: 'Outfit, sans-serif' }}
            />
          </div>

          {/* Divider */}
          <div className="h-2 bg-[#FFF3E0]" />

          {/* Order Summary */}
          <div className="flex flex-col gap-3 px-5 py-4">
            <span className="text-base font-semibold text-[#1A1210]">Order Summary</span>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#6D5D4B]">Subtotal</span>
              <span className="text-sm font-medium text-[#1A1210]">
                ¥{subtotal.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#6D5D4B]">Tax (10%)</span>
              <span className="text-sm font-medium text-[#1A1210]">
                ¥{tax.toLocaleString()}
              </span>
            </div>
            <div className="h-px bg-[#F0E0D0]" />
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-[#1A1210]">Total</span>
              <span className="text-[22px] font-bold text-[#E53935] tracking-[-0.5px]">
                ¥{total.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Fixed Footer */}
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[390px] bg-white border-t border-[#F0E0D0] shadow-[0_-4px_16px_rgba(26,18,16,0.06)] px-5 pt-3 pb-7 flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-medium text-[#9E8E7E]">Amount to Pay</span>
              <span className="text-xl font-bold text-[#1A1210] tracking-[-0.5px]">
                ¥{total.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#FFF3E0] border border-[#F0E0D0]">
              <ShoppingBag className="w-3.5 h-3.5 text-[#6D5D4B]" />
              <span className="text-xs font-semibold text-[#6D5D4B]">{totalItems} items</span>
            </div>
          </div>
          <button
            disabled={cartItems.length === 0}
            className="flex items-center justify-center gap-2.5 h-[52px] rounded-2xl bg-[#E53935] shadow-[0_4px_16px_rgba(229,57,53,0.38),0_2px_4px_rgba(229,57,53,0.19)] hover:bg-[#C62828] disabled:opacity-50 disabled:hover:bg-[#E53935] transition-colors"
          >
            <Check className="w-5 h-5 text-white" />
            <span className="text-base font-bold text-white">Confirm Order</span>
          </button>
          <p className="text-[11px] text-[#9E8E7E] text-center">
            Pay at cashier after confirmation
          </p>
        </div>
      </div>
    </>
  )
}
