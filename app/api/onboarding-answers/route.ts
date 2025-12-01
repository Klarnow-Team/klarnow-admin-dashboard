import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const onboardingAnswers = await prisma.onboardingAnswer.findMany({
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            plan: true,
            userId: true,
          },
        },
      },
      orderBy: {
        completedAt: 'desc',
      },
    })

    // Fetch clients by userId for answers that don't have a direct client relationship
    const userIds = onboardingAnswers.map((answer: typeof onboardingAnswers[0]) => answer.userId)
    const clientsByUserId = await prisma.client.findMany({
      where: {
        userId: {
          in: userIds,
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        plan: true,
        userId: true,
      },
    })

    // Create a map of userId to client for quick lookup
    const clientMap = new Map(clientsByUserId.map(client => [client.userId, client]))

    const formattedAnswers = onboardingAnswers.map((answer: typeof onboardingAnswers[0]) => {
      // Try to get client from relationship first, then fallback to userId lookup
      const client = answer.client || clientMap.get(answer.userId)
      
      return {
        id: answer.id,
        user_id: answer.userId,
        answers: answer.answers,
        completed_at: answer.completedAt.toISOString(),
        created_at: answer.createdAt.toISOString(),
        updated_at: answer.updatedAt.toISOString(),
        client: client ? {
          id: client.id,
          name: client.name,
          email: client.email,
          plan: client.plan,
        } : null,
      }
    })

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

