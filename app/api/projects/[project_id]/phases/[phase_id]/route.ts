import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const revalidate = 0

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ project_id: string; phase_id: string }> }
) {
  try {
    const { project_id } = await params
    
    // Fetch project
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
      },
    })
  } catch (error: any) {
    console.error('❌ Error in GET /api/projects/[project_id]/phases/[phase_id]:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ project_id: string; phase_id: string }> }
) {
  try {
    const { project_id } = await params
    const body = await request.json()
    const { status, phase_id: phaseIdString } = body // phase_id is PHASE_1, PHASE_2, etc.

    if (!phaseIdString) {
      return NextResponse.json(
        { error: 'phase_id is required' },
        { status: 400 }
      )
    }

    if (!status || !['NOT_STARTED', 'IN_PROGRESS', 'WAITING_ON_CLIENT', 'DONE'].includes(status)) {
      return NextResponse.json(
        { error: 'Valid status is required' },
        { status: 400 }
      )
    }

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

    // Get current phasesState
    let phasesState: any = {}
    try {
      if (project.phasesState && typeof project.phasesState === 'object') {
        phasesState = JSON.parse(JSON.stringify(project.phasesState))
      }
    } catch (error) {
      console.error('Error parsing phasesState:', error)
      phasesState = {}
    }

    // Get existing phase state or initialize
    const existingPhaseState = phasesState[phaseIdString] || {
      status: 'NOT_STARTED',
      started_at: null,
      completed_at: null,
      checklist: {},
    }

    const now = new Date().toISOString()

    // Update phase state
    const updatedPhaseState: any = {
      status,
      checklist: existingPhaseState.checklist || {},
    }

    // Set started_at when status changes to IN_PROGRESS or later
    if (status !== 'NOT_STARTED' && !existingPhaseState.started_at) {
      updatedPhaseState.started_at = now
    } else {
      updatedPhaseState.started_at = existingPhaseState.started_at || null
    }

    // Set completed_at when status changes to DONE
    if (status === 'DONE') {
      updatedPhaseState.completed_at = now
    } else {
      updatedPhaseState.completed_at = existingPhaseState.completed_at || null
    }

    // Update phasesState with the new phase state
    phasesState[phaseIdString] = updatedPhaseState

    // Update project with new phasesState
    await prisma.project.update({
      where: { id: project_id },
      data: {
        phasesState: phasesState,
      },
    })

    console.log('✅ Phase status updated successfully:', { project_id, phaseIdString, status })

    return NextResponse.json({
      success: true,
      message: 'Phase status updated successfully',
    })
  } catch (error: any) {
    console.error('❌ Error in PATCH /api/projects/[project_id]/phases/[phase_id]:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
