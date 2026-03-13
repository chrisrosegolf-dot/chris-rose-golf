'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export function AuthForm() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const form = new FormData(e.currentTarget)

    if (mode === 'signup') {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.get('name'),
          email: form.get('email'),
          password: form.get('password'),
          phone: form.get('phone'),
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error || 'Registration failed')
        setLoading(false)
        return
      }
    }

    const result = await signIn('credentials', {
      email: form.get('email'),
      password: form.get('password'),
      redirect: false,
    })

    if (result?.error) {
      toast.error('Invalid email or password')
    } else {
      router.push('/dashboard')
    }
    setLoading(false)
  }

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
      <div className="mb-6 flex rounded-lg bg-stone-100 p-1">
        <button
          onClick={() => setMode('login')}
          className={`flex-1 rounded-md py-2 text-sm font-medium transition ${mode === 'login' ? 'bg-white shadow-sm text-stone-900' : 'text-stone-500'}`}
        >
          Sign in
        </button>
        <button
          onClick={() => setMode('signup')}
          className={`flex-1 rounded-md py-2 text-sm font-medium transition ${mode === 'signup' ? 'bg-white shadow-sm text-stone-900' : 'text-stone-500'}`}
        >
          Create account
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === 'signup' && (
          <>
            <div>
              <label className="mb-1 block text-sm font-medium text-stone-700">Full name</label>
              <input
                name="name"
                type="text"
                required
                className="w-full rounded-lg border border-stone-300 px-4 py-2.5 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-stone-700">Phone (optional)</label>
              <input
                name="phone"
                type="tel"
                className="w-full rounded-lg border border-stone-300 px-4 py-2.5 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              />
            </div>
          </>
        )}
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">Email</label>
          <input
            name="email"
            type="email"
            required
            className="w-full rounded-lg border border-stone-300 px-4 py-2.5 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">Password</label>
          <input
            name="password"
            type="password"
            required
            minLength={8}
            className="w-full rounded-lg border border-stone-300 px-4 py-2.5 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-60"
        >
          {loading ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Create account'}
        </button>
      </form>
    </div>
  )
}
