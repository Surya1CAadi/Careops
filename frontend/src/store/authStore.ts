import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: 'OWNER' | 'STAFF'
  workspace?: {
    id: string
    name: string
    onboardingStep: number
    isActive: boolean
    timezone: string
    contactEmail: string
  }
  permissions?: any
}

interface AuthState {
  user: User | null
  token: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: any) => Promise<void>
  logout: () => void
  initializeAuth: () => Promise<void>
  updateUser: (user: User) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email: string, password: string) => {
        try {
          const response = await axios.post(`${API_URL}/auth/login`, {
            email,
            password,
          })

          const { user, token, refreshToken } = response.data.data

          set({
            user,
            token,
            refreshToken,
            isAuthenticated: true,
          })
        } catch (error: any) {
          throw new Error(error.response?.data?.message || 'Login failed')
        }
      },

      register: async (data: any) => {
        try {
          const response = await axios.post(`${API_URL}/auth/register`, data)

          const { user, token, refreshToken } = response.data.data

          set({
            user,
            token,
            refreshToken,
            isAuthenticated: true,
          })
        } catch (error: any) {
          throw new Error(error.response?.data?.message || 'Registration failed')
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
        })
      },

      initializeAuth: async () => {
        const { token } = get()

        if (token) {
          try {
            // Use baseURL manually to avoid circular dependency
            const response = await axios.get(`${API_URL}/auth/me`, {
              headers: { Authorization: `Bearer ${token}` }
            })
            const user = response.data.data

            set({ user, isAuthenticated: true })
          } catch (error) {
            // Token invalid, logout
            get().logout()
          }
        }
      },

      updateUser: (user: User) => {
        set({ user })
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        refreshToken: state.refreshToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
