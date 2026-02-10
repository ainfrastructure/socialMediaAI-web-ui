import type { ApiResponse } from './apiBase'
import { API_URL, getAuthHeader, getAuthHeaders } from './apiBase'

export interface User {
  id: string
  email: string
  role?: 'user' | 'admin'
  has_completed_onboarding?: boolean
  accepted_terms_at?: string | null
  onboarding_completed_at?: string | null
  subscription: {
    status: string
    tier: string
    current_period_end: string | null
    cancel_at_period_end: boolean
  }
  usage: {
    credits_this_month: number
    monthly_limit: number
    remaining_credits: number
  }
}

export interface LoginResponse {
  success: boolean
  message?: string
  error?: string
  user?: {
    id: string
    email: string
  }
  session?: {
    access_token: string
    refresh_token: string
    expires_at?: number
    expires_in?: number
  }
  email_confirmation_required?: boolean
}

class AuthService {
  async signup(email: string, password: string): Promise<LoginResponse> {
    const response = await fetch(`${API_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    return response.json()
  }

  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    return response.json()
  }

  async logout(): Promise<ApiResponse> {
    const response = await fetch(`${API_URL}/api/auth/logout`, {
      method: 'POST',
      headers: getAuthHeaders(),
    })
    return response.json()
  }

  async getProfile(): Promise<ApiResponse<{ user: User }>> {
    const response = await fetch(`${API_URL}/api/auth/me`, {
      headers: getAuthHeader(),
    })
    return response.json()
  }

  async completeOnboarding(): Promise<ApiResponse<{ user: User }>> {
    const response = await fetch(`${API_URL}/api/auth/onboarding/complete`, {
      method: 'POST',
      headers: getAuthHeaders(),
    })
    return response.json()
  }

  async getStats(): Promise<ApiResponse<{
    postsCreated: number
    favoritesSaved: number
    scheduledPosts: number
    brandsAdded: number
  }>> {
    const response = await fetch(`${API_URL}/api/auth/stats`, {
      headers: getAuthHeader(),
    })
    return response.json()
  }

  async initEmailLogin(email: string): Promise<ApiResponse<{ method: 'code' | 'otp' }>> {
    const response = await fetch(`${API_URL}/api/auth/init-email-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    return response.json()
  }

  async sendMagicLink(email: string, language?: string): Promise<ApiResponse> {
    const response = await fetch(`${API_URL}/api/auth/magic-link`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, language }),
    })
    return response.json()
  }

  async requestPasswordReset(email: string): Promise<ApiResponse> {
    const response = await fetch(`${API_URL}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    return response.json()
  }

  async updatePassword(password: string, token: string): Promise<ApiResponse> {
    const response = await fetch(`${API_URL}/api/auth/update-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ password }),
    })
    return response.json()
  }

  async verifyOtp(
    email: string,
    token: string,
    type: 'email' | 'magiclink' = 'email',
  ): Promise<LoginResponse> {
    const response = await fetch(`${API_URL}/api/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, token, type }),
    })
    return response.json()
  }

  async refreshToken(refreshToken: string): Promise<LoginResponse> {
    const response = await fetch(`${API_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    })
    return response.json()
  }

  async signInWithApple(): Promise<ApiResponse<{ url: string }>> {
    const response = await fetch(`${API_URL}/api/auth/apple/init`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })
    return response.json()
  }

  async signInWithGoogle(): Promise<ApiResponse<{ url: string }>> {
    const response = await fetch(`${API_URL}/api/auth/google/init`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })
    return response.json()
  }

  async signInWithFacebook(): Promise<ApiResponse<{ url: string }>> {
    const response = await fetch(`${API_URL}/api/auth/facebook/init`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })
    return response.json()
  }

  async devLogin(email: string, code?: string): Promise<LoginResponse> {
    const response = await fetch(`${API_URL}/api/auth/dev-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code }),
    })
    return response.json()
  }

  async deleteAccount(request: {
    reason?: string
    confirmations: {
      understandDataLoss: boolean
      understandNoRecovery: boolean
      understandImmediateEffect: boolean
    }
  }): Promise<ApiResponse> {
    const response = await fetch(`${API_URL}/api/auth/delete-account`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(request),
    })
    return response.json()
  }
}

export const authService = new AuthService()
