import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '@/services/api'
import type { NotificationPreferences } from '@/types/notifications'
import { debugLog, debugError } from '@/utils/debug'

export const useNotificationPreferencesStore = defineStore('notificationPreferences', () => {
  // State
  const preferences = ref<NotificationPreferences | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const initialized = ref(false)

  // Computed
  const hasPostNotificationsEnabled = computed(() => {
    if (!preferences.value) return false
    return (
      preferences.value.notify_post_published ||
      preferences.value.notify_post_failed ||
      preferences.value.notify_post_scheduled
    )
  })

  const hasDigestEnabled = computed(() => {
    return preferences.value?.digest_frequency !== 'never'
  })

  // Actions
  async function loadPreferences() {
    loading.value = true
    error.value = null

    try {
      debugLog('[NotificationPreferences] Loading preferences...')
      const response = await api.getNotificationPreferences()

      if (!response.success || !response.data?.preferences) {
        error.value = response.error || 'Failed to load notification preferences'
        return
      }

      preferences.value = response.data.preferences
      initialized.value = true
      debugLog('[NotificationPreferences] Loaded:', preferences.value)
    } catch (err: any) {
      debugError('[NotificationPreferences] Error loading:', err)
      error.value = err.message || 'Network error'
    } finally {
      loading.value = false
    }
  }

  async function updatePreferences(updates: Partial<NotificationPreferences>) {
    loading.value = true
    error.value = null

    try {
      debugLog('[NotificationPreferences] Updating:', updates)
      const response = await api.updateNotificationPreferences(updates)

      if (!response.success || !response.data?.preferences) {
        error.value = response.error || 'Failed to update preferences'
        return { success: false, error: error.value }
      }

      preferences.value = response.data.preferences
      debugLog('[NotificationPreferences] Updated successfully')
      return { success: true }
    } catch (err: any) {
      debugError('[NotificationPreferences] Error updating:', err)
      error.value = err.message || 'Network error'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  async function sendTestEmail(type: 'post_published' | 'post_failed' | 'digest') {
    loading.value = true
    error.value = null

    try {
      debugLog('[NotificationPreferences] Sending test email:', type)
      const response = await api.sendTestEmail(type)

      if (!response.success) {
        error.value = response.error || 'Failed to send test email'
        return { success: false, error: error.value }
      }

      debugLog('[NotificationPreferences] Test email sent successfully')
      return { success: true }
    } catch (err: any) {
      debugError('[NotificationPreferences] Error sending test email:', err)
      error.value = err.message || 'Network error'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  function resetPreferences() {
    preferences.value = null
    initialized.value = false
    error.value = null
  }

  return {
    // State
    preferences,
    loading,
    error,
    initialized,

    // Computed
    hasPostNotificationsEnabled,
    hasDigestEnabled,

    // Actions
    loadPreferences,
    updatePreferences,
    sendTestEmail,
    resetPreferences,
  }
})
