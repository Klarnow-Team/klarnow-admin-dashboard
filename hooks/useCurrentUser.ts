'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'

interface User {
  name: string
  email: string
  id?: string
}

export function useCurrentUser() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        console.log('🔍 [useCurrentUser] Fetching current user data...')
        const { data: { user: authUser } } = await supabase.auth.getUser()
        
        if (authUser) {
          console.log('✅ [useCurrentUser] Auth user found:', {
            id: authUser.id,
            email: authUser.email,
            metadata: authUser.user_metadata
          })
          
          // Try to get admin data from admins table
          const { data: adminData, error: adminError } = await supabase
            .from('admins')
            .select('name, email, user_id')
            .eq('user_id', authUser.id)
            .single()

          if (adminData && !adminError) {
            console.log('✅ [useCurrentUser] Admin user data fetched from admins table:', {
              name: adminData.name,
              email: adminData.email,
              userId: adminData.user_id
            })
            setUser({
              name: adminData.name,
              email: adminData.email,
              id: adminData.user_id
            })
          } else {
            console.log('❌ [useCurrentUser] No admin data found in admins table - user is not authorized:', adminError)
            // User is not an admin - deny access
            setUser(null)
          }
        } else {
          console.log('❌ [useCurrentUser] No authenticated user found')
          setUser(null)
        }
      } catch (error) {
        console.error('❌ [useCurrentUser] Error fetching user data:', error)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    fetchCurrentUser()
  }, [])

  // Function to get current user ID (memoized to prevent recreation)
  const getCurrentUserId = useCallback(() => {
    return user?.id || null
  }, [user?.id])

  // Function to check if user is authenticated (memoized to prevent recreation)
  const isAuthenticated = useCallback(() => {
    return !!user?.id
  }, [user?.id])

  return {
    user,
    loading,
    getCurrentUserId,
    isAuthenticated
  }
}
