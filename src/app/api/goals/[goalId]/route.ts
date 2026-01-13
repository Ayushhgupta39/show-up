import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth/auth"
import prisma from "@/lib/db/prisma"
import { updateGoalSchema } from "@/lib/validations/goal"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ goalId: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { goalId } = await params

    const goal = await prisma.goal.findUnique({
      where: { id: goalId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        group: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (!goal) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 })
    }

    // Check if user is a member of the group
    const membership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId: goal.groupId,
          userId: session.user.id,
        },
      },
    })

    if (!membership) {
      return NextResponse.json(
        { error: "Not a member of this group" },
        { status: 403 }
      )
    }

    return NextResponse.json({ goal })
  } catch (error) {
    console.error("Get goal error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ goalId: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { goalId } = await params

    const goal = await prisma.goal.findUnique({
      where: { id: goalId },
    })

    if (!goal) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 })
    }

    // Only goal owner can update
    if (goal.userId !== session.user.id) {
      return NextResponse.json(
        { error: "You can only update your own goals" },
        { status: 403 }
      )
    }

    const body = await req.json()
    const validatedFields = updateGoalSchema.safeParse(body)

    if (!validatedFields.success) {
      return NextResponse.json(
        { error: "Invalid fields", details: validatedFields.error.errors },
        { status: 400 }
      )
    }

    const { title, description, items, startDate, endDate, milestones, status } =
      validatedFields.data

    const updatedGoal = await prisma.goal.update({
      where: { id: goalId },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(items && { items }),
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate && { endDate: new Date(endDate) }),
        ...(milestones && { milestones }),
        ...(status && { status }),
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

    return NextResponse.json({ goal: updatedGoal })
  } catch (error) {
    console.error("Update goal error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ goalId: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { goalId } = await params

    const goal = await prisma.goal.findUnique({
      where: { id: goalId },
    })

    if (!goal) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 })
    }

    // Only goal owner can delete
    if (goal.userId !== session.user.id) {
      return NextResponse.json(
        { error: "You can only delete your own goals" },
        { status: 403 }
      )
    }

    await prisma.goal.delete({
      where: { id: goalId },
    })

    return NextResponse.json({ message: "Goal deleted successfully" })
  } catch (error) {
    console.error("Delete goal error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
