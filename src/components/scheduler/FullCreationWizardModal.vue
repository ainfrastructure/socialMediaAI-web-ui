<script setup lang="ts">
/**
 * FullCreationWizardModal - Full wizard flow for creating posts directly from the scheduler
 * Orchestrates the entire flow: Choose Method → Select Restaurant → Create Content → Publish
 */
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import BaseCard from '../BaseCard.vue'
import BaseAlert from '../BaseAlert.vue'
import MaterialIcon from '../MaterialIcon.vue'
import EasyModeCreation from '../EasyModeCreation.vue'
import AdvancedModeCreation from '../AdvancedModeCreation.vue'
import ModeToggle from '../ModeToggle.vue'
import { useFacebookStore } from '@/stores/facebook'
import { useInstagramStore } from '@/stores/instagram'
import { useNotificationStore } from '@/stores/notifications'
import { restaurantService, type SavedRestaurant } from '@/services/restaurantService'
import { api } from '@/services/api'
import { okamService } from '@/services/okamService'

interface MenuItem {
  name: string
  price?: string
  imageUrl?: string
  [key: string]: any
}

interface PublishResult {
  platform: string
  success: boolean
  url?: string
  error?: string
}

interface Props {
  modelValue: boolean
  selectedDate: string | null // YYYY-MM-DD format
  restaurants: SavedRestaurant[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'post-created'): void
  (e: 'open-pick-post-modal'): void
}>()

const { t, locale } = useI18n()
const facebookStore = useFacebookStore()
const instagramStore = useInstagramStore()
const notificationStore = useNotificationStore()

// Wizard state
type WizardStep = 'choose-method' | 'choose-restaurant' | 'create' | 'success'
const wizardStep = ref<WizardStep>('choose-method')
const selectedMethod = ref<'new' | 'saved' | null>(null)
const selectedRestaurant = ref<SavedRestaurant | null>(null)
const menuItems = ref<MenuItem[]>([])
const loadingMenu = ref(false)
const creationMode = ref<'easy' | 'advanced'>('easy')

// Generation state
const generating = ref(false)
const generatedImageUrl = ref('')
const postText = ref('')
const hashtags = ref<string[]>([])
const generationError = ref<string | null>(null)

// Publishing state
const publishing = ref(false)
const publishResults = ref<{
  success: boolean
  platforms: PublishResult[]
} | null>(null)

// Success state
const showSuccess = ref(false)

// Component refs
const easyModeCreationRef = ref<InstanceType<typeof EasyModeCreation> | null>(null)
const advancedModeCreationRef = ref<InstanceType<typeof AdvancedModeCreation> | null>(null)

// Prompt/generation internals
const editablePrompt = ref('')
const imagePrompts = ref<string[]>([])
const selectedMenuItems = ref<any[]>([])
const promptContext = ref('')
const strictnessMode = ref<'strict' | 'flexible' | 'creative'>('strict')
const includeLogo = ref(true)
const logoPosition = ref<'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'>('bottom-right')
const stickerStyle = ref<'bold' | 'outlined' | 'ribbon' | 'badge' | 'starburst'>('bold')
const stickerPosition = ref<'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'center'>('top-right')
const lastSavedPost = ref<any>(null)

// Computed
const formattedDate = computed(() => {
  if (!props.selectedDate) return ''
  const date = new Date(props.selectedDate + 'T00:00:00')
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })
})

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// Watch for modal close to reset state
watch(() => props.modelValue, (newVal) => {
  if (!newVal) {
    resetWizard()
  }
})

// Methods
function resetWizard() {
  wizardStep.value = 'choose-method'
  selectedMethod.value = null
  selectedRestaurant.value = null
  menuItems.value = []
  creationMode.value = 'easy'
  generating.value = false
  generatedImageUrl.value = ''
  postText.value = ''
  hashtags.value = []
  generationError.value = null
  publishing.value = false
  publishResults.value = null
  showSuccess.value = false
  lastSavedPost.value = null
  selectedMenuItems.value = []
  promptContext.value = ''
  editablePrompt.value = ''
  imagePrompts.value = []
}

