import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getPhaseStructureForKitType, mergePhaseStructureWithState } from '@/lib/phase-structure'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ project_id: string }> }
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

    // Get phase structure for this kit type
    const structure = getPhaseStructureForKitType(project.plan)
    
    // Build phases state from phasesState JSON field
    const phasesState: Record<string, {
      status: 'NOT_STARTED' | 'IN_PROGRESS' | 'WAITING_ON_CLIENT' | 'DONE'
      started_at?: string | null
      completed_at?: string | null
      checklist: { [label: string]: boolean }
    }> = {}

    try {
      if (project.phasesState && typeof project.phasesState === 'object') {
        const state = project.phasesState as any
        Object.keys(state).forEach((phaseId) => {
          const phaseData = state[phaseId]
          phasesState[phaseId] = {
            status: phaseData.status || 'NOT_STARTED',
            started_at: phaseData.started_at || null,
            completed_at: phaseData.completed_at || null,
            checklist: phaseData.checklist || {},
          }
        })
      }
    } catch (error) {
      console.error('Error parsing phasesState:', error)
    }

    // Merge structure with state
    const mergedPhases = mergePhaseStructureWithState(structure, phasesState)

    type MergedPhase = ReturnType<typeof mergePhaseStructureWithState>[number]

    // Transform to the format expected by the frontend
    const phases = mergedPhases.map((phase: MergedPhase) => {
      const checklistItems = phase.checklist.map((item: { label: string; is_done: boolean }, index: number) => ({
        id: `${project.id}-${phase.phase_id}-${index}`,
        phase_id: phase.phase_id,
        label: item.label,
        is_done: item.is_done,
        sort_order: index + 1,
        created_at: project.createdAt.toISOString(),
        updated_at: project.updatedAt.toISOString(),
      }))

      return {
        id: `${project.id}-${phase.phase_id}`,
        project_id: project.id,
        phase_number: phase.phase_number,
        phase_id: phase.phase_id,
        title: phase.title,
        subtitle: phase.subtitle,
        day_range: phase.day_range,
        status: phase.status,
        started_at: phase.started_at,
        completed_at: phase.completed_at,
        created_at: project.createdAt.toISOString(),
        updated_at: project.updatedAt.toISOString(),
        checklist_items: checklistItems,
        phase_links: [],
      }
    })
    
    return NextResponse.json({
      phases,
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })
  } catch (error: any) {
    console.error('❌ Error in GET /api/projects/[project_id]/phases:', error)
    return NextResponse.json(
      { 
        error: error.message || 'Internal server error',
        phases: []
      },
      { status: 500 }
    )
  }
}
