import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getPhaseStructureForKitType } from '@/lib/phase-structure'
import { KitType } from '@prisma/client'

export const revalidate = 0

// Helper function to extract plan from onboarding answers
function extractPlanFromAnswers(answers: any): KitType {
  // Try different possible paths where plan might be stored
  if (answers?.plan) {
    return answers.plan.toUpperCase() === 'GROWTH' ? 'GROWTH' : 'LAUNCH'
  }
  
  if (answers?.kit_type) {
    return answers.kit_type.toUpperCase() === 'GROWTH' ? 'GROWTH' : 'LAUNCH'
  }
  
  if (answers?.preferredKit) {
    return answers.preferredKit.toUpperCase() === 'GROWTH' ? 'GROWTH' : 'LAUNCH'
  }
  
  // Check in steps if it's a multi-step form
  if (answers?.steps && Array.isArray(answers.steps)) {
    for (const step of answers.steps) {
      if (step?.fields?.plan) {
        return step.fields.plan.toUpperCase() === 'GROWTH' ? 'GROWTH' : 'LAUNCH'
      }
      if (step?.fields?.kit_type) {
        return step.fields.kit_type.toUpperCase() === 'GROWTH' ? 'GROWTH' : 'LAUNCH'
      }
      if (step?.fields?.preferredKit) {
        return step.fields.preferredKit.toUpperCase() === 'GROWTH' ? 'GROWTH' : 'LAUNCH'
      }
    }
  }
  
  // Default to LAUNCH if not found
  return 'LAUNCH'
}

// Helper function to extract email from onboarding answers
function extractEmailFromAnswers(answers: any): string {
  if (answers?.email) return answers.email
  if (answers?.user_email) return answers.user_email
  
  // Check in steps
  if (answers?.steps && Array.isArray(answers.steps)) {
    for (const step of answers.steps) {
      if (step?.fields?.email) return step.fields.email
      if (step?.fields?.user_email) return step.fields.user_email
    }
  }
  
  throw new Error('Email not found in onboarding answers')
}

// Helper function to extract name from onboarding answers
function extractNameFromAnswers(answers: any): string | null {
  if (answers?.name) return answers.name
  if (answers?.full_name) return answers.full_name
  if (answers?.first_name && answers?.last_name) {
    return `${answers.first_name} ${answers.last_name}`.trim()
  }
  
  // Check in steps
  if (answers?.steps && Array.isArray(answers.steps)) {
    for (const step of answers.steps) {
      if (step?.fields?.name) return step.fields.name
      if (step?.fields?.full_name) return step.fields.full_name
      if (step?.fields?.first_name && step?.fields?.last_name) {
        return `${step.fields.first_name} ${step.fields.last_name}`.trim()
      }
    }
  }
  
  return null
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // 1. Get onboarding answer
    const onboardingAnswer = await prisma.onboardingAnswer.findUnique({
      where: { id },
      include: {
        project: true,
      },
    })
    
    if (!onboardingAnswer) {
      return NextResponse.json(
        { error: 'Onboarding answer not found' },
        { status: 404 }
      )
    }
    
    // 2. Check if project already exists
    if (onboardingAnswer.project) {
      return NextResponse.json(
        { error: 'Project already exists for this onboarding answer' },
        { status: 400 }
      )
    }
    
    // 3. Extract data from onboarding answers
    let plan: KitType
    let email: string
    let name: string | null
    
    try {
      plan = extractPlanFromAnswers(onboardingAnswer.answers as any)
      email = extractEmailFromAnswers(onboardingAnswer.answers as any)
      name = extractNameFromAnswers(onboardingAnswer.answers as any)
    } catch (error: any) {
      return NextResponse.json(
        { error: `Failed to extract data from onboarding answers: ${error.message}` },
        { status: 400 }
      )
    }
    
    // 4. Initialize phases state based on plan
    const phaseStructure = getPhaseStructureForKitType(plan)
    const initialPhasesState = phaseStructure.reduce((acc, phase) => {
      acc[phase.phase_id] = {
        status: 'NOT_STARTED',
        started_at: null,
        completed_at: null,
        checklist: phase.checklist_labels.reduce((checklist, label) => {
          checklist[label] = false
          return checklist
        }, {} as Record<string, boolean>),
      }
      return acc
    }, {} as Record<string, any>)
    
    // 5. Create project
    const project = await prisma.project.create({
      data: {
        onboardingAnswerId: id,
        userId: onboardingAnswer.userId,
        email,
        name,
        plan,
        startedAt: new Date(), // Project starts immediately
        currentDayOf14: 1,
        phasesState: initialPhasesState,
      },
      include: {
        onboardingAnswer: {
          select: {
            id: true,
            userId: true,
            completedAt: true,
          },
        },
      },
    })
    
    console.log('✅ Project created successfully:', {
      projectId: project.id,
      email: project.email,
      plan: project.plan,
      startedAt: project.startedAt,
    })
    
    return NextResponse.json({
      success: true,
      project: {
        id: project.id,
        email: project.email,
        name: project.name,
        plan: project.plan,
        startedAt: project.startedAt?.toISOString(),
        currentDayOf14: project.currentDayOf14,
        phasesState: project.phasesState,
      },
      message: 'Project started successfully',
    })
  } catch (error: any) {
    console.error('❌ Error in POST /api/onboarding-answers/[id]/start-project:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

