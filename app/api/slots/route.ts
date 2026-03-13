import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getAvailableSlots } from '@/lib/availability'

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const dateStr = searchParams.get('date')
  if (!dateStr) return NextResponse.json({ error: 'Missing date' }, { status: 400 })

  const slots = await getAvailableSlots(new Date(dateStr))
  return NextResponse.json({ slots: slots.map((s) => s.toISOString()) })
}
