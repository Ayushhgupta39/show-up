"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Users, CheckCircle } from "lucide-react"
import { toast } from "sonner"

interface Group {
  id: string
  name: string
  description?: string | null
  owner: {
    id: string
    name?: string | null
    email: string
  }
  _count: {
    members: number
  }
}

export default function InvitePage() {
  const router = useRouter()
  const params = useParams()
  const { data: session, status } = useSession()
  const token = params.token as string

  const [group, setGroup] = useState<Group | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isJoining, setIsJoining] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // If not authenticated, redirect to login with callback
    if (status === "unauthenticated") {
      router.push(`/login?callbackUrl=/invite/${token}`)
      return
    }

    // If authenticated, fetch group details
    if (status === "authenticated" && token) {
      fetchGroupDetails()
    }
  }, [status, token])

  const fetchGroupDetails = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/invite/${token}`)
      const data = await response.json()

      if (!response.ok) {
        if (response.status === 401) {
          // Not authenticated, redirect to login
          router.push(`/login?callbackUrl=/invite/${token}`)
          return
        }
        setError(data.error || "Invalid invite link")
        return
      }

      setGroup(data.group)
    } catch (error) {
      console.error("Failed to fetch group details:", error)
      setError("Failed to load invite details")
    } finally {
      setIsLoading(false)
    }
  }

  const handleJoin = async () => {
    setIsJoining(true)

    try {
      const response = await fetch(`/api/invite/${token}`, {
        method: "POST",
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 401) {
          // Not authenticated, redirect to login
          router.push(`/login?callbackUrl=/invite/${token}`)
          return
        }
        if (response.status === 409 && data.groupId) {
          // Already a member, redirect to group
          toast.info("You're already a member of this group")
          router.push(`/group/${data.groupId}`)
          return
        }
        toast.error(data.error || "Failed to join group")
        return
      }

      toast.success("Successfully joined the group!")
      router.push(`/group/${data.groupId}`)
    } catch (error) {
      toast.error("Something went wrong. Please try again.")
      console.error(error)
    } finally {
      setIsJoining(false)
    }
  }

  // Show loading while checking authentication
  if (status === "loading" || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">
              {status === "loading" ? "Checking authentication..." : "Loading invite details..."}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // If redirecting to login, show loading
  if (status === "unauthenticated") {
    return (
      <div className="flex min-h-screen items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">Redirecting to login...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !group) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Invalid Invite</CardTitle>
            <CardDescription>
              This invite link is invalid or has expired
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/dashboard")} className="w-full">
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Join {group.name}</CardTitle>
          <CardDescription>
            You've been invited to join this accountability group
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            {group.description && (
              <div>
                <h3 className="text-sm font-medium mb-1">About</h3>
                <p className="text-sm text-muted-foreground">{group.description}</p>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{group._count.members} members</span>
            </div>
            <div className="text-sm text-muted-foreground">
              Owner: {group.owner.name || group.owner.email}
            </div>
          </div>

          <Button
            onClick={handleJoin}
            disabled={isJoining}
            className="w-full"
            size="lg"
          >
            {isJoining ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Joining...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Join Group
              </>
            )}
          </Button>

          <Button
            variant="outline"
            onClick={() => router.push("/dashboard")}
            className="w-full"
          >
            Cancel
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
