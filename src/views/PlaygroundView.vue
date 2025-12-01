<template>
  <div class="playground-view">
    <GradientBackground />

    <div class="container">
      <!-- Loading State -->
      <div v-if="loadingRestaurants" class="loading-container">
        <div class="spinner cooking"></div>
        <p>Cooking up your restaurants...</p>
      </div>

      <!-- Main Content -->
      <div v-else class="playground-content">
        <!-- Step 1: Restaurant Selection (shown when no restaurant is selected) -->
        <RestaurantSelectionGrid
          v-if="!selectedRestaurant"
          :restaurants="restaurants"
          @select="selectRestaurantById"
          @edit="editRestaurant"
          @add-new="router.push('/restaurants')"
        />

        <!-- Step 2: Content Creation (shown after restaurant is selected) -->
        <div v-else class="content-creation-view">
          <!-- Selected Restaurant Header with Back Button and Mode Toggle -->
          <BaseCard variant="glass-intense" class="selected-restaurant-header">
            <div class="header-content">
              <div class="header-left">
                <button class="back-button" @click="clearRestaurantSelection" title="Back to restaurant selection">
                  ← Back
                </button>
                <div class="selected-restaurant-info">
                  <div v-if="selectedRestaurant.brand_dna?.logo_url" class="header-logo">
                    <img :src="selectedRestaurant.brand_dna.logo_url" :alt="selectedRestaurant.name" />
                  </div>
                  <div>
                    <h3 class="header-restaurant-name">{{ selectedRestaurant.name }}</h3>
                    <p class="header-restaurant-address">{{ selectedRestaurant.address }}</p>
                  </div>
                </div>
              </div>
              <ModeToggle class="header-mode-toggle" />
            </div>
          </BaseCard>

          <!-- Easy Mode Creation -->
          <EasyModeCreation
            v-if="preferencesStore.creationMode === 'easy'"
            :restaurant="selectedRestaurant"
            :menu-items="menuItems"
            :generating="easyModeGenerating"
            @back="handleEasyModeBack"
            @generate="handleEasyModeGenerate"
          />

          <!-- Advanced Mode (existing flow) -->
          <div v-else class="advanced-mode-content">
          <!-- Platform Selection - Appears First -->
          <BaseCard variant="glass" class="platform-selection-card">
            <h3 class="card-title">Select Platform</h3>
            <p class="card-subtitle">Choose where you'll post this content</p>

            <div class="platform-grid">
              <PlatformSelectionCard
                v-for="platform in availablePlatforms"
                :key="platform.value"
                :platform="platform"
                :selected="selectedPlatforms.includes(platform.value)"
                @toggle="togglePlatform"
                @connect="handlePlatformConnected"
              />
            </div>
          </BaseCard>

          <!-- Menu Items Reference -->
          <BaseCard v-if="menuItems.length > 0" variant="glass" class="menu-reference-card">
          <div class="menu-header">
            <div>
              <h3 class="card-title">Menu Items ({{ menuItems.length }})</h3>
              <p class="card-subtitle">Select one or more items to create combo prompts</p>
            </div>

            <!-- Pagination - Top Right -->
            <div v-if="totalPages > 1" class="pagination-top">
              <button
                @click="currentPage--"
                :disabled="currentPage === 1"
                class="pagination-btn-compact"
              >
                ←
              </button>
              <span class="pagination-info-compact">
                {{ currentPage }} / {{ totalPages }}
              </span>
              <button
                @click="currentPage++"
                :disabled="currentPage === totalPages"
                class="pagination-btn-compact"
              >
                →
              </button>
            </div>
          </div>

          <div ref="menuGridContainer" class="menu-items-grid">
            <div
              v-for="(item, index) in paginatedMenuItems"
              :key="index"
              :class="['menu-item-card', { 'selected': isItemSelected(item) }]"
              @click="toggleMenuItem(item)"
            >
              <img v-if="item.imageUrl" :src="item.imageUrl" :alt="item.name" class="menu-item-image" />
              <div class="menu-item-info">
                <h4 class="menu-item-name">{{ item.name }}</h4>
                <p v-if="item.price" class="menu-item-price">{{ item.price }}</p>
              </div>
              <div v-if="isItemSelected(item)" class="menu-selected-badge">✓</div>
            </div>
          </div>

          <!-- Prompt Context Input - Appears after menu selection -->
          <div v-if="selectedMenuItems.length > 0" class="prompt-context-section">
            <div class="context-inputs-grid">
              <div class="context-input-wrapper">
                <label for="promptContext" class="context-label">
                  Campaign Context (Optional)
                </label>
                <input
                  id="promptContext"
                  v-model="promptContext"
                  type="text"
                  class="context-input"
                  placeholder="e.g., 20% OFF, COMBO DEAL, LIMITED TIME..."
                />
                <p class="context-hint">Add promotional text for sticker overlay</p>
              </div>
            </div>

            <!-- Sticker Customization (only show if campaign context is entered) -->
            <div v-if="promptContext" class="sticker-customization">
              <h4 class="sticker-title">📍 Promotional Sticker Settings</h4>
              <div class="sticker-options-grid">
                <div class="context-input-wrapper">
                  <label for="stickerStyle" class="context-label">
                    Sticker Style
                  </label>
                  <select id="stickerStyle" v-model="stickerStyle" class="context-select">
                    <option value="bold">Bold Rectangle</option>
                    <option value="outlined">Outlined Box</option>
                    <option value="ribbon">Ribbon Banner</option>
                    <option value="badge">Circular Badge</option>
                    <option value="starburst">Starburst Star</option>
                  </select>
                  <p class="context-hint">Visual style of the promotional sticker</p>
                </div>

                <div class="context-input-wrapper">
                  <label for="stickerPosition" class="context-label">
                    Sticker Position
                  </label>
                  <select id="stickerPosition" v-model="stickerPosition" class="context-select">
                    <option value="top-left">Top Left</option>
                    <option value="top-center">Top Center</option>
                    <option value="top-right">Top Right</option>
                    <option value="center">Center</option>
                    <option value="bottom-left">Bottom Left</option>
                    <option value="bottom-right">Bottom Right</option>
                  </select>
                  <p class="context-hint">Where to place the sticker on image</p>
                </div>
              </div>
            </div>

            <!-- Logo Watermark Settings -->
            <div v-if="selectedRestaurant?.brand_dna?.logo_url" class="logo-settings">
              <h4 class="sticker-title">🏷️ Logo Watermark Settings</h4>
              <div class="sticker-options-grid">
                <div class="context-input-wrapper">
                  <label class="checkbox-label">
                    <input type="checkbox" v-model="includeLogo" class="checkbox-input" />
                    <span>Include Logo Watermark</span>
                  </label>
                  <p class="context-hint">Add your restaurant logo to the image</p>
                </div>

                <div v-if="includeLogo" class="context-input-wrapper">
                  <label for="logoPosition" class="context-label">
                    Logo Position
                  </label>
                  <select id="logoPosition" v-model="logoPosition" class="context-select">
                    <option value="top-left">Top Left</option>
                    <option value="top-right">Top Right</option>
                    <option value="bottom-left">Bottom Left</option>
                    <option value="bottom-right">Bottom Right</option>
                  </select>
                  <p class="context-hint">Where to place the logo watermark</p>
                </div>
              </div>

              <!-- Live Banner Preview -->
              <StickerPreview
                :promotional-text="promptContext"
                :sticker-style="stickerStyle"
                :sticker-position="stickerPosition"
                :brand-color="getBrandColor()"
                :show-logo="includeLogo"
                :logo-url="selectedRestaurant?.brand_dna?.logo_url"
                :logo-alt="selectedRestaurant?.name"
                :logo-position="logoPosition"
              />
            </div>

            <div class="selection-actions">
              <span class="selection-count">{{ selectedMenuItems.length }} item{{ selectedMenuItems.length > 1 ? 's' : '' }} selected</span>
              <BaseButton variant="primary" size="medium" @click="generatePromptsFromSelection" :disabled="loadingPrompts || selectedPlatforms.length === 0">
                {{ loadingPrompts ? 'Generating...' : 'Generate Prompts' }}
              </BaseButton>
              <BaseButton variant="ghost" size="small" @click="clearSelection">
                Clear
              </BaseButton>
            </div>
          </div>
        </BaseCard>

        <!-- Content Generator -->
        <BaseCard v-if="selectedRestaurant" variant="glass-intense" class="generator-card">
          <div class="generator-header">
            <h3 class="card-title">{{ selectedRestaurant.name }}</h3>
            <span class="restaurant-badge">{{ getCuisineType(selectedRestaurant) }}</span>
          </div>

          <!-- Content Generator Tabs -->
          <ContentGeneratorTabs
            v-model:activeTab="activeTab"
            v-model:editablePrompt="editablePrompt"
            :loading="loadingPrompts"
            :image-prompts="imagePrompts"
            :video-prompts="videoPrompts"
            :selected-image-index="selectedImagePromptIndex"
            :selected-video-index="selectedVideoPromptIndex"
            :selected-prompt="selectedPrompt"
            @refresh="generatePrompts"
            @select-image="selectImagePrompt"
            @select-video="selectVideoPrompt"
          />

          <!-- Image Generation Section -->
          <div v-if="activeTab === 'image'" class="generation-section">
            <BaseAlert v-if="message && messageType" :type="messageType" class="generation-alert">
              {{ message }}
            </BaseAlert>

            <BaseButton
              variant="primary"
              size="large"
              full-width
              :disabled="!selectedPrompt || generatingImage || !canGenerate"
              @click="generateImage"
            >
              {{ generatingImage ? 'Generating Image...' : 'Generate Image (1 credit)' }}
            </BaseButton>

            <div v-if="generatedImageUrl" class="generated-content">
              <h4>Generated Image:</h4>
              <img :src="generatedImageUrl" alt="Generated marketing image" class="generated-image" />
              <div class="content-actions">
                <a :href="generatedImageUrl" download class="download-btn">
                  ⬇️ Download Image
                </a>
                <BaseButton
                  v-if="lastSavedPost || generatedPostContent"
                  variant="primary"
                  size="medium"
                  @click="openScheduleModal"
                >
                  📅 Schedule Post
                </BaseButton>
                <BaseButton
                  v-if="(lastSavedPost || generatedPostContent) && selectedPlatforms.includes('facebook')"
                  variant="primary"
                  size="medium"
                  @click="publishToFacebook"
                  :disabled="publishingToFacebook"
                >
                  {{ publishingToFacebook ? 'Publishing...' : '📤 Publish to Facebook' }}
                </BaseButton>
              </div>
            </div>

            <!-- Post Content Section -->
            <div v-if="generatedPostContent && generatedImageUrl" class="post-content-section">
              <div class="post-content-header">
                <h4 class="post-content-title">Post Content</h4>
                <div class="platform-badges">
                  <span
                    v-for="platformValue in selectedPlatforms"
                    :key="platformValue"
                    class="platform-badge"
                  >
                    {{ availablePlatforms.find(p => p.value === platformValue)?.icon }}
                    {{ availablePlatforms.find(p => p.value === platformValue)?.label }}
                  </span>
                </div>
              </div>

              <div class="post-content-box">
                <div class="post-text-wrapper">
                  <p class="post-text">{{ generatedPostContent.postText }}</p>
                  <button @click="copyToClipboard(generatedPostContent.postText)" class="copy-btn" title="Copy post text">
                    📋 Copy
                  </button>
                </div>

                <div v-if="generatedPostContent.hashtags.length > 0" class="post-hashtags-wrapper">
                  <div class="post-hashtags">
                    <span v-for="(tag, idx) in generatedPostContent.hashtags" :key="idx" class="hashtag">
                      {{ tag }}
                    </span>
                  </div>
                  <button @click="copyToClipboard(generatedPostContent.hashtags.join(' '))" class="copy-btn-small" title="Copy hashtags">
                    📋
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Video Generation Section -->
          <div v-if="activeTab === 'video'" class="generation-section">
            <BaseAlert v-if="message && messageType" :type="messageType" class="generation-alert">
              {{ message }}
            </BaseAlert>

            <!-- Video Options -->
            <VideoOptionsPanel
              v-model:duration="videoDuration"
              v-model:aspect-ratio="videoAspectRatio"
              v-model:resolution="videoResolution"
            />

            <BaseButton
              variant="primary"
              size="large"
              full-width
              :disabled="!selectedPrompt || generatingVideo || !canGenerate"
              @click="generateVideo"
            >
              {{ generatingVideo ? `Generating Video... ${videoProgress}%` : 'Generate Video (5 credits)' }}
            </BaseButton>

            <div v-if="generatingVideo" class="progress-bar">
              <div class="progress-fill" :style="{ width: `${videoProgress}%` }"></div>
            </div>

            <div v-if="generatedVideoUrl" class="generated-content">
              <h4>Generated Video:</h4>
              <video :src="generatedVideoUrl" controls class="generated-video"></video>
              <div class="content-actions">
                <a :href="generatedVideoUrl" download class="download-btn">
                  ⬇️ Download Video
                </a>
                <BaseButton
                  v-if="lastSavedPost || generatedPostContent"
                  variant="primary"
                  size="medium"
                  @click="openScheduleModal"
                >
                  📅 Schedule Post
                </BaseButton>
                <BaseButton
                  v-if="(lastSavedPost || generatedPostContent) && selectedPlatforms.includes('facebook')"
                  variant="primary"
                  size="medium"
                  @click="publishToFacebook"
                  :disabled="publishingToFacebook"
                >
                  {{ publishingToFacebook ? 'Publishing...' : '📤 Publish to Facebook' }}
                </BaseButton>
              </div>
            </div>

            <!-- Post Content Section -->
            <div v-if="generatedPostContent && generatedVideoUrl" class="post-content-section">
              <div class="post-content-header">
                <h4 class="post-content-title">Post Content</h4>
                <div class="platform-badges">
                  <span
                    v-for="platformValue in selectedPlatforms"
                    :key="platformValue"
                    class="platform-badge"
                  >
                    {{ availablePlatforms.find(p => p.value === platformValue)?.icon }}
                    {{ availablePlatforms.find(p => p.value === platformValue)?.label }}
                  </span>
                </div>
              </div>

              <div class="post-content-box">
                <div class="post-text-wrapper">
                  <p class="post-text">{{ generatedPostContent.postText }}</p>
                  <button @click="copyToClipboard(generatedPostContent.postText)" class="copy-btn" title="Copy post text">
                    📋 Copy
                  </button>
                </div>

                <div v-if="generatedPostContent.hashtags.length > 0" class="post-hashtags-wrapper">
                  <div class="post-hashtags">
                    <span v-for="(tag, idx) in generatedPostContent.hashtags" :key="idx" class="hashtag">
                      {{ tag }}
                    </span>
                  </div>
                  <button @click="copyToClipboard(generatedPostContent.hashtags.join(' '))" class="copy-btn-small" title="Copy hashtags">
                    📋
                  </button>
                </div>
              </div>
            </div>
          </div>
        </BaseCard>
          </div>
          <!-- End Advanced Mode Content -->
        </div>
        <!-- End Content Creation View -->
      </div>
      <!-- End Playground Content -->
    </div>
    <!-- End Container -->

    <!-- Facebook Onboarding Modal -->
    <FacebookOnboardingModal
      v-model="showFacebookOnboardingModal"
      @update:modelValue="handleFacebookOnboardingClose"
      @connected="handleFacebookOnboardingComplete"
    />

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

    <!-- Schedule Modal -->
    <ScheduleModal
      v-model="showScheduleModal"
      :favorite-post="postToSchedule"
      :preselected-date="preselectedDate"
      @scheduled="handleScheduled"
    />

    <!-- Restaurant Details Modal -->
    <RestaurantDetailsModal
      v-model="showRestaurantDetailsModal"
      :restaurant="restaurantToEdit"
      @updated="handleRestaurantUpdated"
      @deleted="handleRestaurantDeleted"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useFacebookStore } from '../stores/facebook'
