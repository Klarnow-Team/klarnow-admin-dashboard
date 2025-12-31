import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    // Fetch all quiz submissions from database
    const submissions = await prisma.quizSubmission.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    })

    const formattedSubmissions = submissions.map(
  (submission: Prisma.QuizSubmissionGetPayload<{}>) => {
    const firstName = submission.firstName?.trim() ?? ''
    const lastName = submission.lastName?.trim() ?? ''

    return {
      id: submission.id,
      full_name: `${firstName} ${lastName}`.trim(),
      firstName,
      lastName,
      email: submission.email,
      phone_number: submission.phoneNumber,
      brand_name: submission.brandName,
      logo_status: submission.logoStatus,
      brand_goals: Array.isArray(submission.brandGoals)
        ? (submission.brandGoals as string[])
        : [],
      online_presence: submission.onlinePresence,
      audience: Array.isArray(submission.audience)
        ? (submission.audience as string[])
        : [],
      brand_style: submission.brandStyle,
      timeline: submission.timeline,
      preferred_kit: submission.preferredKit ?? null,
      created_at: submission.createdAt.toISOString(),
      updated_at: submission.updatedAt.toISOString(),
    }
  }
)

    return NextResponse.json(
      { 
        success: true, 
        data: formattedSubmissions, 
        count: formattedSubmissions.length 
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
    console.error('❌ Error fetching quiz submissions:', error)
    
    // Provide helpful error messages
    let errorMessage = error.message || 'Failed to fetch quiz submissions'
    
    if (error.message?.includes('Can\'t reach database server') || 
        error.message?.includes('P1001') ||
        error.message?.includes('connect')) {
      errorMessage = 'Database connection failed. Please check DATABASE_URL environment variable in Vercel settings.'
    } else if (error.message?.includes('P1000') || error.message?.includes('Authentication failed')) {
      errorMessage = 'Database authentication failed. Please check your DATABASE_URL credentials.'
    } else if (!process.env.DATABASE_URL) {
      errorMessage = 'DATABASE_URL environment variable is not set. Please configure it in Vercel settings.'
    }
    
    return NextResponse.json(
      { 
        success: false,
        error: errorMessage,
        data: [],
        count: 0,
        hint: !process.env.DATABASE_URL 
          ? 'Set DATABASE_URL in Vercel → Settings → Environment Variables. See VERCEL_DATABASE_SETUP.md for details.'
          : undefined
      }, 
      { status: 500 }
    )
  }
}

