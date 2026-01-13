import prisma from "@/lib/db/prisma"
import { isNextDay } from "@/lib/utils/date"

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
