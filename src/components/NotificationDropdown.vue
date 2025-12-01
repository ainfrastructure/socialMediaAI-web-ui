<template>
  <div class="notification-dropdown-wrapper" ref="dropdownRef">
    <!-- Bell Button -->
    <button
      class="notification-btn"
      :class="{ 'has-unread': hasUnread }"
      @click="toggleDropdown"
      :aria-label="$t('sidebar.notifications')"
    >
      <MaterialIcon icon="notifications" size="md" />
      <span v-if="unreadCount > 0" class="unread-badge">
        {{ unreadCount > 9 ? '9+' : unreadCount }}
      </span>
    </button>

    <!-- Dropdown Panel -->
    <Transition name="dropdown">
      <div v-if="isOpen" class="notification-dropdown">
        <!-- Header -->
        <div class="dropdown-header">
          <h3 class="dropdown-title">{{ $t('sidebar.notifications') }}</h3>
          <button
            v-if="notifications.length > 0"
            class="mark-all-btn"
            @click="markAllAsRead"
          >
            Mark all read
          </button>
        </div>

        <!-- Notifications List -->
        <div class="notifications-list" v-if="notifications.length > 0">
          <div
            v-for="notification in sortedNotifications"
            :key="notification.id"
            :class="['notification-item', { unread: !notification.read }]"
            @click="handleNotificationClick(notification)"
          >
            <!-- Icon -->
            <div :class="['notification-icon', `icon-${notification.type}`, notification.platform ? `platform-${notification.platform}` : '']">
              <PlatformLogo
                v-if="notification.platform"
                :platform="notification.platform"
                :size="18"
              />
              <MaterialIcon
                v-else-if="notification.type === 'success'"
                icon="check_circle"
                size="sm"
              />
              <MaterialIcon
                v-else-if="notification.type === 'error'"
                icon="error"
                size="sm"
              />
              <MaterialIcon
                v-else-if="notification.type === 'warning'"
                icon="warning"
                size="sm"
              />
              <MaterialIcon
                v-else
                icon="info"
                size="sm"
              />
            </div>

            <!-- Content -->
            <div class="notification-content">
              <div class="notification-title">{{ notification.title }}</div>
              <div class="notification-message">{{ notification.message }}</div>
              <div class="notification-time">{{ formatTimeAgo(notification.timestamp) }}</div>
            </div>

            <!-- External link indicator -->
            <div v-if="notification.postUrl" class="notification-link">
              <MaterialIcon icon="open_in_new" size="xs" />
            </div>

            <!-- Unread dot -->
            <div v-if="!notification.read" class="unread-dot"></div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else class="notifications-empty">
          <MaterialIcon icon="notifications_none" size="lg" />
          <p>No notifications yet</p>
        </div>

        <!-- Footer -->
        <div v-if="notifications.length > 0" class="dropdown-footer">
          <button class="clear-all-btn" @click="clearAll">
            Clear all
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useNotificationStore, type Notification } from '../stores/notifications'
import MaterialIcon from './MaterialIcon.vue'
import PlatformLogo from './PlatformLogo.vue'

const notificationStore = useNotificationStore()

const dropdownRef = ref<HTMLElement | null>(null)
const isOpen = ref(false)

// Computed from store
const notifications = computed(() => notificationStore.notifications)
const sortedNotifications = computed(() => notificationStore.sortedNotifications)
const unreadCount = computed(() => notificationStore.unreadCount)
const hasUnread = computed(() => notificationStore.hasUnread)

// Actions
const toggleDropdown = () => {
  isOpen.value = !isOpen.value
}

const markAllAsRead = () => {
  notificationStore.markAllAsRead()
}

const clearAll = () => {
  notificationStore.clearAll()
  isOpen.value = false
}

const handleNotificationClick = (notification: Notification) => {
  // Mark as read
  if (!notification.read) {
    notificationStore.markAsRead(notification.id)
  }

  // Open post URL if available
  if (notification.postUrl) {
    window.open(notification.postUrl, '_blank', 'noopener,noreferrer')
  }
}

// Format time ago
const formatTimeAgo = (date: Date): string => {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) return 'Just now'
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60)
    return `${minutes}m ago`
  }
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600)
    return `${hours}h ago`
  }
  if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400)
    return `${days}d ago`
  }

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// Click outside to close
const handleClickOutside = (event: MouseEvent) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.notification-dropdown-wrapper {
  position: relative;
}

