import { z } from "zod"

export const createGroupSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(500).optional(),
})

export const updateGroupSchema = z.object({
  name: z.string().min(1, "Name is required").max(100).optional(),
  description: z.string().max(500).optional(),
})

export const joinRequestSchema = z.object({
  groupId: z.string().min(1, "Group ID is required"),
  message: z.string().max(300).optional(),
})

export const handleJoinRequestSchema = z.object({
  requestId: z.string().min(1, "Request ID is required"),
  action: z.enum(["approve", "reject"]),
})

export type CreateGroupInput = z.infer<typeof createGroupSchema>
export type UpdateGroupInput = z.infer<typeof updateGroupSchema>
export type JoinRequestInput = z.infer<typeof joinRequestSchema>
export type HandleJoinRequestInput = z.infer<typeof handleJoinRequestSchema>
