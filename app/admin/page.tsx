import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { Navbar } from '@/components/Navbar'
import { AdminTabs } from '@/components/AdminTabs'

export default async function AdminPage() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'ADMIN') redirect('/dashboard')

  const [availability, bookings, clients, blockedSlots] = await Promise.all([
    prisma.availability.findMany({ orderBy: { dayOfWeek: 'asc' } }),
    prisma.booking.findMany({
      include: { user: true },
      orderBy: { startTime: 'desc' },
      take: 100,
    }),
    prisma.user.findMany({
      where: { role: 'CLIENT' },
      include: {
        sessionPasses: {
          where: { expiresAt: { gt: new Date() }, remainingCredits: { gt: 0 } },
          orderBy: { expiresAt: 'asc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.blockedSlot.findMany({ orderBy: { startTime: 'asc' } }),
  ])

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar />
      <main className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="mb-8 text-2xl font-semibold text-stone-900">Admin Dashboard</h1>
        <AdminTabs
          availability={availability}
          bookings={bookings.map((b) => ({
            id: b.id,
            startTime: b.startTime.toISOString(),
            endTime: b.endTime.toISOString(),
            status: b.status,
            paymentType: b.paymentType,
            createdAt: b.createdAt.toISOString(),
            cancelledAt: b.cancelledAt?.toISOString() ?? null,
            user: { name: b.user.name, email: b.user.email },
          }))}
          clients={clients.map((c) => ({
            id: c.id,
            name: c.name,
            email: c.email,
            phone: c.phone,
            activePass: c.sessionPasses[0] ? {
              remainingCredits: c.sessionPasses[0].remainingCredits,
              expiresAt: c.sessionPasses[0].expiresAt.toISOString(),
            } : null,
          }))}
          blockedSlots={blockedSlots.map((b) => ({
            id: b.id,
            startTime: b.startTime.toISOString(),
            endTime: b.endTime.toISOString(),
            reason: b.reason,
          }))}
        />
      </main>
    </div>
  )
}