.notification-btn {
  position: relative;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  cursor: pointer;
  transition: var(--transition-base);
}

.notification-btn:hover {
  background: var(--bg-elevated);
  border-color: var(--gold-primary);
  color: var(--gold-primary);
}

.notification-btn.has-unread {
  color: var(--gold-primary);
}

.unread-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  background: #ef4444;
  color: white;
  font-size: 10px;
  font-weight: var(--font-bold);
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

/* Dropdown */
.notification-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 360px;
  max-height: 480px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
  overflow: hidden;
  z-index: 1000;
  display: flex;
  flex-direction: column;
}

/* Header */
.dropdown-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-md) var(--space-lg);
  border-bottom: 1px solid var(--border-color);
  background: rgba(13, 13, 13, 0.8);
}

.dropdown-title {
  font-family: var(--font-heading);
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin: 0;
}

.mark-all-btn {
  background: transparent;
  border: none;
  color: var(--gold-primary);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  cursor: pointer;
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--radius-sm);
  transition: background var(--transition-fast);
}

.mark-all-btn:hover {
  background: rgba(212, 175, 55, 0.1);
}

/* Notifications List */
.notifications-list {
  flex: 1;
  overflow-y: auto;
  max-height: 360px;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  gap: var(--space-md);
  padding: var(--space-md) var(--space-lg);
  cursor: pointer;
  transition: background var(--transition-fast);
  position: relative;
  border-bottom: 1px solid var(--border-color);
}

.notification-item:last-child {
  border-bottom: none;
}

.notification-item:hover {
  background: rgba(212, 175, 55, 0.05);
}

.notification-item.unread {
  background: rgba(212, 175, 55, 0.08);
}

.notification-item.unread:hover {
  background: rgba(212, 175, 55, 0.12);
}

/* Icon */
.notification-icon {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.notification-icon.icon-success {
  background: rgba(34, 197, 94, 0.15);
  color: #22c55e;
}

.notification-icon.icon-error {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
}

.notification-icon.icon-warning {
  background: rgba(251, 191, 36, 0.15);
  color: #fbbf24;
}

.notification-icon.icon-info {
  background: rgba(59, 130, 246, 0.15);
  color: #3b82f6;
}

/* Platform-specific icons */
.notification-icon.platform-facebook {
  background: rgba(24, 119, 242, 0.15);
}

.notification-icon.platform-instagram {
  background: linear-gradient(45deg, rgba(240, 148, 51, 0.15), rgba(225, 48, 108, 0.15));
}

.notification-icon.platform-tiktok {
  background: rgba(105, 201, 208, 0.15);
}

/* Content */
.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-title {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin-bottom: 2px;
}

.notification-message {
  font-size: var(--text-xs);
  color: var(--text-secondary);
  line-height: 1.4;
  margin-bottom: 4px;
}

.notification-time {
  font-size: 10px;
  color: var(--text-muted);
}

/* Link indicator */
.notification-link {
  color: var(--text-muted);
  flex-shrink: 0;
}

/* Unread dot */
.unread-dot {
  position: absolute;
  top: 50%;
  right: var(--space-md);
  transform: translateY(-50%);
  width: 8px;
  height: 8px;
  background: var(--gold-primary);
  border-radius: 50%;
}

/* Empty State */
.notifications-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-3xl) var(--space-xl);
  color: var(--text-muted);
}

.notifications-empty p {
  margin: var(--space-md) 0 0;
  font-size: var(--text-sm);
}

/* Footer */
.dropdown-footer {
  padding: var(--space-sm) var(--space-lg);
  border-top: 1px solid var(--border-color);
  background: rgba(13, 13, 13, 0.8);
}

.clear-all-btn {
  width: 100%;
  padding: var(--space-sm);
  background: transparent;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-muted);
  font-size: var(--text-xs);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.clear-all-btn:hover {
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.3);
  color: #ef4444;
}

/* Transition */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* Responsive */
@media (max-width: 480px) {
  .notification-dropdown {
    position: fixed;
    top: 60px;
    left: var(--space-md);
    right: var(--space-md);
    width: auto;
    max-height: calc(100vh - 80px);
  }
}
</style>
