import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * Database health check endpoint
 * Use this to verify your database connection is working on Vercel
 * GET /api/health/db
 */
export async function GET() {
  try {
    // Check if DATABASE_URL is set
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'DATABASE_URL environment variable is not set',
          connected: false,
          hint: 'Please set DATABASE_URL in Vercel → Settings → Environment Variables',
          documentation: 'See VERCEL_DATABASE_SETUP.md for setup instructions',
        },
        { status: 500 }
      )
    }

    // Try to connect to the database
    await prisma.$connect()
    
    // Try a simple query to verify connection
    await prisma.$queryRaw`SELECT 1`
    
    // Get database info
    const projectCount = await prisma.project.count()
    const quizCount = await prisma.quizSubmission.count()
    const taskCount = await prisma.task.count()

    return NextResponse.json(
      {
        status: 'success',
        message: 'Database connection successful',
        connected: true,
        database: {
          projects: projectCount,
          quizSubmissions: quizCount,
          tasks: taskCount,
        },
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('❌ Database health check failed:', error)
    
    let errorMessage = error.message || 'Database connection failed'
    let hint = ''

    if (error.message?.includes('Can\'t reach database server') || 
        error.message?.includes('P1001') ||
        error.message?.includes('connect')) {
      errorMessage = 'Cannot reach database server'
      hint = 'Check if your database is accessible from the internet and firewall settings'
    } else if (error.message?.includes('P1000') || error.message?.includes('Authentication failed')) {
      errorMessage = 'Database authentication failed'
      hint = 'Check your DATABASE_URL username and password'
    } else if (error.message?.includes('Unknown database')) {
      errorMessage = 'Database not found'
      hint = 'Check if the database name in DATABASE_URL is correct'
    }

    return NextResponse.json(
      {
        status: 'error',
        message: errorMessage,
        connected: false,
        error: error.message,
        hint: hint || 'See VERCEL_DATABASE_SETUP.md for troubleshooting',
        documentation: 'VERCEL_DATABASE_SETUP.md',
      },
      { status: 500 }
    )
  } finally {
    // Disconnect to avoid connection pool issues
    await prisma.$disconnect().catch(() => {})
  }
}




