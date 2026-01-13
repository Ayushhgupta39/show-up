import prisma from "@/lib/db/prisma"
import { getStartOfDayInTimezone, getDaysPending } from "@/lib/utils/date"

export async function getPendingTasksCount(
  userId: string,
  groupId: string,
  timezone: string
): Promise<number> {
  const now = new Date()
  const startOfToday = getStartOfDayInTimezone(now, timezone)

  const pendingTasks = await prisma.dailyTask.findMany({
    where: {
      userId,
      groupId,
      status: "pending",
      date: {
        lt: startOfToday,
      },
    },
  })

  return pendingTasks.length
}

export async function getPendingTasksWithDays(
  userId: string,
  groupId: string,
  timezone: string
) {
  const now = new Date()
  const startOfToday = getStartOfDayInTimezone(now, timezone)

  const pendingTasks = await prisma.dailyTask.findMany({
    where: {
      userId,
      groupId,
      status: "pending",
      date: {
        lt: startOfToday,
      },
    },
    orderBy: {
      date: "asc",
    },
  })

  return pendingTasks.map((task) => ({
    ...task,
    daysPending: getDaysPending(task.date, timezone),
  }))
}

export async function getAllPendingTasksForUser(userId: string, timezone: string) {
  const now = new Date()
  const startOfToday = getStartOfDayInTimezone(now, timezone)

  const pendingTasks = await prisma.dailyTask.findMany({
    where: {
      userId,
      status: "pending",
      date: {
        lt: startOfToday,
      },
    },
    include: {
      group: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      date: "asc",
    },
  })

  return pendingTasks.map((task) => ({
    ...task,
    daysPending: getDaysPending(task.date, timezone),
  }))
}

export async function getTasksForGroup(
  groupId: string,
  options?: {
    date?: Date
    userId?: string
    status?: string
  }
) {
  return await prisma.dailyTask.findMany({
    where: {
      groupId,
      ...(options?.date && { date: options.date }),
      ...(options?.userId && { userId: options.userId }),
      ...(options?.status && { status: options.status }),
    },
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
      date: "desc",
    },
  })
}

export async function getTasksForUser(userId: string, groupId?: string) {
  return await prisma.dailyTask.findMany({
    where: {
      userId,
      ...(groupId && { groupId }),
    },
    include: {
      group: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      date: "desc",
    },
  })
}

export async function hasTaskForDate(
  userId: string,
  groupId: string,
  date: Date
): Promise<boolean> {
  const task = await prisma.dailyTask.findUnique({
    where: {
      groupId_userId_date: {
        groupId,
        userId,
        date,
      },
    },
  })

  return !!task
}
