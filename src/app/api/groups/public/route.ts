import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth/auth"
import prisma from "@/lib/db/prisma"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const search = searchParams.get("search") || ""

    // Get all groups the user is NOT a member of
    const userGroups = await prisma.groupMember.findMany({
      where: { userId: session.user.id },
      select: { groupId: true },
    })

    const userGroupIds = userGroups.map((g) => g.groupId)

    // Find groups user is not a member of
    const groups = await prisma.group.findMany({
      where: {
        id: {
          notIn: userGroupIds,
        },
        ...(search && {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
          ],
        }),
      },
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
      take: 20,
      orderBy: {
        createdAt: "desc",
      },
    })

    // Check if user has pending join requests
    const pendingRequests = await prisma.joinRequest.findMany({
      where: {
        userId: session.user.id,
        groupId: { in: groups.map((g) => g.id) },
        status: "pending",
      },
      select: { groupId: true },
    })

    const pendingRequestGroupIds = new Set(pendingRequests.map((r) => r.groupId))

    const groupsWithRequestStatus = groups.map((group) => ({
      ...group,
      hasPendingRequest: pendingRequestGroupIds.has(group.id),
    }))

    return NextResponse.json({ groups: groupsWithRequestStatus })
  } catch (error) {
    console.error("Get public groups error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
