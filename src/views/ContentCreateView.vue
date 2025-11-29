<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { usePreferencesStore } from '@/stores/preferences'
import { useFacebookStore } from '@/stores/facebook'
import GradientBackground from '@/components/GradientBackground.vue'
import BaseCard from '@/components/BaseCard.vue'
import BaseButton from '@/components/BaseButton.vue'
import BaseAlert from '@/components/BaseAlert.vue'
import EasyModeCreation from '@/components/EasyModeCreation.vue'
import AdvancedModeCreation from '@/components/AdvancedModeCreation.vue'
import ModeToggle from '@/components/ModeToggle.vue'
import GenerationResultModal from '@/components/GenerationResultModal.vue'
import FacebookOnboardingModal from '@/components/FacebookOnboardingModal.vue'
import ScheduleModal from '@/components/ScheduleModal.vue'
import { restaurantService, type SavedRestaurant } from '@/services/restaurantService'
import { api } from '@/services/api'

const router = useRouter()
const { t } = useI18n()
const preferencesStore = usePreferencesStore()
const facebookStore = useFacebookStore()

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
  callToAction: string
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

// Modal state
const showResultModal = ref(false)
const showFacebookOnboardingModal = ref(false)
const showScheduleModal = ref(false)
const pendingAction = ref<'publish' | 'schedule' | null>(null)

// Publishing state
const publishingToFacebook = ref(false)
const publishedToFacebook = ref(false)
const facebookPostUrl = ref<string | undefined>(undefined)
const lastSavedPost = ref<any>(null)
const postToSchedule = ref<any>(null)
const preselectedDate = ref<string | null>(null)
const facebookReconnectRequired = ref(false)

// Prompt state (for image generation)
const editablePrompt = ref('')
const imagePrompts = ref<string[]>([])

// Style settings
const includeLogo = ref(true)
const logoPosition = ref<'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'>('bottom-right')
const stickerStyle = ref<'bold' | 'outlined' | 'ribbon' | 'badge' | 'starburst'>('bold')
const stickerPosition = ref<'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'center'>('top-right')
const promptContext = ref('')
const selectedMenuItems = ref<any[]>([])
const selectedPlatforms = ref<string[]>(['facebook'])

