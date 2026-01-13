import { z } from "zod"

export const createGoalSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(1000).optional(),
  type: z.enum(["short_term", "long_term"]),
  // For short-term goals
  items: z.array(z.object({
    id: z.string(),
    text: z.string(),
    completed: z.boolean(),
  })).optional(),
  // For long-term goals
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  milestones: z.array(z.object({
    date: z.string().datetime(),
    text: z.string(),
    completed: z.boolean(),
  })).optional(),
})

export const updateGoalSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  items: z.array(z.object({
    id: z.string(),
    text: z.string(),
    completed: z.boolean(),
  })).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  milestones: z.array(z.object({
    date: z.string().datetime(),
    text: z.string(),
    completed: z.boolean(),
  })).optional(),
  status: z.enum(["active", "completed", "abandoned"]).optional(),
})

export type CreateGoalInput = z.infer<typeof createGoalSchema>
export type UpdateGoalInput = z.infer<typeof updateGoalSchema>
