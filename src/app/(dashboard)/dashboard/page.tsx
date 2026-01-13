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
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {session.user.name || session.user.email}
          </p>
        </div>
        <CreateGroupDialog />
      </div>

      {/* Stats */}
      <div className="mb-8 grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Groups</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{groups.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Best Streak</CardTitle>
            <Flame className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bestStreak} days</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allPendingTasks.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Tasks Alert */}
      {allPendingTasks.length > 0 && (
        <Alert variant="destructive" className="mb-8">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>You have {allPendingTasks.length} pending task(s)</AlertTitle>
          <AlertDescription>
            Complete or mark them as missed to continue your streaks
          </AlertDescription>
        </Alert>
      )}

      <Separator className="my-8" />

      {/* Groups */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight">Your Groups</h2>
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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
