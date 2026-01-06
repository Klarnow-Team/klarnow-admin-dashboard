import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const revalidate = 0

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ project_id: string }> }
) {
  try {
    const { project_id } = await params
    
    // Fetch project from database
    const project = await prisma.project.findUnique({
      where: { id: project_id },
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      project: {
        id: project.id,
        email: project.email,
        plan: project.plan,
        current_day_of_14: project.currentDayOf14,
        next_from_us: project.nextFromUs,
        next_from_you: project.nextFromYou,
        started_at: project.startedAt?.toISOString() || null,
      },
    })
  } catch (error: any) {
    console.error('❌ Error in GET /api/projects/[project_id]:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ project_id: string }> }
) {
  try {
    const { project_id } = await params
    const body = await request.json()
    const { current_day_of_14, next_from_us, next_from_you } = body

    // Check if project exists
    const project = await prisma.project.findUnique({
      where: { id: project_id },
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Build update data
    const updateData: any = {}
    
    if (current_day_of_14 !== undefined) {
      if (current_day_of_14 < 1 || current_day_of_14 > 14) {
        return NextResponse.json(
          { error: 'current_day_of_14 must be between 1 and 14' },
          { status: 400 }
        )
      }
      updateData.currentDayOf14 = current_day_of_14
    }

    if (next_from_us !== undefined) {
      updateData.nextFromUs = next_from_us
    }

    if (next_from_you !== undefined) {
      updateData.nextFromYou = next_from_you
    }

    // Update project
    await prisma.project.update({
      where: { id: project_id },
      data: updateData,
    })

    console.log('✅ Project progress updated successfully:', { project_id, updateData })

    return NextResponse.json({
      success: true,
      message: 'Project progress updated successfully',
    })
  } catch (error: any) {
    console.error('❌ Error in PATCH /api/projects/[project_id]:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
