/**
 * Referral Service
 * Handles all referral-related API calls
 */

import type { ApiResponse } from './apiBase'
import { API_URL, getAuthHeader, getAuthHeaders } from './apiBase'

export interface ReferralCode {
  code: string
  referral_link: string
  is_active: boolean
  times_used: number
  created_at: string
}

export interface ReferralValidation {
  valid: boolean
  referrer_name?: string
  error?: string
  benefits?: {
    first_month_free: boolean
    discount_percent: number
    discount_months: number
    description: string
  }
}

export interface ReferralListItem {
  id: string
  referred_email_masked: string
  status: 'pending' | 'converted' | 'credited' | 'expired'
  credit_amount: number | null
  credit_amount_formatted: string | null
  created_at: string
  converted_at: string | null
  credited_at: string | null
}

export interface ReferralStats {
  eligible: boolean
  code?: string
  referral_link?: string
  total_referrals: number
  successful_referrals: number
  pending_referrals: number
  total_credits_earned: number
  total_credits_formatted: string
  current_balance: number
  current_balance_formatted: string
  referrals: ReferralListItem[]
  message?: string
}

export interface PendingReferral {
  has_pending_referral: boolean
  benefits?: {
    first_month_free: boolean
    discount_percent: number
    discount_months: number
  }
}

class ReferralService {
  /**
   * Get or generate referral code for the authenticated user
   */
  async getCode(): Promise<ApiResponse<ReferralCode>> {
    const response = await fetch(`${API_URL}/api/referrals/code`, {
      headers: getAuthHeader(),
    })
    return response.json()
  }

  /**
   * Validate a referral code (public endpoint)
   */
  async validateCode(code: string): Promise<ApiResponse<ReferralValidation>> {
    const response = await fetch(`${API_URL}/api/referrals/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code }),
    })
    return response.json()
  }

  /**
   * Get referral statistics for the authenticated user
   */
  async getStats(): Promise<ApiResponse<ReferralStats>> {
    const response = await fetch(`${API_URL}/api/referrals/stats`, {
      headers: getAuthHeader(),
    })
    const data = await response.json()
    // Return the response with stats at root level for easier access
    if (data.success) {
      return { ...data, data: data }
    }
    return data
  }

  /**
   * Apply a referral code to the authenticated user
   */
  async applyCode(code: string): Promise<ApiResponse<{ message: string }>> {
    const response = await fetch(`${API_URL}/api/referrals/apply`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ code }),
    })
    return response.json()
  }

  /**
   * Check if the authenticated user has a pending referral
   */
  async getPendingReferral(): Promise<ApiResponse<PendingReferral>> {
    const response = await fetch(`${API_URL}/api/referrals/pending`, {
      headers: getAuthHeader(),
    })
    return response.json()
  }
}

export const referralService = new ReferralService()
