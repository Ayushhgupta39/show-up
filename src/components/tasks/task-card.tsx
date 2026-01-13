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
      <CardHeader className="pb-3 md:pb-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="space-y-1 flex-1 min-w-0">
            <CardTitle className="text-base md:text-lg">{task.title}</CardTitle>
            <p className="text-xs md:text-sm text-muted-foreground truncate">
              {task.user.name || task.user.email}
            </p>
          </div>
          <div className="flex flex-row sm:flex-col items-start sm:items-end gap-2 shrink-0">
            {isCompleted && (
              <Badge variant="default" className="bg-green-500 text-xs">
                <CheckCircle2 className="mr-1 h-3 w-3" />
                <span className="hidden sm:inline">Completed</span>
                <span className="sm:hidden">Done</span>
              </Badge>
            )}
            {isPending && daysPending > 0 && (
              <Badge variant="destructive" className="text-xs">
                <Clock className="mr-1 h-3 w-3" />
                <span className="hidden sm:inline">Pending {daysPending} day{daysPending > 1 ? "s" : ""}</span>
                <span className="sm:hidden">{daysPending}d</span>
              </Badge>
            )}
            {isPending && daysPending === 0 && (
              <Badge variant="secondary" className="text-xs">
                <Clock className="mr-1 h-3 w-3" />
                Pending
              </Badge>
            )}
            {isMissed && (
              <Badge variant="outline" className="border-destructive text-destructive text-xs">
                <XCircle className="mr-1 h-3 w-3" />
                Missed
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {task.description && (
          <p className="mb-3 text-xs md:text-sm text-muted-foreground line-clamp-2">{task.description}</p>
        )}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-xs text-muted-foreground order-2 sm:order-1">
            {formatInTimezone(task.date, timezone, "PP")}
          </p>
          {isOwner && isPending && (
            <div className="flex gap-2 order-1 sm:order-2">
              <Button
                size="sm"
                variant="default"
                onClick={() => handleStatusChange("completed")}
                disabled={isLoading}
                className="flex-1 sm:flex-none text-xs md:text-sm"
              >
                <CheckCircle2 className="mr-1 h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden sm:inline">Complete</span>
                <span className="sm:hidden">Done</span>
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleStatusChange("missed")}
                disabled={isLoading}
                className="flex-1 sm:flex-none text-xs md:text-sm"
              >
                <XCircle className="mr-1 h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden sm:inline">Missed</span>
                <span className="sm:hidden">Miss</span>
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
