'use client'

import { useState } from 'react'
import { toast } from 'sonner'

interface Props {
  sessions: number
  price: number
  passType: string
  featured?: boolean
}

export function PassCard({ sessions, price, passType, featured }: Props) {
  const [loading, setLoading] = useState(false)
  const perSession = (price / sessions).toFixed(0)

  async function handlePurchase() {
    setLoading(true)
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'pass', passType }),
    })
    const data = await res.json()
    if (data.url) {
      window.location.href = data.url
    } else {
      toast.error('Failed to start checkout')
      setLoading(false)
    }
  }

  return (
    <div className={`rounded-2xl border p-8 ${featured ? 'border-emerald-700 bg-emerald-700 text-white' : 'border-stone-200 bg-white'}`}>
      <p className={`text-sm font-medium uppercase tracking-wide ${featured ? 'text-emerald-200' : 'text-stone-400'}`}>
        {sessions}-Session Pass
      </p>
      <p className={`mt-4 text-4xl font-semibold ${featured ? 'text-white' : 'text-stone-900'}`}>
        ${price.toLocaleString()}
      </p>
      <p className={`mt-1 text-sm ${featured ? 'text-emerald-200' : 'text-stone-400'}`}>
        ${perSession} per session
      </p>
      <ul className={`mt-6 space-y-2 text-sm ${featured ? 'text-emerald-100' : 'text-stone-600'}`}>
        <li>&#10003; {sessions} coaching sessions</li>
        <li>&#10003; Valid for 6 months</li>
        <li>&#10003; Free 24hr cancellation</li>
        <li>&#10003; Darlinghurst Studio</li>
      </ul>
      <button
        onClick={handlePurchase}
        disabled={loading}
        className={`mt-8 w-full rounded-lg py-3 text-sm font-medium transition disabled:opacity-60
          ${featured ? 'bg-white text-emerald-700 hover:bg-emerald-50' : 'bg-emerald-700 text-white hover:bg-emerald-800'}
        `}
      >
        {loading ? 'Redirecting...' : `Buy ${sessions}-Session Pass`}
      </button>
    </div>
  )
}
