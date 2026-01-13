import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth/auth"
import prisma from "@/lib/db/prisma"
import { updateTaskSchema } from "@/lib/validations/task"
import { updateStreakOnTaskCompletion, breakStreak } from "@/lib/services/streak.service"
import { getStartOfDayInTimezone } from "@/lib/utils/date"

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { taskId } = await params

    const task = await prisma.dailyTask.findUnique({
      where: { id: taskId },
    })

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    // Only task owner can update
    if (task.userId !== session.user.id) {
      return NextResponse.json(
        { error: "You can only update your own tasks" },
        { status: 403 }
      )
    }

    const body = await req.json()
    const validatedFields = updateTaskSchema.safeParse(body)

    if (!validatedFields.success) {
      return NextResponse.json(
        { error: "Invalid fields", details: validatedFields.error.errors },
        { status: 400 }
      )
    }

    const { title, description, status } = validatedFields.data

    // CRITICAL: Prevent editing task details after day has passed
    const userTimezone = session.user.timezone
    const now = new Date()
    const taskDate = task.date
    const startOfToday = getStartOfDayInTimezone(now, userTimezone)

    // Allow status updates anytime, but prevent title/description edits after day has passed
    if ((title || description) && taskDate < startOfToday) {
      return NextResponse.json(
        { error: "Cannot edit task details after the day has passed" },
        { status: 400 }
      )
    }

    // Handle status changes and streak updates
    if (status && status !== task.status) {
      if (status === "completed") {
        // Update streak
        await updateStreakOnTaskCompletion(
          task.userId,
          task.groupId,
          task.date,
          userTimezone
        )

        // Update task with completed status and timestamp
        const updatedTask = await prisma.dailyTask.update({
          where: { id: taskId },
          data: {
            status: "completed",
            completedAt: now,
            ...(title && { title }),
            ...(description !== undefined && { description }),
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        })

        return NextResponse.json({ task: updatedTask })
      } else if (status === "missed") {
        // Break streak
        await breakStreak(task.userId, task.groupId)

        // Update task with missed status
        const updatedTask = await prisma.dailyTask.update({
          where: { id: taskId },
          data: {
            status: "missed",
            ...(title && { title }),
            ...(description !== undefined && { description }),
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        })

        return NextResponse.json({ task: updatedTask })
      } else if (status === "pending") {
        // Update task back to pending
        const updatedTask = await prisma.dailyTask.update({
          where: { id: taskId },
          data: {
            status: "pending",
            completedAt: null,
            ...(title && { title }),
            ...(description !== undefined && { description }),
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        })

        return NextResponse.json({ task: updatedTask })
      }
    }

    // Update task without status change
    const updatedTask = await prisma.dailyTask.update({
      where: { id: taskId },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json({ task: updatedTask })
  } catch (error) {
    console.error("Update task error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { taskId } = await params

    const task = await prisma.dailyTask.findUnique({
      where: { id: taskId },
    })

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    // Only task owner can delete
    if (task.userId !== session.user.id) {
      return NextResponse.json(
        { error: "You can only delete your own tasks" },
        { status: 403 }
      )
    }

    // Only allow deletion on the same day
    const userTimezone = session.user.timezone
    const now = new Date()
    const taskDate = task.date
    const startOfToday = getStartOfDayInTimezone(now, userTimezone)

    if (taskDate < startOfToday) {
      return NextResponse.json(
        { error: "Cannot delete task after the day has passed" },
        { status: 400 }
      )
    }

    await prisma.dailyTask.delete({
      where: { id: taskId },
    })

    return NextResponse.json({ message: "Task deleted successfully" })
  } catch (error) {
    console.error("Delete task error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