import { usePreferencesStore } from '../stores/preferences'
import { useLocaleStore } from '../stores/locale'
import { useRestaurantsStore } from '../stores/restaurants'
import { useSocialAccounts } from '../composables/useSocialAccounts'
import { useContentForm } from '../composables/useContentForm'
import GradientBackground from '../components/GradientBackground.vue'
import BaseCard from '../components/BaseCard.vue'
import BaseButton from '../components/BaseButton.vue'
import BaseAlert from '../components/BaseAlert.vue'
import PlatformSelectionCard from '../components/PlatformSelectionCard.vue'
import ScheduleModal from '../components/ScheduleModal.vue'
import EasyModeCreation from '../components/EasyModeCreation.vue'
import FacebookOnboardingModal from '../components/FacebookOnboardingModal.vue'
import GenerationResultModal from '../components/GenerationResultModal.vue'
import ModeToggle from '../components/ModeToggle.vue'
import { RestaurantSelectionGrid, StickerPreview, VideoOptionsPanel, ContentGeneratorTabs, RestaurantDetailsModal } from '../components/playground'
import { type SavedRestaurant } from '../services/restaurantService'
import { api } from '../services/api'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const facebookStore = useFacebookStore()
const preferencesStore = usePreferencesStore()
const localeStore = useLocaleStore()
const restaurantsStore = useRestaurantsStore()
const socialAccounts = useSocialAccounts()

// Content form state (menu items, platforms, sticker/logo options)
const contentForm = useContentForm()
const {
  selectedMenuItems,
  toggleMenuItem,
  isItemSelected,
  selectedPlatforms,
  availablePlatforms,
  togglePlatform,
  promptContext,
  stickerStyle,
  stickerPosition,
  includeLogo,
  logoPosition,
  clearAll: clearContentForm,
} = contentForm

// Restaurant selection - uses store
const restaurants = computed(() => restaurantsStore.restaurants)
const selectedRestaurantId = ref('')
const selectedRestaurant = computed(() =>
  restaurants.value.find(r => r.id === selectedRestaurantId.value)
)
const loadingRestaurants = computed(() => restaurantsStore.loading)

// Playground state
const activeTab = ref<'image' | 'video'>('image')

// AI-generated prompts
const imagePrompts = ref<string[]>([])
const videoPrompts = ref<string[]>([])
const selectedImagePromptIndex = ref<number | null>(null)
const selectedVideoPromptIndex = ref<number | null>(null)
const loadingPrompts = ref(false)
const editablePrompt = ref('')

// Selected prompt based on active tab
const selectedPrompt = computed(() => {
  if (activeTab.value === 'image' && selectedImagePromptIndex.value !== null) {
    return imagePrompts.value[selectedImagePromptIndex.value]
  } else if (activeTab.value === 'video' && selectedVideoPromptIndex.value !== null) {
    return videoPrompts.value[selectedVideoPromptIndex.value]
  }
  return null
})

