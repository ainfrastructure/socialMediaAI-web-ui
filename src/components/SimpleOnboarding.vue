<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useFacebookStore } from '../stores/facebook'
import { api } from '../services/api'
import { restaurantService } from '../services/restaurantService'
import { placesService } from '../services/placesService'
import { menuService } from '../services/menuService'
import BaseButton from './BaseButton.vue'
import BaseCard from './BaseCard.vue'
import BaseAlert from './BaseAlert.vue'
import RestaurantAutocomplete from './RestaurantAutocomplete.vue'
import EasyModeCreation from './EasyModeCreation.vue'
import GenerationResultModal from './GenerationResultModal.vue'
import FacebookOnboardingModal from './FacebookOnboardingModal.vue'

const router = useRouter()
const facebookStore = useFacebookStore()

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

// Step 2: Post generation
const generatingPost = ref(false)
const generatedPost = ref<{
  imageUrl: string
  postText: string
  hashtags: string[]
  callToAction: string
} | null>(null)
const savingFavorite = ref(false)
const savedFavorite = ref(false)

// Step 4: Social media connection
const showFacebookOnboarding = ref(false)
const showInstagramOnboarding = ref(false)
const publishing = ref(false)

// Step 5: Completion
const showCompletion = ref(false)

const progress = computed(() => (currentStep.value / totalSteps) * 100)

const canProceedStep1 = computed(() => restaurantSaved.value && !!selectedRestaurant.value)
const canProceedStep2 = computed(() => !!generatedPost.value)

// Step 1: Restaurant Selection and Addition
async function handleRestaurantSelect(restaurant: any) {
  selectedRestaurant.value = restaurant
  restaurantError.value = ''
  restaurantSaved.value = false

  // Automatically fetch details and save the restaurant
  await fetchAndSaveRestaurant(restaurant)
}

