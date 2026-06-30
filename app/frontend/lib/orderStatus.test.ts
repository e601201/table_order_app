import { expect, test } from 'vitest'
import { inStoreOrderStatusMeta } from './orderStatus'

// In-store 注文状況（ADR-0012）の調理軸ラベル選択。サーバが unavailable（= Closed かつ
// 未 Served を畳んだ二値）と調理 status だけを送り、会計軸は来ない前提の純関数。

test('進行中の調理ラベルをそのまま返す（受付 / 提供済み）', () => {
  expect(inStoreOrderStatusMeta({ status: 'pending', unavailable: false }).label).toBe('受付')
  expect(inStoreOrderStatusMeta({ status: 'in_progress', unavailable: false }).label).toBe('調理中')
  expect(inStoreOrderStatusMeta({ status: 'ready', unavailable: false }).label).toBe('提供待ち')
  expect(inStoreOrderStatusMeta({ status: 'served', unavailable: false }).label).toBe('提供済み')
})

test('walkout（提供済みで打ち切り）は「提供済み」のまま（嘘をつかない）', () => {
  // サーバが unavailable:false / status:served に畳む。会計軸（キャンセル）は描かない。
  expect(inStoreOrderStatusMeta({ status: 'served', unavailable: false }).label).toBe('提供済み')
})

test('提供前クローズ（unavailable）は中立文言に差し替える', () => {
  expect(inStoreOrderStatusMeta({ status: 'pending', unavailable: true }).label).toBe(
    'ご用意できませんでした',
  )
  expect(inStoreOrderStatusMeta({ status: 'ready', unavailable: true }).label).toBe(
    'ご用意できませんでした',
  )
})
