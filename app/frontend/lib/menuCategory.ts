// カテゴリの表示ラベルと絵文字。CONTEXT.md のカテゴリ slug（burgers / sides / drinks / kids）に対応。
export const categoryMeta: Record<string, { label: string; emoji: string }> = {
  burgers: { label: 'バーガー', emoji: '🍔' },
  sides: { label: 'サイド', emoji: '🍟' },
  drinks: { label: 'ドリンク', emoji: '🥤' },
  kids: { label: 'キッズ', emoji: '🧒' },
}

// 顧客 Home のタブ表示順。CATEGORIES（バックエンド）の slug と対応。
export const orderedCategories = ['burgers', 'sides', 'drinks', 'kids']

export function categoryLabel(category: string): string {
  return categoryMeta[category]?.label ?? category
}

export function categoryEmoji(category: string): string {
  return categoryMeta[category]?.emoji ?? '🍴'
}
