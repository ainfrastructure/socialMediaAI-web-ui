<script setup lang="ts">
import { debugLog, errorLog, warnLog } from '@/utils/debug'

import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { usePreferencesStore } from '@/stores/preferences'
import { useBrandsStore } from '@/stores/brands'
import { useFacebookStore } from '@/stores/facebook'
import { useInstagramStore } from '@/stores/instagram'
import { useTwitterStore } from '@/stores/twitter'
import { useNotificationStore } from '@/stores/notifications'
import { useVideoGenerationStore } from '@/stores/videoGeneration'
import DashboardLayout from '@/components/DashboardLayout.vue'
import BaseCard from '@/components/BaseCard.vue'
import BaseButton from '@/components/BaseButton.vue'
import BaseAlert from '@/components/BaseAlert.vue'
import EasyModeCreation from '@/components/EasyModeCreation.vue'
import AdvancedModeCreation from '@/components/AdvancedModeCreation.vue'
import ModeToggle from '@/components/ModeToggle.vue'
import ScheduleModal from '@/components/ScheduleModal.vue'
import AddBrandModal from '@/components/AddBrandModal.vue'
import CreateBrandModal from '@/components/CreateBrandModal.vue'
import BrandSelectorModal from '@/components/BrandSelectorModal.vue'
import PublishingProgressModal from '@/components/PublishingProgressModal.vue'
import GoldenBrandIcon from '@/components/icons/GoldenBrandIcon.vue'
import { brandService, type Brand, type UploadAssetData } from '@/services/brandService'
import { api } from '@/services/api'
import { okamService } from '@/services/okamService'
import { API_URL } from '@/services/apiBase'
import type { AccountSelection, CarouselItem } from '@/types/scheduling'
import { getVideoSinglePrompt } from '@/config/promptModifiers'
import { getVideoThemeModifier } from '@/utils/videoThemes'
import { getVideoStyleInstruction, getVideoFidelityNote } from '@/config/videoStyleModifiers'
import { extractDishDescription } from '@/utils/promptHelpers'

const router = useRouter()
const route = useRoute()
const { t, locale } = useI18n()
const preferencesStore = usePreferencesStore()
const brandsStore = useBrandsStore()
const facebookStore = useFacebookStore()
const instagramStore = useInstagramStore()
const twitterStore = useTwitterStore()
const notificationStore = useNotificationStore()
const videoGenerationStore = useVideoGenerationStore()

// Brand state
const selectedBrand = computed(() => brandsStore.selectedBrand)
const nonDefaultBrand = ref(false)
const isDefaultBusiness = computed(() =>
  !selectedBrand.value || selectedBrand.value.business_type === 'restaurant'
)
const activeBrandType = computed(() => selectedBrand.value?.business_type || 'restaurant')
const activeBusinessId = computed(() =>
  selectedBrand.value?.id || preferencesStore.selectedBrandId || brand.value?.brand_id
)
const activeBrandDna = computed(() =>
  brand.value?.brand_dna || selectedBrand.value?.brand_dna || null
)
const activeProfileName = computed(() =>
  brand.value?.name || selectedBrand.value?.name || ''
)
const brand = ref<Brand | null>(null)
const allBrands = ref<Brand[]>([])
const loading = ref(true)
const error = ref('')
const showBrandSelector = ref(false)

// Menu items (filtered for images and deduplicated by name)
const menuItems = computed(() => {
  if (!brand.value?.menu?.items) return []
  const itemsWithImages = brand.value.menu.items.filter((item: any) => item.imageUrl)
  const seen = new Set<string>()
  return itemsWithImages.filter((item: any) => {
    if (seen.has(item.name)) return false
    seen.add(item.name)
    return true
  })
})

// Generation state (Easy Mode)
const easyModeGenerating = ref(false)
const generatingImage = ref(false)
const generatingVideo = ref(false)
const generatingPostContent = ref(false)
const generatedImageUrl = ref('')
const generatedVideoUrl = ref('')
const videoOperationId = ref<string | null>(null)
const videoGeneratingInBackground = ref(false) // True when video is being generated in background
const currentMediaType = ref<'image' | 'video'>('image')
const generatedPostContent = ref<{
  postText: string
  hashtags: string[]
} | null>(null)
const generationError = ref<string | null>(null)
const lastEasyModeData = ref<any>(null)

// Carousel state
const carouselItems = ref<CarouselItem[]>([])
const isCarouselMode = ref(false)

const hasValidCarousel = computed(() => {
  return isCarouselMode.value &&
         carouselItems.value.length >= 2 &&
         carouselItems.value.length <= 10
})

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
const showScheduleModal = ref(false)
const showAddBrandModal = ref(false)
const showCreateBrandModal = ref(false)
const showPublishingModal = ref(false)
const pendingAction = ref<'publish' | 'schedule' | null>(null)
const noBrands = ref(false)

// Publishing state
const publishing = ref(false)
const publishingProgress = ref<Array<{
  platform: string
  status: 'pending' | 'publishing' | 'success' | 'error'
  url?: string
  error?: string
  postType?: 'feed' | 'story' | 'reel' | 'carousel'
}>>([])
const publishingComplete = ref(false)
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
const visualStyle = ref<'behindTheScenes' | 'cleanStrict' | 'zoomIn' | 'oneBite' | 'studioShot' | 'infographic' | 'placeOnTable' | 'custom'>('behindTheScenes')
const customVisualPrompt = ref<string>('')
const promptContext = ref('')
const selectedMenuItems = ref<any[]>([])
const selectedPlatforms = ref<string[]>(['facebook'])

const resortTemplatePrompts: Record<string, string> = {
  resortSunset: `Use the reference image composition exactly. Elevate it into a luxury resort golden-hour scene with warm sunset glow, soft reflections, and serene coastal ambience. Keep layout, objects, and framing identical to the reference.`,
  resortPool: `Use the reference image composition exactly. Upgrade it to a premium poolside resort atmosphere with crystal-clear water reflections, clean cabanas, and airy tropical light. Preserve the exact layout and elements.`,
  resortSuite: `Use the reference image composition exactly. Present it as a high-end resort suite with soft natural light, refined textures, and a calm, polished mood. Keep the same framing and objects as the reference.`
}

// Visual style prompt modifiers for video generation
// These enhance the base prompt with style-specific instructions
// Using STRICT IMAGE REPLICATION approach from image generation

// Load brand and connected accounts on mount
onMounted(async () => {
  await brandsStore.initialize()
  await Promise.all([
    loadBrand(),
    facebookStore.loadConnectedPages(),
    instagramStore.loadConnectedAccounts()
  ])
})

function buildProfileFromBusiness(
  brand: Brand,
  options?: { uploadedImages?: Brand['uploaded_images']; placeId?: string | null }
): Brand {
  return {
    ...brand,
    brand_id: brand.id,
    place_id: options?.placeId ?? null,
    is_manual: true,
    address: brand.address || '',
    rating: null,
    user_ratings_total: null,
    types: brand.business_type ? [brand.business_type] : null,
    social_media: brand.social_media || null,
    brand_dna: brand.brand_dna || (brand.logo_url ? { logo_url: brand.logo_url } : null),
    uploaded_images: options?.uploadedImages || null,
  }
}

async function loadBrand() {
  loading.value = true
  error.value = ''
  nonDefaultBrand.value = false

  try {
    const currentBrand = selectedBrand.value

    if (currentBrand && currentBrand.business_type !== 'restaurant') {
      nonDefaultBrand.value = true
      brand.value = buildProfileFromBusiness(currentBrand, {
        uploadedImages: currentBrand.uploaded_images || null,
        placeId: currentBrand.id
      })
      allBrands.value = []
      noBrands.value = false
      loading.value = false
      return
    }

    const fetchedBrands = await brandService.getBrands()
    const scopedBrands = currentBrand?.id
      ? fetchedBrands.filter(r => r.brand_id === currentBrand.id)
      : fetchedBrands

    allBrands.value = scopedBrands

    if (scopedBrands.length === 0) {
      // No brands, show inline prompt instead of redirecting
      brand.value = null
      noBrands.value = true
      loading.value = false
      return
    }

    noBrands.value = false

    // Priority: 1) URL query param, 2) preferences store, 3) first brand
    const urlBrandId = route.query.brandId as string | undefined
    const selectedId = urlBrandId || preferencesStore.selectedBrandId

    let selected = selectedId
      ? scopedBrands.find(r => r.id === selectedId)
      : null

    if (!selected) {
      // Use first brand and save to preferences
      selected = scopedBrands[0]
    }

    // Update preferences with the selected brand
    preferencesStore.setSelectedBrand(selected.id)

    brand.value = selected
  } catch (err: any) {
    error.value = err.message || t('contentCreate.loadError', 'Failed to load brand')
  } finally {
    loading.value = false
  }
}

// Handle brand added from inline prompt
async function handleBrandAddedFromPrompt() {
  showAddBrandModal.value = false
  // Reload the brand data
  await loadBrand()
}

// Handle switch to manual entry
function handleSwitchToManual() {
  showAddBrandModal.value = false
  showCreateBrandModal.value = true
}

// Handle brand created manually
async function handleBrandCreated() {
  showCreateBrandModal.value = false
  // Reload the brand data
  await loadBrand()
}

// Handle brand selection from selector modal
function handleBrandSelect(selected: Brand) {
  brand.value = selected
  preferencesStore.setSelectedBrand(selected.id)
  showBrandSelector.value = false

  // Reset generation state when switching brands
  handleEasyModeReset()
}

// Handle brand added from selector modal
async function handleBrandAddedFromSelector() {
  await loadBrand()
}

