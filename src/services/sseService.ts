import { useNotificationStore } from '@/stores/notifications'
import { API_URL } from './apiBase'
import { debugLog, debugError, warnLog, errorLog } from '@/utils/debug'

class SSEService {
  private eventSource: EventSource | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private currentToken: string | null = null

  /**
   * Connect to the SSE notification stream
   */
  connect(token: string): void {
    // Don't reconnect if already connected with same token
    if (this.eventSource && this.currentToken === token) {
      debugLog('[SSE] Already connected')
      return
    }

    // Disconnect existing connection
    if (this.eventSource) {
      this.disconnect()
    }

    this.currentToken = token
    const url = `${API_URL}/api/notifications/stream?token=${encodeURIComponent(token)}`

    debugLog('[SSE] Connecting to notification stream...')
    this.eventSource = new EventSource(url)

    this.eventSource.onopen = () => {
      debugLog('[SSE] Connected successfully')
      this.reconnectAttempts = 0
    }

    // Handle connection confirmation
    this.eventSource.addEventListener('connected', (event) => {
      debugLog('[SSE] Server confirmed connection:', event.data)
    })

    // Handle publish success notifications
    this.eventSource.addEventListener('publish-success', (event) => {
      try {
        const data = JSON.parse(event.data)
        debugLog('[SSE] Publish success:', data)
        const store = useNotificationStore()
        store.addPublishSuccess(data.platform, data.postUrl)
      } catch (error) {
        debugError('[SSE] Error parsing publish-success event:', error)
      }
    })

    // Handle publish error notifications
    this.eventSource.addEventListener('publish-error', (event) => {
      try {
        const data = JSON.parse(event.data)
        debugLog('[SSE] Publish error:', data)
        const store = useNotificationStore()
        store.addPublishError(data.platform, data.error)
      } catch (error) {
        debugError('[SSE] Error parsing publish-error event:', error)
      }
    })

    // Handle heartbeat (just to confirm connection is alive)
    this.eventSource.addEventListener('heartbeat', () => {
      // Connection is alive, no action needed
    })

    // Handle engagement update events
    this.eventSource.addEventListener('engagement-update', (event) => {
      try {
        const data = JSON.parse(event.data)
        debugLog('[SSE] Engagement update:', data)

        // Dynamically import the engagement store to avoid circular dependencies
        import('@/stores/engagement').then(({ useEngagementStore }) => {
          const engagementStore = useEngagementStore()
          engagementStore.updatePostEngagement(
            data.scheduled_post_id,
            data.platform,
            data.metrics
          )
        })
      } catch (error) {
        debugError('[SSE] Error parsing engagement-update event:', error)
      }
    })

    // Handle connection errors
    this.eventSource.onerror = (error) => {
      errorLog('[SSE] Connection error:', error)

      // EventSource automatically tries to reconnect on error
      // But we can implement our own backoff if needed
      if (this.eventSource?.readyState === EventSource.CLOSED) {
        this.handleReconnect()
      }
    }
  }

  /**
   * Handle reconnection with exponential backoff
   */
  private handleReconnect(): void {
    if (!this.currentToken) {
      warnLog('[SSE] No token available for reconnection')
      return
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      errorLog('[SSE] Max reconnect attempts reached')
      return
    }

    this.reconnectAttempts++
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)

    debugLog(`[SSE] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`)

    setTimeout(() => {
      if (this.currentToken) {
        this.connect(this.currentToken)
      }
    }, delay)
  }

  /**
   * Disconnect from the SSE stream
   */
  disconnect(): void {
    if (this.eventSource) {
      debugLog('[SSE] Disconnecting...')
      this.eventSource.close()
      this.eventSource = null
      this.currentToken = null
      this.reconnectAttempts = 0
    }
  }

  /**
   * Check if currently connected
   */
  isConnected(): boolean {
    return this.eventSource !== null && this.eventSource.readyState === EventSource.OPEN
  }
}

export const sseService = new SSEService()