function closeModal() {
  isOpen.value = false
}

function selectMethod(method: 'new' | 'saved') {
  selectedMethod.value = method

  if (method === 'saved') {
    // Use existing saved posts flow
    closeModal()
    emit('open-pick-post-modal')
    return
  }

  // For 'new' method
  if (props.restaurants.length > 1) {
    wizardStep.value = 'choose-restaurant'
  } else if (props.restaurants.length === 1) {
    selectedRestaurant.value = props.restaurants[0]
    loadMenuItems()
  } else {
    // No restaurants
    generationError.value = t('scheduler.noRestaurants', 'No restaurants available. Please add a restaurant first.')
  }
}

function selectRestaurant(restaurant: SavedRestaurant) {
  selectedRestaurant.value = restaurant
  loadMenuItems()
}

async function loadMenuItems() {
  if (!selectedRestaurant.value) return

  loadingMenu.value = true
  generationError.value = null

  try {
    // Menu items are stored in the restaurant object (deduplicated by name)
    if (selectedRestaurant.value.menu?.items) {
      const itemsWithImages = selectedRestaurant.value.menu.items.filter((item: any) => item.imageUrl) || []
      const seen = new Set<string>()
      menuItems.value = itemsWithImages.filter((item: any) => {
        if (seen.has(item.name)) return false
        seen.add(item.name)
        return true
      })
    } else {
      menuItems.value = []
    }
    wizardStep.value = 'create'
  } catch (err: any) {
    generationError.value = err.message || t('scheduler.loadMenuError', 'Failed to load menu items')
  } finally {
    loadingMenu.value = false
  }
}

function goBack() {
  if (wizardStep.value === 'choose-restaurant') {
    wizardStep.value = 'choose-method'
    selectedMethod.value = null
  } else if (wizardStep.value === 'create') {
    // Check if the child creation component can go back internally
    const activeRef = creationMode.value === 'easy' ? easyModeCreationRef.value : advancedModeCreationRef.value
    const childStep = activeRef?.currentStep

    if (childStep && childStep > 1) {
      // Go back within the creation component
      activeRef?.prevStep()
    } else {
      // Child is on step 1, exit to previous wizard step
      if (props.restaurants.length > 1) {
        wizardStep.value = 'choose-restaurant'
      } else {
        wizardStep.value = 'choose-method'
      }
      selectedRestaurant.value = null
      menuItems.value = []
      // Reset generation state
      generatedImageUrl.value = ''
      postText.value = ''
      hashtags.value = []
      generationError.value = null
      publishResults.value = null
    }
  }
}

