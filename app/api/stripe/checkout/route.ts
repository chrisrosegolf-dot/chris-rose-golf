import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { stripe } from '@/lib/stripe'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { type, startTime, passType } = await req.json()
  const userId = (session.user as any).id
  const baseUrl = process.env.NEXTAUTH_URL!

  if (type === 'session') {
    const price = parseInt(process.env.SINGLE_SESSION_PRICE || '25000')
    const cs = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: session.user?.email!,
      line_items: [{
        price_data: {
          currency: 'aud',
          product_data: { name: 'Golf Coaching Session — 60 min', description: 'Darlinghurst Studio' },
          unit_amount: price,
        },
        quantity: 1,
      }],
      metadata: { type: 'session', userId, startTime },
      success_url: `${baseUrl}/dashboard?success=session`,
      cancel_url: `${baseUrl}/book`,
    })
    return NextResponse.json({ url: cs.url })
  }

  if (type === 'pass') {
    const credits = passType === '6' ? 6 : 12
    const price = passType === '6'
      ? parseInt(process.env.SIX_PASS_PRICE || '135000')
      : parseInt(process.env.TWELVE_PASS_PRICE || '240000')

    const cs = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: session.user?.email!,
      line_items: [{
        price_data: {
          currency: 'aud',
          product_data: { name: `${credits}-Session Golf Pass`, description: 'Valid for 6 months from purchase' },
          unit_amount: price,
        },
        quantity: 1,
      }],
      metadata: { type: 'pass', userId, credits: credits.toString() },
      success_url: `${baseUrl}/dashboard?success=pass`,
      cancel_url: `${baseUrl}/passes`,
    })
    return NextResponse.json({ url: cs.url })
  }

  return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
}
