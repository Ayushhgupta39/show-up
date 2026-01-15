"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Calendar, Trash2, AlertTriangle } from "lucide-react"
import { format, differenceInDays, isPast, isToday } from "date-fns"
import { toast } from "sonner"

interface ShortTermGoalCardProps {
  goal: {
    id: string
    title: string
    description?: string | null
    status: string
    items: any
    targetDate?: Date | null
    user: {
      id: string
      name?: string | null
      email: string
    }
  }
  currentUserId: string
}

export function ShortTermGoalCard({ goal, currentUserId }: ShortTermGoalCardProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const items = goal.items as Array<{ id: string; text: string; completed: boolean }> || []
  const completedCount = items.filter((item) => item.completed).length
  const totalCount = items.length
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  const isOwner = goal.user.id === currentUserId
  const isCompleted = goal.status === "completed"

  // Calculate target date status
  const targetDate = goal.targetDate ? new Date(goal.targetDate) : null
  const isOverdue = targetDate && !isCompleted && isPast(targetDate) && !isToday(targetDate)
  const isDueToday = targetDate && !isCompleted && isToday(targetDate)
  const daysRemaining = targetDate ? differenceInDays(targetDate, new Date()) : null

  const handleToggleItem = async (itemId: string) => {
    setIsLoading(true)

    try {
      const newItems = items.map((item) =>
        item.id === itemId ? { ...item, completed: !item.completed } : item
      )

      const allCompleted = newItems.every((item) => item.completed)

      const response = await fetch(`/api/goals/${goal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: newItems,
          ...(allCompleted && { status: "completed" }),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || "Failed to update item")
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
    <Card className={
      isOverdue
        ? "border-red-300 dark:border-red-800"
        : isDueToday
          ? "border-orange-300 dark:border-orange-800"
          : ""
    }>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="text-xs font-normal">
                Short-term
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
                  {completedCount}/{totalCount} items
                </Badge>
              )}
            </div>
            {goal.description && (
              <CardDescription>{goal.description}</CardDescription>
            )}
            <p className="text-xs text-muted-foreground">
              By {goal.user.name || goal.user.email}
            </p>
            {targetDate && (
              <div className={`flex items-center gap-2 text-xs mt-1 ${
                isOverdue
                  ? "text-red-600 dark:text-red-400"
                  : isDueToday
                    ? "text-orange-600 dark:text-orange-400"
                    : "text-muted-foreground"
              }`}>
                {isOverdue ? (
                  <AlertTriangle className="h-3 w-3" />
                ) : (
                  <Calendar className="h-3 w-3" />
                )}
                <span className="font-medium">
                  {format(targetDate, "MMM d, yyyy")}
                </span>
                {!isCompleted && (
                  <Badge
                    variant={isOverdue ? "destructive" : isDueToday ? "default" : "outline"}
                    className={`text-xs px-1.5 py-0 h-5 ${
                      isDueToday ? "bg-orange-500" : ""
                    }`}
                  >
                    {isOverdue
                      ? `${Math.abs(daysRemaining!)} days overdue`
                      : isDueToday
                        ? "Due today"
                        : `${daysRemaining} days left`
                    }
                  </Badge>
                )}
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
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="flex items-center space-x-2">
              <Checkbox
                id={item.id}
                checked={item.completed}
                onCheckedChange={() => handleToggleItem(item.id)}
                disabled={!isOwner || isLoading}
              />
              <label
                htmlFor={item.id}
                className={`flex-1 text-sm ${
                  item.completed
                    ? "line-through text-muted-foreground"
                    : "text-foreground"
                }`}
              >
                {item.text}
              </label>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
