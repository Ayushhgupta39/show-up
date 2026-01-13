import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth/auth"
import prisma from "@/lib/db/prisma"
import { createGroupSchema } from "@/lib/validations/group"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get all groups where user is a member
    const groupMemberships = await prisma.groupMember.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        group: {
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
        },
      },
    })

    const groups = groupMemberships.map((membership) => ({
      ...membership.group,
      role: membership.role,
    }))

    return NextResponse.json({ groups })
  } catch (error) {
    console.error("Get groups error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const validatedFields = createGroupSchema.safeParse(body)

    if (!validatedFields.success) {
      return NextResponse.json(
        { error: "Invalid fields", details: validatedFields.error.errors },
        { status: 400 }
      )
    }

    const { name, description } = validatedFields.data

    // Create group
    const group = await prisma.group.create({
      data: {
        name,
        description,
        ownerId: session.user.id,
        members: {
          create: {
            userId: session.user.id,
            role: "admin",
          },
        },
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json({ group }, { status: 201 })
  } catch (error) {
    console.error("Create group error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
