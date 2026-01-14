import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function cleanupOrphans() {
  console.log("Starting cleanup of orphaned records...")

  // Get all valid group IDs
  const validGroups = await prisma.group.findMany({
    select: { id: true },
  })
  const validGroupIds = new Set(validGroups.map((g) => g.id))

  console.log(`Found ${validGroupIds.size} valid groups`)

  // Clean up orphaned streaks
  const allStreaks = await prisma.streak.findMany({
    select: { id: true, groupId: true },
  })
  const orphanedStreakIds = allStreaks
    .filter((s) => !validGroupIds.has(s.groupId))
    .map((s) => s.id)

  if (orphanedStreakIds.length > 0) {
    const deleted = await prisma.streak.deleteMany({
      where: { id: { in: orphanedStreakIds } },
    })
    console.log(`Deleted ${deleted.count} orphaned streaks`)
  } else {
    console.log("No orphaned streaks found")
  }

  // Clean up orphaned goals
  const allGoals = await prisma.goal.findMany({
    select: { id: true, groupId: true },
  })
  const orphanedGoalIds = allGoals
    .filter((g) => !validGroupIds.has(g.groupId))
    .map((g) => g.id)

  if (orphanedGoalIds.length > 0) {
    const deleted = await prisma.goal.deleteMany({
      where: { id: { in: orphanedGoalIds } },
    })
    console.log(`Deleted ${deleted.count} orphaned goals`)
  } else {
    console.log("No orphaned goals found")
  }

  // Clean up orphaned daily tasks
  const allTasks = await prisma.dailyTask.findMany({
    select: { id: true, groupId: true },
  })
  const orphanedTaskIds = allTasks
    .filter((t) => !validGroupIds.has(t.groupId))
    .map((t) => t.id)

  if (orphanedTaskIds.length > 0) {
    const deleted = await prisma.dailyTask.deleteMany({
      where: { id: { in: orphanedTaskIds } },
    })
    console.log(`Deleted ${deleted.count} orphaned daily tasks`)
  } else {
    console.log("No orphaned daily tasks found")
  }

  // Clean up orphaned group members
  const allMembers = await prisma.groupMember.findMany({
    select: { id: true, groupId: true },
  })
  const orphanedMemberIds = allMembers
    .filter((m) => !validGroupIds.has(m.groupId))
    .map((m) => m.id)

  if (orphanedMemberIds.length > 0) {
    const deleted = await prisma.groupMember.deleteMany({
      where: { id: { in: orphanedMemberIds } },
    })
    console.log(`Deleted ${deleted.count} orphaned group members`)
  } else {
    console.log("No orphaned group members found")
  }

  // Clean up orphaned join requests
  const allRequests = await prisma.joinRequest.findMany({
    select: { id: true, groupId: true },
  })
  const orphanedRequestIds = allRequests
    .filter((r) => !validGroupIds.has(r.groupId))
    .map((r) => r.id)

  if (orphanedRequestIds.length > 0) {
    const deleted = await prisma.joinRequest.deleteMany({
      where: { id: { in: orphanedRequestIds } },
    })
    console.log(`Deleted ${deleted.count} orphaned join requests`)
  } else {
    console.log("No orphaned join requests found")
  }

  console.log("Cleanup complete!")
}

cleanupOrphans()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
