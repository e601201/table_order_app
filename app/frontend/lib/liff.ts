import liff from '@line/liff'

// LIFF は1セッションにつき1回しか init できない。複数コンポーネント（LineLogin /
// CartReview）から呼ばれても二重 init しないよう Promise をキャッシュする。
let initPromise: Promise<void> | null = null

export function initLiff(liffId: string): Promise<void> {
  if (!initPromise) {
    initPromise = liff.init({ liffId })
  }
  return initPromise
}

export { liff }
