import type { ApiResponse } from './apiBase'
import { API_URL, getAuthHeader, getAuthHeaders } from './apiBase'
import type {
  SEOBriefBatch,
  SEOBriefFilters,
  GenerateBriefsRequest,
  ContentBrief,
  TrendingKeyword,
} from '@/types/seoBriefs'

class SEOTrendsService {
  /**
   * Generate a batch of SEO content briefs from current trends.
   * Backend pulls Google Trends data, filters by niche, and generates briefs via LLM.
   */
  async generateBriefs(
    request: GenerateBriefsRequest
  ): Promise<ApiResponse<{ batch: SEOBriefBatch; cached: boolean }>> {
    const response = await fetch(`${API_URL}/api/seo-trends/generate`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      const text = await response.text()
      try {
        return JSON.parse(text)
      } catch {
        return {
          success: false,
          error: `HTTP ${response.status}: ${text || response.statusText}`,
        }
      }
    }

    return response.json()
  }

  /**
   * Get all brief batches with optional filters.
   */
  async getBatches(
    filters?: SEOBriefFilters
  ): Promise<ApiResponse<{ batches: SEOBriefBatch[]; total: number }>> {
    const params = new URLSearchParams()
    if (filters?.status) params.append('status', filters.status)
    if (filters?.niche) params.append('niche', filters.niche)
    if (filters?.weekNumber) params.append('weekNumber', filters.weekNumber.toString())
    if (filters?.year) params.append('year', filters.year.toString())
    if (filters?.page) params.append('page', filters.page.toString())
    if (filters?.limit) params.append('limit', filters.limit.toString())

    const url = params.toString()
      ? `${API_URL}/api/seo-trends/batches?${params}`
      : `${API_URL}/api/seo-trends/batches`

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
          error: `HTTP ${response.status}: ${text || response.statusText}`,
        }
      }
    }

    return response.json()
  }

  /**
   * Get a single brief batch by ID.
   */
  async getBatch(batchId: string): Promise<ApiResponse<{ batch: SEOBriefBatch }>> {
    const response = await fetch(`${API_URL}/api/seo-trends/batches/${batchId}`, {
      headers: getAuthHeader(),
    })

    if (!response.ok) {
      const text = await response.text()
      try {
        return JSON.parse(text)
      } catch {
        return {
          success: false,
          error: `HTTP ${response.status}: ${text || response.statusText}`,
        }
      }
    }

    return response.json()
  }

  /**
   * Update a single brief's status.
   */
  async updateBriefStatus(
    batchId: string,
    briefId: string,
    status: ContentBrief['status']
  ): Promise<ApiResponse<{ brief: ContentBrief }>> {
    const response = await fetch(
      `${API_URL}/api/seo-trends/batches/${batchId}/briefs/${briefId}`,
      {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status }),
      }
    )

    if (!response.ok) {
      const text = await response.text()
      try {
        return JSON.parse(text)
      } catch {
        return {
          success: false,
          error: `HTTP ${response.status}: ${text || response.statusText}`,
        }
      }
    }

    return response.json()
  }

  /**
   * Delete a brief batch.
   */
  async deleteBatch(batchId: string): Promise<ApiResponse<void>> {
    const response = await fetch(`${API_URL}/api/seo-trends/batches/${batchId}`, {
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
          error: `HTTP ${response.status}: ${text || response.statusText}`,
        }
      }
    }

    return response.json()
  }

  /**
   * Get current trending keywords for a niche (no brief generation).
   */
  async getTrendingKeywords(
    niche: string
  ): Promise<ApiResponse<{ keywords: TrendingKeyword[] }>> {
    const params = new URLSearchParams({ niche })
    const response = await fetch(`${API_URL}/api/seo-trends/trending?${params}`, {
      headers: getAuthHeader(),
    })

    if (!response.ok) {
      const text = await response.text()
      try {
        return JSON.parse(text)
      } catch {
        return {
          success: false,
          error: `HTTP ${response.status}: ${text || response.statusText}`,
        }
      }
    }

    return response.json()
  }

  /**
   * Get the schedule configuration for automated weekly generation.
   */
  async getScheduleConfig(): Promise<
    ApiResponse<{
      enabled: boolean
      dayOfWeek: number
      hour: number
      niche: string
      count: number
    }>
  > {
    const response = await fetch(`${API_URL}/api/seo-trends/schedule`, {
      headers: getAuthHeader(),
    })

    if (!response.ok) {
      const text = await response.text()
      try {
        return JSON.parse(text)
      } catch {
        return {
          success: false,
          error: `HTTP ${response.status}: ${text || response.statusText}`,
        }
      }
    }

    return response.json()
  }

  /**
   * Update the schedule configuration.
   */
  async updateScheduleConfig(config: {
    enabled: boolean
    dayOfWeek: number
    hour: number
    niche: string
    count: number
  }): Promise<ApiResponse<void>> {
    const response = await fetch(`${API_URL}/api/seo-trends/schedule`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(config),
    })

    if (!response.ok) {
      const text = await response.text()
      try {
        return JSON.parse(text)
      } catch {
        return {
          success: false,
          error: `HTTP ${response.status}: ${text || response.statusText}`,
        }
      }
    }

    return response.json()
  }
}

export const seoTrendsService = new SEOTrendsService()
