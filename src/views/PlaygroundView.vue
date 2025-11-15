<template>
  <div class="playground-view">
    <GradientBackground />

    <div class="container">
      <div class="header">
        <h1 class="title">AI Marketing Playground</h1>
        <p class="subtitle">
          Generate stunning marketing content for your restaurants using AI
        </p>
      </div>

      <!-- Loading State -->
      <div v-if="loadingRestaurants" class="loading-container">
        <div class="spinner"></div>
        <p>Loading your restaurants...</p>
      </div>

      <!-- No Restaurants State -->
      <BaseCard v-else-if="restaurants.length === 0" variant="glass-intense" class="empty-state">
        <div class="empty-content">
          <h3>No Saved Restaurants</h3>
          <p>Save some restaurants first to start generating marketing content!</p>
          <BaseButton variant="primary" @click="router.push('/restaurants')">
            Search Restaurants
          </BaseButton>
        </div>
      </BaseCard>

      <!-- Main Playground -->
      <div v-else class="playground-content">
        <!-- Restaurant Selector -->
        <BaseCard variant="glass-intense" class="selector-card">
          <h3 class="card-title">Select Restaurant</h3>
          <select v-model="selectedRestaurantId" class="restaurant-select" @change="onRestaurantChange">
            <option value="">Choose a restaurant...</option>
            <option v-for="restaurant in restaurants" :key="restaurant.id" :value="restaurant.id">
              {{ restaurant.name }}
            </option>
          </select>

          <BaseButton
            v-if="selectedRestaurant"
            variant="secondary"
            size="small"
            full-width
            @click="selectRandomRestaurant"
            class="random-btn"
          >
            🎲 Pick Random Restaurant
          </BaseButton>
        </BaseCard>

        <!-- Menu Items Reference -->
        <BaseCard v-if="selectedRestaurant && menuItems.length > 0" variant="glass" class="menu-reference-card">
          <div class="menu-header">
            <div>
              <h3 class="card-title">Menu Items ({{ menuItems.length }})</h3>
              <p class="card-subtitle">Select one or more items to create combo prompts</p>
            </div>
          </div>

          <!-- Prompt Context Input -->
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

              <div class="context-input-wrapper">
                <label for="platform" class="context-label">
                  Platform <span class="required">*</span>
                </label>
                <select id="platform" v-model="selectedPlatform" class="context-select">
                  <option value="">Select platform...</option>
                  <option value="instagram">Instagram</option>
                  <option value="facebook">Facebook</option>
                  <option value="tiktok">TikTok</option>
                  <option value="twitter">Twitter/X</option>
                  <option value="linkedin">LinkedIn</option>
                </select>
                <p class="context-hint">Platform for post content optimization</p>
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

              <div class="sticker-preview-info">
                <span class="preview-icon">👁️</span>
                <span class="preview-text">
                  <strong>{{ promptContext.toUpperCase() }}</strong> will appear as a
                  <strong>{{ stickerStyle.replace('-', ' ') }}</strong> sticker in the
                  <strong>{{ stickerPosition.replace('-', ' ') }}</strong>
                  <span v-if="selectedRestaurant?.brand_dna?.primary_color" class="brand-color-indicator">
                    using brand color
                    <span class="color-swatch" :style="{ backgroundColor: selectedRestaurant.brand_dna.primary_color }"></span>
                  </span>
                </span>
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
            </div>

            <div class="selection-actions">
              <span class="selection-count">{{ selectedMenuItems.length }} item{{ selectedMenuItems.length > 1 ? 's' : '' }} selected</span>
              <BaseButton variant="primary" size="medium" @click="generatePromptsFromSelection" :disabled="loadingPrompts || !selectedPlatform">
                {{ loadingPrompts ? 'Generating...' : 'Generate Prompts' }}
              </BaseButton>
              <BaseButton variant="ghost" size="small" @click="clearSelection">
                Clear
              </BaseButton>
            </div>
          </div>

          <div class="menu-items-grid">
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

          <!-- Pagination -->
          <div v-if="totalPages > 1" class="pagination">
            <button
              @click="currentPage--"
              :disabled="currentPage === 1"
              class="pagination-btn"
            >
              ← Previous
            </button>
            <span class="pagination-info">
              Page {{ currentPage }} of {{ totalPages }}
            </span>
            <button
              @click="currentPage++"
              :disabled="currentPage === totalPages"
              class="pagination-btn"
            >
              Next →
            </button>
          </div>
        </BaseCard>

        <!-- Content Generator -->
        <BaseCard v-if="selectedRestaurant" variant="glass-intense" class="generator-card">
          <div class="generator-header">
            <h3 class="card-title">{{ selectedRestaurant.name }}</h3>
            <span class="restaurant-badge">{{ getCuisineType(selectedRestaurant) }}</span>
          </div>

          <!-- Tabs -->
          <div class="tabs">
            <button :class="['tab', { active: activeTab === 'image' }]" @click="switchTab('image')">
              📸 Image
            </button>
            <button :class="['tab', { active: activeTab === 'video' }]" @click="switchTab('video')">
              🎥 Video
            </button>
          </div>

          <!-- Loading Prompts State -->
          <div v-if="loadingPrompts" class="loading-prompts">
            <div class="spinner"></div>
            <p>Generating creative ideas with AI...</p>
          </div>

          <!-- Prompt Selection Section -->
          <div v-else class="prompt-section">
            <div class="section-header">
              <h4>AI-Generated Ideas</h4>
              <BaseButton
                variant="secondary"
                size="small"
                @click="generatePrompts"
                :disabled="loadingPrompts"
              >
                ✨ Get New Ideas
              </BaseButton>
            </div>

            <!-- Image Tab -->
            <div v-if="activeTab === 'image'">
              <div v-if="imagePrompts.length > 0" class="prompt-grid">
                <div
                  v-for="(prompt, index) in imagePrompts"
                  :key="`image-${index}`"
                  :class="['prompt-card', { selected: selectedImagePromptIndex === index }]"
                  @click="selectImagePrompt(index)"
                >
                  <div class="prompt-number">{{ index + 1 }}</div>
                  <div class="prompt-preview">{{ truncateText(prompt, 120) }}</div>
                  <div v-if="selectedImagePromptIndex === index" class="selected-badge">✓ Selected</div>
                </div>
              </div>
              <div v-else class="prompt-placeholder">
                <p>Click "Get New Ideas" to generate AI-powered image prompts!</p>
              </div>
            </div>

            <!-- Video Tab -->
            <div v-if="activeTab === 'video'">
              <div v-if="videoPrompts.length > 0" class="prompt-grid">
                <div
                  v-for="(prompt, index) in videoPrompts"
                  :key="`video-${index}`"
                  :class="['prompt-card', { selected: selectedVideoPromptIndex === index }]"
                  @click="selectVideoPrompt(index)"
                >
                  <div class="prompt-number">{{ index + 1 }}</div>
                  <div class="prompt-preview">{{ truncateText(prompt, 120) }}</div>
                  <div v-if="selectedVideoPromptIndex === index" class="selected-badge">✓ Selected</div>
                </div>
              </div>
              <div v-else class="prompt-placeholder">
                <p>Click "Get New Ideas" to generate AI-powered video prompts!</p>
              </div>
            </div>

            <!-- Selected Prompt Display (Editable) -->
            <div v-if="selectedPrompt" class="selected-prompt">
              <label>Selected Prompt (editable):</label>
              <textarea
                v-model="editablePrompt"
                class="prompt-textarea"
                rows="5"
                placeholder="Select a prompt above..."
              ></textarea>
            </div>
          </div>

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
                  variant="secondary"
                  size="medium"
                  @click="saveToFavorites"
                  :disabled="savingFavorite"
                >
                  {{ savingFavorite ? 'Saving...' : lastSavedFavorite ? '⭐ Saved' : '⭐ Save to Favorites' }}
                </BaseButton>
                <BaseButton
                  v-if="lastSavedFavorite || generatedPostContent"
                  variant="primary"
                  size="medium"
                  @click="openScheduleModal"
                >
                  📅 Schedule Post
                </BaseButton>
              </div>
            </div>

            <!-- Post Content Section -->
            <div v-if="generatedPostContent && generatedImageUrl" class="post-content-section">
              <h4 class="post-content-title">
                {{ selectedPlatform.charAt(0).toUpperCase() + selectedPlatform.slice(1) }} Post Content
              </h4>

              <div class="post-content-box">
                <div class="post-text-wrapper">
                  <p class="post-text">{{ generatedPostContent.postText }}</p>
                  <button @click="copyToClipboard(generatedPostContent.postText)" class="copy-btn" title="Copy post text">
                    📋 Copy
                  </button>
                </div>

                <div v-if="generatedPostContent.callToAction" class="post-cta">
                  <strong>Call to Action:</strong> {{ generatedPostContent.callToAction }}
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
            <div class="video-options">
              <div class="option-group">
                <label>Duration</label>
                <select v-model="videoDuration" class="option-select">
                  <option :value="4">4 seconds</option>
                  <option :value="6">6 seconds</option>
                  <option :value="8">8 seconds</option>
                </select>
              </div>

              <div class="option-group">
                <label>Aspect Ratio</label>
                <select v-model="videoAspectRatio" class="option-select">
                  <option value="16:9">16:9 (Landscape)</option>
                  <option value="9:16">9:16 (Portrait)</option>
                </select>
              </div>

              <div class="option-group">
                <label>Resolution</label>
                <select v-model="videoResolution" class="option-select">
                  <option value="720p">720p</option>
                  <option value="1080p">1080p</option>
                </select>
              </div>
            </div>

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
                  variant="secondary"
                  size="medium"
                  @click="saveToFavorites"
                  :disabled="savingFavorite"
                >
                  {{ savingFavorite ? 'Saving...' : lastSavedFavorite ? '⭐ Saved' : '⭐ Save to Favorites' }}
                </BaseButton>
                <BaseButton
                  v-if="lastSavedFavorite || generatedPostContent"
                  variant="primary"
                  size="medium"
                  @click="openScheduleModal"
                >
                  📅 Schedule Post
                </BaseButton>
              </div>
            </div>

            <!-- Post Content Section -->
            <div v-if="generatedPostContent && generatedVideoUrl" class="post-content-section">
              <h4 class="post-content-title">
                {{ selectedPlatform.charAt(0).toUpperCase() + selectedPlatform.slice(1) }} Post Content
              </h4>

              <div class="post-content-box">
                <div class="post-text-wrapper">
                  <p class="post-text">{{ generatedPostContent.postText }}</p>
                  <button @click="copyToClipboard(generatedPostContent.postText)" class="copy-btn" title="Copy post text">
                    📋 Copy
                  </button>
                </div>

                <div v-if="generatedPostContent.callToAction" class="post-cta">
                  <strong>Call to Action:</strong> {{ generatedPostContent.callToAction }}
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

          <!-- Usage Stats -->
          <div class="usage-stats">
            <div class="stats-item">
              <span class="stats-label">Remaining Credits:</span>
              <span class="stats-value">{{ authStore.usageStats?.remaining_credits || 0 }}</span>
            </div>
            <div class="stats-item">
              <span class="stats-label">This Month:</span>
              <span class="stats-value">
                {{ authStore.usageStats?.credits_this_month || 0 }} / {{ authStore.usageStats?.monthly_limit || 0 }}
              </span>
            </div>
          </div>
        </BaseCard>
      </div>
    </div>

    <!-- Schedule Modal -->
    <ScheduleModal
      v-model="showScheduleModal"
      :favorite-post="favoriteToSchedule"
      :preselected-date="preselectedDate"
      @scheduled="handleScheduled"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import GradientBackground from '../components/GradientBackground.vue'
