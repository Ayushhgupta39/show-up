"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Calendar, Trash2 } from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"

interface LongTermGoalCardProps {
  goal: {
    id: string
    title: string
    description?: string | null
    status: string
    startDate?: Date | null
    endDate?: Date | null
    milestones: any
    user: {
      id: string
      name?: string | null
      email: string
    }
  }
  currentUserId: string
}

export function LongTermGoalCard({ goal, currentUserId }: LongTermGoalCardProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const milestones =
    (goal.milestones as Array<{ date: string; text: string; completed: boolean }>) || []
  const completedCount = milestones.filter((m) => m.completed).length
  const totalCount = milestones.length
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  const isOwner = goal.user.id === currentUserId
  const isCompleted = goal.status === "completed"

  const handleToggleMilestone = async (milestoneDate: string) => {
    setIsLoading(true)

    try {
      const newMilestones = milestones.map((m) =>
        m.date === milestoneDate ? { ...m, completed: !m.completed } : m
      )

      const allCompleted = newMilestones.every((m) => m.completed)

      const response = await fetch(`/api/goals/${goal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          milestones: newMilestones,
          ...(allCompleted && { status: "completed" }),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || "Failed to update milestone")
        return
      }

      if (allCompleted) {
        toast.success("Goal completed! 🎉")
      }

      router.refresh()
    } catch (error) {
      toast.error("Something went wrong. Please try again.")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this goal?")) return

    setIsLoading(true)

    try {
      const response = await fetch(`/api/goals/${goal.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const data = await response.json()
        toast.error(data.error || "Failed to delete goal")
        return
      }

      toast.success("Goal deleted")
      router.refresh()
    } catch (error) {
      toast.error("Something went wrong. Please try again.")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="text-xs font-normal">
                Long-term
              </Badge>
              <CardTitle className="text-lg">{goal.title}</CardTitle>
              {isCompleted && (
                <Badge variant="default" className="bg-green-500">
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  Completed
                </Badge>
              )}
              {!isCompleted && (
                <Badge variant="secondary">
                  {completedCount}/{totalCount} milestones
                </Badge>
              )}
            </div>
            {goal.description && (
              <CardDescription>{goal.description}</CardDescription>
            )}
            <p className="text-xs text-muted-foreground">
              By {goal.user.name || goal.user.email}
            </p>
            {goal.startDate && goal.endDate && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>
                  {format(new Date(goal.startDate), "MMM d, yyyy")} -{" "}
                  {format(new Date(goal.endDate), "MMM d, yyyy")}
                </span>
              </div>
            )}
          </div>
          {isOwner && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDelete}
              disabled={isLoading}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Progress value={progress} className="h-2" />
        <div className="space-y-3">
          {milestones.map((milestone, index) => (
            <div key={index} className="space-y-1">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`milestone-${index}`}
                  checked={milestone.completed}
                  onCheckedChange={() => handleToggleMilestone(milestone.date)}
                  disabled={!isOwner || isLoading}
                />
                <label
                  htmlFor={`milestone-${index}`}
                  className={`flex-1 text-sm ${
                    milestone.completed
                      ? "line-through text-muted-foreground"
                      : "text-foreground"
                  }`}
                >
                  {milestone.text}
                </label>
              </div>
              <p className="ml-6 text-xs text-muted-foreground">
                {format(new Date(milestone.date), "MMM d, yyyy")}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
