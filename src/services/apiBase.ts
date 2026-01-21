// Shared API configuration and types
import { env } from '@/config/environment'

export const API_URL = env.api.baseUrl

export interface ApiResponse<T = any> {
  success: boolean
  message?: string
  error?: string
  data?: T
}

export function getAuthHeader(): HeadersInit {
  const token = localStorage.getItem('access_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export function getAuthHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
  }
}