// Image generation
const generatingImage = ref(false)
const generatedImageUrl = ref('')

// Video generation
const generatingVideo = ref(false)
const generatedVideoUrl = ref('')
const videoOperationId = ref('')
const videoModelId = ref('')
const videoProgress = ref(0)
const videoPollingTimer = ref<number | null>(null)

// Post content
const generatingPostContent = ref(false)
const generatedPostContent = ref<{
  postText: string
  hashtags: string[]
} | null>(null)

// Video options
const videoDuration = ref<4 | 6 | 8>(8)
const videoAspectRatio = ref<'16:9' | '9:16'>('16:9')
const videoResolution = ref<'720p' | '1080p'>('720p')

// Messages
const message = ref('')
const messageType = ref<'success' | 'error' | 'info'>('info')

// Saving and Scheduling (posts are auto-saved after generation)
const lastSavedPost = ref<any>(null)
const showScheduleModal = ref(false)
const postToSchedule = ref<any>(null)
const preselectedDate = ref<string | null>(null)
const publishingToFacebook = ref(false)
const publishedToFacebook = ref(false)
const facebookPostUrl = ref<string | undefined>(undefined)
const generationError = ref<string | null>(null)
const lastEasyModeData = ref<any>(null) // Store last generation data for retry

// Facebook Onboarding Modal
const showFacebookOnboardingModal = ref(false)
const pendingAction = ref<'publish' | 'schedule' | null>(null)

// Generation Result Modal (Easy Mode)
const showResultModal = ref(false)
const easyModeGenerating = ref(false)

const canGenerate = computed(() => {
  return true // Disabled credit limits for playground
  // return (authStore.usageStats?.remaining_credits || 0) > 0
})

// Menu items from selected restaurant
const menuItems = computed(() => {
  if (!selectedRestaurant.value?.menu?.items) return []
  return selectedRestaurant.value.menu.items.filter((item: any) => item.imageUrl)
})

// Selected Facebook pages for posting (when multiple pages are connected)
const selectedFacebookPages = ref<string[]>([])

// Pagination
const currentPage = ref(1)
const itemsPerPage = ref(12)
const menuGridContainer = ref<HTMLElement | null>(null)

const totalPages = computed(() => {
  return Math.ceil(menuItems.value.length / itemsPerPage.value)
})

const paginatedMenuItems = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return menuItems.value.slice(start, end)
})

// Dynamic items per page calculation
const calculateItemsPerPage = () => {
  if (!menuGridContainer.value) return

  const containerWidth = menuGridContainer.value.offsetWidth
  const containerHeight = window.innerHeight - menuGridContainer.value.getBoundingClientRect().top - 250 // Reserve space for pagination and other elements

  // Grid settings from CSS
  const minCardWidth = 280 // matches CSS minmax(280px, 1fr) for advanced mode
  const gap = 16 // var(--space-lg) = 16px

  // Calculate columns that fit
  const columns = Math.floor((containerWidth + gap) / (minCardWidth + gap))

  // Card has aspect ratio 1:1 for image + additional height for text
  // Estimate total card height: image (280px) + padding (32px) + text (~60px) = ~372px
  const estimatedCardHeight = 372

  // Calculate rows that fit
  const rows = Math.max(2, Math.floor((containerHeight + gap) / (estimatedCardHeight + gap)))

  // Calculate total items
  const calculatedItems = columns * rows

  // Set bounds: minimum 8, maximum 20
  itemsPerPage.value = Math.max(8, Math.min(20, calculatedItems))
}

// toggleMenuItem, isItemSelected, togglePlatform - now from useContentForm composable

const handlePlatformConnected = async () => {
  // Refresh the connected pages data after successful connection
  await facebookStore.loadConnectedPages()
  // Auto-select the newly connected platform
  const connectedPlatform = availablePlatforms.value.find(p => p.isConnected && !selectedPlatforms.value.includes(p.value))
  if (connectedPlatform) {
    togglePlatform(connectedPlatform.value)
  }
}

const clearSelection = () => {
  clearContentForm()
  showMessage('Selection cleared', 'info')
}

// Get brand color for promotional sticker
const getBrandColor = () => {
  const brandColor = selectedRestaurant.value?.brand_dna?.primary_color
  return brandColor || '#FF4444' // Default to red if no brand color
}

onMounted(async () => {
  // Check for scheduleDate URL parameter
  const scheduleDateParam = route.query.scheduleDate
  if (scheduleDateParam && typeof scheduleDateParam === 'string') {
    preselectedDate.value = scheduleDateParam

  }

  await fetchRestaurants()
  await authStore.refreshProfile()

  // Load connected Facebook pages for platform selection
  await facebookStore.loadConnectedPages()

  // Check for restaurant query parameter and auto-select
  const restaurantParam = route.query.restaurant
  if (restaurantParam && typeof restaurantParam === 'string') {
    const restaurant = restaurants.value.find(r => r.place_id === restaurantParam)
    if (restaurant) {
      selectRestaurantById(restaurant.id)

      // Wait for DOM to update, then scroll to content creation view
      await nextTick()
      setTimeout(() => {
        const contentCreationView = document.querySelector('.content-creation-view')
        if (contentCreationView) {
          contentCreationView.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }, 300)
    }
  }

  // Calculate initial items per page for advanced mode grid
  setTimeout(() => {
    calculateItemsPerPage()
  }, 100) // Small delay to ensure DOM is fully rendered

  // Add resize listener
  window.addEventListener('resize', calculateItemsPerPage)
})

onUnmounted(() => {
  stopVideoPolling()
  // Cleanup resize listener
  window.removeEventListener('resize', calculateItemsPerPage)
})

const fetchRestaurants = async () => {
  try {
    await restaurantsStore.fetchRestaurants()

    // Auto-redirect to search if no restaurants saved
    if (restaurants.value.length === 0) {
      router.push('/restaurants')
    }
  } catch (error: any) {
    showMessage('Failed to load restaurants: ' + error.message, 'error')
  }
}

// Restaurant details modal state
const restaurantToEdit = ref<SavedRestaurant | null>(null)
const showRestaurantDetailsModal = ref(false)

const selectRestaurantById = (restaurantId: string) => {
  selectedRestaurantId.value = restaurantId
  onRestaurantChange()
}

const editRestaurant = (restaurant: SavedRestaurant) => {
  restaurantToEdit.value = restaurant
  showRestaurantDetailsModal.value = true
}

const handleRestaurantUpdated = (updatedRestaurant: SavedRestaurant) => {
  // Refresh restaurants from store to get updated data
  restaurantsStore.refreshRestaurants()
  restaurantToEdit.value = updatedRestaurant
  showMessage('Restaurant updated successfully', 'success')
}

const handleRestaurantDeleted = (restaurantId: string) => {
  // Refresh restaurants from store
  restaurantsStore.refreshRestaurants()

  // If this was the selected restaurant, clear selection
  if (selectedRestaurant.value?.id === restaurantId) {
    selectedRestaurantId.value = ''
  }

  restaurantToEdit.value = null
  showRestaurantDetailsModal.value = false
  showMessage('Restaurant deleted successfully', 'success')
}

const clearRestaurantSelection = () => {
  selectedRestaurantId.value = ''
  clearAll()
  selectedMenuItems.value = []
  currentPage.value = 1
}

const formatDate = (dateString: string) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - date.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'today'
  if (diffDays === 1) return 'yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
  return `${Math.floor(diffDays / 365)} years ago`
}

const onRestaurantChange = async () => {
  // Clear previous content
  clearAll()
  selectedMenuItems.value = []
  currentPage.value = 1
}

const selectRandomRestaurant = () => {
  if (restaurants.value.length === 0) return

  const randomIndex = Math.floor(Math.random() * restaurants.value.length)
  selectedRestaurantId.value = restaurants.value[randomIndex].id
  onRestaurantChange()
}

const generatePrompts = async () => {
  if (!selectedRestaurant.value) return

  try {
    loadingPrompts.value = true
    message.value = ''

    const response = await api.generatePrompts(selectedRestaurant.value)

    if (!response.success) {
      showMessage(response.error || 'Failed to generate prompts', 'error')
      return
    }

    imagePrompts.value = (response as any).imagePrompts || []
    videoPrompts.value = (response as any).videoPrompts || []

    // Auto-select first prompt in current tab
    if (activeTab.value === 'image' && imagePrompts.value.length > 0) {
      selectImagePrompt(0)
    } else if (activeTab.value === 'video' && videoPrompts.value.length > 0) {
      selectVideoPrompt(0)
    }

    showMessage('Generated ' + (imagePrompts.value.length + videoPrompts.value.length) + ' creative ideas!', 'success')
  } catch (error: any) {
    showMessage('Failed to generate prompts: ' + error.message, 'error')
  } finally {
    loadingPrompts.value = false
  }
}

