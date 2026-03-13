import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { start, end, reason } = await req.json()
  await prisma.blockedSlot.create({
    data: { startTime: new Date(start), endTime: new Date(end), reason: reason || null },
  })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')!
  await prisma.blockedSlot.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
