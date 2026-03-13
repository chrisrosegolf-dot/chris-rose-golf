import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sendSessionReminder } from '@/lib/email'
import { addHours } from 'date-fns'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  if (searchParams.get('secret') !== process.env.NEXTAUTH_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const in24h = addHours(now, 24)
  const in25h = addHours(now, 25)

  const bookings = await prisma.booking.findMany({
    where: {
      startTime: { gte: in24h, lt: in25h },
      status: 'CONFIRMED',
    },
    include: { user: true },
  })

  for (const booking of bookings) {
    await sendSessionReminder({
      to: booking.user.email,
      name: booking.user.name,
      startTime: booking.startTime,
    })
  }

  return NextResponse.json({ sent: bookings.length })
}