const generatePromptsFromSelection = async () => {
  if (!selectedRestaurant.value || selectedMenuItems.value.length === 0) {
    showMessage('Please select at least one menu item', 'error')
    return
  }

  try {
    loadingPrompts.value = true
    message.value = ''

    const response = await api.generatePrompts(
      selectedRestaurant.value,
      selectedMenuItems.value,
      promptContext.value || undefined
    )

    if (!response.success) {
      showMessage(response.error || 'Failed to generate prompts', 'error')
      return
    }

    imagePrompts.value = (response as any).imagePrompts || []
    videoPrompts.value = (response as any).videoPrompts || []

    // Auto-select first prompt in current tab
    if (activeTab.value === 'image' && imagePrompts.value.length > 0) {
      selectImagePrompt(0)
    } else if (activeTab.value === 'video' && videoPrompts.value.length > 0) {
      selectVideoPrompt(0)
    }

    const contextMsg = promptContext.value ? ` with context: "${promptContext.value}"` : ''
    showMessage(`Generated ${imagePrompts.value.length + videoPrompts.value.length} combo prompts for ${selectedMenuItems.value.length} item(s)${contextMsg}!`, 'success')
  } catch (error: any) {
    showMessage('Failed to generate prompts: ' + error.message, 'error')
  } finally {
    loadingPrompts.value = false
  }
}

const selectImagePrompt = (index: number, skipClear = false) => {
  selectedImagePromptIndex.value = index
  editablePrompt.value = imagePrompts.value[index]
  // Clear generated content when switching prompts (unless skipClear is true for easy mode)
  if (!skipClear) {
    generatedImageUrl.value = ''
    generatedPostContent.value = null
    lastSavedPost.value = null
    message.value = ''
  }
}

const selectVideoPrompt = (index: number) => {
  selectedVideoPromptIndex.value = index
  editablePrompt.value = videoPrompts.value[index]
  // Clear generated content when switching prompts
  generatedVideoUrl.value = ''
  generatedPostContent.value = null
  lastSavedPost.value = null
  message.value = ''
}

// Watch activeTab changes to auto-select prompts
watch(activeTab, (tab) => {
  // Auto-select first prompt if none selected
  if (tab === 'image' && selectedImagePromptIndex.value === null && imagePrompts.value.length > 0) {
    selectImagePrompt(0)
  } else if (tab === 'video' && selectedVideoPromptIndex.value === null && videoPrompts.value.length > 0) {
    selectVideoPrompt(0)
  }

  // Update editable prompt
  if (selectedPrompt.value) {
    editablePrompt.value = selectedPrompt.value
  }
})

const clearAll = () => {
  imagePrompts.value = []
  videoPrompts.value = []
  selectedImagePromptIndex.value = null
  selectedVideoPromptIndex.value = null
  editablePrompt.value = ''
  generatedImageUrl.value = ''
  generatedVideoUrl.value = ''
  message.value = ''
}

const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

const getCuisineType = (restaurant: SavedRestaurant): string => {
  if (!restaurant.types || restaurant.types.length === 0) return 'Restaurant'

  const cuisineTypes = ['italian', 'chinese', 'japanese', 'mexican', 'indian', 'thai', 'french']
  for (const type of restaurant.types) {
    const lowerType = type.toLowerCase()
    for (const cuisine of cuisineTypes) {
      if (lowerType.includes(cuisine)) {
        return cuisine.charAt(0).toUpperCase() + cuisine.slice(1)
      }
    }
  }

  return restaurant.types[0].replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

const generateImage = async () => {
  if (!editablePrompt.value || !canGenerate.value) return

  try {
    generatingImage.value = true
    message.value = ''
    generatedImageUrl.value = ''

    // Start post content generation in parallel (don't await)
    // This will run simultaneously with image generation
    let postContentPromise: Promise<void> | null = null
    if (selectedPlatforms.value.length > 0 && selectedRestaurant.value) {
      postContentPromise = generatePostContent('image').catch(error => {
        console.error('Failed to generate post content:', error)
      })
    }

    // Prepare watermark if restaurant has logo and user wants it
    const watermark = (includeLogo.value && selectedRestaurant.value?.brand_dna?.logo_url)
      ? {
          logoPath: selectedRestaurant.value.brand_dna.logo_url,
          position: logoPosition.value as 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center',
          opacity: 80,
          scale: 15,
          padding: 20,
        }
      : undefined

    // Prepare reference image if menu items are selected (use first one)
    let referenceImage: { base64Data: string; mimeType: string } | undefined = undefined
    if (selectedMenuItems.value.length > 0 && selectedMenuItems.value[0].imageUrl) {
      try {
        const firstItem = selectedMenuItems.value[0]
        showMessage(`Generating image inspired by ${firstItem.name}...`, 'info')

        // Convert image URL to base64
        const imageResponse = await fetch(firstItem.imageUrl)
        if (!imageResponse.ok) {
          throw new Error(`Failed to fetch menu image: ${imageResponse.statusText}`)
        }

        const imageBlob = await imageResponse.blob()
        const base64Data = await new Promise<string>((resolve) => {
          const reader = new FileReader()
          reader.onloadend = () => {
            const base64String = reader.result as string
            // Remove data URL prefix
            resolve(base64String.split(',')[1])
          }
          reader.readAsDataURL(imageBlob)
        })

        referenceImage = {
          base64Data,
          mimeType: imageBlob.type,
        }
      } catch (imageError: any) {

        showMessage(`Warning: Could not load reference image. Generating without it.`, 'info')
        // Continue without reference image
      }
    }

    // Prepare promotional sticker if campaign context is provided
    const promotionalSticker = promptContext.value
      ? {
          text: promptContext.value.toUpperCase(), // Convert to uppercase for impact
          position: stickerPosition.value as 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center',
          style: stickerStyle.value as 'badge' | 'ribbon' | 'burst' | 'minimal',
          color: getBrandColor(), // Use brand color or default
          textColor: '#FFFFFF', // White text
          size: 'large' as const,
          rotation: stickerStyle.value === 'ribbon' ? 0 : -5, // No rotation for ribbon, slight for others
        }
      : undefined

    const response = await api.generateImage(
      editablePrompt.value,
      watermark,
      referenceImage,
      promotionalSticker,
      selectedRestaurant.value?.place_id
    )

    if (!response.success) {
      const errorMessage = response.error || 'Failed to generate image'
      showMessage(errorMessage, 'error')
      throw new Error(errorMessage)
    }

    generatedImageUrl.value = (response as any).imageUrl || ''
    console.log('[IMAGE-GEN] Set generatedImageUrl:', generatedImageUrl.value)
    console.log('[IMAGE-GEN] Full response:', JSON.stringify(response, null, 2))

    const watermarked = (response as any).watermarked || false
    const promotionalStickerAdded = (response as any).promotionalStickerAdded || false
    const usedReference = referenceImage !== undefined

    // Build success message
    let successMessage = 'Image generated successfully!'
    const features = []
    if (usedReference) {
      const itemNames = selectedMenuItems.value.map(i => i.name).join(', ')
      features.push(`reference to ${itemNames}`)
    }
    if (watermarked) features.push('logo watermark')
    if (promotionalStickerAdded) features.push(`"${promptContext.value}" sticker`)

    if (features.length > 0) {
      successMessage = `Image generated with ${features.join(' and ')}!`
    }

    showMessage(successMessage, 'success')

    // Wait for post content generation to complete if it was started
    if (postContentPromise) {
      console.log('[IMAGE-GEN] Waiting for post content generation to complete...')
      await postContentPromise
      console.log('[IMAGE-GEN] Post content generation completed')
    }

    // Auto-save the generated content
    await autoSavePost('image')

    // Refresh usage stats
    await authStore.refreshProfile()
  } catch (error: any) {

    showMessage(error.message || 'Failed to generate image', 'error')
  } finally {
    generatingImage.value = false
  }
}

const generatePostContent = async (contentType: 'image' | 'video') => {
  if (selectedPlatforms.value.length === 0 || !selectedRestaurant.value) {
    console.log('[POST-CONTENT] Skipping - no platforms or restaurant selected')
    return
  }

  try {
    generatingPostContent.value = true
    console.log('[POST-CONTENT] Starting post content generation...')

    const menuItemNames = selectedMenuItems.value.length > 0
      ? selectedMenuItems.value.map(i => i.name)
      : ['Featured dish']

    // Use the first selected platform for content generation
    // The content will be suitable for all selected platforms
    const primaryPlatform = selectedPlatforms.value[0]
    console.log('[POST-CONTENT] Platform:', primaryPlatform, 'Restaurant:', selectedRestaurant.value.name, 'Items:', menuItemNames)

    const response = await api.generatePostContent(
      primaryPlatform,
      selectedRestaurant.value.name,
      menuItemNames,
      contentType,
      promptContext.value || undefined,
      selectedRestaurant.value.brand_dna,
      localeStore.currentLocale
    )

    console.log('[POST-CONTENT] API response received:', response)
    console.log('[POST-CONTENT] Response keys:', Object.keys(response))
    console.log('[POST-CONTENT] Response.data:', (response as any).data)

    if (!response.success) {
      console.error('[POST-CONTENT] Generation failed:', response.error)
      throw new Error(response.error || 'Failed to generate post content')
    }

    // The response might be in response.data instead of response directly
    const data = (response as any).data || response
    console.log('[POST-CONTENT] Using data:', data)
    console.log('[POST-CONTENT] Data keys:', Object.keys(data))
    console.log('[POST-CONTENT] postText:', data.postText)
    console.log('[POST-CONTENT] hashtags:', data.hashtags)

    generatedPostContent.value = {
      postText: data.postText || '',
      hashtags: data.hashtags || [],
    }

    console.log('[POST-CONTENT] Set generatedPostContent:', generatedPostContent.value)

  } catch (error: any) {
    console.error('[POST-CONTENT] Error in generatePostContent:', error)
    throw error
  } finally {
    generatingPostContent.value = false
    console.log('[POST-CONTENT] Finished (generatingPostContent = false)')
  }
}

const generateVideo = async () => {
  if (!editablePrompt.value || !canGenerate.value) return

  try {
    generatingVideo.value = true
    message.value = ''
    generatedVideoUrl.value = ''
    videoProgress.value = 0

    // Start post content generation in parallel (don't await)
    // This will run simultaneously with video generation
    if (selectedPlatforms.value.length > 0 && selectedRestaurant.value) {
      generatePostContent('video').catch(error => {
        console.error('Failed to generate post content:', error)
      })
    }

    let response

    // If menu items are selected, use image-to-video with first item
    if (selectedMenuItems.value.length > 0 && selectedMenuItems.value[0].imageUrl) {
      const firstItem = selectedMenuItems.value[0]
      const itemNames = selectedMenuItems.value.map(i => i.name).join(', ')
      showMessage(`Generating video from ${itemNames}...`, 'info')

      // Convert image URL to base64
      const imageResponse = await fetch(firstItem.imageUrl)
      const imageBlob = await imageResponse.blob()
      const base64Data = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => {
          const base64String = reader.result as string
          // Remove data URL prefix
          resolve(base64String.split(',')[1])
        }
        reader.readAsDataURL(imageBlob)
      })

      response = await api.generateVideoFromImage(
        editablePrompt.value,
        base64Data,
        imageBlob.type,
        {
          duration: videoDuration.value,
          aspectRatio: videoAspectRatio.value,
          resolution: videoResolution.value,
        }
      )
    } else {
      // Text-to-video
      response = await api.generateVideo(editablePrompt.value, {
        duration: videoDuration.value,
        aspectRatio: videoAspectRatio.value,
        resolution: videoResolution.value,
      })
    }

    if (!response.success) {
      showMessage(response.error || 'Failed to start video generation', 'error')
      generatingVideo.value = false
      return
    }

    videoOperationId.value = (response as any).operationId || ''
    videoModelId.value = (response as any).modelId || ''

    showMessage('Video generation started...', 'info')

    // Start polling
    startVideoPolling()

    // Start progress simulation
    startProgressSimulation()

    // Refresh usage stats
    await authStore.refreshProfile()
  } catch (error: any) {
    showMessage(error.message || 'Failed to generate video', 'error')
    generatingVideo.value = false
  }
}

