import { router, usePage } from '@inertiajs/react'
import { useEffect, useState } from 'react'
import { CheckCircle2, AlertCircle } from 'lucide-react'
import type { SharedProps } from '@/types'

// flash.notice / flash.alert を画面上部にトースト表示する。数秒で自動的に消える。
export default function FlashMessage() {
  const { flash } = usePage<SharedProps>().props
  const message = flash?.alert ?? flash?.notice ?? null
  const isError = Boolean(flash?.alert)
  const [visible, setVisible] = useState(false)
  // 同じ文言が連続しても（例: 在庫不足で同じカートへ繰り返し差し戻されたとき）毎回
  // トーストを出し直すためのカウンタ。Inertia の遷移完了ごとに進める。
  const [navTick, setNavTick] = useState(0)

  useEffect(() => router.on('finish', () => setNavTick((t) => t + 1)), [])

  useEffect(() => {
    if (!message) {
      setVisible(false)
      return
    }
    setVisible(true)
    const timer = setTimeout(() => setVisible(false), 4000)
    return () => clearTimeout(timer)
  }, [message, navTick])

  if (!visible || !message) return null

  return (
    <div className="fixed inset-x-0 top-4 z-50 flex justify-center px-4">
      <div
        role="status"
        className="flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium shadow-md"
        style={{
          backgroundColor: isError ? '#fef2f2' : '#f0fdf4',
          color: isError ? '#dc2626' : '#16a34a',
        }}
      >
        {isError ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
        <span>{message}</span>
      </div>
    </div>
  )
}