// Helper function to convert File to base64 URL
async function fileToBase64Url(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// Helper to get brand color
function getBrandColor(): string {
  return selectedRestaurant.value?.brand_dna?.primary_color || '#D4AF37'
}

// Generate prompts from selection
async function generatePromptsFromSelection() {
  if (!selectedRestaurant.value) return

  try {
    const response = await api.generatePrompts(
      {
        name: selectedRestaurant.value.name,
        type: selectedRestaurant.value.types?.[0] || 'restaurant',
        brandDna: selectedRestaurant.value.brand_dna,
      },
      selectedMenuItems.value,
      promptContext.value
    )

    if (response.success) {
      const prompts = (response as any).imagePrompts || response.data?.imagePrompts || []
      imagePrompts.value = prompts
    } else {
      imagePrompts.value = []
    }
  } catch (err) {
    console.error('Failed to generate prompts:', err)
    imagePrompts.value = []
  }
}

// Generate post content (text + hashtags)
async function generatePostContent() {
  if (!selectedRestaurant.value) return

  try {
    const menuItemNames = selectedMenuItems.value.map(item => item.name)

    const response = await api.generatePostContent(
      'facebook', // platform
      selectedRestaurant.value.name,
      menuItemNames,
      'image', // content type
      promptContext.value,
      selectedRestaurant.value.brand_dna,
      locale.value as 'en' | 'no'
    )

    if (response.success) {
      const content = response.data || response
      postText.value = (content as any).postText || ''
      hashtags.value = (content as any).hashtags || []
    } else {
      const errorMessage = response.error || response.message || t('scheduler.captionGenerationFailed')
      console.error('Failed to generate post content:', errorMessage)
      notificationStore.addNotification({
        type: 'error',
        title: t('scheduler.captionGenerationFailed'),
        message: errorMessage,
      })
    }
  } catch (err: any) {
    console.error('Failed to generate post content:', err)
    notificationStore.addNotification({
      type: 'error',
      title: t('scheduler.captionGenerationFailed'),
      message: err.message || t('scheduler.unexpectedError'),
    })
  }
}

// Generate image
async function generateImage(uploadedLogo: File | null = null, uploadedImage: File | null = null) {
  if (!editablePrompt.value || !selectedRestaurant.value) return

  // Start post content generation in parallel
  const postContentPromise = generatePostContent().catch(error => {
    console.error('Failed to generate post content:', error)
  })

  // Prepare watermark if restaurant has logo and user wants it
  const logoUrl = uploadedLogo
    ? await fileToBase64Url(uploadedLogo)
    : selectedRestaurant.value.brand_dna?.logo_url

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
      // Reference image failed to load, continue without it
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
    selectedRestaurant.value.place_id,
    strictnessMode.value
  )

  if (!response.success) {
    throw new Error(response.error || t('contentCreate.imageError', 'Failed to generate image'))
  }

  generatedImageUrl.value = (response as any).imageUrl || ''

  // Wait for post content generation to complete
  await postContentPromise
}

// Easy Mode Generation Handler
async function handleEasyModeGenerate(data: {
  menuItem: any | null
  context: string
  styleTemplate: string
  strictnessMode: 'strict' | 'flexible' | 'creative'
  includeLogo: boolean
  uploadedImage: File | null
  uploadedLogo: File | null
}) {
  try {
    generating.value = true
    generationError.value = null

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
    logoPosition.value = 'bottom-right'

    // Generate prompts
    await generatePromptsFromSelection()

    // Auto-select first image prompt
    if (imagePrompts.value.length > 0) {
      editablePrompt.value = imagePrompts.value[0]

      // Clear previous content
      generatedImageUrl.value = ''
      postText.value = ''
      hashtags.value = []
      publishResults.value = null
      lastSavedPost.value = null

      // Generate the image (pass both uploaded logo and uploaded image for reference)
      await generateImage(data.uploadedLogo, data.uploadedImage)

      // Upload the image to the restaurant's uploaded_images collection
      if (data.uploadedImage && selectedRestaurant.value?.place_id) {
        try {
          await restaurantService.uploadRestaurantImages(
            selectedRestaurant.value.place_id,
            [data.uploadedImage]
          )
        } catch (uploadError) {
          console.error('Failed to save uploaded image to restaurant:', uploadError)
          // Don't fail the entire operation if this fails
        }
      }

      generationError.value = null
      generating.value = false
    } else {
      // No prompts generated - show error
      generating.value = false
      const errorMessage = t('contentCreate.noPrompts', 'No prompts were generated. Please try again.')
      generationError.value = errorMessage
      notificationStore.addNotification({
        type: 'error',
        title: t('scheduler.generationFailed'),
        message: errorMessage,
      })
    }
  } catch (err: any) {
    generating.value = false
    const errorMessage = err.message || t('contentCreate.generateError', 'Failed to generate content')
    generationError.value = errorMessage
    notificationStore.addNotification({
      type: 'error',
      title: t('scheduler.imageGenerationFailed'),
      message: errorMessage,
    })
  }
}