const startVideoPolling = () => {
  if (videoPollingTimer.value) return

  videoPollingTimer.value = window.setInterval(async () => {
    try {
      const response = await api.pollVideoOperation(videoOperationId.value, videoModelId.value)

      if (response.success && (response as any).operation) {
        const operation = (response as any).operation

        if (operation.done) {
          stopVideoPolling()
          stopProgressSimulation()

          if (operation.videoUrl) {
            generatedVideoUrl.value = operation.videoUrl
            videoProgress.value = 100
            showMessage('Video generated successfully!', 'success')
            generatingVideo.value = false

            // Auto-save the generated video
            await autoSavePost('video')
          } else if (operation.error) {
            showMessage('Video generation failed: ' + operation.error, 'error')
            generatingVideo.value = false
            videoProgress.value = 0
          }
        }
      }
    } catch (error: any) {

    }
  }, 3000)
}

const stopVideoPolling = () => {
  if (videoPollingTimer.value) {
    clearInterval(videoPollingTimer.value)
    videoPollingTimer.value = null
  }
}

const startProgressSimulation = () => {
  const increment = () => {
    if (videoProgress.value < 95) {
      const remaining = 95 - videoProgress.value
      const step = Math.random() * (remaining / 10)
      videoProgress.value = Math.min(95, videoProgress.value + step)

      if (generatingVideo.value) {
        setTimeout(increment, 1000)
      }
    }
  }

  increment()
}

const stopProgressSimulation = () => {
  // Progress will stop naturally when video is done
}

const showMessage = (msg: string, type: 'success' | 'error' | 'info') => {
  message.value = msg
  messageType.value = type
  setTimeout(() => (message.value = ''), 5000)
}

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    showMessage('Copied to clipboard!', 'success')
  } catch (error) {
    showMessage('Failed to copy', 'error')
  }
}

// Auto-save post after generation (called automatically, no user interaction)
const autoSavePost = async (contentType: 'image' | 'video') => {
  // Skip if already saved
  if (lastSavedPost.value) {
    console.log('[AUTO-SAVE] Skipping - already saved')
    return
  }

  const mediaUrl = contentType === 'image' ? generatedImageUrl.value : generatedVideoUrl.value
  if (!mediaUrl) {
    console.log('[AUTO-SAVE] Skipping - no media URL')
    return
  }

  try {
    console.log('[AUTO-SAVE] Saving post automatically...')

    const postData = {
      restaurant_id: selectedRestaurant.value?.id,
      content_type: contentType,
      media_url: mediaUrl,
      post_text: generatedPostContent.value?.postText,
      hashtags: generatedPostContent.value?.hashtags,
      platform: selectedPlatforms.value.length > 0 ? selectedPlatforms.value[0] : undefined,
      prompt: editablePrompt.value,
      menu_items: selectedMenuItems.value.length > 0 ? selectedMenuItems.value : undefined,
      context: promptContext.value || undefined,
      brand_dna: selectedRestaurant.value?.brand_dna,
    }

    const response = await api.saveFavorite(postData)

    if (response.success) {
      lastSavedPost.value = response.data?.favorite
      console.log('[AUTO-SAVE] Post saved successfully:', lastSavedPost.value?.id)
    } else {
      console.error('[AUTO-SAVE] Failed to save:', response.error)
    }
  } catch (error: any) {
    console.error('[AUTO-SAVE] Error saving post:', error.message)
  }
}

const publishToFacebook = async () => {
  // Check if user has connected Facebook pages
  await facebookStore.loadConnectedPages()

  if (facebookStore.connectedPages.length === 0) {
    showMessage('Please connect your Facebook account first', 'error')
    router.push('/connect-accounts')
    return
  }

  // Check if there's content to publish
  if (!generatedImageUrl.value && !generatedVideoUrl.value) {
    showMessage('No content to publish', 'error')
    return
  }

  if (!generatedPostContent.value) {
    showMessage('No post content generated', 'error')
    return
  }

  try {
    publishingToFacebook.value = true

    // Prepare the post message
    const postMessage = `${generatedPostContent.value.postText}\n\n${generatedPostContent.value.hashtags.join(' ')}`

    // Get the media URL (image or video)
    const mediaUrl = activeTab.value === 'image' ? generatedImageUrl.value : generatedVideoUrl.value

    // Convert the media URL to a file for upload
    const response = await fetch(mediaUrl)
    const blob = await response.blob()
    const file = new File([blob], `content.${activeTab.value === 'image' ? 'jpg' : 'mp4'}`, { type: blob.type })

    // Upload the media to Facebook
    const uploadResponse = await api.uploadFacebookImage(file)

    if (!uploadResponse.success) {
      throw new Error(uploadResponse.error || 'Failed to upload media')
    }

    const uploadedMediaUrl = uploadResponse.data?.imageUrl

    // Post to the first connected page (you can enhance this to allow page selection)
    const pageId = facebookStore.connectedPages[0].pageId

    const postResponse = await api.postToFacebook(pageId, postMessage, uploadedMediaUrl)

    if (!postResponse.success) {
      throw new Error(postResponse.error || 'Failed to post to Facebook')
    }

    // Capture the Facebook post URL from the API response
    // Check both root level and data level for backwards compatibility
    if ((postResponse as any).postUrl) {
      facebookPostUrl.value = (postResponse as any).postUrl
    } else if (postResponse.data?.postUrl) {
      facebookPostUrl.value = postResponse.data.postUrl
    } else if ((postResponse as any).postId) {
      // Fallback: construct URL from post ID
      facebookPostUrl.value = `https://facebook.com/${(postResponse as any).postId}`
    } else if (postResponse.data?.postId) {
      facebookPostUrl.value = `https://facebook.com/${postResponse.data.postId}`
    }

    console.log('Facebook post published:', postResponse) // Debug log
    console.log('Facebook post URL:', facebookPostUrl.value) // Debug log

    showMessage('🎉 Successfully published to Facebook!', 'success')
    publishedToFacebook.value = true

    // Keep modal open so user can see the success message
    // They can close it manually or schedule/save as well
  } catch (error: any) {
    showMessage(error.message || 'Failed to publish to Facebook', 'error')
    publishedToFacebook.value = false
  } finally {
    publishingToFacebook.value = false
  }
}

const openScheduleModal = async () => {
  // Post should already be auto-saved after generation
  if (!lastSavedPost.value) {
    showMessage('No saved post to schedule', 'error')
    return
  }

  postToSchedule.value = lastSavedPost.value
  showScheduleModal.value = true
}

const handleScheduled = (scheduledPost: any) => {
  showMessage(`Post scheduled for ${scheduledPost.scheduled_date}!`, 'success')
  showScheduleModal.value = false
}

