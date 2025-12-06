<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { usePreferencesStore } from '@/stores/preferences'
import { useFacebookStore } from '@/stores/facebook'
import { useInstagramStore } from '@/stores/instagram'
import { useNotificationStore } from '@/stores/notifications'
import DashboardLayout from '@/components/DashboardLayout.vue'
import BaseCard from '@/components/BaseCard.vue'
import BaseButton from '@/components/BaseButton.vue'
import BaseAlert from '@/components/BaseAlert.vue'
import EasyModeCreation from '@/components/EasyModeCreation.vue'
import AdvancedModeCreation from '@/components/AdvancedModeCreation.vue'
import ModeToggle from '@/components/ModeToggle.vue'
import FacebookOnboardingModal from '@/components/FacebookOnboardingModal.vue'
import ScheduleModal from '@/components/ScheduleModal.vue'
import { restaurantService, type SavedRestaurant } from '@/services/restaurantService'
import { api } from '@/services/api'

const router = useRouter()
const route = useRoute()
const { t } = useI18n()
const preferencesStore = usePreferencesStore()
const facebookStore = useFacebookStore()
const instagramStore = useInstagramStore()
const notificationStore = useNotificationStore()

// Restaurant state
const restaurant = ref<SavedRestaurant | null>(null)
const loading = ref(true)
const error = ref('')

// Menu items
const menuItems = computed(() => {
  if (!restaurant.value?.menu?.items) return []
  return restaurant.value.menu.items.filter((item: any) => item.imageUrl)
})

// Generation state (Easy Mode)
const easyModeGenerating = ref(false)
const generatingImage = ref(false)
const generatingPostContent = ref(false)
const generatedImageUrl = ref('')
const generatedPostContent = ref<{
  postText: string
  hashtags: string[]
} | null>(null)
const generationError = ref<string | null>(null)
const lastEasyModeData = ref<any>(null)

// Advanced Mode state (completely separate from easy mode)
const advancedModeData = ref<{
  imageUrl: string
  postText: string
  hashtags: string[]
  menuItems: any[]
  customization: any
  selectedVariation: any
} | null>(null)

// Component refs
const easyModeCreationRef = ref<any>(null)
const advancedModeCreationRef = ref<any>(null)

// Modal state
const showFacebookOnboardingModal = ref(false)
const showScheduleModal = ref(false)
const pendingAction = ref<'publish' | 'schedule' | null>(null)

// Publishing state
const publishing = ref(false)
const publishResults = ref<{
  success: boolean
  platforms: Array<{ platform: string; success: boolean; url?: string; error?: string }>
} | null>(null)
const lastSavedPost = ref<any>(null)
const postToSchedule = ref<any>(null)
const preselectedDate = ref<string | null>(null)
const facebookReconnectRequired = ref(false)
const pendingPublishData = ref<any>(null)

// Prompt state (for image generation)
const editablePrompt = ref('')
const imagePrompts = ref<string[]>([])

// Style settings
const includeLogo = ref(true)
const logoPosition = ref<'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'>('bottom-right')
const stickerStyle = ref<'bold' | 'outlined' | 'ribbon' | 'badge' | 'starburst'>('bold')
const stickerPosition = ref<'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'center'>('top-right')
const strictnessMode = ref<'strict' | 'flexible' | 'creative'>('strict')
const holidayTheme = ref<string>('none')
const visualStyle = ref<'authentic' | 'elegant' | 'vibrant' | 'rustic'>('authentic')
const promptContext = ref('')
const selectedMenuItems = ref<any[]>([])
const selectedPlatforms = ref<string[]>(['facebook'])

// Load restaurant and connected accounts on mount
onMounted(async () => {
  await Promise.all([
    loadRestaurant(),
    facebookStore.loadConnectedPages(),
    instagramStore.loadConnectedAccounts()
  ])
})

async function loadRestaurant() {
  loading.value = true
  error.value = ''

  try {
    const restaurants = await restaurantService.getSavedRestaurants()

    if (restaurants.length === 0) {
      // No restaurants, redirect to onboarding
      router.push('/onboarding')
      return
    }

    // Priority: 1) URL query param, 2) preferences store, 3) first restaurant
    const urlRestaurantId = route.query.restaurantId as string | undefined
    const selectedId = urlRestaurantId || preferencesStore.selectedRestaurantId

    let selected = selectedId
      ? restaurants.find(r => r.id === selectedId)
      : null

    if (!selected) {
      // Use first restaurant and save to preferences
      selected = restaurants[0]
    }

    // Update preferences with the selected restaurant
    preferencesStore.setSelectedRestaurant(selected.id)

    restaurant.value = selected
  } catch (err: any) {
    error.value = err.message || t('contentCreate.loadError', 'Failed to load restaurant')
  } finally {
    loading.value = false
  }
}

function goBack() {
  // Check if the active creation mode component can go back internally
  const activeRef = preferencesStore.creationMode === 'easy'
    ? easyModeCreationRef.value
    : advancedModeCreationRef.value
  const childStep = activeRef?.currentStep

  if (childStep && childStep > 1) {
    // Go back within the creation component
    activeRef?.prevStep()
  } else {
    // Child is on step 1, navigate back to posts hub
    router.push('/posts')
  }
}

