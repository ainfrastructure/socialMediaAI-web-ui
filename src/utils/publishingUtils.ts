/**
 * Publishing utilities - Consolidated logic for publishing to social media platforms
 *
 * This utility provides a centralized way to handle publishing to multiple platforms
 * with proper error handling, progress tracking, and account selection support.
 */

import { api } from '@/services/api'
import { useFacebookStore } from '@/stores/facebook'
import { useInstagramStore } from '@/stores/instagram'
import { useTwitterStore } from '@/stores/twitter'
import { useNotificationStore } from '@/stores/notifications'
import { warnLog } from '@/utils/debug'

export interface PublishOptions {
  platforms: string[]
  mediaUrl: string
  videoUrl?: string
  message: string
  contentType: 'image' | 'video'
  accountSelections?: {
    facebook?: string[]
    instagram?: string[]
    twitter?: string[]
  }
  onProgress?: (
    platform: string,
    status: 'pending' | 'publishing' | 'success' | 'error',
    details?: any,
  ) => void
}

export interface PublishResult {
  platform: string
  accountName?: string
  success: boolean
  url?: string
  error?: string
}

export interface PublishResponse {
  success: boolean
  results: PublishResult[]
  successfulPlatforms: PublishResult[]
  failedPlatforms: PublishResult[]
}

/**
 * Publish content to multiple social media platforms
 *
 * @param options - Publishing options including platforms, media, message, and account selections
 * @returns Promise with detailed results for each platform
 */