// Easy Mode Functions
const handleEasyModeGenerate = async (data: {
  menuItem: any | null
  context: string
  styleTemplate: string
  includeLogo: boolean
  uploadedImage: File | null
}) => {
  try {
    easyModeGenerating.value = true
    generationError.value = null // Reset error state
    lastEasyModeData.value = data // Store for retry

    // Set up the generation with values from Easy Mode
    if (data.menuItem) {
      selectedMenuItems.value = [data.menuItem]
    }
    promptContext.value = data.context

    // Apply style template settings (mapped to existing sticker/prompt styles)
    const styleMapping = {
      vibrant: { stickerStyle: 'bold' as const, stickerPosition: 'top-right' as const },
      elegant: { stickerStyle: 'outlined' as const, stickerPosition: 'top-left' as const },
      minimal: { stickerStyle: 'bold' as const, stickerPosition: 'center' as const },
      rustic: { stickerStyle: 'ribbon' as const, stickerPosition: 'bottom-left' as const },
      luxury: { stickerStyle: 'badge' as const, stickerPosition: 'top-right' as const }
    }

    const selectedStyle = styleMapping[data.styleTemplate as keyof typeof styleMapping] || styleMapping.vibrant

    stickerStyle.value = selectedStyle.stickerStyle as any
    stickerPosition.value = selectedStyle.stickerPosition as any
    includeLogo.value = data.includeLogo
    logoPosition.value = 'bottom-right' // Restaurant logo position

    // Set facebook as default platform for post content generation
    selectedPlatforms.value = ['facebook']

    // Generate prompts
    await generatePromptsFromSelection()

    // Auto-select first image prompt
    if (imagePrompts.value.length > 0) {
      // Use skipClear=true to prevent selectImagePrompt from clearing generated content
      // We'll clear it manually below AFTER opening the modal
      selectImagePrompt(0, true)

      // Wait a tick for editablePrompt to update
      await nextTick()

      // Clear previous content and reset state
      generatedImageUrl.value = ''
      generatedPostContent.value = null
      publishedToFacebook.value = false // Reset published status for new generation
      facebookPostUrl.value = undefined // Reset Facebook post URL
      lastSavedPost.value = null

      // Show result modal immediately with loading states
      showResultModal.value = true
      easyModeGenerating.value = false

      // Generate the image automatically
      // Note: generateImage() will automatically call generatePostContent() at the end
      // The modal will show loading states and populate content as it arrives
      try {
        await generateImage()
        generationError.value = null // Clear error on success
      } catch (imageError: any) {
        // Capture the specific error for display in modal
        generationError.value = imageError.message || 'Failed to generate image. Please try again.'
        console.error('[EasyMode] Image generation error:', imageError)
      }
    } else {
      easyModeGenerating.value = false
      generationError.value = 'No prompts were generated'
      showMessage('No prompts were generated', 'error')
    }
  } catch (error: any) {
    easyModeGenerating.value = false
    generationError.value = error.message || 'Failed to generate content'
    showMessage(error.message || 'Failed to generate content', 'error')
  }
}

const handleRetryGeneration = async () => {
  if (lastEasyModeData.value) {
    await handleEasyModeGenerate(lastEasyModeData.value)
  }
}

const handleEasyModeBack = () => {
  clearRestaurantSelection()
}

// Facebook Onboarding Functions
const checkFacebookConnectionAndProceed = (action: 'publish' | 'schedule') => {
  if (facebookStore.connectedPages.length === 0 && !preferencesStore.hasSeenFacebookOnboarding) {
    // Show onboarding modal
    pendingAction.value = action
    showFacebookOnboardingModal.value = true
  } else {
    // Proceed with action
    if (action === 'publish') {
      publishToFacebook()
    } else if (action === 'schedule') {
      openScheduleModal()
    }
  }
}

const handleFacebookOnboardingComplete = () => {
  showFacebookOnboardingModal.value = false
  preferencesStore.markFacebookOnboardingSeen()

  // Execute pending action if user connected
  if (facebookStore.connectedPages.length > 0 && pendingAction.value) {
    if (pendingAction.value === 'publish') {
      publishToFacebook()
    } else if (pendingAction.value === 'schedule') {
      openScheduleModal()
    }
  }

  pendingAction.value = null
}

const handleFacebookOnboardingClose = () => {
  showFacebookOnboardingModal.value = false
  pendingAction.value = null
}

// Result Modal Functions
const handleResultPublish = async () => {
  // Don't close the modal - let user see publishing progress
  await publishToFacebook()
}

const handleResultSchedule = () => {
  // Don't close the modal - open schedule modal alongside
  openScheduleModal()
}

const handleResultConnectFacebook = async () => {
  showResultModal.value = false
  try {
    await facebookStore.connectFacebook()
    showMessage('Facebook connected successfully!', 'success')
    // Reopen the result modal so user can publish/schedule
    showResultModal.value = true
  } catch (error: any) {
    showMessage(error.message || 'Failed to connect Facebook', 'error')
    // Reopen the result modal even on error so user can try again
    showResultModal.value = true
  }
}

const handleContentUpdated = async (updatedContent: { postText: string; hashtags: string[] }) => {
  // Update local state
  if (generatedPostContent.value) {
    generatedPostContent.value = {
      ...generatedPostContent.value,
      ...updatedContent
    }
  }

  // Update saved favorite if exists
  if (lastSavedPost.value?.id) {
    try {
      await api.updateFavorite(lastSavedPost.value.id, {
        post_text: updatedContent.postText,
        hashtags: updatedContent.hashtags,
      })
      showMessage('Content updated successfully!', 'success')
    } catch (error: any) {
      console.error('Failed to update favorite:', error)
      showMessage('Failed to save changes', 'error')
    }
  }
}
</script>

<style scoped>
.playground-view {
  min-height: 100vh;
  position: relative;
  padding: 2rem 1rem;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
}

.header {
  text-align: center;
  margin-bottom: 3rem;
}

.title {
  font-family: var(--font-heading);
  font-size: 3rem;
  font-weight: 700;
  margin: 0 0 1rem 0;
  background: linear-gradient(135deg, var(--text-primary) 0%, var(--gold-primary) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.subtitle {
  font-size: 1.125rem;
  color: var(--text-secondary);
  margin: 0;
}

.loading-container,
.loading-prompts {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 3rem;
  gap: 1rem;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(212, 175, 55, 0.2);
  border-top-color: var(--gold-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  will-change: transform;
}

.spinner.cooking {
  position: relative;
  border: 3px solid rgba(212, 175, 55, 0.3);
  border-top-color: var(--gold-primary);
  border-right-color: var(--gold-light);
  animation: spin 1s linear infinite;
  will-change: transform;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .spinner,
  .spinner.cooking {
    animation-duration: 2s;
  }
}

.loading-container p,
.loading-prompts p {
  color: var(--text-secondary);
  margin: 0;
}

.playground-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Content Creation View */
.content-creation-view {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.selected-restaurant-header {
  padding: var(--space-lg);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-xl);
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--space-lg);
  flex: 1;
}

.back-button {
  padding: var(--space-sm) var(--space-lg);
  background: transparent;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  font-family: var(--font-body);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  cursor: pointer;
  transition: var(--transition-base);
  white-space: nowrap;
  flex-shrink: 0;
}

.back-button:hover {
  background: var(--bg-elevated);
  border-color: var(--gold-primary);
  color: var(--gold-primary);
}

.header-mode-toggle {
  flex-shrink: 0;
}

.selected-restaurant-info {
  display: flex;
  align-items: center;
  gap: var(--space-lg);
  flex: 1;
  min-width: 0;
}

.header-logo {
  width: 80px;
  height: 80px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(212, 175, 55, 0.2);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem;
}

.header-logo img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.header-restaurant-name {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 0.25rem 0;
}

.header-restaurant-address {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin: 0;
}

/* Header Responsive */
@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    align-items: stretch;
    gap: var(--space-lg);
  }

  .header-left {
    flex-direction: column;
    align-items: stretch;
  }

  .back-button {
    align-self: flex-start;
  }

  .header-mode-toggle {
    align-self: center;
  }

  .selected-restaurant-info {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .header-logo {
    width: 64px;
    height: 64px;
  }
}

.selector-card {
  padding: var(--space-xl);
}

.card-title {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  color: var(--gold-primary);
  margin: 0 0 var(--space-xl) 0;
}

/* Restaurant Grid Selector */
.restaurant-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--space-lg);
}

.restaurant-card-selector {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-lg);
  background: rgba(0, 0, 0, 0.3);
  border: 2px solid rgba(212, 175, 55, 0.2);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all var(--transition-base);
}

.restaurant-card-selector:hover {
  background: rgba(0, 0, 0, 0.4);
  border-color: rgba(212, 175, 55, 0.5);
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.restaurant-card-selector.selected {
  background: rgba(212, 175, 55, 0.15);
  border-color: var(--gold-primary);
  box-shadow: 0 0 20px rgba(212, 175, 55, 0.3);
}

.restaurant-logo-container {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md);
  overflow: hidden;
  background: rgba(255, 255, 255, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
}

.restaurant-logo {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.restaurant-logo-placeholder {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md);
  background: rgba(212, 175, 55, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(212, 175, 55, 0.3);
}

.placeholder-icon {
  font-size: var(--text-2xl);
}

.restaurant-info {
  flex: 1;
  min-width: 0;
}

.restaurant-name-select {
  font-family: var(--font-heading);
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin: 0 0 var(--space-xs) 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.restaurant-address-select {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.selected-indicator {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--gold-primary);
  color: var(--text-on-gold);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--text-xl);
  font-weight: var(--font-bold);
}

.card-subtitle {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: -0.5rem 0 1.5rem 0;
}

/* Menu Items Reference */
.menu-reference-card {
  padding: 1.5rem;
}

.menu-items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 1rem;
}

.menu-item-card {
  position: relative;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(212, 175, 55, 0.2);
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.2s ease;
}

.menu-item-card:hover {
  border-color: rgba(212, 175, 55, 0.5);
  transform: translateY(-2px);
  cursor: pointer;
}

.menu-item-card.selected {
  border-color: var(--gold-primary);
  background: rgba(212, 175, 55, 0.1);
  box-shadow: 0 0 20px rgba(212, 175, 55, 0.3);
}

.menu-selected-badge {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  padding: 0.25rem 0.5rem;
  background: var(--gold-primary);
  color: var(--text-on-gold);
  font-size: 0.75rem;
  font-weight: 700;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.menu-item-image {
  width: 100%;
  height: 120px;
  object-fit: cover;
}

.menu-item-info {
  padding: 0.75rem;
}

.menu-item-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 0.25rem 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.menu-item-price {
  font-size: 0.75rem;
  color: var(--gold-primary);
  margin: 0;
  font-weight: 600;
}

.generator-card {
  padding: 2rem;
}

.generator-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.restaurant-badge {
  padding: 0.5rem 1rem;
  background: rgba(212, 175, 55, 0.15);
  border: 1px solid rgba(212, 175, 55, 0.3);
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--gold-primary);
}

.generation-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.generation-alert {
  margin-bottom: 0;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--gold-primary) 0%, var(--gold-light) 100%);
  transition: width 0.3s ease;
}

