'use client'

import { useState } from 'react'
import { addDays, format, isSameDay } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

const TZ = 'Australia/Sydney'

interface Props {
  activePass: { id: string; remainingCredits: number; expiresAt: string } | null
  availability: { dayOfWeek: number; startTime: string; endTime: string; isActive: boolean }[]
}

export function BookingCalendar({ activePass, availability }: Props) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [slots, setSlots] = useState<string[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [showOptions, setShowOptions] = useState(false)
  const [booking, setBooking] = useState(false)
  const router = useRouter()

  const days = Array.from({ length: 14 }, (_, i) => addDays(new Date(), i + 1))
  const availableDays = new Set(availability.filter((a) => a.isActive).map((a) => a.dayOfWeek))

  async function handleDateSelect(date: Date) {
    setSelectedDate(date)
    setSelectedSlot(null)
    setShowOptions(false)
    setLoadingSlots(true)
    const res = await fetch(`/api/slots?date=${date.toISOString()}`)
    const data = await res.json()
    setSlots(data.slots || [])
    setLoadingSlots(false)
  }

  function handleSlotSelect(slot: string) {
    setSelectedSlot(slot)
    setShowOptions(true)
  }

  async function bookWithCredit() {
    if (!selectedSlot || !activePass) return
    setBooking(true)
    const res = await fetch('/api/bookings/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ startTime: selectedSlot, paymentType: 'CREDIT', sessionPassId: activePass.id }),
    })
    if (res.ok) {
      toast.success('Session booked!')
      router.push('/dashboard')
    } else {
      const err = await res.json()
      toast.error(err.error || 'Booking failed')
    }
    setBooking(false)
  }

  async function bookWithStripe() {
    if (!selectedSlot) return
    setBooking(true)
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'session', startTime: selectedSlot }),
    })
    const data = await res.json()
    if (data.url) {
      window.location.href = data.url
    } else {
      toast.error('Failed to start checkout')
      setBooking(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-stone-200 bg-white p-6">
        <h2 className="mb-4 text-sm font-medium text-stone-500">Select a date</h2>
        <div className="grid grid-cols-7 gap-2">
          {days.map((day) => {
            const sydDay = toZonedTime(day, TZ)
            const isAvailable = availableDays.has(sydDay.getDay())
            const isSelected = selectedDate && isSameDay(day, selectedDate)
            return (
              <button
                key={day.toISOString()}
                onClick={() => isAvailable && handleDateSelect(day)}
                disabled={!isAvailable}
                className={`flex flex-col items-center rounded-xl py-3 text-sm transition
                  ${isSelected ? 'bg-emerald-700 text-white' : ''}
                  ${!isSelected && isAvailable ? 'hover:bg-stone-100 text-stone-900' : ''}
                  ${!isAvailable ? 'opacity-30 cursor-not-allowed text-stone-400' : ''}
                `}
              >
                <span className="text-xs uppercase">{format(sydDay, 'EEE')}</span>
                <span className="mt-1 font-medium">{format(sydDay, 'd')}</span>
              </button>
            )
          })}
        </div>
      </div>

      {selectedDate && (
        <div className="rounded-2xl border border-stone-200 bg-white p-6">
          <h2 className="mb-4 text-sm font-medium text-stone-500">
            Available times — {format(toZonedTime(selectedDate, TZ), 'EEEE d MMMM')}
          </h2>
          {loadingSlots ? (
            <p className="text-stone-400">Loading...</p>
          ) : slots.length === 0 ? (
            <p className="text-stone-400">No available slots for this day</p>
          ) : (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {slots.map((slot) => {
                const sydSlot = toZonedTime(new Date(slot), TZ)
                return (
                  <button
                    key={slot}
                    onClick={() => handleSlotSelect(slot)}
                    className={`rounded-lg border py-3 text-sm font-medium transition
                      ${selectedSlot === slot ? 'border-emerald-700 bg-emerald-700 text-white' : 'border-stone-200 hover:border-emerald-700 text-stone-900'}
                    `}
                  >
                    {format(sydSlot, 'h:mm a')}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      {showOptions && selectedSlot && (
        <div className="rounded-2xl border border-stone-200 bg-white p-6">
          <h2 className="mb-4 text-sm font-medium text-stone-500">Confirm booking</h2>
          <p className="mb-6 text-stone-700">
            {format(toZonedTime(new Date(selectedSlot), TZ), 'EEEE d MMMM, h:mm a')} — 60 min at Darlinghurst Studio
          </p>

          {activePass ? (
            <div className="space-y-3">
              <p className="text-sm text-stone-600">
                Use 1 session credit? You will have{' '}
                <strong>{activePass.remainingCredits - 1}</strong> remaining after this.
              </p>
              <button
                onClick={bookWithCredit}
                disabled={booking}
                className="w-full rounded-lg bg-emerald-700 py-3 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-60"
              >
                {booking ? 'Booking...' : 'Book with session credit'}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-stone-500 mb-4">You don&apos;t have an active session pass.</p>
              <button
                onClick={bookWithStripe}
                disabled={booking}
                className="w-full rounded-lg bg-emerald-700 py-3 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-60"
              >
                {booking ? 'Redirecting...' : 'Pay $250 for this session'}
              </button>
              <button
                onClick={() => router.push('/passes')}
                className="w-full rounded-lg border border-stone-300 py-3 text-sm font-medium text-stone-700 hover:bg-stone-50"
              >
                Buy a session pass instead
              </button>
            </div>
          )}

          <p className="mt-4 text-xs text-stone-400">
            Free cancellation up to 24 hours before your session.
          </p>
        </div>
      )}
    </div>
  )
}
