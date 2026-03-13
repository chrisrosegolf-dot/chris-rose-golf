import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { Navbar } from '@/components/Navbar'
import Link from 'next/link'
import { formatSydney } from '@/lib/timezone'
import { CancelButton } from '@/components/CancelButton'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/')

  const userId = (session.user as any).id
  const now = new Date()

  const [upcomingBookings, pastBookings, activePasses, expiredPasses] = await Promise.all([
    prisma.booking.findMany({
      where: { userId, startTime: { gte: now }, status: 'CONFIRMED' },
      orderBy: { startTime: 'asc' },
    }),
    prisma.booking.findMany({
      where: { userId, startTime: { lt: now } },
      orderBy: { startTime: 'desc' },
      take: 10,
    }),
    prisma.sessionPass.findMany({
      where: { userId, expiresAt: { gt: now }, remainingCredits: { gt: 0 } },
      orderBy: { expiresAt: 'asc' },
    }),
    prisma.sessionPass.findMany({
      where: {
        userId,
        OR: [{ expiresAt: { lte: now } }, { remainingCredits: 0 }],
      },
      orderBy: { purchasedAt: 'desc' },
      take: 3,
    }),
  ])

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar />
      <main className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="mb-8 text-2xl font-semibold text-stone-900">
          Welcome back, {session.user?.name?.split(' ')[0]}
        </h1>

        <div className="mb-8 flex gap-4">
          <Link
            href="/book"
            className="rounded-lg bg-emerald-700 px-6 py-3 text-sm font-medium text-white hover:bg-emerald-800"
          >
            Book a Session
          </Link>
          <Link
            href="/passes"
            className="rounded-lg border border-stone-300 bg-white px-6 py-3 text-sm font-medium text-stone-700 hover:bg-stone-50"
          >
            Buy a Pass
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-stone-200 bg-white p-6">
            <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-stone-400">
              Session Pass
            </h2>
            {activePasses.length > 0 ? (
              <>
                <p className="text-4xl font-semibold text-emerald-700">
                  {activePasses[0].remainingCredits}
                </p>
                <p className="mt-1 text-sm text-stone-500">sessions remaining</p>
                <p className="mt-3 text-xs text-stone-400">
                  Expires {formatSydney(activePasses[0].expiresAt, 'd MMM yyyy')}
                </p>
              </>
            ) : (
              <>
                <p className="text-stone-500">No active pass</p>
                <Link href="/passes" className="mt-3 inline-block text-sm text-emerald-700 hover:underline">
                  Buy a pass →
                </Link>
              </>
            )}
          </div>

          <div className="md:col-span-2 rounded-2xl border border-stone-200 bg-white p-6">
            <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-stone-400">
              Upcoming Sessions
            </h2>
            {upcomingBookings.length === 0 ? (
              <p className="text-stone-500">No upcoming sessions</p>
            ) : (
              <ul className="space-y-3">
                {upcomingBookings.map((b) => (
                  <li key={b.id} className="flex items-center justify-between rounded-lg bg-stone-50 px-4 py-3">
                    <div>
                      <p className="font-medium text-stone-900">
                        {formatSydney(b.startTime, 'EEEE d MMMM')}
                      </p>
                      <p className="text-sm text-stone-500">
                        {formatSydney(b.startTime, 'h:mm a')} — {formatSydney(b.endTime, 'h:mm a')}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <CancelButton bookingId={b.id} startTime={b.startTime} />
                      <Link
                        href="/book"
                        className="text-xs text-stone-500 hover:text-stone-900 border border-stone-200 rounded px-3 py-1.5"
                      >
                        Reschedule
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {pastBookings.length > 0 && (
          <div className="mt-6 rounded-2xl border border-stone-200 bg-white p-6">
            <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-stone-400">
              Past Sessions
            </h2>
            <ul className="space-y-2">
              {pastBookings.map((b) => (
                <li key={b.id} className="flex items-center justify-between py-2 border-b border-stone-100 last:border-0">
                  <p className="text-sm text-stone-700">
                    {formatSydney(b.startTime, 'EEEE d MMMM yyyy, h:mm a')}
                  </p>
                  <span className={`text-xs px-2 py-1 rounded-full ${b.status === 'CANCELLED' ? 'bg-red-50 text-red-600' : 'bg-stone-100 text-stone-500'}`}>
                    {b.status.toLowerCase()}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {expiredPasses.length > 0 && (
          <div className="mt-6 rounded-2xl border border-stone-200 bg-white p-6">
            <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-stone-400">
              Expired Passes
            </h2>
            <ul className="space-y-2">
              {expiredPasses.map((p) => (
                <li key={p.id} className="flex items-center justify-between py-2 border-b border-stone-100 last:border-0">
                  <span className="text-sm text-stone-500">{p.totalCredits}-session pass</span>
                  <span className="text-xs text-red-500">
                    Expired {formatSydney(p.expiresAt, 'd MMM yyyy')}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>
    </div>
  )
}
