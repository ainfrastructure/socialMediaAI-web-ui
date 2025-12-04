<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useFacebookStore } from '../stores/facebook'
import { usePreferencesStore } from '../stores/preferences'
import { api } from '../services/api'
import { restaurantService } from '../services/restaurantService'
import { placesService } from '../services/placesService'
import { okamService } from '../services/okamService'
import BaseButton from './BaseButton.vue'
import BaseCard from './BaseCard.vue'
import BaseAlert from './BaseAlert.vue'
import RestaurantAutocomplete from './RestaurantAutocomplete.vue'
import EasyModeCreation from './EasyModeCreation.vue'
import GenerationResultModal from './GenerationResultModal.vue'
import FacebookOnboardingModal from './FacebookOnboardingModal.vue'

const router = useRouter()
const facebookStore = useFacebookStore()
const preferencesStore = usePreferencesStore()
const { t } = useI18n()

const emit = defineEmits<{
  (e: 'complete'): void
}>()

// Step management
const currentStep = ref(1)
const totalSteps = 5 // Updated: Add Restaurant, Create Post, Review, Connect, Schedule

// Step 1: Restaurant selection and addition
const selectedRestaurant = ref<any>(null)
const savingRestaurant = ref(false)
const restaurantSaved = ref(false)
const restaurantError = ref('')
const placeDetails = ref<any>(null)
const loadingDetails = ref(false)

// Store fetched data before saving
const fetchedDetails = ref<any>(null)
const fetchedMenuData = ref<any>(null)
const fetchedBrandDNA = ref<any>(null)
const detailsFetched = ref(false)

// Step 2: Post generation
const generatingPost = ref(false)
const generatedPost = ref<{
  imageUrl: string
  postText: string
  hashtags: string[]
} | null>(null)
const savedPostId = ref<string | null>(null)

// Step 4: Social media connection
const showFacebookOnboarding = ref(false)
const showInstagramOnboarding = ref(false)
const publishing = ref(false)

// Step 5: Publish options
const showCompletion = ref(false)
const publishMode = ref<'now' | 'schedule'>('now')
const selectedPages = ref<string[]>([])
const scheduleDate = ref('')
const scheduleTime = ref('12:00')
const schedulePlatform = ref('facebook')
const publishError = ref('')
const publishSuccess = ref('')

// Computed: minimum date for scheduling (today)
const minScheduleDate = computed(() => {
  const today = new Date()
  return today.toISOString().split('T')[0]
})

// Initialize schedule date to tomorrow
const initScheduleDate = () => {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  scheduleDate.value = tomorrow.toISOString().split('T')[0]
}
initScheduleDate()

const progress = computed(() => (currentStep.value / totalSteps) * 100)

const canProceedStep1 = computed(() => detailsFetched.value && !!selectedRestaurant.value)
const canProceedStep2 = computed(() => !!generatedPost.value)

// Step 1: Restaurant Selection and Addition
async function handleRestaurantSelect(restaurant: any) {
  selectedRestaurant.value = restaurant
  restaurantError.value = ''
  restaurantSaved.value = false

  // Only fetch details, don't save yet (wait for user to click Continue)
  await fetchRestaurantDetails(restaurant)
}

async function fetchRestaurantDetails(restaurant: any) {
  try {
    savingRestaurant.value = true
    loadingDetails.value = true
    restaurantError.value = ''

    console.log('Fetching restaurant details:', restaurant)

    // Fetch full place details from Google Places
    const details = await placesService.getPlaceDetails(restaurant.place_id)

    console.log('Fetched place details:', details)

    if (!details) {
      throw new Error('Failed to fetch restaurant details')
    }

    placeDetails.value = details

    // Fetch menu data from OKAM
    let menuData = null
    let menuSource = 'none'
    let brandDNA = null

    try {
      console.log('[ONBOARDING] Fetching Okam menu for place_id:', restaurant.place_id)
      const okamMenu = await okamService.getMenuByPlaceId(restaurant.place_id)

      if (okamMenu && okamMenu.categories?.length > 0) {
        // Convert Okam format to standard format
        menuData = {
          restaurantName: okamMenu.storeName,
          platform: 'okam' as const,
          url: '',
          items: okamService.convertToMenuItems(okamMenu)
        }
        menuSource = 'okam'
        console.log(`check_circle [ONBOARDING] Loaded ${menuData.items.length} items from Okam`)

        // If Okam has a logo, use it
        if (okamMenu.logoUrl) {
          console.log(`check_circle [ONBOARDING] Using Okam logo: ${okamMenu.logoUrl}`)
          brandDNA = {
            logo_url: okamMenu.logoUrl,
            brand_name: okamMenu.storeName,
            primary_color: null,
            secondary_color: null,
            font_style: null
          }
        }
      } else {
        console.log('[ONBOARDING] No Okam menu found for this restaurant')
      }
    } catch (error) {
      console.log('[ONBOARDING] Menu data not available:', error)
    }

    // Store the fetched data (don't save to database yet)
    fetchedDetails.value = {
      restaurant,
      details,
      menuSource
    }
    fetchedMenuData.value = menuData
    fetchedBrandDNA.value = brandDNA
    detailsFetched.value = true

    // Set up the selectedRestaurant preview (but not saved yet)
    selectedRestaurant.value = {
      id: '', // Will be set when saved
      place_id: restaurant.place_id,
      name: details.name,
      address: details.formatted_address || details.vicinity || restaurant.address || '',
      city: details.address_components?.find((c: any) => c.types.includes('locality'))?.long_name || '',
      country: details.address_components?.find((c: any) => c.types.includes('country'))?.long_name || '',
      brand_dna: brandDNA,
      menu_items: menuData?.items || [],
      menu_source: menuSource,
      google_data: details
    }

    console.log('check_circle Restaurant details fetched and ready to save')
  } catch (error: any) {
    console.error('Failed to fetch restaurant details:', error)
    restaurantError.value = error.message || 'Failed to fetch restaurant details. Please try again.'
    detailsFetched.value = false
  } finally {
    savingRestaurant.value = false
    loadingDetails.value = false
  }
}