// Handle brand deletion from selector modal
async function handleBrandDelete(brandToDelete: Brand) {
  try {
    await brandService.deleteBrand(brandToDelete.id)
    // Reload the list
    await loadBrand()
  } catch (err) {
    errorLog('Failed to delete brand:', err)
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

function goToPosts() {
  router.push('/posts')
}

function goToBrands() {
  router.push('/brands')
}

// Easy Mode Publish/Schedule Handler
async function handleEasyModePublish(data: {
  platforms: string[]
  publishType: 'now' | 'schedule'
  scheduleDate?: string
  scheduleTime?: string
  timezone?: string
  postText?: string
  hashtags?: string[]
  accountSelections?: {
    facebook?: AccountSelection[]
    instagram?: AccountSelection[]
    tiktok?: string[]
    twitter?: string[]
  }
}) {
  try {
    // Check if we have media (generated image/video OR carousel items)
    const hasGeneratedMedia = generatedImageUrl.value || generatedVideoUrl.value
    const hasCarouselItems = (
      (data.accountSelections?.facebook?.some(sel => sel.carouselItems && sel.carouselItems.length >= 2)) ||
      (data.accountSelections?.instagram?.some(sel => sel.carouselItems && sel.carouselItems.length >= 2))
    )

    console.log('[handleEasyModePublish] Media check:', {
      hasGeneratedMedia,
      hasCarouselItems,
      accountSelections: data.accountSelections
    })

    if ((!hasGeneratedMedia && !hasCarouselItems) || !generatedPostContent.value) {
      generationError.value = 'No content to publish. Please generate content first or select carousel images.'
      return
    }

    const platforms = data.platforms || []
    if (platforms.length === 0) {
      generationError.value = t('contentCreate.noPlatformSelected', 'Please select at least one platform')
      return
    }

    // Validate brand is selected
    if (!brand.value?.id && !activeBusinessId.value) {
      generationError.value = 'Please select a brand first'
      return
    }

    // Use edited values if provided, otherwise fall back to generated values
    const finalPostText = data.postText ?? generatedPostContent.value.postText
    const finalHashtags = data.hashtags ?? generatedPostContent.value.hashtags

    // Use existing saved post if available (from autoSavePost), otherwise save new
    let favoritePostId: string

    if (lastSavedPost.value?.id) {
      // Reuse the already saved post from autoSavePost()
      favoritePostId = lastSavedPost.value.id
      debugLog('Using existing saved post ID:', favoritePostId)

      // Update the saved post with edited content and selected platforms
      await api.updateFavorite(favoritePostId, {
        platform: platforms[0],
        platforms: platforms,
        post_text: finalPostText,
        hashtags: finalHashtags
      })
    } else {
      // No existing saved post, save a new one
      debugLog('Saving post as favorite...')
      const isVideo = currentMediaType.value === 'video'

      // For carousel posts, use the first carousel item as the preview media_url
      let mediaUrl = isVideo ? generatedVideoUrl.value : generatedImageUrl.value
      if (hasCarouselItems && !mediaUrl) {
        // Get the first carousel item from any platform
        const firstCarouselItem =
          data.accountSelections?.facebook?.find(sel => sel.carouselItems && sel.carouselItems.length > 0)?.carouselItems?.[0] ||
          data.accountSelections?.instagram?.find(sel => sel.carouselItems && sel.carouselItems.length > 0)?.carouselItems?.[0]

        if (firstCarouselItem) {
          mediaUrl = firstCarouselItem.mediaUrl
          console.log('[handleEasyModePublish] Using first carousel item as preview:', mediaUrl)
        }
      }

      const saveResponse = await api.saveFavorite({
        brand_id: activeBusinessId.value || brand.value.id || undefined,
        content_type: isVideo ? 'video' : 'image',
        media_url: mediaUrl,
        post_text: finalPostText,
        hashtags: finalHashtags,
        platform: platforms[0], // Primary platform (for backward compatibility)
        platforms: platforms, // All selected platforms
        prompt: editablePrompt.value,
        menu_items: selectedMenuItems.value,
        context: promptContext.value,
        brand_dna: activeBrandDna.value
      })

      if (!saveResponse.success || !saveResponse.data?.favorite?.id) {
        throw new Error('Failed to save post')
      }

      favoritePostId = saveResponse.data.favorite.id
      lastSavedPost.value = saveResponse.data.favorite
      debugLog('Post saved with ID:', favoritePostId)
    }

    if (data.publishType === 'schedule') {
      // Schedule the post
      debugLog('Scheduling post for:', data.scheduleDate, data.scheduleTime, 'to platforms:', platforms)

      // Build platform_settings with account selections (includes post types and carousel items)
      const platform_settings: any = {}
      if (data.accountSelections) {
        if (data.accountSelections.facebook) {
          platform_settings.facebook = data.accountSelections.facebook.map((sel: AccountSelection) => ({
            accountId: sel.accountId,
            postType: sel.postType,
            carouselItems: sel.carouselItems
          }))
        }
        if (data.accountSelections.instagram) {
          platform_settings.instagram = data.accountSelections.instagram.map((sel: AccountSelection) => ({
            accountId: sel.accountId,
            postType: sel.postType,
            carouselItems: sel.carouselItems
          }))
        }
        if (data.accountSelections.tiktok) {
          platform_settings.tiktok = data.accountSelections.tiktok
        }
        if (data.accountSelections.twitter) {
          platform_settings.twitter = data.accountSelections.twitter
        }
      }

      const scheduledTime = `${data.scheduleDate!}T${data.scheduleTime || '12:00'}:00`
      const scheduleResponse = await api.schedulePost({
        post_id: favoritePostId,
        scheduled_time: scheduledTime,
        platforms: platforms,
        timezone: data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        brand_id: activeBusinessId.value || brand.value?.id,
      })

      if (!scheduleResponse.success) {
        throw new Error('Failed to schedule post')
      }

      debugLog('Post scheduled successfully!')

      // Navigate to calendar view
      router.push({
        path: '/scheduler',
        query: {
          date: data.scheduleDate
        }
      })
    } else {
      // Publish now to selected platforms (feedback already shown in step 3->4 transition)
      debugLog('[DEBUG] Easy Mode: Publishing now to platforms:', platforms)

      console.log('🔴 [handleEasyModePublish] Setting pendingPublishData with accountSelections:', data.accountSelections)

      // Just call continueEasyModePublish directly, feedback was already shown
      pendingPublishData.value = {
        favoritePostId,
        platforms,
        accountSelections: data.accountSelections
      }

      console.log('🔴 [handleEasyModePublish] pendingPublishData set to:', pendingPublishData.value)

      await continueEasyModePublish()
    }
  } catch (err: any) {
    errorLog('Failed to handle easy mode publish:', err)
    generationError.value = err.message || 'Failed to publish post'
    publishing.value = false
  }
}

// Continue publishing after feedback (for Easy Mode)
async function continueEasyModePublish() {
  if (!pendingPublishData.value) {
    errorLog('No pending publish data')
    return
  }

  const { favoritePostId, platforms } = pendingPublishData.value

  console.log('🔴 [continueEasyModePublish] Full pendingPublishData:', JSON.stringify(pendingPublishData.value, null, 2))

  try {
    // Publish now to selected platforms
    debugLog('Publishing now to platforms:', platforms)

      // Set publishing state BEFORE starting any API calls
      publishing.value = true
      facebookReconnectRequired.value = false

      // Initialize progress tracking
      publishingProgress.value = platforms.map(platform => {
        // Default post type based on media type: reels for videos, feed for images
        const postType = currentMediaType.value === 'video' ? 'reel' : 'feed'
        return {
          platform,
          status: 'pending' as const,
          url: undefined,
          error: undefined,
          postType
        }
      })
      publishingComplete.value = false

      // Show publishing modal immediately
      showPublishingModal.value = true

      const results: Array<{ platform: string; success: boolean; url?: string; error?: string }> = []

      for (const platform of platforms) {
        // Update status to "publishing"
        const progressItem = publishingProgress.value.find(p => p.platform === platform)
        if (progressItem) {
          progressItem.status = 'publishing'
        }

        if (platform === 'facebook') {
          // Get selected pages from accountSelections, falling back to first connected page
          debugLog('Connected Facebook pages:', facebookStore.connectedPages)
          const accountSelections = pendingPublishData.value?.accountSelections
          const facebookSelections = accountSelections?.facebook || []

          // Determine which pages to publish to
          const pagesToPublish: Array<{ pageId: string; pageName?: string }> = []
          if (facebookSelections.length > 0) {
            // Use pages from accountSelections
            for (const sel of facebookSelections) {
              const page = facebookStore.connectedPages.find(p => p.pageId === sel.accountId)
              if (page) {
                pagesToPublish.push(page)
              }
            }
          }
          // Fall back to first connected page if no accountSelections
          if (pagesToPublish.length === 0) {
            const firstPage = facebookStore.connectedPages[0]
            if (firstPage) {
              pagesToPublish.push(firstPage)
            }
          }

          if (pagesToPublish.length === 0) {
            errorLog('No Facebook page connected')
            results.push({ platform: 'facebook', success: false, error: 'No Facebook page connected' })
            continue
          }

          for (const selectedPage of pagesToPublish) {
            debugLog('Publishing to page:', selectedPage.pageId, selectedPage.pageName)

            // Get post type and carousel items from account selections
            const accountSelection = facebookSelections.find((sel: AccountSelection) =>
              sel.accountId === selectedPage.pageId
            )
            const postType = accountSelection?.postType || 'feed'
            const carouselItems = accountSelection?.carouselItems

            // Update progress item with actual post type
            if (progressItem) {
              progressItem.postType = postType
            }

            if (carouselItems) {
              debugLog('Facebook carousel items:', carouselItems.length)
            }

            // Build the message with post text and hashtags
            // Use carousel-specific content if available
            const carouselCaption = accountSelection?.carouselCaption
            const carouselHashtags = accountSelection?.carouselHashtags

            let message: string
            if (carouselCaption && postType === 'carousel') {
              // Use carousel-specific caption and hashtags
              message = carouselHashtags && carouselHashtags.length > 0
                ? `${carouselCaption}\n\n${carouselHashtags.join(' ')}`
                : carouselCaption
              debugLog('Using carousel-specific caption')
            } else {
              // Use default generated content
              const hashtags = generatedPostContent.value?.hashtags || []
              const postText = generatedPostContent.value?.postText || ''
              message = hashtags.length > 0
                ? `${postText}\n\n${hashtags.join(' ')}`
                : postText
            }

            debugLog('Calling API to post to Facebook...')
            const isVideo = currentMediaType.value === 'video'

            // For carousel posts, only send carouselItems, not individual image/video
            const isCarousel = postType === 'carousel'
            const imageUrl = isCarousel ? undefined : (isVideo ? undefined : generatedImageUrl.value)
            const videoUrl = isCarousel ? undefined : (isVideo ? generatedVideoUrl.value : undefined)
            const contentType = isCarousel ? 'image' : currentMediaType.value

            console.log('[PostsCreateView] Facebook API call params:', {
              postType,
              isCarousel,
              carouselItemsCount: carouselItems?.length || 0,
              hasImageUrl: !!imageUrl,
              hasVideoUrl: !!videoUrl
            })

            try {
              const response = await api.postToFacebook(
                selectedPage.pageId,
                message,
                imageUrl,
                videoUrl,
                contentType,
                postType,
                carouselItems
              )
              debugLog('Facebook API response:', response)

              // API returns postUrl directly on response, not inside data
              const postUrl = (response as any).postUrl || response.data?.postUrl
              if (response.success && postUrl) {
                results.push({ platform: 'facebook', success: true, url: postUrl })
                debugLog('Published to Facebook successfully:', postUrl)
                // Add notification for successful Facebook publish
                notificationStore.addPublishSuccess('facebook', postUrl)
                // Update progress
                if (progressItem) {
                  progressItem.status = 'success'
                  progressItem.url = postUrl
                }
              } else if ((response as any).code === 'FACEBOOK_RECONNECT_REQUIRED') {
                facebookReconnectRequired.value = true
                results.push({ platform: 'facebook', success: false, error: 'Facebook connection expired' })
                // Update progress
                if (progressItem) {
                  progressItem.status = 'error'
                  progressItem.error = 'Facebook connection expired'
                }
              } else {
                const errorMsg = response.error || 'Unknown error'
                results.push({ platform: 'facebook', success: false, error: errorMsg })
                // Update progress
                if (progressItem) {
                  progressItem.status = 'error'
                  progressItem.error = errorMsg
                }
              }
            } catch (err: any) {
              const errorMsg = err.message || 'Failed to publish'
              results.push({ platform: 'facebook', success: false, error: errorMsg })
              if (progressItem) {
                progressItem.status = 'error'
                progressItem.error = errorMsg
              }
            }
          }
        } else if (platform === 'instagram') {
          // Instagram publishing via Facebook Graph API
          debugLog('Connected Instagram accounts:', instagramStore.connectedAccounts)
          const accountSelections = pendingPublishData.value?.accountSelections
          const instagramSelections = accountSelections?.instagram || []

          // Determine which accounts to publish to
          const accountsToPublish: Array<{ instagramAccountId: string; username?: string }> = []
          if (instagramSelections.length > 0) {
            for (const sel of instagramSelections) {
              const account = instagramStore.connectedAccounts.find(a => a.instagramAccountId === sel.accountId)
              if (account) {
                accountsToPublish.push(account)
              }
            }
          }
          // Fall back to first connected account if no accountSelections
          if (accountsToPublish.length === 0) {
            const firstAccount = instagramStore.connectedAccounts[0]
            if (firstAccount) {
              accountsToPublish.push(firstAccount)
            }
          }

          if (accountsToPublish.length === 0) {
            errorLog('No Instagram account connected')
            results.push({ platform: 'instagram', success: false, error: 'No Instagram account connected' })
            continue
          }

          for (const instagramAccount of accountsToPublish) {
            debugLog('Publishing to Instagram account:', instagramAccount.username)

            const accountSelection = instagramSelections.find((sel: AccountSelection) =>
              sel.accountId === instagramAccount.instagramAccountId
            )

            const isVideo = currentMediaType.value === 'video'
            const postType = accountSelection?.postType || (isVideo ? 'reel' : 'feed')
            const carouselItems = accountSelection?.carouselItems

            // Update progress item with actual post type
            if (progressItem) {
              progressItem.postType = postType
            }

            debugLog('Instagram post type:', postType)
            if (carouselItems) {
              debugLog('Instagram carousel items:', carouselItems.length)
            }

            // Build the message with post text and hashtags
            // Use carousel-specific content if available
            const carouselCaption = accountSelection?.carouselCaption
            const carouselHashtags = accountSelection?.carouselHashtags

            let caption: string
            if (carouselCaption && postType === 'carousel') {
              // Use carousel-specific caption and hashtags
              caption = carouselHashtags && carouselHashtags.length > 0
                ? `${carouselCaption}\n\n${carouselHashtags.join(' ')}`
                : carouselCaption
              debugLog('Using carousel-specific caption')
            } else {
              // Use default generated content
              const hashtags = generatedPostContent.value?.hashtags || []
              const postText = generatedPostContent.value?.postText || ''
              caption = hashtags.length > 0
                ? `${postText}\n\n${hashtags.join(' ')}`
                : postText
            }

            // For carousel posts, only send carouselItems, not individual image/video
            const isCarousel = postType === 'carousel'
            const imageUrl = isCarousel ? undefined : (isVideo ? undefined : generatedImageUrl.value)
            const videoUrl = isCarousel ? undefined : (isVideo ? generatedVideoUrl.value : undefined)
            const contentType = isCarousel ? 'image' : currentMediaType.value

            try {
              const response = await api.postToInstagram(
                instagramAccount.instagramAccountId,
                caption,
                imageUrl,
                videoUrl,
                contentType,
                postType,
                carouselItems
              )
              debugLog('Instagram API response:', response)

              // API returns postUrl directly on response or inside data
              const postUrl = (response as any).postUrl || response.data?.postUrl
              if (response.success && postUrl) {
                results.push({ platform: 'instagram', success: true, url: postUrl })
                debugLog('Published to Instagram successfully:', postUrl)
                // Add notification for successful Instagram publish
                notificationStore.addPublishSuccess('instagram', postUrl)
                // Update progress
                if (progressItem) {
                  progressItem.status = 'success'
                  progressItem.url = postUrl
                }
              } else {
                const errorMsg = response.error || 'Failed to publish to Instagram'
                results.push({ platform: 'instagram', success: false, error: errorMsg })
                // Update progress
                if (progressItem) {
                  progressItem.status = 'error'
                  progressItem.error = errorMsg
                }
              }
            } catch (instagramErr: any) {
              errorLog('Instagram publishing error:', instagramErr)
              const errorMsg = instagramErr.message || 'Failed to publish to Instagram'
              results.push({ platform: 'instagram', success: false, error: errorMsg })
              // Update progress
              if (progressItem) {
                progressItem.status = 'error'
                progressItem.error = errorMsg
              }
            }
          }
        } else {
          // For other platforms, show not implemented message
          results.push({ platform, success: false, error: `${platform} publishing not yet supported` })
        }
      }

      // Check results and set publishResults
      publishing.value = false
      publishingComplete.value = true
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
              post_id: favoritePostId,
              platforms: successfulPlatforms.map(r => r.platform),
              brand_id: activeBusinessId.value || brand.value?.id,
              platform_urls: Object.fromEntries(
                successfulPlatforms.filter(r => r.url).map(r => [r.platform, r.url!])
              )
            })
            debugLog('Post saved to calendar as published')
          } catch (calendarErr) {
            warnLog('Failed to save to calendar:', calendarErr)
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
    errorLog('Error publishing/scheduling:', err)
    generationError.value = err.message || 'Failed to publish post'
    publishing.value = false
    publishingComplete.value = true
  }
}

