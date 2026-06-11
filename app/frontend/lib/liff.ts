import liff from '@line/liff'

// LIFF は1セッションにつき1回しか init できない。複数コンポーネント（LineLogin /
// CartReview）から呼ばれても二重 init しないよう Promise をキャッシュする。
let initPromise: Promise<void> | null = null
let initFailed = false

export function initLiff(liffId: string): Promise<void> {
  if (!initPromise) {
    initPromise = liff
      .init({ liffId })
      .then(() => {
        initFailed = false
      })
      .catch((error: unknown) => {
        // 失敗 Promise を永久キャッシュすると以後の再試行（LineLogin の
        // 「もう一度ログインする」等）が全て即同じ失敗を返すため、破棄して再試行可能にする
        initPromise = null
        initFailed = true
        throw error
      })
  }
  return initPromise
}

// 注文確定を init の settle 待ちで無期限に止めないための上限（LineLogin の入場タイムアウトと
// 同じ思想）。超過時はトークンなしで注文を続行させる
const TOKEN_WAIT_TIMEOUT_MS = 5000

// エンドポイント URL 階層の外（CartReview 等）から LIFF アクセストークンを取る唯一の入口。
// この SPA コンテキストで init が失敗済みなら再 init を開始しない — エンドポイント階層外で
// 初 init が走ると liff.login が redirect_uri 階層外で発火し LINE が 400 を返すため
// （イシュー #35 が直した故障モードの再発防止）。取れないときは null（通知なしの劣化動作）。
export async function getLiffAccessToken(liffId: string): Promise<string | null> {
  if (initFailed) return null
  try {
    return await Promise.race([
      initLiff(liffId).then(() => liff.getAccessToken()),
      new Promise<null>((resolve) => {
        window.setTimeout(() => resolve(null), TOKEN_WAIT_TIMEOUT_MS)
      }),
    ])
  } catch {
    return null
  }
}

export { liff }
