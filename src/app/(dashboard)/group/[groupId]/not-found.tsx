import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Users, ArrowLeft, Search } from "lucide-react"

export default function GroupNotFound() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-6 rounded-full bg-muted p-4">
            <Users className="h-12 w-12 text-muted-foreground" />
          </div>
          <h1 className="mb-2 text-2xl font-bold">Group Not Found</h1>
          <p className="mb-6 text-muted-foreground">
            This group doesn&apos;t exist or you don&apos;t have access to it.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button asChild variant="default">
              <Link href="/dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/browse-groups">
                <Search className="mr-2 h-4 w-4" />
                Browse Groups
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
