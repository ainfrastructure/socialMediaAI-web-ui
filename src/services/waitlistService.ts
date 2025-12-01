import type { ApiResponse } from './apiBase'
import { API_URL } from './apiBase'

class WaitlistService {
  async join(
    email: string,
    metadata?: { locale?: string; timezone?: string; referrer?: string }
  ): Promise<ApiResponse<{ count: number }>> {
    const response = await fetch(`${API_URL}/api/waitlist/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        locale: metadata?.locale || navigator.language,
        timezone: metadata?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        referrer: metadata?.referrer || document.referrer,
      }),
    })
    return response.json()
  }

  async getCount(): Promise<ApiResponse<{ count: number }>> {
    const response = await fetch(`${API_URL}/api/waitlist/count`)
    return response.json()
  }
}

export const waitlistService = new WaitlistService()
