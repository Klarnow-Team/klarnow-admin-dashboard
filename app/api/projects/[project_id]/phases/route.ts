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
    
    // Fetch client with phase states
    const client = await prisma.client.findUnique({
      where: { id: project_id },
      include: {
        phaseStates: true,
      },
    })

    if (!client) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Get phase structure for this kit type
    const structure = getPhaseStructureForKitType(client.plan)
    
    // Build phases state from ClientPhaseState records
const phasesState: Record<string, {
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'WAITING_ON_CLIENT' | 'DONE'
  started_at?: string | null
  completed_at?: string | null
  checklist: { [label: string]: boolean }
}> = {}

client.phaseStates.forEach((phaseState: typeof client.phaseStates[number]) => {
  let checklist: { [label: string]: boolean } = {}

  // Handle checklist from database JSON field
  try {
    if (phaseState.checklist) {
      let checklistData = phaseState.checklist

      if (typeof checklistData === 'string') {
        try {
          checklistData = JSON.parse(checklistData)
        } catch (e) {
          console.error(`❌ Failed to parse checklist JSON for ${phaseState.phaseId}:`, e)
          checklistData = {}
        }
      }

      if (
        typeof checklistData === 'object' &&
        checklistData !== null &&
        !Array.isArray(checklistData)
      ) {
        const checklistObj = checklistData as any
        Object.keys(checklistObj).forEach(key => {
          const value = checklistObj[key]
          checklist[key] = value === true || value === 'true' || value === 1
        })
      }
    }
  } catch (err) {
    console.error(`❌ Error processing checklist for ${phaseState.phaseId}:`, err)
    checklist = {}
  }

  phasesState[phaseState.phaseId] = {
    status: phaseState.status,
    started_at: phaseState.startedAt?.toISOString() || null,
    completed_at: phaseState.completedAt?.toISOString() || null,
    checklist,
  }
})

    // Merge structure with state
    const mergedPhases = mergePhaseStructureWithState(structure, phasesState)

    // Transform to the format expected by the frontend
    const phases = mergedPhases.map(phase => {
      const checklistItems = phase.checklist.map((item, index) => ({
        id: `${client.id}-${phase.phase_id}-${index}`,
        phase_id: phase.phase_id,
        label: item.label,
        is_done: item.is_done,
        sort_order: index + 1,
        created_at: client.createdAt.toISOString(),
        updated_at: client.updatedAt.toISOString(),
      }))

      return {
        id: `${client.id}-${phase.phase_id}`,
        project_id: client.id,
        phase_number: phase.phase_number,
        phase_id: phase.phase_id,
        title: phase.title,
        subtitle: phase.subtitle,
        day_range: phase.day_range,
        status: phase.status,
        started_at: phase.started_at,
        completed_at: phase.completed_at,
        created_at: client.createdAt.toISOString(),
        updated_at: client.updatedAt.toISOString(),
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