// Easy Mode Publish Handler
async function handleEasyModePublish(data: {
  platforms: string[]
  publishType: 'now' | 'schedule'
  scheduleDate?: string
  scheduleTime?: string
  timezone?: string
  postText?: string
  hashtags?: string[]
}) {
  try {
    if (!generatedImageUrl.value) {
      generationError.value = 'No content to publish. Please generate content first.'
      return
    }

    const platforms = data.platforms || []
    if (platforms.length === 0) {
      generationError.value = t('contentCreate.noPlatformSelected', 'Please select at least one platform')
      return
    }

    publishing.value = true

    // Use edited post text if provided
    const finalPostText = data.postText || postText.value
    const finalHashtags = data.hashtags || hashtags.value

    // Save post as favorite first
    const saveResponse = await api.saveFavorite({
      restaurant_id: selectedRestaurant.value?.id,
      content_type: 'image',
      media_url: generatedImageUrl.value,
      post_text: finalPostText,
      hashtags: finalHashtags,
      platform: platforms[0],
      platforms: platforms,
      prompt: editablePrompt.value,
      menu_items: selectedMenuItems.value,
      context: promptContext.value,
      brand_dna: selectedRestaurant.value?.brand_dna
    })

    if (!saveResponse.success || !saveResponse.data?.favorite?.id) {
      throw new Error('Failed to save post')
    }

    const favoritePostId = saveResponse.data.favorite.id
    lastSavedPost.value = saveResponse.data.favorite

    if (data.publishType === 'schedule') {
      // Schedule the post
      const scheduleResponse = await api.schedulePost({
        favorite_post_id: favoritePostId,
        scheduled_date: data.scheduleDate || props.selectedDate!,
        scheduled_time: data.scheduleTime,
        platforms: platforms,
        timezone: data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone
      })

      if (!scheduleResponse.success) {
        throw new Error('Failed to schedule post')
      }

      publishing.value = false
      showSuccessAndClose()
    } else {
      // Publish now
      await publishToSocialMedia(favoritePostId, platforms, finalPostText, finalHashtags)
    }
  } catch (err: any) {
    console.error('Failed to handle publish:', err)
    generationError.value = err.message || 'Failed to publish post'
    publishing.value = false
  }
}

// Publish to social media platforms
async function publishToSocialMedia(
  favoritePostId: string,
  platforms: string[],
  finalPostText: string,
  finalHashtags: string[]
) {
  const results: PublishResult[] = []

  // Build the message with post text and hashtags
  const message = finalHashtags.length > 0
    ? `${finalPostText}\n\n${finalHashtags.join(' ')}`
    : finalPostText

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
          generatedImageUrl.value
        )

        const postUrl = (response as any).postUrl || response.data?.postUrl
        if (response.success && postUrl) {
          results.push({ platform: 'facebook', success: true, url: postUrl })
          notificationStore.addPublishSuccess('facebook', postUrl)
        } else if ((response as any).code === 'FACEBOOK_RECONNECT_REQUIRED') {
          results.push({ platform: 'facebook', success: false, error: 'Facebook connection expired' })
        } else {
          results.push({ platform: 'facebook', success: false, error: response.error || 'Unknown error' })
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
          generatedImageUrl.value
        )

        const postUrl = (response as any).postUrl || response.data?.postUrl
        if (response.success && postUrl) {
          results.push({ platform: 'instagram', success: true, url: postUrl })
          notificationStore.addPublishSuccess('instagram', postUrl)
        } else {
          results.push({ platform: 'instagram', success: false, error: response.error || 'Failed to publish to Instagram' })
        }
      } catch (err: any) {
        results.push({ platform: 'instagram', success: false, error: err.message || 'Failed to publish' })
      }
    } else {
      results.push({ platform, success: false, error: `${platform} publishing not yet supported` })
    }
  }

  publishing.value = false

  const successfulPlatforms = results.filter(r => r.success)
  const failedPlatforms = results.filter(r => !r.success)

  publishResults.value = {
    success: successfulPlatforms.length > 0,
    platforms: results
  }

  if (successfulPlatforms.length > 0) {
    // Save to calendar as "published"
    try {
      const now = new Date()
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
    } catch (calendarErr) {
      console.warn('Failed to save to calendar:', calendarErr)
    }

    showSuccessAndClose()
  }

  if (failedPlatforms.length > 0 && successfulPlatforms.length === 0) {
    generationError.value = failedPlatforms.map(f => f.error).join('. ')
  }
}

