<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { api } from '../services/api'
import BaseCard from '../components/BaseCard.vue'
import BaseButton from '../components/BaseButton.vue'
import BaseAlert from '../components/BaseAlert.vue'
import BaseInput from '../components/BaseInput.vue'

const router = useRouter()
const authStore = useAuthStore()

const message = ref('')
const messageType = ref<'success' | 'error' | 'info'>('info')
const activeTab = ref<'image' | 'video'>('image')

// Image generation state
const generatedImageUrl = ref('')
const generatingImage = ref(false)
const imagePrompt = ref('')

// Video generation state
const generatedVideoUrl = ref('')
const generatingVideo = ref(false)
const videoPrompt = ref('')
const videoOperationId = ref('')
const videoModelId = ref('')
const videoPollingTimer = ref<number | null>(null)
const showAdvancedOptions = ref(false)
const videoProgress = ref(0)
const videoProgressTimer = ref<number | null>(null)
const videoGenerationStartTime = ref(0)

// Image-to-video state
const useImageForVideo = ref(false)
const selectedImageFile = ref<File | null>(null)
const selectedImagePreview = ref('')

// Video configuration options
const videoModel = ref<'veo-3.1-fast-generate-preview' | 'veo-3.1-generate-preview'>(
  'veo-3.1-fast-generate-preview'
)
const videoDuration = ref<4 | 6 | 8>(8)
const videoAspectRatio = ref<'16:9' | '9:16'>('16:9')
const videoResolution = ref<'720p' | '1080p'>('720p')
const videoNegativePrompt = ref('')

const tierDisplayName = computed(() => authStore.user?.subscription.tier.toUpperCase() || 'FREE')
const progressPercent = computed(() => {
  if (!authStore.usageStats) return 0
  const { credits_this_month, monthly_limit } = authStore.usageStats
  return (credits_this_month / monthly_limit) * 100
})

async function handleLogout() {
  await authStore.logout()
  router.push('/login')
}

async function generateImage() {
  if (!imagePrompt.value.trim()) {
    showMessage('Please enter a prompt', 'error')
    return
  }

  if (!authStore.canGenerateContent) {
    showMessage('Usage limit exceeded. Please upgrade your plan.', 'error')
    return
  }

  generatingImage.value = true
  generatedImageUrl.value = ''

  try {
    const response = await api.generateImage(imagePrompt.value)

    if (!response.success) {
      showMessage(response.error || 'Failed to generate image', 'error')
      return
    }

    showMessage('Image generated successfully!', 'success')
    generatedImageUrl.value = (response as any).imageUrl || ''

    // Refresh profile to update usage stats
    await authStore.refreshProfile()
  } catch (error: any) {
    showMessage(error.message || 'Network error', 'error')
  } finally {
    generatingImage.value = false
  }
}

async function generateVideo() {
  if (!videoPrompt.value.trim()) {
    showMessage('Please enter a prompt', 'error')
    return
  }

  if (!authStore.canGenerateVideo) {
    showMessage('Insufficient quota. Video generation requires 5 credits.', 'error')
    return
  }

  generatingVideo.value = true
  generatedVideoUrl.value = ''
  videoOperationId.value = ''
  videoProgress.value = 0
  videoGenerationStartTime.value = Date.now()

  try {
    let response

    if (useImageForVideo.value && selectedImageFile.value) {
      // Image-to-video generation
      const imageData = await fileToBase64(selectedImageFile.value)
      const imageMimeType = selectedImageFile.value.type

      response = await api.generateVideoFromImage(
        videoPrompt.value,
        imageData,
        imageMimeType,
        {
          model: videoModel.value,
          duration: videoDuration.value,
          aspectRatio: videoAspectRatio.value,
          resolution: videoResolution.value,
          negativePrompt: videoNegativePrompt.value || undefined,
          enhancePrompt: true,
          generateAudio: true,
        }
      )
    } else {
      // Text-to-video generation
      response = await api.generateVideo(videoPrompt.value, {
        model: videoModel.value,
        duration: videoDuration.value,
        aspectRatio: videoAspectRatio.value,
        resolution: videoResolution.value,
        negativePrompt: videoNegativePrompt.value || undefined,
        enhancePrompt: true,
        generateAudio: true,
      })
    }

    if (!response.success) {
      showMessage(response.error || 'Failed to start video generation', 'error')
      generatingVideo.value = false
      return
    }

    videoOperationId.value = (response as any).operationId || ''
    videoModelId.value = (response as any).modelId || ''
    showMessage('Video generation started. This may take 1-3 minutes...', 'info')

    // Refresh profile to update usage stats
    await authStore.refreshProfile()

    // Start progress simulation and polling
    startProgressSimulation()
    startVideoPolling()
  } catch (error: any) {
    showMessage(error.message || 'Network error', 'error')
    generatingVideo.value = false
    stopProgressSimulation()
  }
}

