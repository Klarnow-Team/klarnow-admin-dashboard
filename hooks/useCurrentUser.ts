'use client'

import { useState, useEffect, useCallback } from 'react'
import { apiService } from '@/lib/api'

interface User {
  name: string
  email: string
  id?: string
  role?: string
}

export function useCurrentUser() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchCurrentUser = useCallback(async () => {
    try {
      setLoading(true)
      
      // Check if we have a token
      const token = apiService.getToken()
      if (!token) {
        console.log('❌ [useCurrentUser] No token found')
        setUser(null)
        setLoading(false)
        return
      }

      console.log('🔍 [useCurrentUser] Fetching user info from API...')
      const response = await apiService.getCurrentUser()

      if (response.success && response.admin) {
        console.log('✅ [useCurrentUser] User fetched:', response.admin)
        setUser({
          id: response.admin.id,
          name: response.admin.name,
          email: response.admin.email,
          role: response.admin.role
        })
      } else {
        console.log('❌ [useCurrentUser] Failed to fetch user')
        setUser(null)
      }
    } catch (error) {
      console.error('❌ [useCurrentUser] Error fetching user:', error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCurrentUser()
  }, [fetchCurrentUser])

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
