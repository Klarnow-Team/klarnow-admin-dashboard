'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { LogIn, Mail, Lock, Shield, AlertCircle, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  // Check for access denied error from middleware
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('error') === 'access_denied') {
      setError('Access denied. You are not authorized to access the admin panel.')
      // Clear the session since user is not authorized
      supabase.auth.signOut()
    }
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    // Debug logging
    console.log('🔐 Login attempt started')
    console.log('📧 Email:', email)

    try {
      // Temporary demo login bypass - check credentials directly
      if (email === 'izuchukwuonuoha6@gmail.com' && password === '12345678') {
        console.log('✅ Demo credentials accepted - bypassing Supabase auth')
        
        // Set a demo session cookie
        document.cookie = 'demo_session=active; path=/; max-age=86400' // 24 hours
        
        console.log('✅ Login successful! Redirecting to dashboard...')
        
        // Small delay to simulate network request
        await new Promise(resolve => setTimeout(resolve, 500))
        
        router.push('/dashboard')
        router.refresh()
        return
      }

      // For other emails, try Supabase auth as normal
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      console.log('✅ Auth response:', { 
        success: !error, 
        userId: data?.user?.id,
        error: error?.message 
      })

      if (error) {
        // Provide more user-friendly error messages
        if (error.message.includes('Invalid login credentials')) {
          throw new Error('Invalid email or password. Please check your credentials.')
        } else if (error.message.includes('Email not confirmed')) {
          throw new Error('Please verify your email before signing in.')
        } else {
          throw error
        }
      }

      if (data.user) {
        console.log('✅ User authenticated, checking admin status...')
        
        // Check if user exists in admins table
        const { data: adminData, error: adminError } = await supabase
          .from('admins')
          .select('id, name, email, role')
          .eq('user_id', data.user.id)
          .single()

        if (adminError || !adminData) {
          console.log('❌ User is not an admin:', adminError?.message)
          setError('Access denied. You are not authorized to access the admin panel.')
          return
        }

        console.log('✅ Admin access confirmed, redirecting to dashboard...')
        router.push('/dashboard')
        router.refresh()
      }
    } catch (error: any) {
      console.error('❌ Login failed:', {
        message: error.message,
        fullError: error
      })
      setError(error.message || 'An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
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

        {/* Google Login Button */}
        <div className="mb-6">
          <Button
            type="button"
            variant="outline"
            className="w-full h-12 border-gray-300 hover:bg-gray-50 text-gray-900 font-medium rounded-full"
          >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </Button>
        </div>

        {/* Divider */}
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or continue with email</span>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-6">
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

          {/* Password Field */}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-gray-900 font-medium">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12 border-gray-300 focus:border-[#8359ee] focus:ring-[#8359ee] rounded-full pr-12"
                placeholder="enter password..."
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {/* Login Button */}
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
                Signing in...
              </>
            ) : (
              'Login'
            )}
          </Button>
        </form>

        {/* Demo Credentials */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center mb-4 font-medium">Demo Credentials</p>
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 font-medium">Email:</span>
              <code className="bg-white border border-gray-200 px-3 py-1.5 rounded text-gray-800 font-mono text-xs">
                izuchukwuonuoha6@gmail.com
              </code>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 font-medium">Password:</span>
              <code className="bg-white border border-gray-200 px-3 py-1.5 rounded text-gray-800 font-mono text-xs">
                12345678
              </code>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}