// Easy Mode Publish/Schedule Handler
async function handleEasyModePublish(data: {
  platforms: string[]
  publishType: 'now' | 'schedule'
  scheduleDate?: string
  scheduleTime?: string
  timezone?: string
}) {
  try {
    if (!generatedImageUrl.value || !generatedPostContent.value) {
      generationError.value = 'No content to publish. Please generate content first.'
      return
    }

    const platforms = data.platforms || []
    if (platforms.length === 0) {
      generationError.value = t('contentCreate.noPlatformSelected', 'Please select at least one platform')
      return
    }

    // Use existing saved post if available (from autoSavePost), otherwise save new
    let favoritePostId: string

    if (lastSavedPost.value?.id) {
      // Reuse the already saved post from autoSavePost()
      favoritePostId = lastSavedPost.value.id
      console.log('Using existing saved post ID:', favoritePostId)

      // Update the saved post with the user's selected platforms
      await api.updateFavorite(favoritePostId, {
        platform: platforms[0],
        platforms: platforms
      })
    } else {
      // No existing saved post, save a new one
      console.log('Saving post as favorite...')
      const saveResponse = await api.saveFavorite({
        restaurant_id: restaurant.value?.id,
        content_type: 'image',
        media_url: generatedImageUrl.value,
        post_text: generatedPostContent.value.postText,
        hashtags: generatedPostContent.value.hashtags,
        platform: platforms[0], // Primary platform (for backward compatibility)
        platforms: platforms, // All selected platforms
        prompt: editablePrompt.value,
        menu_items: selectedMenuItems.value,
        context: promptContext.value,
        brand_dna: restaurant.value?.brand_dna
      })

      if (!saveResponse.success || !saveResponse.data?.favorite?.id) {
        throw new Error('Failed to save post')
      }

      favoritePostId = saveResponse.data.favorite.id
      lastSavedPost.value = saveResponse.data.favorite
      console.log('Post saved with ID:', favoritePostId)
    }

    if (data.publishType === 'schedule') {
      // Schedule the post
      console.log('Scheduling post for:', data.scheduleDate, data.scheduleTime, 'to platforms:', platforms)

      const scheduleResponse = await api.schedulePost({
        favorite_post_id: favoritePostId,
        scheduled_date: data.scheduleDate!,
        scheduled_time: data.scheduleTime,
        platforms: platforms,
        timezone: data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone
      })

      if (!scheduleResponse.success) {
        throw new Error('Failed to schedule post')
      }

      console.log('Post scheduled successfully!')

      // Navigate to calendar view
      router.push({
        path: '/scheduler',
        query: {
          date: data.scheduleDate
        }
      })
    } else {
      // Publish now to selected platforms (feedback already shown in step 3->4 transition)
      console.log('[DEBUG] Easy Mode: Publishing now to platforms:', platforms)

      // Just call continueEasyModePublish directly, feedback was already shown
      pendingPublishData.value = {
        favoritePostId,
        platforms
      }
      await continueEasyModePublish()
    }
  } catch (err: any) {
    console.error('Failed to handle easy mode publish:', err)
    generationError.value = err.message || 'Failed to publish post'
    publishing.value = false
  }
}

// Continue publishing after feedback (for Easy Mode)
async function continueEasyModePublish() {
  if (!pendingPublishData.value) {
    console.error('No pending publish data')
    return
  }

  const { favoritePostId, platforms } = pendingPublishData.value

  try {
    // Publish now to selected platforms
    console.log('Publishing now to platforms:', platforms)

      // Set publishing state BEFORE starting any API calls
      publishing.value = true
      facebookReconnectRequired.value = false

      const results: Array<{ platform: string; success: boolean; url?: string; error?: string }> = []

      for (const platform of platforms) {
        if (platform === 'facebook') {
          // Get the first connected Facebook page
          console.log('Connected Facebook pages:', facebookStore.connectedPages)
          const selectedPage = facebookStore.connectedPages[0]
          if (!selectedPage) {
            console.error('No Facebook page connected')
            results.push({ platform: 'facebook', success: false, error: 'No Facebook page connected' })
            continue
          }

          console.log('Publishing to page:', selectedPage.pageId, selectedPage.pageName)

          // Build the message with post text and hashtags
          const hashtags = generatedPostContent.value?.hashtags || []
          const postText = generatedPostContent.value?.postText || ''
          const message = hashtags.length > 0
            ? `${postText}\n\n${hashtags.join(' ')}`
            : postText

          console.log('Calling API to post to Facebook...')
          const response = await api.postToFacebook(
            selectedPage.pageId,
            message,
            generatedImageUrl.value
          )
          console.log('Facebook API response:', response)

          // API returns postUrl directly on response, not inside data
          const postUrl = (response as any).postUrl || response.data?.postUrl
          if (response.success && postUrl) {
            results.push({ platform: 'facebook', success: true, url: postUrl })
            console.log('Published to Facebook successfully:', postUrl)
            // Add notification for successful Facebook publish
            notificationStore.addPublishSuccess('facebook', postUrl)
          } else if ((response as any).code === 'FACEBOOK_RECONNECT_REQUIRED') {
            facebookReconnectRequired.value = true
            results.push({ platform: 'facebook', success: false, error: 'Facebook connection expired' })
          } else {
            results.push({ platform: 'facebook', success: false, error: response.error || 'Unknown error' })
          }
        } else if (platform === 'instagram') {
          // Instagram publishing via Facebook Graph API
          console.log('Connected Instagram accounts:', instagramStore.connectedAccounts)
          const instagramAccount = instagramStore.connectedAccounts[0]
          if (!instagramAccount) {
            console.error('No Instagram account connected')
            results.push({ platform: 'instagram', success: false, error: 'No Instagram account connected' })
            continue
          }

          console.log('Publishing to Instagram account:', instagramAccount.username)

          // Build the message with post text and hashtags
          const hashtags = generatedPostContent.value?.hashtags || []
          const postText = generatedPostContent.value?.postText || ''
          const caption = hashtags.length > 0
            ? `${postText}\n\n${hashtags.join(' ')}`
            : postText

          try {
            const response = await api.postToInstagram(
              instagramAccount.instagramAccountId,
              caption,
              generatedImageUrl.value
            )
            console.log('Instagram API response:', response)

            // API returns postUrl directly on response or inside data
            const postUrl = (response as any).postUrl || response.data?.postUrl
            if (response.success && postUrl) {
              results.push({ platform: 'instagram', success: true, url: postUrl })
              console.log('Published to Instagram successfully:', postUrl)
              // Add notification for successful Instagram publish
              notificationStore.addPublishSuccess('instagram', postUrl)
            } else {
              results.push({ platform: 'instagram', success: false, error: response.error || 'Failed to publish to Instagram' })
            }
          } catch (instagramErr: any) {
            console.error('Instagram publishing error:', instagramErr)
            results.push({ platform: 'instagram', success: false, error: instagramErr.message || 'Failed to publish to Instagram' })
          }
        } else {
          // For other platforms, show not implemented message
          results.push({ platform, success: false, error: `${platform} publishing not yet supported` })
        }
      }

      // Check results and set publishResults
      publishing.value = false
      const successfulPlatforms = results.filter(r => r.success)
      const failedPlatforms = results.filter(r => !r.success)

      // Set publish results for UI display
      publishResults.value = {
        success: successfulPlatforms.length > 0,
        platforms: results
      }

      if (successfulPlatforms.length > 0) {
        // Save to calendar as "published" so it shows in the overview
        if (favoritePostId) {
          const now = new Date()
          try {
            // Create calendar entry with status=published to prevent scheduler from picking it up
            await api.createPublishedPost({
              favorite_post_id: favoritePostId,
              published_date: now.toISOString().split('T')[0],
              published_time: now.toTimeString().slice(0, 5),
              platforms: successfulPlatforms.map(r => r.platform),
              timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
              platform_post_urls: Object.fromEntries(
                successfulPlatforms.filter(r => r.url).map(r => [r.platform, r.url!])
              )
            })
            console.log('Post saved to calendar as published')
          } catch (calendarErr) {
            console.warn('Failed to save to calendar:', calendarErr)
            // Don't fail the whole operation if calendar save fails
          }
        }
      }

      if (failedPlatforms.length > 0 && successfulPlatforms.length === 0) {
        // All platforms failed
        generationError.value = failedPlatforms.map(f => f.error).join('. ')
      }

      // Clear pending data
      pendingPublishData.value = null
  } catch (err: any) {
    console.error('Error publishing/scheduling:', err)
    generationError.value = err.message || 'Failed to publish post'
    publishing.value = false
  }
}

