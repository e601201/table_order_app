import { Head, Link } from '@inertiajs/react'

interface WelcomeProps {
  app_name: string
}

export default function Welcome({ app_name }: WelcomeProps) {
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
            <div className="flex flex-col gap-3">
              <Link
                href="/order?order_type=in_store&table_number=5"
                className="block w-full text-center px-4 py-3 rounded-lg bg-[#E53935] text-white font-medium shadow-sm hover:opacity-90 transition"
              >
                テーブルからの注文
              </Link>
              <Link
                href="/order?order_type=takeout"
                className="block w-full text-center px-4 py-3 rounded-lg bg-[#FB8C00] text-white font-medium shadow-sm hover:opacity-90 transition"
              >
                テイクアウトからの注文
              </Link>
            </div>
          </section>

          <section>
            <h2 className="text-xs font-semibold tracking-wider text-gray-500 uppercase mb-3">
              スタッフ向け
            </h2>
            <div className="flex flex-col gap-3">
              <Link
                href="/kitchen"
                className="block w-full text-center px-4 py-3 rounded-lg bg-white border border-gray-300 text-gray-800 font-medium shadow-sm hover:bg-gray-50 transition"
              >
                キッチン
              </Link>
              <Link
                href="/cashier"
                className="block w-full text-center px-4 py-3 rounded-lg bg-white border border-gray-300 text-gray-800 font-medium shadow-sm hover:bg-gray-50 transition"
              >
                レジ
              </Link>
            </div>
          </section>
        </div>
      </div>
    </>
  )
}
