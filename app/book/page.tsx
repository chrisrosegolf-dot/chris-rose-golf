import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { Navbar } from '@/components/Navbar'
import { BookingCalendar } from '@/components/BookingCalendar'

export default async function BookPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/')

  const userId = (session.user as any).id
  const now = new Date()

  const [activePass, availability] = await Promise.all([
    prisma.sessionPass.findFirst({
      where: { userId, expiresAt: { gt: now }, remainingCredits: { gt: 0 } },
      orderBy: { expiresAt: 'asc' },
    }),
    prisma.availability.findMany({ where: { isActive: true } }),
  ])

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar />
      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-stone-900">Book a Session</h1>
          <p className="mt-1 text-sm text-stone-500">
            Sessions are 60 minutes. Free cancellation up to 24 hours before your session.
          </p>
        </div>
        <BookingCalendar
          activePass={activePass ? {
            id: activePass.id,
            remainingCredits: activePass.remainingCredits,
            expiresAt: activePass.expiresAt.toISOString(),
          } : null}
          availability={availability}
        />
      </main>
    </div>
  )
}
