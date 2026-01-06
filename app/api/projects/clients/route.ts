import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const revalidate = 0
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const projects = await prisma.project.findMany({
      select: {
        id: true,
        userId: true,
        name: true,
        email: true,
        plan: true,
        currentDayOf14: true,
        startedAt: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    const formattedProjects = projects.map(
      (project: typeof projects[number]) => ({
        id: project.id,
        user_id: project.userId,
        name: project.name,
        email: project.email,
        plan: project.plan,
        current_day_of_14: project.currentDayOf14,
        started_at: project.startedAt?.toISOString() || null,
        created_at: project.createdAt.toISOString(),
      })
    )

    return NextResponse.json({
      success: true,
      data: formattedProjects,
      count: formattedProjects.length,
    })
  } catch (error: any) {
    console.error('❌ Error in GET /api/projects/clients:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error',
        data: [],
        count: 0,
      },
      { status: 500 }
    )
  }
}