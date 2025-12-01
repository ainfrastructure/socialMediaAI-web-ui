import { useNotificationStore } from '@/stores/notifications'
import { API_URL } from './apiBase'

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
      console.log('[SSE] Already connected')
      return
    }

    // Disconnect existing connection
    if (this.eventSource) {
      this.disconnect()
    }

    this.currentToken = token
    const url = `${API_URL}/api/notifications/stream?token=${encodeURIComponent(token)}`

    console.log('[SSE] Connecting to notification stream...')
    this.eventSource = new EventSource(url)

    this.eventSource.onopen = () => {
      console.log('[SSE] Connected successfully')
      this.reconnectAttempts = 0
    }

    // Handle connection confirmation
    this.eventSource.addEventListener('connected', (event) => {
      console.log('[SSE] Server confirmed connection:', event.data)
    })

    // Handle publish success notifications
    this.eventSource.addEventListener('publish-success', (event) => {
      try {
        const data = JSON.parse(event.data)
        console.log('[SSE] Publish success:', data)
        const store = useNotificationStore()
        store.addPublishSuccess(data.platform, data.postUrl)
      } catch (error) {
        console.error('[SSE] Error parsing publish-success event:', error)
      }
    })

    // Handle publish error notifications
    this.eventSource.addEventListener('publish-error', (event) => {
      try {
        const data = JSON.parse(event.data)
        console.log('[SSE] Publish error:', data)
        const store = useNotificationStore()
        store.addPublishError(data.platform, data.error)
      } catch (error) {
        console.error('[SSE] Error parsing publish-error event:', error)
      }
    })

    // Handle heartbeat (just to confirm connection is alive)
    this.eventSource.addEventListener('heartbeat', () => {
      // Connection is alive, no action needed
    })

    // Handle connection errors
    this.eventSource.onerror = (error) => {
      console.error('[SSE] Connection error:', error)

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
      console.log('[SSE] No token available for reconnection')
      return
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[SSE] Max reconnect attempts reached')
      return
    }

    this.reconnectAttempts++
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)

    console.log(`[SSE] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`)

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
      console.log('[SSE] Disconnecting...')
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
