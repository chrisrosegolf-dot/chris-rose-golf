import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/db'
import { addMinutes, addMonths } from 'date-fns'
import { sendBookingConfirmation, sendPassConfirmation } from '@/lib/email'
import Stripe from 'stripe'

export async function POST(req: Request) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const cs = event.data.object as Stripe.Checkout.Session
    const { type, userId, startTime, credits } = cs.metadata!

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    if (type === 'session') {
      const start = new Date(startTime)
      const end = addMinutes(start, 60)
      await prisma.booking.create({
        data: {
          userId,
          startTime: start,
          endTime: end,
          paymentType: 'STRIPE',
          stripePaymentId: cs.payment_intent as string,
          status: 'CONFIRMED',
        },
      })
      await sendBookingConfirmation({ to: user.email, name: user.name, startTime: start, paymentType: 'STRIPE' })
    }

    if (type === 'pass') {
      const totalCredits = parseInt(credits)
      const now = new Date()
      const pass = await prisma.sessionPass.create({
        data: {
          userId,
          totalCredits,
          remainingCredits: totalCredits,
          purchasedAt: now,
          expiresAt: addMonths(now, 6),
          stripePaymentId: cs.payment_intent as string,
        },
      })
      await sendPassConfirmation({ to: user.email, name: user.name, totalCredits, expiresAt: pass.expiresAt })
    }
  }

  return NextResponse.json({ received: true })
}
