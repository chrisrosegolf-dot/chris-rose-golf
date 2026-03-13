import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { addMonths } from 'date-fns'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { clientId, delta } = await req.json()
  const now = new Date()

  const pass = await prisma.sessionPass.findFirst({
    where: { userId: clientId, expiresAt: { gt: now } },
    orderBy: { expiresAt: 'asc' },
  })

  if (!pass) {
    if (delta > 0) {
      await prisma.sessionPass.create({
        data: {
          userId: clientId,
          totalCredits: delta,
          remainingCredits: delta,
          expiresAt: addMonths(now, 6),
        },
      })
    } else {
      return NextResponse.json({ error: 'No active pass to deduct from' }, { status: 400 })
    }
  } else {
    await prisma.sessionPass.update({
      where: { id: pass.id },
      data: { remainingCredits: Math.max(0, pass.remainingCredits + delta) },
    })
  }

  return NextResponse.json({ ok: true })
}
