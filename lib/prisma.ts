import { PrismaClient } from '@prisma/client'

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
}

// Verify DATABASE_URL is set
const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  console.error('❌ DATABASE_URL is missing! Make sure it is set in .env and Vercel.')
}

function createPrismaClient() {
  try {
    const client = new PrismaClient({
      log:
        process.env.NODE_ENV === 'development'
          ? ['query', 'error', 'warn']
          : ['error'],
      errorFormat: 'pretty',
    })
    
    // Test connection on initialization in development
    if (process.env.NODE_ENV === 'development') {
      client.$connect().catch((err) => {
        console.error('❌ Failed to connect to database:', err.message)
      })
    }
    
    return client
  } catch (error: any) {
    console.error('❌ Failed to create Prisma client:', error.message)
    throw error
  }
}

const prisma = global.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma
}

export { prisma }