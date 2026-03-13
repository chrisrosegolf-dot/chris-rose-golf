import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { addMonths } from 'date-fns'

const prisma = new PrismaClient()

async function main() {
  const adminPassword = await bcrypt.hash('admin123', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'chris@example.com' },
    update: {},
    create: {
      email: 'chris@example.com',
      password: adminPassword,
      name: 'Chris Rose',
      role: 'ADMIN',
    },
  })
  console.log('Admin created:', admin.email)

  const weekdays = [1, 2, 3, 4, 5]
  for (const day of weekdays) {
    await prisma.availability.upsert({
      where: { id: `avail-${day}` },
      update: {},
      create: {
        id: `avail-${day}`,
        dayOfWeek: day,
        startTime: '07:00',
        endTime: '18:00',
        isActive: true,
      },
    })
  }

  const clientPassword = await bcrypt.hash('client123', 12)
  const client = await prisma.user.upsert({
    where: { email: 'testclient@example.com' },
    update: {},
    create: {
      email: 'testclient@example.com',
      password: clientPassword,
      name: 'Test Client',
      role: 'CLIENT',
    },
  })

  const now = new Date()
  await prisma.sessionPass.create({
    data: {
      userId: client.id,
      totalCredits: 6,
      remainingCredits: 6,
      purchasedAt: now,
      expiresAt: addMonths(now, 6),
    },
  })

  console.log('Test client created:', client.email)
  console.log('Seed complete.')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
