"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Link2, Copy, RefreshCw, Trash2, Check } from "lucide-react"
import { toast } from "sonner"

interface InviteLinkManagerProps {
  groupId: string
  initialInviteToken?: string | null
}

export function InviteLinkManager({ groupId, initialInviteToken }: InviteLinkManagerProps) {
  const [inviteToken, setInviteToken] = useState(initialInviteToken)
  const [isLoading, setIsLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const inviteUrl = inviteToken
    ? `${window.location.origin}/invite/${inviteToken}`
    : null

  const generateInviteLink = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/groups/${groupId}/invite`, {
        method: "POST",
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || "Failed to generate invite link")
        return
      }

      setInviteToken(data.inviteToken)
      toast.success("Invite link generated!")
    } catch (error) {
      toast.error("Something went wrong. Please try again.")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const revokeInviteLink = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/groups/${groupId}/invite`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || "Failed to revoke invite link")
        return
      }

      setInviteToken(null)
      toast.success("Invite link revoked")
    } catch (error) {
      toast.error("Something went wrong. Please try again.")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = async () => {
    if (!inviteUrl) return

    try {
      await navigator.clipboard.writeText(inviteUrl)
      setCopied(true)
      toast.success("Invite link copied to clipboard!")
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error("Failed to copy to clipboard")
      console.error(error)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="h-5 w-5" />
          Invite Link
        </CardTitle>
        <CardDescription>
          Share this link to allow anyone to join the group instantly
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {inviteUrl ? (
          <>
            <div className="flex gap-2">
              <Input value={inviteUrl} readOnly className="font-mono text-sm" />
              <Button
                onClick={copyToClipboard}
                size="icon"
                variant="outline"
                className="shrink-0"
              >
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={generateInviteLink}
                disabled={isLoading}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Regenerate
              </Button>
              <Button
                onClick={revokeInviteLink}
                disabled={isLoading}
                variant="destructive"
                size="sm"
                className="flex-1"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Revoke
              </Button>
            </div>
          </>
        ) : (
          <Button
            onClick={generateInviteLink}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              "Generating..."
            ) : (
              <>
                <Link2 className="mr-2 h-4 w-4" />
                Generate Invite Link
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
