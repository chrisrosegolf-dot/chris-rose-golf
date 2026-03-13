import { Resend } from 'resend'
import { format } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'

const resend = new Resend(process.env.RESEND_API_KEY)
const TZ = 'Australia/Sydney'
const FROM = 'Chris Rose Golf <bookings@chrisrosegolf.com.au>'

function sydneyTime(date: Date) {
  return format(toZonedTime(date, TZ), 'EEEE d MMMM yyyy, h:mm a')
}

export async function sendBookingConfirmation({
  to,
  name,
  startTime,
  paymentType,
}: {
  to: string
  name: string
  startTime: Date
  paymentType: string
}) {
  await resend.emails.send({
    from: FROM,
    to,
    subject: 'Booking Confirmed — Chris Rose Golf',
    html: `
      <h2>Booking Confirmed</h2>
      <p>Hi ${name},</p>
      <p>Your coaching session is confirmed.</p>
      <p><strong>Date & Time:</strong> ${sydneyTime(startTime)}</p>
      <p><strong>Location:</strong> Darlinghurst Studio</p>
      <p><strong>Payment:</strong> ${paymentType === 'CREDIT' ? 'Session credit used' : 'Paid online'}</p>
      <p>Free cancellation up to 24 hours before your session.</p>
    `,
  })
}

export async function sendSessionReminder({
  to,
  name,
  startTime,
}: {
  to: string
  name: string
  startTime: Date
}) {
  await resend.emails.send({
    from: FROM,
    to,
    subject: 'Session Reminder — Tomorrow with Chris Rose',
    html: `
      <h2>Session Reminder</h2>
      <p>Hi ${name},</p>
      <p>Just a reminder that you have a coaching session tomorrow.</p>
      <p><strong>Date & Time:</strong> ${sydneyTime(startTime)}</p>
      <p><strong>Location:</strong> Darlinghurst Studio</p>
    `,
  })
}

export async function sendPassConfirmation({
  to,
  name,
  totalCredits,
  expiresAt,
}: {
  to: string
  name: string
  totalCredits: number
  expiresAt: Date
}) {
  await resend.emails.send({
    from: FROM,
    to,
    subject: 'Session Pass Purchased — Chris Rose Golf',
    html: `
      <h2>Session Pass Confirmed</h2>
      <p>Hi ${name},</p>
      <p>Your ${totalCredits}-session pass has been activated.</p>
      <p><strong>Sessions:</strong> ${totalCredits}</p>
      <p><strong>Expires:</strong> ${format(toZonedTime(expiresAt, TZ), 'd MMMM yyyy')}</p>
      <p><a href="${process.env.NEXTAUTH_URL}/book">Book your first session</a></p>
    `,
  })
}

export async function sendCancellationConfirmation({
  to,
  name,
  startTime,
  creditRefunded,
}: {
  to: string
  name: string
  startTime: Date
  creditRefunded: boolean
}) {
  await resend.emails.send({
    from: FROM,
    to,
    subject: 'Session Cancelled — Chris Rose Golf',
    html: `
      <h2>Session Cancelled</h2>
      <p>Hi ${name},</p>
      <p>Your session on ${sydneyTime(startTime)} has been cancelled.</p>
      ${creditRefunded ? '<p>Your session credit has been returned to your pass.</p>' : '<p>As the session was within 24 hours, no credit has been refunded.</p>'}
    `,
  })
}

export async function sendLowCreditAlert({
  to,
  name,
  expiresAt,
}: {
  to: string
  name: string
  expiresAt: Date
}) {
  await resend.emails.send({
    from: FROM,
    to,
    subject: 'Last Session Credit Remaining — Chris Rose Golf',
    html: `
      <h2>1 Session Credit Remaining</h2>
      <p>Hi ${name},</p>
      <p>You have 1 session credit left, expiring on ${format(toZonedTime(expiresAt, TZ), 'd MMMM yyyy')}.</p>
      <p><a href="${process.env.NEXTAUTH_URL}/passes">Buy a new pass</a></p>
    `,
  })
}
