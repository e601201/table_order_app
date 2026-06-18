import { expect, test } from 'vitest'
import type { AdminOrderRow } from '@/types'
import { type OrderFilters, filterOrders } from './orderFilters'

// テスト用の AdminOrderRow ビルダ。各テストは関心のあるフィールドだけ上書きする。
function row(overrides: Partial<AdminOrderRow> = {}): AdminOrderRow {
  return {
    id: 1,
    order_number: '20260618-001',
    table_number: 1,
    order_type: 'in_store',
    status: 'pending',
    payment_status: 'unpaid',
    closure_reason: null,
    total: 1000,
    placed_at: '2026-06-18T10:00:00+09:00',
    item_count: 1,
    items_summary: 'バーガー',
    ...overrides,
  }
}

// 何も絞らない既定のフィルタ状態。各テストは検証する軸だけ上書きする。
function filters(overrides: Partial<OrderFilters> = {}): OrderFilters {
  return { query: '', kitchen: 'all', payment: 'all', orderType: 'all', ...overrides }
}

test('種別=takeout: 店内行が除外されテイクアウト行だけ残る', () => {
  const inStore = row({ id: 1, order_type: 'in_store' })
  const takeout = row({ id: 2, order_type: 'takeout', table_number: null })

  const result = filterOrders([inStore, takeout], filters({ orderType: 'takeout' }))

  expect(result).toEqual([takeout])
})

test('調理=in_progress: その調理ステータスの行だけ残る', () => {
  const pending = row({ id: 1, status: 'pending' })
  const cooking = row({ id: 2, status: 'in_progress' })

  const result = filterOrders([pending, cooking], filters({ kitchen: 'in_progress' }))

  expect(result).toEqual([cooking])
})

test('支払い=paid: その支払いステータスの行だけ残る', () => {
  const unpaid = row({ id: 1, payment_status: 'unpaid' })
  const paid = row({ id: 2, payment_status: 'paid' })

  const result = filterOrders([unpaid, paid], filters({ payment: 'paid' }))

  expect(result).toEqual([paid])
})

test('検索: order_number の部分一致（前後空白を除去し大文字小文字を無視）', () => {
  const a = row({ id: 1, order_number: '20260618-001' })
  const b = row({ id: 2, order_number: '20260618-0AB' })

  // 前後空白あり・小文字で投げても、末尾の大文字を含む番号に当たる
  const result = filterOrders([a, b], filters({ query: '  0ab ' }))

  expect(result).toEqual([b])
})

test('複数軸は AND: 種別=takeout かつ 支払い=paid の両方を満たす行だけ残る', () => {
  const takeoutPaid = row({ id: 1, order_type: 'takeout', table_number: null, payment_status: 'paid' })
  const takeoutUnpaid = row({ id: 2, order_type: 'takeout', table_number: null, payment_status: 'unpaid' })
  const inStorePaid = row({ id: 3, order_type: 'in_store', payment_status: 'paid' })

  const result = filterOrders(
    [takeoutPaid, takeoutUnpaid, inStorePaid],
    filters({ orderType: 'takeout', payment: 'paid' }),
  )

  expect(result).toEqual([takeoutPaid])
})

test('既定（すべて all・検索空）: 全行をそのまま返す', () => {
  const rows = [row({ id: 1, order_type: 'in_store' }), row({ id: 2, order_type: 'takeout', table_number: null })]

  expect(filterOrders(rows, filters())).toEqual(rows)
})