.generated-content {
  padding: 1.5rem;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  border: 1px solid rgba(212, 175, 55, 0.2);
}

.generated-content h4 {
  font-family: var(--font-heading);
  font-size: 1.125rem;
  color: var(--text-primary);
  margin: 0 0 1rem 0;
}

.generated-image {
  width: 100%;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.generated-video {
  width: 100%;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.content-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.download-btn {
  padding: 0.75rem 1.5rem;
  background: rgba(212, 175, 55, 0.15);
  border: 1px solid rgba(212, 175, 55, 0.3);
  border-radius: 8px;
  color: var(--gold-primary);
  text-decoration: none;
  font-weight: 600;
  transition: all 0.2s ease;
  display: inline-block;
}

.download-btn:hover {
  background: rgba(212, 175, 55, 0.25);
  border-color: var(--gold-primary);
  transform: translateY(-2px);
}

.usage-stats {
  display: flex;
  justify-content: space-between;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  border: 1px solid rgba(212, 175, 55, 0.1);
  margin-top: 1.5rem;
}

.stats-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.stats-label {
  font-size: 0.75rem;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.stats-value {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--gold-primary);
}

/* Responsive */
@media (max-width: 768px) {
  .title {
    font-size: 2rem;
  }

  .prompt-grid {
    grid-template-columns: 1fr;
  }

  .tabs {
    gap: 0.5rem;
  }

  .tab {
    padding: 0.75rem 1rem;
    font-size: 0.875rem;
  }

  .generator-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .usage-stats {
    flex-direction: column;
    gap: 1rem;
  }
}

/* Menu Header with Actions */
.menu-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
  gap: 1rem;
  flex-wrap: wrap;
}

/* Compact Pagination (Top Right) */
.pagination-top {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  background: rgba(0, 0, 0, 0.3);
  padding: var(--space-xs) var(--space-md);
  border-radius: var(--radius-md);
  border: 1px solid rgba(212, 175, 55, 0.2);
}

.pagination-btn-compact {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(212, 175, 55, 0.1);
  border: 1px solid rgba(212, 175, 55, 0.3);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-size: var(--text-lg);
  font-weight: var(--font-bold);
  cursor: pointer;
  transition: all var(--transition-base);
}

.pagination-btn-compact:hover:not(:disabled) {
  background: rgba(212, 175, 55, 0.2);
  border-color: var(--gold-primary);
  color: var(--gold-primary);
  transform: scale(1.05);
}

.pagination-btn-compact:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.pagination-info-compact {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  font-weight: var(--font-medium);
  min-width: 50px;
  text-align: center;
}

.selection-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.selection-count {
  font-size: 0.875rem;
  color: var(--gold-primary);
  font-weight: 600;
  padding: 0.5rem 1rem;
  background: rgba(212, 175, 55, 0.1);
  border-radius: 6px;
}

/* Pagination */
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid rgba(212, 175, 55, 0.2);
}

.pagination-btn {
  padding: 0.625rem 1.25rem;
  background: rgba(212, 175, 55, 0.1);
  border: 1px solid rgba(212, 175, 55, 0.3);
  border-radius: 6px;
  color: var(--text-primary);
  font-family: var(--font-body);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.pagination-btn:hover:not(:disabled) {
  background: rgba(212, 175, 55, 0.2);
  border-color: var(--gold-primary);
  color: var(--gold-primary);
}

.pagination-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.pagination-info {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

/* Prompt Context Section */
.prompt-context-section {
  background: rgba(212, 175, 55, 0.05);
  border: 1px solid rgba(212, 175, 55, 0.2);
  border-radius: 10px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.context-inputs-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

@media (max-width: 768px) {
  .context-inputs-grid {
    grid-template-columns: 1fr;
  }
}

.context-input-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.context-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--gold-primary);
}

.context-label .required {
  color: #ef4444;
  margin-left: 2px;
}

.context-input,
.context-select {
  width: 100%;
  padding: 0.75rem 1rem;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(212, 175, 55, 0.3);
  border-radius: 8px;
  color: var(--text-primary);
  font-family: var(--font-body);
  font-size: 0.875rem;
  transition: all 0.2s ease;
}

.context-input:focus,
.context-select:focus {
  outline: none;
  border-color: var(--gold-primary);
  background: rgba(0, 0, 0, 0.5);
}

.context-input::placeholder {
  color: var(--text-muted);
}

.context-select option {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.context-hint {
  font-size: 0.75rem;
  color: var(--text-muted);
  margin: 0;
}

/* Platform Selection Card */
.platform-selection-card {
  margin-bottom: var(--space-2xl);
}

/* Platform Grid */
.platform-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: var(--space-md);
  margin-top: var(--space-lg);
}

.alert-content p {
  margin: 0 0 4px 0;
}

.alert-content p:last-of-type {
  margin-bottom: 0;
}

/* Platform Badges */
.post-content-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--space-lg);
  gap: var(--space-md);
}

.platform-badges {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
  align-items: center;
}

.platform-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-xs) var(--space-md);
  background: rgba(212, 175, 55, 0.15);
  border: 1px solid var(--gold-primary);
  border-radius: var(--radius-full);
  color: var(--gold-primary);
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  white-space: nowrap;
}

.selection-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

/* Post Content Section */
.post-content-section {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid rgba(212, 175, 55, 0.2);
}

.post-content-title {
  font-family: var(--font-heading);
  font-size: 1.125rem;
  color: var(--gold-primary);
  margin-bottom: 1rem;
}

