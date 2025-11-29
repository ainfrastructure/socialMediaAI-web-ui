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

// Generation state
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

// Load restaurant on mount
onMounted(async () => {
  await loadRestaurant()
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

      // Show result modal with loading states
      showResultModal.value = true
      easyModeGenerating.value = false

      // Generate the image
      try {
        console.log('[EasyMode] Starting image generation...')
        await generateImage(data.uploadedLogo)
        console.log('[EasyMode] Image generated successfully:', generatedImageUrl.value)
        generationError.value = null
      } catch (imageError: any) {
        generationError.value = imageError.message || t('contentCreate.imageError', 'Failed to generate image. Please try again.')
        console.error('[EasyMode] Image generation error:', imageError)
      }
    } else {
      // No prompts generated - show error in modal
      console.warn('[EasyMode] No prompts were generated')
      easyModeGenerating.value = false
      generationError.value = t('contentCreate.noPrompts', 'No prompts were generated. Please try again.')
      showResultModal.value = true
    }
  } catch (err: any) {
    easyModeGenerating.value = false
    generationError.value = err.message || t('contentCreate.generateError', 'Failed to generate content')
  }
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
      } catch (imageError) {
        console.error('Warning: Could not load reference image', imageError)
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

    // Build the message with post text and hashtags
    const hashtags = generatedPostContent.value?.hashtags || []
    const postText = generatedPostContent.value?.postText || ''
    const message = hashtags.length > 0
      ? `${postText}\n\n${hashtags.join(' ')}`
      : postText

    const response = await api.postToFacebook(
      selectedPage.id,
      message,
      generatedImageUrl.value
    )

    if (response.success && response.data) {
      publishedToFacebook.value = true
      facebookPostUrl.value = response.data.postUrl
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
          @back="goBack"
          @generate="handleEasyModeGenerate"
        />

        <!-- Advanced Mode Placeholder -->
        <BaseCard v-else variant="glass" class="advanced-mode-card">
          <div class="advanced-placeholder">
            <h3>{{ t('contentCreate.advancedMode', 'Advanced Mode') }}</h3>
            <p>{{ t('contentCreate.advancedDescription', 'Advanced mode with full customization options is coming soon.') }}</p>
            <BaseButton variant="secondary" @click="preferencesStore.setCreationMode('easy')">
              {{ t('contentCreate.switchToEasy', 'Switch to Easy Mode') }}
            </BaseButton>
          </div>
        </BaseCard>
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

/* Advanced Mode Placeholder */
.advanced-mode-card {
  animation: fadeInUp 0.5s var(--ease-smooth);
}

.advanced-placeholder {
  text-align: center;
  padding: var(--space-3xl) var(--space-xl);
}

.advanced-placeholder h3 {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  color: var(--text-primary);
  margin: 0 0 var(--space-md) 0;
}

.advanced-placeholder p {
  color: var(--text-secondary);
  margin: 0 0 var(--space-xl) 0;
  max-width: 400px;
  margin-left: auto;
  margin-right: auto;
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
