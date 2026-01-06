import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { debugWarn, debugLog } from '@/utils/debug'
import { api } from '@/services/api'
import { useNotificationStore } from './notifications'
import { favoritesService } from '@/services/favoritesService'

export interface VideoGenerationTask {
  id: string
  postId: string
  postTitle: string
  operationId: string
  modelId?: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress?: number
  videoUrl?: string
  errorMessage?: string
  startedAt: Date
  completedAt?: Date
}

const STORAGE_KEY = 'video-generation-tasks'
const POLL_INTERVAL = 5000 // 5 seconds
const MAX_POLL_ATTEMPTS = 180 // 15 minutes max

export const useVideoGenerationStore = defineStore('videoGeneration', () => {
  // State
  const tasks = ref<VideoGenerationTask[]>([])
  const pollingIntervals = ref<Map<string, ReturnType<typeof setInterval>>>(new Map())

  // Computed
  const activeTasks = computed(() =>
    tasks.value.filter(t => t.status === 'pending' || t.status === 'processing')
  )

  const hasActiveTasks = computed(() => activeTasks.value.length > 0)

  const completedTasks = computed(() =>
    tasks.value.filter(t => t.status === 'completed' || t.status === 'failed')
  )

  // Actions
  function addTask(task: Omit<VideoGenerationTask, 'id' | 'startedAt' | 'status'>): VideoGenerationTask {
    const newTask: VideoGenerationTask = {
      ...task,
      id: `vgen-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      status: 'processing',
      startedAt: new Date()
    }

    tasks.value.unshift(newTask)
    saveToStorage()

    // Start polling for this task
    startPolling(newTask.id)

    return newTask
  }

  function updateTask(taskId: string, updates: Partial<VideoGenerationTask>) {
    const task = tasks.value.find(t => t.id === taskId)
    if (task) {
      Object.assign(task, updates)
      saveToStorage()
    }
  }

  function removeTask(taskId: string) {
    stopPolling(taskId)
    const index = tasks.value.findIndex(t => t.id === taskId)
    if (index !== -1) {
      tasks.value.splice(index, 1)
      saveToStorage()
    }
  }

  function clearCompletedTasks() {
    tasks.value = tasks.value.filter(t => t.status === 'pending' || t.status === 'processing')
    saveToStorage()
  }

  // Polling logic
  async function pollTaskStatus(taskId: string, attemptCount = 0) {
    const task = tasks.value.find(t => t.id === taskId)
    if (!task || task.status === 'completed' || task.status === 'failed') {
      stopPolling(taskId)
      return
    }

    if (attemptCount >= MAX_POLL_ATTEMPTS) {
      updateTask(taskId, {
        status: 'failed',
        errorMessage: 'Video generation timed out',
        completedAt: new Date()
      })
      stopPolling(taskId)
      addFailureNotification(task)
      return
    }

    try {
      const response = await api.pollVideoOperation(task.operationId, task.modelId)

      if (!response.success) {
        debugWarn('Polling response not successful:', response.error)
        return
      }

      const operation = (response as any).operation || response.data?.operation

      if (operation?.done) {
        if (operation.error) {
          updateTask(taskId, {
            status: 'failed',
            errorMessage: operation.error,
            completedAt: new Date()
          })
          stopPolling(taskId)
          addFailureNotification(task, operation.error)
        } else {
          const videoUrl = operation.videoUrl || operation.filePath || ''
          // Video is ready - save to database
          await saveVideoToPost(task.postId, videoUrl)

          updateTask(taskId, {
            status: 'completed',
            videoUrl,
            completedAt: new Date()
          })
          stopPolling(taskId)
          addSuccessNotification(task, videoUrl)
        }
      }
      // Still processing - just wait for next poll
    } catch (error: any) {
      debugWarn('Error polling video status:', error)
      // Don't fail immediately on network errors - keep trying
    }
  }

  async function saveVideoToPost(postId: string, videoUrl: string) {
    try {
      await favoritesService.updateFavorite(postId, {
        video_url: videoUrl,
        content_type: 'video'
      })
      debugLog('Video saved to post:', postId)
    } catch (error) {
      debugWarn('Failed to save video to post:', error)
    }
  }

  function startPolling(taskId: string) {
    if (pollingIntervals.value.has(taskId)) {
      return // Already polling
    }

    let attemptCount = 0
    const interval = setInterval(() => {
      attemptCount++
      pollTaskStatus(taskId, attemptCount)
    }, POLL_INTERVAL)

    pollingIntervals.value.set(taskId, interval)

    // Also do an immediate poll
    pollTaskStatus(taskId, 0)
  }

  function stopPolling(taskId: string) {
    const interval = pollingIntervals.value.get(taskId)
    if (interval) {
      clearInterval(interval)
      pollingIntervals.value.delete(taskId)
    }
  }

  function stopAllPolling() {
    pollingIntervals.value.forEach((interval) => {
      clearInterval(interval)
    })
    pollingIntervals.value.clear()
  }

  // Notifications
  function addSuccessNotification(task: VideoGenerationTask, _videoUrl: string) {
    const notificationStore = useNotificationStore()
    notificationStore.addNotification({
      type: 'success',
      title: 'Video Ready',
      message: `Video for "${task.postTitle}" is ready to view`,
      postUrl: `/posts?openPost=${task.postId}`
    })
  }

  function addFailureNotification(task: VideoGenerationTask, errorMessage?: string) {
    const notificationStore = useNotificationStore()
    notificationStore.addNotification({
      type: 'error',
      title: 'Video Generation Failed',
      message: errorMessage || `Failed to generate video for "${task.postTitle}"`
    })
  }

  // Persistence
  function saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks.value))
    } catch (e) {
      debugWarn('Failed to save video generation tasks to localStorage:', e)
    }
  }

  function loadFromStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        tasks.value = parsed.map((t: any) => ({
          ...t,
          startedAt: new Date(t.startedAt),
          completedAt: t.completedAt ? new Date(t.completedAt) : undefined
        }))

        // Resume polling for any active tasks
        tasks.value.forEach(task => {
          if (task.status === 'pending' || task.status === 'processing') {
            startPolling(task.id)
          }
        })
      }
    } catch (e) {
      debugWarn('Failed to load video generation tasks from localStorage:', e)
    }
  }

  // Initialize from storage
  loadFromStorage()

  return {
    // State
    tasks,

    // Computed
    activeTasks,
    hasActiveTasks,
    completedTasks,

    // Actions
    addTask,
    updateTask,
    removeTask,
    clearCompletedTasks,
    startPolling,
    stopPolling,
    stopAllPolling,
    loadFromStorage
  }
})