// Advanced Mode Complete Handler
async function handleAdvancedModeComplete(data: any) {
  if (data.onResult) {
    data.onResult({ success: true })
  }
  showSuccessAndClose()
}

// Show success and auto-close
function showSuccessAndClose() {
  showSuccess.value = true
  wizardStep.value = 'success'

  // Auto-close after 2.5 seconds
  setTimeout(() => {
    emit('post-created')
    closeModal()
  }, 2500)
}

// Easy Mode Reset Handler
function handleEasyModeReset() {
  generatedImageUrl.value = ''
  postText.value = ''
  hashtags.value = []
  generationError.value = null
  lastSavedPost.value = null
  publishResults.value = null
  publishing.value = false
  generating.value = false
  selectedMenuItems.value = []
  promptContext.value = ''
  editablePrompt.value = ''
  imagePrompts.value = []
}

// Handle inline feedback from child components (fire-and-forget)
async function handleInlineFeedback(feedbackText: string) {
  console.log('[FullCreationWizard] Received inline feedback:', feedbackText)

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
    console.log('[FullCreationWizard] Inline feedback submitted successfully')
  } catch (error) {
    console.error('Failed to submit inline feedback:', error)
    // Don't block the flow if feedback fails
  }
}
</script>

<template>
  <Teleport to="body">
    <div v-if="modelValue" class="modal-overlay" @click.self="closeModal">
      <BaseCard variant="glass-intense" class="wizard-modal">
        <!-- Header -->
        <div class="wizard-header">
          <div class="header-left">
            <button
              v-if="wizardStep !== 'choose-method' && wizardStep !== 'success'"
              class="back-btn"
              @click="goBack"
            >
              <MaterialIcon icon="arrow_back" size="md" :color="'var(--text-secondary)'" />
            </button>
            <div class="header-title">
              <h2 class="wizard-title">
                <template v-if="wizardStep === 'choose-method'">
                  {{ $t('scheduler.createPostFor', 'Create Post for') }} {{ formattedDate }}
                </template>
                <template v-else-if="wizardStep === 'choose-restaurant'">
                  {{ $t('scheduler.selectRestaurant', 'Select Restaurant') }}
                </template>
                <template v-else-if="wizardStep === 'create'">
                  {{ $t('scheduler.createContent', 'Create Content') }}
                </template>
                <template v-else-if="wizardStep === 'success'">
                  {{ $t('scheduler.success', 'Success!') }}
                </template>
              </h2>
              <p v-if="selectedRestaurant && wizardStep === 'create'" class="wizard-subtitle">
                {{ selectedRestaurant.name }}
              </p>
            </div>
          </div>

          <div class="header-right">
            <!-- Mode Toggle (only in create step) -->
            <ModeToggle
              v-if="wizardStep === 'create'"
              v-model="creationMode"
              class="mode-toggle"
            />
            <button class="wizard-close-btn" @click="closeModal">&times;</button>
          </div>
        </div>

        <!-- Error Alert -->
        <BaseAlert v-if="generationError" type="error" class="wizard-alert">
          {{ generationError }}
        </BaseAlert>

        <!-- Step 1: Choose Method -->
        <div v-if="wizardStep === 'choose-method'" class="wizard-body">
          <p class="wizard-description">{{ $t('scheduler.howToCreate', 'How would you like to create your post?') }}</p>

          <div class="creation-options">
            <!-- From Saved Posts Option -->
            <button
              class="creation-option-card"
              @click="selectMethod('saved')"
            >
              <div class="option-icon">✨</div>
              <h3 class="option-title">{{ $t('scheduler.fromSavedPosts', 'From Saved Posts') }}</h3>
              <p class="option-description">
                {{ $t('scheduler.chooseSavedPosts', 'Choose from your saved posts') }}
              </p>
            </button>

            <!-- Create New Option -->
            <button
              class="creation-option-card"
              @click="selectMethod('new')"
            >
              <div class="option-icon-logo">
                <img src="/src/assets/socialchef_logo.svg" alt="SocialChef" class="chef-logo-icon" />
              </div>
              <h3 class="option-title">{{ $t('scheduler.createNew', 'Create New') }}</h3>
              <p class="option-description">
                {{ $t('scheduler.cookUpFresh', 'Cook up fresh content') }}
              </p>
            </button>
          </div>
        </div>

        <!-- Step 2: Choose Restaurant -->
        <div v-else-if="wizardStep === 'choose-restaurant'" class="wizard-body">
          <p class="wizard-description">{{ $t('scheduler.whichRestaurant', 'Which restaurant is this post for?') }}</p>

          <div class="restaurants-list">
            <div
              v-for="restaurant in restaurants"
              :key="restaurant.id"
              class="restaurant-item"
              @click="selectRestaurant(restaurant)"
            >
              <div v-if="restaurant.brand_dna?.logo_url" class="item-logo">
                <img :src="restaurant.brand_dna.logo_url" :alt="restaurant.name" />
              </div>
              <div v-else class="item-logo placeholder">
                <span class="placeholder-icon">🏪</span>
              </div>

              <div class="item-info">
                <h4 class="item-name">{{ restaurant.name }}</h4>
                <p class="item-address">{{ restaurant.address }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Step 3: Create Content -->
        <div v-else-if="wizardStep === 'create'" class="wizard-body creation-step">
          <!-- Loading Menu -->
          <div v-if="loadingMenu" class="loading-state">
            <div class="spinner"></div>
            <p>{{ $t('scheduler.loadingMenu', 'Loading menu items...') }}</p>
          </div>

          <!-- Easy Mode -->
          <EasyModeCreation
            v-else-if="creationMode === 'easy' && selectedRestaurant"
            ref="easyModeCreationRef"
            :restaurant="selectedRestaurant"
            :menu-items="menuItems"
            :generating="generating"
            :generated-image-url="generatedImageUrl"
            :post-text="postText"
            :hashtags="hashtags"
            :publishing="publishing"
            :publish-results="publishResults"
            :error="generationError"
            :initial-schedule-date="props.selectedDate || undefined"
            :lock-date="true"
            @back="goBack"
            @generate="handleEasyModeGenerate"
            @publish="handleEasyModePublish"
            @reset="handleEasyModeReset"
            @feedback="handleInlineFeedback"
          />

          <!-- Advanced Mode -->
          <AdvancedModeCreation
            v-else-if="creationMode === 'advanced' && selectedRestaurant"
            ref="advancedModeCreationRef"
            :restaurant="selectedRestaurant"
            :menu-items="menuItems"
            :initial-schedule-date="props.selectedDate || undefined"
            :lock-date="true"
            @back="goBack"
            @feedback="handleInlineFeedback"
            @complete="handleAdvancedModeComplete"
          />
        </div>

        <!-- Step 4: Success -->
        <div v-else-if="wizardStep === 'success'" class="wizard-body success-step">
          <div class="success-content">
            <div class="success-icon">
              <MaterialIcon icon="check_circle" size="xl" :color="'var(--success-text)'" />
            </div>
            <h3 class="success-title">{{ $t('scheduler.postScheduled', 'Post Scheduled Successfully!') }}</h3>
            <p class="success-subtitle">{{ $t('scheduler.autoClose', 'This modal will close automatically...') }}</p>
          </div>
        </div>
      </BaseCard>

    </div>
  </Teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: var(--space-lg);
}