// Load restaurant and Facebook pages on mount
onMounted(async () => {
  await Promise.all([
    loadRestaurant(),
    facebookStore.loadConnectedPages()
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

    // Find selected restaurant from preferences, or use first
    const selectedId = preferencesStore.selectedRestaurantId
    let selected = selectedId
      ? restaurants.find(r => r.id === selectedId)
      : null

    if (!selected) {
      // Use first restaurant and save to preferences
      selected = restaurants[0]
      preferencesStore.setSelectedRestaurant(selected.id)
    }

    restaurant.value = selected
  } catch (err: any) {
    error.value = err.message || t('contentCreate.loadError', 'Failed to load restaurant')
  } finally {
    loading.value = false
  }
}

function goBack() {
  router.push('/content')
}

// Easy Mode Publish/Schedule Handler
async function handleEasyModePublish(data: {
  platform: string
  publishType: 'now' | 'schedule'
  scheduleDate?: string
  scheduleTime?: string
}) {
  try {
    if (!generatedImageUrl.value || !generatedPostContent.value) {
      generationError.value = 'No content to publish. Please generate content first.'
      return
    }

    // Use existing saved post if available (from autoSavePost), otherwise save new
    let favoritePostId: string

    if (lastSavedPost.value?.id) {
      // Reuse the already saved post from autoSavePost()
      favoritePostId = lastSavedPost.value.id
      console.log('Using existing saved post ID:', favoritePostId)
    } else {
      // No existing saved post, save a new one
      console.log('Saving post as favorite...')
      const saveResponse = await api.saveFavorite({
        restaurant_id: restaurant.value?.id,
        content_type: 'image',
        media_url: generatedImageUrl.value,
        post_text: generatedPostContent.value.postText,
        hashtags: generatedPostContent.value.hashtags,
        call_to_action: generatedPostContent.value.callToAction,
        platform: data.platform,
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
      console.log('Scheduling post for:', data.scheduleDate, data.scheduleTime)

      const scheduleResponse = await api.schedulePost({
        favorite_post_id: favoritePostId,
        scheduled_date: data.scheduleDate!,
        scheduled_time: data.scheduleTime,
        platform: data.platform,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
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
      // Publish now to Facebook
      console.log('Publishing now to:', data.platform)

      if (data.platform === 'facebook') {
        // Get the first connected Facebook page
        console.log('Connected Facebook pages:', facebookStore.connectedPages)
        const selectedPage = facebookStore.connectedPages[0]
        if (!selectedPage) {
          console.error('No Facebook page connected')
          generationError.value = t('contentCreate.noFacebookPage', 'No Facebook page connected')
          return
        }

        console.log('Publishing to page:', selectedPage.pageId, selectedPage.pageName)
        publishingToFacebook.value = true
        facebookReconnectRequired.value = false

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

        publishingToFacebook.value = false

        // API returns postUrl directly on response, not inside data
        const postUrl = (response as any).postUrl || response.data?.postUrl
        if (response.success && postUrl) {
          publishedToFacebook.value = true
          facebookPostUrl.value = postUrl
          console.log('Published to Facebook successfully:', postUrl)

          // Save to calendar as "published" so it shows in the overview
          if (favoritePostId) {
            const now = new Date()
            try {
              await api.schedulePost({
                favorite_post_id: favoritePostId,
                scheduled_date: now.toISOString().split('T')[0],
                scheduled_time: now.toTimeString().slice(0, 5),
                platform: data.platform,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                notes: 'Published immediately'
              })
              // Update status to published
              // The backend should handle marking it as published based on the notes or a status field
              console.log('Post saved to calendar')
            } catch (calendarErr) {
              console.warn('Failed to save to calendar:', calendarErr)
              // Don't fail the whole operation if calendar save fails
            }
          }
        } else if ((response as any).code === 'FACEBOOK_RECONNECT_REQUIRED') {
          facebookReconnectRequired.value = true
          generationError.value = t('contentCreate.facebookReconnectRequired', 'Your Facebook connection has expired. Please reconnect to continue.')
        } else {
          console.error('Facebook publish failed:', response.error)
          generationError.value = response.error || t('contentCreate.publishError', 'Failed to publish to Facebook')
        }
      } else {
        // For other platforms (Instagram, TikTok), show not implemented message
        generationError.value = t('contentCreate.platformNotSupported', 'Publishing to this platform is not yet supported')
      }
    }
  } catch (err: any) {
    console.error('Error publishing/scheduling:', err)
    generationError.value = err.message || 'Failed to publish post'
  }
}

// Easy Mode Generation Handler
async function handleEasyModeGenerate(data: {
  menuItem: any | null
  context: string
  styleTemplate: string
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
      publishedToFacebook.value = false
      facebookPostUrl.value = undefined
      lastSavedPost.value = null

      // Don't show modal for Easy Mode - content will show in preview step
      // Keep generating state true while generating
      easyModeGenerating.value = true

      // Generate the image
      try {
        console.log('[EasyMode] Starting image generation...')
        await generateImage(data.uploadedLogo)
        console.log('[EasyMode] Image generated successfully:', generatedImageUrl.value)
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
  publishedToFacebook.value = false
  facebookPostUrl.value = undefined
  publishingToFacebook.value = false
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

async function generateImage(uploadedLogo: File | null = null) {
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

    // Prepare reference image if menu items are selected
    let referenceImage: { base64Data: string; mimeType: string } | undefined = undefined
    if (selectedMenuItems.value.length > 0 && selectedMenuItems.value[0].imageUrl) {
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
      restaurant.value.place_id
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
        callToAction: (content as any).callToAction || '',
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
      call_to_action: generatedPostContent.value?.callToAction || '',
      prompt: editablePrompt.value,
      platform: selectedPlatforms.value[0] || 'facebook',
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
  callToAction?: string
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
  platform?: 'facebook' | 'instagram'
  publishNow?: boolean
  scheduledTime?: string
  onResult?: (result: { success: boolean; postUrl?: string; error?: string }) => void
}) {
  try {
    // Store advanced mode data
    advancedModeData.value = data

    // Set up state
    generatedImageUrl.value = data.imageUrl
    generatedPostContent.value = {
      postText: data.postText,
      hashtags: data.hashtags,
      callToAction: data.callToAction || '',
    }
    selectedMenuItems.value = data.menuItems
    generationError.value = null
    publishedToFacebook.value = false
    facebookPostUrl.value = undefined

    // Auto-save the advanced mode post
    await autoSaveAdvancedPost()

    // If platform and publish options provided, handle publishing directly
    if (data.platform && data.onResult) {
      if (data.publishNow) {
        // Publish now to Facebook
        if (data.platform === 'facebook') {
          const selectedPage = facebookStore.connectedPages[0]
          if (!selectedPage) {
            data.onResult({ success: false, error: t('contentCreate.noFacebookPage', 'No Facebook page connected') })
            return
          }

          publishingToFacebook.value = true

          // Build the message with post text and hashtags
          const hashtags = data.hashtags || []
          const message = hashtags.length > 0
            ? `${data.postText}\n\n${hashtags.map(h => `#${h}`).join(' ')}`
            : data.postText

          const response = await api.postToFacebook(
            selectedPage.pageId,
            message,
            data.imageUrl
          )

          publishingToFacebook.value = false

          const postUrl = (response as any).postUrl || response.data?.postUrl
          if (response.success && postUrl) {
            publishedToFacebook.value = true
            facebookPostUrl.value = postUrl

            // Save to calendar as "published" so it shows in the overview
            if (lastSavedPost.value?.id) {
              const now = new Date()
              try {
                await api.schedulePost({
                  favorite_post_id: lastSavedPost.value.id,
                  scheduled_date: now.toISOString().split('T')[0],
                  scheduled_time: now.toTimeString().slice(0, 5),
                  platform: data.platform,
                  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                  notes: 'Published immediately'
                })
                console.log('Post saved to calendar')
              } catch (calendarErr) {
                console.warn('Failed to save to calendar:', calendarErr)
              }
            }

            data.onResult({ success: true, postUrl })
          } else if ((response as any).code === 'FACEBOOK_RECONNECT_REQUIRED') {
            data.onResult({ success: false, error: t('contentCreate.facebookReconnectRequired', 'Your Facebook connection has expired. Please reconnect to continue.') })
          } else {
            data.onResult({ success: false, error: response.error || t('contentCreate.publishError', 'Failed to publish to Facebook') })
          }
        } else {
          // Instagram not yet supported
          data.onResult({ success: false, error: t('contentCreate.platformNotSupported', 'Publishing to this platform is not yet supported') })
        }
      } else if (data.scheduledTime && lastSavedPost.value?.id) {
        // Schedule the post
        const scheduledDate = new Date(data.scheduledTime)
        const scheduleResponse = await api.schedulePost({
          favorite_post_id: lastSavedPost.value.id,
          scheduled_date: scheduledDate.toISOString().split('T')[0],
          scheduled_time: scheduledDate.toTimeString().slice(0, 5),
          platform: data.platform,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        })

        if (scheduleResponse.success) {
          data.onResult({ success: true })
          // Navigate to calendar view
          router.push({
            path: '/scheduler',
            query: {
              date: scheduledDate.toISOString().split('T')[0]
            }
          })
        } else {
          data.onResult({ success: false, error: 'Failed to schedule post' })
        }
      } else {
        data.onResult({ success: true })
      }
    } else {
      // Fallback: Show result modal (old behavior)
      showResultModal.value = true
    }
  } catch (err: any) {
    if (data.onResult) {
      data.onResult({ success: false, error: err.message || 'Failed to publish' })
    } else {
      generationError.value = err.message || t('contentCreate.generateError', 'Failed to complete advanced mode')
      showResultModal.value = true
    }
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
      call_to_action: '',
      prompt: advancedModeData.value.selectedVariation?.prompt || '',
      platform: selectedPlatforms.value[0] || 'facebook',
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

// Facebook actions
function handleResultPublish() {
  if (facebookStore.connectedPages.length === 0 && !preferencesStore.hasSeenFacebookOnboarding) {
    pendingAction.value = 'publish'
    showFacebookOnboardingModal.value = true
  } else {
    publishToFacebook()
  }
}

function handleResultSchedule() {
  if (facebookStore.connectedPages.length === 0 && !preferencesStore.hasSeenFacebookOnboarding) {
    pendingAction.value = 'schedule'
    showFacebookOnboardingModal.value = true
  } else {
    openScheduleModal()
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
    publishingToFacebook.value = true
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

    if (response.success && response.data) {
      publishedToFacebook.value = true
      facebookPostUrl.value = response.data.postUrl
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
    publishingToFacebook.value = false
  }
}

function openScheduleModal() {
  if (lastSavedPost.value) {
    postToSchedule.value = lastSavedPost.value
    showScheduleModal.value = true
  }
}

async function handleResultConnectFacebook() {
  showResultModal.value = false
  try {
    await facebookStore.connectFacebook()
    showResultModal.value = true
  } catch (err: any) {
    generationError.value = err.message || t('contentCreate.connectError', 'Failed to connect Facebook')
    showResultModal.value = true
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

function handleContentUpdated(updatedContent: { postText: string; hashtags: string[]; callToAction: string }) {
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
      call_to_action: updatedContent.callToAction
    }).catch(err => {
      console.error('Failed to update post:', err)
    })
  }
}
</script>

<template>
  <div class="content-create-view">
    <GradientBackground />

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
          :restaurant="restaurant"
          :menu-items="menuItems"
          :generating="easyModeGenerating"
          :generated-image-url="generatedImageUrl"
          :post-text="generatedPostContent?.postText"
          :call-to-action="generatedPostContent?.callToAction"
          :hashtags="generatedPostContent?.hashtags"
          :publishing="publishingToFacebook"
          :published="publishedToFacebook"
          :facebook-post-url="facebookPostUrl"
          :error="generationError"
          @back="goBack"
          @generate="handleEasyModeGenerate"
          @publish="handleEasyModePublish"
          @reset="handleEasyModeReset"
        />

        <!-- Advanced Mode Creation -->
        <AdvancedModeCreation
          v-else
          :restaurant="restaurant"
          :menu-items="menuItems"
          @back="goBack"
          @complete="handleAdvancedModeComplete"
        />
      </div>
    </div>

    <!-- Generation Result Modal -->
    <GenerationResultModal
      v-model="showResultModal"
      :image-url="generatedImageUrl"
      :post-content="generatedPostContent"
      :is-generating-image="generatingImage"
      :is-generating-content="generatingPostContent"
      :is-publishing="publishingToFacebook"
      :is-published="publishedToFacebook"
      :facebook-post-url="facebookPostUrl"
      :generation-error="generationError"
      :facebook-reconnect-required="facebookReconnectRequired"
      @publish="handleResultPublish"
      @schedule="handleResultSchedule"
      @connect-facebook="handleResultConnectFacebook"
      @retry="handleRetryGeneration"
      @content-updated="handleContentUpdated"
    />

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
}
</style>
