import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth/auth"
import prisma from "@/lib/db/prisma"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { token } = await params

    // Find group by invite token
    const group = await prisma.group.findUnique({
      where: { inviteToken: token },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            members: true,
          },
        },
      },
    })

    if (!group) {
      return NextResponse.json(
        { error: "Invalid or expired invite link" },
        { status: 404 }
      )
    }

    return NextResponse.json({ group })
  } catch (error) {
    console.error("Get invite details error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { token } = await params

    // Find group by invite token
    const group = await prisma.group.findUnique({
      where: { inviteToken: token },
    })

    if (!group) {
      return NextResponse.json(
        { error: "Invalid or expired invite link" },
        { status: 404 }
      )
    }

    // Check if already a member
    const existingMembership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId: group.id,
          userId: session.user.id,
        },
      },
    })

    if (existingMembership) {
      return NextResponse.json(
        { error: "Already a member of this group", groupId: group.id },
        { status: 409 }
      )
    }

    // Add user to group
    await prisma.groupMember.create({
      data: {
        groupId: group.id,
        userId: session.user.id,
        role: "member",
      },
    })

    return NextResponse.json({
      message: "Successfully joined group",
      groupId: group.id,
    })
  } catch (error) {
    console.error("Join via invite error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