import BaseCard from '../components/BaseCard.vue'
import BaseButton from '../components/BaseButton.vue'
import BaseAlert from '../components/BaseAlert.vue'
import ScheduleModal from '../components/ScheduleModal.vue'
import { restaurantService, type SavedRestaurant } from '../services/restaurantService'
import { api } from '../services/api'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

// Restaurant selection
const restaurants = ref<SavedRestaurant[]>([])
const selectedRestaurantId = ref('')
const selectedRestaurant = computed(() =>
  restaurants.value.find(r => r.id === selectedRestaurantId.value)
)
const loadingRestaurants = ref(false)

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
  callToAction: string
} | null>(null)

// Video options
const videoDuration = ref<4 | 6 | 8>(8)
const videoAspectRatio = ref<'16:9' | '9:16'>('16:9')
const videoResolution = ref<'720p' | '1080p'>('720p')

// Messages
const message = ref('')
const messageType = ref<'success' | 'error' | 'info'>('info')

// Favorites and Scheduling
const savingFavorite = ref(false)
const lastSavedFavorite = ref<any>(null)
const showScheduleModal = ref(false)
const favoriteToSchedule = ref<any>(null)
const preselectedDate = ref<string | null>(null)

const canGenerate = computed(() => {
  return true // Disabled credit limits for playground
  // return (authStore.usageStats?.remaining_credits || 0) > 0
})

