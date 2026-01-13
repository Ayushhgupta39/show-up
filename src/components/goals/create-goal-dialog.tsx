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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Target, Plus, X } from "lucide-react"
import { toast } from "sonner"

interface CreateGoalDialogProps {
  groupId: string
}

export function CreateGoalDialog({ groupId }: CreateGoalDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [goalType, setGoalType] = useState<"short_term" | "long_term">("short_term")
  const [formData, setFormData] = useState({
    title: "",
    description: "",
  })
  const [items, setItems] = useState<string[]>([""])
  const [dateRange, setDateRange] = useState({
    startDate: "",
    endDate: "",
  })
  const [milestones, setMilestones] = useState<{ date: string; text: string }[]>([
    { date: "", text: "" },
  ])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const payload =
        goalType === "short_term"
          ? {
              title: formData.title,
              description: formData.description,
              type: "short_term",
              items: items
                .filter((item) => item.trim())
                .map((item, index) => ({
                  id: `item-${Date.now()}-${index}`,
                  text: item,
                  completed: false,
                })),
            }
          : {
              title: formData.title,
              description: formData.description,
              type: "long_term",
              startDate: new Date(dateRange.startDate).toISOString(),
              endDate: new Date(dateRange.endDate).toISOString(),
              milestones: milestones
                .filter((m) => m.date && m.text.trim())
                .map((m) => ({
                  date: new Date(m.date).toISOString(),
                  text: m.text,
                  completed: false,
                })),
            }

      const response = await fetch(`/api/groups/${groupId}/goals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || "Failed to create goal")
        return
      }

      toast.success("Goal created successfully!")
      setOpen(false)
      resetForm()
      router.refresh()
    } catch (error) {
      toast.error("Something went wrong. Please try again.")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({ title: "", description: "" })
    setItems([""])
    setDateRange({ startDate: "", endDate: "" })
    setMilestones([{ date: "", text: "" }])
  }

  const addItem = () => {
    setItems([...items, ""])
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, value: string) => {
    const newItems = [...items]
    newItems[index] = value
    setItems(newItems)
  }

  const addMilestone = () => {
    setMilestones([...milestones, { date: "", text: "" }])
  }

  const removeMilestone = (index: number) => {
    setMilestones(milestones.filter((_, i) => i !== index))
  }

  const updateMilestone = (index: number, field: "date" | "text", value: string) => {
    const newMilestones = [...milestones]
    newMilestones[index][field] = value
    setMilestones(newMilestones)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Target className="mr-2 h-4 w-4" />
          Add Goal
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create a new goal</DialogTitle>
            <DialogDescription>
              Set short-term or long-term goals for your group
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Tabs value={goalType} onValueChange={(v) => setGoalType(v as any)}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="short_term">Short-Term</TabsTrigger>
                <TabsTrigger value="long_term">Long-Term</TabsTrigger>
              </TabsList>
              <TabsContent value="short_term" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Goal Title</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Launch MVP"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="What is this goal about?"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Checklist Items</Label>
                  {items.map((item, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        placeholder={`Item ${index + 1}`}
                        value={item}
                        onChange={(e) => updateItem(index, e.target.value)}
                        required
                      />
                      {items.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addItem}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Item
                  </Button>
                </div>
              </TabsContent>
              <TabsContent value="long_term" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title-long">Goal Title</Label>
                  <Input
                    id="title-long"
                    placeholder="e.g., Master React in 6 months"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description-long">Description (Optional)</Label>
                  <Textarea
                    id="description-long"
                    placeholder="What is this goal about?"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={dateRange.startDate}
                      onChange={(e) =>
                        setDateRange({ ...dateRange, startDate: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={dateRange.endDate}
                      onChange={(e) =>
                        setDateRange({ ...dateRange, endDate: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Milestones</Label>
                  {milestones.map((milestone, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        type="date"
                        value={milestone.date}
                        onChange={(e) =>
                          updateMilestone(index, "date", e.target.value)
                        }
                        required
                      />
                      <Input
                        placeholder="Milestone description"
                        value={milestone.text}
                        onChange={(e) =>
                          updateMilestone(index, "text", e.target.value)
                        }
                        required
                      />
                      {milestones.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeMilestone(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addMilestone}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Milestone
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Goal"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
