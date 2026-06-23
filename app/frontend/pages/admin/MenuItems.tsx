import { Head, Link, router } from '@inertiajs/react'
import { useMemo, useState } from 'react'
import { Utensils, Search, Pencil, Trash2, Plus, Minus, Star } from 'lucide-react'
import AdminLayout, { adminColors } from '@/components/AdminLayout'
import { categoryLabel, categoryEmoji } from '@/lib/menuCategory'
import type { AdminMenuItem } from '@/types'

interface MenuItemsProps {
  menu_items: AdminMenuItem[]
  categories: string[]
}

type CategoryFilter = 'all' | string

export default function MenuItems({ menu_items, categories }: MenuItemsProps) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<CategoryFilter>('all')

  const counts = useMemo<Record<string, number>>(() => {
    const byCategory: Record<string, number> = { all: menu_items.length }
    for (const c of categories) byCategory[c] = menu_items.filter((m) => m.category === c).length
    return byCategory
  }, [menu_items, categories])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return menu_items.filter((item) => {
      const matchesCategory = filter === 'all' || item.category === filter
      const matchesQuery = q === '' || item.name.toLowerCase().includes(q)
      return matchesCategory && matchesQuery
    })
  }, [menu_items, query, filter])

  const filterTabs: { key: CategoryFilter; label: string }[] = [
    { key: 'all', label: 'すべて' },
    ...categories.map((c) => ({ key: c, label: categoryLabel(c) })),
  ]

  function destroy(item: AdminMenuItem) {
    if (!window.confirm(`メニュー「${item.name}」を削除しますか？この操作は取り消せません。`)) return
    router.delete(`/admin/menu_items/${item.id}`, { preserveScroll: true })
  }

  // 在庫操作（ADR-0011）。重い編集フォームを再送せず availability エンドポイントへ即時反映。
  // 補充は絶対値セット。stock=null（無制限）の品はステッパーを出さない。
  function setStock(item: AdminMenuItem, next: number) {
    router.patch(`/admin/menu_items/${item.id}/availability`, { stock: next }, { preserveScroll: true })
  }

  function toggleSuspended(item: AdminMenuItem) {
    router.patch(`/admin/menu_items/${item.id}/availability`, { suspended: !item.suspended }, { preserveScroll: true })
  }

  return (
    <>
      <Head title="メニュー管理" />
      <AdminLayout
        active="menu"
        breadcrumb="メニュー管理"
        title="メニュー管理"
        description="商品の登録・編集・削除を行います"
        headerActions={
          <Link
            href="/admin/menu_items/new"
            className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
            style={{ backgroundColor: '#E53935' }}
          >
            <Plus size={16} />
            メニュー新規登録
          </Link>
        }
      >
        {/* 統計カード */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          <div
            className="rounded-xl p-5"
            style={{ backgroundColor: adminColors.bg, border: `1px solid ${adminColors.border}` }}
          >
            <div className="flex items-center justify-between">
              <span style={{ fontSize: 13, fontWeight: 500, color: adminColors.textSecondary }}>総数</span>
              <span className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: '#0a0a0a1a' }}>
                <Utensils size={18} color={adminColors.textPrimary} />
              </span>
            </div>
            <p className="mt-2" style={{ fontSize: 28, fontWeight: 700, lineHeight: 1.2, color: adminColors.textPrimary }}>
              {counts.all}
            </p>
          </div>
          {categories.map((c) => (
            <div
              key={c}
              className="rounded-xl p-5"
              style={{ backgroundColor: adminColors.bg, border: `1px solid ${adminColors.border}` }}
            >
              <div className="flex items-center justify-between">
                <span style={{ fontSize: 13, fontWeight: 500, color: adminColors.textSecondary }}>{categoryLabel(c)}</span>
                <span style={{ fontSize: 18 }}>{categoryEmoji(c)}</span>
              </div>
              <p className="mt-2" style={{ fontSize: 28, fontWeight: 700, lineHeight: 1.2, color: adminColors.textPrimary }}>
                {counts[c] ?? 0}
              </p>
            </div>
          ))}
        </div>

        {/* テーブルカード */}
        <div
          className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl"
          style={{ backgroundColor: adminColors.bg, border: `1px solid ${adminColors.border}` }}
        >
          {/* ツールバー */}
          <div className="flex flex-wrap items-center gap-3 p-4" style={{ borderBottom: `1px solid ${adminColors.border}` }}>
            <div
              className="flex items-center gap-2 rounded-lg px-3"
              style={{ height: 36, width: 280, border: `1px solid ${adminColors.border}` }}
            >
              <Search size={16} color={adminColors.textSecondary} />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="商品名で検索..."
                className="w-full bg-transparent text-sm outline-none"
                style={{ color: adminColors.textPrimary }}
              />
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {filterTabs.map((tab) => {
                const isActive = filter === tab.key
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setFilter(tab.key)}
                    className="rounded-lg px-3 py-1.5 text-sm font-medium transition"
                    style={{
                      backgroundColor: isActive ? adminColors.active : adminColors.bg,
                      color: isActive ? adminColors.bg : adminColors.textPrimary,
                      border: isActive ? 'none' : `1px solid ${adminColors.border}`,
                    }}
                  >
                    {tab.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* テーブルヘッダー */}
          <div
            className="flex items-center px-4 py-2.5"
            style={{ backgroundColor: '#f5f5f5', borderBottom: `1px solid ${adminColors.border}` }}
          >
            <span className="flex-1" style={{ fontSize: 12, fontWeight: 600, color: adminColors.textSecondary, letterSpacing: 0.4 }}>
              商品
            </span>
            <span style={{ width: 110, fontSize: 12, fontWeight: 600, color: adminColors.textSecondary, letterSpacing: 0.4 }}>
              カテゴリ
            </span>
            <span style={{ width: 90, fontSize: 12, fontWeight: 600, color: adminColors.textSecondary, letterSpacing: 0.4, textAlign: 'right' }}>
              価格
            </span>
            <span style={{ width: 200, fontSize: 12, fontWeight: 600, color: adminColors.textSecondary, letterSpacing: 0.4 }}>
              在庫 / 販売
            </span>
            <span style={{ width: 80, fontSize: 12, fontWeight: 600, color: adminColors.textSecondary, letterSpacing: 0.4, textAlign: 'right' }}>
              操作
            </span>
          </div>

          {/* テーブル本体 */}
          <div className="min-h-0 flex-1 overflow-y-auto">
            {visible.map((item) => (
              <div
                key={item.id}
                className="flex items-center px-4 py-3"
                style={{ borderBottom: `1px solid ${adminColors.border}` }}
              >
                <div className="flex flex-1 items-center gap-3">
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="h-11 w-11 shrink-0 rounded-lg object-cover"
                    style={{ border: `1px solid ${adminColors.border}` }}
                  />
                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 truncate" style={{ fontSize: 14, fontWeight: 600, color: adminColors.textPrimary }}>
                      {item.name}
                      {item.recommended && <Star size={13} color="#FB8C00" fill="#FB8C00" />}
                      {item.suspended ? (
                        <span className="rounded-full px-2 py-0.5" style={{ backgroundColor: '#fef2f2', color: '#dc2626', fontSize: 11, fontWeight: 700 }}>販売停止</span>
                      ) : item.sold_out ? (
                        <span className="rounded-full px-2 py-0.5" style={{ backgroundColor: '#fef2f2', color: '#dc2626', fontSize: 11, fontWeight: 700 }}>売り切れ</span>
                      ) : null}
                    </p>
                    <p className="truncate" style={{ fontSize: 12, color: adminColors.textSecondary }}>
                      {item.calories} kcal ・ サイズ {item.sizes.length} 種
                    </p>
                  </div>
                </div>

                <div style={{ width: 110 }}>
                  <span
                    className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5"
                    style={{ backgroundColor: '#f5f5f5', color: adminColors.textPrimary, border: `1px solid ${adminColors.border}`, fontSize: 12, fontWeight: 600 }}
                  >
                    {categoryEmoji(item.category)} {categoryLabel(item.category)}
                  </span>
                </div>

                <div style={{ width: 90, textAlign: 'right', fontSize: 14, fontWeight: 700, color: adminColors.textPrimary }}>
                  ¥{item.base_price}
                </div>

                {/* 在庫 / 販売 のクイック操作（ADR-0011） */}
                <div className="flex items-center gap-2" style={{ width: 200 }}>
                  {item.stock === null ? (
                    <span style={{ fontSize: 12, color: adminColors.textSecondary }}>無制限</span>
                  ) : (
                    <div className="flex items-center rounded-md" style={{ border: `1px solid ${adminColors.border}` }}>
                      <button
                        type="button"
                        onClick={() => setStock(item, Math.max(0, (item.stock ?? 0) - 1))}
                        disabled={(item.stock ?? 0) <= 0}
                        title="在庫を1減らす"
                        className="flex h-7 w-7 items-center justify-center disabled:opacity-40"
                      >
                        <Minus size={13} color={adminColors.textPrimary} />
                      </button>
                      <span className="flex h-7 min-w-9 items-center justify-center px-1" style={{ fontSize: 13, fontWeight: 700, color: item.sold_out ? '#dc2626' : adminColors.textPrimary, borderLeft: `1px solid ${adminColors.border}`, borderRight: `1px solid ${adminColors.border}` }}>
                        {item.stock}
                      </span>
                      <button
                        type="button"
                        onClick={() => setStock(item, (item.stock ?? 0) + 1)}
                        title="在庫を1補充する"
                        className="flex h-7 w-7 items-center justify-center"
                      >
                        <Plus size={13} color={adminColors.textPrimary} />
                      </button>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => toggleSuspended(item)}
                    title={item.suspended ? '販売を再開する' : '販売を停止する'}
                    className="rounded-md px-2 py-1"
                    style={{ border: `1px solid ${adminColors.border}`, fontSize: 11, fontWeight: 600, color: item.suspended ? '#16a34a' : '#dc2626' }}
                  >
                    {item.suspended ? '再開' : '停止'}
                  </button>
                </div>

                <div className="flex items-center justify-end gap-1.5" style={{ width: 80 }}>
                  <Link
                    href={`/admin/menu_items/${item.id}/edit`}
                    title="編集"
                    className="flex h-7 w-7 items-center justify-center rounded-md"
                    style={{ border: `1px solid ${adminColors.border}` }}
                  >
                    <Pencil size={14} color={adminColors.textPrimary} />
                  </Link>
                  <button
                    type="button"
                    onClick={() => destroy(item)}
                    title="削除"
                    className="flex h-7 w-7 items-center justify-center rounded-md"
                    style={{ border: `1px solid ${adminColors.border}` }}
                  >
                    <Trash2 size={14} color="#dc2626" />
                  </button>
                </div>
              </div>
            ))}

            {visible.length === 0 && (
              <div className="px-4 py-10 text-center" style={{ fontSize: 14, color: adminColors.textSecondary }}>
                該当する商品がありません
              </div>
            )}
          </div>
        </div>
      </AdminLayout>
    </>
  )
}