export async function publishToSocialMedia(options: PublishOptions): Promise<PublishResponse> {
  const { platforms, mediaUrl, videoUrl, message, contentType, accountSelections, onProgress } =
    options
  const results: PublishResult[] = []

  const facebookStore = useFacebookStore()
  const instagramStore = useInstagramStore()
  const twitterStore = useTwitterStore()
  const notificationStore = useNotificationStore()

  for (const platform of platforms) {
    // Notify progress
    onProgress?.(platform, 'publishing')

    if (platform === 'facebook') {
      const selectedPageIds = accountSelections?.facebook || []

      if (selectedPageIds.length === 0) {
        results.push({ platform: 'facebook', success: false, error: 'No Facebook pages selected' })
        onProgress?.(platform, 'error', { error: 'No Facebook pages selected' })
        continue
      }

      // Post to each selected Facebook page
      for (const pageId of selectedPageIds) {
        const page = facebookStore.connectedPages.find((p) => p.pageId === pageId)
        if (!page) {
          warnLog(`Facebook page with ID ${pageId} not found in connected pages`)
          results.push({ platform: 'facebook', success: false, error: `Page ${pageId} not found` })
          continue
        }

        try {
          const isVideo = contentType === 'video'
          const response = await api.postToFacebook(
            page.pageId,
            message,
            isVideo ? undefined : mediaUrl,
            isVideo ? videoUrl || mediaUrl : undefined,
            contentType,
          )

          const postUrl = (response as any).postUrl || response.data?.postUrl
          if (response.success && postUrl) {
            results.push({
              platform: 'facebook',
              accountName: page.pageName,
              success: true,
              url: postUrl,
            })
            notificationStore.addPublishSuccess('facebook', postUrl)
            onProgress?.(platform, 'success', { url: postUrl, accountName: page.pageName })
          } else if ((response as any).code === 'FACEBOOK_RECONNECT_REQUIRED') {
            const errorMsg = 'Facebook connection expired'
            results.push({
              platform: 'facebook',
              accountName: page.pageName,
              success: false,
              error: errorMsg,
            })
            onProgress?.(platform, 'error', { error: errorMsg, accountName: page.pageName })
          } else {
            const errorMsg = response.error || 'Failed to publish'
            results.push({
              platform: 'facebook',
              accountName: page.pageName,
              success: false,
              error: errorMsg,
            })
            onProgress?.(platform, 'error', { error: errorMsg, accountName: page.pageName })
          }
        } catch (err: any) {
          const errorMsg = err.message || 'Failed to publish'
          results.push({
            platform: 'facebook',
            accountName: page.pageName,
            success: false,
            error: errorMsg,
          })
          onProgress?.(platform, 'error', { error: errorMsg, accountName: page.pageName })
        }
      }
    } else if (platform === 'instagram') {
      const selectedAccountIds = accountSelections?.instagram || []

      if (selectedAccountIds.length === 0) {
        results.push({
          platform: 'instagram',
          success: false,
          error: 'No Instagram accounts selected',
        })
        onProgress?.(platform, 'error', { error: 'No Instagram accounts selected' })
        continue
      }

      // Post to each selected Instagram account
      for (const accountId of selectedAccountIds) {
        const account = instagramStore.connectedAccounts.find(
          (a) => a.instagramAccountId === accountId,
        )
        if (!account) {
          warnLog(`Instagram account with ID ${accountId} not found in connected accounts`)
          results.push({
            platform: 'instagram',
            success: false,
            error: `Account ${accountId} not found`,
          })
          continue
        }

        try {
          const isVideo = contentType === 'video'
          const response = await api.postToInstagram(
            account.instagramAccountId,
            message,
            isVideo ? undefined : mediaUrl,
            isVideo ? videoUrl || mediaUrl : undefined,
            contentType,
          )

          const postUrl = (response as any).postUrl || response.data?.postUrl
          if (response.success && postUrl) {
            results.push({
              platform: 'instagram',
              accountName: account.username,
              success: true,
              url: postUrl,
            })
            notificationStore.addPublishSuccess('instagram', postUrl)
            onProgress?.(platform, 'success', { url: postUrl, accountName: account.username })
          } else {
            const errorMsg = response.error || 'Failed to publish to Instagram'
            results.push({
              platform: 'instagram',
              accountName: account.username,
              success: false,
              error: errorMsg,
            })
            onProgress?.(platform, 'error', { error: errorMsg, accountName: account.username })
          }
        } catch (err: any) {
          const errorMsg = err.message || 'Failed to publish'
          results.push({
            platform: 'instagram',
            accountName: account.username,
            success: false,
            error: errorMsg,
          })
          onProgress?.(platform, 'error', { error: errorMsg, accountName: account.username })
        }
      }
    } else if (platform === 'twitter') {
      const selectedAccountIds = accountSelections?.twitter || []

      if (selectedAccountIds.length === 0) {
        results.push({ platform: 'twitter', success: false, error: 'No Twitter accounts selected' })
        onProgress?.(platform, 'error', { error: 'No Twitter accounts selected' })
        continue
      }

      // Post to each selected Twitter account
      for (const accountId of selectedAccountIds) {
        const account = twitterStore.connectedAccounts.find((a) => a.twitterAccountId === accountId)
        if (!account) {
          warnLog(`Twitter account with ID ${accountId} not found in connected accounts`)
          results.push({
            platform: 'twitter',
            success: false,
            error: `Account ${accountId} not found`,
          })
          continue
        }

        try {
          // Twitter supports text-only, text+image, or text+video
          // Character limit: 280 chars for standard accounts
          if (message.length > 280) {
            results.push({
              platform: 'twitter',
              accountName: account.username,
              success: false,
              error: 'Tweet text exceeds 280 character limit',
            })
            onProgress?.(platform, 'error', {
              error: 'Tweet text exceeds 280 character limit',
              accountName: account.username,
            })
            continue
          }

          // Prepare media URLs for Twitter
          const mediaUrls: string[] = []
          if (contentType === 'image' && mediaUrl) {
            mediaUrls.push(mediaUrl)
          } else if (contentType === 'video' && (videoUrl || mediaUrl)) {
            mediaUrls.push(videoUrl || mediaUrl)
          }

          const response = await api.postToTwitter(account.twitterAccountId, message, mediaUrls)

          const tweetUrl = (response as any).tweetUrl || response.data?.tweetUrl
          if (response.success && tweetUrl) {
            results.push({
              platform: 'twitter',
              accountName: account.username,
              success: true,
              url: tweetUrl,
            })
            notificationStore.addPublishSuccess('twitter', tweetUrl)
            onProgress?.(platform, 'success', { url: tweetUrl, accountName: account.username })
          } else {
            const errorMsg = response.error || 'Failed to publish to Twitter'
            results.push({
              platform: 'twitter',
              accountName: account.username,
              success: false,
              error: errorMsg,
            })
            onProgress?.(platform, 'error', { error: errorMsg, accountName: account.username })
          }
        } catch (err: any) {
          const errorMsg = err.message || 'Failed to publish'
          results.push({
            platform: 'twitter',
            accountName: account.username,
            success: false,
            error: errorMsg,
          })
          onProgress?.(platform, 'error', { error: errorMsg, accountName: account.username })
        }
      }
    } else {
      const errorMsg = `${platform} publishing not yet supported`
      results.push({ platform, success: false, error: errorMsg })
      onProgress?.(platform, 'error', { error: errorMsg })
    }
  }

  const successfulPlatforms = results.filter((r) => r.success)
  const failedPlatforms = results.filter((r) => !r.success)

  return {
    success: successfulPlatforms.length > 0,
    results,
    successfulPlatforms,
    failedPlatforms,
  }
}

/**
 * Save published post to calendar
 *
 * @param favoritePostId - ID of the favorite post
 * @param successfulPlatforms - Array of successful publish results
 */
export async function savePublishedPostToCalendar(
  favoritePostId: string,
  successfulPlatforms: PublishResult[],
): Promise<void> {
  try {
    const now = new Date()
    await api.createPublishedPost({
      favorite_post_id: favoritePostId,
      published_date: now.toISOString().split('T')[0],
      published_time: now.toTimeString().slice(0, 5),
      platforms: successfulPlatforms.map((r) => r.platform),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      platform_post_urls: Object.fromEntries(
        successfulPlatforms.filter((r) => r.url).map((r) => [r.platform, r.url!]),
      ),
    })
  } catch (error) {
    warnLog('Failed to save published post to calendar:', error)
    throw error
  }
}
