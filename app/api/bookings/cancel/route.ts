import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { sendCancellationConfirmation } from '@/lib/email'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { bookingId } = await req.json()
  const userId = (session.user as any).id

  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, userId },
    include: { user: true, sessionPass: true },
  })

  if (!booking) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const hoursUntil = (booking.startTime.getTime() - Date.now()) / 3600000
  const canRefund = hoursUntil > 24
  let creditRefunded = false

  await prisma.$transaction(async (tx) => {
    await tx.booking.update({
      where: { id: bookingId },
      data: { status: 'CANCELLED', cancelledAt: new Date() },
    })

    if (canRefund && booking.paymentType === 'CREDIT' && booking.sessionPassId && booking.sessionPass) {
      if (booking.sessionPass.expiresAt > new Date()) {
        await tx.sessionPass.update({
          where: { id: booking.sessionPassId },
          data: { remainingCredits: { increment: 1 } },
        })
        creditRefunded = true
      }
    }
  })

  await sendCancellationConfirmation({
    to: booking.user.email,
    name: booking.user.name,
    startTime: booking.startTime,
    creditRefunded,
  })

  return NextResponse.json({ ok: true, creditRefunded })
}
