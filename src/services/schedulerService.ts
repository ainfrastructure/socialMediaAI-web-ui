import type { ApiResponse } from './apiBase'
import { API_URL, getAuthHeader, getAuthHeaders } from './apiBase'

class SchedulerService {
  async getScheduledPosts(filters?: {
    status?: string
    month?: number
    year?: number
    platforms?: string[]
    brand_ids?: string[]
  }): Promise<ApiResponse<{ scheduled_posts: any[] }>> {
    const params = new URLSearchParams()
    if (filters?.status) params.append('status', filters.status)
    if (filters?.month) params.append('month', filters.month.toString())
    if (filters?.year) params.append('year', filters.year.toString())

    // Handle array parameters - send as comma-separated
    if (filters?.platforms && filters.platforms.length > 0) {
      params.append('platforms', filters.platforms.join(','))
    }
    if (filters?.brand_ids && filters.brand_ids.length > 0) {
      params.append('brand_id', filters.brand_ids.join(','))
    }

    const url = params.toString() ? `${API_URL}/api/scheduler?${params}` : `${API_URL}/api/scheduler`
    const response = await fetch(url, {
      headers: getAuthHeader(),
    })

    if (!response.ok) {
      const text = await response.text()
      try {
        return JSON.parse(text)
      } catch {
        return {
          success: false,
          error: `HTTP ${response.status}: ${text || response.statusText}`
        }
      }
    }

    return response.json()
  }

  async getCalendar(month: number, year: number): Promise<ApiResponse<{ calendar: any[] }>> {
    const response = await fetch(
      `${API_URL}/api/scheduler/calendar?month=${month}&year=${year}`,
      {
        headers: getAuthHeader(),
      }
    )

    if (!response.ok) {
      const text = await response.text()
      try {
        return JSON.parse(text)
      } catch {
        return {
          success: false,
          error: `HTTP ${response.status}: ${text || response.statusText}`
        }
      }
    }

    return response.json()
  }

  async getScheduledPost(id: string): Promise<ApiResponse<{ scheduled_post: any }>> {
    const response = await fetch(`${API_URL}/api/scheduler/${id}`, {
      headers: getAuthHeader(),
    })

    if (!response.ok) {
      const text = await response.text()
      try {
        return JSON.parse(text)
      } catch {
        return {
          success: false,
          error: `HTTP ${response.status}: ${text || response.statusText}`
        }
      }
    }

    return response.json()
  }

  async schedulePost(scheduleData: {
    post_id: string
    scheduled_time: string  // TIMESTAMPTZ string e.g. "2026-02-10T14:00:00Z"
    timezone?: string
    platforms: string[]
    brand_id?: string
  }): Promise<ApiResponse<{ scheduled_posts: any[] }>> {
    const response = await fetch(`${API_URL}/api/scheduler`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(scheduleData),
    })

    if (!response.ok) {
      const text = await response.text()
      try {
        return JSON.parse(text)
      } catch {
        return {
          success: false,
          error: `HTTP ${response.status}: ${text || response.statusText}`
        }
      }
    }

    return response.json()
  }

  async updateScheduledPost(
    id: string,
    updates: {
      scheduled_time?: string
      timezone?: string
      platform_status?: string
    }
  ): Promise<ApiResponse<{ scheduled_post: any }>> {
    const response = await fetch(`${API_URL}/api/scheduler/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    })

    if (!response.ok) {
      const text = await response.text()
      try {
        return JSON.parse(text)
      } catch {
        return {
          success: false,
          error: `HTTP ${response.status}: ${text || response.statusText}`
        }
      }
    }

    return response.json()
  }

  async cancelScheduledPost(id: string): Promise<ApiResponse> {
    const response = await fetch(`${API_URL}/api/scheduler/${id}`, {
      method: 'DELETE',
      headers: getAuthHeader(),
    })

    if (!response.ok) {
      const text = await response.text()
      try {
        return JSON.parse(text)
      } catch {
        return {
          success: false,
          error: `HTTP ${response.status}: ${text || response.statusText}`
        }
      }
    }

    return response.json()
  }

  async retryScheduledPost(id: string): Promise<ApiResponse<{ scheduled_post_id: string; platforms: string[] }>> {
    const response = await fetch(`${API_URL}/api/scheduler/${id}/retry`, {
      method: 'POST',
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      const text = await response.text()
      try {
        return JSON.parse(text)
      } catch {
        return {
          success: false,
          error: `HTTP ${response.status}: ${text || response.statusText}`
        }
      }
    }

    return response.json()
  }

  // Record a published post (one entry per platform)
  async createPublishedPost(data: {
    post_id: string
    platforms: string[]
    brand_id?: string
    platform_post_ids?: Record<string, string>
    platform_urls?: Record<string, string>
  }): Promise<ApiResponse<{ published_posts: any[] }>> {
    const results: any[] = []

    // Backend expects one call per platform
    for (const platform of data.platforms) {
      const response = await fetch(`${API_URL}/api/scheduler/published`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          post_id: data.post_id,
          brand_id: data.brand_id,
          platform,
          platform_post_id: data.platform_post_ids?.[platform],
          platform_url: data.platform_urls?.[platform],
        }),
      })

      if (response.ok) {
        const json = await response.json()
        results.push(json.data?.published_post)
      }
    }

    return {
      success: results.length > 0,
      data: { published_posts: results },
    }
  }

  // Holidays
  async getHolidays(country: string, year: number): Promise<ApiResponse<{ holidays: any[] }>> {
    const response = await fetch(
      `${API_URL}/api/holidays?country=${country}&year=${year}`,
      {
        headers: getAuthHeader(),
      }
    )

    if (!response.ok) {
      const text = await response.text()
      try {
        return JSON.parse(text)
      } catch {
        return {
          success: false,
          error: `HTTP ${response.status}: ${text || response.statusText}`
        }
      }
    }

    return response.json()
  }

  async getHolidaysForMonth(
    country: string,
    year: number,
    month: number
  ): Promise<ApiResponse<{ holidays: any[] }>> {
    const response = await fetch(
      `${API_URL}/api/holidays/month?country=${country}&year=${year}&month=${month}`,
      {
        headers: getAuthHeader(),
      }
    )

    if (!response.ok) {
      const text = await response.text()
      try {
        return JSON.parse(text)
      } catch {
        return {
          success: false,
          error: `HTTP ${response.status}: ${text || response.statusText}`
        }
      }
    }

    return response.json()
  }

  async getSupportedCountries(): Promise<ApiResponse<{ countries: { code: string; name: string }[] }>> {
    const response = await fetch(`${API_URL}/api/holidays/countries`, {
      headers: getAuthHeader(),
    })

    if (!response.ok) {
      const text = await response.text()
      try {
        return JSON.parse(text)
      } catch {
        return {
          success: false,
          error: `HTTP ${response.status}: ${text || response.statusText}`
        }
      }
    }

    return response.json()
  }
}

export const schedulerService = new SchedulerService()