.wizard-modal {
  width: 100%;
  max-width: 1000px;
  max-height: 90vh;
  overflow-y: auto;
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.wizard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: var(--space-lg);
  border-bottom: 1px solid rgba(212, 175, 55, 0.2);
  margin-bottom: var(--space-xl);
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.back-btn {
  background: transparent;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: var(--space-sm);
  cursor: pointer;
  transition: var(--transition-base);
  display: flex;
  align-items: center;
  justify-content: center;
}

.back-btn:hover {
  border-color: var(--gold-primary);
  background: var(--gold-subtle);
}

.header-title {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.wizard-title {
  font-family: var(--font-heading);
  font-size: var(--text-xl);
  color: var(--text-primary);
  margin: 0;
}

.wizard-subtitle {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin: 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: var(--space-lg);
}

.mode-toggle {
  margin-right: var(--space-md);
}

.wizard-close-btn {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  font-size: var(--text-2xl);
  cursor: pointer;
  padding: var(--space-sm);
  line-height: 1;
  transition: color var(--transition-base);
}

.wizard-close-btn:hover {
  color: var(--text-primary);
}

.wizard-alert {
  margin-bottom: var(--space-lg);
}

.wizard-body {
  text-align: center;
}

.wizard-description {
  color: var(--text-secondary);
  margin-bottom: var(--space-2xl);
}

/* Creation Options */
.creation-options {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-lg);
}

.creation-option-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-2xl) var(--space-lg);
  background: rgba(0, 0, 0, 0.3);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all var(--transition-base);
  text-align: center;
  color: var(--text-primary);
}

