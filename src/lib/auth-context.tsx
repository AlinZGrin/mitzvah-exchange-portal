"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react'
import { apiClient, User, UserStats } from './api'

interface AuthContextType {
  user: User | null
  stats: UserStats | null
  loading: boolean
  error: string | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<any>
  logout: () => Promise<void>
  register: (userData: any) => Promise<any>
  updateProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const isAuthenticated = useMemo(() => !!user, [user])

  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (apiClient.isAuthenticated()) {
          const data = await apiClient.getCurrentUser()
          setUser(data.user)
          setStats(data.stats)
        }
      } catch (err) {
        console.error('Auth check failed:', err)
        if (err instanceof Error && (err.message.includes('Authentication') || err.message.includes('401'))) {
          apiClient.setToken(null)
          setUser(null)
          setStats(null)
        }
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    try {
      setError(null)
      setUser(null)
      setStats(null)
      
      const response = await apiClient.login(email, password)
      const userData = await apiClient.getCurrentUser()
      setUser(userData.user)
      setStats(userData.stats)
      return response
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed'
      setError(errorMessage)
      throw err
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await apiClient.logout()
      setUser(null)
      setStats(null)
    } catch (err) {
      console.error('Logout error:', err)
      apiClient.setToken(null)
      setUser(null)
      setStats(null)
    }
  }, [])

  const register = useCallback(async (userData: any) => {
    try {
      setError(null)
      setUser(null)
      setStats(null)
      
      const response = await apiClient.register(userData)
      // Don't try to get current user after registration - user needs to verify email first
      return response
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed'
      setError(errorMessage)
      throw err
    }
  }, [])

  const updateProfile = useCallback(async () => {
    try {
      const userData = await apiClient.getCurrentUser()
      setUser(userData.user)
      setStats(userData.stats)
    } catch (err) {
      console.error('Failed to update profile data:', err)
    }
  }, [])

  const value = useMemo(() => ({
    user,
    stats,
    loading,
    error,
    isAuthenticated,
    login,
    logout,
    register,
    updateProfile
  }), [user, stats, loading, error, isAuthenticated, login, logout, register, updateProfile])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
