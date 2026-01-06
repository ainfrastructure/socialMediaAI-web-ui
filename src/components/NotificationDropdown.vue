<template>
  <div class="notification-dropdown-wrapper" ref="dropdownRef">
    <!-- Bell Button -->
    <button
      class="notification-btn"
      :class="{ 'has-unread': hasUnread, 'has-active': hasActiveTasks }"
      @click="toggleDropdown"
      :aria-label="$t('sidebar.notifications')"
    >
      <MaterialIcon icon="notifications" size="md" />
      <span v-if="unreadCount > 0" class="unread-badge">
        {{ unreadCount > 9 ? '9+' : unreadCount }}
      </span>
      <!-- Active generation indicator -->
      <span v-if="hasActiveTasks" class="active-indicator">
        <span class="pulse-ring"></span>
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

        <!-- Active Video Generation Tasks -->
        <div v-if="activeTasks.length > 0" class="active-tasks-section">
          <div class="active-tasks-header">
            <MaterialIcon icon="movie" size="sm" />
            <span>Generating Videos</span>
          </div>
          <div
            v-for="task in activeTasks"
            :key="task.id"
            class="active-task-item"
          >
            <div class="task-spinner"></div>
            <div class="task-content">
              <div class="task-title">{{ task.postTitle }}</div>
              <div class="task-status">Creating video...</div>
            </div>
          </div>
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

            <!-- Open post button - golden and clickable -->
            <button
              v-if="notification.postUrl"
              class="notification-link"
              @click.stop="openPostUrl(notification.postUrl)"
              :aria-label="'View post'"
              title="View post"
            >
              <MaterialIcon icon="open_in_new" size="sm" />
            </button>
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
import { useRouter } from 'vue-router'
import { useNotificationStore, type Notification } from '../stores/notifications'
import { useVideoGenerationStore } from '../stores/videoGeneration'
import MaterialIcon from './MaterialIcon.vue'
import PlatformLogo from './PlatformLogo.vue'

const router = useRouter()
const notificationStore = useNotificationStore()
const videoGenerationStore = useVideoGenerationStore()

const dropdownRef = ref<HTMLElement | null>(null)
const isOpen = ref(false)

// Computed from stores
const notifications = computed(() => notificationStore.notifications)
const sortedNotifications = computed(() => notificationStore.sortedNotifications)
const unreadCount = computed(() => notificationStore.unreadCount)
const hasUnread = computed(() => notificationStore.hasUnread)
const activeTasks = computed(() => videoGenerationStore.activeTasks)
const hasActiveTasks = computed(() => videoGenerationStore.hasActiveTasks)

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
  // Only mark as read - don't open URL (that's handled by the golden button)
  if (!notification.read) {
    notificationStore.markAsRead(notification.id)
  }
}

const openPostUrl = (url: string) => {
  // Check if it's an internal route (starts with /)
  if (url.startsWith('/')) {
    router.push(url)
    isOpen.value = false
  } else {
    window.open(url, '_blank', 'noopener,noreferrer')
  }
}

const openPost = (postId: string) => {
  router.push(`/posts?openPost=${postId}`)
  isOpen.value = false
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

/* Active generation indicator */
.notification-btn.has-active {
  border-color: var(--gold-primary);
}

.active-indicator {
  position: absolute;
  bottom: -2px;
  left: 50%;
  transform: translateX(-50%);
  width: 8px;
  height: 8px;
}

.pulse-ring {
  display: block;
  width: 8px;
  height: 8px;
  background: var(--gold-primary);
  border-radius: 50%;
  animation: pulse-ring 1.5s ease-out infinite;
}

@keyframes pulse-ring {
  0% {
    transform: scale(0.8);
    opacity: 1;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.7;
  }
  100% {
    transform: scale(0.8);
    opacity: 1;
  }
}

/* Active Tasks Section */
.active-tasks-section {
  background: rgba(15, 61, 46, 0.08);
  border-bottom: 1px solid var(--border-color);
  padding: var(--space-sm) var(--space-lg);
}

.active-tasks-header {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  color: var(--gold-primary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: var(--space-sm);
}

.active-task-item {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-sm) 0;
  border-radius: var(--radius-md);
}

.task-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(15, 61, 46, 0.2);
  border-top-color: var(--gold-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.task-content {
  flex: 1;
  min-width: 0;
}

.task-title {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.task-status {
  font-size: var(--text-xs);
  color: var(--text-muted);
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
  background: rgba(255, 255, 255, 0.85);
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
  background: rgba(15, 61, 46, 0.1);
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
  background: rgba(15, 61, 46, 0.05);
}

.notification-item.unread {
  background: rgba(15, 61, 46, 0.08);
}

.notification-item.unread:hover {
  background: rgba(15, 61, 46, 0.12);
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

/* Open post button - golden and clickable */
.notification-link {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: rgba(15, 61, 46, 0.1);
  border: 1px solid rgba(15, 61, 46, 0.3);
  border-radius: var(--radius-md);
  color: var(--gold-primary);
  cursor: pointer;
  transition: all var(--transition-fast);
  padding: 0;
}

.notification-link:hover {
  background: rgba(15, 61, 46, 0.2);
  border-color: var(--gold-primary);
  transform: scale(1.1);
  box-shadow: 0 0 8px rgba(15, 61, 46, 0.4);
}

.notification-link:active {
  transform: scale(0.95);
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
  background: rgba(255, 255, 255, 0.85);
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

  .notification-item {
    padding: var(--space-md);
    min-height: var(--touch-target-comfortable);
  }

  .notification-btn {
    min-width: var(--touch-target-min);
    min-height: var(--touch-target-min);
  }
}

@media (max-width: 390px) {
  .notification-dropdown {
    left: var(--space-sm);
    right: var(--space-sm);
    max-height: calc(100vh - 70px);
  }

  .dropdown-header {
    padding: var(--space-md);
  }

  .dropdown-header h3 {
    font-size: var(--text-base);
  }

  .notification-item {
    padding: var(--space-sm) var(--space-md);
  }

  .notification-title {
    font-size: var(--text-sm);
  }

  .notification-message {
    font-size: var(--text-xs);
  }

  .notification-time {
    font-size: 10px;
  }
}

/* ===== DARK MODE OVERRIDES ===== */
:root[data-theme="dark"] .notification-dropdown {
  background: var(--bg-secondary);
  border-color: var(--border-color);
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.5);
}

:root[data-theme="dark"] .dropdown-header {
  background: var(--bg-tertiary);
}

:root[data-theme="dark"] .mark-all-btn:hover {
  background: var(--accent-alpha-15);
}

:root[data-theme="dark"] .notification-item:hover {
  background: var(--accent-alpha-10);
}

:root[data-theme="dark"] .notification-item.unread {
  background: var(--accent-alpha-15);
}

:root[data-theme="dark"] .notification-item.unread:hover {
  background: var(--accent-alpha-20);
}

:root[data-theme="dark"] .notification-link {
  background: var(--accent-alpha-15);
  border-color: var(--accent-alpha-30);
}

:root[data-theme="dark"] .notification-link:hover {
  background: var(--accent-alpha-25);
  box-shadow: 0 0 8px var(--accent-alpha-40);
}

:root[data-theme="dark"] .dropdown-footer {
  background: var(--bg-tertiary);
}

:root[data-theme="dark"] .clear-all-btn:hover {
  background: rgba(220, 53, 69, 0.15);
  border-color: rgba(220, 53, 69, 0.3);
}
</style>