// Continue publishing after feedback (for Advanced Mode)
async function continueAdvancedModePublish() {
  if (!pendingPublishData.value || pendingPublishData.value.type !== 'advanced') {
    console.error('No pending advanced mode publish data')
    return
  }

  const { platforms, data, onResult } = pendingPublishData.value

  try {
    console.log('[DEBUG] Continuing Advanced Mode publish to platforms:', platforms)

    // Publish now to all selected platforms
    publishing.value = true

    const results: Array<{ platform: string; success: boolean; url?: string; error?: string }> = []
    const postUrls: Record<string, string> = {}

    // Build the message with post text and hashtags
    const hashtags = data.hashtags || []
    const message = hashtags.length > 0
      ? `${data.postText}\n\n${hashtags.map((h: string) => `#${h}`).join(' ')}`
      : data.postText

    // Publish to each platform
    for (const platform of platforms) {
      if (platform === 'facebook') {
        const selectedPage = facebookStore.connectedPages[0]
        if (!selectedPage) {
          results.push({ platform: 'facebook', success: false, error: 'No Facebook page connected' })
          continue
        }

        try {
          const response = await api.postToFacebook(
            selectedPage.pageId,
            message,
            data.imageUrl
          )

          const postUrl = (response as any).postUrl || response.data?.postUrl
          if (response.success && postUrl) {
            results.push({ platform: 'facebook', success: true, url: postUrl })
            postUrls.facebook = postUrl
          } else if ((response as any).code === 'FACEBOOK_RECONNECT_REQUIRED') {
            results.push({ platform: 'facebook', success: false, error: 'Facebook connection expired' })
          } else {
            results.push({ platform: 'facebook', success: false, error: response.error || 'Failed to publish' })
          }
        } catch (err: any) {
          results.push({ platform: 'facebook', success: false, error: err.message || 'Failed to publish' })
        }
      } else if (platform === 'instagram') {
        const instagramAccount = instagramStore.connectedAccounts[0]
        if (!instagramAccount) {
          results.push({ platform: 'instagram', success: false, error: 'No Instagram account connected' })
          continue
        }

        try {
          const response = await api.postToInstagram(
            instagramAccount.instagramAccountId,
            message,
            data.imageUrl
          )

          const postUrl = (response as any).postUrl || response.data?.postUrl
          if (response.success && postUrl) {
            results.push({ platform: 'instagram', success: true, url: postUrl })
            postUrls.instagram = postUrl
          } else {
            results.push({ platform: 'instagram', success: false, error: response.error || 'Failed to publish' })
          }
        } catch (err: any) {
          results.push({ platform: 'instagram', success: false, error: err.message || 'Failed to publish' })
        }
      } else {
        results.push({ platform, success: false, error: `${platform} publishing not yet supported` })
      }
    }

    publishing.value = false

    // Set publish results
    const successfulPlatforms = results.filter(r => r.success)
    publishResults.value = {
      success: successfulPlatforms.length > 0,
      platforms: results
    }

    // Save to calendar if any succeeded
    if (successfulPlatforms.length > 0 && lastSavedPost.value?.id) {
      const now = new Date()
      try {
        await api.createPublishedPost({
          favorite_post_id: lastSavedPost.value.id,
          published_date: now.toISOString().split('T')[0],
          published_time: now.toTimeString().slice(0, 5),
          platforms: successfulPlatforms.map(r => r.platform),
          timezone: data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
          platform_post_urls: postUrls
        })
      } catch (calendarErr) {
        console.warn('Failed to save to calendar:', calendarErr)
      }
    }

    // Return result
    if (successfulPlatforms.length > 0) {
      onResult({ success: true, postUrls })
    } else {
      const errors = results.filter(r => !r.success).map(r => r.error).join(', ')
      onResult({ success: false, error: errors || 'Failed to publish to any platform' })
    }

    // Clear pending data
    pendingPublishData.value = null
  } catch (err: any) {
    console.error('[DEBUG] Error in Advanced Mode publish:', err)
    publishing.value = false
    if (onResult) {
      onResult({ success: false, error: err.message || 'Failed to publish' })
    }
  }
}

