import { Head, Link } from '@inertiajs/react'
import { ArrowLeft, type LucideIcon } from 'lucide-react'

// 客向け注文リストのページ枠（注文状況 / 注文履歴の専用ペア）。
// 2ページはドメイン上のミラーペア（In-store の注文状況 ↔ Takeout の注文履歴。ADR-0012）で、
// 見た目の同一性は偶然ではなく意図 — 枠を共有してその意図をコードで表現する。
// カード本体は共有しない（History の価格列 / Status の unavailable バリアントは本質的な非対称）。
export default function CustomerOrderListShell({
  title,
  headerRight,
  empty,
  emptyIcon: EmptyIcon,
  emptyMessage,
  emptyLinkHref,
  emptyLinkLabel,
  children,
}: {
  title: string
  headerRight: React.ReactNode
  empty: boolean
  emptyIcon: LucideIcon
  emptyMessage: string
  emptyLinkHref: string
  emptyLinkLabel: string
  children: React.ReactNode
}) {
  return (
    <>
      <Head title={title} />
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
            <span className="text-lg font-bold text-[#1A1210] tracking-[-0.3px]">{title}</span>
          </div>
          {headerRight}
        </div>

        {/* Orders */}
        <div className="flex-1 flex flex-col gap-3 px-5 py-4">
          {empty && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <EmptyIcon className="w-12 h-12 text-[#C8B8A8]" />
              <span className="text-sm text-[#9E8E7E]">{emptyMessage}</span>
              <Link href={emptyLinkHref} className="text-sm font-semibold text-[#E53935]">
                {emptyLinkLabel}
              </Link>
            </div>
          )}

          {children}
        </div>
      </div>
    </>
  )
}