.creation-option-card:hover {
  border-color: rgba(212, 175, 55, 0.5);
  background: rgba(212, 175, 55, 0.1);
  transform: translateY(-4px);
}

.option-icon {
  font-size: 48px;
}

.option-icon-logo {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chef-logo-icon {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.option-title {
  font-family: var(--font-heading);
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  margin: 0;
}

.option-description {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin: 0;
}

/* Restaurants List */
.restaurants-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  max-height: 400px;
  overflow-y: auto;
  text-align: left;
}

.restaurant-item {
  display: flex;
  align-items: center;
  gap: var(--space-lg);
  padding: var(--space-lg);
  background: rgba(26, 26, 26, 0.6);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s ease;
}

.restaurant-item:hover {
  background: rgba(26, 26, 26, 0.8);
  border-color: rgba(212, 175, 55, 0.3);
  transform: translateX(4px);
}

.item-logo {
  width: 56px;
  height: 56px;
  border-radius: var(--radius-md);
  overflow: hidden;
  flex-shrink: 0;
  background: var(--bg-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.item-logo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.item-logo.placeholder {
  background: rgba(212, 175, 55, 0.1);
}

.placeholder-icon {
  font-size: var(--text-2xl);
}

.item-info {
  flex: 1;
  min-width: 0;
}

.item-name {
  font-family: var(--font-heading);
  font-size: var(--text-lg);
  color: var(--text-primary);
  margin: 0 0 var(--space-xs) 0;
}

.item-address {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Creation Step */
.creation-step {
  text-align: left;
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-4xl);
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
  to {
    transform: rotate(360deg);
  }
}

/* Success Step */
.success-step {
  padding: var(--space-4xl);
}

.success-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-lg);
}

.success-icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: var(--success-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: scaleIn 0.3s ease;
}

@keyframes scaleIn {
  from {
    transform: scale(0);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.success-title {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  color: var(--success-text);
  margin: 0;
}

.success-subtitle {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin: 0;
}

/* Scrollbar styling */
.restaurants-list::-webkit-scrollbar,
.wizard-modal::-webkit-scrollbar {
  width: 6px;
}

.restaurants-list::-webkit-scrollbar-track,
.wizard-modal::-webkit-scrollbar-track {
  background: transparent;
}

.restaurants-list::-webkit-scrollbar-thumb,
.wizard-modal::-webkit-scrollbar-thumb {
  background: rgba(212, 175, 55, 0.3);
  border-radius: var(--radius-full);
}

.restaurants-list::-webkit-scrollbar-thumb:hover,
.wizard-modal::-webkit-scrollbar-thumb:hover {
  background: rgba(212, 175, 55, 0.5);
}

/* Responsive */
@media (max-width: 768px) {
  .wizard-modal {
    max-width: 100%;
    margin: var(--space-sm);
  }

  .creation-options {
    grid-template-columns: 1fr;
  }

  .wizard-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-md);
  }

  .header-right {
    width: 100%;
    justify-content: space-between;
  }
}
</style>
