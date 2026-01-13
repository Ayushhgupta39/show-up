import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, Flame } from "lucide-react"

interface GroupCardProps {
  group: {
    id: string
    name: string
    description?: string | null
    role?: string
    _count?: {
      members: number
    }
  }
  streak?: {
    currentStreak: number
    bestStreak: number
  }
  pendingCount?: number
}

export function GroupCard({ group, streak, pendingCount }: GroupCardProps) {
  return (
    <Link href={`/group/${group.id}`}>
      <Card className="transition-all hover:shadow-md">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle>{group.name}</CardTitle>
              {group.description && (
                <CardDescription className="line-clamp-2">
                  {group.description}
                </CardDescription>
              )}
            </div>
            {group.role === "admin" && (
              <Badge variant="secondary" className="ml-2">
                Admin
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {group._count && (
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{group._count.members} members</span>
              </div>
            )}
            {streak && (
              <div className="flex items-center gap-1">
                <Flame className="h-4 w-4 text-orange-500" />
                <span>{streak.currentStreak} day streak</span>
              </div>
            )}
          </div>
          {pendingCount !== undefined && pendingCount > 0 && (
            <div className="mt-3">
              <Badge variant="destructive">
                {pendingCount} pending task{pendingCount > 1 ? "s" : ""}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
