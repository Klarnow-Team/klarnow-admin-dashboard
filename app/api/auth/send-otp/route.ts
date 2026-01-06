import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY)

// Generate a 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(request: NextRequest) {
  try {
    // Check RESEND_API_KEY
    if (!process.env.RESEND_API_KEY) {
      console.error('❌ RESEND_API_KEY environment variable is not set')
      return NextResponse.json(
        { 
          error: 'Email service configuration error',
          hint: process.env.VERCEL 
            ? 'Please set RESEND_API_KEY in Vercel → Settings → Environment Variables'
            : 'Please set RESEND_API_KEY in your .env file'
        },
        { status: 500 }
      )
    }

    // Check DATABASE_URL
    if (!process.env.DATABASE_URL) {
      console.error('❌ DATABASE_URL environment variable is not set')
      return NextResponse.json(
        { 
          error: 'Database configuration error',
          hint: process.env.VERCEL 
            ? 'Please set DATABASE_URL in Vercel → Settings → Environment Variables'
            : 'Please set DATABASE_URL in your .env file'
        },
        { status: 500 }
      )
    }

    // Verify Prisma is initialized
    if (!prisma) {
      console.error('❌ Prisma client is not initialized')
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 500 }
      )
    }

    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Normalize email
    const normalizedEmail = email.trim().toLowerCase()

    // Check if this is the default admin email
    const defaultAdminEmail = process.env.DEFAULT_ADMIN_EMAIL?.trim().toLowerCase()
    const defaultAdminOTP = process.env.DEFAULT_ADMIN_OTP || '000000'
    const isDefaultAdmin = defaultAdminEmail && normalizedEmail === defaultAdminEmail

    // Ensure database connection is established
    try {
      await prisma.$connect()
    } catch (connectError: any) {
      console.error('❌ Database connection error:', connectError.message)
      // Continue anyway - connection might already be established
    }

    // Check if admin exists
    const admin = await prisma.admin.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        email: true,
        name: true,
      },
    })

    if (!admin) {
      // Don't reveal that the email doesn't exist (security best practice)
      // Return success even if admin doesn't exist to prevent email enumeration
      console.log('⚠️ OTP request for non-existent email:', normalizedEmail)
      return NextResponse.json(
        { 
          success: true,
          message: 'If an account exists with this email, an OTP has been sent.'
        },
        { status: 200 }
      )
    }

    // For default admin email, use the fixed OTP from environment variable
    let otpCode: string
    if (isDefaultAdmin) {
      otpCode = defaultAdminOTP
      console.log('🔑 Using default admin OTP for:', normalizedEmail)
    } else {
      // Generate random OTP for regular users
      otpCode = generateOTP()
    }

    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes from now

    // Store OTP in database
    await prisma.admin.update({
      where: { id: admin.id },
      data: {
        otpCode,
        otpExpiresAt,
      },
    })

    // For default admin, skip sending email and return the OTP directly
    if (isDefaultAdmin) {
      console.log('✅ Default admin OTP set (not sent via email):', normalizedEmail)
      return NextResponse.json({
        success: true,
        message: `OTP ready. Use OTP: ${defaultAdminOTP}`,
        // Include OTP in response for development convenience (only for default admin)
        otp: process.env.NODE_ENV === 'development' ? defaultAdminOTP : undefined,
      }, { status: 200 })
    }

    // Send OTP via Resend for regular users
    try {
      const { data, error } = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
        to: normalizedEmail,
        subject: 'Your Login OTP Code',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #8359ee;">Login OTP Code</h2>
            <p>Hello ${admin.name},</p>
            <p>Your one-time password (OTP) for logging into the admin dashboard is:</p>
            <div style="background-color: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
              <h1 style="color: #8359ee; font-size: 32px; letter-spacing: 4px; margin: 0;">${otpCode}</h1>
            </div>
            <p>This code will expire in 10 minutes.</p>
            <p>If you didn't request this code, please ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #666; font-size: 12px;">This is an automated message, please do not reply.</p>
          </div>
        `,
      })

      if (error) {
        console.error('❌ Resend error:', error)
        return NextResponse.json(
          { error: 'Failed to send OTP email. Please try again later.' },
          { status: 500 }
        )
      }

      console.log('✅ OTP sent successfully to:', normalizedEmail)
      
      return NextResponse.json({
        success: true,
        message: 'OTP has been sent to your email address.',
      }, { status: 200 })
    } catch (emailError: any) {
      console.error('❌ Error sending email:', emailError)
      return NextResponse.json(
        { error: 'Failed to send OTP email. Please try again later.' },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('❌ Send OTP error:', error)
    return NextResponse.json(
      { 
        error: 'An error occurred while sending OTP',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    )
  }
}

