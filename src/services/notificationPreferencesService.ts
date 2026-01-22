import type { ApiResponse } from './apiBase'
import { API_URL, getAuthHeaders } from './apiBase'
import type { NotificationPreferences } from '@/types/notifications'

class NotificationPreferencesService {
  /**
   * Get user's notification preferences
   */
  async getPreferences(): Promise<ApiResponse<{ preferences: NotificationPreferences }>> {
    try {
      const response = await fetch(`${API_URL}/api/notifications/preferences`, {
        headers: getAuthHeaders(),
      })
      return response.json()
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to fetch notification preferences',
      }
    }
  }

  /**
   * Update user's notification preferences
   */
  async updatePreferences(
    preferences: Partial<NotificationPreferences>,
  ): Promise<ApiResponse<{ preferences: NotificationPreferences }>> {
    try {
      const response = await fetch(`${API_URL}/api/notifications/preferences`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(preferences),
      })
      return response.json()
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to update notification preferences',
      }
    }
  }

  /**
   * Send test email (for testing preferences)
   */
  async sendTestEmail(
    type: 'post_published' | 'post_failed' | 'digest',
  ): Promise<ApiResponse> {
    try {
      const response = await fetch(`${API_URL}/api/notifications/test`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ type }),
      })
      return response.json()
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to send test email',
      }
    }
  }

  /**
   * Test Sentry integration by sending a test error to backend
   */
  async testSentry(): Promise<ApiResponse<{ eventId: string }>> {
    try {
      const response = await fetch(`${API_URL}/api/notifications/test-sentry`, {
        method: 'POST',
        headers: getAuthHeaders(),
      })
      return response.json()
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to send test error to Sentry',
      }
    }
  }

  /**
   * Test Discord bot by sending a test message
   */
  async testDiscord(
    type: 'simple' | 'error' | 'success' | 'post_published' | 'post_failed' = 'simple',
  ): Promise<ApiResponse<{ type: string }>> {
    try {
      const response = await fetch(`${API_URL}/api/notifications/test-discord`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ type }),
      })
      return response.json()
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to send test message to Discord',
      }
    }
  }

  /**
   * Submit user feedback
   */
  async submitFeedback(message: string): Promise<ApiResponse> {
    try {
      const response = await fetch(`${API_URL}/api/notifications/feedback`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ message }),
      })
      return response.json()
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to submit feedback',
      }
    }
  }
}

export const notificationPreferencesService = new NotificationPreferencesService()