async function saveRestaurantToDatabase() {
  if (!fetchedDetails.value) {
    throw new Error('No restaurant details to save')
  }

  try {
    savingRestaurant.value = true

    const { restaurant, details } = fetchedDetails.value
    const menuData = fetchedMenuData.value
    const brandDNA = fetchedBrandDNA.value

    // Save restaurant to database
    const restaurantData = {
      place_id: restaurant.place_id || details.place_id,
      name: details.name || restaurant.name,
      address: details.formatted_address || details.vicinity || restaurant.address || '',
      city: details.address_components?.find((c: any) => c.types.includes('locality'))?.long_name || '',
      country: details.address_components?.find((c: any) => c.types.includes('country'))?.long_name || '',
      google_data: details,
      menu: menuData || null,
      brand_dna: brandDNA || null,
      photos: details.photos ? {
        photos: details.photos,
        photoUrls: details.photoUrls
      } : null,
    }

    console.log('Saving restaurant to database:', {
      place_id: restaurantData.place_id,
      name: restaurantData.name,
      address: restaurantData.address
    })

    if (!restaurantData.place_id || !restaurantData.name || !restaurantData.address) {
      throw new Error(`Missing required fields: place_id=${!!restaurantData.place_id}, name=${!!restaurantData.name}, address=${!!restaurantData.address}`)
    }

    const result = await restaurantService.saveRestaurant(restaurantData)

    if (result.success) {
      restaurantSaved.value = true
      selectedRestaurant.value.id = result.data?.id || ''
      console.log('check_circle Restaurant saved successfully')
    } else {
      if (result.error && result.error.includes('already saved')) {
        // Restaurant already exists, that's fine!
        restaurantSaved.value = true
        selectedRestaurant.value.id = result.data?.id || ''
        console.log('check_circle Restaurant already exists')
      } else {
        throw new Error(result.error || 'Failed to save restaurant')
      }
    }
  } finally {
    savingRestaurant.value = false
  }
}

async function nextStep() {
  // If moving from step 1, save the restaurant first
  if (currentStep.value === 1 && detailsFetched.value && !restaurantSaved.value) {
    try {
      await saveRestaurantToDatabase()
    } catch (error: any) {
      console.error('Failed to save restaurant:', error)
      restaurantError.value = error.message || 'Failed to save restaurant. Please try again.'
      return // Don't proceed if save failed
    }
  }

  if (currentStep.value < totalSteps) {
    currentStep.value++
  } else {
    // Show completion screen
    showCompletion.value = true
  }
}

function prevStep() {
  if (currentStep.value > 1) {
    currentStep.value--
  }
}

// Handle post generation from EasyModeCreation
async function handlePostGenerated(data: {
  menuItem: any | null
  context: string
  styleTemplate: string
  includeLogo: boolean
  uploadedImage: File | null
}) {
  try {
    console.log('[ONBOARDING] Starting post generation with data:', data)
    generatingPost.value = true

    // Reset generated post
    generatedPost.value = null

    // Don't show modal in onboarding - we show inline
    console.log('[ONBOARDING] Starting generation...')

    // Generate prompts and content
    const menuItemName = data.menuItem?.name || 'Delicious food'
    const restaurantName = selectedRestaurant.value?.name || 'Restaurant'
    const brandDNA = selectedRestaurant.value?.brand_dna

    console.log('[ONBOARDING] Menu item:', menuItemName)
    console.log('[ONBOARDING] Restaurant:', restaurantName)
    console.log('[ONBOARDING] Brand DNA:', brandDNA)

    // Build prompt based on style template and context
    const styleDescriptions = {
      vibrant: 'vibrant, colorful, energetic design with bold colors',
      elegant: 'elegant, sophisticated, refined aesthetic with subtle touches',
      minimal: 'minimal, clean, modern simplicity focused on the food',
      rustic: 'rustic, warm, homestyle appeal with natural elements',
      luxury: 'luxury, premium, high-end presentation with upscale feel'
    }

    const styleDesc = styleDescriptions[data.styleTemplate as keyof typeof styleDescriptions] || styleDescriptions.vibrant

    const imagePrompt = `A professional, appetizing photo of ${menuItemName} from ${restaurantName}. ${styleDesc}. High quality food photography, Instagram-worthy presentation.${data.context ? ` Special promotion: ${data.context}` : ''}`

    console.log('[ONBOARDING] Image prompt:', imagePrompt)
    console.log('[ONBOARDING] Include logo:', data.includeLogo)
    console.log('[ONBOARDING] Logo URL:', brandDNA?.logo_url)

    // Start generating image and post content in parallel
    console.log('[ONBOARDING] Starting API calls in parallel...')

    // Note: uploadedImage is currently not supported by Gemini image generation API
    // It's ignored for now - we only use the text prompt
    if (data.uploadedImage) {
      console.log('[ONBOARDING] Uploaded image detected but not supported yet - using text prompt only')
    }

    const imagePromise = api.generateImage(
      imagePrompt,
      data.includeLogo && brandDNA?.logo_url ? {
        logoPath: brandDNA.logo_url,
        position: 'bottom-right',
        opacity: 0.9,
        scale: 0.15,
        padding: 20
      } : undefined,
      undefined, // referenceImage not supported by Gemini
      data.context ? {
        text: data.context.toUpperCase(),
        position: 'top-right',
        style: 'badge',
        color: brandDNA?.primary_color || '#D4AF37',
        textColor: '#FFFFFF',
        size: 'large',
        rotation: -5
      } : undefined,
      selectedRestaurant.value?.place_id
    )

    const postContentPromise = api.generatePostContent(
      'facebook',
      restaurantName,
      [menuItemName],
      'image',
      data.context,
      brandDNA,
      'en'
    )

    // Wait for both to complete
    console.log('[ONBOARDING] Waiting for API responses...')
    const [imageResponse, postContentResponse] = await Promise.all([imagePromise, postContentPromise])

    console.log('[ONBOARDING] Image response:', imageResponse)
    console.log('[ONBOARDING] Post content response:', postContentResponse)

    if (!imageResponse.success) {
      console.error('[ONBOARDING] Image generation failed:', imageResponse.error)
      throw new Error(imageResponse.error || 'Failed to generate image')
    }

    if (!postContentResponse.success) {
      console.error('[ONBOARDING] Post content generation failed:', postContentResponse.error)
      throw new Error(postContentResponse.error || 'Failed to generate post content')
    }

    // Set generated post data
    generatedPost.value = {
      imageUrl: (imageResponse as any).imageUrl || imageResponse.data?.imageUrl || '',
      postText: postContentResponse.data?.postText || '',
      hashtags: postContentResponse.data?.hashtags || [],
    }

    console.log('[ONBOARDING] Generation complete! Generated post:', generatedPost.value)
    console.log('[ONBOARDING] Image URL set to:', generatedPost.value.imageUrl)

    // Auto-save the generated post
    await autoSavePost()

    // Auto-advance to review step
    currentStep.value = 3
  } catch (error: any) {
    console.error('[ONBOARDING] Failed to generate post:', error)
    console.error('[ONBOARDING] Error stack:', error.stack)
    restaurantError.value = error.message || 'Failed to generate post. Please try again.'
  } finally {
    console.log('[ONBOARDING] Setting generatingPost to false')
    generatingPost.value = false
  }
}

