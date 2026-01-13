"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { UserPlus, Check, X } from "lucide-react"
import { toast } from "sonner"

interface JoinRequest {
  id: string
  message?: string | null
  createdAt: string
  user: {
    id: string
    name?: string | null
    email: string
  }
}

interface JoinRequestsListProps {
  groupId: string
}

export function JoinRequestsList({ groupId }: JoinRequestsListProps) {
  const router = useRouter()
  const [requests, setRequests] = useState<JoinRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)

  useEffect(() => {
    fetchRequests()
  }, [groupId])

  const fetchRequests = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/groups/${groupId}/join-requests`)
      if (response.ok) {
        const data = await response.json()
        setRequests(data.joinRequests)
      }
    } catch (error) {
      console.error("Failed to fetch join requests:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAction = async (requestId: string, action: "approve" | "reject") => {
    setProcessingId(requestId)

    try {
      const response = await fetch(`/api/groups/${groupId}/join-requests`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, action }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || `Failed to ${action} request`)
        return
      }

      toast.success(
        action === "approve"
          ? "Join request approved! Member added to group."
          : "Join request rejected."
      )

      // Remove the request from the list
      setRequests((prev) => prev.filter((req) => req.id !== requestId))
      router.refresh()
    } catch (error) {
      toast.error("Something went wrong. Please try again.")
      console.error(error)
    } finally {
      setProcessingId(null)
    }
  }

  const getInitials = (name?: string | null, email?: string) => {
    if (!name) return email?.charAt(0).toUpperCase() || "?"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Join Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading requests...</p>
        </CardContent>
      </Card>
    )
  }

  if (requests.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Join Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-sm text-muted-foreground">
            No pending join requests
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Join Requests
          <Badge variant="secondary">{requests.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {requests.map((request) => (
            <div
              key={request.id}
              className="flex flex-col gap-3 rounded-lg border p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <Avatar>
                    <AvatarFallback>
                      {getInitials(request.user.name, request.user.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {request.user.name || request.user.email}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {request.user.email}
                    </p>
                    {request.message && (
                      <p className="mt-2 text-sm text-muted-foreground">
                        "{request.message}"
                      </p>
                    )}
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(request.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => handleAction(request.id, "approve")}
                  disabled={processingId === request.id}
                  className="flex-1"
                >
                  <Check className="mr-1 h-4 w-4" />
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleAction(request.id, "reject")}
                  disabled={processingId === request.id}
                  className="flex-1"
                >
                  <X className="mr-1 h-4 w-4" />
                  Reject
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
