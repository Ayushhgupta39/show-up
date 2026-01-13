"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus } from "lucide-react"
import { toast } from "sonner"

export function CreateGroupDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || "Failed to create group")
        return
      }

      toast.success("Group created successfully!")
      setOpen(false)
      setFormData({ name: "", description: "" })
      router.refresh()
    } catch (error) {
      toast.error("Something went wrong. Please try again.")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="text-sm md:text-base shrink-0">
          <Plus className="mr-1 md:mr-2 h-4 w-4" />
          <span className="hidden sm:inline">Create Group</span>
          <span className="sm:hidden">Create</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-lg md:text-xl">Create a new group</DialogTitle>
            <DialogDescription className="text-sm md:text-base">
              Create an accountability group and invite others to join
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 md:space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm md:text-base">Group Name</Label>
              <Input
                id="name"
                placeholder="e.g., Morning Writers"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="text-sm md:text-base"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm md:text-base">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="What is this group about?"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="text-sm md:text-base"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading} className="w-full sm:w-auto text-sm md:text-base">
              {isLoading ? "Creating..." : "Create Group"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