// Convert File to base64 for API
async function convertFileToBase64(file: File): Promise<{ base64Data: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1]
      resolve({
        base64Data: base64,
        mimeType: file.type
      })
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}


// Step 5: Publishing
async function handlePublishOrSchedule() {
  publishError.value = ''
  publishSuccess.value = ''

  if (!generatedPost.value) {
    publishError.value = 'No post to publish'
    return
  }

  // Check if user is connected
  if (!facebookStore.isConnected) {
    // Skip publishing and complete onboarding
    showCompletion.value = true
    return
  }

  if (publishMode.value === 'now') {
    await publishNow()
  } else {
    await schedulePost()
  }
}

async function publishNow() {
  if (!generatedPost.value) return

  // Validate page selection
  if (selectedPages.value.length === 0) {
    publishError.value = 'Please select at least one page to publish to'
    return
  }

  try {
    publishing.value = true
    publishError.value = ''

    const postText = generatedPost.value.postText +
      (generatedPost.value.hashtags?.length > 0 ? '\n\n' + generatedPost.value.hashtags.join(' ') : '')

    // Publish to each selected page
    const results = await Promise.allSettled(
      selectedPages.value.map(pageId =>
        api.postToFacebook(pageId, postText, generatedPost.value?.imageUrl)
      )
    )

    const successes = results.filter(r => r.status === 'fulfilled' && (r.value as any).success)
    const failures = results.filter(r => r.status === 'rejected' || !(r as any).value?.success)

    if (successes.length > 0) {
      publishSuccess.value = `Successfully published to ${successes.length} page(s)!`

      // Show completion modal after a short delay
      setTimeout(() => {
        showCompletion.value = true
      }, 1500)
    }

    if (failures.length > 0) {
      publishError.value = `Failed to publish to ${failures.length} page(s)`
    }
  } catch (error: any) {
    console.error('Failed to publish:', error)
    publishError.value = error.message || 'Failed to publish post'
  } finally {
    publishing.value = false
  }
}

async function schedulePost() {
  // Validate date/time
  if (!scheduleDate.value) {
    publishError.value = 'Please select a date'
    return
  }

  try {
    publishing.value = true
    publishError.value = ''

    // Post should already be auto-saved after generation
    if (!savedPostId.value) {
      // Try to auto-save if not already saved
      await autoSavePost()
    }

    if (!savedPostId.value) {
      publishError.value = 'Failed to save post. Please try again.'
      return
    }

    // Create a scheduled post
    const response = await api.schedulePost({
      favorite_post_id: savedPostId.value,
      scheduled_date: scheduleDate.value,
      scheduled_time: scheduleTime.value,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      platforms: [schedulePlatform.value],
    })

    if (response.success) {
      publishSuccess.value = `Post scheduled for ${scheduleDate.value} at ${scheduleTime.value}!`

      // Show completion modal after a short delay
      setTimeout(() => {
        showCompletion.value = true
      }, 1500)
    } else {
      throw new Error(response.error || 'Failed to schedule post')
    }
  } catch (error: any) {
    console.error('Failed to schedule:', error)
    publishError.value = error.message || 'Failed to schedule post'
  } finally {
    publishing.value = false
  }
}

// Auto-save post after generation (called automatically, no user interaction)
async function autoSavePost() {
  if (!generatedPost.value || !selectedRestaurant.value) {
    console.log('[ONBOARDING] Skipping auto-save - missing data')
    return
  }

  // Skip if already saved
  if (savedPostId.value) {
    console.log('[ONBOARDING] Skipping auto-save - already saved')
    return
  }

  try {
    console.log('[ONBOARDING] Auto-saving post...')

    const postData = {
      restaurant_id: selectedRestaurant.value.id,
      content_type: 'image' as const,
      media_url: generatedPost.value.imageUrl,
      post_text: generatedPost.value.postText,
      hashtags: generatedPost.value.hashtags,
    }

    const response = await api.saveFavorite(postData)

    if (response.success && response.data?.favorite?.id) {
      savedPostId.value = response.data.favorite.id
      console.log('[ONBOARDING] Auto-saved post successfully, ID:', savedPostId.value)
    } else {
      console.error('[ONBOARDING] Auto-save failed:', response.error)
    }
  } catch (error: any) {
    console.error('[ONBOARDING] Auto-save error:', error)
  }
}

function handleSchedule() {
  // For onboarding, we'll just complete it
  completeOnboarding()
}

function skipToPlayground() {
  completeOnboarding()
}

function handleCompletionClick() {
  // Close modal when clicking outside
  showCompletion.value = false
}

async function completeOnboarding() {
  try {
    await api.completeOnboarding()
    // Save selected restaurant to preferences
    if (selectedRestaurant.value?.id) {
      preferencesStore.setSelectedRestaurant(selectedRestaurant.value.id)
    }
    // Redirect to posts hub
    router.push('/posts')
  } catch (error) {
    console.error('Failed to complete onboarding:', error)
    // Save restaurant and redirect anyway to improve UX
    if (selectedRestaurant.value?.id) {
      preferencesStore.setSelectedRestaurant(selectedRestaurant.value.id)
    }
    router.push('/posts')
  }
}

function handleFacebookConnected() {
  showFacebookOnboarding.value = false
  // Pre-select the first connected page
  if (facebookStore.connectedPages.length > 0) {
    selectedPages.value = [facebookStore.connectedPages[0].pageId]
  }
}
</script>

