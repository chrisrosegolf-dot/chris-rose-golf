import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Navbar } from '@/components/Navbar'
import { PassCard } from '@/components/PassCard'

export default async function PassesPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/')

  const sixPrice = parseInt(process.env.SIX_PASS_PRICE || '135000') / 100
  const twelvePrice = parseInt(process.env.TWELVE_PASS_PRICE || '240000') / 100

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar />
      <main className="mx-auto max-w-3xl px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-stone-900">Session Passes</h1>
          <p className="mt-1 text-sm text-stone-500">Save when you book in bulk. All passes valid for 6 months.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <PassCard sessions={6} price={sixPrice} passType="6" />
          <PassCard sessions={12} price={twelvePrice} passType="12" featured />
        </div>
      </main>
    </div>
  )
}
