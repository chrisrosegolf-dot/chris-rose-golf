'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export function CancelButton({ bookingId, startTime }: { bookingId: string; startTime: Date }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleCancel() {
    if (!confirm('Are you sure you want to cancel this session?')) return
    setLoading(true)
    const res = await fetch('/api/bookings/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId }),
    })
    if (res.ok) {
      toast.success('Session cancelled')
      router.refresh()
    } else {
      toast.error('Failed to cancel')
    }
    setLoading(false)
  }

  return (
    <button
      onClick={handleCancel}
      disabled={loading}
      className="text-xs text-red-500 hover:text-red-700 border border-red-200 rounded px-3 py-1.5 disabled:opacity-50"
    >
      {loading ? '...' : 'Cancel'}
    </button>
  )
}
