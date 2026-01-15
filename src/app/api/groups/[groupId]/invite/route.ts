import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth/auth"
import prisma from "@/lib/db/prisma"
import { randomBytes } from "crypto"

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
        { error: "Only admins can generate invite links" },
        { status: 403 }
      )
    }

    // Generate a unique invite token
    const inviteToken = randomBytes(16).toString("hex")

    // Update group with new invite token
    const group = await prisma.group.update({
      where: { id: groupId },
      data: { inviteToken },
    })

    return NextResponse.json({
      inviteToken: group.inviteToken,
      inviteUrl: `${process.env.NEXTAUTH_URL}/invite/${group.inviteToken}`,
    })
  } catch (error) {
    console.error("Generate invite token error:", error)
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
        { error: "Only admins can revoke invite links" },
        { status: 403 }
      )
    }

    // Generate a new token to invalidate the old one
    // (Setting to null would violate unique constraint if another group has null)
    const newToken = randomBytes(16).toString("hex")
    await prisma.group.update({
      where: { id: groupId },
      data: { inviteToken: newToken },
    })

    return NextResponse.json({ message: "Invite link revoked" })
  } catch (error) {
    console.error("Revoke invite token error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
