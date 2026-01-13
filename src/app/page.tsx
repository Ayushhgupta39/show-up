import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <main className="flex max-w-3xl flex-col items-center justify-center space-y-8 text-center">
        <div className="space-y-4">
          <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
            Show-Up
          </h1>
          <p className="text-xl text-muted-foreground sm:text-2xl">
            Form groups. Commit daily. Stay accountable.
          </p>
        </div>

        <div className="max-w-lg space-y-4 text-muted-foreground">
          <p>
            Show-up is an accountability platform where you form groups with others
            and publicly commit to daily tasks.
          </p>
          <p className="font-semibold">
            If you don&apos;t show up, everyone sees it.
          </p>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row">
          <Button asChild size="lg">
            <Link href="/signup">Get Started</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/login">Log In</Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-6 pt-8 sm:grid-cols-3">
          <div className="space-y-2">
            <h3 className="font-semibold">Daily Tasks</h3>
            <p className="text-sm text-muted-foreground">
              Post one task per day in each group you join
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold">Public Accountability</h3>
            <p className="text-sm text-muted-foreground">
              Pending tasks are visible to all group members
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold">Build Streaks</h3>
            <p className="text-sm text-muted-foreground">
              Complete tasks daily to maintain your streak
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
