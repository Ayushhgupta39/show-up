"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { JoinGroupDialog } from "@/components/groups/join-group-dialog"
import { Search, Users, CheckCircle } from "lucide-react"

interface Group {
  id: string
  name: string
  description?: string | null
  hasPendingRequest: boolean
  owner: {
    id: string
    name?: string | null
    email: string
  }
  _count: {
    members: number
  }
}

export default function BrowseGroupsPage() {
  const [groups, setGroups] = useState<Group[]>([])
  const [search, setSearch] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null)
  const [joinDialogOpen, setJoinDialogOpen] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchGroups()
    }, 300) // Debounce search input

    return () => clearTimeout(timer)
  }, [search])

  const fetchGroups = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/groups/public?search=${encodeURIComponent(search)}`)
      if (response.ok) {
        const data = await response.json()
        setGroups(data.groups)
      } else {
        console.error("Failed to fetch groups:", response.status)
      }
    } catch (error) {
      console.error("Failed to fetch groups:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleJoinClick = (group: Group) => {
    setSelectedGroup(group)
    setJoinDialogOpen(true)
  }

  const handleJoinSuccess = () => {
    // Refresh the groups list after successful join request
    fetchGroups()
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Browse Groups</h1>
        <p className="text-sm md:text-base text-muted-foreground mt-1">
          Discover and join accountability groups
        </p>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search groups..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 text-sm md:text-base"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8 md:py-12">
          <p className="text-sm md:text-base text-muted-foreground">Loading groups...</p>
        </div>
      ) : groups.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8 md:py-12">
            <p className="text-center text-sm md:text-base text-muted-foreground">
              {search
                ? "No groups found matching your search"
                : "No groups available to join at the moment"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => (
            <Card key={group.id} className="flex flex-col">
              <CardHeader>
                <CardTitle>{group.name}</CardTitle>
                {group.description && (
                  <CardDescription className="line-clamp-2">
                    {group.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-between">
                <div className="mb-4 space-y-2">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{group._count.members} members</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Owner: {group.owner.name || group.owner.email}
                  </p>
                </div>
                {group.hasPendingRequest ? (
                  <Button disabled className="w-full">
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Request Pending
                  </Button>
                ) : (
                  <Button onClick={() => handleJoinClick(group)} className="w-full">
                    Request to Join
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedGroup && (
        <JoinGroupDialog
          group={selectedGroup}
          open={joinDialogOpen}
          onOpenChange={setJoinDialogOpen}
          onSuccess={handleJoinSuccess}
        />
      )}
    </div>
  )
}