// Menu items from selected restaurant
const menuItems = computed(() => {
  if (!selectedRestaurant.value?.menu?.items) return []
  return selectedRestaurant.value.menu.items.filter((item: any) => item.imageUrl)
})

// Multi-select menu items
const selectedMenuItems = ref<any[]>([])
const promptContext = ref('')
const selectedPlatform = ref<'instagram' | 'facebook' | 'tiktok' | 'twitter' | 'linkedin' | ''>('')

// Promotional sticker options
const stickerStyle = ref<'bold' | 'outlined' | 'ribbon' | 'badge' | 'starburst'>('bold')
const stickerPosition = ref<'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'center'>('top-right')

// Logo watermark options
const includeLogo = ref(true) // Include logo by default
const logoPosition = ref<'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'>('bottom-right')

// Pagination
const currentPage = ref(1)
const itemsPerPage = 12

const totalPages = computed(() => {
  return Math.ceil(menuItems.value.length / itemsPerPage)
})

const paginatedMenuItems = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return menuItems.value.slice(start, end)
})

const toggleMenuItem = (item: any) => {
  const index = selectedMenuItems.value.findIndex((i) => i.name === item.name)
  if (index > -1) {
    selectedMenuItems.value.splice(index, 1)
  } else {
    selectedMenuItems.value.push(item)
  }
}