function startProgressSimulation() {
  // Stop any existing timer
  stopProgressSimulation()

  // Fast mode: ~45 seconds, Standard mode: ~90 seconds
  const isFastMode = videoModel.value === 'veo-3.1-fast-generate-preview'
  const estimatedDuration = isFastMode ? 45000 : 90000 // milliseconds

  // Update progress every 500ms
  const updateInterval = 500
  const incrementPerUpdate = (100 / estimatedDuration) * updateInterval

  videoProgressTimer.value = window.setInterval(() => {
    const elapsed = Date.now() - videoGenerationStartTime.value

    // Calculate smooth progress with easing
    // Progress slows down as it approaches 95% to feel more natural
    let targetProgress = (elapsed / estimatedDuration) * 100

    // Apply easing: fast start, slow end
    if (targetProgress < 50) {
      // First 50%: progress normally
      videoProgress.value = Math.min(targetProgress, 50)
    } else if (targetProgress < 80) {
      // 50-80%: slow down a bit
      const adjustedProgress = 50 + ((targetProgress - 50) * 0.8)
      videoProgress.value = Math.min(adjustedProgress, 80)
    } else {
      // 80-95%: slow down significantly
      const adjustedProgress = 80 + ((targetProgress - 80) * 0.5)
      videoProgress.value = Math.min(adjustedProgress, 95)
    }

    // Never go above 95% until actually complete
    if (videoProgress.value >= 95) {
      videoProgress.value = 95
      stopProgressSimulation()
    }
  }, updateInterval)
}

function stopProgressSimulation() {
  if (videoProgressTimer.value) {
    clearInterval(videoProgressTimer.value)
    videoProgressTimer.value = null
  }
}

async function startVideoPolling() {
  if (!videoOperationId.value) return

  const pollVideo = async () => {
    try {
      const response = await api.pollVideoOperation(videoOperationId.value, videoModelId.value)

      if (!response.success) {
        showMessage('Failed to check video status', 'error')
        stopVideoPolling()
        generatingVideo.value = false
        return
      }

      const operation = (response as any).operation

      if (operation.done) {
        stopVideoPolling()
        stopProgressSimulation()

        // Animate progress to 100%
        videoProgress.value = 100

        generatingVideo.value = false

        if (operation.error) {
          showMessage(`Video generation failed: ${operation.error}`, 'error')
        } else if (operation.videoUrl) {
          generatedVideoUrl.value = operation.videoUrl
          showMessage('Video generated successfully!', 'success')
        }
      }
    } catch (error: any) {
      showMessage('Error polling video status', 'error')
      stopVideoPolling()
      stopProgressSimulation()
      generatingVideo.value = false
    }
  }

  // Poll immediately
  await pollVideo()

  // Then poll every 5 seconds
  videoPollingTimer.value = window.setInterval(pollVideo, 5000)
}

function stopVideoPolling() {
  if (videoPollingTimer.value) {
    clearInterval(videoPollingTimer.value)
    videoPollingTimer.value = null
  }
}

