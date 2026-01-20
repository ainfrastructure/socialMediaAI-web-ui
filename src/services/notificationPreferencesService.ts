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
}

export const notificationPreferencesService = new NotificationPreferencesService()