// Easy Mode Generation Handler
async function handleEasyModeGenerate(data: {
  menuItem: any | null
  context: string
  styleTemplate: string
  strictnessMode: 'strict' | 'flexible' | 'creative'
  holidayTheme: string
  customHolidayText: string
  includeLogo: boolean
  uploadedImage: File | null
  uploadedLogo: File | null
}) {
  try {
    easyModeGenerating.value = true
    generationError.value = null
    lastEasyModeData.value = data

    // Set up the generation with values from Easy Mode
    if (data.menuItem) {
      selectedMenuItems.value = [data.menuItem]
    }
    promptContext.value = data.context

    // Apply style template settings
    const styleMapping = {
      vibrant: { stickerStyle: 'bold' as const, stickerPosition: 'top-right' as const },
      elegant: { stickerStyle: 'outlined' as const, stickerPosition: 'top-left' as const },
      minimal: { stickerStyle: 'bold' as const, stickerPosition: 'center' as const },
      rustic: { stickerStyle: 'ribbon' as const, stickerPosition: 'bottom-left' as const },
      luxury: { stickerStyle: 'badge' as const, stickerPosition: 'top-right' as const }
    }

    const selectedStyle = styleMapping[data.styleTemplate as keyof typeof styleMapping] || styleMapping.vibrant

    stickerStyle.value = selectedStyle.stickerStyle
    stickerPosition.value = selectedStyle.stickerPosition
    includeLogo.value = data.includeLogo
    strictnessMode.value = data.strictnessMode
    // Set holiday theme - use custom text if 'custom' is selected
    holidayTheme.value = data.holidayTheme === 'custom' && data.customHolidayText
      ? data.customHolidayText
      : data.holidayTheme
    // Set visual style for image generation
    visualStyle.value = data.styleTemplate as 'authentic' | 'elegant' | 'vibrant' | 'rustic'
    logoPosition.value = 'bottom-right'

    // Generate prompts
    console.log('[EasyMode] Generating prompts...')
    await generatePromptsFromSelection()
    console.log('[EasyMode] Generated prompts:', imagePrompts.value)

    // Auto-select first image prompt
    if (imagePrompts.value.length > 0) {
      editablePrompt.value = imagePrompts.value[0]
      console.log('[EasyMode] Using prompt:', editablePrompt.value)

      await nextTick()

      // Clear previous content
      generatedImageUrl.value = ''
      generatedPostContent.value = null
      publishResults.value = null
      lastSavedPost.value = null

      // Don't show modal for Easy Mode - content will show in preview step
      // Keep generating state true while generating
      easyModeGenerating.value = true

      // Generate the image (pass both uploaded logo and uploaded image for reference)
      try {
        console.log('[EasyMode] Starting image generation...')
        await generateImage(data.uploadedLogo, data.uploadedImage)
        console.log('[EasyMode] Image generated successfully:', generatedImageUrl.value)

        // Upload the image to the restaurant's uploaded_images collection
        if (data.uploadedImage && restaurant.value?.place_id) {
          try {
            await restaurantService.uploadRestaurantImages(
              restaurant.value.place_id,
              [data.uploadedImage]
            )
          } catch (uploadError) {
            console.error('Failed to save uploaded image to restaurant:', uploadError)
            // Don't fail the entire operation if this fails
          }
        }

        generationError.value = null
        easyModeGenerating.value = false // Generation complete
      } catch (imageError: any) {
        generationError.value = imageError.message || t('contentCreate.imageError', 'Failed to generate image. Please try again.')
        console.error('[EasyMode] Image generation error:', imageError)
        easyModeGenerating.value = false // Generation failed
      }
    } else {
      // No prompts generated - show error
      console.warn('[EasyMode] No prompts were generated')
      easyModeGenerating.value = false
      generationError.value = t('contentCreate.noPrompts', 'No prompts were generated. Please try again.')
    }
  } catch (err: any) {
    easyModeGenerating.value = false
    generationError.value = err.message || t('contentCreate.generateError', 'Failed to generate content')
  }
}

// Easy Mode Reset Handler - called when user clicks "Create Another Post"
function handleEasyModeReset() {
  // Reset all generation state
  generatedImageUrl.value = ''
  generatedPostContent.value = null
  generationError.value = null
  lastSavedPost.value = null
  publishResults.value = null
  publishing.value = false
  easyModeGenerating.value = false
  selectedMenuItems.value = []
  promptContext.value = ''
  editablePrompt.value = ''
  imagePrompts.value = []
}

async function generatePromptsFromSelection() {
  if (!restaurant.value) {
    console.warn('[Prompts] No restaurant value')
    return
  }

  try {
    console.log('[Prompts] Calling API with:', {
      restaurant: restaurant.value.name,
      menuItems: selectedMenuItems.value,
      context: promptContext.value
    })

    const response = await api.generatePrompts(
      {
        name: restaurant.value.name,
        type: restaurant.value.types?.[0] || 'restaurant',
        brandDna: restaurant.value.brand_dna,
      },
      selectedMenuItems.value,
      promptContext.value
    )

    console.log('[Prompts] API response:', response)

    if (response.success) {
      // API returns imagePrompts directly on response, not inside data
      const prompts = (response as any).imagePrompts || response.data?.imagePrompts || []
      imagePrompts.value = prompts
      console.log('[Prompts] Set imagePrompts to:', imagePrompts.value)
    } else {
      console.warn('[Prompts] Response not successful:', response)
      imagePrompts.value = []
    }
  } catch (err) {
    console.error('[Prompts] Failed to generate prompts:', err)
    imagePrompts.value = []
  }
}

