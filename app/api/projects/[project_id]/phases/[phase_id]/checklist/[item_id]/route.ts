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

    // Check if client exists and get kit type
    const client = await prisma.client.findUnique({
      where: { id: project_id },
    })

    if (!client) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Find or create phase state
    let phaseState = await prisma.clientPhaseState.findUnique({
      where: {
        clientId_phaseId: {
          clientId: project_id,
          phaseId: phaseIdString,
        },
      },
    })

    // Get checklist from phase state or initialize from structure
    let checklist: { [label: string]: boolean } = {}
    
    if (phaseState && phaseState.checklist) {
      try {
        // Handle MySQL JSON - can be string or object
        let checklistData = phaseState.checklist
        if (typeof checklistData === 'string') {
          checklistData = JSON.parse(checklistData)
        }
        
        if (typeof checklistData === 'object' && checklistData !== null && !Array.isArray(checklistData)) {
          // Convert to proper format with boolean values
          Object.keys(checklistData).forEach(key => {
            checklist[key] = Boolean((checklistData as Record<string, unknown>)[key])
          })
        }
      } catch (error) {
        console.error(`❌ Error parsing checklist from database:`, error)
        // If parsing fails, initialize from structure
        checklist = {}
      }
    }
    
    // If checklist is empty, initialize from phase structure
    if (Object.keys(checklist).length === 0) {
      const structure = getPhaseStructureForKitType(client.plan)
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
      existingPhaseState: !!phaseState 
    })

    // Create or update phase state with updated checklist
    if (phaseState) {
      const updated = await prisma.clientPhaseState.update({
        where: {
          clientId_phaseId: {
            clientId: project_id,
            phaseId: phaseIdString,
          },
        },
        data: {
          checklist: cleanChecklist, // Prisma will handle JSON serialization for MySQL
          updatedAt: new Date(),
        },
      })
      console.log('✅ Phase state updated in database:', { 
        id: updated.id, 
        clientId: updated.clientId,
        phaseId: updated.phaseId,
        checklist: updated.checklist,
        checklistType: typeof updated.checklist
      })
    } else {
      const created = await prisma.clientPhaseState.create({
        data: {
          clientId: project_id,
          phaseId: phaseIdString,
          status: 'NOT_STARTED',
          checklist: cleanChecklist, // Prisma will handle JSON serialization for MySQL
        },
      })
      console.log('✅ Phase state created in database:', { 
        id: created.id, 
        clientId: created.clientId,
        phaseId: created.phaseId,
        checklist: created.checklist,
        checklistType: typeof created.checklist
      })
    }

    // Verify the update was saved
    const verifyState = await prisma.clientPhaseState.findUnique({
      where: {
        clientId_phaseId: {
          clientId: project_id,
          phaseId: phaseIdString,
        },
      },
    })

    if (!verifyState) {
      console.error('❌ Failed to verify checklist was saved')
      return NextResponse.json(
        { error: 'Failed to verify checklist was saved' },
        { status: 500 }
      )
    }

    console.log('✅ Verified checklist saved to database:', verifyState.checklist)
    console.log('✅ Checklist item updated successfully:', { project_id, phaseIdString, label, is_done })

    return NextResponse.json({
      success: true,
      message: 'Checklist item updated successfully',
      checklist: verifyState.checklist,
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