async function fetchAndSaveRestaurant(restaurant: any) {
  try {
    savingRestaurant.value = true
    loadingDetails.value = true
    restaurantError.value = ''

    console.log('Starting fetchAndSaveRestaurant with:', restaurant)

    // Fetch full place details from Google Places
    const details = await placesService.getPlaceDetails(restaurant.place_id)

    console.log('Fetched place details:', details)

    if (!details) {
      throw new Error('Failed to fetch restaurant details')
    }

    placeDetails.value = details

    // Fetch menu data
    let menuData = null
    try {
      menuData = await menuService.getRestaurantMenu(restaurant.place_id, restaurant.name)
    } catch (error) {
      console.log('Menu data not available')
    }

    // Try to fetch brand DNA, but don't fail if it errors
    let brandDNA = null
    if (details.website) {
      try {
        const brandResponse = await api.analyzeBrandDNA(details.website, restaurant.place_id)
        if (brandResponse.success && (brandResponse as any).brandDNA) {
          brandDNA = (brandResponse as any).brandDNA
        }
      } catch (error) {
        console.log('Brand DNA not available, continuing without it:', error)
        // Continue without brand DNA - it's optional
      }
    }

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

    console.log('Saving restaurant with data:', {
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
      selectedRestaurant.value = {
        id: result.data?.id || '',
        place_id: restaurant.place_id,
        name: details.name,
        address: details.formatted_address || details.vicinity || restaurant.address || '',
        city: details.address_components?.find((c: any) => c.types.includes('locality'))?.long_name || '',
        country: details.address_components?.find((c: any) => c.types.includes('country'))?.long_name || '',
        brand_dna: brandDNA,
        menu_items: menuData?.items || [],
        google_data: details
      }

      // Don't auto-advance - let user click Continue
      // setTimeout(() => {
      //   if (canProceedStep1.value) {
      //     nextStep()
      //   }
      // }, 1000)
    } else {
      if (result.error && result.error.includes('already saved')) {
        // Restaurant already exists, that's fine!
        restaurantSaved.value = true
        selectedRestaurant.value = {
          id: result.data?.id || '',
          place_id: restaurant.place_id,
          name: details.name,
          address: details.formatted_address || details.vicinity || restaurant.address || '',
          city: details.address_components?.find((c: any) => c.types.includes('locality'))?.long_name || '',
          country: details.address_components?.find((c: any) => c.types.includes('country'))?.long_name || '',
          brand_dna: brandDNA,
          menu_items: menuData?.items || [],
          google_data: details
        }

        // Don't auto-advance - let user click Continue
        // setTimeout(() => {
        //   if (canProceedStep1.value) {
        //     nextStep()
        //   }
        // }, 1000)
      } else {
        throw new Error(result.error || 'Failed to save restaurant')
      }
    }
  } catch (error: any) {
    console.error('Failed to fetch and save restaurant:', error)
    restaurantError.value = error.message || 'Failed to add restaurant. Please try again.'
    restaurantSaved.value = false
  } finally {
    savingRestaurant.value = false
    loadingDetails.value = false
  }
}

async function nextStep() {
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
      callToAction: postContentResponse.data?.callToAction || ''
    }

    console.log('[ONBOARDING] Generation complete! Generated post:', generatedPost.value)
    console.log('[ONBOARDING] Image URL set to:', generatedPost.value.imageUrl)

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


// Step 4: Publishing
async function handlePublish() {
  if (facebookStore.connectedPages.length === 0) {
    // Show Facebook onboarding modal
    showFacebookOnboarding.value = true
  } else {
    await publishPost()
  }
}

async function publishPost() {
  if (!generatedPost.value) return

  try {
    publishing.value = true

    // TODO: Implement multi-platform publishing
    // For now, just complete the onboarding
    // Users can publish from the main app
    console.log('Publishing post:', {
      platforms: ['facebook', 'instagram'],
      content: generatedPost.value.postText,
      imageUrl: generatedPost.value.imageUrl,
      hashtags: generatedPost.value.hashtags,
      restaurantId: selectedRestaurant.value?.id
    })

    // Complete onboarding
    completeOnboarding()
  } catch (error) {
    console.error('Failed to publish:', error)
  } finally {
    publishing.value = false
  }
}

async function saveToFavorites() {
  if (!generatedPost.value || !selectedRestaurant.value) return

  try {
    savingFavorite.value = true

    const favoriteData = {
      restaurant_id: selectedRestaurant.value.id,
      content_type: 'image' as const,
      media_url: generatedPost.value.imageUrl,
      post_text: generatedPost.value.postText,
      hashtags: generatedPost.value.hashtags, // Keep as array
      call_to_action: generatedPost.value.callToAction
    }

    console.log('[ONBOARDING] Saving to favorites:', favoriteData)
    const response = await api.saveFavorite(favoriteData)

    if (response.success) {
      savedFavorite.value = true
      console.log('[ONBOARDING] Saved to favorites successfully')
    } else {
      throw new Error(response.error || 'Failed to save')
    }
  } catch (error: any) {
    console.error('[ONBOARDING] Failed to save to favorites:', error)
    restaurantError.value = error.message || 'Failed to save to favorites'
  } finally {
    savingFavorite.value = false
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
    // Redirect to cook-up (easy mode)
    router.push('/cook-up')
  } catch (error) {
    console.error('Failed to complete onboarding:', error)
    // Redirect anyway to improve UX
    router.push('/cook-up')
  }
}

function handleFacebookConnected() {
  showFacebookOnboarding.value = false
  publishPost()
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
            step === 1 ? 'Restaurant' :
            step === 2 ? 'Create' :
            step === 3 ? 'Review' :
            step === 4 ? 'Connect' :
            'Schedule'
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
          <h2 class="step-title">Add Your Restaurant</h2>
          <p class="step-description">Search for your restaurant using Google Places</p>
        </div>

        <!-- Helpful Instructions -->
        <BaseAlert v-if="!selectedRestaurant" type="info" :dismissible="false" class="onboarding-tip">
          💡 Start by typing your restaurant name or location. We'll automatically fetch all the details for you!
        </BaseAlert>

        <BaseAlert v-if="restaurantError" type="error" :dismissible="false">
          {{ restaurantError }}
        </BaseAlert>

        <div class="restaurant-search">
          <RestaurantAutocomplete
            placeholder="Search for your restaurant..."
            @select="handleRestaurantSelect"
            :disabled="savingRestaurant"
          />
        </div>

        <!-- Loading State -->
        <div v-if="savingRestaurant" class="loading-state">
          <div class="spinner"></div>
          <div class="loading-steps">
            <p class="loading-text">Setting up your restaurant...</p>
            <div class="loading-progress">
              <div class="progress-step">
                <span class="step-check">✓</span> Fetching restaurant details
              </div>
              <div class="progress-step">
                <span class="step-check">{{ loadingDetails ? '⏳' : '✓' }}</span> Loading menu & brand identity
              </div>
              <div class="progress-step">
                <span class="step-check">⏳</span> Saving to database
              </div>
            </div>
          </div>
        </div>

        <!-- Success State -->
        <div v-if="restaurantSaved && selectedRestaurant" class="selected-restaurant">
          <BaseAlert type="success" :dismissible="false" class="success-message">
            ✓ Restaurant added successfully! Moving to next step...
          </BaseAlert>
          <div class="restaurant-card">
            <div class="restaurant-logo" v-if="selectedRestaurant.brand_dna?.logo_url">
              <img :src="selectedRestaurant.brand_dna.logo_url" :alt="selectedRestaurant.name" />
            </div>
            <div class="restaurant-info">
              <h3>{{ selectedRestaurant.name }}</h3>
              <p v-if="selectedRestaurant.address">{{ selectedRestaurant.address }}</p>
            </div>
            <span class="check-icon">✓</span>
          </div>
        </div>
      </div>

      <!-- Step 2: Create Post with Easy Mode -->
      <div v-else-if="currentStep === 2" class="step-panel">
        <div class="step-header">
          <div class="step-icon">✨</div>
          <h2 class="step-title">Create Your Post</h2>
          <p class="step-description">Select menu items and style to generate your post</p>
        </div>

        <!-- Helpful Instructions -->
        <BaseAlert type="info" :dismissible="false" class="onboarding-tip">
          💡 Choose menu items and a style, then click "Generate Post" to create your content!
        </BaseAlert>

        <!-- Generation Loading State -->
        <div v-if="generatingPost" class="generation-loading">
          <div class="loading-spinner-large"></div>
          <h3 class="loading-title">Creating Your Post...</h3>
          <p class="loading-description">Our AI is crafting the perfect content for you</p>
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
          <h2 class="step-title">Review Your Post</h2>
          <p class="step-description">Check out your AI-generated content</p>
        </div>

        <!-- Helpful Instructions -->
        <BaseAlert type="info" :dismissible="false" class="onboarding-tip">
          💡 This is what your post will look like. You can go back to make changes or continue to connect your accounts!
        </BaseAlert>

        <div v-if="generatedPost" class="post-preview">
          <!-- Image Preview -->
          <div v-if="generatedPost.imageUrl" class="preview-image">
            <img :src="generatedPost.imageUrl" alt="Post image" />
          </div>

          <!-- Content Preview -->
          <BaseCard variant="glass" class="content-preview">
            <div class="preview-section">
              <h4>POST TEXT</h4>
              <p class="post-text">{{ generatedPost.postText }}</p>
            </div>

            <div v-if="generatedPost.hashtags && generatedPost.hashtags.length > 0" class="preview-section">
              <h4>HASHTAGS</h4>
              <div class="hashtags">
                <span v-for="(tag, idx) in generatedPost.hashtags" :key="idx" class="hashtag">
                  {{ tag }}
                </span>
              </div>
            </div>

            <div v-if="generatedPost.callToAction" class="preview-section">
              <h4>CALL TO ACTION</h4>
              <p class="cta-text">{{ generatedPost.callToAction }}</p>
            </div>

            <!-- Add to Favorites Button -->
            <div class="preview-actions">
              <BaseButton
                variant="primary"
                size="large"
                full-width
                @click="saveToFavorites"
                :disabled="savingFavorite || savedFavorite"
              >
                {{ savedFavorite ? '⭐ Saved to Favorites' : (savingFavorite ? 'Saving...' : '⭐ Add to Favorites') }}
              </BaseButton>
            </div>
          </BaseCard>
        </div>
      </div>

      <!-- Step 4: Connect Social Media -->
      <div v-else-if="currentStep === 4" class="step-panel">
        <div class="step-header">
          <div class="step-icon">🔗</div>
          <h2 class="step-title">Connect Your Accounts</h2>
          <p class="step-description">Link Facebook and Instagram to post and schedule</p>
        </div>

        <!-- Helpful Instructions -->
        <BaseAlert type="info" :dismissible="false" class="onboarding-tip">
          💡 Connect your accounts to publish posts and schedule them for later. You can connect one or both!
        </BaseAlert>

        <div class="connect-accounts">
          <!-- Facebook Connection -->
          <BaseCard variant="glass" class="account-card">
            <div class="account-header">
              <div class="account-icon facebook">📘</div>
              <div class="account-info">
                <h3 class="account-name">Facebook</h3>
                <p class="account-description">Post to your Facebook pages</p>
              </div>
            </div>
            <BaseButton
              variant="primary"
              size="large"
              full-width
              @click="showFacebookOnboarding = true"
            >
              {{ facebookStore.isConnected ? '✓ Connected' : 'Connect Facebook' }}
            </BaseButton>
          </BaseCard>

          <!-- Instagram Connection -->
          <BaseCard variant="glass" class="account-card">
            <div class="account-header">
              <div class="account-icon instagram">📸</div>
              <div class="account-info">
                <h3 class="account-name">Instagram</h3>
                <p class="account-description">Post to your Instagram business account</p>
              </div>
            </div>
            <BaseButton
              variant="primary"
              size="large"
              full-width
              @click="showFacebookOnboarding = true"
            >
              {{ facebookStore.isConnected ? '✓ Connected via Facebook' : 'Connect Instagram' }}
            </BaseButton>
            <p class="account-note">Instagram requires Facebook connection</p>
          </BaseCard>
        </div>
      </div>

      <!-- Step 5: Schedule Explanation -->
      <div v-else-if="currentStep === 5" class="step-panel">
        <div class="step-header">
          <div class="step-icon">📅</div>
          <h2 class="step-title">Schedule Your Posts</h2>
          <p class="step-description">Plan your content in advance with our calendar</p>
        </div>

        <!-- Helpful Instructions -->
        <BaseAlert type="success" :dismissible="false" class="onboarding-tip">
          ✨ With connected accounts, you can schedule posts for optimal engagement times!
        </BaseAlert>

        <!-- Calendar Example Image -->
        <BaseCard variant="glass" class="calendar-example-card">
          <img
            src="/calendar.png"
            alt="Calendar example showing scheduled posts"
            class="calendar-example-image"
          />
        </BaseCard>

        <!-- Color Legend -->
        <div class="calendar-legend">
          <div class="legend-item">
            <div class="legend-dot legend-published"></div>
            <span>Already Posted</span>
          </div>
          <div class="legend-item">
            <div class="legend-dot legend-scheduled"></div>
            <span>Scheduled Post</span>
          </div>
          <div class="legend-item">
            <div class="legend-dot legend-failed"></div>
            <span>Something Went Wrong</span>
          </div>
        </div>

        <BaseCard variant="glass" class="schedule-explanation">
          <div class="schedule-feature">
            <div class="feature-icon">🗓️</div>
            <div class="feature-content">
              <h4>Visual Calendar</h4>
              <p>See all your scheduled posts in a beautiful calendar view</p>
            </div>
          </div>

          <div class="schedule-feature">
            <div class="feature-icon">⏰</div>
            <div class="feature-content">
              <h4>Pick Your Time</h4>
              <p>Choose exactly when you want your posts to go live</p>
            </div>
          </div>

          <div class="schedule-feature">
            <div class="feature-icon">🎯</div>
            <div class="feature-content">
              <h4>Best Times</h4>
              <p>Get suggestions for optimal posting times based on your audience</p>
            </div>
          </div>

          <div class="schedule-feature">
            <div class="feature-icon">♻️</div>
            <div class="feature-content">
              <h4>Auto-Publish</h4>
              <p>Posts are automatically published at the scheduled time</p>
            </div>
          </div>
        </BaseCard>
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
        ← Back
      </BaseButton>
      <div v-else></div>

      <!-- Step 1: Continue to Create Post -->
      <BaseButton
        v-if="currentStep === 1"
        variant="primary"
        @click="nextStep"
        :disabled="!canProceedStep1 || savingRestaurant"
      >
        Continue to Create →
      </BaseButton>

      <!-- Step 2: No continue button - EasyModeCreation handles generation -->

      <!-- Step 3: Continue to Connect Accounts -->
      <BaseButton
        v-if="currentStep === 3"
        variant="primary"
        @click="nextStep"
        :disabled="!canProceedStep2"
      >
        Connect Accounts →
      </BaseButton>

      <!-- Step 4: Continue to Schedule Info (can skip connecting) -->
      <BaseButton
        v-if="currentStep === 4"
        variant="primary"
        @click="nextStep"
      >
        {{ facebookStore.isConnected ? 'Next →' : 'Skip for Now →' }}
      </BaseButton>

      <!-- Step 5: Complete Onboarding -->
      <BaseButton
        v-if="currentStep === 5"
        variant="primary"
        @click="showCompletion = true"
      >
        Get Started! 🚀
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
          <div class="completion-icon">🎉</div>
          <h2 class="completion-title">Congratulations!</h2>
          <p class="completion-message">
            You're all set up! You can now create amazing social media posts for your restaurant.
          </p>
          <div class="completion-features">
            <div class="feature-item">
              <span class="feature-check">✓</span>
              <span>Restaurant added</span>
            </div>
            <div class="feature-item">
              <span class="feature-check">✓</span>
              <span>First post created</span>
            </div>
            <div v-if="facebookStore.isConnected" class="feature-item">
              <span class="feature-check">✓</span>
              <span>Accounts connected</span>
            </div>
          </div>
          <BaseButton
            variant="primary"
            size="large"
            full-width
            @click="completeOnboarding"
          >
            Start Creating Posts!
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
  max-width: 600px;
  margin: 0 auto;
}

.selected-restaurant {
  max-width: 600px;
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

/* Preview Actions */
.preview-actions {
  margin-top: var(--space-xl);
  padding-top: var(--space-xl);
  border-top: 1px solid var(--border-color);
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
}
</style>
