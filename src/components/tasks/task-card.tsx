"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle2, XCircle, Clock } from "lucide-react"
import { formatInTimezone, getDaysPending } from "@/lib/utils/date"
import { toast } from "sonner"

interface TaskCardProps {
  task: {
    id: string
    title: string
    description?: string | null
    date: Date
    status: string
    completedAt?: Date | null
    user: {
      id: string
      name?: string | null
      email: string
    }
  }
  currentUserId: string
  timezone: string
}

export function TaskCard({ task, currentUserId, timezone }: TaskCardProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const isOwner = task.user.id === currentUserId
  const isPending = task.status === "pending"
  const isCompleted = task.status === "completed"
  const isMissed = task.status === "missed"

  const daysPending = isPending ? getDaysPending(task.date, timezone) : 0

  const handleStatusChange = async (newStatus: string) => {
    setIsLoading(true)

    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || "Failed to update task")
        return
      }

      toast.success(`Task marked as ${newStatus}`)
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
            <CardTitle className="text-lg">{task.title}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {task.user.name || task.user.email}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            {isCompleted && (
              <Badge variant="default" className="bg-green-500">
                <CheckCircle2 className="mr-1 h-3 w-3" />
                Completed
              </Badge>
            )}
            {isPending && daysPending > 0 && (
              <Badge variant="destructive">
                <Clock className="mr-1 h-3 w-3" />
                Pending {daysPending} day{daysPending > 1 ? "s" : ""}
              </Badge>
            )}
            {isPending && daysPending === 0 && (
              <Badge variant="secondary">
                <Clock className="mr-1 h-3 w-3" />
                Pending
              </Badge>
            )}
            {isMissed && (
              <Badge variant="outline" className="border-destructive text-destructive">
                <XCircle className="mr-1 h-3 w-3" />
                Missed
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {task.description && (
          <p className="mb-3 text-sm text-muted-foreground">{task.description}</p>
        )}
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {formatInTimezone(task.date, timezone, "PPP")}
          </p>
          {isOwner && isPending && (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="default"
                onClick={() => handleStatusChange("completed")}
                disabled={isLoading}
              >
                <CheckCircle2 className="mr-1 h-4 w-4" />
                Complete
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleStatusChange("missed")}
                disabled={isLoading}
              >
                <XCircle className="mr-1 h-4 w-4" />
                Mark Missed
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
