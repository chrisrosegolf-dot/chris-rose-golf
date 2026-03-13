import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { addMinutes } from 'date-fns'
import { sendBookingConfirmation, sendLowCreditAlert } from '@/lib/email'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { startTime, paymentType, sessionPassId } = await req.json()
  const userId = (session.user as any).id
  const start = new Date(startTime)
  const end = addMinutes(start, 60)

  const conflict = await prisma.booking.findFirst({
    where: {
      status: { not: 'CANCELLED' },
      OR: [
        { startTime: { gte: start, lt: end } },
        { endTime: { gt: start, lte: end } },
        { startTime: { lte: start }, endTime: { gte: end } },
      ],
    },
  })

  if (conflict) return NextResponse.json({ error: 'Slot no longer available' }, { status: 409 })

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  if (paymentType === 'CREDIT') {
    const pass = await prisma.sessionPass.findFirst({
      where: { id: sessionPassId, userId, remainingCredits: { gt: 0 }, expiresAt: { gt: new Date() } },
    })
    if (!pass) return NextResponse.json({ error: 'No valid session pass' }, { status: 400 })

    await prisma.$transaction(async (tx) => {
      await tx.booking.create({
        data: { userId, startTime: start, endTime: end, paymentType: 'CREDIT', sessionPassId: pass.id, status: 'CONFIRMED' },
      })
      await tx.sessionPass.update({
        where: { id: pass.id },
        data: { remainingCredits: { decrement: 1 } },
      })
    })

    await sendBookingConfirmation({ to: user.email, name: user.name, startTime: start, paymentType: 'CREDIT' })

    const updated = await prisma.sessionPass.findUnique({ where: { id: pass.id } })
    if (updated && updated.remainingCredits === 1) {
      await sendLowCreditAlert({ to: user.email, name: user.name, expiresAt: updated.expiresAt })
    }

    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Invalid payment type' }, { status: 400 })
}
