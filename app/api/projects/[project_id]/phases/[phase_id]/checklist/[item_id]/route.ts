import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getPhaseStructureForKitType } from '@/lib/phase-structure'

export const revalidate = 0

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ project_id: string; phase_id: string; item_id: string }> }
) {
  try {
    const { project_id } = await params
    const body = await request.json()
    const { is_done, phase_id: phaseIdString, label } = body

    console.log('📥 Checklist update request:', { project_id, body })

    if (is_done === undefined) {
      return NextResponse.json(
        { error: 'is_done is required' },
        { status: 400 }
      )
    }

    if (!phaseIdString) {
      return NextResponse.json(
        { error: 'phase_id is required' },
        { status: 400 }
      )
    }

    if (!label) {
      console.error('❌ Missing label in request body:', body)
      return NextResponse.json(
        { error: 'label is required' },
        { status: 400 }
      )
    }

    // Check if project exists and get kit type
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

    // Get phase state or initialize
    let phaseState = phasesState[phaseIdString] || {
      status: 'NOT_STARTED',
      started_at: null,
      completed_at: null,
      checklist: {},
    }

    // Get checklist from phase state or initialize from structure
    let checklist: { [label: string]: boolean } = phaseState.checklist || {}
    
    // If checklist is empty, initialize from phase structure
    if (Object.keys(checklist).length === 0) {
      const structure = getPhaseStructureForKitType(project.plan)
      const phaseStructure = structure.find(p => p.phase_id === phaseIdString)
      if (phaseStructure) {
        phaseStructure.checklist_labels.forEach(l => {
          checklist[l] = false
        })
      }
    }

    // Update the checklist item
    checklist[label] = is_done

    // Ensure checklist is a plain object with boolean values only
    const cleanChecklist: { [key: string]: boolean } = {}
    Object.keys(checklist).forEach(key => {
      cleanChecklist[key] = Boolean(checklist[key])
    })

    console.log('📝 Updating checklist:', { 
      project_id, 
      phaseIdString, 
      label, 
      is_done, 
      originalChecklist: checklist,
      cleanChecklist,
    })

    // Update phase state with new checklist
    phasesState[phaseIdString] = {
      ...phaseState,
      checklist: cleanChecklist,
    }

    // Update project with new phasesState
    const updated = await prisma.project.update({
      where: { id: project_id },
      data: {
        phasesState: phasesState,
      },
    })

    console.log('✅ Phase state updated in database:', { 
      projectId: updated.id,
      phaseId: phaseIdString,
      checklist: phasesState[phaseIdString].checklist,
    })

    console.log('✅ Checklist item updated successfully:', { project_id, phaseIdString, label, is_done })

    return NextResponse.json({
      success: true,
      message: 'Checklist item updated successfully',
      checklist: cleanChecklist,
      phase_id: phaseIdString,
    })
  } catch (error: any) {
    console.error('❌ Error in PATCH /api/projects/[project_id]/phases/[phase_id]/checklist/[item_id]:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
