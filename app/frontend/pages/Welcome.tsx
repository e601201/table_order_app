import { Head, Link} from '@inertiajs/react'

interface WelcomeProps {
  app_name: string
}

export default function Welcome({ app_name }: WelcomeProps) {
  return (
    <>
      <Head title="Welcome" />
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            ようこそ
          </h1>
          <Link href="/order" className="text-lg text-blue-500">
            {app_name}
          </Link>
        </div>
      </div>
    </>
  )
}