function handleImageSelect(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (file) {
    if (!file.type.startsWith('image/')) {
      showMessage('Please select an image file', 'error')
      return
    }

    selectedImageFile.value = file

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      selectedImagePreview.value = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }
}

function clearSelectedImage() {
  selectedImageFile.value = null
  selectedImagePreview.value = ''
  useImageForVideo.value = false
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      // Remove data URL prefix (e.g., "data:image/png;base64,")
      const base64 = result.split(',')[1]
      if (base64) {
        resolve(base64)
      } else {
        reject(new Error('Failed to convert file to base64'))
      }
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

async function openManageSubscription() {
  try {
    const response = await api.createPortalSession(window.location.href)

    if (!response.success) {
      showMessage(response.error || 'Failed to open portal', 'error')
      return
    }

    window.location.href = (response as any).portal_url || ''
  } catch (error: any) {
    showMessage(error.message || 'Network error', 'error')
  }
}

function showMessage(msg: string, type: 'success' | 'error' | 'info') {
  message.value = msg
  messageType.value = type
  setTimeout(() => (message.value = ''), 5000)
}

// Cleanup on component unmount
import { onUnmounted } from 'vue'
onUnmounted(() => {
  stopVideoPolling()
  stopProgressSimulation()
})

// Computed properties for progress display
const progressPercentage = computed(() => Math.round(videoProgress.value))
const estimatedTimeRemaining = computed(() => {
  if (!generatingVideo.value || videoProgress.value >= 95) return ''

  const isFastMode = videoModel.value === 'veo-3.1-fast-generate-preview'
  const estimatedTotal = isFastMode ? 45 : 90 // seconds
  const elapsed = (Date.now() - videoGenerationStartTime.value) / 1000
  const remaining = Math.max(0, estimatedTotal - elapsed)

  if (remaining < 10) return 'Almost done...'
  if (remaining < 30) return `~${Math.round(remaining / 5) * 5}s remaining`
  return `~${Math.round(remaining / 10) * 10}s remaining`
})
</script>

<template>
  <div class="dashboard">
    <div class="header">
      <h1 class="brand-title">Social Media AI</h1>
      <BaseButton variant="ghost" size="small" @click="handleLogout">
        Logout
      </BaseButton>
    </div>

    <BaseAlert
      v-if="message"
      :type="messageType"
      :model-value="!!message"
      @update:model-value="message = ''"
      class="dashboard-alert"
    >
      {{ message }}
    </BaseAlert>

    <BaseCard variant="glass" class="main-card">
      <h2 class="welcome-heading">Welcome, {{ authStore.user?.email }}!</h2>

      <div class="user-info">
        <div class="info-row">
          <strong>Subscription Tier:</strong>
          <span class="tier-badge">{{ tierDisplayName }}</span>
        </div>
        <div class="info-row">
          <strong>Status:</strong>
          <span>{{ authStore.user?.subscription.status }}</span>
        </div>
        <div class="info-row">
          <strong>Usage:</strong>
          <span
            >{{ authStore.usageStats?.credits_this_month }} /
            {{ authStore.usageStats?.monthly_limit }} credits this month</span
          >
        </div>
        <div class="usage-bar">
          <div class="usage-progress" :style="{ width: `${progressPercent}%` }"></div>
        </div>
        <div class="info-row">
          <strong>Remaining:</strong>
          <span>{{ authStore.usageStats?.remaining_credits }} credits</span>
        </div>
      </div>

      <!-- Tabs -->
      <div class="tabs">
        <button
          :class="['tab', { active: activeTab === 'image' }]"
          @click="activeTab = 'image'"
        >
          Image Generation (1 credit)
        </button>
        <button
          :class="['tab', { active: activeTab === 'video' }]"
          @click="activeTab = 'video'"
        >
          Video Generation (5 credits)
        </button>
      </div>

      <!-- Image Generation Tab -->
      <div v-if="activeTab === 'image'" class="tab-content">
        <div class="generate-section">
          <h3>Generate Image</h3>
          <BaseInput
            v-model="imagePrompt"
            type="textarea"
            label="Enter your prompt:"
            placeholder="Describe the image you want to generate... (e.g., A beautiful sunset over mountains)"
            :rows="3"
            :disabled="generatingImage"
          />
          <BaseButton
            variant="primary"
            size="large"
            full-width
            :disabled="!authStore.canGenerateContent || generatingImage || !imagePrompt.trim()"
            @click="generateImage"
          >
            {{ generatingImage ? 'Generating...' : 'Generate Image' }}
          </BaseButton>
        </div>

        <div v-if="generatedImageUrl" class="generated-content">
          <h3>Generated Image:</h3>
          <img :src="generatedImageUrl" alt="Generated image" />
          <div class="content-actions">
            <BaseButton
              variant="secondary"
              size="small"
              @click="() => window.open(generatedImageUrl, '_blank')"
            >
              Open in New Tab
            </BaseButton>
            <BaseButton
              variant="secondary"
              size="small"
              @click="async () => {
                useImageForVideo = true
                activeTab = 'video'
                // Fetch image as file for video generation
                try {
                  const res = await fetch(generatedImageUrl)
                  const blob = await res.blob()
                  selectedImageFile = new File([blob], 'generated-image.png', { type: 'image/png' })
                  selectedImagePreview = generatedImageUrl
                } catch (err) {
                  showMessage('Failed to load image for video generation', 'error')
                }
              }"
            >
              Use for Video
            </BaseButton>
          </div>
        </div>
      </div>

      <!-- Video Generation Tab -->
      <div v-if="activeTab === 'video'" class="tab-content">
        <div class="generate-section">
          <h3>Generate Video</h3>

          <BaseAlert
            v-if="!authStore.canGenerateVideo"
            type="warning"
            :dismissible="false"
          >
            Video generation requires 5 credits. You have {{ authStore.usageStats?.remaining_credits }} remaining.
            <BaseButton variant="secondary" size="small" @click="router.push('/plans')" style="margin-top: 10px;">
              Upgrade Plan
            </BaseButton>
          </BaseAlert>

          <!-- Image-to-video toggle -->
          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" v-model="useImageForVideo" />
              Use image as starting frame (image-to-video)
            </label>
          </div>

          <!-- Image upload -->
          <div v-if="useImageForVideo" class="form-group">
            <label>Select Image:</label>
            <input
              type="file"
              accept="image/*"
              @change="handleImageSelect"
              :disabled="generatingVideo"
            />
            <div v-if="selectedImagePreview" class="image-preview">
              <img :src="selectedImagePreview" alt="Selected image" />
              <BaseButton variant="secondary" size="small" @click="clearSelectedImage">Clear</BaseButton>
            </div>
          </div>

          <BaseInput
            v-model="videoPrompt"
            type="textarea"
            label="Enter your prompt:"
            placeholder="Describe the video you want to generate... (e.g., A fast-tracking shot through a bustling dystopian city with bright neon signs)"
            :rows="3"
            :disabled="generatingVideo"
          />

          <!-- Model Selection -->
          <div class="form-group">
            <label>Quality:</label>
            <div class="radio-group">
              <label class="radio-label">
                <input
                  type="radio"
                  value="veo-3.1-fast-generate-preview"
                  v-model="videoModel"
                  :disabled="generatingVideo"
                />
                Fast Generation (Recommended)
              </label>
              <label class="radio-label">
                <input
                  type="radio"
                  value="veo-3.1-generate-preview"
                  v-model="videoModel"
                  :disabled="generatingVideo"
                />
                Standard Quality
              </label>
            </div>
          </div>

          <!-- Advanced Options Toggle -->
          <button
            class="btn-text"
            @click="showAdvancedOptions = !showAdvancedOptions"
            type="button"
          >
            {{ showAdvancedOptions ? '▼' : '▶' }} Advanced Options
          </button>

          <!-- Advanced Options -->
          <div v-if="showAdvancedOptions" class="advanced-options">
            <div class="form-group">
              <label>Duration:</label>
              <div class="radio-group">
                <label class="radio-label">
                  <input type="radio" :value="4" v-model="videoDuration" :disabled="generatingVideo" />
                  4 seconds
                </label>
                <label class="radio-label">
                  <input type="radio" :value="6" v-model="videoDuration" :disabled="generatingVideo" />
                  6 seconds
                </label>
                <label class="radio-label">
                  <input type="radio" :value="8" v-model="videoDuration" :disabled="generatingVideo" />
                  8 seconds (Default)
                </label>
              </div>
            </div>

            <div class="form-group">
              <label>Aspect Ratio:</label>
              <div class="radio-group">
                <label class="radio-label">
                  <input
                    type="radio"
                    value="16:9"
                    v-model="videoAspectRatio"
                    :disabled="generatingVideo"
                  />
                  16:9 (Landscape)
                </label>
                <label class="radio-label">
                  <input
                    type="radio"
                    value="9:16"
                    v-model="videoAspectRatio"
                    :disabled="generatingVideo"
                  />
                  9:16 (Portrait)
                </label>
              </div>
            </div>

            <div class="form-group">
              <label>Resolution:</label>
              <div class="radio-group">
                <label class="radio-label">
                  <input
                    type="radio"
                    value="720p"
                    v-model="videoResolution"
                    :disabled="generatingVideo"
                  />
                  720p (Default)
                </label>
                <label class="radio-label">
                  <input
                    type="radio"
                    value="1080p"
                    v-model="videoResolution"
                    :disabled="generatingVideo"
                  />
                  1080p
                </label>
              </div>
            </div>

            <BaseInput
              v-model="videoNegativePrompt"
              type="textarea"
              label="Negative Prompt (Optional):"
              placeholder="What to avoid in the video (e.g., people, animals, bright colors)"
              :rows="2"
              :disabled="generatingVideo"
            />
          </div>

          <BaseButton
            variant="primary"
            size="large"
            full-width
            :disabled="!authStore.canGenerateVideo || generatingVideo || !videoPrompt.trim() || (useImageForVideo && !selectedImageFile)"
            @click="generateVideo"
          >
            {{ generatingVideo ? 'Generating... (1-3 min)' : 'Generate Video (5 credits)' }}
          </BaseButton>

          <div v-if="generatingVideo && !generatedVideoUrl" class="loading-indicator">
            <div class="progress-container">
              <div class="progress-header">
                <span class="progress-icon">🎬</span>
                <h4>Generating your video...</h4>
              </div>

              <div class="progress-bar-wrapper">
                <div class="progress-bar">
                  <div
                    class="progress-fill"
                    :style="{ width: `${progressPercentage}%` }"
                  >
                    <div class="progress-shine"></div>
                  </div>
                </div>
                <div class="progress-info">
                  <span class="progress-percentage">{{ progressPercentage }}%</span>
                  <span class="progress-time">{{ estimatedTimeRemaining }}</span>
                </div>
              </div>

              <div class="progress-stages">
                <div :class="['stage', { active: progressPercentage >= 0, done: progressPercentage > 30 }]">
                  <div class="stage-icon">{{ progressPercentage > 30 ? '✓' : '1' }}</div>
                  <span>Processing prompt</span>
                </div>
                <div :class="['stage', { active: progressPercentage >= 30, done: progressPercentage > 60 }]">
                  <div class="stage-icon">{{ progressPercentage > 60 ? '✓' : '2' }}</div>
                  <span>Generating frames</span>
                </div>
                <div :class="['stage', { active: progressPercentage >= 60, done: progressPercentage > 90 }]">
                  <div class="stage-icon">{{ progressPercentage > 90 ? '✓' : '3' }}</div>
                  <span>Rendering video</span>
                </div>
                <div :class="['stage', { active: progressPercentage >= 90, done: progressPercentage === 100 }]">
                  <div class="stage-icon">{{ progressPercentage === 100 ? '✓' : '4' }}</div>
                  <span>Finalizing</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="generatedVideoUrl" class="generated-content">
          <h3>Generated Video:</h3>
          <video :src="generatedVideoUrl" controls autoplay loop></video>
          <div class="content-actions">
            <BaseButton
              variant="secondary"
              size="small"
              @click="() => window.open(generatedVideoUrl, '_blank')"
            >
              Open in New Tab
            </BaseButton>
            <BaseButton
              variant="secondary"
              size="small"
              @click="() => window.open(generatedVideoUrl, '_self')"
            >
              Download Video
            </BaseButton>
          </div>
        </div>
      </div>

      <div class="actions">
        <BaseButton variant="secondary" @click="openManageSubscription">
          Manage Subscription
        </BaseButton>
        <BaseButton variant="secondary" @click="router.push('/plans')">
          View Plans
        </BaseButton>
      </div>
    </BaseCard>
  </div>
