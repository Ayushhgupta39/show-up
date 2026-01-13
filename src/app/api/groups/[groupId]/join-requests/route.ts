import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth/auth"
import prisma from "@/lib/db/prisma"
import { joinRequestSchema } from "@/lib/validations/group"

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

    // Check if user is admin
    const membership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId: session.user.id,
        },
      },
    })

    if (!membership || membership.role !== "admin") {
      return NextResponse.json(
        { error: "Only admins can view join requests" },
        { status: 403 }
      )
    }

    const joinRequests = await prisma.joinRequest.findMany({
      where: {
        groupId,
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
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json({ joinRequests })
  } catch (error) {
    console.error("Get join requests error:", error)
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

    const body = await req.json()
    const validatedFields = joinRequestSchema.safeParse({
      ...body,
      groupId,
    })

    if (!validatedFields.success) {
      return NextResponse.json(
        { error: "Invalid fields", details: validatedFields.error.errors },
        { status: 400 }
      )
    }

    // Check if group exists
    const group = await prisma.group.findUnique({
      where: { id: groupId },
    })

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 })
    }

    // Check if already a member
    const existingMembership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId: session.user.id,
        },
      },
    })

    if (existingMembership) {
      return NextResponse.json(
        { error: "Already a member of this group" },
        { status: 409 }
      )
    }

    // Check if request already exists
    const existingRequest = await prisma.joinRequest.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId: session.user.id,
        },
      },
    })

    if (existingRequest) {
      return NextResponse.json(
        { error: "Join request already exists" },
        { status: 409 }
      )
    }

    // Create join request
    const joinRequest = await prisma.joinRequest.create({
      data: {
        groupId,
        userId: session.user.id,
        message: validatedFields.data.message,
      },
    })

    return NextResponse.json({ joinRequest }, { status: 201 })
  } catch (error) {
    console.error("Create join request error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { groupId } = await params

    // Check if user is admin
    const membership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId: session.user.id,
        },
      },
    })

    if (!membership || membership.role !== "admin") {
      return NextResponse.json(
        { error: "Only admins can handle join requests" },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { requestId, action } = body

    if (!requestId || !["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    }

    const joinRequest = await prisma.joinRequest.findUnique({
      where: { id: requestId },
    })

    if (!joinRequest || joinRequest.groupId !== groupId) {
      return NextResponse.json(
        { error: "Join request not found" },
        { status: 404 }
      )
    }

    if (action === "approve") {
      // Create group membership
      await prisma.groupMember.create({
        data: {
          groupId,
          userId: joinRequest.userId,
          role: "member",
        },
      })

      // Update request status
      await prisma.joinRequest.update({
        where: { id: requestId },
        data: { status: "approved" },
      })

      return NextResponse.json({
        message: "Join request approved",
      })
    } else {
      // Reject request
      await prisma.joinRequest.update({
        where: { id: requestId },
        data: { status: "rejected" },
      })

      return NextResponse.json({
        message: "Join request rejected",
      })
    }
  } catch (error) {
    console.error("Handle join request error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
