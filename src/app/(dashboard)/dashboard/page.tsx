import { auth } from "@/lib/auth/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/db/prisma"
import { CreateGroupDialog } from "@/components/groups/create-group-dialog"
import { GroupCard } from "@/components/groups/group-card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { getAllPendingTasksForUser } from "@/lib/services/task.service"
import { getAllStreaksForUser } from "@/lib/services/streak.service"
import { getPendingTasksCount } from "@/lib/services/task.service"
import { Flame, AlertCircle } from "lucide-react"

export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  // Get user's group memberships (without include to avoid null errors)
  const groupMemberships = await prisma.groupMember.findMany({
    where: {
      userId: session.user.id,
    },
  })

  // Get the actual groups separately
  const groupIds = groupMemberships.map((m) => m.groupId)
  const groupsData = await prisma.group.findMany({
    where: {
      id: {
        in: groupIds,
      },
    },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      _count: {
        select: {
          members: true,
        },
      },
    },
  })

  // Map groups with their roles
  const groupsMap = new Map(groupsData.map((g) => [g.id, g]))
  const groups = groupMemberships
    .map((membership) => {
      const group = groupsMap.get(membership.groupId)
      if (!group) return null
      return {
        ...group,
        role: membership.role,
      }
    })
    .filter((g) => g !== null)

  // Clean up any orphaned memberships found
  const validGroupIds = new Set(groupsData.map((g) => g.id))
  const orphanedMembershipIds = groupMemberships
    .filter((m) => !validGroupIds.has(m.groupId))
    .map((m) => m.id)

  if (orphanedMembershipIds.length > 0) {
    await prisma.groupMember.deleteMany({
      where: {
        id: {
          in: orphanedMembershipIds,
        },
      },
    })
  }

  // Get all streaks for user
  const streaks = await getAllStreaksForUser(session.user.id)
  const streaksMap = new Map(streaks.map((s) => [s.groupId, s]))

  // Get pending tasks count for each group
  const pendingCounts = await Promise.all(
    groups.map((group) =>
      getPendingTasksCount(session.user.id, group.id, session.user.timezone)
    )
  )

  const groupsWithPendingCounts = groups.map((group, index) => ({
    ...group,
    pendingCount: pendingCounts[index],
  }))

  // Get all pending tasks
  const allPendingTasks = await getAllPendingTasksForUser(
    session.user.id,
    session.user.timezone
  )

  // Calculate best streak
  const bestStreak = streaks.reduce(
    (max, s) => Math.max(max, s.bestStreak),
    0
  )

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-6 md:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1">
            Welcome back, {session.user.name || session.user.email}
          </p>
        </div>
        <CreateGroupDialog />
      </div>

      {/* Stats */}
      <div className="mb-6 md:mb-8 grid gap-3 md:gap-4 grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 md:px-6 pt-3 md:pt-6">
            <CardTitle className="text-xs md:text-sm font-medium">Groups</CardTitle>
          </CardHeader>
          <CardContent className="px-3 md:px-6 pb-3 md:pb-6">
            <div className="text-xl md:text-2xl font-bold">{groups.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 md:px-6 pt-3 md:pt-6">
            <CardTitle className="text-xs md:text-sm font-medium">Streak</CardTitle>
            <Flame className="h-3 w-3 md:h-4 md:w-4 text-orange-500" />
          </CardHeader>
          <CardContent className="px-3 md:px-6 pb-3 md:pb-6">
            <div className="text-xl md:text-2xl font-bold">{bestStreak}</div>
            <p className="text-xs text-muted-foreground hidden sm:inline">days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 md:px-6 pt-3 md:pt-6">
            <CardTitle className="text-xs md:text-sm font-medium">Pending</CardTitle>
            <AlertCircle className="h-3 w-3 md:h-4 md:w-4 text-destructive" />
          </CardHeader>
          <CardContent className="px-3 md:px-6 pb-3 md:pb-6">
            <div className="text-xl md:text-2xl font-bold">{allPendingTasks.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Tasks Alert */}
      {allPendingTasks.length > 0 && (
        <Alert variant="destructive" className="mb-6 md:mb-8">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle className="text-sm md:text-base">You have {allPendingTasks.length} pending task(s)</AlertTitle>
          <AlertDescription className="text-xs md:text-sm">
            Complete or mark them as missed to continue your streaks
          </AlertDescription>
        </Alert>
      )}

      <Separator className="my-6 md:my-8" />

      {/* Groups */}
      <div className="space-y-4">
        <h2 className="text-xl md:text-2xl font-bold tracking-tight">Your Groups</h2>
        {groups.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="mb-4 text-center text-muted-foreground">
                You&apos;re not part of any groups yet
              </p>
              <CreateGroupDialog />
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 md:gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {groupsWithPendingCounts.map((group) => (
              <GroupCard
                key={group.id}
                group={group}
                streak={streaksMap.get(group.id)}
                pendingCount={group.pendingCount}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