</template>

<style scoped>
.dashboard {
  min-height: 100vh;
  padding: var(--space-2xl);
}

.header {
  max-width: var(--max-width-lg);
  margin: 0 auto var(--space-2xl);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.brand-title {
  font-family: var(--font-heading);
  font-size: var(--text-3xl);
  font-weight: var(--font-bold);
  background: var(--gradient-gold);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
}

.main-card {
  max-width: var(--max-width-lg);
  margin: 0 auto;
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

.dashboard-alert {
  max-width: var(--max-width-lg);
  margin: 0 auto var(--space-xl);
}

.welcome-heading {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  margin-bottom: var(--space-2xl);
  color: var(--text-primary);
}

.user-info {
  background: var(--bg-tertiary);
  padding: var(--space-xl);
  border-radius: var(--radius-lg);
  margin-bottom: var(--space-2xl);
  border: var(--border-width) solid var(--border-color);
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: var(--space-md) 0;
  border-bottom: var(--border-width) solid var(--border-color);
  color: var(--text-secondary);
  font-size: var(--text-sm);
}

.info-row:last-child {
  border-bottom: none;
}

.info-row strong {
  color: var(--text-primary);
}

.tier-badge {
  background: var(--gradient-gold);
  color: var(--text-on-gold);
  padding: var(--space-xs) var(--space-md);
  border-radius: var(--radius-full);
  font-weight: var(--font-semibold);
  font-size: var(--text-sm);
}

.usage-bar {
  width: 100%;
  height: 8px;
  background: var(--bg-primary);
  border-radius: var(--radius-full);
  overflow: hidden;
  margin: var(--space-md) 0;
  box-shadow: var(--shadow-inner);
}

.usage-progress {
  height: 100%;
  background: var(--gradient-gold);
  transition: width var(--duration-normal) var(--ease-smooth);
  border-radius: var(--radius-full);
}

/* Tabs */
.tabs {
  display: flex;
  gap: var(--space-md);
  margin-bottom: var(--space-2xl);
  border-bottom: 2px solid var(--border-color);
}

.tab {
  flex: 1;
  padding: var(--space-lg) var(--space-xl);
  background: none;
  border: none;
  border-bottom: 3px solid transparent;
  font-size: var(--text-base);
  font-family: var(--font-body);
  font-weight: var(--font-medium);
  cursor: pointer;
  transition: var(--transition-base);
  color: var(--text-muted);
}

.tab:hover {
  color: var(--gold-primary);
  background: var(--gold-subtle);
}

.tab.active {
  color: var(--gold-primary);
  border-bottom-color: var(--gold-primary);
  font-weight: var(--font-semibold);
}

.tab-content {
  animation: fadeIn 0.4s var(--ease-smooth);
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.actions {
  display: flex;
  gap: var(--space-md);
  flex-wrap: wrap;
  margin-top: var(--space-2xl);
  padding-top: var(--space-2xl);
  border-top: var(--border-width) solid var(--border-color);
}

.generate-section {
  background: var(--bg-secondary);
  padding: var(--space-2xl);
  border-radius: var(--radius-lg);
  margin-bottom: var(--space-xl);
  border: var(--border-width) solid var(--border-color);
}

.generate-section h3 {
  margin-top: 0;
  margin-bottom: var(--space-xl);
  color: var(--text-primary);
  font-family: var(--font-heading);
  font-size: var(--text-xl);
}

.form-group {
  margin-bottom: var(--space-lg);
}

.form-group label {
  display: block;
  margin-bottom: var(--space-sm);
  font-weight: var(--font-medium);
  color: var(--text-secondary);
  font-size: var(--text-sm);
}

.form-group textarea,
.form-group input[type='file'] {
  width: 100%;
  padding: var(--space-md) var(--space-lg);
  background: var(--bg-tertiary);
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: var(--text-base);
  font-family: var(--font-body);
  resize: vertical;
  box-sizing: border-box;
  transition: var(--transition-base);
}

.form-group textarea:focus,
.form-group input[type='file']:focus {
  outline: none;
  border-color: var(--gold-primary);
  background: var(--bg-secondary);
  box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.15);
}

.form-group textarea:disabled,
.form-group input:disabled {
  background: var(--bg-primary);
  opacity: 0.5;
  cursor: not-allowed;
}

.checkbox-label,
.radio-label {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  font-weight: var(--font-normal);
  color: var(--text-secondary);
  cursor: pointer;
  transition: var(--transition-fast);
}

.checkbox-label:hover,
.radio-label:hover {
  color: var(--text-primary);
}

.radio-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.image-preview {
  margin-top: var(--space-md);
  position: relative;
}

.image-preview img {
  max-width: 200px;
  border-radius: var(--radius-md);
  display: block;
  margin-bottom: var(--space-md);
  border: var(--border-width) solid var(--border-color);
}

.advanced-options {
  background: var(--bg-tertiary);
  padding: var(--space-xl);
  border-radius: var(--radius-md);
  margin-top: var(--space-md);
  margin-bottom: var(--space-lg);
  border: var(--border-width) solid var(--border-color);
}

.btn-text {
  background: none;
  border: none;
  color: var(--gold-primary);
  cursor: pointer;
  padding: var(--space-sm) 0;
  font-size: var(--text-sm);
  font-family: var(--font-body);
  font-weight: var(--font-medium);
  margin-bottom: var(--space-md);
  transition: var(--transition-fast);
}

.btn-text:hover {
  color: var(--gold-light);
  text-decoration: underline;
}

.loading-indicator {
  text-align: center;
  padding: var(--space-3xl) var(--space-xl);
  background: var(--bg-tertiary);
  border-radius: var(--radius-lg);
  border: var(--border-width) solid var(--border-color);
}

.progress-container {
  max-width: 500px;
  margin: 0 auto;
}

.progress-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-md);
  margin-bottom: var(--space-2xl);
}