async function generateImage(uploadedLogo: File | null = null, uploadedImage: File | null = null) {
  if (!editablePrompt.value || !restaurant.value) return

  try {
    generatingImage.value = true
    generatedImageUrl.value = ''

    // Start post content generation in parallel
    let postContentPromise: Promise<void> | null = null
    postContentPromise = generatePostContent().catch(error => {
      console.error('Failed to generate post content:', error)
    })

    // Prepare watermark if restaurant has logo and user wants it
    // Use uploaded logo if provided, otherwise use stored logo
    const logoUrl = uploadedLogo
      ? await fileToBase64Url(uploadedLogo)
      : restaurant.value.brand_dna?.logo_url

    const watermark = (includeLogo.value && logoUrl)
      ? {
          logoPath: logoUrl,
          position: logoPosition.value,
          opacity: 80,
          scale: 15,
          padding: 20,
        }
      : undefined

    // Prepare reference image - prioritize uploaded image, then menu item
    let referenceImage: { base64Data: string; mimeType: string } | undefined = undefined

    // First, check if user uploaded an image
    if (uploadedImage) {
      try {
        const base64Data = await new Promise<string>((resolve) => {
          const reader = new FileReader()
          reader.onloadend = () => {
            const base64String = reader.result as string
            resolve(base64String.split(',')[1])
          }
          reader.readAsDataURL(uploadedImage)
        })
        referenceImage = {
          base64Data,
          mimeType: uploadedImage.type,
        }
      } catch {
        console.error('Failed to process uploaded image')
      }
    }
    // If no uploaded image, try to use menu item image
    else if (selectedMenuItems.value.length > 0 && selectedMenuItems.value[0].imageUrl) {
      try {
        const firstItem = selectedMenuItems.value[0]
        const imageResponse = await fetch(firstItem.imageUrl)
        if (imageResponse.ok) {
          const imageBlob = await imageResponse.blob()
          const base64Data = await new Promise<string>((resolve) => {
            const reader = new FileReader()
            reader.onloadend = () => {
              const base64String = reader.result as string
              resolve(base64String.split(',')[1])
            }
            reader.readAsDataURL(imageBlob)
          })
          referenceImage = {
            base64Data,
            mimeType: imageBlob.type,
          }
        }
      } catch {
        // Reference image failed to load (likely CORS), continue without it
      }
    }

    // Prepare promotional sticker if campaign context is provided
    const promotionalSticker = promptContext.value
      ? {
          text: promptContext.value.toUpperCase(),
          position: stickerPosition.value,
          style: stickerStyle.value as 'badge' | 'ribbon' | 'burst' | 'minimal',
          color: getBrandColor(),
          textColor: '#FFFFFF',
          size: 'large' as const,
          rotation: stickerStyle.value === 'ribbon' ? 0 : -5,
        }
      : undefined

    const response = await api.generateImage(
      editablePrompt.value,
      watermark,
      referenceImage,
      promotionalSticker,
      restaurant.value.place_id,
      strictnessMode.value,
      holidayTheme.value !== 'none' ? holidayTheme.value : undefined,
      visualStyle.value
    )

    if (!response.success) {
      throw new Error(response.error || t('contentCreate.imageError', 'Failed to generate image'))
    }

    generatedImageUrl.value = (response as any).imageUrl || ''

    // Wait for post content generation to complete
    if (postContentPromise) {
      await postContentPromise
    }

    // Auto-save post after generation
    await autoSavePost()

  } catch (err: any) {
    throw err
  } finally {
    generatingImage.value = false
  }
}

