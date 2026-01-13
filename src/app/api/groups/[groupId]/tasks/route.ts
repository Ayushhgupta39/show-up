import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth/auth"
import prisma from "@/lib/db/prisma"
import { createTaskSchema } from "@/lib/validations/task"
import { getStartOfDayInTimezone } from "@/lib/utils/date"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { groupId } = await params
    const { searchParams } = new URL(req.url)
    const date = searchParams.get("date")
    const userId = searchParams.get("userId")
    const status = searchParams.get("status")

    // Check if user is a member
    const membership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
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

    const tasks = await prisma.dailyTask.findMany({
      where: {
        groupId,
        ...(date && { date: new Date(date) }),
        ...(userId && { userId }),
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
      orderBy: {
        date: "desc",
      },
    })

    return NextResponse.json({ tasks })
  } catch (error) {
    console.error("Get tasks error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { groupId } = await params

    // Check if user is a member
    const membership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
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

    const body = await req.json()
    const validatedFields = createTaskSchema.safeParse(body)

    if (!validatedFields.success) {
      return NextResponse.json(
        { error: "Invalid fields", details: validatedFields.error.errors },
        { status: 400 }
      )
    }

    const { title, description, date } = validatedFields.data

    // CRITICAL: Normalize date to start of day in user's timezone
    const userTimezone = session.user.timezone
    const normalizedDate = getStartOfDayInTimezone(new Date(date), userTimezone)

    // CRITICAL: Check if task already exists for this user, group, and date
    const existingTask = await prisma.dailyTask.findUnique({
      where: {
        groupId_userId_date: {
          groupId,
          userId: session.user.id,
          date: normalizedDate,
        },
      },
    })

    if (existingTask) {
      return NextResponse.json(
        { error: "You have already posted a task for this date in this group" },
        { status: 409 }
      )
    }

    // Create task
    const task = await prisma.dailyTask.create({
      data: {
        groupId,
        userId: session.user.id,
        title,
        description,
        date: normalizedDate,
        status: "pending",
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

    return NextResponse.json({ task }, { status: 201 })
  } catch (error) {
    console.error("Create task error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
