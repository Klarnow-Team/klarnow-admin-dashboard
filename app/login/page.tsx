'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<'email' | 'otp'>('email')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  // Check for access denied error from URL
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('error') === 'access_denied') {
      setError('Access denied. You are not authorized to access the admin panel.')
    }
  }, [])

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      let data
      try {
        data = await response.json()
      } catch (jsonError) {
        setError('Server error. Please try again later.')
        return
      }

      if (!response.ok) {
        setError(data.error || 'Failed to send OTP. Please try again.')
        return
      }

      if (data.success) {
        setSuccess('OTP has been sent to your email address. Please check your inbox.')
        setStep('otp')
      }
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ Send OTP error:', error)
      }
      if (error instanceof TypeError && error.message.includes('fetch')) {
        setError('Network error. Please check your connection and try again.')
      } else {
        setError(error.message || 'An error occurred. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, otp }),
      })

      let data
      try {
        data = await response.json()
      } catch (jsonError) {
        setError('Server error. Please try again later.')
        return
      }

      if (!response.ok) {
        setError(data.error || 'Login failed. Please check your OTP.')
        return
      }

      if (data.success) {
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ Login successful! Redirecting to dashboard...')
        }
        router.push('/dashboard')
        router.refresh()
      }
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ Login error:', error)
      }
      if (error instanceof TypeError && error.message.includes('fetch')) {
        setError('Network error. Please check your connection and try again.')
      } else {
        setError(error.message || 'An error occurred. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleBackToEmail = () => {
    setStep('email')
    setOtp('')
    setError(null)
    setSuccess(null)
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <img 
              src="/assets/klarnow.svg" 
              alt="Klarnow" 
              className="h-4 w-auto"
            />
          </div>
        </div>

        {/* Welcome Section */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back</h1>
          <p className="text-gray-600">Glad to see you again 👋 Login to your account below</p>
        </div>

        {/* Login Form */}
        {step === 'email' ? (
          <form onSubmit={handleSendOTP} className="space-y-6">
            {/* Error Message */}
            {error && (
              <Alert variant="destructive" className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-red-800">{error}</AlertDescription>
              </Alert>
            )}

            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-900 font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 border-gray-300 focus:border-[#8359ee] focus:ring-[#8359ee] rounded-full"
                placeholder="enter email..."
              />
            </div>

            {/* Send OTP Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-[#8359ee] hover:bg-[#7245e8] text-white font-medium rounded-full"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending OTP...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Send OTP
                </>
              )}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Error Message */}
            {error && (
              <Alert variant="destructive" className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-red-800">{error}</AlertDescription>
              </Alert>
            )}

            {/* Success Message */}
            {success && (
              <Alert className="border-green-200 bg-green-50">
                <AlertCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">{success}</AlertDescription>
              </Alert>
            )}

            {/* Email Display */}
            <div className="space-y-2">
              <Label className="text-gray-900 font-medium">Email</Label>
              <div className="h-12 px-4 flex items-center bg-gray-50 border border-gray-300 rounded-full text-gray-700">
                {email}
              </div>
            </div>

            {/* OTP Field */}
            <div className="space-y-2">
              <Label htmlFor="otp" className="text-gray-900 font-medium">Enter OTP</Label>
              <Input
                id="otp"
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required
                maxLength={6}
                className="h-12 border-gray-300 focus:border-[#8359ee] focus:ring-[#8359ee] rounded-full text-center text-2xl tracking-widest font-mono"
                placeholder="000000"
              />
              <p className="text-xs text-gray-500 text-center mt-1">
                Enter the 6-digit code sent to your email
              </p>
            </div>

            {/* Login Button */}
            <Button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full h-12 bg-[#8359ee] hover:bg-[#7245e8] text-white font-medium rounded-full"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Verifying...
                </>
              ) : (
                'Login'
              )}
            </Button>

            {/* Back to Email Button */}
            <Button
              type="button"
              onClick={handleBackToEmail}
              variant="outline"
              className="w-full h-12 border-gray-300 text-gray-700 hover:bg-gray-50 font-medium rounded-full"
            >
              Change Email
            </Button>
          </form>
        )}

        {/* Info */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center mb-4 font-medium">How to Login</p>
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <p className="text-sm text-gray-600">
              1. Enter your email address
            </p>
            <p className="text-sm text-gray-600">
              2. Check your email for the OTP code
            </p>
            <p className="text-sm text-gray-600">
              3. Enter the 6-digit OTP to login
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