.post-content-box {
  background: rgba(212, 175, 55, 0.05);
  border: 1px solid rgba(212, 175, 55, 0.2);
  border-radius: 10px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.post-text-wrapper {
  position: relative;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  padding: 1rem;
}

.post-text {
  color: var(--text-primary);
  line-height: 1.6;
  margin: 0;
  white-space: pre-wrap;
  padding-right: 80px;
}

.copy-btn {
  position: absolute;
  top: 1rem;
  right: 1rem;
  padding: 0.5rem 1rem;
  background: var(--gold-primary);
  color: var(--text-on-gold);
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.copy-btn:hover {
  background: var(--gold-light);
  transform: translateY(-1px);
}

.post-cta {
  color: var(--text-secondary);
  font-size: 0.9375rem;
  padding: 0.75rem;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 6px;
  border-left: 3px solid var(--gold-primary);
}

.post-cta strong {
  color: var(--gold-primary);
}

.post-hashtags-wrapper {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.post-hashtags {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.hashtag {
  display: inline-block;
  padding: 0.375rem 0.75rem;
  background: rgba(212, 175, 55, 0.15);
  color: var(--gold-light);
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
}

.copy-btn-small {
  padding: 0.5rem 0.75rem;
  background: rgba(212, 175, 55, 0.2);
  color: var(--gold-primary);
  border: 1px solid rgba(212, 175, 55, 0.3);
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.copy-btn-small:hover {
  background: rgba(212, 175, 55, 0.3);
  border-color: var(--gold-primary);
}

/* Sticker Customization Section */
.sticker-customization,
.logo-settings {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid rgba(212, 175, 55, 0.15);
}

.sticker-title {
  font-family: var(--font-heading);
  font-size: 1rem;
  color: var(--gold-primary);
  margin: 0 0 1rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.sticker-options-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
}

@media (max-width: 768px) {
  .sticker-options-grid {
    grid-template-columns: 1fr;
  }
}

.preview-text strong {
  color: var(--text-primary);
  font-weight: 600;
}

.brand-color-indicator {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  margin-left: 0.5rem;
}

.color-swatch {
  display: inline-block;
  width: 20px;
  height: 20px;
  border-radius: 4px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

/* Checkbox Styling */
.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  font-size: 0.875rem;
  color: var(--text-primary);
  font-weight: 500;
}

.checkbox-input {
  width: 20px;
  height: 20px;
  cursor: pointer;
  accent-color: var(--gold-primary);
}

.checkbox-label:hover {
  color: var(--gold-primary);
}

/* Restaurant Details Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.details-modal {
  width: 100%;
  max-width: 900px;
  max-height: 90vh;
  overflow-y: auto;
}

.details-content {
  padding: 2rem;
}

.details-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid rgba(212, 175, 55, 0.2);
}

.details-title {
  font-family: var(--font-heading);
  font-size: 2rem;
  color: var(--gold-primary);
  margin: 0;
  flex: 1;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.close-btn {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.close-btn:hover {
  color: var(--text-primary);
  background: rgba(255, 255, 255, 0.1);
}

.details-body {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.details-section {
  padding: 1.5rem;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(212, 175, 55, 0.1);
  border-radius: 12px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  gap: 1rem;
}

.section-title {
  font-family: var(--font-heading);
  font-size: 1.25rem;
  color: var(--gold-primary);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.edit-section-btn {
  padding: 0.5rem 1rem;
  background: rgba(212, 175, 55, 0.1);
  border: 1px solid rgba(212, 175, 55, 0.3);
  border-radius: 6px;
  color: var(--gold-primary);
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.edit-section-btn:hover {
  background: rgba(212, 175, 55, 0.2);
  border-color: var(--gold-primary);
  transform: translateY(-1px);
}

.section-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.edit-field-btn {
  padding: 0.375rem 0.75rem;
  background: rgba(212, 175, 55, 0.1);
  border: 1px solid rgba(212, 175, 55, 0.3);
  border-radius: 6px;
  color: var(--gold-primary);
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-left: 0.5rem;
}

.edit-field-btn:hover {
  background: rgba(212, 175, 55, 0.2);
  border-color: var(--gold-primary);
}

.editable-field {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
}

.field-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-shrink: 0;
}

.save-alert {
  margin-bottom: 1rem;
}

.info-grid {
  display: grid;
  gap: 1rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.info-label {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-secondary);
}

.info-value {
  font-size: 1rem;
  color: var(--text-primary);
}

.info-link {
  color: var(--gold-primary);
  text-decoration: none;
  transition: color 0.2s ease;
  word-break: break-all;
}

.info-link:hover {
  color: var(--text-primary);
  text-decoration: underline;
}

.info-value.empty {
  color: var(--text-muted);
  font-style: italic;
}

.rating-count {
  font-size: 0.875rem;
  color: var(--text-secondary);
  font-weight: normal;
}

.status-badge {
  display: inline-block;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 600;
  margin-bottom: 1rem;
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #ef4444;
}

.status-badge.open {
  background: rgba(34, 197, 94, 0.15);
  border: 1px solid rgba(34, 197, 94, 0.3);
  color: #22c55e;
}

.edit-input {
  width: 100%;
  padding: 0.75rem 1rem;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(212, 175, 55, 0.3);
  border-radius: 8px;
  color: var(--text-primary);
  font-family: var(--font-body);
  font-size: 0.875rem;
  transition: all 0.2s ease;
}

.edit-input:focus {
  outline: none;
  border-color: var(--gold-primary);
  background: rgba(0, 0, 0, 0.5);
  box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.1);
}

.edit-input::placeholder {
  color: var(--text-muted);
}

/* Brand DNA Styles */
.brand-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.brand-item:last-child {
  margin-bottom: 0;
}

.brand-label {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-secondary);
}

.brand-value {
  font-size: 1rem;
  color: var(--text-primary);
}

.brand-name-text {
  font-family: var(--font-heading);
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--gold-primary);
}

.logo-item {
  align-items: flex-start;
}

.logo-container {
  width: 100%;
  max-width: 300px;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(212, 175, 55, 0.2);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.brand-logo {
  max-width: 100%;
  max-height: 120px;
  width: auto;
  height: auto;
  object-fit: contain;
}

.colors-item {
  align-items: flex-start;
}

.colors-display {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  width: 100%;
}

.color-box {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(212, 175, 55, 0.2);
  border-radius: 8px;
  flex: 1;
  min-width: 200px;
}

.color-swatch-small {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.color-details {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
}

.color-name {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-secondary);
}

.color-code {
  font-size: 0.875rem;
  font-family: monospace;
  color: var(--text-primary);
  font-weight: 500;
}

.font-badge-small {
  display: inline-block;
  padding: 0.5rem 1rem;
  background: rgba(212, 175, 55, 0.15);
  border: 1px solid rgba(212, 175, 55, 0.3);
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: capitalize;
  color: var(--gold-primary);
}

/* Opening Hours Styles */
.hours-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.hours-item {
  font-size: 0.875rem;
  color: var(--text-secondary);
  padding: 0.25rem 0;
}

.hours-edit-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.hours-edit-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.remove-day-btn {
  padding: 0.375rem 0.75rem;
  background: rgba(220, 38, 38, 0.1);
  border: 1px solid rgba(220, 38, 38, 0.3);
  border-radius: 6px;
  color: #ef4444;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.remove-day-btn:hover {
  background: rgba(220, 38, 38, 0.2);
  border-color: #ef4444;
}

.hours-input {
  flex: 1;
}

/* Social Media Styles */
.social-links {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.social-link {
  padding: 0.5rem 1rem;
  border-radius: 20px;
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 600;
  transition: all 0.3s ease;
  border: 2px solid;
}

.social-link.facebook {
  background: rgba(66, 103, 178, 0.1);
  border-color: rgba(66, 103, 178, 0.3);
  color: #4267B2;
}

.social-link.facebook:hover {
  background: rgba(66, 103, 178, 0.2);
  border-color: #4267B2;
}

.social-link.instagram {
  background: rgba(225, 48, 108, 0.1);
  border-color: rgba(225, 48, 108, 0.3);
  color: #E1306C;
}

.social-link.instagram:hover {
  background: rgba(225, 48, 108, 0.2);
  border-color: #E1306C;
}

.social-link.twitter {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.3);
  color: var(--text-primary);
}

.social-link.twitter:hover {
  background: rgba(255, 255, 255, 0.2);
}

.social-link.youtube {
  background: rgba(255, 0, 0, 0.1);
  border-color: rgba(255, 0, 0, 0.3);
  color: #FF0000;
}

.social-link.youtube:hover {
  background: rgba(255, 0, 0, 0.2);
  border-color: #FF0000;
}

.social-link.tiktok {
  background: rgba(0, 242, 234, 0.1);
  border-color: rgba(0, 242, 234, 0.3);
  color: #00F2EA;
}

.social-link.tiktok:hover {
  background: rgba(0, 242, 234, 0.2);
  border-color: #00F2EA;
}

.social-edit-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.social-edit-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.social-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
}

.social-icon {
  font-size: 1.25rem;
}

/* Menu Styles */
.platform-badge {
  font-size: 0.75rem;
  padding: 0.25rem 0.75rem;
  background: rgba(212, 175, 55, 0.2);
  border: 1px solid rgba(212, 175, 55, 0.4);
  border-radius: 12px;
  font-weight: 700;
  letter-spacing: 0.05em;
}

.menu-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
}

.menu-item {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.menu-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(212, 175, 55, 0.2);
}

.menu-image {
  width: 100%;
  height: 150px;
  object-fit: cover;
}

.menu-item-content {
  padding: 1rem;
}

.menu-item-name {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 0.5rem 0;
}

.menu-item-description {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0 0 0.5rem 0;
  line-height: 1.4;
}

.menu-item-price {
  font-size: 0.875rem;
  color: var(--gold-primary);
  font-weight: 600;
  margin: 0;
}

/* Pagination Styles */
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-md);
  margin-top: var(--space-2xl);
  padding-top: var(--space-xl);
  border-top: var(--border-width) solid var(--border-color);
}

.pagination-btn {
  padding: var(--space-sm) var(--space-lg);
  background: var(--glass-bg);
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  cursor: pointer;
  transition: var(--transition-base);
  backdrop-filter: blur(var(--blur-md));
}

.pagination-btn:hover:not(:disabled) {
  background: var(--gold-subtle);
  border-color: var(--gold-primary);
  color: var(--gold-primary);
  transform: translateY(-1px);
}

.pagination-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.pagination-numbers {
  display: flex;
  gap: var(--space-sm);
}

.pagination-number {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--glass-bg);
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  cursor: pointer;
  transition: var(--transition-base);
  backdrop-filter: blur(var(--blur-md));
}

.pagination-number:hover {
  background: var(--gold-subtle);
  border-color: var(--gold-primary);
  color: var(--gold-primary);
  transform: translateY(-1px);
}

.pagination-number.active {
  background: var(--gold-primary);
  border-color: var(--gold-primary);
  color: var(--text-on-gold);
}

/* Responsive */
@media (max-width: 768px) {
  .details-modal {
    max-height: 100vh;
  }

  .details-content {
    padding: 1.5rem;
  }

  .social-edit-grid {
    grid-template-columns: 1fr;
  }

  .hours-edit-item {
    flex-direction: column;
  }

  .hours-input {
    width: 100%;
  }

  .remove-day-btn {
    width: 100%;
  }

  .menu-grid {
    grid-template-columns: 1fr;
  }
}

/* Delete Section Styles */
.delete-section {
  margin-top: var(--space-2xl);
  border: 1px solid rgba(239, 68, 68, 0.2);
  background: rgba(239, 68, 68, 0.05);
}

.section-title.danger {
  color: var(--error-text);
}

.delete-warning {
  color: var(--text-secondary);
  font-size: var(--text-sm);
  line-height: var(--leading-normal);
  margin-bottom: var(--space-lg);
}

.delete-actions {
  display: flex;
  gap: var(--space-md);
}

.delete-confirm {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.confirm-text {
  color: var(--error-text);
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  margin: 0;
}

.confirm-actions {
  display: flex;
  gap: var(--space-md);
  flex-wrap: wrap;
}
</style>