async function fileToBase64Url(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

async function generatePostContent() {
  if (!restaurant.value) return

  try {
    generatingPostContent.value = true

    const menuItemNames = selectedMenuItems.value.map(item => item.name)

    const response = await api.generatePostContent(
      selectedPlatforms.value[0] || 'facebook',
      restaurant.value.name,
      menuItemNames,
      'image',
      promptContext.value,
      restaurant.value.brand_dna
    )

    if (response.success) {
      // API may return data directly on response or inside data property
      const content = response.data || response
      generatedPostContent.value = {
        postText: (content as any).postText || '',
        hashtags: (content as any).hashtags || [],
      }
    }
  } catch (err) {
    console.error('Failed to generate post content:', err)
  } finally {
    generatingPostContent.value = false
  }
}

function getBrandColor(): string {
  return restaurant.value?.brand_dna?.primary_color || '#D4AF37'
}

async function autoSavePost() {
  if (!generatedImageUrl.value || !restaurant.value) return

  try {
    const favoriteData = {
      restaurant_id: restaurant.value.id,
      content_type: 'image' as const,
      media_url: generatedImageUrl.value,
      post_text: generatedPostContent.value?.postText || '',
      hashtags: generatedPostContent.value?.hashtags || [],
      prompt: editablePrompt.value,
      platform: selectedPlatforms.value[0] || 'facebook',
      platforms: selectedPlatforms.value.length > 0 ? selectedPlatforms.value : ['facebook'],
      menu_items: selectedMenuItems.value.map(item => ({
        name: item.name,
        price: item.price,
      })),
      context: promptContext.value,
      brand_dna: restaurant.value.brand_dna,
    }

    const response = await api.saveFavorite(favoriteData)
    if (response.success && response.data) {
      lastSavedPost.value = response.data.favorite
    }
  } catch (err) {
    console.error('Failed to auto-save post:', err)
  }
}

// Retry generation
async function handleRetryGeneration() {
  if (lastEasyModeData.value) {
    await handleEasyModeGenerate(lastEasyModeData.value)
  }
}

// Advanced Mode Handler (completely separate from easy mode)
async function handleAdvancedModeComplete(data: {
  imageUrl: string
  postText: string
  hashtags: string[]
  menuItems: any[]
  customization: any
  selectedVariation: any
  postType: 'single' | 'combo' | 'weekly'
  weekLength?: 5 | 7
  includeWeeklyPrices?: boolean
  weeklyMenuData?: Array<{
    day: string
    dayKey: string
    dishName: string
    price?: string
    imageUrl?: string
  }>
  platforms?: string[]
  publishNow?: boolean
  scheduledTime?: string
  timezone?: string
  onResult?: (result: { success: boolean; postUrls?: Record<string, string>; error?: string }) => void
}) {
  try {
    // Store advanced mode data
    advancedModeData.value = data

    // Set up state
    generatedImageUrl.value = data.imageUrl
    generatedPostContent.value = {
      postText: data.postText,
      hashtags: data.hashtags,
    }
    selectedMenuItems.value = data.menuItems
    generationError.value = null
    publishResults.value = null

    // Auto-save the advanced mode post
    await autoSaveAdvancedPost()

    const platforms = data.platforms || []

    // Update saved post with the actual platforms user selected
    if (platforms.length > 0 && lastSavedPost.value?.id) {
      await api.updateFavorite(lastSavedPost.value.id, {
        platform: platforms[0],
        platforms: platforms
      })
    }

    // If platforms and publish options provided, handle publishing directly
    if (platforms.length > 0 && data.onResult) {
      if (data.publishNow) {
        // Publish now to all selected platforms
        publishing.value = true

        const results: Array<{ platform: string; success: boolean; url?: string; error?: string }> = []
        const postUrls: Record<string, string> = {}

        // Build the message with post text and hashtags
        const hashtags = data.hashtags || []
        const message = hashtags.length > 0
          ? `${data.postText}\n\n${hashtags.map(h => `#${h}`).join(' ')}`
          : data.postText

        // Publish to each platform
        for (const platform of platforms) {
          if (platform === 'facebook') {
            const selectedPage = facebookStore.connectedPages[0]
            if (!selectedPage) {
              results.push({ platform: 'facebook', success: false, error: 'No Facebook page connected' })
              continue
            }

            try {
              const response = await api.postToFacebook(
                selectedPage.pageId,
                message,
                data.imageUrl
              )

              const postUrl = (response as any).postUrl || response.data?.postUrl
              if (response.success && postUrl) {
                results.push({ platform: 'facebook', success: true, url: postUrl })
                postUrls.facebook = postUrl
                // Add notification for successful Facebook publish
                notificationStore.addPublishSuccess('facebook', postUrl)
              } else if ((response as any).code === 'FACEBOOK_RECONNECT_REQUIRED') {
                results.push({ platform: 'facebook', success: false, error: 'Facebook connection expired' })
              } else {
                results.push({ platform: 'facebook', success: false, error: response.error || 'Failed to publish' })
              }
            } catch (err: any) {
              results.push({ platform: 'facebook', success: false, error: err.message || 'Failed to publish' })
            }
          } else if (platform === 'instagram') {
            const instagramAccount = instagramStore.connectedAccounts[0]
            if (!instagramAccount) {
              results.push({ platform: 'instagram', success: false, error: 'No Instagram account connected' })
              continue
            }

            try {
              const response = await api.postToInstagram(
                instagramAccount.instagramAccountId,
                message,
                data.imageUrl
              )

              const postUrl = (response as any).postUrl || response.data?.postUrl
              if (response.success && postUrl) {
                results.push({ platform: 'instagram', success: true, url: postUrl })
                postUrls.instagram = postUrl
                // Add notification for successful Instagram publish
                notificationStore.addPublishSuccess('instagram', postUrl)
              } else {
                results.push({ platform: 'instagram', success: false, error: response.error || 'Failed to publish' })
              }
            } catch (err: any) {
              results.push({ platform: 'instagram', success: false, error: err.message || 'Failed to publish' })
            }
          } else {
            results.push({ platform, success: false, error: `${platform} publishing not yet supported` })
          }
        }

        publishing.value = false

        // Set publish results
        const successfulPlatforms = results.filter(r => r.success)
        publishResults.value = {
          success: successfulPlatforms.length > 0,
          platforms: results
        }

        // Save to calendar if any succeeded
        if (successfulPlatforms.length > 0 && lastSavedPost.value?.id) {
          const now = new Date()
          try {
            await api.createPublishedPost({
              favorite_post_id: lastSavedPost.value.id,
              published_date: now.toISOString().split('T')[0],
              published_time: now.toTimeString().slice(0, 5),
              platforms: successfulPlatforms.map(r => r.platform),
              timezone: data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
              platform_post_urls: postUrls
            })
          } catch (calendarErr) {
            console.warn('Failed to save to calendar:', calendarErr)
          }
        }

        // Return result
        if (successfulPlatforms.length > 0) {
          data.onResult({ success: true, postUrls })
        } else {
          const errors = results.filter(r => !r.success).map(r => r.error).join(', ')
          data.onResult({ success: false, error: errors || 'Failed to publish to any platform' })
        }
      } else if (data.scheduledTime && lastSavedPost.value?.id) {
        // Schedule the post
        const scheduledDate = new Date(data.scheduledTime)
        const scheduleResponse = await api.schedulePost({
          favorite_post_id: lastSavedPost.value.id,
          scheduled_date: scheduledDate.toISOString().split('T')[0],
          scheduled_time: scheduledDate.toTimeString().slice(0, 5),
          platforms: platforms,
          timezone: data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone
        })

        if (scheduleResponse.success && data.onResult) {
          data.onResult({ success: true })
        } else if (data.onResult) {
          data.onResult({ success: false, error: 'Failed to schedule post' })
        }
      }
    }
  } catch (err: any) {
    console.error('Failed to handle advanced mode:', err)
    generationError.value = err.message || 'Failed to process advanced mode'
  }
}

async function autoSaveAdvancedPost() {
  if (!advancedModeData.value || !restaurant.value) return

  try {
    const favoriteData = {
      restaurant_id: restaurant.value.id,
      content_type: 'image' as const,
      media_url: advancedModeData.value.imageUrl,
      post_text: advancedModeData.value.postText,
      hashtags: advancedModeData.value.hashtags,
      prompt: advancedModeData.value.selectedVariation?.prompt || '',
      platform: selectedPlatforms.value[0] || 'facebook',
      platforms: selectedPlatforms.value.length > 0 ? selectedPlatforms.value : ['facebook'],
      menu_items: advancedModeData.value.menuItems.map(item => ({
        name: item.name,
        price: item.price,
      })),
      context: '',
      brand_dna: restaurant.value.brand_dna,
    }

    const response = await api.saveFavorite(favoriteData)
    if (response.success && response.data) {
      lastSavedPost.value = response.data.favorite
    }
  } catch (err) {
    console.error('Failed to auto-save advanced post:', err)
  }
}

// Handle inline feedback from child components (fire-and-forget)
async function handleInlineFeedback(feedbackText: string) {
  console.log('[DEBUG] Received inline feedback:', feedbackText)

  // Submit feedback to backend (non-blocking)
  try {
    await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        favoritePostId: lastSavedPost.value?.id,
        feedbackText: feedbackText,
      })
    })
    console.log('[DEBUG] Inline feedback submitted successfully')
  } catch (error) {
    console.error('Failed to submit inline feedback:', error)
    // Don't block the flow if feedback fails
  }
}

