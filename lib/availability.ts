import { prisma } from '@/lib/db'
import { fromZonedTime, toZonedTime } from 'date-fns-tz'
import { addMinutes } from 'date-fns'

const TZ = 'Australia/Sydney'

export async function getAvailableSlots(date: Date): Promise<Date[]> {
  const sydneyDate = toZonedTime(date, TZ)
  const dayOfWeek = sydneyDate.getDay()

  const availability = await prisma.availability.findFirst({
    where: { dayOfWeek, isActive: true },
  })

  if (!availability) return []

  const [startHour, startMin] = availability.startTime.split(':').map(Number)
  const [endHour, endMin] = availability.endTime.split(':').map(Number)

  const slots: Date[] = []
  const dayStart = new Date(sydneyDate)
  dayStart.setHours(startHour, startMin, 0, 0)
  const dayEnd = new Date(sydneyDate)
  dayEnd.setHours(endHour, endMin, 0, 0)

  let current = new Date(dayStart)
  while (current < dayEnd) {
    const slotEnd = addMinutes(current, 60)
    if (slotEnd <= dayEnd) {
      slots.push(fromZonedTime(current, TZ))
    }
    current = addMinutes(current, 60)
  }

  // Build day boundaries in UTC for querying
  const dayStartUtc = fromZonedTime(new Date(sydneyDate).setHours(0, 0, 0, 0) as unknown as Date, TZ)
  const dayEndUtc = fromZonedTime(new Date(sydneyDate).setHours(23, 59, 59, 999) as unknown as Date, TZ)

  const [bookings, blockedSlots] = await Promise.all([
    prisma.booking.findMany({
      where: {
        startTime: { gte: new Date(fromZonedTime(new Date(new Date(sydneyDate).setHours(0,0,0,0)), TZ)) },
        endTime: { lte: new Date(fromZonedTime(new Date(new Date(sydneyDate).setHours(23,59,59,999)), TZ)) },
        status: { not: 'CANCELLED' },
      },
    }),
    prisma.blockedSlot.findMany({
      where: {
        startTime: { gte: new Date(fromZonedTime(new Date(new Date(sydneyDate).setHours(0,0,0,0)), TZ)) },
        endTime: { lte: new Date(fromZonedTime(new Date(new Date(sydneyDate).setHours(23,59,59,999)), TZ)) },
      },
    }),
  ])

  const occupied = [
    ...bookings.map((b) => ({ start: b.startTime, end: b.endTime })),
    ...blockedSlots.map((b) => ({ start: b.startTime, end: b.endTime })),
  ]

  return slots.filter((slot) => {
    const slotEnd = addMinutes(slot, 60)
    return !occupied.some((o) => slot < o.end && slotEnd > o.start)
  })
}
