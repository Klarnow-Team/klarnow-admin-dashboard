import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    // Fetch all admins from database
    const admins = await prisma.admin.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        userId: true,
        // Don't return password
      },
    })

    // Transform to match the expected format
    const formattedAdmins = admins.map((admin: typeof admins[0]) => ({
      id: admin.id,
      user_id: admin.userId,
      email: admin.email,
      name: admin.name,
      role: admin.role,
      created_at: admin.createdAt.toISOString(),
      updated_at: admin.updatedAt.toISOString(),
    }))

    return NextResponse.json(
      { 
        success: true, 
        data: formattedAdmins, 
        count: formattedAdmins.length 
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
    console.error('❌ Error fetching admins:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to fetch admins',
        data: [],
        count: 0
      }, 
      { status: 500 }
    )
  }
}
