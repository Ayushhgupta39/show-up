import prisma from "@/lib/db/prisma"
import { isNextDay, getStartOfDayInTimezone } from "@/lib/utils/date"
import { differenceInDays } from "date-fns"

export async function updateStreakOnTaskCompletion(
  userId: string,
  groupId: string,
  taskDate: Date,
  timezone: string
) {
  let streak = await prisma.streak.findUnique({
    where: {
      groupId_userId: { groupId, userId },
    },
  })

  if (!streak) {
    streak = await prisma.streak.create({
      data: {
        groupId,
        userId,
        currentStreak: 0,
        bestStreak: 0,
      },
    })
  }

  const lastTaskDate = streak.lastTaskDate
  const isConsecutive = lastTaskDate
    ? isNextDay(lastTaskDate, taskDate, timezone)
    : true

  const newCurrentStreak = isConsecutive ? streak.currentStreak + 1 : 1

  const newBestStreak = Math.max(newCurrentStreak, streak.bestStreak)

  return await prisma.streak.update({
    where: { id: streak.id },
    data: {
      currentStreak: newCurrentStreak,
      bestStreak: newBestStreak,
      lastTaskDate: taskDate,
    },
  })
}

export async function breakStreak(userId: string, groupId: string) {
  const streak = await prisma.streak.findUnique({
    where: {
      groupId_userId: { groupId, userId },
    },
  })

  if (!streak) {
    return null
  }

  return await prisma.streak.update({
    where: { id: streak.id },
    data: {
      currentStreak: 0,
    },
  })
}

export async function getStreakForUser(userId: string, groupId: string) {
  return await prisma.streak.findUnique({
    where: {
      groupId_userId: { groupId, userId },
    },
  })
}

export async function getAllStreaksForUser(userId: string) {
  return await prisma.streak.findMany({
    where: { userId },
    include: {
      group: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      currentStreak: 'desc',
    },
  })
}

export async function getStreaksForGroup(groupId: string) {
  return await prisma.streak.findMany({
    where: { groupId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      currentStreak: 'desc',
    },
  })
}

/**
 * Check and reset stale streaks for a user.
 * A streak is stale if the lastTaskDate is more than 1 day ago.
 */
export async function checkAndResetStaleStreaks(userId: string, timezone: string) {
  const streaks = await prisma.streak.findMany({
    where: {
      userId,
      currentStreak: { gt: 0 },
    },
  })

  const today = getStartOfDayInTimezone(new Date(), timezone)

  for (const streak of streaks) {
    if (!streak.lastTaskDate) continue

    const lastTaskDay = getStartOfDayInTimezone(streak.lastTaskDate, timezone)
    const daysDiff = differenceInDays(today, lastTaskDay)

    // If more than 1 day has passed since last task, reset the streak
    if (daysDiff > 1) {
      await prisma.streak.update({
        where: { id: streak.id },
        data: { currentStreak: 0 },
      })
    }
  }
}

/**
 * Check and reset stale streaks for all members of a group.
 */
export async function checkAndResetStaleStreaksForGroup(groupId: string, timezone: string) {
  const streaks = await prisma.streak.findMany({
    where: {
      groupId,
      currentStreak: { gt: 0 },
    },
  })

  const today = getStartOfDayInTimezone(new Date(), timezone)

  for (const streak of streaks) {
    if (!streak.lastTaskDate) continue

    const lastTaskDay = getStartOfDayInTimezone(streak.lastTaskDate, timezone)
    const daysDiff = differenceInDays(today, lastTaskDay)

    // If more than 1 day has passed since last task, reset the streak
    if (daysDiff > 1) {
      await prisma.streak.update({
        where: { id: streak.id },
        data: { currentStreak: 0 },
      })
    }
  }
}