<template>
  <div class="simple-onboarding">
    <!-- Progress Stepper -->
    <div class="stepper">
      <div
        v-for="step in totalSteps"
        :key="step"
        :class="['step', { active: currentStep >= step, current: currentStep === step }]"
      >
        <div class="step-number">{{ step }}</div>
        <div class="step-label">
          {{
            step === 1 ? $t('onboarding.simple.stepRestaurant') :
            step === 2 ? $t('onboarding.simple.stepCreate') :
            step === 3 ? $t('onboarding.simple.stepReview') :
            step === 4 ? $t('onboarding.simple.stepConnect') :
            $t('onboarding.simple.stepPublish')
          }}
        </div>
        <div v-if="step < totalSteps" class="step-connector"></div>
      </div>
    </div>

    <!-- Progress Bar -->
    <div class="progress-bar">
      <div class="progress-fill" :style="{ width: `${progress}%` }"></div>
    </div>

    <!-- Step Content -->
    <div class="step-content">
      <!-- Step 1: Restaurant Selection and Addition -->
      <div v-if="currentStep === 1" class="step-panel">
        <div class="step-header">
          <div class="step-icon">🏪</div>
          <h2 class="step-title">{{ $t('onboarding.simple.selectRestaurant') }}</h2>
          <p class="step-description">{{ $t('restaurantSearch.searchPlaceholder') }}</p>
        </div>

        <!-- Helpful Instructions -->
        <BaseAlert v-if="!selectedRestaurant" type="info" :dismissible="false" class="onboarding-tip">
          {{ $t('onboarding.simple.searchRestaurants') }}
        </BaseAlert>

        <BaseAlert v-if="restaurantError" type="error" :dismissible="false">
          {{ restaurantError }}
        </BaseAlert>

        <div class="restaurant-search">
          <RestaurantAutocomplete
            :placeholder="$t('restaurantSearch.searchPlaceholder')"
            @select="handleRestaurantSelect"
            :disabled="savingRestaurant"
          />
        </div>

        <!-- Loading State -->
        <div v-if="savingRestaurant && !detailsFetched" class="loading-state">
          <img src="/outline-logo-gold.svg" alt="Loading" class="loading-logo" />
          <p class="loading-text">{{ $t('common.loading') }}</p>
        </div>

        <!-- Success State - Show when details are fetched -->
        <div v-if="(detailsFetched || restaurantSaved) && selectedRestaurant" class="selected-restaurant">
          <div class="restaurant-card">
            <div class="restaurant-logo" v-if="selectedRestaurant.brand_dna?.logo_url">
              <img :src="selectedRestaurant.brand_dna.logo_url" :alt="selectedRestaurant.name" />
            </div>
            <div class="restaurant-info">
              <h3>{{ selectedRestaurant.name }}</h3>
              <p v-if="selectedRestaurant.address">{{ selectedRestaurant.address }}</p>
              <div v-if="selectedRestaurant.menu_items?.length > 0" class="menu-badge-container">
                <span v-if="selectedRestaurant.menu_source === 'okam'" class="menu-badge okam-badge">
                  check_circle Okam Menu - {{selectedRestaurant.menu_items.length}} items
                </span>
                <span v-else-if="selectedRestaurant.menu_source" class="menu-badge platform-badge">
                  {{ selectedRestaurant.menu_source }} - {{selectedRestaurant.menu_items.length}} items
                </span>
              </div>
            </div>
            <span class="check-icon">check_circle</span>
          </div>
        </div>
      </div>

      <!-- Step 2: Create Post with Easy Mode -->
      <div v-else-if="currentStep === 2" class="step-panel">
        <div class="step-header">
          <div class="step-icon">auto_awesome</div>
          <h2 class="step-title">{{ $t('onboarding.simple.generateFirstPost') }}</h2>
          <p class="step-description">{{ $t('onboarding.simple.selectMenuItem') }}</p>
        </div>

        <!-- Helpful Instructions -->
        <BaseAlert type="info" :dismissible="false" class="onboarding-tip">
          {{ $t('playground.generatePrompts') }}
        </BaseAlert>

        <!-- Generation Loading State -->
        <div v-if="generatingPost" class="generation-loading">
          <div class="loading-spinner-large"></div>
          <h3 class="loading-title">{{ $t('onboarding.simple.generatingPost') }}</h3>
          <p class="loading-description">{{ $t('alerts.info.generating') }}</p>
        </div>

        <!-- Easy Mode Creation Component -->
        <EasyModeCreation
          v-else-if="selectedRestaurant"
          :restaurant="selectedRestaurant"
          :menu-items="selectedRestaurant.menu_items || []"
          @generate="handlePostGenerated"
        />
      </div>

      <!-- Step 3: Review Generated Post -->
      <div v-else-if="currentStep === 3" class="step-panel">
        <div class="step-header">
          <div class="step-icon">👀</div>
          <h2 class="step-title">{{ $t('onboarding.simple.postGenerated') }}</h2>
          <p class="step-description">{{ $t('playground.preview') }}</p>
        </div>

        <!-- Helpful Instructions -->
        <BaseAlert type="info" :dismissible="false" class="onboarding-tip">
          {{ $t('scheduler.postDetails') }}
        </BaseAlert>

        <div v-if="generatedPost" class="post-preview">
          <!-- Image Preview -->
          <div v-if="generatedPost.imageUrl" class="preview-image">
            <img :src="generatedPost.imageUrl" alt="Post image" />
          </div>

          <!-- Content Preview -->
          <BaseCard variant="glass" class="content-preview">
            <div class="preview-section">
              <h4>{{ $t('posts.postText').toUpperCase() }}</h4>
              <p class="post-text">{{ generatedPost.postText }}</p>
            </div>

            <div v-if="generatedPost.hashtags && generatedPost.hashtags.length > 0" class="preview-section">
              <h4>{{ $t('posts.hashtags').toUpperCase() }}</h4>
              <div class="hashtags">
                <span v-for="(tag, idx) in generatedPost.hashtags" :key="idx" class="hashtag">
                  {{ tag }}
                </span>
              </div>
            </div>

          </BaseCard>
        </div>
      </div>

      <!-- Step 4: Connect Social Media -->
      <div v-else-if="currentStep === 4" class="step-panel">
        <div class="step-header">
          <div class="step-icon">link</div>
          <h2 class="step-title">{{ $t('onboarding.simple.connectFacebook') }}</h2>
          <p class="step-description">{{ $t('onboarding.simple.connectFacebookDescription') }}</p>
        </div>

        <!-- Helpful Instructions -->
        <BaseAlert type="info" :dismissible="false" class="onboarding-tip">
          {{ $t('connectAccounts.pageSubtitle') }}
        </BaseAlert>

        <div class="connect-accounts">
          <!-- Facebook Connection -->
          <BaseCard variant="glass" class="account-card">
            <div class="account-header">
              <div class="account-icon facebook">book</div>
              <div class="account-info">
                <h3 class="account-name">{{ $t('platforms.facebook') }}</h3>
                <p class="account-description">{{ $t('onboarding.simple.facebookDescription') }}</p>
              </div>
            </div>
            <BaseButton
              variant="primary"
              size="large"
              full-width
              @click="showFacebookOnboarding = true"
            >
              {{ facebookStore.isConnected ? $t('onboarding.simple.connectedStatus') : $t('connectAccounts.connectToFacebook') }}
            </BaseButton>
          </BaseCard>

          <!-- Instagram Connection -->
          <BaseCard variant="glass" class="account-card">
            <div class="account-header">
              <div class="account-icon instagram">photo_camera</div>
              <div class="account-info">
                <h3 class="account-name">{{ $t('platforms.instagram') }}</h3>
                <p class="account-description">{{ $t('onboarding.simple.instagramDescription') }}</p>
              </div>
            </div>
            <BaseButton
              variant="primary"
              size="large"
              full-width
              @click="showFacebookOnboarding = true"
            >
              {{ facebookStore.isConnected ? $t('onboarding.simple.connectedViaFacebook') : $t('onboarding.simple.connectInstagram') }}
            </BaseButton>
            <p class="account-note">{{ $t('onboarding.simple.instagramRequiresFacebook') }}</p>
          </BaseCard>
        </div>
      </div>

      <!-- Step 5: Publish Options -->
      <div v-else-if="currentStep === 5" class="step-panel">
        <div class="step-header">
          <div class="step-icon">rocket_launch</div>
          <h2 class="step-title">{{ $t('onboarding.simple.publishTitle') }}</h2>
          <p class="step-description">{{ $t('onboarding.simple.publishSubtitle') }}</p>
        </div>

        <!-- Connection Warning -->
        <BaseAlert v-if="!facebookStore.isConnected" type="warning" :dismissible="false" class="onboarding-tip">
          {{ $t('onboarding.simple.connectionWarning') }}
        </BaseAlert>

        <!-- Publish Options -->
        <div class="publish-choice-container">
          <!-- Option 1: Publish Now -->
          <BaseCard
            variant="glass"
            :class="['publish-option-card', { selected: publishMode === 'now' }]"
            hoverable
            @click="publishMode = 'now'"
          >
            <div class="option-header">
              <div class="option-icon">bolt</div>
              <div class="option-radio">
                <div :class="['radio-dot', { active: publishMode === 'now' }]"></div>
              </div>
            </div>
            <h3 class="option-title">{{ $t('onboarding.simple.publishNow') }}</h3>
            <p class="option-description">{{ $t('onboarding.simple.publishNowDescription') }}</p>

            <!-- Platform Selection for Publish Now -->
            <div v-if="publishMode === 'now' && facebookStore.isConnected" class="platform-selection">
              <h4 class="platform-label">{{ $t('onboarding.simple.selectPlatforms') }}</h4>
              <div class="platform-checkboxes">
                <label v-for="page in facebookStore.connectedPages" :key="page.pageId" class="platform-checkbox">
                  <input
                    type="checkbox"
                    :value="page.pageId"
                    v-model="selectedPages"
                  />
                  <span class="checkbox-custom"></span>
                  <span class="platform-name">{{ page.pageName }}</span>
                </label>
              </div>
            </div>
          </BaseCard>

          <!-- Option 2: Schedule -->
          <BaseCard
            variant="glass"
            :class="['publish-option-card', { selected: publishMode === 'schedule' }]"
            hoverable
            @click="publishMode = 'schedule'"
          >
            <div class="option-header">
              <div class="option-icon">calendar_month</div>
              <div class="option-radio">
                <div :class="['radio-dot', { active: publishMode === 'schedule' }]"></div>
              </div>
            </div>
            <h3 class="option-title">{{ $t('onboarding.simple.scheduleForLater') }}</h3>
            <p class="option-description">{{ $t('onboarding.simple.scheduleDescription') }}</p>

            <!-- Date/Time Selection for Schedule -->
            <div v-if="publishMode === 'schedule'" class="schedule-selection">
              <div class="datetime-inputs">
                <div class="input-group">
                  <label>{{ $t('common.date') }}</label>
                  <input
                    type="date"
                    v-model="scheduleDate"
                    :min="minScheduleDate"
                    class="datetime-input"
                  />
                </div>
                <div class="input-group">
                  <label>{{ $t('common.time') }}</label>
                  <input
                    type="time"
                    v-model="scheduleTime"
                    class="datetime-input"
                  />
                </div>
              </div>

              <!-- Platform Selection for Schedule -->
              <div v-if="facebookStore.isConnected" class="platform-selection">
                <h4 class="platform-label">{{ $t('onboarding.simple.selectPlatformSingle') }}</h4>
                <div class="platform-checkboxes">
                  <label class="platform-checkbox">
                    <input
                      type="radio"
                      value="facebook"
                      v-model="schedulePlatform"
                    />
                    <span class="checkbox-custom radio"></span>
                    <span class="platform-name">{{ $t('platforms.facebook') }}</span>
                  </label>
                  <label class="platform-checkbox">
                    <input
                      type="radio"
                      value="instagram"
                      v-model="schedulePlatform"
                    />
                    <span class="checkbox-custom radio"></span>
                    <span class="platform-name">{{ $t('platforms.instagram') }}</span>
                  </label>
                </div>
              </div>
            </div>
          </BaseCard>
        </div>

        <!-- Post Preview Summary -->
        <BaseCard v-if="generatedPost" variant="glass" class="post-summary">
          <h4 class="summary-title">{{ $t('onboarding.simple.postPreview') }}</h4>
          <div class="summary-content">
            <img v-if="generatedPost.imageUrl" :src="generatedPost.imageUrl" alt="Post" class="summary-image" />
            <p class="summary-text">{{ generatedPost.postText.substring(0, 100) }}{{ generatedPost.postText.length > 100 ? '...' : '' }}</p>
          </div>
        </BaseCard>

        <!-- Publishing Status -->
        <BaseAlert v-if="publishError" type="error" :dismissible="false">
          {{ publishError }}
        </BaseAlert>
        <BaseAlert v-if="publishSuccess" type="success" :dismissible="false">
          {{ publishSuccess }}
        </BaseAlert>
      </div>
    </div>

    <!-- Navigation -->
    <div class="navigation">
      <BaseButton
        v-if="currentStep > 1 && currentStep <= 5"
        variant="ghost"
        @click="prevStep"
        :disabled="savingRestaurant || generatingPost"
      >
        {{ $t('onboarding.simple.backButton') }}
      </BaseButton>
      <div v-else></div>

      <!-- Step 1: Continue to Create Post -->
      <BaseButton
        v-if="currentStep === 1"
        variant="primary"
        @click="nextStep"
        :disabled="!canProceedStep1 || savingRestaurant"
      >
        {{ $t('onboarding.simple.continueToCreate') }}
      </BaseButton>

      <!-- Step 2: No continue button - EasyModeCreation handles generation -->

      <!-- Step 3: Continue to Connect Accounts -->
      <BaseButton
        v-if="currentStep === 3"
        variant="primary"
        @click="nextStep"
        :disabled="!canProceedStep2"
      >
        {{ $t('onboarding.simple.connectAccountsButton') }}
      </BaseButton>

      <!-- Step 4: Continue to Schedule Info (can skip connecting) -->
      <BaseButton
        v-if="currentStep === 4"
        variant="primary"
        @click="nextStep"
      >
        {{ facebookStore.isConnected ? $t('onboarding.simple.nextButton') : $t('onboarding.simple.skipForNow') + ' →' }}
      </BaseButton>

      <!-- Step 5: Publish or Schedule -->
      <BaseButton
        v-if="currentStep === 5 && facebookStore.isConnected"
        variant="primary"
        @click="handlePublishOrSchedule"
        :disabled="publishing || (publishMode === 'now' && selectedPages.length === 0) || (publishMode === 'schedule' && !scheduleDate)"
      >
        {{ publishing ? $t('onboarding.simple.publishing') : (publishMode === 'now' ? $t('onboarding.simple.publishNowButton') : $t('onboarding.simple.schedulePostButton')) }}
      </BaseButton>

      <!-- Step 5: Skip if not connected -->
      <BaseButton
        v-if="currentStep === 5 && !facebookStore.isConnected"
        variant="primary"
        @click="showCompletion = true"
      >
        {{ $t('onboarding.simple.skipAndContinue') }}
      </BaseButton>
    </div>

    <!-- No modal needed - content shown inline in step 3 -->

    <!-- Facebook Onboarding Modal -->
    <FacebookOnboardingModal
      v-model="showFacebookOnboarding"
      @connected="handleFacebookConnected"
    />

    <!-- Completion Modal -->
    <div v-if="showCompletion" class="completion-overlay" @click="handleCompletionClick">
      <BaseCard variant="glass-intense" class="completion-modal" @click.stop>
        <div class="completion-content">
          <div class="completion-icon">celebration</div>
          <h2 class="completion-title">{{ $t('onboarding.simple.congratulations') }}</h2>
          <p class="completion-message">
            {{ $t('onboarding.simple.completionMessage') }}
          </p>
          <div class="completion-features">
            <div class="feature-item">
              <span class="feature-check">check_circle</span>
              <span>{{ $t('onboarding.simple.restaurantAdded') }}</span>
            </div>
            <div class="feature-item">
              <span class="feature-check">check_circle</span>
              <span>{{ $t('onboarding.simple.firstPostCreated') }}</span>
            </div>
            <div v-if="facebookStore.isConnected" class="feature-item">
              <span class="feature-check">check_circle</span>
              <span>{{ $t('onboarding.simple.accountsConnected') }}</span>
            </div>
          </div>
          <BaseButton
            variant="primary"
            size="large"
            full-width
            @click="completeOnboarding"
          >
            {{ $t('onboarding.simple.startCreatingPosts') }}
          </BaseButton>
        </div>
      </BaseCard>
    </div>
  </div>
