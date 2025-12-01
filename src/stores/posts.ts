import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { schedulerService } from '../services/schedulerService'

export interface ScheduledPost {
  id: string
  post_text?: string
  media_url?: string
  content_type?: 'image' | 'video' | 'carousel' | 'story' | 'reel'
  platform?: string
  platforms?: string[]
  status?: 'scheduled' | 'published' | 'failed' | 'pending' | 'draft'
  scheduled_date?: string
  scheduled_time?: string
  timezone?: string
  restaurant_id?: string
  restaurant_name?: string
  error_message?: string
  platform_post_url?: string
  platform_post_urls?: Record<string, string>
  created_at?: string
  updated_at?: string
}

export interface PostFilters {
  status?: string
  month?: number
  year?: number
  platforms?: string[]
  restaurant_ids?: string[]
}

export const usePostsStore = defineStore('posts', () => {
  // State
  const posts = ref<ScheduledPost[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const filters = ref<PostFilters>({})
  const lastFetchTime = ref<number | null>(null)

  // Computed
  const scheduledPosts = computed(() =>
    posts.value.filter(p => p.status === 'scheduled')
  )

  const publishedPosts = computed(() =>
    posts.value.filter(p => p.status === 'published')
  )

  const failedPosts = computed(() =>
    posts.value.filter(p => p.status === 'failed')
  )

  const pendingPosts = computed(() =>
    posts.value.filter(p => p.status === 'pending')
  )

  const postsByDate = computed(() => {
    const grouped: Record<string, ScheduledPost[]> = {}
    posts.value.forEach(post => {
      const date = post.scheduled_date || 'unscheduled'
      if (!grouped[date]) {
        grouped[date] = []
      }
      grouped[date].push(post)
    })
    return grouped
  })

  const upcomingPosts = computed(() => {
    const now = new Date()
    return posts.value
      .filter(p => {
        if (p.status !== 'scheduled') return false
        if (!p.scheduled_date) return false
        const postDate = new Date(p.scheduled_date)
        return postDate >= now
      })
      .sort((a, b) => {
        const dateA = new Date(a.scheduled_date || 0)
        const dateB = new Date(b.scheduled_date || 0)
        return dateA.getTime() - dateB.getTime()
      })
      .slice(0, 10)
  })

  // Actions
  async function fetchPosts(newFilters?: PostFilters): Promise<void> {
    loading.value = true
    error.value = null

    if (newFilters) {
      filters.value = { ...filters.value, ...newFilters }
    }

    try {
      const response = await schedulerService.getScheduledPosts(filters.value)

      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch posts')
      }

      posts.value = response.data?.scheduled_posts || []
      lastFetchTime.value = Date.now()
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch posts'
      console.error('Failed to fetch posts:', err)
    } finally {
      loading.value = false
    }
  }

  async function fetchPostsForMonth(month: number, year: number): Promise<void> {
    return fetchPosts({ month, year })
  }

  async function refreshPosts(): Promise<void> {
    return fetchPosts()
  }

  function getPostsForDate(dateString: string): ScheduledPost[] {
    return posts.value.filter(post => post.scheduled_date === dateString)
  }

  function getPostById(id: string): ScheduledPost | undefined {
    return posts.value.find(post => post.id === id)
  }

  async function cancelPost(id: string): Promise<boolean> {
    loading.value = true
    error.value = null

    try {
      const response = await schedulerService.cancelScheduledPost(id)

      if (!response.success) {
        throw new Error(response.error || 'Failed to cancel post')
      }

      // Remove from local state
      posts.value = posts.value.filter(post => post.id !== id)
      return true
    } catch (err: any) {
      error.value = err.message || 'Failed to cancel post'
      console.error('Failed to cancel post:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  async function updatePost(id: string, updates: Partial<ScheduledPost>): Promise<boolean> {
    loading.value = true
    error.value = null

    try {
      const response = await schedulerService.updateScheduledPost(id, updates)

      if (!response.success) {
        throw new Error(response.error || 'Failed to update post')
      }

      // Update local state
      const index = posts.value.findIndex(post => post.id === id)
      if (index !== -1 && response.data?.scheduled_post) {
        posts.value[index] = response.data.scheduled_post
      }
      return true
    } catch (err: any) {
      error.value = err.message || 'Failed to update post'
      console.error('Failed to update post:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  function setFilters(newFilters: PostFilters): void {
    filters.value = newFilters
  }

  function clearFilters(): void {
    filters.value = {}
  }

  function clearError(): void {
    error.value = null
  }

  // Check if data is stale (older than 5 minutes)
  function isStale(): boolean {
    if (!lastFetchTime.value) return true
    const fiveMinutes = 5 * 60 * 1000
    return Date.now() - lastFetchTime.value > fiveMinutes
  }

  return {
    // State
    posts,
    loading,
    error,
    filters,
    lastFetchTime,

    // Computed
    scheduledPosts,
    publishedPosts,
    failedPosts,
    pendingPosts,
    postsByDate,
    upcomingPosts,

    // Actions
    fetchPosts,
    fetchPostsForMonth,
    refreshPosts,
    getPostsForDate,
    getPostById,
    cancelPost,
    updatePost,
    setFilters,
    clearFilters,
    clearError,
    isStale,
  }
})
