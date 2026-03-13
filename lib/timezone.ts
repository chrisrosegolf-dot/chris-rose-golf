import { toZonedTime, fromZonedTime } from 'date-fns-tz'
import { format } from 'date-fns'

export const TZ = 'Australia/Sydney'

export function toSydney(date: Date): Date {
  return toZonedTime(date, TZ)
}

export function fromSydney(date: Date): Date {
  return fromZonedTime(date, TZ)
}

export function formatSydney(date: Date, fmt: string): string {
  return format(toZonedTime(date, TZ), fmt)
}