</template>

<style scoped>
.simple-onboarding {
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: var(--space-3xl);
}

/* Stepper */
.stepper {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  position: relative;
  margin-bottom: var(--space-lg);
}

.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-sm);
  flex: 1;
  position: relative;
}

.step-number {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--bg-elevated);
  border: 2px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-heading);
  font-size: var(--text-lg);
  font-weight: var(--font-bold);
  color: var(--text-muted);
  transition: var(--transition-base);
  position: relative;
  z-index: 2;
}

.step.active .step-number {
  background: var(--gradient-gold);
  border-color: var(--gold-primary);
  color: var(--text-on-gold);
  box-shadow: var(--glow-gold-md);
}

.step.current .step-number {
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

.step-label {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--text-muted);
  text-align: center;
  transition: var(--transition-base);
}

.step.active .step-label {
  color: var(--gold-primary);
}

.step-connector {
  position: absolute;
  top: 24px;
  left: 50%;
  width: 100%;
  height: 2px;
  background: var(--border-color);
  z-index: 1;
}

.step.active .step-connector {
  background: var(--gold-primary);
}

/* Progress Bar */
.progress-bar {
  width: 100%;
  height: 6px;
  background: var(--bg-elevated);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--gradient-gold);
  transition: width 0.5s var(--ease-smooth);
  border-radius: var(--radius-full);
}

