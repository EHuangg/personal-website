import { prisma } from "./prisma"

const DAILY_LIMIT = 9999
const WEEKLY_LIMIT = 9999

export async function checkCooldown(fingerprintHash: string): Promise<{
  allowed: boolean
  reason?: string
}> {
  const now = new Date()

  const dayAgo = new Date(now)
  dayAgo.setDate(dayAgo.getDate() - 1)

  const weekAgo = new Date(now)
  weekAgo.setDate(weekAgo.getDate() - 7)

  const [dailyCount, weeklyCount] = await Promise.all([
    prisma.fingerprint.count({
      where: {
        fingerprintHash,
        createdAt: { gte: dayAgo },
      },
    }),
    prisma.fingerprint.count({
      where: {
        fingerprintHash,
        createdAt: { gte: weekAgo },
      },
    }),
  ])

  if (dailyCount >= DAILY_LIMIT) {
    return { allowed: false, reason: "You've already submitted today. Come back tomorrow." }
  }

  if (weeklyCount >= WEEKLY_LIMIT) {
    return { allowed: false, reason: "You've reached the weekly limit of 3 submissions." }
  }

  return { allowed: true }
}