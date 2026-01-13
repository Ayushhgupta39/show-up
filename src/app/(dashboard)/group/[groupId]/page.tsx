import { auth } from "@/lib/auth/auth"
import { redirect } from "next/navigation"
import { notFound } from "next/navigation"
import prisma from "@/lib/db/prisma"
import { CreateTaskDialog } from "@/components/tasks/create-task-dialog"
import { TaskCard } from "@/components/tasks/task-card"
import { CreateGoalDialog } from "@/components/goals/create-goal-dialog"
import { ShortTermGoalCard } from "@/components/goals/short-term-goal-card"
import { LongTermGoalCard } from "@/components/goals/long-term-goal-card"
import { JoinRequestsList } from "@/components/groups/join-requests-list"
import { InviteLinkManager } from "@/components/groups/invite-link-manager"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { getTasksForGroup } from "@/lib/services/task.service"
import { getStreaksForGroup } from "@/lib/services/streak.service"
import { Users, Flame, Target } from "lucide-react"

export default async function GroupPage({
  params,
}: {
  params: Promise<{ groupId: string }>
}) {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  const { groupId } = await params

  // Check if user is a member
  const membership = await prisma.groupMember.findUnique({
    where: {
      groupId_userId: {
        groupId,
        userId: session.user.id,
      },
    },
  })

  if (!membership) {
    notFound()
  }

  // Get group details
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      members: {
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
          joinedAt: "asc",
        },
      },
    },
  })

  if (!group) {
    notFound()
  }

  // Get all tasks for the group
  const tasks = await getTasksForGroup(groupId)

  // Get all goals for the group
  const goals = await prisma.goal.findMany({
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
      createdAt: "desc",
    },
  })

  // Get streaks for all members
  const streaks = await getStreaksForGroup(groupId)
  const streaksMap = new Map(streaks.map((s) => [s.userId, s]))

  // Calculate stats
  const totalMembers = group.members.length
  const totalTasks = tasks.length
  const completedTasks = tasks.filter((t) => t.status === "completed").length

  const getInitials = (name?: string | null, email?: string) => {
    if (!name) return email?.charAt(0).toUpperCase() || "?"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-4 md:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight truncate">{group.name}</h1>
            {group.description && (
              <p className="mt-1 md:mt-2 text-sm md:text-base text-muted-foreground line-clamp-2">{group.description}</p>
            )}
            <div className="mt-2 md:mt-3 flex flex-wrap items-center gap-2 md:gap-4 text-xs md:text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Users className="h-3 w-3 md:h-3.5 md:w-3.5" />
                <span>{totalMembers} members</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Target className="h-3 w-3 md:h-3.5 md:w-3.5" />
                <span>{totalTasks} tasks</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Flame className="h-3 w-3 md:h-3.5 md:w-3.5 text-orange-500" />
                <span>{completedTasks} done</span>
              </div>
            </div>
          </div>
          {membership.role === "admin" && (
            <Badge variant="secondary" className="shrink-0">Admin</Badge>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:gap-8 lg:grid-cols-3">
        {/* Main Content - Tasks */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl md:text-2xl font-bold tracking-tight">Daily Tasks</h2>
            <CreateTaskDialog groupId={groupId} />
          </div>

          <div>
            {tasks.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8 md:py-12">
                  <p className="mb-4 text-center text-sm md:text-base text-muted-foreground">
                    No tasks yet. Be the first to add one!
                  </p>
                  <CreateTaskDialog groupId={groupId} />
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3 md:space-y-4">
                {tasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={{
                      ...task,
                      date: new Date(task.date),
                      completedAt: task.completedAt ? new Date(task.completedAt) : null,
                    }}
                    currentUserId={session.user.id}
                    timezone={session.user.timezone}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Goals Section */}
          <Separator className="my-6 md:my-8" />

          <div className="space-y-4 md:space-y-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl md:text-2xl font-bold tracking-tight">Goals</h2>
              <CreateGoalDialog groupId={groupId} />
            </div>

            {goals.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8 md:py-12">
                  <p className="mb-4 text-center text-sm md:text-base text-muted-foreground">
                    No goals yet. Set a goal to track progress!
                  </p>
                  <CreateGoalDialog groupId={groupId} />
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3 md:space-y-4">
                {goals.map((goal) => (
                  goal.type === "short_term" ? (
                    <ShortTermGoalCard
                      key={goal.id}
                      goal={{
                        ...goal,
                        items: goal.items || [],
                      }}
                      currentUserId={session.user.id}
                    />
                  ) : (
                    <LongTermGoalCard
                      key={goal.id}
                      goal={{
                        ...goal,
                        startDate: goal.startDate ? new Date(goal.startDate) : null,
                        endDate: goal.endDate ? new Date(goal.endDate) : null,
                        milestones: goal.milestones || [],
                      }}
                      currentUserId={session.user.id}
                    />
                  )
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4 md:space-y-6">
          {/* Invite Link (Admin Only) */}
          {membership.role === "admin" && (
            <InviteLinkManager groupId={groupId} initialInviteToken={group.inviteToken} />
          )}

          {/* Join Requests (Admin Only) */}
          {membership.role === "admin" && (
            <JoinRequestsList groupId={groupId} />
          )}

          {/* Members */}
          <Card>
            <CardHeader>
              <CardTitle>Members</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {group.members.map((member) => {
                  const userStreak = streaksMap.get(member.userId)
                  return (
                    <div
                      key={member.id}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>
                            {getInitials(member.user.name, member.user.email)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">
                            {member.user.name || member.user.email}
                            {member.userId === group.ownerId && (
                              <Badge variant="outline" className="ml-2 text-xs">
                                Owner
                              </Badge>
                            )}
                          </p>
                          {userStreak && (
                            <p className="text-xs text-muted-foreground">
                              <Flame className="mr-1 inline h-3 w-3 text-orange-500" />
                              {userStreak.currentStreak} day streak
                            </p>
                          )}
                        </div>
                      </div>
                      {member.role === "admin" && member.userId !== group.ownerId && (
                        <Badge variant="secondary" className="text-xs">
                          Admin
                        </Badge>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Leaderboard */}
          <Card>
            <CardHeader>
              <CardTitle>Streak Leaderboard</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {streaks.slice(0, 5).map((streak, index) => (
                  <div key={streak.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-muted-foreground">
                        #{index + 1}
                      </span>
                      <div>
                        <p className="text-sm font-medium">
                          {streak.user.name || streak.user.email}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Best: {streak.bestStreak} days
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-sm font-bold">
                      <Flame className="h-4 w-4 text-orange-500" />
                      {streak.currentStreak}
                    </div>
                  </div>
                ))}
                {streaks.length === 0 && (
                  <p className="text-center text-sm text-muted-foreground">
                    No streaks yet. Complete daily tasks to start!
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