async function publishToFacebook() {
  if (!generatedImageUrl.value || !lastSavedPost.value) return

  // Get the first connected Facebook page
  const selectedPage = facebookStore.connectedPages[0]
  if (!selectedPage) {
    generationError.value = t('contentCreate.noFacebookPage', 'No Facebook page connected')
    return
  }

  try {
    publishing.value = true
    facebookReconnectRequired.value = false

    // Build the message with post text and hashtags
    const hashtags = generatedPostContent.value?.hashtags || []
    const postText = generatedPostContent.value?.postText || ''
    const message = hashtags.length > 0
      ? `${postText}\n\n${hashtags.join(' ')}`
      : postText

    const response = await api.postToFacebook(
      selectedPage.pageId,
      message,
      generatedImageUrl.value
    )

    const postUrl = (response as any).postUrl || response.data?.postUrl
    if (response.success && postUrl) {
      publishResults.value = {
        success: true,
        platforms: [{ platform: 'facebook', success: true, url: postUrl }]
      }
      // Add notification for successful Facebook publish
      notificationStore.addPublishSuccess('facebook', postUrl)
    } else if ((response as any).code === 'FACEBOOK_RECONNECT_REQUIRED') {
      // Facebook connection expired, need to reconnect
      facebookReconnectRequired.value = true
      generationError.value = t('contentCreate.facebookReconnectRequired', 'Your Facebook connection has expired. Please reconnect to continue.')
    } else {
      generationError.value = response.error || t('contentCreate.publishError', 'Failed to publish to Facebook')
    }
  } catch (err: any) {
    console.error('Failed to publish to Facebook:', err)
    generationError.value = err.message || t('contentCreate.publishError', 'Failed to publish to Facebook')
  } finally {
    publishing.value = false
  }
}

function openScheduleModal() {
  if (lastSavedPost.value) {
    postToSchedule.value = lastSavedPost.value
    showScheduleModal.value = true
  }
}

function handleFacebookOnboardingComplete() {
  showFacebookOnboardingModal.value = false
  preferencesStore.markFacebookOnboardingSeen()

  if (facebookStore.connectedPages.length > 0 && pendingAction.value) {
    if (pendingAction.value === 'publish') {
      publishToFacebook()
    } else if (pendingAction.value === 'schedule') {
      openScheduleModal()
    }
  }
  pendingAction.value = null
}

function handleFacebookOnboardingClose() {
  showFacebookOnboardingModal.value = false
  pendingAction.value = null
}

function handleScheduled(scheduledPost: any) {
  showScheduleModal.value = false
}

function handleContentUpdated(updatedContent: { postText: string; hashtags: string[] }) {
  if (generatedPostContent.value) {
    generatedPostContent.value = {
      ...generatedPostContent.value,
      ...updatedContent
    }
  }

  // Update saved post if exists
  if (lastSavedPost.value?.id) {
    api.updateFavorite(lastSavedPost.value.id, {
      post_text: updatedContent.postText,
      hashtags: updatedContent.hashtags,
    }).catch(err => {
      console.error('Failed to update post:', err)
    })
  }
}
</script>

