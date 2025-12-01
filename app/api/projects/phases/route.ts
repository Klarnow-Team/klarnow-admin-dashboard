import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { getPhaseStructureForKitType, mergePhaseStructureWithState } from '@/lib/phase-structure'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const kitType = searchParams.get('kit_type') as 'LAUNCH' | 'GROWTH' | null
    const status = searchParams.get('status') as 'NOT_STARTED' | 'IN_PROGRESS' | 'WAITING_ON_CLIENT' | 'DONE' | null

    // ---- FIX: STRONG TYPE THE PRISMA RESPONSE ----
    type ClientWithPhases = Prisma.ClientGetPayload<{
      include: { phaseStates: true }
    }>

    const clients: ClientWithPhases[] = await prisma.client.findMany({
      where: {
        ...(kitType && { plan: kitType }),
      },
      include: {
        phaseStates: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Transform clients to projects
    const projects = clients.map((client) => {
      const structure = getPhaseStructureForKitType(client.plan)

      const phasesState: Record<
        string,
        {
          status: 'NOT_STARTED' | 'IN_PROGRESS' | 'WAITING_ON_CLIENT' | 'DONE'
          started_at?: string | null
          completed_at?: string | null
          checklist: { [label: string]: boolean }
        }
      > = {}

      client.phaseStates.forEach((phaseState: ClientWithPhases['phaseStates'][number]) => {
        let checklist: { [label: string]: boolean } = {}

        try {
          if (phaseState.checklist) {
            let checklistData = phaseState.checklist

            if (typeof checklistData === 'string') {
              try {
                checklistData = JSON.parse(checklistData)
              } catch {
                checklistData = {}
              }
            }

            if (typeof checklistData === 'object' && checklistData !== null && !Array.isArray(checklistData)) {
              Object.keys(checklistData).forEach((key) => {
                const value = (checklistData as any)[key]
                checklist[key] = value === true || value === 'true' || value === 1
              })
            }
          }
        } catch {
          checklist = {}
        }

        phasesState[phaseState.phaseId] = {
          status: phaseState.status,
          started_at: phaseState.startedAt?.toISOString() || null,
          completed_at: phaseState.completedAt?.toISOString() || null,
          checklist,
        }
      })

      const mergedPhases = mergePhaseStructureWithState(structure, phasesState)

      const phases = mergedPhases.map((phase) => {
        const checklistItems = phase.checklist.map((item, index) => ({
          id: `${client.id}-${phase.phase_id}-${index}`,
          phase_id: phase.phase_id,
          label: item.label,
          is_done: item.is_done,
          sort_order: index + 1,
          created_at: client.createdAt.toISOString(),
          updated_at: client.updatedAt.toISOString(),
        }))

        const hasDatabaseChecklist =
          phasesState[phase.phase_id]?.checklist &&
          Object.keys(phasesState[phase.phase_id].checklist).length > 0

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

      return {
        id: client.id,
        user_id: client.userId,
        kit_type: client.plan,
        current_day_of_14: client.currentDayOf14,
        next_from_us: client.nextFromUs,
        next_from_you: client.nextFromYou,
        onboarding_finished: client.onboardingPercent === 100,
        onboarding_percent: client.onboardingPercent,
        created_at: client.createdAt.toISOString(),
        updated_at: client.updatedAt.toISOString(),
        email: client.email,
        phases,
      }
    })

    // Filter by status
    let filteredProjects = projects
    if (status) {
      filteredProjects = projects.filter((project) => {
        return project.phases.some((phase) => phase.status === status)
      })
    }

    return NextResponse.json(
      {
        projects: filteredProjects,
        total: filteredProjects.length,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    )
  } catch (error: any) {
    console.error('❌ Error in GET /api/projects/phases:', error)
    return NextResponse.json(
      {
        error: error.message || 'Internal server error',
        projects: [],
        total: 0,
      },
      { status: 500 }
    )
  }
}