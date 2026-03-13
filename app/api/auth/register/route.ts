import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function POST(req: Request) {
  const { name, email, password, phone } = await req.json()

  if (!name || !email || !password) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ error: 'Email already registered' }, { status: 400 })
  }

  const hashed = await bcrypt.hash(password, 12)
  await prisma.user.create({
    data: { name, email, password: hashed, phone: phone || null, role: 'CLIENT' },
  })

  return NextResponse.json({ ok: true })
}