<template>
  <DashboardLayout>
    <div class="content-create-view">
    <div class="container">
      <!-- Loading State -->
      <div v-if="loading" class="loading-container">
        <div class="spinner"></div>
        <p>{{ t('contentCreate.loading', 'Loading...') }}</p>
      </div>

      <!-- Error State -->
      <BaseAlert v-else-if="error" type="error" class="error-alert">
        {{ error }}
        <BaseButton variant="secondary" size="small" @click="loadRestaurant">
          {{ t('common.retry', 'Retry') }}
        </BaseButton>
      </BaseAlert>

      <!-- Main Content -->
      <div v-else-if="restaurant" class="create-content">
        <!-- Header with back button and mode toggle -->
        <div class="page-header">
          <BaseButton variant="ghost" @click="goBack" class="back-button">
            ← {{ t('common.back', 'Back') }}
          </BaseButton>
          <ModeToggle class="mode-toggle" />
        </div>

        <!-- Restaurant Header -->
        <BaseCard variant="glass-intense" class="restaurant-header">
          <div class="restaurant-info">
            <div v-if="restaurant.brand_dna?.logo_url" class="restaurant-logo">
              <img :src="restaurant.brand_dna.logo_url" :alt="restaurant.name" />
            </div>
            <div v-else class="restaurant-logo placeholder">
              <span class="placeholder-icon">🍽️</span>
            </div>
            <div class="restaurant-details">
              <h2 class="restaurant-name">{{ restaurant.name }}</h2>
              <p class="restaurant-address">{{ restaurant.address }}</p>
            </div>
          </div>
        </BaseCard>

        <!-- Easy Mode Creation -->
        <EasyModeCreation
          v-if="preferencesStore.creationMode === 'easy'"
          ref="easyModeCreationRef"
          :restaurant="restaurant"
          :menu-items="menuItems"
          :generating="easyModeGenerating"
          :generated-image-url="generatedImageUrl"
          :post-text="generatedPostContent?.postText"
          :hashtags="generatedPostContent?.hashtags"
          :publishing="publishing"
          :publish-results="publishResults"
          :error="generationError"
          :initial-schedule-date="route.query.scheduleDate as string | undefined"
          @back="goBack"
          @generate="handleEasyModeGenerate"
          @publish="handleEasyModePublish"
          @feedback="handleInlineFeedback"
          @reset="handleEasyModeReset"
        />

        <!-- Advanced Mode Creation -->
        <AdvancedModeCreation
          v-else
          ref="advancedModeCreationRef"
          :restaurant="restaurant"
          :menu-items="menuItems"
          @back="goBack"
          @feedback="handleInlineFeedback"
          @complete="handleAdvancedModeComplete"
        />
      </div>
    </div>

    <!-- Facebook Onboarding Modal -->
    <FacebookOnboardingModal
      v-model="showFacebookOnboardingModal"
      @update:modelValue="handleFacebookOnboardingClose"
      @connected="handleFacebookOnboardingComplete"
    />

    <!-- Schedule Modal -->
    <ScheduleModal
      v-model="showScheduleModal"
      :favorite-post="postToSchedule"
      :preselected-date="preselectedDate"
      @scheduled="handleScheduled"
    />

    </div>
  </DashboardLayout>
</template>

<style scoped>
.content-create-view {
  min-height: 100vh;
  position: relative;
  padding: var(--space-xl) var(--space-lg);
}

.container {
  max-width: 1000px;
  margin: 0 auto;
}

/* Loading */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  gap: var(--space-lg);
}

.spinner {
  width: 48px;
  height: 48px;
  border: 3px solid var(--border-color);
  border-top-color: var(--gold-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-container p {
  color: var(--text-secondary);
  font-size: var(--text-base);
}

/* Error */
.error-alert {
  max-width: 600px;
  margin: var(--space-2xl) auto;
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  align-items: center;
}

/* Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-xl);
}

.back-button {
  font-size: var(--text-base);
}

/* Restaurant Header */
.restaurant-header {
  margin-bottom: var(--space-xl);
  animation: fadeInUp 0.5s var(--ease-smooth);
}

.restaurant-info {
  display: flex;
  align-items: center;
  gap: var(--space-lg);
}

.restaurant-logo {
  width: 64px;
  height: 64px;
  border-radius: var(--radius-md);
  overflow: hidden;
  flex-shrink: 0;
  background: var(--bg-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.restaurant-logo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.restaurant-logo.placeholder {
  background: rgba(212, 175, 55, 0.1);
}

.placeholder-icon {
  font-size: var(--text-2xl);
}

.restaurant-details {
  flex: 1;
}

.restaurant-name {
  font-family: var(--font-heading);
  font-size: var(--text-xl);
  color: var(--text-primary);
  margin: 0 0 var(--space-xs) 0;
}

.restaurant-address {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin: 0;
}

/* Animation */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Responsive */
@media (max-width: 768px) {
  .content-create-view {
    padding: var(--space-lg);
  }

  .page-header {
    flex-direction: column;
    gap: var(--space-md);
    align-items: stretch;
  }

  .back-button {
    align-self: flex-start;
  }

  .mode-toggle {
    align-self: center;
  }

  .restaurant-info {
    flex-direction: column;
    text-align: center;
  }

  .restaurant-logo {
    width: 80px;
    height: 80px;
  }

  .mode-btn {
    min-height: var(--touch-target-min);
  }

  .back-button {
    min-height: var(--touch-target-min);
  }
}

@media (max-width: 480px) {
  .content-create-view {
    padding: var(--space-md);
  }

  .page-header {
    gap: var(--space-sm);
  }

  .mode-toggle {
    width: 100%;
  }

  .mode-btn {
    flex: 1;
    font-size: var(--text-sm);
    padding: var(--space-sm);
  }

  .restaurant-logo {
    width: 64px;
    height: 64px;
  }

  .restaurant-name {
    font-size: var(--text-xl);
  }

  .restaurant-address {
    font-size: var(--text-xs);
  }
}

@media (max-width: 390px) {
  .content-create-view {
    padding: var(--space-sm);
  }

  .restaurant-logo {
    width: 56px;
    height: 56px;
  }

  .restaurant-name {
    font-size: var(--text-lg);
  }

  .mode-btn {
    font-size: var(--text-xs);
  }

  .back-button {
    font-size: var(--text-sm);
    padding: var(--space-sm);
  }
}
</style>
