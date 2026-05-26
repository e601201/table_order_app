import { Head, useForm } from '@inertiajs/react'
import { LogIn } from 'lucide-react'
import FlashMessage from '@/components/FlashMessage'

export default function Login() {
  const { data, setData, post, processing, errors, reset } = useForm({
    login_id: '',
    password: '',
  })

  function submit(e: React.FormEvent) {
    e.preventDefault()
    post('/login', {
      onFinish: () => reset('password'),
    })
  }

  return (
    <>
      <Head title="ログイン" />
      <FlashMessage />
      <div
        className="min-h-screen flex flex-col items-center justify-center px-6 py-10"
        style={{ backgroundColor: '#FFF8F0', fontFamily: 'Outfit, sans-serif' }}
      >
        <div className="w-full max-w-[390px]">
          <div className="flex flex-col items-center mb-8">
            <div
              className="flex items-center justify-center w-14 h-14 rounded-full mb-4"
              style={{ backgroundColor: '#E53935' }}
            >
              <LogIn size={26} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">スタッフログイン</h1>
            <p className="text-sm text-gray-500 mt-1">キッチン・レジ・管理者用</p>
          </div>

          <form onSubmit={submit} className="flex flex-col gap-4">
            <div>
              <label htmlFor="login_id" className="block text-sm font-medium text-gray-700 mb-1">
                ログイン名
              </label>
              <input
                id="login_id"
                type="text"
                autoComplete="username"
                autoFocus
                value={data.login_id}
                onChange={(e) => setData('login_id', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 focus:border-[#E53935] focus:outline-none focus:ring-1 focus:ring-[#E53935]"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                パスワード
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={data.password}
                onChange={(e) => setData('password', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 focus:border-[#E53935] focus:outline-none focus:ring-1 focus:ring-[#E53935]"
              />
              {errors.login_id && (
                <p className="mt-2 text-sm text-[#E53935]">
                  {Array.isArray(errors.login_id) ? errors.login_id.join(' / ') : errors.login_id}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={processing}
              className="mt-2 w-full rounded-lg px-4 py-3 font-medium text-white shadow-sm transition hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: '#E53935' }}
            >
              {processing ? 'ログイン中…' : 'ログイン'}
            </button>
          </form>
        </div>
      </div>
    </>
  )
}
