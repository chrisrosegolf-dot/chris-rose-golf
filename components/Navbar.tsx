'use client'

import { signOut, useSession } from 'next-auth/react'
import Link from 'next/link'

export function Navbar() {
  const { data: session } = useSession()

  return (
    <nav className="border-b border-stone-200 bg-white px-6 py-4">
      <div className="mx-auto flex max-w-5xl items-center justify-between">
        <Link href="/dashboard" className="text-xl font-semibold tracking-tight text-stone-900">
          Chris Rose Golf
        </Link>
        <div className="flex items-center gap-6">
          <Link href="/book" className="text-sm text-stone-600 hover:text-stone-900">
            Book
          </Link>
          <Link href="/passes" className="text-sm text-stone-600 hover:text-stone-900">
            Passes
          </Link>
          {(session?.user as any)?.role === 'ADMIN' && (
            <Link href="/admin" className="text-sm text-stone-600 hover:text-stone-900">
              Admin
            </Link>
          )}
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="text-sm text-stone-500 hover:text-stone-900"
          >
            Sign out
          </button>
        </div>
      </div>
    </nav>
  )
}
