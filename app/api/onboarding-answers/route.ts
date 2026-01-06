import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const onboardingAnswers = await prisma.onboardingAnswer.findMany({
      include: {
        project: {
          select: {
            id: true,
            name: true,
            email: true,
            plan: true,
            userId: true,
            startedAt: true,
          },
        },
      },
      orderBy: {
        completedAt: 'desc',
      },
    })

    const formattedAnswers = onboardingAnswers.map(
      (answer: typeof onboardingAnswers[number]) => {
        return {
          id: answer.id,
          user_id: answer.userId,
          answers: answer.answers,
          completed_at: answer.completedAt.toISOString(),
          created_at: answer.createdAt.toISOString(),
          updated_at: answer.updatedAt.toISOString(),
          project: answer.project
            ? {
                id: answer.project.id,
                name: answer.project.name,
                email: answer.project.email,
                plan: answer.project.plan,
                startedAt: answer.project.startedAt?.toISOString() || null,
              }
            : null,
        }
      }
    )

    console.log(`✅ Fetched ${formattedAnswers.length} onboarding answers`)

    return NextResponse.json(
      {
        success: true,
        data: formattedAnswers,
        count: formattedAnswers.length,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    )
  } catch (error: any) {
    console.error('❌ Error in GET /api/onboarding-answers:', error)
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