.progress-icon {
  font-size: var(--text-4xl);
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

.progress-header h4 {
  margin: 0;
  color: var(--gold-primary);
  font-family: var(--font-heading);
  font-size: var(--text-xl);
}

.progress-bar-wrapper {
  margin-bottom: var(--space-2xl);
}

.progress-bar {
  width: 100%;
  height: 32px;
  background: var(--bg-primary);
  border-radius: var(--radius-full);
  overflow: hidden;
  box-shadow: var(--shadow-inner);
  position: relative;
  border: var(--border-width) solid var(--border-color);
}

.progress-fill {
  height: 100%;
  background: var(--gradient-gold);
  border-radius: var(--radius-full);
  transition: width 0.5s var(--ease-smooth);
  position: relative;
  overflow: hidden;
  box-shadow: var(--glow-gold-sm);
}

.progress-shine {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.4),
    transparent
  );
  animation: shine 2.5s infinite;
}

@keyframes shine {
  0% {
    left: -100%;
  }
  100% {
    left: 100%;
  }
}

.progress-info {
  display: flex;
  justify-content: space-between;
  margin-top: var(--space-md);
  font-size: var(--text-sm);
}

.progress-percentage {
  font-weight: var(--font-semibold);
  color: var(--gold-primary);
}

.progress-time {
  color: var(--text-muted);
  font-style: italic;
}

