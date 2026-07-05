// 時刻表示の共有ユーティリティ。CONTEXT.md は「本日 = JST」と定義しており（単一店舗・
// 日本国内前提）、端末のタイムゾーン設定に左右されないよう Intl の timeZone を
// Asia/Tokyo に固定する。サーバ由来の ISO 文字列（placed_at / paid_at）と
// Date（壁時計ラベルの new Date()）の両方を受ける。
type TimeInput = string | Date

const JST = 'Asia/Tokyo'

function toDate(input: TimeInput): Date {
  return typeof input === 'string' ? new Date(input) : input
}

// Intl.DateTimeFormat の生成はコストがあるため、モジュールロード時に1度だけ作って使い回す。
const timeFormat = new Intl.DateTimeFormat('ja-JP', {
  timeZone: JST,
  hour: '2-digit',
  minute: '2-digit',
})

const timeWithSecondsFormat = new Intl.DateTimeFormat('ja-JP', {
  timeZone: JST,
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
})

const monthDayTimeFormat = new Intl.DateTimeFormat('ja-JP', {
  timeZone: JST,
  month: 'numeric',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

const dateTimeFormat = new Intl.DateTimeFormat('ja-JP', {
  timeZone: JST,
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

// HH:MM（2桁ゼロ埋め）。受注時刻・スタッフ面ヘッダーの壁時計など、大半のサーフェスで使う。
export function formatTimeJST(input: TimeInput): string {
  return timeFormat.format(toDate(input))
}

// HH:MM:SS（2桁ゼロ埋め）。レジダッシュボードの受注時刻。
export function formatTimeWithSecondsJST(input: TimeInput): string {
  return timeWithSecondsFormat.format(toDate(input))
}

// M/D HH:MM（月日は非ゼロ埋め）。注文履歴など日をまたぐ一覧で使う。
export function formatMonthDayTimeJST(input: TimeInput): string {
  return monthDayTimeFormat.format(toDate(input))
}

// YYYY年M月D日 HH:MM。支払い完了画面の支払い日時。
export function formatDateTimeJST(input: TimeInput): string {
  return dateTimeFormat.format(toDate(input))
}