const isItemSelected = (item: any) => {
  return selectedMenuItems.value.some((i) => i.name === item.name)
}

const clearSelection = () => {
  selectedMenuItems.value = []
  promptContext.value = ''
  selectedPlatform.value = ''
  stickerStyle.value = 'bold'
  stickerPosition.value = 'top-right'
  includeLogo.value = true
  logoPosition.value = 'bottom-right'
  showMessage('Selection cleared', 'info')
}

onMounted(async () => {
  // Check for scheduleDate URL parameter
  const scheduleDateParam = route.query.scheduleDate
  if (scheduleDateParam && typeof scheduleDateParam === 'string') {
    preselectedDate.value = scheduleDateParam
    console.log('Preselected date from URL:', preselectedDate.value)
  }

  await fetchRestaurants()
  await authStore.refreshProfile()
})

onUnmounted(() => {
  stopVideoPolling()
})

const fetchRestaurants = async () => {
  try {
    loadingRestaurants.value = true
    restaurants.value = await restaurantService.getSavedRestaurants()

    // Auto-select first restaurant if available
    if (restaurants.value.length > 0) {
      selectedRestaurantId.value = restaurants.value[0].id
    }
  } catch (error: any) {
    showMessage('Failed to load restaurants: ' + error.message, 'error')
  } finally {
    loadingRestaurants.value = false
  }
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

const selectImagePrompt = (index: number) => {
  selectedImagePromptIndex.value = index
  editablePrompt.value = imagePrompts.value[index]
  // Clear generated content when switching prompts
  generatedImageUrl.value = ''
  generatedPostContent.value = null
  lastSavedFavorite.value = null
  message.value = ''
}

const selectVideoPrompt = (index: number) => {
  selectedVideoPromptIndex.value = index
  editablePrompt.value = videoPrompts.value[index]
  // Clear generated content when switching prompts
  generatedVideoUrl.value = ''
  generatedPostContent.value = null
  lastSavedFavorite.value = null
  message.value = ''
}

const switchTab = (tab: 'image' | 'video') => {
  activeTab.value = tab

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
}

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

    // Prepare watermark if restaurant has logo and user wants it
    const watermark = (includeLogo.value && selectedRestaurant.value?.brand_dna?.logo_url)
      ? {
          logoPath: selectedRestaurant.value.brand_dna.logo_url,
          position: logoPosition.value as const,
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
        console.error('Error fetching reference image:', imageError)
        showMessage(`Warning: Could not load reference image. Generating without it.`, 'info')
        // Continue without reference image
      }
    }

    // Prepare promotional sticker if campaign context is provided
    // Use brand DNA primary color if available, otherwise default to red
    const getBrandColor = () => {
      const brandColor = selectedRestaurant.value?.brand_dna?.primary_color
      return brandColor || '#FF4444' // Default to red if no brand color
    }

    const promotionalSticker = promptContext.value
      ? {
          text: promptContext.value.toUpperCase(), // Convert to uppercase for impact
          position: stickerPosition.value as const,
          style: stickerStyle.value as const,
          color: getBrandColor(), // Use brand color or default
          textColor: '#FFFFFF', // White text
          size: 'large' as const,
          rotation: stickerStyle.value === 'ribbon' ? 0 : -5, // No rotation for ribbon, slight for others
        }
      : undefined

    console.log('Calling API with:', {
      prompt: editablePrompt.value,
      hasWatermark: !!watermark,
      hasReferenceImage: !!referenceImage,
      hasPromotionalSticker: !!promotionalSticker,
    })

    const response = await api.generateImage(editablePrompt.value, watermark, referenceImage, promotionalSticker)

    console.log('API response:', response)

    if (!response.success) {
      showMessage(response.error || 'Failed to generate image', 'error')
      return
    }

    generatedImageUrl.value = (response as any).imageUrl || ''
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

    // Refresh usage stats
    await authStore.refreshProfile()

    // Generate post content if platform is selected
    if (selectedPlatform.value && selectedRestaurant.value) {
      await generatePostContent('image')
    }
  } catch (error: any) {
    console.error('Generate image error:', error)
    showMessage(error.message || 'Failed to generate image', 'error')
  } finally {
    generatingImage.value = false
  }
}

