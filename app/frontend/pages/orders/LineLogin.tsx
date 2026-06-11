import { Head, usePage, router } from '@inertiajs/react'
import { useCallback, useEffect, useState } from 'react'
import { MessageCircle } from 'lucide-react'
import { initLiff, liff } from '@/lib/liff'
import type { SharedProps } from '@/types'

interface LineLoginProps {
  liff_id: string | null
  logged_in: boolean
  entry_path: string
}

// ログイン済み再訪の入場を liff.init の完了待ちで足止めしない上限。init は通常1秒前後で
// 終わる。settle しない回線ではこれを超えたら入場し、init は裏で続行させる
// （成功すれば checkout でトークンが取れる。旧実装の 302 は即入場だったので、その劣化を防ぐ）
const LOGGED_IN_ENTRY_TIMEOUT_MS = 5000

// テイクアウト面のログイン誘導ページ（ADR-0008）。LIFF 内で開かれていれば
// liff.init → liff.login →（リダイレクト復帰後）ID トークンをサーバーへ POST して
// セッションを確立し、元のページへ自動で戻る。客に見える摩擦は原則ない。
//
// ログイン済み（再訪）でもサーバーは 302 せずこのページを描画する（イシュー #35）。
// エンドポイント URL 上で liff.init を済ませてから入場しないと、注文確定時に
// エンドポイント階層外で初 init が走り LINE が 400 を返すため。
export default function LineLogin({ liff_id, logged_in, entry_path }: LineLoginProps) {
  const { flash } = usePage<SharedProps>().props
  const [error, setError] = useState<string | null>(null)

  const startLogin = useCallback(() => {
    // 入場。router.visit で同一 SPA コンテキストを保つ（initLiff のキャッシュが
    // checkout まで生きる）。replace で誘導ページを履歴に残さない。
    // タイムアウトと init 完了の両方から呼ばれうるため一度きりに guard する
    let entered = false
    const enter = () => {
      if (entered) return
      entered = true
      router.visit(entry_path, { replace: true })
    }

    if (logged_in) {
      // ログイン済み再訪: Rails セッションがあるので ID トークンの再 POST は不要。
      // エンドポイント URL 上で init を済ませてから入場するが、入場自体は init の成否に
      // 依存させない — 失敗時は通知なしの劣化動作で続行する（checkout 側は
      // getLiffAccessToken が失敗済みコンテキストで再 init しないため 400 にならない）
      if (!liff_id) {
        enter()
        return
      }
      const timer = window.setTimeout(enter, LOGGED_IN_ENTRY_TIMEOUT_MS)
      initLiff(liff_id)
        .catch(() => {
          // 外部ブラウザ等で init できなくても入場は止めない
        })
        .finally(() => {
          window.clearTimeout(timer)
          enter()
        })
      return
    }

    if (!liff_id) {
      setError('LINE ミニアプリの設定が見つかりません。LINE のテイクアウト用リンクから開き直してください。')
      return
    }
    setError(null)
    initLiff(liff_id)
      .then(() => {
        if (!liff.isLoggedIn()) {
          // LINE のログイン画面へ。完了後この URL に戻ってくる
          liff.login({ redirectUri: window.location.href })
          return
        }
        const idToken = liff.getIDToken()
        if (!idToken) {
          setError('LINE のログイン情報を取得できませんでした。開き直してください。')
          return
        }
        router.post('/order/line_login', { id_token: idToken })
      })
      .catch(() => {
        setError('LINE ログインを開始できませんでした。LINE アプリ内から開き直してください。')
      })
  }, [liff_id, logged_in, entry_path])

  useEffect(() => {
    // サーバー側の検証失敗で戻されたとき（flash.alert あり）に自動再試行すると
    // 「POST → 失敗 → 誘導ページ → 自動 POST」の無限ループになるため、手動再試行に切り替える
    if (flash.alert) return
    startLogin()
  }, [startLogin, flash.alert])

  const message = error ?? flash.alert ?? null

  return (
    <>
      <Head title="LINE ログイン" />
      <div
        className="relative mx-auto max-w-[390px] min-h-screen bg-[#FFF8F0] flex flex-col items-center justify-center px-6"
        style={{ fontFamily: 'Outfit, sans-serif' }}
      >
        <div className="flex flex-col items-center gap-3 w-full">
          <div className="flex items-center justify-center w-[72px] h-[72px] rounded-full bg-[#06C755]">
            <MessageCircle className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-xl font-bold text-[#1A1210] text-center">LINE でログイン</h1>
          <p className="text-[13px] text-[#6D5D4B] text-center leading-relaxed">
            テイクアウトのご注文には LINE ログインが必要です。
            できあがりのお知らせと注文履歴の確認にお使いします。
          </p>

          {message ? (
            <div className="flex flex-col items-center gap-3 w-full mt-2">
              <p className="text-[13px] text-[#E53935] text-center">{message}</p>
              <button
                onClick={startLogin}
                className="flex items-center justify-center w-full h-12 rounded-2xl bg-[#06C755] text-base font-bold text-white shadow-[0_4px_16px_rgba(6,199,85,0.35)]"
              >
                もう一度ログインする
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 mt-2">
              <span className="w-2 h-2 rounded-full bg-[#06C755] animate-pulse" />
              <span className="text-[13px] text-[#9E8E7E]">LINE に接続しています…</span>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