// Continue publishing after feedback (for Advanced Mode)
async function _continueAdvancedModePublish() {
  if (!pendingPublishData.value || pendingPublishData.value.type !== 'advanced') {
    errorLog('No pending advanced mode publish data')
    return
  }

  const { platforms, data, onResult } = pendingPublishData.value

  try {
    debugLog('[DEBUG] Continuing Advanced Mode publish to platforms:', platforms)

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

        // Get post type and carousel items from account selections if available
        const accountSelections = data.accountSelections
        const facebookSelections = accountSelections?.facebook || []
        const accountSelection = facebookSelections.find((sel: AccountSelection) =>
          sel.accountId === selectedPage.pageId
        )
        const postType = accountSelection?.postType || 'feed'
        const carouselItems = accountSelection?.carouselItems

        // Use carousel-specific content if available
        const carouselCaption = accountSelection?.carouselCaption
        const carouselHashtags = accountSelection?.carouselHashtags
        let finalMessage: string
        if (carouselCaption && postType === 'carousel') {
          finalMessage = carouselHashtags && carouselHashtags.length > 0
            ? `${carouselCaption}\n\n${carouselHashtags.join(' ')}`
            : carouselCaption
        } else {
          finalMessage = message
        }

        // For carousel posts, don't send imageUrl
        const isCarousel = postType === 'carousel'
        const imageUrl = isCarousel ? undefined : data.imageUrl

        try {
          const response = await api.postToFacebook(
            selectedPage.pageId,
            finalMessage,
            imageUrl,
            undefined,
            'image',
            postType,
            carouselItems
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

        // Get post type and carousel items from account selections if available
        const accountSelections = data.accountSelections
        const instagramSelections = accountSelections?.instagram || []
        const accountSelection = instagramSelections.find((sel: AccountSelection) =>
          sel.accountId === instagramAccount.instagramAccountId
        )
        const postType = accountSelection?.postType || 'feed'
        const carouselItems = accountSelection?.carouselItems

        // Use carousel-specific content if available
        const carouselCaption = accountSelection?.carouselCaption
        const carouselHashtags = accountSelection?.carouselHashtags
        let finalMessage: string
        if (carouselCaption && postType === 'carousel') {
          finalMessage = carouselHashtags && carouselHashtags.length > 0
            ? `${carouselCaption}\n\n${carouselHashtags.join(' ')}`
            : carouselCaption
        } else {
          finalMessage = message
        }

        // For carousel posts, don't send imageUrl
        const isCarousel = postType === 'carousel'
        const imageUrl = isCarousel ? undefined : data.imageUrl

        try {
          const response = await api.postToInstagram(
            instagramAccount.instagramAccountId,
            finalMessage,
            imageUrl,
            undefined,
            'image',
            postType,
            carouselItems
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
          post_id: lastSavedPost.value.id,
          platforms: successfulPlatforms.map(r => r.platform),
          brand_id: activeBusinessId.value || brand.value?.id,
          platform_urls: postUrls
        })
      } catch (calendarErr) {
        warnLog('Failed to save to calendar:', calendarErr)
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
    errorLog('[DEBUG] Error in Advanced Mode publish:', err)
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
  customPrompt?: string
  strictnessMode: 'strict' | 'flexible' | 'creative'
  holidayTheme: string
  customHolidayText: string
  includeLogo: boolean
  uploadedImage: File | null
  uploadedLogo: File | null
  isExistingImage?: boolean
  mediaType: 'image' | 'video'
  videoOptions?: {
    duration: 4 | 6 | 8
    aspectRatio: '16:9' | '9:16'
    generateAudio: boolean
  }
}) {
  try {
    easyModeGenerating.value = true
    generationError.value = null
    lastEasyModeData.value = data
    currentMediaType.value = data.mediaType

    // Set up the generation with values from Easy Mode
    if (data.menuItem) {
      selectedMenuItems.value = [data.menuItem]
    } else {
      selectedMenuItems.value = []
    }
    promptContext.value = data.context

    // Apply style template settings - map styles to sticker settings
    const styleMapping = {
      behindTheScenes: { stickerStyle: 'bold' as const, stickerPosition: 'top-right' as const },
      cleanStrict: { stickerStyle: 'outlined' as const, stickerPosition: 'top-left' as const },
      zoomIn: { stickerStyle: 'bold' as const, stickerPosition: 'center' as const },
      oneBite: { stickerStyle: 'ribbon' as const, stickerPosition: 'bottom-left' as const },
      studioShot: { stickerStyle: 'badge' as const, stickerPosition: 'top-right' as const },
      infographic: { stickerStyle: 'outlined' as const, stickerPosition: 'top-left' as const },
      placeOnTable: { stickerStyle: 'bold' as const, stickerPosition: 'top-left' as const },
      custom: { stickerStyle: 'bold' as const, stickerPosition: 'top-right' as const },
      resortSunset: { stickerStyle: 'badge' as const, stickerPosition: 'top-right' as const },
      resortPool: { stickerStyle: 'bold' as const, stickerPosition: 'top-left' as const },
      resortSuite: { stickerStyle: 'outlined' as const, stickerPosition: 'bottom-right' as const }
    }

    const selectedStyle = styleMapping[data.styleTemplate as keyof typeof styleMapping] || styleMapping.behindTheScenes

    stickerStyle.value = selectedStyle.stickerStyle
    stickerPosition.value = selectedStyle.stickerPosition
    includeLogo.value = data.includeLogo
    strictnessMode.value = data.strictnessMode
    // Set holiday theme - use custom text if 'custom' is selected
    holidayTheme.value = data.holidayTheme === 'custom' && data.customHolidayText
      ? data.customHolidayText
      : data.holidayTheme
    const resortPrompt = activeBrandType.value === 'resort'
      ? resortTemplatePrompts[data.styleTemplate]
      : undefined

    if (resortPrompt) {
      // Resort templates use a predefined custom prompt while keeping the reference image
      visualStyle.value = 'custom'
      customVisualPrompt.value = resortPrompt
    } else {
      // Set visual style for image generation
      visualStyle.value = data.styleTemplate as 'behindTheScenes' | 'cleanStrict' | 'zoomIn' | 'oneBite' | 'studioShot' | 'infographic' | 'placeOnTable' | 'custom'
      // Store custom prompt if using custom style
      customVisualPrompt.value = data.customPrompt || ''
    }
    logoPosition.value = 'bottom-right'

    // Skip Stage 1 prompt generation - we now pass dish info directly to image generation
    // This saves ~3.5 seconds by avoiding a separate Gemini call for prompt generation
    debugLog('[EasyMode] Skipping Stage 1 prompt generation - using direct dish info')

    // Clear previous content
    generatedImageUrl.value = ''
    generatedVideoUrl.value = ''
    videoOperationId.value = null
    generatedPostContent.value = null
    publishResults.value = null
    lastSavedPost.value = null

    // Don't show modal for Easy Mode - content will show in preview step
    // Keep generating state true while generating
    easyModeGenerating.value = true

    // Generate content based on media type
    try {
      if (data.mediaType === 'video') {
        debugLog('[EasyMode] Starting video generation...')
        await generateVideo(
          data.uploadedImage,
          data.uploadedLogo,
          data.videoOptions,
          holidayTheme.value,
          promptContext.value
        )
        debugLog('[EasyMode] Video generated successfully:', generatedVideoUrl.value)
      } else {
        debugLog('[EasyMode] Starting image generation with dish info...')
        // Use useDishInfo=true to skip Stage 1 and pass dish info directly
        await generateImage(data.uploadedLogo, data.uploadedImage, true)
        debugLog('[EasyMode] Image generated successfully:', generatedImageUrl.value)
      }

      // Upload the image to the appropriate brand collection (skip if already in library)
      if (data.uploadedImage && !data.isExistingImage) {
        try {
          // Convert File to UploadAssetData (base64 + mimeType)
          const base64 = await new Promise<string>((resolve) => {
            const reader = new FileReader()
            reader.onloadend = () => {
              const base64String = reader.result as string
              resolve(base64String.split(',')[1])
            }
            reader.readAsDataURL(data.uploadedImage!)
          })
          const assetData: UploadAssetData = {
            base64,
            mimeType: data.uploadedImage.type,
          }

          if (selectedBrand.value && selectedBrand.value.business_type !== 'restaurant') {
            const uploadResult = await brandService.uploadAsset(
              selectedBrand.value.id,
              assetData
            )
            if (brand.value) {
              brand.value.uploaded_images = [
                ...(uploadResult.data ? [uploadResult.data] : []),
                ...(brand.value.uploaded_images || [])
              ]
            }
            await brandsStore.refreshBrands()
          } else if (brand.value?.place_id) {
            await brandService.uploadBrandImages(
              brand.value.place_id,
              [assetData]
            )
          }
        } catch (uploadError) {
          errorLog('Failed to save uploaded image:', uploadError)
          // Don't fail the entire operation if this fails
        }
      }

      generationError.value = null
      easyModeGenerating.value = false // Generation complete
    } catch (genError: any) {
      const errorMessage = genError.message || (data.mediaType === 'video'
        ? t('contentCreate.videoError', 'Failed to generate video. Please try again.')
        : t('contentCreate.imageError', 'Failed to generate image. Please try again.'))
      generationError.value = errorMessage
      errorLog('[EasyMode] Generation error:', genError)
      notificationStore.addNotification({
        type: 'error',
        title: data.mediaType === 'video'
          ? t('posts.create.videoGenerationFailed', 'Video generation failed')
          : t('posts.create.imageGenerationFailed'),
        message: errorMessage,
      })
      easyModeGenerating.value = false // Generation failed
    }
  } catch (err: any) {
    easyModeGenerating.value = false
    const errorMessage = err.message || t('contentCreate.generateError', 'Failed to generate content')
    generationError.value = errorMessage
    errorLog('[EasyMode] Outer error:', err)
    notificationStore.addNotification({
      type: 'error',
      title: t('posts.create.generationFailed'),
      message: errorMessage,
    })
  }
}

// Easy Mode Reset Handler - called when user clicks "Create Another Post"
function handleEasyModeReset() {
  // Reset all generation state
  generatedImageUrl.value = ''
  generatedVideoUrl.value = ''
  videoOperationId.value = null
  videoGeneratingInBackground.value = false
  currentMediaType.value = 'image'
  generatedPostContent.value = null
  generationError.value = null
  lastSavedPost.value = null
  publishResults.value = null
  publishing.value = false
  easyModeGenerating.value = false
  generatingVideo.value = false
  selectedMenuItems.value = []
  promptContext.value = ''
  editablePrompt.value = ''
  imagePrompts.value = []
}

// Easy Mode Animate Handler - generates video from image IN BACKGROUND
// User can continue to post the image while video generates
async function handleEasyModeAnimate(data: {
  videoOptions: {
    duration: 4 | 6 | 8
    aspectRatio: '16:9' | '9:16'
    generateAudio: boolean
  }
}) {
  if (!generatedImageUrl.value) {
    notificationStore.addNotification({
      type: 'error',
      title: t('posts.create.animationFailed', 'Animation failed'),
      message: t('easyMode.step3.noImageToAnimate', 'No image to animate'),
    })
    return
  }

  try {
    // Show brief loading while we start the generation
    generatingVideo.value = true

    // Fetch the generated image and convert to base64
    const imageResponse = await fetch(generatedImageUrl.value)
    const imageBlob = await imageResponse.blob()
    const base64Data = await new Promise<string>((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        const result = reader.result as string
        resolve(result.split(',')[1]) // Remove data URL prefix
      }
      reader.readAsDataURL(imageBlob)
    })

    // Use the current prompt for video generation
    const prompt = editablePrompt.value || 'Animate this food image with subtle motion'

    // Generate video from image
    const videoOptions = {
      duration: data.videoOptions.duration,
      aspectRatio: data.videoOptions.aspectRatio,
      resolution: '720p' as '720p' | '1080p',
      generateAudio: false // Never generate audio - it adds unwanted voices
    }

    debugLog('[EasyMode Animate] Starting background video generation...')
    const response = await api.generateVideoFromImage(
      prompt,
      base64Data,
      imageBlob.type || 'image/png',
      videoOptions
    )

    if (!response.success) {
      throw new Error(response.error || t('contentCreate.videoError', 'Failed to generate video'))
    }

    // Store the operation ID
    videoOperationId.value = response.operationId

    // First, save the post with just the image so we have a postId for the background task
    const savedPost = await autoSavePost()
    const postId = savedPost?.id || lastSavedPost.value?.id

    if (postId) {
      // Get a title for the notification
      const postTitle = generatedPostContent.value?.postText?.substring(0, 50) ||
                       selectedMenuItems.value[0]?.name ||
                       'Your post'

      // Add task to background generation store - it will handle polling and save video_url when done
      videoGenerationStore.addTask({
        postId,
        postTitle,
        operationId: response.operationId,
        modelId: response.modelId
      })

      // Mark that video is generating in background
      videoGeneratingInBackground.value = true

      // Show notification that generation started in background
      notificationStore.addNotification({
        type: 'info',
        title: t('posts.videoGenerationStarted', 'Video Generation Started'),
        message: t('posts.videoGeneratingInBackground', 'Your video is being generated in the background. You can post the image now or wait for the video.'),
      })

      // Auto-open notification dropdown so user sees it
      notificationStore.openDropdown()

      debugLog('[EasyMode Animate] Video generation started in background, postId:', postId)
    } else {
      // Fallback: if no post saved yet, still start background generation but warn user
      notificationStore.addNotification({
        type: 'warning',
        title: t('posts.videoGenerationStarted', 'Video Generation Started'),
        message: t('easyMode.step3.videoGeneratingNote', 'Video is generating. Save your post to track progress.'),
      })
    }

  } catch (err: any) {
    errorLog('[EasyMode Animate] Error starting generation:', err)
    notificationStore.addNotification({
      type: 'error',
      title: t('posts.create.animationFailed', 'Animation failed'),
      message: err.message || t('contentCreate.videoError', 'Failed to generate video'),
    })
  } finally {
    generatingVideo.value = false
  }
}

async function generatePromptsFromSelection() {
  if (!brand.value) {
    warnLog('[Prompts] No brand value')
    return
  }

  try {
    debugLog('[Prompts] Calling API with:', {
      brand: activeProfileName.value,
      menuItems: selectedMenuItems.value,
      context: promptContext.value
    })

    const response = await api.generatePrompts(
      {
        name: activeProfileName.value,
        type: brand.value.types?.[0] || 'restaurant',
        brandDna: activeBrandDna.value,
      },
      selectedMenuItems.value,
      promptContext.value
    )

    debugLog('[Prompts] API response:', response)

    if (response.success) {
      // API returns imagePrompts directly on response, not inside data
      const prompts = (response as any).imagePrompts || response.data?.imagePrompts || []
      imagePrompts.value = prompts
      debugLog('[Prompts] Set imagePrompts to:', imagePrompts.value)
    } else {
      warnLog('[Prompts] Response not successful:', response)
      imagePrompts.value = []
    }
  } catch (err) {
    errorLog('[Prompts] Failed to generate prompts:', err)
    imagePrompts.value = []
  }
}

async function generateImage(uploadedLogo: File | null = null, uploadedImage: File | null = null, useDishInfo: boolean = false) {
  // Either need a prompt OR dish info (for direct generation without Stage 1)
  if (!useDishInfo && !editablePrompt.value) return
  if (!brand.value) return

  try {
    generatingImage.value = true
    generatedImageUrl.value = ''

    // Start post content generation in parallel
    let postContentPromise: Promise<void> | null = null
    postContentPromise = generatePostContent().catch(error => {
      errorLog('Failed to generate post content:', error)
    })

    // Prepare watermark if brand has logo and user wants it
    // Use uploaded logo if provided, otherwise use stored logo
    const logoUrl = uploadedLogo
      ? await fileToBase64Url(uploadedLogo)
      : activeBrandDna.value?.logo_url

    const watermark = (includeLogo.value && logoUrl)
      ? {
          logoPath: logoUrl,
          position: logoPosition.value,
          opacity: 80,
          scale: 25,
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
        errorLog('Failed to process uploaded image')
      }
    }
    // If no uploaded image, try to use menu item image
    else if (selectedMenuItems.value.length > 0 && selectedMenuItems.value[0].imageUrl) {
      try {
        const firstItem = selectedMenuItems.value[0]
        // Proxy Okam CDN URLs to avoid CORS issues
        const imageUrl = okamService.proxyImageUrl(firstItem.imageUrl) || firstItem.imageUrl
        const imageResponse = await fetch(imageUrl)
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
          // Handle 'application/octet-stream' by defaulting to image/png
          let mimeType = imageBlob.type
          if (!mimeType || mimeType === 'application/octet-stream') {
            mimeType = 'image/png'
          }
          referenceImage = {
            base64Data,
            mimeType,
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

    // Build dish info for direct generation (skips Stage 1 prompt generation)
    const dishInfo = useDishInfo && selectedMenuItems.value.length > 0
      ? {
          name: selectedMenuItems.value[0].name,
          description: selectedMenuItems.value[0].description || undefined
        }
      : undefined

    // Determine prompt: use dish info if available, otherwise use a generic prompt
    const promptToUse = useDishInfo && dishInfo
      ? null // Use dishInfo instead of prompt
      : (editablePrompt.value || 'Create an engaging social media post for this image')

    // Use place_id if available, otherwise use id (for manual brands)
    const placeId = brand.value.place_id || brand.value.id

    const response = await api.generateImage(
      promptToUse,
      watermark,
      referenceImage,
      promotionalSticker,
      placeId,
      strictnessMode.value,
      holidayTheme.value !== 'none' ? holidayTheme.value : undefined,
      visualStyle.value,
      visualStyle.value === 'custom' ? customVisualPrompt.value : undefined,
      dishInfo,
      activeProfileName.value
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

/**
 * Fetch and convert a reference image from multiple sources with priority:
 * 1. Uploaded image (File)
 * 2. Generated image URL (from previous generation)
 * 3. Menu item image URL (from selected menu item)
 *
 * Returns undefined if no reference image is available.
 * Handles CORS proxying and base64 conversion.
 * Non-blocking: returns undefined on errors instead of throwing.
 */
async function fetchReferenceImage(
  uploadedImage: File | null,
  generatedImageUrl: string | null,
  menuItemImageUrl: string | null
): Promise<{ base64Data: string; mimeType: string; source: 'uploaded' | 'generated' | 'menu' } | undefined> {
  debugLog('[Reference] === Starting reference image fetch ===')

  // Priority 1: Uploaded image
  if (uploadedImage) {
    try {
      debugLog('[Reference] Priority 1: Found uploaded image, processing...')
      debugLog('[Reference] - File name:', uploadedImage.name)
      debugLog('[Reference] - File size:', uploadedImage.size, 'bytes')
      debugLog('[Reference] - File type:', uploadedImage.type)
      const base64Data = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => {
          const base64String = reader.result as string
          resolve(base64String.split(',')[1])
        }
        reader.readAsDataURL(uploadedImage)
      })
      debugLog('[Reference] ✅ Successfully converted uploaded image to base64')
      return {
        base64Data,
        mimeType: uploadedImage.type,
        source: 'uploaded'
      }
    } catch (error) {
      errorLog('[Reference] ❌ Failed to process uploaded image:', error)
      // Fall through to next priority
    }
  } else {
    debugLog('[Reference] Priority 1: No uploaded image')
  }

  // Priority 2: Previously generated image
  if (generatedImageUrl) {
    try {
      debugLog('[Reference] Priority 2: Found generated image URL, fetching...')
      debugLog('[Reference] - URL:', generatedImageUrl)
      const imageResponse = await fetch(generatedImageUrl)
      debugLog('[Reference] - Fetch response status:', imageResponse.status, imageResponse.statusText)
      if (imageResponse.ok) {
        const imageBlob = await imageResponse.blob()
        debugLog('[Reference] - Blob size:', imageBlob.size, 'bytes')
        debugLog('[Reference] - Blob type:', imageBlob.type)
        const base64Data = await new Promise<string>((resolve) => {
          const reader = new FileReader()
          reader.onloadend = () => {
            const base64String = reader.result as string
            resolve(base64String.split(',')[1])
          }
          reader.readAsDataURL(imageBlob)
        })
        let mimeType = imageBlob.type
        if (!mimeType || mimeType === 'application/octet-stream') {
          debugLog('[Reference] - Defaulting MIME type to image/png')
          mimeType = 'image/png'
        }
        debugLog('[Reference] ✅ Successfully converted generated image to base64')
        return {
          base64Data,
          mimeType,
          source: 'generated'
        }
      } else {
        errorLog('[Reference] ❌ Fetch failed with status:', imageResponse.status)
      }
    } catch (error) {
      errorLog('[Reference] ❌ Failed to fetch generated image:', error)
      // Fall through to next priority
    }
  } else {
    debugLog('[Reference] Priority 2: No generated image URL')
  }

  // Priority 3: Menu item image
  if (menuItemImageUrl) {
    try {
      debugLog('[Reference] Priority 3: Found menu item image URL, fetching...')
      debugLog('[Reference] - Original URL:', menuItemImageUrl)
      // Proxy Okam CDN URLs to avoid CORS issues
      const imageUrl = okamService.proxyImageUrl(menuItemImageUrl) || menuItemImageUrl
      debugLog('[Reference] - Proxied URL:', imageUrl)
      const imageResponse = await fetch(imageUrl)
      debugLog('[Reference] - Fetch response status:', imageResponse.status, imageResponse.statusText)
      if (imageResponse.ok) {
        const imageBlob = await imageResponse.blob()
        debugLog('[Reference] - Blob size:', imageBlob.size, 'bytes')
        debugLog('[Reference] - Blob type:', imageBlob.type)
        const base64Data = await new Promise<string>((resolve) => {
          const reader = new FileReader()
          reader.onloadend = () => {
            const base64String = reader.result as string
            resolve(base64String.split(',')[1])
          }
          reader.readAsDataURL(imageBlob)
        })
        // Handle 'application/octet-stream' by defaulting to image/png
        let mimeType = imageBlob.type
        if (!mimeType || mimeType === 'application/octet-stream') {
          debugLog('[Reference] - Defaulting MIME type to image/png')
          mimeType = 'image/png'
        }
        debugLog('[Reference] ✅ Successfully converted menu item image to base64')
        debugLog('[Reference] - Final MIME type:', mimeType)
        debugLog('[Reference] - Base64 length:', base64Data.length, 'characters')
        return {
          base64Data,
          mimeType,
          source: 'menu'
        }
      } else {
        errorLog('[Reference] ❌ Fetch failed with status:', imageResponse.status)
      }
    } catch (error) {
      errorLog('[Reference] ❌ Failed to fetch menu item image:', error)
      errorLog('[Reference] - Error details:', error)
      // Fall through to no reference
    }
  } else {
    debugLog('[Reference] Priority 3: No menu item image URL')
  }

  // No reference image available
  debugLog('[Reference] ❌ No reference image available from any source')
  debugLog('[Reference] === Reference image fetch complete (no image found) ===')
  return undefined
}

// Video generation function
async function generateVideo(
  uploadedImage: File | null = null,
  uploadedLogo: File | null = null,
  videoOptions?: {
    duration: 4 | 6 | 8
    aspectRatio: '16:9' | '9:16'
    generateAudio: boolean
  },
  themeModifier?: string,
  promotionalText?: string
) {
  if (!editablePrompt.value || !brand.value) return

  try {
    generatingVideo.value = true
    generatedVideoUrl.value = ''

    // Start post content generation in parallel
    let postContentPromise: Promise<void> | null = null
    postContentPromise = generatePostContent().catch(error => {
      errorLog('Failed to generate post content:', error)
    })

    debugLog('========== VIDEO GENERATION START ==========')
    debugLog('[Video] Base prompt:', editablePrompt.value)
    debugLog('[Video] Selected menu items:', selectedMenuItems.value)
    debugLog('[Video] Visual style:', visualStyle.value)

    // BUILD VIDEO-SPECIFIC PROMPT (improved structure for better variety)
    // Extract dish description (remove photography terminology)
    const dishDescription = extractDishDescription(editablePrompt.value)
    debugLog('[Video] Extracted dish description:', dishDescription)

    // Build video prompt in optimal order for AI interpretation
    const promptParts: string[] = []

    // PART 1: Style & Cinematography (FIRST - sets creative direction)
    if (visualStyle.value === 'custom') {
      promptParts.push(customVisualPrompt.value)
      debugLog('[Video] Using custom visual prompt')
    } else {
      const styleInstruction = getVideoStyleInstruction(visualStyle.value)
      if (styleInstruction) {
        promptParts.push(styleInstruction)
        debugLog('[Video] Style instruction applied:', visualStyle.value)
        debugLog('[Video] Style preview:', styleInstruction.substring(0, 150) + '...')
      }
    }

    // PART 2: Subject Description (SECOND - what to film)
    promptParts.push(`Featured dish: ${dishDescription}`)

    // PART 3: Theme & Atmosphere (THIRD - mood evolution)
    if (themeModifier && themeModifier !== 'none') {
      const themeContext = getVideoThemeModifier(themeModifier)
      if (themeContext) {
        promptParts.push(themeContext)
        debugLog('[Video] Theme modifier applied:', themeModifier)
        debugLog('[Video] Theme preview:', themeContext.substring(0, 150) + '...')
      }
    }

    // PART 4: Promotional Text (FOURTH - text overlay integration)
    if (promotionalText && promotionalText.trim()) {
      const promoInstruction = `Include visible text overlay in a natural, premium style: "${promotionalText.toUpperCase()}" - make it prominent, elegant, and well-integrated into the video aesthetic with professional typography and subtle effects.`
      promptParts.push(promoInstruction)
      debugLog('[Video] Promotional text added to prompt:', promotionalText)
    }

    // PART 5: Fidelity Note (LAST - brief constraint)
    const fidelityNote = visualStyle.value !== 'custom'
      ? getVideoFidelityNote(visualStyle.value)
      : 'Final dish matches reference image composition and ingredients.'
    promptParts.push(`DISH FIDELITY: ${fidelityNote}`)

    // Build final enhanced prompt
    const enhancedPrompt = promptParts.join('\n\n')

    debugLog('[Video] ===== COMPLETE ENHANCED PROMPT =====')
    debugLog(enhancedPrompt)
    debugLog('[Video] ========================================')
    debugLog(`[Video] Prompt stats: ${enhancedPrompt.length} chars, ~${Math.ceil(enhancedPrompt.length / 4)} tokens`)

    // Prepare video generation options
    const options = {
      duration: videoOptions?.duration || 6,
      aspectRatio: videoOptions?.aspectRatio || '9:16',
      resolution: '720p' as '720p' | '1080p',
      generateAudio: videoOptions?.generateAudio ?? true,
      enhancePrompt: true,
      model: 'veo-3.1-fast-generate-preview' as const,
    }
    debugLog('[Video] Options:', options)

    let response: any

    // Fetch reference image using helper - checks uploaded, generated, and menu item images
    debugLog('[Video] Attempting to fetch reference image...')
    debugLog('[Video] - Uploaded image:', uploadedImage ? 'YES' : 'NO')
    debugLog('[Video] - Generated image URL:', generatedImageUrl.value || 'NONE')
    debugLog('[Video] - Menu item image URL:', selectedMenuItems.value[0]?.imageUrl || 'NONE')

    const referenceImageData = await fetchReferenceImage(
      uploadedImage,
      generatedImageUrl.value, // Check previously generated image
      selectedMenuItems.value[0]?.imageUrl // Check menu item image
    )

    if (referenceImageData) {
      debugLog('[Video] ✅ REFERENCE IMAGE FOUND!')
      debugLog('[Video] Source:', referenceImageData.source)
      debugLog('[Video] MIME type:', referenceImageData.mimeType)
      debugLog('[Video] Base64 data length:', referenceImageData.base64Data.length, 'characters')
      debugLog('[Video] Base64 preview (first 100 chars):', referenceImageData.base64Data.substring(0, 100))
    } else {
      debugLog('[Video] ❌ NO REFERENCE IMAGE - generating from text only')
    }

    // Use reference image if available
    debugLog('[Video] Calling API...')
    if (referenceImageData) {
      debugLog('[Video] Using api.generateVideoFromImage()')
      response = await api.generateVideoFromImage(
        enhancedPrompt,
        referenceImageData.base64Data,
        referenceImageData.mimeType,
        options
      )
    } else {
      debugLog('[Video] Using api.generateVideo() (text-only)')
      response = await api.generateVideo(enhancedPrompt, options)
    }

    debugLog('[Video] API Response:', response)
    debugLog('[Video] Response success:', response.success)
    debugLog('[Video] Operation ID:', response.operationId)
    debugLog('========== VIDEO GENERATION API CALL COMPLETE ==========')

    if (!response.success) {
      throw new Error(response.error || t('contentCreate.videoError', 'Failed to generate video'))
    }

    // Store the operation ID for polling
    videoOperationId.value = response.operationId

    // Poll for video completion (pass modelId for correct polling endpoint)
    const videoUrl = await pollVideoUntilComplete(response.operationId, response.modelId)

    // Apply logo watermark if requested
    // NOTE: Requires FFmpeg to be installed on the backend
    if (uploadedLogo || (includeLogo.value && activeBrandDna.value?.logo_url)) {
      console.log('[Video] Logo watermarking requested...')

      const logoUrl = uploadedLogo
        ? await fileToBase64Url(uploadedLogo)
        : activeBrandDna.value?.logo_url

      if (logoUrl) {
        try {
          console.log('[Video] Calling watermark API...')
          const watermarkResponse = await api.addVideoWatermark(
            videoUrl,
            logoUrl,
            {
              position: logoPosition.value,
              opacity: 80,
              scale: 40,
              padding: 20,
            }
          )

          console.log('[Video] Watermark API response:', watermarkResponse)

          if (watermarkResponse.success && watermarkResponse.videoUrl) {
            generatedVideoUrl.value = watermarkResponse.videoUrl
            console.log('[Video] ✅ Watermark applied successfully!')
          } else {
            generatedVideoUrl.value = videoUrl
            console.warn('[Video] ⚠️ Watermark failed (FFmpeg might not be installed):', watermarkResponse.error)
            console.warn('[Video] Using non-watermarked video')
          }
        } catch (err: any) {
          errorLog('[Video] Watermark error:', err)
          console.warn('[Video] ⚠️ Watermarking failed - continuing with non-watermarked video')
          console.warn('[Video] To enable watermarking, install FFmpeg on the backend server')
          generatedVideoUrl.value = videoUrl
        }
      } else {
        generatedVideoUrl.value = videoUrl
      }
    } else {
      generatedVideoUrl.value = videoUrl
    }

    // Add Social Chef branding watermark (top-left, always present)
    console.log('[Video] Adding Social Chef branding watermark...')
    try {
      // Use the current video URL (which may already have brand logo)
      const currentVideoUrl = generatedVideoUrl.value || videoUrl
      const socialChefLogoUrl = `${window.location.origin}/powered-by-socialchef.svg`

      const brandingResponse = await api.addVideoWatermark(
        currentVideoUrl,
        socialChefLogoUrl,
        {
          position: 'top-left',
          opacity: 80,
          scale: 25,
          padding: 20,
        }
      )

      console.log('[Video] Social Chef branding watermark response:', brandingResponse)

      if (brandingResponse.success && brandingResponse.videoUrl) {
        generatedVideoUrl.value = brandingResponse.videoUrl
        console.log('[Video] ✅ Social Chef branding applied successfully!')
      } else {
        console.warn('[Video] ⚠️ Social Chef branding watermark failed:', brandingResponse.error)
        console.warn('[Video] Using video without Social Chef branding')
      }
    } catch (err: any) {
      errorLog('[Video] Social Chef branding watermark error:', err)
      console.warn('[Video] ⚠️ Social Chef branding watermarking failed - continuing without it')
    }

    // Promotional text is now included in the AI prompt above (no overlay needed)
    // This creates a more professional, integrated look than post-processing overlays

    // Wait for post content generation to complete
    if (postContentPromise) {
      await postContentPromise
    }

    // Auto-save post after generation
    await autoSavePost()
  } finally {
    generatingVideo.value = false
  }
}

// Poll video operation until complete
async function pollVideoUntilComplete(operationId: string, modelId?: string, maxAttempts = 60): Promise<string> {
  const pollInterval = 5000 // 5 seconds
  let attempts = 0

  while (attempts < maxAttempts) {
    const response = await api.pollVideoOperation(operationId, modelId)

    if (!response.success) {
      throw new Error(response.error || 'Failed to check video status')
    }

    const operation = (response as any).operation || response.data?.operation

    if (operation?.done) {
      if (operation.error) {
        throw new Error(operation.error)
      }
      // Return the video URL directly (backend returns full Supabase URLs)
      const videoUrl = operation.videoUrl || operation.filePath || ''
      return videoUrl
    }

    // Wait before next poll
    await new Promise(resolve => setTimeout(resolve, pollInterval))
    attempts++
  }

  throw new Error(t('contentCreate.videoTimeout', 'Video generation timed out. Please try again.'))
}

async function generatePostContent() {
  if (!brand.value) return

  try {
    generatingPostContent.value = true

    // Send name and description for better captions (description is optional, from Okam menu)
    const menuItemsWithDescriptions = selectedMenuItems.value.map(item => ({
      name: item.name,
      description: item.description || undefined
    }))

    const response = await api.generatePostContent(
      selectedPlatforms.value[0] || 'facebook',
      activeProfileName.value,
      menuItemsWithDescriptions,
      currentMediaType.value,
      promptContext.value,
      activeBrandDna.value,
      locale.value as 'en' | 'no'
    )

    if (response.success) {
      // API may return data directly on response or inside data property
      const content = response.data || response
      generatedPostContent.value = {
        postText: (content as any).postText || '',
        hashtags: (content as any).hashtags || [],
      }
    } else {
      const errorMessage = response.error || response.message || t('posts.create.captionGenerationFailed')
      errorLog('Failed to generate post content:', errorMessage)
      notificationStore.addNotification({
        type: 'error',
        title: t('posts.create.captionGenerationFailed'),
        message: errorMessage,
      })
    }
  } catch (err: any) {
    errorLog('Failed to generate post content:', err)
    notificationStore.addNotification({
      type: 'error',
      title: t('posts.create.captionGenerationFailed'),
      message: err.message || t('posts.create.unexpectedError'),
    })
  } finally {
    generatingPostContent.value = false
  }
}

function getBrandColor(): string {
  return (activeBrandDna.value?.primary_color as string) || '#D4AF37'
}

async function autoSavePost(): Promise<any | null> {
  // For video background generation, we may need to save with just the image first
  const mediaUrl = generatedImageUrl.value || (currentMediaType.value === 'video' ? generatedVideoUrl.value : '')
  if (!mediaUrl || !brand.value) return null

  // Don't auto-save if no brand selected
  if (!brand.value?.id) {
    return null
  }

  // If we already have a saved post, return it instead of creating a duplicate
  if (lastSavedPost.value?.id) {
    debugLog('Post already saved, returning existing post:', lastSavedPost.value.id)
    return lastSavedPost.value
  }

  try {
    const favoriteData = {
      brand_id: activeBusinessId.value || brand.value.id || undefined,
      content_type: 'image' as 'image' | 'video', // Always save as image initially, video_url added by background task
      media_url: mediaUrl,
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
      brand_dna: activeBrandDna.value,
    }

    const response = await api.saveFavorite(favoriteData)
    if (response.success && response.data) {
      lastSavedPost.value = response.data.favorite
      return response.data.favorite
    }
    return null
  } catch (err) {
    errorLog('Failed to auto-save post:', err)
    return null
  }
}

// Retry generation
async function _handleRetryGeneration() {
  if (lastEasyModeData.value) {
    await handleEasyModeGenerate(lastEasyModeData.value)
  }
}

// Publishing progress modal handlers
function handlePublishingModalCreateAnother() {
  showPublishingModal.value = false
  publishingProgress.value = []
  publishingComplete.value = false
  handleEasyModeReset()
  // Also reset advanced mode data
  advancedModeData.value = null
}

function handlePublishingModalClose() {
  showPublishingModal.value = false
  publishingProgress.value = []
  publishingComplete.value = false
  // Navigate back to posts
  router.push('/posts')
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
  accountSelections?: {
    facebook?: AccountSelection[]
    instagram?: AccountSelection[]
    tiktok?: string[]
    twitter?: string[]
  }
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

    // Update saved post with the actual platforms and content user selected/edited
    if (platforms.length > 0 && lastSavedPost.value?.id) {
      await api.updateFavorite(lastSavedPost.value.id, {
        platform: platforms[0],
        platforms: platforms,
        post_text: data.postText,
        hashtags: data.hashtags
      })
    }

    // If platforms and publish options provided, handle publishing directly
    if (platforms.length > 0 && data.onResult) {
      if (data.publishNow) {
        // Determine content type (video or image) first
        const isVideo = data.imageUrl?.includes('.mp4') || currentMediaType.value === 'video'
        const contentType = isVideo ? 'video' : 'image'

        // Initialize publishing progress
        publishingProgress.value = platforms.map(platform => {
          // Default post type based on media type: reels for videos, feed for images
          const postType = isVideo ? 'reel' : 'feed'
          return {
            platform,
            status: 'pending' as const,
            url: undefined,
            error: undefined,
            postType
          }
        })
        publishingComplete.value = false

        // Show publishing modal immediately
        showPublishingModal.value = true

        const results: Array<{ platform: string; success: boolean; url?: string; error?: string }> = []
        const postUrls: Record<string, string> = {}

        // Build the message with post text and hashtags
        const hashtags = data.hashtags || []
        const message = hashtags.length > 0
          ? `${data.postText}\n\n${hashtags.map(h => `#${h}`).join(' ')}`
          : data.postText

        // Publish to each platform
        for (const platform of platforms) {
          // Update status to "publishing"
          const progressItem = publishingProgress.value.find(p => p.platform === platform)
          if (progressItem) {
            progressItem.status = 'publishing'
          }

          if (platform === 'facebook') {
            // Post to all connected Facebook pages
            const connectedPages = facebookStore.connectedPages
            if (connectedPages.length === 0) {
              results.push({ platform: 'facebook', success: false, error: 'No Facebook page connected' })
              if (progressItem) {
                progressItem.status = 'error'
                progressItem.error = 'No Facebook page connected'
              }
              continue
            }

            // Post to each connected page
            for (const page of connectedPages) {
              // Get post type and carousel items from account selections if available
              const accountSelections = data.accountSelections
              const facebookSelections = accountSelections?.facebook || []
              const accountSelection = facebookSelections.find((sel: AccountSelection) =>
                sel.accountId === page.pageId
              )
              const postType = accountSelection?.postType || 'feed'
              const carouselItems = accountSelection?.carouselItems

              // Update progress item with actual post type
              if (progressItem) {
                progressItem.postType = postType
              }

              // Use carousel-specific content if available
              const carouselCaption = accountSelection?.carouselCaption
              const carouselHashtags = accountSelection?.carouselHashtags
              let finalMessage: string
              if (carouselCaption && postType === 'carousel') {
                finalMessage = carouselHashtags && carouselHashtags.length > 0
                  ? `${carouselCaption}\n\n${carouselHashtags.join(' ')}`
                  : carouselCaption
              } else {
                finalMessage = message
              }

              // For carousel posts, don't send imageUrl/videoUrl
              const isCarousel = postType === 'carousel'
              const imageUrl = isCarousel ? undefined : (isVideo ? undefined : data.imageUrl)
              const videoUrl = isCarousel ? undefined : (isVideo ? data.imageUrl : undefined)

              try {
                const response = await api.postToFacebook(
                  page.pageId,
                  finalMessage,
                  imageUrl,
                  videoUrl,
                  contentType,
                  postType,
                  carouselItems
                )

                const postUrl = (response as any).postUrl || response.data?.postUrl
                if (response.success && postUrl) {
                  results.push({ platform: 'facebook', success: true, url: postUrl })
                  postUrls.facebook = postUrl
                  notificationStore.addPublishSuccess('facebook', postUrl)
                  // Update progress
                  if (progressItem) {
                    progressItem.status = 'success'
                    progressItem.url = postUrl
                  }
                } else if ((response as any).code === 'FACEBOOK_RECONNECT_REQUIRED') {
                  const errorMsg = 'Facebook connection expired'
                  results.push({ platform: 'facebook', success: false, error: errorMsg })
                  if (progressItem) {
                    progressItem.status = 'error'
                    progressItem.error = errorMsg
                  }
                } else {
                  const errorMsg = response.error || 'Failed to publish'
                  results.push({ platform: 'facebook', success: false, error: errorMsg })
                  if (progressItem) {
                    progressItem.status = 'error'
                    progressItem.error = errorMsg
                  }
                }
              } catch (err: any) {
                const errorMsg = err.message || 'Failed to publish'
                results.push({ platform: 'facebook', success: false, error: errorMsg })
                if (progressItem) {
                  progressItem.status = 'error'
                  progressItem.error = errorMsg
                }
              }
            }
          } else if (platform === 'instagram') {
            // Post to all connected Instagram accounts
            const connectedAccounts = instagramStore.connectedAccounts
            if (connectedAccounts.length === 0) {
              const errorMsg = 'No Instagram account connected'
              results.push({ platform: 'instagram', success: false, error: errorMsg })
              if (progressItem) {
                progressItem.status = 'error'
                progressItem.error = errorMsg
              }
              continue
            }

            // Post to each connected account
            for (const account of connectedAccounts) {
              // Get post type and carousel items from account selections if available
              const accountSelections = data.accountSelections
              const instagramSelections = accountSelections?.instagram || []
              const accountSelection = instagramSelections.find((sel: AccountSelection) =>
                sel.accountId === account.instagramAccountId
              )
              const postType = accountSelection?.postType || (contentType === 'video' ? 'reel' : 'feed')
              const carouselItems = accountSelection?.carouselItems

              // Update progress item with actual post type
              if (progressItem) {
                progressItem.postType = postType
              }

              // Use carousel-specific content if available
              const carouselCaption = accountSelection?.carouselCaption
              const carouselHashtags = accountSelection?.carouselHashtags
              let finalMessage: string
              if (carouselCaption && postType === 'carousel') {
                finalMessage = carouselHashtags && carouselHashtags.length > 0
                  ? `${carouselCaption}\n\n${carouselHashtags.join(' ')}`
                  : carouselCaption
              } else {
                finalMessage = message
              }

              // For carousel posts, don't send imageUrl
              const isCarousel = postType === 'carousel'
              const imageUrl = isCarousel ? undefined : data.imageUrl

              try {
                const response = await api.postToInstagram(
                  account.instagramAccountId,
                  finalMessage,
                  imageUrl,
                  undefined,
                  contentType,
                  postType,
                  carouselItems
                )

                const postUrl = (response as any).postUrl || response.data?.postUrl
                if (response.success && postUrl) {
                  results.push({ platform: 'instagram', success: true, url: postUrl })
                  postUrls.instagram = postUrl
                  notificationStore.addPublishSuccess('instagram', postUrl)
                  // Update progress
                  if (progressItem) {
                    progressItem.status = 'success'
                    progressItem.url = postUrl
                  }
                } else {
                  const errorMsg = response.error || 'Failed to publish'
                  results.push({ platform: 'instagram', success: false, error: errorMsg })
                  if (progressItem) {
                    progressItem.status = 'error'
                    progressItem.error = errorMsg
                  }
                }
              } catch (err: any) {
                const errorMsg = err.message || 'Failed to publish'
                results.push({ platform: 'instagram', success: false, error: errorMsg })
                if (progressItem) {
                  progressItem.status = 'error'
                  progressItem.error = errorMsg
                }
              }
            }
          } else if (platform === 'twitter') {
            // Post to all connected Twitter accounts
            const connectedAccounts = twitterStore.connectedAccounts
            if (connectedAccounts.length === 0) {
              const errorMsg = 'No Twitter account connected'
              results.push({ platform: 'twitter', success: false, error: errorMsg })
              if (progressItem) {
                progressItem.status = 'error'
                progressItem.error = errorMsg
              }
              continue
            }

            // Validate character limit (280 chars for standard accounts)
            if (message.length > 280) {
              const errorMsg = 'Tweet text exceeds 280 character limit'
              results.push({ platform: 'twitter', success: false, error: errorMsg })
              if (progressItem) {
                progressItem.status = 'error'
                progressItem.error = errorMsg
              }
              continue
            }

            // Post to each connected account
            for (const account of connectedAccounts) {
              try {
                // Prepare media URLs for Twitter
                const mediaUrls: string[] = []
                if (data.imageUrl) {
                  mediaUrls.push(data.imageUrl)
                }

                const response = await api.postToTwitter(
                  account.twitterAccountId,
                  message,
                  mediaUrls
                )

                const tweetUrl = (response as any).tweetUrl || response.data?.tweetUrl
                if (response.success && tweetUrl) {
                  results.push({ platform: 'twitter', success: true, url: tweetUrl })
                  postUrls.twitter = tweetUrl
                  notificationStore.addPublishSuccess('twitter', tweetUrl)
                  // Update progress
                  if (progressItem) {
                    progressItem.status = 'success'
                    progressItem.url = tweetUrl
                  }
                } else {
                  const errorMsg = response.error || 'Failed to publish'
                  results.push({ platform: 'twitter', success: false, error: errorMsg })
                  if (progressItem) {
                    progressItem.status = 'error'
                    progressItem.error = errorMsg
                  }
                }
              } catch (err: any) {
                const errorMsg = err.message || 'Failed to publish'
                results.push({ platform: 'twitter', success: false, error: errorMsg })
                if (progressItem) {
                  progressItem.status = 'error'
                  progressItem.error = errorMsg
                }
              }
            }
          } else {
            const errorMsg = `${platform} publishing not yet supported`
            results.push({ platform, success: false, error: errorMsg })
            if (progressItem) {
              progressItem.status = 'error'
              progressItem.error = errorMsg
            }
          }
        }

        publishingComplete.value = true

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
              post_id: lastSavedPost.value.id,
              platforms: successfulPlatforms.map(r => r.platform),
              brand_id: activeBusinessId.value || brand.value?.id,
              platform_urls: postUrls
            })
          } catch (calendarErr) {
            warnLog('Failed to save to calendar:', calendarErr)
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
        const scheduleResponse = await api.schedulePost({
          post_id: lastSavedPost.value.id,
          scheduled_time: new Date(data.scheduledTime).toISOString(),
          platforms: platforms,
          timezone: data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
          brand_id: activeBusinessId.value || brand.value?.id,
        })

        if (scheduleResponse.success && data.onResult) {
          data.onResult({ success: true })
        } else if (data.onResult) {
          data.onResult({ success: false, error: 'Failed to schedule post' })
        }
      }
    }
  } catch (err: any) {
    errorLog('Failed to handle advanced mode:', err)
    generationError.value = err.message || 'Failed to process advanced mode'
  }
}

async function autoSaveAdvancedPost() {
  if (!advancedModeData.value || !brand.value) return

  // Don't auto-save if no brand selected
  if (!brand.value?.id) {
    return
  }

  try {
    const favoriteData = {
      brand_id: activeBusinessId.value || brand.value.id || undefined,
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
      brand_dna: activeBrandDna.value,
    }

    const response = await api.saveFavorite(favoriteData)
    if (response.success && response.data) {
      lastSavedPost.value = response.data.favorite
    }
  } catch (err) {
    errorLog('Failed to auto-save advanced post:', err)
  }
}

// Handle inline feedback from child components (fire-and-forget)
async function handleInlineFeedback(feedbackText: string) {
  debugLog('[DEBUG] Received inline feedback:', feedbackText)

  // Submit feedback to backend (non-blocking)
  try {
    await fetch(`${API_URL}/api/feedback`, {
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
    debugLog('[DEBUG] Inline feedback submitted successfully')
  } catch (error) {
    errorLog('Failed to submit inline feedback:', error)
    // Don't block the flow if feedback fails
  }
}

function openScheduleModal() {
  if (lastSavedPost.value) {
    postToSchedule.value = lastSavedPost.value
    showScheduleModal.value = true
  }
}

function handleScheduled(_scheduledPost: any) {
  showScheduleModal.value = false
}

function _handleContentUpdated(updatedContent: { postText: string; hashtags: string[] }) {
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
      errorLog('Failed to update post:', err)
    })
  }
}