/* Step Content */
.step-content {
  min-height: 500px;
  animation: fadeIn 0.5s var(--ease-smooth);
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.step-panel {
  display: flex;
  flex-direction: column;
  gap: var(--space-3xl);
}

.step-header {
  text-align: center;
}

.step-icon {
  font-size: 64px;
  margin-bottom: var(--space-lg);
  animation: bounce 2s ease-in-out infinite;
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.step-title {
  font-family: var(--font-heading);
  font-size: var(--text-3xl);
  color: var(--text-primary);
  margin: 0 0 var(--space-md) 0;
  background: var(--gradient-gold);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.step-description {
  font-size: var(--text-base);
  color: var(--text-secondary);
  margin: 0;
}

/* Restaurant Search */
.restaurant-search {
  max-width: 900px;
  width: 100%;
  margin: 0 auto var(--space-3xl);
  padding: var(--space-xl);
  background: var(--glass-bg);
  backdrop-filter: blur(var(--blur-md));
  border: var(--border-width) solid var(--glass-border);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
  transition: var(--transition-base);
}

.restaurant-search:hover {
  border-color: var(--gold-primary);
  box-shadow: var(--shadow-xl), 0 0 0 1px rgba(212, 175, 55, 0.1);
}

/* Make the autocomplete input larger */
.restaurant-search :deep(input) {
  font-size: var(--text-lg) !important;
  padding: var(--space-lg) var(--space-xl) !important;
  min-height: 56px !important;
}

.restaurant-search :deep(.autocomplete-container) {
  width: 100%;
}

.selected-restaurant {
  max-width: 900px;
  margin: var(--space-2xl) auto 0;
}

.restaurant-card {
  display: flex;
  align-items: center;
  gap: var(--space-lg);
  padding: var(--space-xl);
  background: var(--glass-bg);
  border: 2px solid var(--gold-primary);
  border-radius: var(--radius-lg);
  box-shadow: var(--glow-gold-md);
  animation: slideIn 0.5s var(--ease-smooth);
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.restaurant-logo {
  width: 60px;
  height: 60px;
  border-radius: var(--radius-md);
  overflow: hidden;
  flex-shrink: 0;
}

.restaurant-logo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.restaurant-info {
  flex: 1;
}

.restaurant-info h3 {
  font-family: var(--font-heading);
  font-size: var(--text-xl);
  color: var(--text-primary);
  margin: 0 0 var(--space-xs) 0;
}

.restaurant-info p {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin: 0;
}

.menu-badge-container {
  margin-top: var(--space-sm);
}

.menu-badge {
  display: inline-block;
  padding: var(--space-xs) var(--space-md);
  border-radius: var(--radius-md);
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
}

.okam-badge {
  background: rgba(34, 197, 94, 0.15);
  border: 1px solid rgba(34, 197, 94, 0.4);
  color: #22c55e;
}

.platform-badge {
  background: rgba(59, 130, 246, 0.15);
  border: 1px solid rgba(59, 130, 246, 0.4);
  color: #3b82f6;
}

.check-icon {
  font-size: var(--text-3xl);
  color: var(--gold-primary);
}

/* Image Selection */
.image-section {
  margin-bottom: var(--space-2xl);
}

.section-heading {
  font-family: var(--font-heading);
  font-size: var(--text-lg);
  color: var(--text-primary);
  margin: 0 0 var(--space-lg) 0;
}

.onboarding-tip {
  margin-bottom: var(--space-lg);
}

.success-message {
  margin-bottom: var(--space-lg);
}

.loading-state,
.generating-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-lg);
  padding: var(--space-5xl);
  text-align: center;
}

.loading-logo {
  width: 120px;
  height: 120px;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 0.6;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.05);
  }
}

