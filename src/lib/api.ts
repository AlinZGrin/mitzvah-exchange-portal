import { useState, useEffect, useCallback, createContext, useContext, useMemo } from 'react'

// Types for API responses
export interface User {
  id: string
  email: string
  role: 'MEMBER' | 'ADMIN' | 'MODERATOR'
  emailVerified: boolean
  profile: {
    displayName: string
    bio?: string
    city?: string
    languages: string[]
    skills: string[]
    privacy: {
      showEmail: boolean
      showPhone: boolean
      showExactLocation: boolean
    }
  }
}

export interface MitzvahRequest {
  id: string
  title: string
  description: string
  category: string
  urgency: 'LOW' | 'NORMAL' | 'HIGH'
  status: 'OPEN' | 'CLAIMED' | 'COMPLETED' | 'CONFIRMED' | 'EXPIRED'
  locationDisplay: string
  timeWindowStart?: string
  timeWindowEnd?: string
  requirements: string[]
  owner: {
    profile: {
      displayName: string
    }
  }
  createdAt: string
}

export interface UserStats {
  totalPoints: number
  requestsPosted: number
  requestsCompleted: number
  averageRating: number
  totalReviews: number
  currentRank: number
}

// API utility functions
class ApiClient {
  private baseUrl = ''
  private token: string | null = null

  constructor() {
    if (typeof window !== 'undefined') {
      // Clear any old localStorage tokens and use sessionStorage instead
      localStorage.removeItem('auth_token')
      this.token = sessionStorage.getItem('auth_token')
    }
  }

  setToken(token: string | null) {
    this.token = token
    if (typeof window !== 'undefined') {
      if (token) {
        sessionStorage.setItem('auth_token', token)
      } else {
        sessionStorage.removeItem('auth_token')
      }
    }
  }

  isAuthenticated(): boolean {
    return !!this.token
  }

  async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}/api${endpoint}`
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {})
    }

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`
    }

    const response = await fetch(url, {
      ...options,
      headers
    })

    // Handle 401 responses by clearing the token
    if (response.status === 401) {
      this.setToken(null)
      const error = await response.json().catch(() => ({ error: 'Authentication required' }))
      throw new Error(error.error || 'Authentication required')
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(error.error || `HTTP ${response.status}`)
    }

    return response.json()
  }

  // Auth endpoints
  async register(userData: {
    email: string
    password: string
    displayName: string
    bio?: string
    city?: string
    languages?: string[]
    skills?: string[]
    privacy?: {
      showEmail: boolean
      showPhone: boolean
      showExactLocation: boolean
    }
  }) {
    // Clear any previous token first
    this.setToken(null)
    
    const response = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    })
    if (response.token) {
      this.setToken(response.token)
    }
    return response
  }

  async login(email: string, password: string) {
    // Clear any previous token first
    this.setToken(null)
    
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    })
    if (response.token) {
      this.setToken(response.token)
    }
    return response
  }

  async logout() {
    const response = await this.request('/auth/logout', {
      method: 'POST'
    })
    this.setToken(null)
    // Also clear any lingering localStorage tokens
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token')
    }
    return response
  }

  // User endpoints
  async getCurrentUser(): Promise<{ user: User; stats: UserStats }> {
    return this.request('/users/me')
  }

  // Request endpoints
  async getRequests(filters: {
    category?: string
    urgency?: string
    status?: string
    city?: string
    limit?: number
    offset?: number
  } = {}): Promise<{ requests: MitzvahRequest[]; total: number; hasMore: boolean }> {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, value.toString())
      }
    })
    const queryString = params.toString()
    return this.request(`/requests${queryString ? `?${queryString}` : ''}`)
  }

  async createRequest(requestData: {
    title: string
    description: string
    category: string
    urgency: 'LOW' | 'NORMAL' | 'HIGH'
    locationDisplay: string
    timeWindowStart?: string
    timeWindowEnd?: string
    requirements?: string[]
    attachments?: string[]
  }) {
    return this.request('/requests', {
      method: 'POST',
      body: JSON.stringify(requestData)
    })
  }

  async claimRequest(requestId: string) {
    return this.request(`/requests/${requestId}/claim`, {
      method: 'POST'
    })
  }

  // Assignment endpoints
  async completeAssignment(assignmentId: string, data: {
    notes?: string
    proofPhotos?: string[]
  }) {
    return this.request(`/assignments/${assignmentId}/complete`, {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  async confirmAssignment(assignmentId: string, data: {
    confirmed: boolean
    notes?: string
  }) {
    return this.request(`/assignments/${assignmentId}/confirm`, {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }
}

export const apiClient = new ApiClient()

// React hooks for API calls
export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
        // Only clear auth state if it's an auth-related error
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
      // Clear previous user state first
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
      // Even if logout fails, clear local state
      apiClient.setToken(null)
      setUser(null)
      setStats(null)
    }
  }, [])

  const register = async (userData: Parameters<typeof apiClient.register>[0]) => {
    try {
      setError(null)
      // Clear previous user state first
      setUser(null)
      setStats(null)
      
      const response = await apiClient.register(userData)
      const userWithStats = await apiClient.getCurrentUser()
      setUser(userWithStats.user)
      setStats(userWithStats.stats)
      return response
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed'
      setError(errorMessage)
      throw err
    }
  }

  const updateProfile = async () => {
    try {
      const userData = await apiClient.getCurrentUser()
      setUser(userData.user)
      setStats(userData.stats)
    } catch (err) {
      console.error('Failed to update profile data:', err)
    }
  }

  const isAuthenticated = useMemo(() => !!user, [user])

  return {
    user,
    stats,
    loading,
    error,
    login,
    logout,
    register,
    updateProfile,
    isAuthenticated
  }
}