// Publishing progress modal handlers
function handlePublishingCreateAnother() {
  showPublishingModal.value = false
  // Reset to step 1
  if (easyModeCreationRef.value) {
    easyModeCreationRef.value.currentStep = 1
  }
  if (advancedModeCreationRef.value) {
    advancedModeCreationRef.value.currentStep = 1
  }
}

function handlePublishingClose() {
  showPublishingModal.value = false
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
        <BaseButton variant="secondary" size="small" @click="loadBrand">
          {{ t('common.retry', 'Retry') }}
        </BaseButton>
      </BaseAlert>

      <!-- No Restaurants State -->
      <div v-else-if="noBrands" class="no-brand-state">
        <BaseCard variant="glass-intense" class="no-brand-card">
          <div class="no-brand-icon">
            <GoldenBrandIcon :size="64" />
          </div>
          <h2 class="no-brand-title">{{ t('contentHub.noRestaurantPrompt') }}</h2>
          <p class="no-brand-description">{{ t('contentHub.addFirstRestaurantDescription') }}</p>
          <BaseButton variant="primary" size="large" @click="showAddBrandModal = true">
            {{ t('contentHub.addFirstRestaurant') }}
          </BaseButton>
        </BaseCard>
      </div>

      <!-- Main Content -->
      <div v-else-if="brand" class="create-content">
        <!-- Header with back button and mode toggle -->
        <div class="page-header">
          <BaseButton variant="ghost" @click="goBack" class="back-button">
            ← {{ t('common.back', 'Back') }}
          </BaseButton>
          <ModeToggle class="mode-toggle" />
        </div>

        <!-- Brand Header (clickable to switch) -->
        <BaseCard
          variant="glass-intense"
          class="brand-header"
          :class="{ clickable: allBrands.length > 1 }"
          @click="allBrands.length > 1 && (showBrandSelector = true)"
        >
          <div class="brand-info">
            <div v-if="brand.brand_dna?.logo_url" class="brand-logo">
              <img :src="brand.brand_dna.logo_url" :alt="brand.name" />
            </div>
            <div v-else class="brand-logo placeholder">
              <span class="placeholder-icon">🍽️</span>
            </div>
            <div class="brand-details">
              <h2 class="brand-name">{{ brand.name }}</h2>
              <p class="brand-address">{{ brand.address }}</p>
            </div>
            <div v-if="allBrands.length > 1" class="switch-indicator">
              <span class="switch-text">{{ t('contentCreate.switchRestaurant', 'Switch') }}</span>
            </div>
          </div>
        </BaseCard>

        <!-- Easy Mode Creation -->
        <EasyModeCreation
          v-if="preferencesStore.creationMode === 'easy'"
          ref="easyModeCreationRef"
          :brand="brand || selectedBrand || undefined"
          :brand-type="activeBrandType"
          :menu-items="menuItems"
          :generating="easyModeGenerating"
          :animating="generatingVideo"
          :video-generating-in-background="videoGeneratingInBackground"
          :generated-image-url="generatedImageUrl"
          :generated-video-url="generatedVideoUrl"
          :post-text="generatedPostContent?.postText"
          :hashtags="generatedPostContent?.hashtags"
          :publishing="publishing"
          :publish-results="publishResults"
          :error="generationError"
          :initial-schedule-date="route.query.scheduleDate as string | undefined"
          @back="goBack"
          @generate="handleEasyModeGenerate"
          @animate="handleEasyModeAnimate"
          @publish="handleEasyModePublish"
          @feedback="handleInlineFeedback"
          @reset="handleEasyModeReset"
        />

        <!-- Advanced Mode Creation -->
        <AdvancedModeCreation
          v-else
          ref="advancedModeCreationRef"
          :brand="brand || selectedBrand || undefined"
          :menu-items="menuItems"
          @back="goBack"
          @feedback="handleInlineFeedback"
          @complete="handleAdvancedModeComplete"
        />
      </div>
    </div>

    <!-- Schedule Modal -->
    <ScheduleModal
      v-model="showScheduleModal"
      :favorite-post="postToSchedule"
      :preselected-date="preselectedDate"
      @scheduled="handleScheduled"
    />

    <!-- Publishing Progress Modal -->
    <PublishingProgressModal
      :visible="showPublishingModal"
      :platforms="publishingProgress"
      :is-complete="publishingComplete"
      @create-another="handlePublishingModalCreateAnother"
      @close="handlePublishingModalClose"
    />

    <!-- Add Brand Modal (for no-brand state) -->
    <AddBrandModal
      v-model="showAddBrandModal"
      :brand-id="selectedBrand?.id"
      :saved-brands="allBrands"
      @brand-added="handleBrandAddedFromPrompt"
      @switch-to-manual="handleSwitchToManual"
    />

    <!-- Create Brand Modal -->
    <CreateBrandModal
      v-model="showCreateBrandModal"
      :brand-id="selectedBrand?.id"
      @created="handleBrandCreated"
    />

    <!-- Brand Selector Modal -->
    <BrandSelectorModal
      v-model="showBrandSelector"
      :brands="allBrands"
      :current-id="brand?.id"
      :brand-id="selectedBrand?.id"
      @select="handleBrandSelect"
      @brand-added="handleBrandAddedFromSelector"
      @delete="handleBrandDelete"
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

/* No Restaurant State */
.no-brand-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  animation: fadeInUp 0.6s var(--ease-smooth);
}

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

