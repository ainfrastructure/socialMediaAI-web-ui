import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api, type User } from '../services/api'

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<User | null>(null)
  const accessToken = ref<string | null>(localStorage.getItem('access_token'))
  const refreshToken = ref<string | null>(localStorage.getItem('refresh_token'))
  const tokenExpiresAt = ref<number | null>(
    localStorage.getItem('token_expires_at')
      ? parseInt(localStorage.getItem('token_expires_at')!)
      : null,
  )
  const loading = ref(false)
  const error = ref<string | null>(null)
  const initialized = ref(false) // Track if auth state has been initialized
  let refreshTimer: number | null = null

  // Computed
  const isAuthenticated = computed(() => !!accessToken.value && !!user.value)
  const subscriptionTier = computed(() => user.value?.subscription.tier || 'free')
  const usageStats = computed(() => user.value?.usage)
  const canGenerateContent = computed(() => {
    if (!user.value) return false
    return user.value.usage.remaining_credits > 0
  })
  const canGenerateVideo = computed(() => {
    if (!user.value) return false
    // Video generation costs 5 credits
    return user.value.usage.remaining_credits >= 5
  })

  // Helper to store session
  function storeSession(session: { access_token: string; refresh_token: string; expires_at?: number; expires_in?: number }) {
    console.log('Storing session:', {
      hasAccessToken: !!session.access_token,
      hasRefreshToken: !!session.refresh_token,
      expires_at: session.expires_at,
      expires_in: session.expires_in,
    })

    accessToken.value = session.access_token
    refreshToken.value = session.refresh_token

    localStorage.setItem('access_token', session.access_token)
    localStorage.setItem('refresh_token', session.refresh_token)

    // Store expiration time
    // Supabase returns expires_at as Unix timestamp in seconds, or expires_in as seconds
    let expiresAt: number
    if (session.expires_at) {
      // expires_at is in seconds, convert to milliseconds
      expiresAt = session.expires_at * 1000
    } else if (session.expires_in) {
      // expires_in is seconds from now
      expiresAt = Date.now() + session.expires_in * 1000
    } else {
      // Default to 1 hour
      expiresAt = Date.now() + 3600 * 1000
    }

    tokenExpiresAt.value = expiresAt
    localStorage.setItem('token_expires_at', expiresAt.toString())

    console.log('Session stored, expires at:', new Date(expiresAt).toISOString())

    // Schedule token refresh
    scheduleTokenRefresh()
  }

  // Helper to clear session
  function clearSession() {
    accessToken.value = null
    refreshToken.value = null
    tokenExpiresAt.value = null
    user.value = null

    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('token_expires_at')

    if (refreshTimer) {
      clearTimeout(refreshTimer)
      refreshTimer = null
    }
  }

  // Schedule automatic token refresh
  function scheduleTokenRefresh() {
    if (refreshTimer) {
      clearTimeout(refreshTimer)
    }

    if (!tokenExpiresAt.value || !refreshToken.value) {
      return
    }

    // Refresh token 5 minutes before expiration
    const timeUntilRefresh = tokenExpiresAt.value - Date.now() - 5 * 60 * 1000

    if (timeUntilRefresh > 0) {
      refreshTimer = window.setTimeout(() => {
        refreshAccessToken()
      }, timeUntilRefresh)
    } else {
      // Token is already expired or about to expire, refresh now
      refreshAccessToken()
    }
  }

  // Refresh access token
  async function refreshAccessToken() {
    if (!refreshToken.value) {
      console.log('No refresh token available')
      await logout()
      return false
    }

    try {
      console.log('Attempting to refresh token...')
      const response = await api.refreshToken(refreshToken.value)

      if (!response.success || !response.session) {
        console.error('Token refresh failed:', response.error || response.message)
        // Only logout if it's truly invalid, not on network errors
        if (response.error?.includes('Invalid') || response.error?.includes('expired')) {
          await logout()
        }
        return false
      }

      console.log('Token refreshed successfully')
      storeSession(response.session)
      return true
    } catch (err: any) {
      console.error('Token refresh error:', err.message || err)
      // Don't logout on network errors, let them retry
      return false
    }
  }

  // Actions
  async function signup(email: string, password: string) {
    loading.value = true
    error.value = null

    try {
      const response = await api.signup(email, password)

      if (!response.success) {
        error.value = response.error || 'Signup failed'
        return { success: false, error: error.value }
      }

      // Check if email confirmation is required
      if (response.email_confirmation_required || !response.session) {
        return {
          success: true,
          emailConfirmationRequired: true,
          message: 'Please check your email to confirm your account, then login.',
        }
      }

      // Auto-login if session is provided
      if (response.session) {
        storeSession(response.session)
        await loadProfile()
      }

      return { success: true }
    } catch (err: any) {
      error.value = err.message || 'Network error'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  async function login(email: string, password: string) {
    loading.value = true
    error.value = null

    try {
      const response = await api.login(email, password)

      if (!response.success || !response.session) {
        error.value = response.error || 'Login failed'
        return { success: false, error: error.value }
      }

      storeSession(response.session)
      await loadProfile()

      return { success: true }
    } catch (err: any) {
      error.value = err.message || 'Network error'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  async function logout() {
    loading.value = true
    error.value = null

    try {
      await api.logout()
    } catch (err) {
      // Continue logout even if API call fails
    } finally {
      clearSession()
      loading.value = false
    }
  }

  async function loadProfile() {
    // Check localStorage for token if not in state
    if (!accessToken.value) {
      const storedToken = localStorage.getItem('access_token')
      if (storedToken) {
        accessToken.value = storedToken
      } else {
        initialized.value = true
        return
      }
    }

    loading.value = true
    error.value = null

    try {
      console.log('Loading user profile...')
      const response = await api.getProfile()

      if (!response.success || !response.user) {
        console.log('Profile load failed, attempting token refresh...')
        // Token is invalid, try to refresh
        const refreshed = await refreshAccessToken()
        if (refreshed) {
          console.log('Token refreshed, retrying profile load...')
          // Try loading profile again with new token (but only once to avoid infinite loop)
          loading.value = true
          const retryResponse = await api.getProfile()
          if (retryResponse.success && retryResponse.user) {
            user.value = retryResponse.user
            console.log('Profile loaded successfully after refresh')
            // Sync subscription after successful login
            syncSubscriptionInBackground()
          } else {
            console.error('Profile load failed even after refresh')
            await logout()
          }
          return
        } else {
          // Refresh failed, clear auth state
          console.log('Token refresh failed, logging out')
          await logout()
          return
        }
      }

      user.value = response.user
      console.log('Profile loaded successfully')

      // Sync subscription after successful profile load
      syncSubscriptionInBackground()
    } catch (err: any) {
      console.error('Profile load error:', err.message)
      error.value = err.message || 'Failed to load profile'
      // Try to refresh token on error (but don't logout immediately on network errors)
      const refreshed = await refreshAccessToken()
      if (refreshed) {
        // Retry profile load after successful refresh
        try {
          const retryResponse = await api.getProfile()
          if (retryResponse.success && retryResponse.user) {
            user.value = retryResponse.user
            syncSubscriptionInBackground()
          }
        } catch (retryErr) {
          console.error('Retry failed:', retryErr)
        }
      }
    } finally {
      loading.value = false
      initialized.value = true
    }
  }

  // Sync subscription in background without blocking
  async function syncSubscriptionInBackground() {
    try {
      console.log('Syncing subscription in background...')
      const response = await api.syncSubscription()

      if (response.success) {
        console.log('Subscription synced successfully')
        // Refresh profile to get updated data
        const profileResponse = await api.getProfile()
        if (profileResponse.success && profileResponse.user) {
          user.value = profileResponse.user
        }
      } else {
        console.log('Subscription sync returned no changes or error:', response.message)
      }
    } catch (err: any) {
      // Silent fail - don't disrupt user experience
      console.log('Background subscription sync failed:', err.message)
    }
  }

  async function refreshProfile() {
    await loadProfile()
  }

  // Check if token is expired or about to expire
  function isTokenExpired(): boolean {
    if (!tokenExpiresAt.value) return false
    // Consider expired if less than 1 minute remaining
    return Date.now() >= tokenExpiresAt.value - 60 * 1000
  }

  // Wait for initialization to complete
  async function waitForInitialization(): Promise<void> {
    if (initialized.value) return

    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (initialized.value) {
          clearInterval(checkInterval)
          resolve()
        }
      }, 50)

      // Timeout after 5 seconds
      setTimeout(() => {
        clearInterval(checkInterval)
        initialized.value = true
        resolve()
      }, 5000)
    })
  }

  // Initialize auth state on store creation
  if (accessToken.value && refreshToken.value) {
    console.log('Initializing auth with stored tokens')
    console.log('Token expires at:', tokenExpiresAt.value ? new Date(tokenExpiresAt.value).toISOString() : 'unknown')
    console.log('Current time:', new Date().toISOString())
    console.log('Is expired:', isTokenExpired())

    // Only refresh if token is truly expired (less than 1 minute left)
    if (isTokenExpired()) {
      console.log('Token is expired, refreshing...')
      refreshAccessToken().then((success) => {
        if (success) {
          loadProfile()
        } else {
          initialized.value = true
        }
      })
    } else {
      // Token is still valid, just load profile
      console.log('Token is still valid, loading profile...')
      loadProfile()
      scheduleTokenRefresh()
    }
  } else {
    // No tokens, mark as initialized
    console.log('No tokens found, marking as initialized')
    initialized.value = true
  }

  return {
    // State
    user,
    accessToken,
    refreshToken,
    loading,
    error,
    initialized,

    // Computed
    isAuthenticated,
    subscriptionTier,
    usageStats,
    canGenerateContent,
    canGenerateVideo,

    // Actions
    signup,
    login,
    logout,
    loadProfile,
    refreshProfile,
    refreshAccessToken,
    waitForInitialization,
  }
})