export function useRequests(filters: Parameters<typeof apiClient.getRequests>[0] = {}) {
  const [requests, setRequests] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  const loadRequests = useCallback(async (newFilters: typeof filters = {}, isRetry = false) => {
    try {
      if (!isRetry) {
        setLoading(true)
      }
      // Clear error when starting a new request (not a retry)
      if (!isRetry) {
        setError(null)
        setRetryCount(0)
      }
      
      const data = await apiClient.getRequests({ ...filters, ...newFilters })
      setRequests(data.requests)
      setTotal(data.total)
      setHasMore(data.hasMore)
      
      // Clear error on successful request
      setError(null)
      setRetryCount(0)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load requests'
      
      // If it's a network/server error and we haven't retried too many times, attempt retry
      if (errorMessage.includes('Internal server error') && retryCount < 2) {
        setTimeout(() => {
          setRetryCount(prev => prev + 1)
          loadRequests(newFilters, true)
        }, 1000 * (retryCount + 1)) // Exponential backoff: 1s, 2s
        return
      }
      
      // Only show error if we have no data or if retries failed
      if (requests.length === 0 || retryCount >= 2) {
        setError(errorMessage)
      }
    } finally {
      setLoading(false)
    }
  }, [filters, retryCount, requests.length])

  useEffect(() => {
    loadRequests()
  }, [loadRequests])

  const createRequest = async (requestData: Parameters<typeof apiClient.createRequest>[0]) => {
    try {
      const response = await apiClient.createRequest(requestData)
      // Reload requests to include the new one
      await loadRequests()
      return response
    } catch (err) {
      throw err
    }
  }

  const claimRequest = async (requestId: string) => {
    try {
      const response = await apiClient.claimRequest(requestId)
      // Reload requests to update status
      await loadRequests()
      return response
    } catch (err) {
      throw err
    }
  }

  return {
    requests,
    total,
    hasMore,
    loading,
    error,
    loadRequests,
    createRequest,
    claimRequest
  }
}

// Hook for managing user assignments
export function useAssignments() {
  const [assignments, setAssignments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadAssignments = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await apiClient.request('/assignments')
      setAssignments(data.assignments || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load assignments')
      setAssignments([]) // Clear assignments on error
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAssignments()
  }, [loadAssignments])

  const completeAssignment = async (assignmentId: string, notes: string = '', proofPhotos: string[] = []) => {
    try {
      const response = await apiClient.request(`/assignments/${assignmentId}/complete`, {
        method: 'POST',
        body: JSON.stringify({ notes, proofPhotos })
      })
      await loadAssignments()
      return response
    } catch (err) {
      throw err
    }
  }

  const confirmAssignment = async (assignmentId: string, confirmed: boolean, notes: string = '') => {
    try {
      const response = await apiClient.request(`/assignments/${assignmentId}/confirm`, {
        method: 'POST',
        body: JSON.stringify({ confirmed, notes })
      })
      await loadAssignments()
      return response
    } catch (err) {
      throw err
    }
  }

  return {
    assignments,
    loading,
    error,
    loadAssignments,
    completeAssignment,
    confirmAssignment
  }
}
