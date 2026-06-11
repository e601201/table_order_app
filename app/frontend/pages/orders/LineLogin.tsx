import { Head, usePage, router } from '@inertiajs/react'
import { useCallback, useEffect, useState } from 'react'
import { MessageCircle } from 'lucide-react'
import { initLiff, liff } from '@/lib/liff'
import type { SharedProps } from '@/types'

interface LineLoginProps {
  liff_id: string | null
}

// テイクアウト面のログイン誘導ページ（ADR-0008）。LIFF 内で開かれていれば
// liff.init → liff.login →（リダイレクト復帰後）ID トークンをサーバーへ POST して
// セッションを確立し、元のページへ自動で戻る。客に見える摩擦は原則ない。
export default function LineLogin({ liff_id }: LineLoginProps) {
  const { flash } = usePage<SharedProps>().props
  const [error, setError] = useState<string | null>(null)

  const startLogin = useCallback(() => {
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
  }, [liff_id])

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
