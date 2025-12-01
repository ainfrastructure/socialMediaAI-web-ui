/**
 * API Service Facade
 *
 * This file maintains backward compatibility with existing code while delegating
 * to domain-specific services. New code should import from the specific services directly.
 *
 * Services:
 * - authService: Authentication, profile, password management
 * - billingService: Subscriptions, checkout, billing portal
 * - contentService: Image/video generation, prompts
 * - facebookService: Facebook OAuth and posting
 * - instagramService: Instagram OAuth and posting
 * - favoritesService: Saved posts/favorites
 * - schedulerService: Post scheduling, calendar, holidays
 * - restaurantService: Restaurant management (existing)
 * - waitlistService: Waitlist management
 */

// Re-export types for backward compatibility
export type { ApiResponse } from './apiBase'
export type { User, LoginResponse } from './authService'
export { authService } from './authService'
export type { SubscriptionPlan } from './billingService'
export { billingService } from './billingService'
export { contentService } from './contentService'
export { facebookService } from './facebookService'
export { instagramService } from './instagramService'
export { favoritesService } from './favoritesService'
export { schedulerService } from './schedulerService'
export { waitlistService } from './waitlistService'

// Import services for the facade
import { authService } from './authService'
import { billingService } from './billingService'
import { contentService } from './contentService'
import { facebookService } from './facebookService'
import { instagramService } from './instagramService'
import { favoritesService } from './favoritesService'
import { schedulerService } from './schedulerService'
import { waitlistService } from './waitlistService'
import { API_URL, getAuthHeader } from './apiBase'

/**
 * Unified API facade for backward compatibility.
 * Delegates to domain-specific services.
 */
class ApiService {
  // Auth methods
  signup = authService.signup.bind(authService)
  login = authService.login.bind(authService)
  logout = authService.logout.bind(authService)
  getProfile = authService.getProfile.bind(authService)
  completeOnboarding = authService.completeOnboarding.bind(authService)
  getStats = authService.getStats.bind(authService)
  sendMagicLink = authService.sendMagicLink.bind(authService)
  requestPasswordReset = authService.requestPasswordReset.bind(authService)
  updatePassword = authService.updatePassword.bind(authService)
  verifyOtp = authService.verifyOtp.bind(authService)
  refreshToken = authService.refreshToken.bind(authService)

  // Billing methods
  getPlans = billingService.getPlans.bind(billingService)
  createCheckout = billingService.createCheckout.bind(billingService)
  createCustomerPortal = billingService.createCustomerPortal.bind(billingService)
  createPortalSession = billingService.createPortalSession.bind(billingService)
  syncSubscription = billingService.syncSubscription.bind(billingService)

  // Content generation methods
  generateImage = contentService.generateImage.bind(contentService)
  generateVideo = contentService.generateVideo.bind(contentService)
  generateVideoFromImage = contentService.generateVideoFromImage.bind(contentService)
  pollVideoOperation = contentService.pollVideoOperation.bind(contentService)
  generatePrompts = contentService.generatePrompts.bind(contentService)
  generateStyleVariations = contentService.generateStyleVariations.bind(contentService)
  generateAdvancedImage = contentService.generateAdvancedImage.bind(contentService)
  addVideoWatermark = contentService.addVideoWatermark.bind(contentService)
  generatePostContent = contentService.generatePostContent.bind(contentService)

  // Facebook methods
  initFacebookAuth = facebookService.initAuth.bind(facebookService)
  completeFacebookAuth = facebookService.completeAuth.bind(facebookService)
  getFacebookPages = facebookService.getPages.bind(facebookService)
  disconnectFacebookPage = facebookService.disconnectPage.bind(facebookService)
  postToFacebook = facebookService.post.bind(facebookService)
  uploadFacebookImage = facebookService.uploadImage.bind(facebookService)
  getPostHistory = facebookService.getPostHistory.bind(facebookService)

  // Instagram methods
  initInstagramAuth = instagramService.initAuth.bind(instagramService)
  completeInstagramAuth = instagramService.completeAuth.bind(instagramService)
  getInstagramAccounts = instagramService.getAccounts.bind(instagramService)
  disconnectInstagramAccount = instagramService.disconnectAccount.bind(instagramService)
  postToInstagram = instagramService.post.bind(instagramService)

  // Favorites methods
  getFavorites = favoritesService.getFavorites.bind(favoritesService)
  getFavorite = favoritesService.getFavorite.bind(favoritesService)
  saveFavorite = favoritesService.saveFavorite.bind(favoritesService)
  updateFavorite = favoritesService.updateFavorite.bind(favoritesService)
  deleteFavorite = favoritesService.deleteFavorite.bind(favoritesService)

  // Scheduler methods
  getScheduledPosts = schedulerService.getScheduledPosts.bind(schedulerService)
  getSchedulerCalendar = schedulerService.getCalendar.bind(schedulerService)
  getScheduledPost = schedulerService.getScheduledPost.bind(schedulerService)
  schedulePost = schedulerService.schedulePost.bind(schedulerService)
  updateScheduledPost = schedulerService.updateScheduledPost.bind(schedulerService)
  cancelScheduledPost = schedulerService.cancelScheduledPost.bind(schedulerService)
  createPublishedPost = schedulerService.createPublishedPost.bind(schedulerService)
  getHolidays = schedulerService.getHolidays.bind(schedulerService)
  getHolidaysForMonth = schedulerService.getHolidaysForMonth.bind(schedulerService)
  getSupportedCountries = schedulerService.getSupportedCountries.bind(schedulerService)

  // Waitlist methods
  joinWaitlist = waitlistService.join.bind(waitlistService)
  getWaitlistCount = waitlistService.getCount.bind(waitlistService)

  // Restaurants - keep inline as it's minimal (most is in restaurantService.ts)
  async getRestaurants(limit?: number) {
    const params = new URLSearchParams()
    if (limit) params.append('limit', limit.toString())

    const url = params.toString() ? `${API_URL}/api/restaurants?${params}` : `${API_URL}/api/restaurants`
    const response = await fetch(url, {
      headers: getAuthHeader(),
    })
    return response.json()
  }
}

export const api = new ApiService()
