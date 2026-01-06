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

    const projects = await prisma.project.findMany({
      where: {
        ...(kitType && { plan: kitType }),
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Transform clients to projects
    type Project = {
      id: string
      user_id: string
      kit_type: 'LAUNCH' | 'GROWTH'
      current_day_of_14: number | null
      next_from_us: string | null
      next_from_you: string | null
      onboarding_finished: boolean
      onboarding_percent: number
      created_at: string
      updated_at: string
      email: string | null
      phases: Array<{
        id: string
        project_id: string
        phase_number: number
        phase_id: string
        title: string
        subtitle: string | null
        day_range: string
        status: 'NOT_STARTED' | 'IN_PROGRESS' | 'WAITING_ON_CLIENT' | 'DONE'
        started_at: string | null
        completed_at: string | null
        created_at: string
        updated_at: string
        checklist_items: Array<{
          id: string
          phase_id: string
          label: string
          is_done: boolean
          sort_order: number
          created_at: string
          updated_at: string
        }>
        phase_links: any[]
      }>
    }

    const formattedProjects = projects.map((project) => {
      const structure = getPhaseStructureForKitType(project.plan)

      // Parse phasesState from JSON
      let phasesState: Record<
        string,
        {
          status: 'NOT_STARTED' | 'IN_PROGRESS' | 'WAITING_ON_CLIENT' | 'DONE'
          started_at?: string | null
          completed_at?: string | null
          checklist: { [label: string]: boolean }
        }
      > = {}

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
        phasesState = {}
      }

      const mergedPhases = mergePhaseStructureWithState(structure, phasesState)

      type MergedPhase = ReturnType<typeof mergePhaseStructureWithState>[number]

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

      return {
        id: project.id,
        user_id: project.userId,
        kit_type: project.plan,
        current_day_of_14: project.currentDayOf14,
        next_from_us: project.nextFromUs,
        next_from_you: project.nextFromYou,
        onboarding_finished: true, // Projects are created after onboarding
        onboarding_percent: 100,
        created_at: project.createdAt.toISOString(),
        updated_at: project.updatedAt.toISOString(),
        email: project.email,
        phases,
      }
    })

    // Filter by status
    let filteredProjects: Project[] = formattedProjects
    if (status) {
      filteredProjects = formattedProjects.filter((project: Project) => {
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