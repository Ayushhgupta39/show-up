import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth/auth"
import prisma from "@/lib/db/prisma"

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

    const members = await prisma.groupMember.findMany({
      where: { groupId },
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
        joinedAt: "asc",
      },
    })

    return NextResponse.json({ members })
  } catch (error) {
    console.error("Get members error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
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
    const memberIdToRemove = searchParams.get("userId")

    if (!memberIdToRemove) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      )
    }

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
        { error: "Only admins can remove members" },
        { status: 403 }
      )
    }

    // Cannot remove the owner
    const group = await prisma.group.findUnique({
      where: { id: groupId },
    })

    if (group?.ownerId === memberIdToRemove) {
      return NextResponse.json(
        { error: "Cannot remove the group owner" },
        { status: 400 }
      )
    }

    await prisma.groupMember.delete({
      where: {
        groupId_userId: {
          groupId,
          userId: memberIdToRemove,
        },
      },
    })

    return NextResponse.json({ message: "Member removed successfully" })
  } catch (error) {
    console.error("Remove member error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
