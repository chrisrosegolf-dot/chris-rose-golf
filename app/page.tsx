import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { AuthForm } from '@/components/AuthForm'

export default async function Home() {
  const session = await getServerSession(authOptions)
  if (session) redirect('/dashboard')

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-stone-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-stone-900">Chris Rose Golf</h1>
          <p className="mt-2 text-stone-500">Book your coaching session</p>
        </div>
        <AuthForm />
      </div>
    </main>
  )
}
