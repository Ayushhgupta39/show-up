"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { LogOut, User } from "lucide-react"

interface DashboardNavProps {
  user: {
    id: string
    email: string
    name?: string | null
  }
}

export function DashboardNav({ user }: DashboardNavProps) {
  const pathname = usePathname()

  const getInitials = (name?: string | null) => {
    if (!name) return user.email.charAt(0).toUpperCase()
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center px-4">
        <div className="flex items-center flex-1 min-w-0">
          <Link href="/dashboard" className="flex items-center space-x-2 mr-4 md:mr-6 shrink-0">
            <span className="text-lg md:text-xl font-bold">Show-up</span>
          </Link>
          <nav className="flex items-center space-x-3 md:space-x-6 text-xs md:text-sm font-medium overflow-x-auto">
            <Link
              href="/dashboard"
              className={`transition-colors hover:text-foreground/80 whitespace-nowrap ${
                pathname === "/dashboard"
                  ? "text-foreground"
                  : "text-foreground/60"
              }`}
            >
              Dashboard
            </Link>
            <Link
              href="/browse-groups"
              className={`transition-colors hover:text-foreground/80 whitespace-nowrap ${
                pathname === "/browse-groups"
                  ? "text-foreground"
                  : "text-foreground/60"
              }`}
            >
              Browse Groups
            </Link>
          </nav>
        </div>
        <div className="ml-2 md:ml-4 flex items-center shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9">
                  <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user.name}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/" })}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
