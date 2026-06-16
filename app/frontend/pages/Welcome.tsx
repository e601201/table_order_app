import { Head, Link, router } from '@inertiajs/react'
import { useState } from 'react'

interface WelcomeProps {
  app_name: string
}

export default function Welcome({ app_name }: WelcomeProps) {
  // デモ入口でテーブル番号を指定して In-store 注文に入る（イシュー #41）。
  // Table エンティティ/母集合は持たないため、正の整数の自由入力。
  const [tableNumber, setTableNumber] = useState('')
  const parsed = Number(tableNumber)
  const isValidTable = tableNumber.trim() !== '' && Number.isInteger(parsed) && parsed >= 1

  const startInStoreOrder = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValidTable) return
    router.get('/order', { order_type: 'in_store', table_number: parsed })
  }

  return (
    <>
      <Head title="ようこそ" />
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6 py-10">
        <div className="w-full max-w-[390px]">
          <h1 className="text-3xl font-bold text-gray-900 text-center mb-2">
            {app_name}
          </h1>
          <p className="text-sm text-gray-500 text-center mb-10">
            POC デモエントリ
          </p>

          <section className="mb-8">
            <h2 className="text-xs font-semibold tracking-wider text-gray-500 uppercase mb-3">
              お客様向け
            </h2>
            <form onSubmit={startInStoreOrder} className="flex flex-col gap-3">
              <div>
                <label htmlFor="table_number" className="block text-xs font-medium text-gray-600 mb-1">
                  テーブル番号
                </label>
                <input
                  id="table_number"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  step={1}
                  required
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  placeholder="例: 5"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#E53935]/40 focus:border-[#E53935] transition"
                />
              </div>
              <button
                type="submit"
                disabled={!isValidTable}
                className="block w-full text-center px-4 py-3 rounded-lg bg-[#E53935] text-white font-medium shadow-sm hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                注文を開始
              </button>
              {/* テイクアウトへの到達経路は LINE ミニアプリ（LIFF URL）のみ（ADR-0008） */}
            </form>
          </section>

          <section>
            <h2 className="text-xs font-semibold tracking-wider text-gray-500 uppercase mb-3">
              スタッフ向け
            </h2>
            <div className="flex flex-col gap-3">
              <Link
                href="/login"
                className="block w-full text-center px-4 py-3 rounded-lg bg-white border border-gray-300 text-gray-800 font-medium shadow-sm hover:bg-gray-50 transition"
              >
                ログイン画面
              </Link>
            </div>
          </section>
        </div>
      </div>
    </>
  )
}