.loading-steps {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
  align-items: center;
}

.loading-text {
  font-size: var(--text-lg);
  color: var(--text-primary);
  font-weight: var(--font-semibold);
  margin: 0;
}

.loading-progress {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  min-width: 300px;
}

.progress-step {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.step-check {
  font-size: var(--text-lg);
  min-width: 24px;
}

.spinner {
  width: 60px;
  height: 60px;
  border: 4px solid var(--border-color);
  border-top-color: var(--gold-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Post Preview */
.post-preview {
  display: flex;
  flex-direction: column;
  gap: var(--space-2xl);
}

.preview-image {
  border-radius: var(--radius-lg);
  overflow: hidden;
  border: 2px solid var(--gold-primary);
  box-shadow: var(--glow-gold-md);
}

.preview-image img {
  width: 100%;
  height: auto;
  display: block;
}

.content-preview {
  padding: var(--space-2xl);
}

.preview-section {
  margin-bottom: var(--space-xl);
}

.preview-section:last-child {
  margin-bottom: 0;
}

.preview-section h4 {
  font-family: var(--font-heading);
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--gold-primary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0 0 var(--space-md) 0;
}

.post-text {
  font-size: var(--text-base);
  color: var(--text-primary);
  line-height: var(--leading-normal);
  margin: 0;
  white-space: pre-wrap;
}

.hashtags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
}

.hashtag {
  padding: var(--space-xs) var(--space-md);
  background: var(--bg-elevated);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  color: var(--gold-primary);
  font-weight: var(--font-medium);
}

.cta-text {
  font-size: var(--text-base);
  color: var(--text-secondary);
  margin: 0;
  font-style: italic;
}

/* Publish Options */
.publish-options {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
  max-width: 500px;
  margin: 0 auto;
}

.onboarding-note {
  max-width: 500px;
  margin: var(--space-2xl) auto 0;
  padding: var(--space-lg);
  background: var(--info-bg);
  border: 1px solid var(--info-border);
  border-radius: var(--radius-md);
  text-align: center;
}

.onboarding-note p {
  color: var(--info-text);
  font-size: var(--text-sm);
  margin: 0;
}

/* Navigation */
.navigation {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: var(--space-2xl);
  border-top: 1px solid var(--border-color);
}

/* Connect Accounts */
.connect-accounts {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--space-2xl);
  max-width: 700px;
  margin: 0 auto;
}

.account-card {
  padding: var(--space-2xl);
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
  transition: var(--transition-base);
}

.account-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-xl);
}

.account-header {
  display: flex;
  align-items: center;
  gap: var(--space-lg);
}

.account-icon {
  width: 56px;
  height: 56px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  flex-shrink: 0;
}

.account-icon.facebook {
  background: rgba(24, 119, 242, 0.15);
  border: 2px solid rgba(24, 119, 242, 0.3);
}

.account-icon.instagram {
  background: rgba(193, 53, 132, 0.15);
  border: 2px solid rgba(193, 53, 132, 0.3);
}

.account-info {
  flex: 1;
}

.account-name {
  font-family: var(--font-heading);
  font-size: var(--text-xl);
  color: var(--text-primary);
  margin: 0 0 var(--space-xs) 0;
}

.account-description {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin: 0;
}

.account-note {
  font-size: var(--text-xs);
  color: var(--text-muted);
  text-align: center;
  margin-top: var(--space-sm);
}

/* Calendar Preview */
/* Calendar Example */
.calendar-example-card {
  margin: var(--space-2xl) 0;
  padding: var(--space-lg);
  overflow: hidden;
}

.calendar-example-image {
  width: 100%;
  height: auto;
  display: block;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
  transition: transform 0.3s ease;
}

.calendar-example-image:hover {
  transform: scale(1.02);
}

/* Calendar Legend */
.calendar-legend {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: var(--space-2xl);
  margin: var(--space-xl) 0 var(--space-2xl) 0;
  padding: var(--space-lg);
  flex-wrap: wrap;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.legend-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
  box-shadow: 0 0 10px currentColor;
}

.legend-published {
  background: rgba(34, 197, 94, 0.8);
  color: rgba(34, 197, 94, 0.8);
}

.legend-scheduled {
  background: rgba(59, 130, 246, 0.8);
  color: rgba(59, 130, 246, 0.8);
}

.legend-failed {
  background: rgba(239, 68, 68, 0.8);
  color: rgba(239, 68, 68, 0.8);
}

/* Schedule Explanation */
.schedule-explanation {
  padding: var(--space-3xl);
  display: flex;
  flex-direction: column;
  gap: var(--space-2xl);
}

/* Generation Loading */
.generation-loading {
  text-align: center;
  padding: var(--space-5xl) var(--space-2xl);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-xl);
}

