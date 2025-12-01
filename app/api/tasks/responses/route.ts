import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// Helper to parse metadata and extract responses/attachments
function parseTaskMetadata(metadata: any): {
  responses: Array<{
    id?: string
    text: string
    created_at: string
    created_by: string
    attachments?: Array<{
      name: string
      url: string
      uploaded_at?: string
      size?: number
      type?: string
    }>
  }>
  attachments: Array<{
    name: string
    url: string
    uploaded_at?: string
    size?: number
    type?: string
  }>
} {
  if (!metadata || typeof metadata !== 'object') {
    return { responses: [], attachments: [] }
  }

  const responses = Array.isArray(metadata.responses) 
    ? metadata.responses.map((r: any, index: number) => ({
        id: r.id || `response-${index}`,
        text: r.text || r.response || '',
        created_at: r.created_at || r.createdAt || new Date().toISOString(),
        created_by: r.created_by || r.createdBy || '',
        attachments: Array.isArray(r.attachments) ? r.attachments : [],
      }))
    : []

  // Extract attachments from metadata
  const attachments = Array.isArray(metadata.attachments)
    ? metadata.attachments.map((a: any) => ({
        name: a.name || '',
        url: a.url || '',
        uploaded_at: a.uploaded_at || a.uploadedAt || a.created_at || a.createdAt,
        size: a.size,
        type: a.type || a.mimeType || a.mime_type,
      }))
    : []

  return { responses, attachments }
}

export async function GET(request: NextRequest) {
  try {
    // Verify prisma is initialized
    if (!prisma || !('task' in prisma)) {
      return NextResponse.json(
        {
          error: 'Task model not available. Please restart your dev server.',
        },
        { status: 500 }
      )
    }

    // Get authentication (email from query params or header)
    const searchParams = request.nextUrl.searchParams
    const adminEmail = searchParams.get('email') || request.headers.get('x-user-email')

    if (!adminEmail) {
      return NextResponse.json(
        {
          error: 'Unauthorized - email required',
          details: 'Provide email via query parameter (?email=...) or header (X-User-Email: ...)',
        },
        { status: 401 }
      )
    }

    // Get filters
    const clientId = searchParams.get('client_id')
    const clientEmail = searchParams.get('client_email')
    const status = searchParams.get('status') as 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | null
    const type = searchParams.get('type') as 'UPLOAD_FILE' | 'SEND_INFO' | 'PROVIDE_DETAILS' | 'REVIEW' | 'OTHER' | null
    const hasResponses = searchParams.get('has_responses')
    const dateFrom = searchParams.get('date_from')
    const dateTo = searchParams.get('date_to')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build where clause
    const where: any = {}

    if (clientId) where.clientId = clientId
    if (status) where.status = status
    if (type) where.type = type

    if (clientEmail) {
      where.client = {
        email: clientEmail,
      }
    }

    if (dateFrom || dateTo) {
      where.createdAt = {}
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom)
      }
      if (dateTo) {
        where.createdAt.lte = new Date(dateTo)
      }
    }

    // Fetch tasks
    type TaskWithClient = Prisma.TaskGetPayload<{
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            plan: true,
          }
        }
      }
    }>

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        include: {
          client: {
            select: {
              id: true,
              name: true,
              email: true,
              plan: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
        skip: offset,
      }) as Promise<TaskWithClient[]>,
      prisma.task.count({ where }),
    ])

    // Process tasks and filter by has_responses if needed
    let processedTasks = tasks.map((task: TaskWithClient) => {
      const { responses, attachments } = parseTaskMetadata(task.metadata)

      return {
        id: task.id,
        client_id: task.clientId,
        client_name: task.client?.name || null,
        client_email: task.client?.email || null,
        title: task.title,
        description: task.description,
        type: task.type,
        status: task.status,
        due_date: task.dueDate?.toISOString() || null,
        completed_at: task.completedAt?.toISOString() || null,
        created_at: task.createdAt.toISOString(),
        updated_at: task.updatedAt.toISOString(),
        created_by: task.createdBy,
        responses,
        attachments,
        metadata: {
          responses,
          attachments,
        },
      }
    })

    // Filter by has_responses if specified
    if (hasResponses !== null) {
      const hasResponsesBool = hasResponses === 'true'
      processedTasks = processedTasks.filter(task => {
        const hasResp = task.responses && task.responses.length > 0
        return hasResponsesBool ? hasResp : !hasResp
      })
    }

    // Calculate pagination
    const hasMore = offset + limit < total

    return NextResponse.json(
      {
        tasks: processedTasks,
        pagination: {
          total,
          limit,
          offset,
          has_more: hasMore,
        },
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
    console.error('❌ Error in GET /api/tasks/responses:', error)
    return NextResponse.json(
      {
        error: error.message || 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.stack : null,
      },
      { status: 500 }
    )
  }
}

