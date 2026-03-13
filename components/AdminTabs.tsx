'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

const TZ = 'Australia/Sydney'
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

interface Props {
  availability: { id: string; dayOfWeek: number; startTime: string; endTime: string; isActive: boolean }[]
  bookings: {
    id: string; startTime: string; endTime: string; status: string; paymentType: string
    user: { name: string; email: string }; cancelledAt: string | null
  }[]
  clients: {
    id: string; name: string; email: string; phone: string | null
    activePass: { remainingCredits: number; expiresAt: string } | null
  }[]
  blockedSlots: { id: string; startTime: string; endTime: string; reason: string | null }[]
}

export function AdminTabs({ availability: initialAvailability, bookings, clients, blockedSlots: initialBlocked }: Props) {
  const [tab, setTab] = useState<'availability' | 'blocked' | 'bookings' | 'clients'>('bookings')
  const [availability, setAvailability] = useState(initialAvailability)
  const [blockedSlots, setBlockedSlots] = useState(initialBlocked)
  const [newBlock, setNewBlock] = useState({ start: '', end: '', reason: '' })
  const router = useRouter()

  const tabs = [
    { key: 'bookings', label: 'Bookings' },
    { key: 'clients', label: 'Clients' },
    { key: 'availability', label: 'Availability' },
    { key: 'blocked', label: 'Block Dates' },
  ] as const

  async function toggleDay(id: string, isActive: boolean) {
    const res = await fetch('/api/admin/availability', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, isActive: !isActive }),
    })
    if (res.ok) {
      setAvailability((prev) => prev.map((a) => a.id === id ? { ...a, isActive: !isActive } : a))
      toast.success('Availability updated')
    }
  }

  async function addBlockedSlot() {
    if (!newBlock.start || !newBlock.end) return toast.error('Please fill start and end times')
    const res = await fetch('/api/admin/blocked-slots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newBlock),
    })
    if (res.ok) {
      toast.success('Slot blocked')
      router.refresh()
    } else {
      toast.error('Failed to block slot')
    }
  }

  async function removeBlockedSlot(id: string) {
    const res = await fetch(`/api/admin/blocked-slots?id=${id}`, { method: 'DELETE' })
    if (res.ok) {
      setBlockedSlots((prev) => prev.filter((b) => b.id !== id))
      toast.success('Block removed')
    }
  }

  async function adjustCredits(clientId: string, delta: number) {
    const res = await fetch('/api/admin/credits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId, delta }),
    })
    if (res.ok) {
      toast.success(delta > 0 ? 'Credit added' : 'Credit removed')
      router.refresh()
    } else {
      toast.error('Failed to adjust credits')
    }
  }

  return (
    <div>
      <div className="mb-6 flex gap-1 rounded-xl bg-stone-100 p-1 w-fit">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${tab === t.key ? 'bg-white shadow-sm text-stone-900' : 'text-stone-500 hover:text-stone-900'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'bookings' && (
        <div className="rounded-2xl border border-stone-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 border-b border-stone-200">
              <tr>
                <th className="text-left px-6 py-3 font-medium text-stone-500">Client</th>
                <th className="text-left px-6 py-3 font-medium text-stone-500">Date &amp; Time</th>
                <th className="text-left px-6 py-3 font-medium text-stone-500">Payment</th>
                <th className="text-left px-6 py-3 font-medium text-stone-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {bookings.map((b) => (
                <tr key={b.id}>
                  <td className="px-6 py-4">
                    <p className="font-medium text-stone-900">{b.user.name}</p>
                    <p className="text-stone-400 text-xs">{b.user.email}</p>
                  </td>
                  <td className="px-6 py-4 text-stone-700">
                    {format(toZonedTime(new Date(b.startTime), TZ), 'EEE d MMM, h:mm a')}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${b.paymentType === 'CREDIT' ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700'}`}>
                      {b.paymentType === 'CREDIT' ? 'Credit' : 'Stripe'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${b.status === 'CANCELLED' ? 'bg-red-50 text-red-600' : b.status === 'CONFIRMED' ? 'bg-emerald-50 text-emerald-700' : 'bg-stone-100 text-stone-500'}`}>
                      {b.status.toLowerCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {bookings.length === 0 && (
            <p className="px-6 py-8 text-center text-stone-400">No bookings yet</p>
          )}
        </div>
      )}

      {tab === 'clients' && (
        <div className="rounded-2xl border border-stone-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 border-b border-stone-200">
              <tr>
                <th className="text-left px-6 py-3 font-medium text-stone-500">Client</th>
                <th className="text-left px-6 py-3 font-medium text-stone-500">Credits</th>
                <th className="text-left px-6 py-3 font-medium text-stone-500">Pass Expiry</th>
                <th className="text-left px-6 py-3 font-medium text-stone-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {clients.map((c) => (
                <tr key={c.id}>
                  <td className="px-6 py-4">
                    <p className="font-medium text-stone-900">{c.name}</p>
                    <p className="text-stone-400 text-xs">{c.email}</p>
                  </td>
                  <td className="px-6 py-4 text-stone-700">
                    {c.activePass ? c.activePass.remainingCredits : '—'}
                  </td>
                  <td className="px-6 py-4 text-stone-500">
                    {c.activePass ? format(toZonedTime(new Date(c.activePass.expiresAt), TZ), 'd MMM yyyy') : '—'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => adjustCredits(c.id, 1)}
                        className="px-3 py-1 text-xs rounded-lg border border-stone-200 hover:bg-stone-50"
                      >
                        + Credit
                      </button>
                      <button
                        onClick={() => adjustCredits(c.id, -1)}
                        className="px-3 py-1 text-xs rounded-lg border border-stone-200 hover:bg-stone-50 text-red-500"
                      >
                        &minus; Credit
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {clients.length === 0 && (
            <p className="px-6 py-8 text-center text-stone-400">No clients yet</p>
          )}
        </div>
      )}

      {tab === 'availability' && (
        <div className="rounded-2xl border border-stone-200 bg-white p-6 space-y-1">
          {DAYS.map((day, i) => {
            const avail = availability.find((a) => a.dayOfWeek === i)
            return (
              <div key={i} className="flex items-center justify-between py-3 border-b border-stone-100 last:border-0">
                <span className="font-medium text-stone-700 w-12">{day}</span>
                {avail ? (
                  <>
                    <span className="text-sm text-stone-500">{avail.startTime} — {avail.endTime}</span>
                    <button
                      onClick={() => toggleDay(avail.id, avail.isActive)}
                      className={`px-3 py-1 rounded-full text-xs font-medium ${avail.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-100 text-stone-400'}`}
                    >
                      {avail.isActive ? 'Active' : 'Off'}
                    </button>
                  </>
                ) : (
                  <span className="text-xs text-stone-300">Not configured</span>
                )}
              </div>
            )
          })}
        </div>
      )}

      {tab === 'blocked' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-stone-200 bg-white p-6">
            <h3 className="mb-4 font-medium text-stone-700">Block a date/time range</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs text-stone-500">Start</label>
                <input
                  type="datetime-local"
                  value={newBlock.start}
                  onChange={(e) => setNewBlock((p) => ({ ...p, start: e.target.value }))}
                  className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-stone-500">End</label>
                <input
                  type="datetime-local"
                  value={newBlock.end}
                  onChange={(e) => setNewBlock((p) => ({ ...p, end: e.target.value }))}
                  className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
                />
              </div>
              <div className="col-span-2">
                <label className="mb-1 block text-xs text-stone-500">Reason (optional)</label>
                <input
                  type="text"
                  value={newBlock.reason}
                  onChange={(e) => setNewBlock((p) => ({ ...p, reason: e.target.value }))}
                  className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
                />
              </div>
            </div>
            <button
              onClick={addBlockedSlot}
              className="mt-4 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800"
            >
              Block this time
            </button>
          </div>

          {blockedSlots.length > 0 && (
            <div className="rounded-2xl border border-stone-200 bg-white overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-stone-50 border-b border-stone-200">
                  <tr>
                    <th className="text-left px-6 py-3 font-medium text-stone-500">Start</th>
                    <th className="text-left px-6 py-3 font-medium text-stone-500">End</th>
                    <th className="text-left px-6 py-3 font-medium text-stone-500">Reason</th>
                    <th className="px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {blockedSlots.map((b) => (
                    <tr key={b.id}>
                      <td className="px-6 py-3 text-stone-700">{format(toZonedTime(new Date(b.startTime), TZ), 'EEE d MMM, h:mm a')}</td>
                      <td className="px-6 py-3 text-stone-700">{format(toZonedTime(new Date(b.endTime), TZ), 'EEE d MMM, h:mm a')}</td>
                      <td className="px-6 py-3 text-stone-500">{b.reason || '—'}</td>
                      <td className="px-6 py-3">
                        <button onClick={() => removeBlockedSlot(b.id)} className="text-xs text-red-500 hover:text-red-700">Remove</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
