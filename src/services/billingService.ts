import type { ApiResponse } from './apiBase'
import { API_URL, getAuthHeaders } from './apiBase'

export interface SubscriptionPlan {
  tier: string
  name: string
  price: number
  formatted_price: string
  monthly_limit: number | string
  features: string[]
  stripe_price_id?: string
}

class BillingService {
  async getPlans(currency?: string): Promise<ApiResponse<{ plans: SubscriptionPlan[] }>> {
    const headers: Record<string, string> = {}
    if (currency) {
      headers['x-force-currency'] = currency.toLowerCase()
    }
    const response = await fetch(`${API_URL}/api/subscriptions/plans`, { headers })
    return response.json()
  }

  async createCheckout(
    tier: string,
    successUrl: string,
    cancelUrl: string,
  ): Promise<ApiResponse<{ checkout_url: string }>> {
    const response = await fetch(`${API_URL}/api/subscriptions/checkout`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        tier,
        success_url: successUrl,
        cancel_url: cancelUrl,
      }),
    })
    return response.json()
  }

  async createCustomerPortal(returnUrl?: string): Promise<ApiResponse<{ url: string }>> {
    const response = await fetch(`${API_URL}/api/subscriptions/portal`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        return_url: returnUrl || `${window.location.origin}/profile`,
      }),
    })
    const data = await response.json()
    // Map portal_url to url for compatibility - backend returns portal_url at root level
    if (data.success && data.portal_url) {
      return { ...data, data: { url: data.portal_url } }
    }
    return data
  }

  async createPortalSession(returnUrl: string): Promise<ApiResponse<{ portal_url: string }>> {
    const response = await fetch(`${API_URL}/api/subscriptions/portal`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ return_url: returnUrl }),
    })
    return response.json()
  }

  async syncSubscription(): Promise<ApiResponse> {
    const response = await fetch(`${API_URL}/api/subscriptions/sync`, {
      method: 'POST',
      headers: getAuthHeaders(),
    })
    return response.json()
  }
}

export const billingService = new BillingService()