.progress-stages {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-md);
  margin-top: var(--space-2xl);
}

.stage {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-md);
  border-radius: var(--radius-md);
  background: var(--bg-primary);
  border: var(--border-width) solid var(--border-color);
  opacity: 0.4;
  transition: all var(--duration-normal) var(--ease-smooth);
}

.stage.active {
  opacity: 1;
  background: var(--gold-subtle);
  border-color: var(--gold-primary);
}

.stage.done {
  background: var(--success-bg);
  border-color: var(--success-border);
  opacity: 1;
}

.stage-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--bg-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: var(--font-semibold);
  font-size: var(--text-sm);
  color: var(--text-muted);
  transition: all var(--duration-normal) var(--ease-smooth);
  border: 2px solid var(--border-color);
}

.stage.active .stage-icon {
  background: var(--gradient-gold);
  color: var(--text-on-gold);
  border-color: var(--gold-primary);
  animation: pulse-icon 1.5s ease-in-out infinite;
}

.stage.done .stage-icon {
  background: var(--success-text);
  color: var(--bg-primary);
  border-color: var(--success-text);
  animation: none;
}

@keyframes pulse-icon {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(212, 175, 55, 0.7);
  }
  50% {
    transform: scale(1.05);
    box-shadow: 0 0 0 8px rgba(212, 175, 55, 0);
  }
}

