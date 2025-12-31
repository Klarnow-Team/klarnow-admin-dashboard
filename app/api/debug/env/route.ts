import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * Debug endpoint to check environment variables (without exposing sensitive data)
 * GET /api/debug/env
 */
export async function GET() {
  try {
    const hasDatabaseUrl = !!process.env.DATABASE_URL
    const databaseUrlLength = process.env.DATABASE_URL?.length || 0
    
    // Check connection string format without exposing credentials
    const dbUrl = process.env.DATABASE_URL || ''
    const startsWithMySQL = dbUrl.startsWith('mysql://')
    const hasHost = dbUrl.includes('@') && dbUrl.includes('/')
    
    // Extract safe connection info (no credentials)
    let connectionInfo = null
    if (dbUrl) {
      try {
        const url = new URL(dbUrl.replace('mysql://', 'http://'))
        connectionInfo = {
          host: url.hostname,
          port: url.port || '3306',
          database: url.pathname.replace('/', ''),
          hasCredentials: !!url.username,
          protocol: 'mysql',
        }
      } catch (e) {
        connectionInfo = { error: 'Invalid URL format' }
      }
    }

    return NextResponse.json(
      {
        environment: process.env.NODE_ENV,
        database: {
          hasUrl: hasDatabaseUrl,
          urlLength: databaseUrlLength,
          startsWithMySQL,
          hasHost,
          connectionInfo,
          // Common issues
          commonIssues: [
            !hasDatabaseUrl && 'DATABASE_URL is not set',
            hasDatabaseUrl && !startsWithMySQL && 'DATABASE_URL should start with mysql://',
            hasDatabaseUrl && !hasHost && 'DATABASE_URL format appears invalid',
            hasDatabaseUrl && databaseUrlLength < 20 && 'DATABASE_URL seems too short (might be empty or invalid)',
          ].filter(Boolean),
        },
        tips: [
          'Check Vercel Settings → Environment Variables → Production',
          'Make sure DATABASE_URL is set for the correct environment',
          'The format should be: mysql://user:pass@host:port/dbname?sslaccept=strict',
          'After adding env vars, you must REDEPLOY for them to take effect',
          'Test connection at: /api/health/db',
        ],
      },
      { status: 200 }
    )
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error.message,
      },
      { status: 500 }
    )
  }
}




