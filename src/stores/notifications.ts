import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface Notification {
  id: string
  type: 'success' | 'error' | 'info' | 'warning'
  title: string
  message: string
  platform?: 'facebook' | 'instagram' | 'tiktok'
  postUrl?: string
  timestamp: Date
  read: boolean
}

export const useNotificationStore = defineStore('notifications', () => {
  // State
  const notifications = ref<Notification[]>([])
  const maxNotifications = 50 // Keep last 50 notifications

  // Computed
  const unreadCount = computed(() =>
    notifications.value.filter(n => !n.read).length
  )

  const hasUnread = computed(() => unreadCount.value > 0)

  const sortedNotifications = computed(() =>
    [...notifications.value].sort((a, b) =>
      b.timestamp.getTime() - a.timestamp.getTime()
    )
  )

  // Actions
  function addNotification(notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) {
    const newNotification: Notification = {
      ...notification,
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      read: false
    }

    notifications.value.unshift(newNotification)

    // Trim to max notifications
    if (notifications.value.length > maxNotifications) {
      notifications.value = notifications.value.slice(0, maxNotifications)
    }

    // Persist to localStorage
    saveToStorage()

    return newNotification
  }

  function addPublishSuccess(platform: 'facebook' | 'instagram' | 'tiktok', postUrl?: string) {
    const platformNames: Record<string, string> = {
      facebook: 'Facebook',
      instagram: 'Instagram',
      tiktok: 'TikTok'
    }

    return addNotification({
      type: 'success',
      title: 'Post Published',
      message: `Your post was successfully published to ${platformNames[platform]}`,
      platform,
      postUrl
    })
  }

  function addPublishError(platform: 'facebook' | 'instagram' | 'tiktok', errorMessage?: string) {
    const platformNames: Record<string, string> = {
      facebook: 'Facebook',
      instagram: 'Instagram',
      tiktok: 'TikTok'
    }

    return addNotification({
      type: 'error',
      title: 'Publish Failed',
      message: errorMessage || `Failed to publish to ${platformNames[platform]}`,
      platform
    })
  }

  function markAsRead(id: string) {
    const notification = notifications.value.find(n => n.id === id)
    if (notification) {
      notification.read = true
      saveToStorage()
    }
  }

  function markAllAsRead() {
    notifications.value.forEach(n => {
      n.read = true
    })
    saveToStorage()
  }

  function removeNotification(id: string) {
    const index = notifications.value.findIndex(n => n.id === id)
    if (index !== -1) {
      notifications.value.splice(index, 1)
      saveToStorage()
    }
  }

  function clearAll() {
    notifications.value = []
    saveToStorage()
  }

  // Persistence
  function saveToStorage() {
    try {
      localStorage.setItem('notifications', JSON.stringify(notifications.value))
    } catch (e) {
      console.warn('Failed to save notifications to localStorage:', e)
    }
  }

  function loadFromStorage() {
    try {
      const stored = localStorage.getItem('notifications')
      if (stored) {
        const parsed = JSON.parse(stored)
        notifications.value = parsed.map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp)
        }))
      }
    } catch (e) {
      console.warn('Failed to load notifications from localStorage:', e)
    }
  }

  // Initialize from storage
  loadFromStorage()

  return {
    // State
    notifications,

    // Computed
    unreadCount,
    hasUnread,
    sortedNotifications,

    // Actions
    addNotification,
    addPublishSuccess,
    addPublishError,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    loadFromStorage
  }
})