const generatePostContent = async (contentType: 'image' | 'video') => {
  if (!selectedPlatform.value || !selectedRestaurant.value) return

  try {
    generatingPostContent.value = true
    const menuItemNames = selectedMenuItems.value.length > 0
      ? selectedMenuItems.value.map(i => i.name)
      : ['Featured dish']

    console.log('Generating post content for', selectedPlatform.value, menuItemNames)

    const response = await api.generatePostContent(
      selectedPlatform.value,
      selectedRestaurant.value.name,
      menuItemNames,
      contentType,
      promptContext.value || undefined,
      selectedRestaurant.value.brand_dna
    )

    if (!response.success) {
      console.error('Failed to generate post content:', response.error)
      return
    }

    generatedPostContent.value = {
      postText: (response as any).postText || '',
      hashtags: (response as any).hashtags || [],
      callToAction: (response as any).callToAction || '',
    }

    console.log('Post content generated:', generatedPostContent.value)
  } catch (error: any) {
    console.error('Generate post content error:', error)
  } finally {
    generatingPostContent.value = false
  }
}

const generateVideo = async () => {
  if (!editablePrompt.value || !canGenerate.value) return

  try {
    generatingVideo.value = true
    message.value = ''
    generatedVideoUrl.value = ''
    videoProgress.value = 0

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

            // Generate post content if platform is selected
            if (selectedPlatform.value && selectedRestaurant.value) {
              await generatePostContent('video')
            }
          } else if (operation.error) {
            showMessage('Video generation failed: ' + operation.error, 'error')
            generatingVideo.value = false
            videoProgress.value = 0
          }
        }
      }
    } catch (error: any) {
      console.error('Error polling video operation:', error)
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

const saveToFavorites = async () => {
  console.log('saveToFavorites called')
  console.log('generatedImageUrl:', generatedImageUrl.value)
  console.log('generatedVideoUrl:', generatedVideoUrl.value)
  console.log('lastSavedFavorite:', lastSavedFavorite.value)

  // Check if already saved
  if (lastSavedFavorite.value) {
    console.log('Already saved, skipping')
    showMessage('Already saved to favorites!', 'info')
    return
  }

  if (!generatedImageUrl.value && !generatedVideoUrl.value) {
    showMessage('No generated content to save', 'error')
    return
  }

  try {
    savingFavorite.value = true

    const favoriteData = {
      restaurant_id: selectedRestaurant.value?.id,
      content_type: activeTab.value,
      media_url: activeTab.value === 'image' ? generatedImageUrl.value : generatedVideoUrl.value,
      post_text: generatedPostContent.value?.postText,
      hashtags: generatedPostContent.value?.hashtags,
      call_to_action: generatedPostContent.value?.callToAction,
      platform: selectedPlatform.value || undefined,
      prompt: editablePrompt.value,
      menu_items: selectedMenuItems.value.length > 0 ? selectedMenuItems.value : undefined,
      context: promptContext.value || undefined,
      brand_dna: selectedRestaurant.value?.brand_dna,
    }

    console.log('Saving favorite with data:', favoriteData)

    const response = await api.saveFavorite(favoriteData)

    console.log('Save favorite response:', response)

    if (!response.success) {
      showMessage(response.error || 'Failed to save to favorites', 'error')
      return
    }

    lastSavedFavorite.value = response.data?.favorite
    console.log('lastSavedFavorite set to:', lastSavedFavorite.value)
    showMessage('Post saved to favorites!', 'success')
  } catch (error: any) {
    console.error('Error saving favorite:', error)
    showMessage(error.message || 'Failed to save to favorites', 'error')
  } finally {
    savingFavorite.value = false
  }
}

const openScheduleModal = async () => {
  console.log('openScheduleModal called')
  console.log('lastSavedFavorite:', lastSavedFavorite.value)

  // If we just saved a favorite, use that. Otherwise, save first
  if (!lastSavedFavorite.value) {
    console.log('No saved favorite, saving now...')
    await saveToFavorites()
    if (!lastSavedFavorite.value) {
      // Save failed
      console.log('Save failed, not opening modal')
      return
    }
  }

  console.log('Opening modal with favorite:', lastSavedFavorite.value)
  favoriteToSchedule.value = lastSavedFavorite.value
  showScheduleModal.value = true
}

const handleScheduled = (scheduledPost: any) => {
  showMessage(`Post scheduled for ${scheduledPost.scheduled_date}!`, 'success')
  showScheduleModal.value = false
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
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-container p,
.loading-prompts p {
  color: var(--text-secondary);
  margin: 0;
}

.empty-state {
  padding: 4rem 2rem;
}

.empty-content {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
}

.empty-content h3 {
  font-family: var(--font-heading);
  font-size: 1.5rem;
  color: var(--text-primary);
  margin: 0;
}

.empty-content p {
  color: var(--text-secondary);
  margin: 0;
}

.playground-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.selector-card {
  padding: 1.5rem;
}

.card-title {
  font-family: var(--font-heading);
  font-size: 1.25rem;
  color: var(--gold-primary);
  margin: 0 0 1rem 0;
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

.restaurant-select {
  width: 100%;
  padding: 0.75rem 1rem;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(212, 175, 55, 0.3);
  border-radius: 8px;
  color: var(--text-primary);
  font-size: 1rem;
  font-family: var(--font-body);
  margin-bottom: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.restaurant-select:focus {
  outline: none;
  border-color: var(--gold-primary);
}

.restaurant-select option {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.random-btn {
  margin-top: 0.5rem;
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

.tabs {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  border-bottom: 1px solid rgba(212, 175, 55, 0.2);
}

.tab {
  padding: 1rem 2rem;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  color: var(--text-secondary);
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tab.active {
  color: var(--gold-primary);
  border-bottom-color: var(--gold-primary);
}

.tab:hover {
  color: var(--text-primary);
}

.prompt-section {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(212, 175, 55, 0.2);
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  gap: 1rem;
  flex-wrap: wrap;
}

.section-header h4 {
  font-family: var(--font-heading);
  font-size: 1.125rem;
  color: var(--text-primary);
  margin: 0;
}

.prompt-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.prompt-card {
  position: relative;
  padding: 1.25rem;
  background: rgba(0, 0, 0, 0.4);
  border: 2px solid rgba(212, 175, 55, 0.2);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
  min-height: 140px;
  display: flex;
  flex-direction: column;
}

.prompt-card:hover {
  border-color: rgba(212, 175, 55, 0.5);
  background: rgba(0, 0, 0, 0.5);
  transform: translateY(-2px);
}

.prompt-card.selected {
  border-color: var(--gold-primary);
  background: rgba(212, 175, 55, 0.1);
  box-shadow: 0 0 20px rgba(212, 175, 55, 0.3);
}

.prompt-number {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  width: 28px;
  height: 28px;
  background: rgba(212, 175, 55, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--gold-primary);
}

.prompt-preview {
  color: var(--text-secondary);
  font-size: 0.875rem;
  line-height: 1.5;
  flex: 1;
  margin-top: 0.5rem;
}

.prompt-card.selected .prompt-preview {
  color: var(--text-primary);
}

.selected-badge {
  margin-top: 0.75rem;
  padding: 0.375rem 0.75rem;
  background: var(--gold-primary);
  color: var(--text-on-gold);
  font-size: 0.75rem;
  font-weight: 700;
  border-radius: 4px;
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.selected-prompt {
  margin-top: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.selected-prompt label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.prompt-textarea {
  width: 100%;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(212, 175, 55, 0.3);
  border-radius: 8px;
  color: var(--text-primary);
  font-size: 1rem;
  font-family: var(--font-body);
  line-height: 1.6;
  resize: vertical;
  transition: border-color 0.2s ease;
}

.prompt-textarea:focus {
  outline: none;
  border-color: var(--gold-primary);
}

.prompt-placeholder {
  padding: 3rem 2rem;
  text-align: center;
  color: var(--text-secondary);
  font-style: italic;
}

.generation-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.generation-alert {
  margin-bottom: 0;
}

.video-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  padding: 1.5rem;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
}

.option-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.option-group label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.option-select {
  padding: 0.5rem;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(212, 175, 55, 0.3);
  border-radius: 6px;
  color: var(--text-primary);
  font-size: 0.875rem;
  cursor: pointer;
}

.option-select:focus {
  outline: none;
  border-color: var(--gold-primary);
}

.option-select option {
  background: var(--bg-secondary);
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

  .video-options {
    grid-template-columns: 1fr;
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

.sticker-preview-info {
  background: rgba(212, 175, 55, 0.08);
  border: 1px solid rgba(212, 175, 55, 0.2);
  border-radius: 8px;
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.preview-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.preview-text {
  font-size: 0.875rem;
  color: var(--text-secondary);
  line-height: 1.5;
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
</style>
