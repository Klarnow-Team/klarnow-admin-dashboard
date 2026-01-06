import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export const revalidate = 0

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { error: 'Submission ID is required' },
        { status: 400 }
      )
    }

    // Fetch submission from database
    const submission = await prisma.quizSubmission.findUnique({
      where: { id },
    })

    if (!submission) {
      return NextResponse.json(
        { error: 'Quiz submission not found' },
        { status: 404 }
      )
    }

    // Format submission data
    const firstName = submission.firstName?.trim() ?? ''
    const lastName = submission.lastName?.trim() ?? ''

    const formattedSubmission = {
      id: submission.id,
      full_name: `${firstName} ${lastName}`.trim(),
      firstName,
      lastName,
      email: submission.email,
      phone_number: submission.phoneNumber,
      referral: submission.referral,
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

    return NextResponse.json({
      success: true,
      data: formattedSubmission,
    })
  } catch (error: any) {
    console.error('❌ Error in GET /api/quiz-submissions/[id]:', error)

    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { error: 'Submission ID is required' },
        { status: 400 }
      )
    }

    // Check if submission exists
    const submission = await prisma.quizSubmission.findUnique({
      where: { id },
      select: { id: true, email: true, brandName: true },
    })

    if (!submission) {
      return NextResponse.json(
        { error: 'Quiz submission not found' },
        { status: 404 }
      )
    }

    // Delete submission from database
    await prisma.quizSubmission.delete({
      where: { id },
    })

    console.log('✅ Quiz submission deleted successfully:', submission.brandName)

    return NextResponse.json({
      success: true,
      message: 'Quiz submission deleted successfully',
    })
  } catch (error: any) {
    console.error('❌ Error in DELETE /api/quiz-submissions/[id]:', error)

    // Handle Prisma errors
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Quiz submission not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

