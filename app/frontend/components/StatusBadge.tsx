// 客向け注文リスト（注文状況 / 注文履歴）のステータスバッジ pill。両ページで完全同一の見た目。
export default function StatusBadge({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span className="px-2.5 py-1 rounded-full text-xs font-bold" style={{ color, backgroundColor: bg }}>
      {label}
    </span>
  )
}
