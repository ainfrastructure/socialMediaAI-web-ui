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
          <h3 class="card-title">Menu Items ({{ menuItems.length }})</h3>
          <p class="card-subtitle">Click an image to use as reference for image & video generation</p>
          <div class="menu-items-grid">
            <div
              v-for="(item, index) in menuItems.slice(0, 12)"
              :key="index"
              :class="['menu-item-card', { 'selected': selectedMenuItem?.name === item.name }]"
              @click="selectMenuItem(item)"
            >
              <img v-if="item.imageUrl" :src="item.imageUrl" :alt="item.name" class="menu-item-image" />
              <div class="menu-item-info">
                <h4 class="menu-item-name">{{ item.name }}</h4>
                <p v-if="item.price" class="menu-item-price">{{ item.price }}</p>
              </div>
              <div v-if="selectedMenuItem?.name === item.name" class="menu-selected-badge">✓ Selected</div>
            </div>
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import GradientBackground from '../components/GradientBackground.vue'
import BaseCard from '../components/BaseCard.vue'
import BaseButton from '../components/BaseButton.vue'
import BaseAlert from '../components/BaseAlert.vue'
import { restaurantService, type SavedRestaurant } from '../services/restaurantService'
import { api } from '../services/api'

const router = useRouter()
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

// Video options
const videoDuration = ref<4 | 6 | 8>(8)
const videoAspectRatio = ref<'16:9' | '9:16'>('16:9')
const videoResolution = ref<'720p' | '1080p'>('720p')

// Messages
const message = ref('')
const messageType = ref<'success' | 'error' | 'info'>('info')

const canGenerate = computed(() => {
  return true // Disabled credit limits for playground
  // return (authStore.usageStats?.remaining_credits || 0) > 0
})

// Menu items from selected restaurant
const menuItems = computed(() => {
  if (!selectedRestaurant.value?.menu?.items) return []
  return selectedRestaurant.value.menu.items.filter((item: any) => item.imageUrl)
})

const selectedMenuItem = ref<any | null>(null)

const selectMenuItem = (item: any) => {
  selectedMenuItem.value = item
  showMessage(`Selected: ${item.name} - Will be used as reference for generation`, 'info')
}

onMounted(async () => {
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
      await generatePrompts()
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

  // Generate new prompts for selected restaurant
  if (selectedRestaurant.value) {
    await generatePrompts()
  }
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

const selectImagePrompt = (index: number) => {
  selectedImagePromptIndex.value = index
  editablePrompt.value = imagePrompts.value[index]
  // Clear generated content when switching prompts
  generatedImageUrl.value = ''
  message.value = ''
}

const selectVideoPrompt = (index: number) => {
  selectedVideoPromptIndex.value = index
  editablePrompt.value = videoPrompts.value[index]
  // Clear generated content when switching prompts
  generatedVideoUrl.value = ''
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

    // Prepare watermark if restaurant has logo
    const watermark = selectedRestaurant.value?.brand_dna?.logo_url
      ? {
          logoPath: selectedRestaurant.value.brand_dna.logo_url,
          position: 'bottom-right' as const,
          opacity: 80,
          scale: 15,
          padding: 20,
        }
      : undefined

    // Prepare reference image if menu item is selected
    let referenceImage: { base64Data: string; mimeType: string } | undefined = undefined
    if (selectedMenuItem.value && selectedMenuItem.value.imageUrl) {
      try {
        showMessage(`Generating image inspired by ${selectedMenuItem.value.name}...`, 'info')

        // Convert image URL to base64
        const imageResponse = await fetch(selectedMenuItem.value.imageUrl)
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

    console.log('Calling API with:', {
      prompt: editablePrompt.value,
      hasWatermark: !!watermark,
      hasReferenceImage: !!referenceImage,
    })

    const response = await api.generateImage(editablePrompt.value, watermark, referenceImage)

    console.log('API response:', response)

    if (!response.success) {
      showMessage(response.error || 'Failed to generate image', 'error')
      return
    }

    generatedImageUrl.value = (response as any).imageUrl || ''
    const watermarked = (response as any).watermarked || false
    const usedReference = referenceImage !== undefined

    let successMessage = 'Image generated successfully!'
    if (usedReference && watermarked) {
      successMessage = `Image generated with reference to ${selectedMenuItem.value?.name} and logo watermark!`
    } else if (usedReference) {
      successMessage = `Image generated with reference to ${selectedMenuItem.value?.name}!`
    } else if (watermarked) {
      successMessage = 'Image generated with logo watermark!'
    }

    showMessage(successMessage, 'success')

    // Refresh usage stats
    await authStore.refreshProfile()
  } catch (error: any) {
    console.error('Generate image error:', error)
    showMessage(error.message || 'Failed to generate image', 'error')
  } finally {
    generatingImage.value = false
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

    // If menu item is selected, use image-to-video
    if (selectedMenuItem.value && selectedMenuItem.value.imageUrl) {
      showMessage(`Generating video from ${selectedMenuItem.value.name}...`, 'info')

      // Convert image URL to base64
      const imageResponse = await fetch(selectedMenuItem.value.imageUrl)
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
</style>
