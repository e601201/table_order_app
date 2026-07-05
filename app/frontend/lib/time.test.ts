import { afterEach, expect, test, vi } from 'vitest'
import {
  formatDateTimeJST,
  formatMonthDayTimeJST,
  formatTimeJST,
  formatTimeWithSecondsJST,
} from './time'

// 時刻表示は端末 TZ に依存せず JST（Asia/Tokyo）固定（CONTEXT.md「本日 = JST」）。
// オフセット付き ISO 文字列で桁埋め・区切りの形式を、UTC 時刻で +9 時間のずれを検証する。

afterEach(() => {
  vi.unstubAllEnvs()
})

test('HH:MM — 時分を2桁ゼロ埋めで整形する', () => {
  expect(formatTimeJST('2026-07-05T09:05:07+09:00')).toBe('09:05')
  expect(formatTimeJST('2026-07-05T23:59:59+09:00')).toBe('23:59')
  // 深夜0時台は 24:xx ではなく 00:xx（h23）
  expect(formatTimeJST('2026-07-05T00:03:09+09:00')).toBe('00:03')
})

test('HH:MM:SS — 秒まで2桁ゼロ埋めで整形する', () => {
  expect(formatTimeWithSecondsJST('2026-07-05T09:05:07+09:00')).toBe('09:05:07')
  expect(formatTimeWithSecondsJST('2026-07-05T00:03:09+09:00')).toBe('00:03:09')
})

test('M/D HH:MM — 月日は非ゼロ埋め・時分は2桁ゼロ埋め', () => {
  expect(formatMonthDayTimeJST('2026-07-05T09:05:07+09:00')).toBe('7/5 09:05')
  expect(formatMonthDayTimeJST('2026-12-31T23:59:00+09:00')).toBe('12/31 23:59')
})

test('YYYY年M月D日 HH:MM — 支払い日時の整形', () => {
  expect(formatDateTimeJST('2026-07-05T09:05:07+09:00')).toBe('2026年7月5日 09:05')
})

test('壁時計ラベル用に Date も受けられる', () => {
  expect(formatTimeJST(new Date('2026-07-05T09:05:07+09:00'))).toBe('09:05')
})

test('端末 TZ が JST 以外（UTC）でも JST で整形される', () => {
  // Node は環境変数 TZ の変更をローカル時刻の解決に反映する。UTC 端末を再現し、
  // ローカル時刻（15:30）ではなく JST の壁時計時刻（翌日 00:30）で描画されることを確認する。
  vi.stubEnv('TZ', 'UTC')
  const utc = new Date('2026-07-05T15:30:00Z')
  expect(utc.getHours()).toBe(15) // 前提確認: 端末は UTC で動いている
  expect(formatTimeJST(utc)).toBe('00:30')
  expect(formatTimeJST('2026-07-05T15:30:00Z')).toBe('00:30')
  expect(formatTimeWithSecondsJST('2026-07-05T15:30:45Z')).toBe('00:30:45')
  expect(formatMonthDayTimeJST('2026-07-05T15:30:00Z')).toBe('7/6 00:30') // 日付も JST で繰り上がる
  expect(formatDateTimeJST('2026-12-31T15:30:00Z')).toBe('2027年1月1日 00:30') // 年またぎも JST
})