.stage span {
  font-size: var(--text-xs);
  color: var(--text-muted);
  text-align: center;
  font-weight: var(--font-medium);
}

.stage.active span {
  color: var(--gold-primary);
  font-weight: var(--font-semibold);
}

.stage.done span {
  color: var(--success-text);
}

.generated-content {
  margin-top: var(--space-2xl);
  padding-top: var(--space-2xl);
  border-top: var(--border-width) solid var(--border-color);
}

.generated-content h3 {
  margin-bottom: var(--space-xl);
  color: var(--text-primary);
  font-family: var(--font-heading);
  font-size: var(--text-xl);
}

.generated-content img,
.generated-content video {
  max-width: 100%;
  border-radius: var(--radius-lg);
  margin-bottom: var(--space-xl);
  box-shadow: var(--shadow-lg);
  border: var(--border-width) solid var(--border-color);
}

.content-actions {
  display: flex;
  gap: var(--space-md);
  flex-wrap: wrap;
}

/* Responsive */
@media (max-width: 768px) {
  .dashboard {
    padding: var(--space-lg);
  }

  .header {
    flex-direction: column;
    gap: var(--space-md);
    text-align: center;
  }

  .brand-title {
    font-size: var(--text-2xl);
  }

  .tabs {
    flex-direction: column;
    border-bottom: none;
  }

  .tab {
    border-bottom: var(--border-width) solid var(--border-color);
    border-left: 3px solid transparent;
  }

  .tab.active {
    border-left-color: var(--gold-primary);
    border-bottom-color: var(--border-color);
  }

  .actions {
    flex-direction: column;
  }
}

@media (max-width: 600px) {
  .progress-stages {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-sm);
  }

  .stage span {
    font-size: 0.65rem;
  }

  .stage-icon {
    width: 28px;
    height: 28px;
    font-size: 0.75rem;
  }

  .progress-header h4 {
    font-size: var(--text-lg);
  }

  .progress-bar {
    height: 28px;
  }

  .generate-section {
    padding: var(--space-lg);
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
</style>