.no-brand-card {
  max-width: 450px;
  padding: var(--space-3xl);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: var(--space-lg);
}

.no-brand-icon {
  display: flex;
  justify-content: center;
  margin-bottom: var(--space-sm);
}

.no-brand-title {
  font-family: var(--font-heading);
  font-size: var(--text-xl);
  color: var(--text-primary);
  margin: 0;
}

.no-brand-description {
  font-size: var(--text-base);
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.5;
}

.no-brand-actions {
  display: flex;
  gap: var(--space-md);
  flex-wrap: wrap;
  justify-content: center;
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
.brand-header {
  margin-bottom: var(--space-xl);
  animation: fadeInUp 0.5s var(--ease-smooth);
}

.brand-header.clickable {
  cursor: pointer;
  transition: all var(--transition-base);
}

.brand-header.clickable:hover {
  border-color: rgba(212, 175, 55, 0.4);
  transform: translateY(-2px);
}

.brand-info {
  display: flex;
  align-items: center;
  gap: var(--space-lg);
}

.switch-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-sm) var(--space-md);
  background: rgba(212, 175, 55, 0.1);
  border-radius: var(--radius-md);
  margin-left: auto;
  transition: all var(--transition-base);
}

.brand-header.clickable:hover .switch-indicator {
  background: rgba(212, 175, 55, 0.2);
}

.switch-text {
  font-size: var(--text-xs);
  color: var(--gold-primary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.brand-logo {
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

.brand-logo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.brand-logo.placeholder {
  background: rgba(212, 175, 55, 0.1);
}

.placeholder-icon {
  font-size: var(--text-2xl);
}

.brand-details {
  flex: 1;
}

.brand-name {
  font-family: var(--font-heading);
  font-size: var(--text-xl);
  color: var(--text-primary);
  margin: 0 0 var(--space-xs) 0;
}

.brand-address {
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

  .brand-info {
    flex-direction: column;
    text-align: center;
  }

  .brand-logo {
    width: 80px;
    height: 80px;
  }

  .switch-indicator {
    margin-left: 0;
    margin-top: var(--space-sm);
    flex-direction: row;
    gap: var(--space-sm);
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

  .brand-logo {
    width: 64px;
    height: 64px;
  }

  .brand-name {
    font-size: var(--text-xl);
  }

  .brand-address {
    font-size: var(--text-xs);
  }
}

@media (max-width: 390px) {
  .content-create-view {
    padding: var(--space-sm);
  }

  .brand-logo {
    width: 56px;
    height: 56px;
  }

  .brand-name {
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
