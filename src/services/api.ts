/**
 * API Service Facade
 *
 * This file provides a unified API object for backward compatibility.
 * New code should import from the specific services directly.
 */

// Import services for the facade
import { authService } from './authService'
import { billingService } from './billingService'
import { contentService } from './contentService'
import { facebookService } from './facebookService'
import { instagramService } from './instagramService'
import { tiktokService } from './tiktokService'
import { twitterService } from './twitterService'
import { linkedinService } from './linkedinService'
import { favoritesService } from './favoritesService'
import { schedulerService } from './schedulerService'
import { waitlistService } from './waitlistService'
import { referralService } from './referralService'
import { notificationPreferencesService } from './notificationPreferencesService'
import { engagementService } from './engagementService'
import { businessService } from './businessService'
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
  devLogin = authService.devLogin.bind(authService)
  signInWithApple = authService.signInWithApple.bind(authService)
  signInWithGoogle = authService.signInWithGoogle.bind(authService)
  signInWithFacebook = authService.signInWithFacebook.bind(authService)
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
  addVideoPromotionalSticker = contentService.addVideoPromotionalSticker.bind(contentService)
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

  // TikTok methods
  initTikTokAuth = tiktokService.initAuth.bind(tiktokService)
  completeTikTokAuth = tiktokService.completeAuth.bind(tiktokService)
  getTikTokAccounts = tiktokService.getAccounts.bind(tiktokService)
  disconnectTikTokAccount = tiktokService.disconnectAccount.bind(tiktokService)
  postToTikTok = tiktokService.post.bind(tiktokService)

  // Twitter methods
  initTwitterAuth = twitterService.initAuth.bind(twitterService)
  completeTwitterAuth = twitterService.completeAuth.bind(twitterService)
  getTwitterAccounts = twitterService.getAccounts.bind(twitterService)
  disconnectTwitterAccount = twitterService.disconnectAccount.bind(twitterService)
  postToTwitter = twitterService.post.bind(twitterService)

  // LinkedIn methods
  initLinkedInAuth = linkedinService.initAuth.bind(linkedinService)
  completeLinkedInAuth = linkedinService.completeAuth.bind(linkedinService)
  getLinkedInPages = linkedinService.getPages.bind(linkedinService)
  disconnectLinkedInPage = linkedinService.disconnectPage.bind(linkedinService)
  postToLinkedIn = linkedinService.post.bind(linkedinService)

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
  retryScheduledPost = schedulerService.retryScheduledPost.bind(schedulerService)
  createPublishedPost = schedulerService.createPublishedPost.bind(schedulerService)
  getHolidays = schedulerService.getHolidays.bind(schedulerService)
  getHolidaysForMonth = schedulerService.getHolidaysForMonth.bind(schedulerService)
  getSupportedCountries = schedulerService.getSupportedCountries.bind(schedulerService)

  // Waitlist methods
  joinWaitlist = waitlistService.join.bind(waitlistService)
  getWaitlistCount = waitlistService.getCount.bind(waitlistService)

  // Referral methods
  getReferralCode = referralService.getCode.bind(referralService)
  validateReferralCode = referralService.validateCode.bind(referralService)
  getReferralStats = referralService.getStats.bind(referralService)
  applyReferralCode = referralService.applyCode.bind(referralService)
  getPendingReferral = referralService.getPendingReferral.bind(referralService)

  // Notification Preferences methods
  getNotificationPreferences =
    notificationPreferencesService.getPreferences.bind(notificationPreferencesService)
  updateNotificationPreferences =
    notificationPreferencesService.updatePreferences.bind(notificationPreferencesService)
  sendTestEmail = notificationPreferencesService.sendTestEmail.bind(notificationPreferencesService)

  // Engagement methods
  getPostEngagement = engagementService.getPostEngagement.bind(engagementService)
  getBulkEngagement = engagementService.getBulkEngagement.bind(engagementService)
  refreshEngagement = engagementService.refreshEngagement.bind(engagementService)
  getEngagementAnalytics = engagementService.getAnalytics.bind(engagementService)

  // Business methods
  getBusinesses = businessService.getBusinesses.bind(businessService)
  getBusiness = businessService.getBusiness.bind(businessService)
  createBusiness = businessService.createBusiness.bind(businessService)
  updateBusiness = businessService.updateBusiness.bind(businessService)
  deleteBusiness = businessService.deleteBusiness.bind(businessService)

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

  // Image upload for carousel (uploads to Supabase storage)
  async uploadCarouselImage(formData: FormData) {
    const response = await fetch(`${API_URL}/api/upload/image`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: formData
    })
    return response.json()
  }
}

export const api = new ApiService()