.loading-spinner-large {
  width: 80px;
  height: 80px;
  border: 4px solid var(--border-color);
  border-top-color: var(--gold-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-title {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  color: var(--text-primary);
  margin: 0;
}

.loading-description {
  font-size: var(--text-base);
  color: var(--text-secondary);
  margin: 0;
}

.schedule-feature {
  display: flex;
  gap: var(--space-lg);
  align-items: flex-start;
}

.feature-icon {
  font-size: 40px;
  flex-shrink: 0;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--gold-subtle);
  border-radius: var(--radius-md);
  border: 1px solid var(--gold-primary);
}

.feature-content {
  flex: 1;
}

.feature-content h4 {
  font-family: var(--font-heading);
  font-size: var(--text-lg);
  color: var(--text-primary);
  margin: 0 0 var(--space-sm) 0;
}

.feature-content p {
  font-size: var(--text-base);
  color: var(--text-secondary);
  margin: 0;
  line-height: var(--leading-normal);
}

/* Completion Modal */
.completion-overlay {
  position: fixed;
  inset: 0;
  background: rgba(10, 10, 10, 0.95);
  backdrop-filter: blur(var(--blur-lg));
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: var(--space-xl);
  animation: fadeIn 0.3s var(--ease-smooth);
}

.completion-modal {
  max-width: 500px;
  width: 100%;
  padding: var(--space-4xl);
  animation: scaleIn 0.4s var(--ease-smooth);
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.completion-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-xl);
  text-align: center;
}

.completion-icon {
  font-size: 80px;
  animation: bounce 1s ease-in-out;
}

.completion-title {
  font-family: var(--font-heading);
  font-size: var(--text-3xl);
  color: var(--text-primary);
  margin: 0;
  background: var(--gradient-gold);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.completion-message {
  font-size: var(--text-lg);
  color: var(--text-secondary);
  margin: 0;
  line-height: var(--leading-normal);
}

.completion-features {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  padding: var(--space-xl);
  background: var(--bg-elevated);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
}

.feature-item {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  font-size: var(--text-base);
  color: var(--text-secondary);
}

.feature-check {
  font-size: var(--text-xl);
  color: var(--gold-primary);
  font-weight: var(--font-bold);
}

/* Responsive */
@media (max-width: 768px) {
  .stepper {
    gap: var(--space-xs);
  }

  .step-number {
    width: 40px;
    height: 40px;
    font-size: var(--text-base);
  }

  .step-label {
    font-size: var(--text-xs);
  }

  .step-icon {
    font-size: 48px;
  }

  .step-title {
    font-size: var(--text-2xl);
  }

  .restaurant-card {
    flex-direction: column;
    text-align: center;
  }

  .connect-accounts {
    grid-template-columns: 1fr;
  }

  .schedule-explanation {
    padding: var(--space-2xl);
  }

  .schedule-feature {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .completion-modal {
    padding: var(--space-3xl);
  }

  .completion-icon {
    font-size: 60px;
  }

  .completion-title {
    font-size: var(--text-2xl);
  }

  .publish-choice-container {
    grid-template-columns: 1fr;
  }

  .datetime-inputs {
    flex-direction: column;
  }
}

/* Publish Choice Container */
.publish-choice-container {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-2xl);
  max-width: 800px;
  margin: 0 auto;
}

.publish-option-card {
  padding: var(--space-2xl);
  cursor: pointer;
  transition: var(--transition-base);
  border: 2px solid transparent;
}

.publish-option-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-xl);
}

.publish-option-card.selected {
  border-color: var(--gold-primary);
  box-shadow: var(--glow-gold-md);
}

.option-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--space-lg);
}

.option-icon {
  font-size: 48px;
}

.option-radio {
  width: 24px;
  height: 24px;
  border: 2px solid var(--border-color);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: var(--transition-base);
}

.publish-option-card.selected .option-radio {
  border-color: var(--gold-primary);
}

.radio-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: transparent;
  transition: var(--transition-base);
}

.radio-dot.active {
  background: var(--gold-primary);
}

.option-title {
  font-family: var(--font-heading);
  font-size: var(--text-xl);
  color: var(--text-primary);
  margin: 0 0 var(--space-sm) 0;
}

.option-description {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin: 0;
  line-height: var(--leading-normal);
}

/* Platform Selection */
.platform-selection {
  margin-top: var(--space-xl);
  padding-top: var(--space-xl);
  border-top: 1px solid var(--border-color);
}

.platform-label {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--text-secondary);
  margin: 0 0 var(--space-md) 0;
}

.platform-checkboxes {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.platform-checkbox {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  cursor: pointer;
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-md);
  transition: var(--transition-base);
}

.platform-checkbox:hover {
  background: var(--bg-elevated);
}

.platform-checkbox input {
  display: none;
}

.checkbox-custom {
  width: 20px;
  height: 20px;
  border: 2px solid var(--border-color);
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: var(--transition-base);
  flex-shrink: 0;
}

.checkbox-custom.radio {
  border-radius: 50%;
}

.platform-checkbox input:checked + .checkbox-custom {
  background: var(--gold-primary);
  border-color: var(--gold-primary);
}

.platform-checkbox input:checked + .checkbox-custom::after {
  content: 'check_circle';
  color: var(--text-on-gold);
  font-size: var(--text-xs);
  font-weight: var(--font-bold);
}

.platform-checkbox input:checked + .checkbox-custom.radio::after {
  content: '';
  width: 8px;
  height: 8px;
  background: var(--text-on-gold);
  border-radius: 50%;
}

.platform-name {
  font-size: var(--text-sm);
  color: var(--text-primary);
}

/* Schedule Selection */
.schedule-selection {
  margin-top: var(--space-xl);
  padding-top: var(--space-xl);
  border-top: 1px solid var(--border-color);
}

.datetime-inputs {
  display: flex;
  gap: var(--space-lg);
  margin-bottom: var(--space-xl);
}

.input-group {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.input-group label {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--text-secondary);
}

.datetime-input {
  padding: var(--space-md) var(--space-lg);
  background: var(--bg-elevated);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: var(--text-base);
  transition: var(--transition-base);
}

.datetime-input:focus {
  outline: none;
  border-color: var(--gold-primary);
  box-shadow: 0 0 0 2px rgba(212, 175, 55, 0.2);
}

.datetime-input::-webkit-calendar-picker-indicator {
  filter: invert(1);
  cursor: pointer;
}

/* Post Summary */
.post-summary {
  max-width: 500px;
  margin: var(--space-2xl) auto 0;
  padding: var(--space-xl);
}

.summary-title {
  font-family: var(--font-heading);
  font-size: var(--text-lg);
  color: var(--gold-primary);
  margin: 0 0 var(--space-lg) 0;
  text-align: center;
}

.summary-content {
  display: flex;
  gap: var(--space-lg);
  align-items: flex-start;
}

.summary-image {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: var(--radius-md);
  flex-shrink: 0;
}

.summary-text {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin: 0;
  line-height: var(--leading-normal);
}
</style>
