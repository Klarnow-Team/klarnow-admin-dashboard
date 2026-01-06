/**
 * Script to create admin users using Prisma
 * Run with: tsx scripts/create-admin-prisma.ts
 * 
 * Usage:
 *   tsx scripts/create-admin-prisma.ts team@klarnow.co.uk "Team Name"
 *   tsx scripts/create-admin-prisma.ts team@klarnow.co.uk "Team Name" admin
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function createAdminUser() {
  // Get email and name from command line arguments or use defaults
  const email = process.argv[2] || 'team@klarnow.co.uk'
  const name = process.argv[3] || 'Team Admin'
  const role = process.argv[4] || 'admin'

  try {
    console.log(`Creating admin user: ${email}...`)

    // Check if admin already exists
    const existingAdmin = await prisma.admin.findUnique({
      where: { email: email.toLowerCase().trim() },
    })

    if (existingAdmin) {
      console.log(`✅ Admin with email ${email} already exists!`)
      console.log({
        id: existingAdmin.id,
        email: existingAdmin.email,
        name: existingAdmin.name,
        role: existingAdmin.role,
      })
      return
    }

    // Create admin user
    const admin = await prisma.admin.create({
      data: {
        email: email.toLowerCase().trim(),
        name,
        role,
        // No password needed for OTP authentication
      },
    })

    console.log('✅ Admin created successfully!')
    console.log({
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
      createdAt: admin.createdAt,
    })
  } catch (error: any) {
    console.error('❌ Error creating admin:', error.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

createAdminUser()

