∑<template>
  <div class="test-post-view">
    <div class="container">
      <header class="page-header">
        <h1>Test Facebook Post</h1>
        <p class="subtitle">
          Test posting to your connected Facebook pages
        </p>
      </header>

      <!-- Success Alert -->
      <BaseAlert
        v-if="showSuccess"
        variant="success"
        :dismissible="true"
        @close="showSuccess = false"
      >
        {{ successMessage }}
      </BaseAlert>

      <!-- Error Alert -->
      <BaseAlert
        v-if="showError"
        variant="error"
        :dismissible="true"
        @close="showError = false"
      >
        {{ errorMessage }}
      </BaseAlert>

      <!-- Not Connected Warning -->
      <BaseAlert
        v-if="!isConnected && !facebookStore.loading"
        variant="warning"
      >
        You haven't connected any Facebook pages yet.
        <router-link to="/connect-accounts" class="connect-link">
          Connect now
        </router-link>
      </BaseAlert>

      <!-- Post Form -->
      <BaseCard v-if="isConnected" variant="glass-intense" class="form-card">
        <form @submit.prevent="handlePost">
          <!-- Page Selection -->
          <div class="form-group">
            <label for="page-select">Select Facebook Page *</label>
            <select
              id="page-select"
              v-model="formData.pageId"
              class="page-select"
              :disabled="loading || uploadingImage"
            >
              <option value="">Choose a page...</option>
              <option
                v-for="page in facebookStore.connectedPages"
                :key="page.pageId"
                :value="page.pageId"
              >
                {{ page.pageName }}
              </option>
            </select>
            <span v-if="errors.pageId" class="error-message">
              {{ errors.pageId }}
            </span>
          </div>

          <!-- Message Input -->
          <div class="form-group">
            <BaseInput
              v-model="formData.message"
              type="textarea"
              label="Post Message"
              placeholder="What's on your mind?"
              :required="true"
              :error="errors.message"
              :rows="6"
              :disabled="loading || uploadingImage"
            />
          </div>

          <!-- Image Upload -->
          <div class="form-group">
            <label>Image (Optional)</label>
            <ImageUpload
              v-model="selectedFiles"
              :maxFiles="1"
              :maxSizeMB="5"
              :disabled="loading || uploadingImage"
              @error="handleImageError"
            />
            <p v-if="uploadingImage" class="upload-status">
              Uploading image...
            </p>
            <p v-else-if="formData.imageUrl" class="upload-success">
              Image uploaded successfully
            </p>
          </div>

          <!-- Submit Button -->
          <BaseButton
            type="submit"
            variant="primary"
            size="large"
            :disabled="loading || uploadingImage"
            :full-width="true"
          >
            {{ loading ? 'Posting...' : uploadingImage ? 'Uploading Image...' : 'Post to Facebook' }}
          </BaseButton>
        </form>
      </BaseCard>

      <!-- Post History -->
      <BaseCard
        v-if="isConnected && postHistory.length > 0"
        variant="glass"
        class="history-card"
      >
        <div class="history-header">
          <h3>Recent Posts</h3>
          <select
            v-model="historyFilter"
            class="filter-select"
            @change="loadPostHistory"
          >
            <option value="">All Pages</option>
            <option
              v-for="page in facebookStore.connectedPages"
              :key="page.pageId"
              :value="page.pageId"
            >
              {{ page.pageName }}
            </option>
          </select>
        </div>

        <div class="posts-grid">
          <div
            v-for="post in postHistory"
            :key="post.id"
            class="post-card"
          >
            <div class="post-header">
              <div>
                <h4 class="page-name">{{ post.page_name }}</h4>
                <p class="post-time">{{ formatDate(post.posted_at) }}</p>
              </div>
              <a
                :href="post.post_url"
                target="_blank"
                rel="noopener noreferrer"
                class="view-link"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                  <polyline points="15 3 21 3 21 9"></polyline>
                  <line x1="10" y1="14" x2="21" y2="3"></line>
                </svg>
                View on Facebook
              </a>
            </div>

            <div class="post-content">
              <p class="post-message">{{ truncateMessage(post.message) }}</p>
              <img
                v-if="post.image_url"
                :src="post.image_url"
                :alt="'Post image'"
                class="post-image"
              />
            </div>
          </div>
        </div>

        <p v-if="postHistory.length === 0" class="no-posts">
          No posts yet. Create your first post above!
        </p>
      </BaseCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useFacebookStore } from '../stores/facebook'
import { api } from '../services/api'
import BaseCard from '../components/BaseCard.vue'
import BaseButton from '../components/BaseButton.vue'
import BaseInput from '../components/BaseInput.vue'
import BaseAlert from '../components/BaseAlert.vue'
import ImageUpload from '../components/ImageUpload.vue'

const router = useRouter()
const facebookStore = useFacebookStore()

const formData = ref({
  pageId: '',
  message: '',
  imageUrl: ''
})

const errors = ref({
  pageId: '',
  message: ''
})

const selectedFiles = ref<File[]>([])
const uploadingImage = ref(false)
const loading = ref(false)
const showSuccess = ref(false)
const showError = ref(false)
const successMessage = ref('')
const errorMessage = ref('')
const postHistory = ref<any[]>([])
const historyFilter = ref('')

const isConnected = computed(() => facebookStore.connectedPages.length > 0)

// Watch for file selection and upload immediately
watch(selectedFiles, async (newFiles) => {
  if (newFiles.length > 0 && newFiles[0]) {
    await uploadImage(newFiles[0])
  } else {
    // Clear image URL if files are removed
    formData.value.imageUrl = ''
  }
})

onMounted(async () => {
  await facebookStore.loadConnectedPages()
  await loadPostHistory()
})

async function uploadImage(file: File) {
  uploadingImage.value = true
  showError.value = false

  try {
    const response = await api.uploadFacebookImage(file)

    if (!response.success) {
      throw new Error(response.error || 'Failed to upload image')
    }

    formData.value.imageUrl = response.data?.imageUrl || ''
  } catch (error: any) {
    errorMessage.value = error.message || 'Failed to upload image'
    showError.value = true
    selectedFiles.value = [] // Clear the selected file on error
  } finally {
    uploadingImage.value = false
  }
}

function handleImageError(error: string) {
  errorMessage.value = error
  showError.value = true
}

async function loadPostHistory() {
  try {
    const pageId = historyFilter.value || undefined
    const response = await api.getPostHistory(pageId)

    if (response.success && response.data) {
      postHistory.value = response.data.posts || []
    }
  } catch (error: any) {

  }
}

function validateForm(): boolean {
  errors.value = { pageId: '', message: '' }

  if (!formData.value.pageId) {
    errors.value.pageId = 'Please select a Facebook page'
    return false
  }

  if (!formData.value.message.trim()) {
    errors.value.message = 'Message is required'
    return false
  }

  return true
}

async function handlePost() {
  if (!validateForm()) return

  loading.value = true
  showSuccess.value = false
  showError.value = false

  try {
    const response = await api.postToFacebook(
      formData.value.pageId,
      formData.value.message,
      formData.value.imageUrl || undefined
    )

    if (!response.success) {
      throw new Error(response.error || 'Failed to post to Facebook')
    }

    const postId = response.data?.postId || 'unknown'
    successMessage.value = `Successfully posted to Facebook! Post ID: ${postId}`
    showSuccess.value = true

    // Clear form
    formData.value = {
      pageId: formData.value.pageId, // Keep the selected page
      message: '',
      imageUrl: ''
    }
    selectedFiles.value = []

    // Reload post history
    await loadPostHistory()
  } catch (error: any) {
    errorMessage.value = error.message || 'An error occurred while posting'
    showError.value = true
  } finally {
    loading.value = false
  }
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  })
}

function truncateMessage(message: string, maxLength: number = 150): string {
  if (message.length <= maxLength) return message
  return message.substring(0, maxLength) + '...'
}
</script>

<style scoped>
.test-post-view {
  min-height: 100vh;
  padding: var(--space-2xl) var(--space-lg);
}

.container {
  max-width: var(--max-width-xl);
  margin: 0 auto;
}

.page-header {
  margin-bottom: var(--space-2xl);
  text-align: center;
}

.page-header h1 {
  font-family: var(--font-heading);
  font-size: var(--font-size-3xl);
  color: var(--text-primary);
  margin-bottom: var(--space-sm);
  background: linear-gradient(135deg, var(--gold-primary), var(--gold-light));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.subtitle {
  font-size: var(--font-size-lg);
  color: var(--text-secondary);
}

.connect-link {
  color: var(--gold-primary);
  text-decoration: underline;
  font-weight: var(--font-medium);
}

.connect-link:hover {
  color: var(--gold-light);
}

.form-card {
  margin-bottom: var(--space-2xl);
}

.form-group {
  margin-bottom: var(--space-xl);
}

.form-group:last-of-type {
  margin-bottom: var(--space-2xl);
}

.form-group label {
  display: block;
  margin-bottom: var(--space-sm);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-secondary);
}

.page-select,
.filter-select {
  width: 100%;
  padding: var(--space-md) var(--space-lg);
  background: var(--bg-tertiary);
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: var(--text-base);
  font-family: var(--font-body);
  cursor: pointer;
  transition: all var(--transition-base);
}

.filter-select {
  width: auto;
  padding: var(--space-sm) var(--space-md);
  font-size: var(--text-sm);
}

.page-select:hover:not(:disabled),
.filter-select:hover {
  border-color: var(--gold-primary);
}

.page-select:focus,
.filter-select:focus {
  outline: none;
  border-color: var(--gold-primary);
  box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.15);
}

.page-select:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.page-select option,
.filter-select option {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.error-message {
  display: block;
  margin-top: var(--space-sm);
  font-size: var(--text-xs);
  color: var(--error-text);
}

.upload-status {
  margin-top: var(--space-sm);
  font-size: var(--text-sm);
  color: var(--gold-primary);
}

.upload-success {
  margin-top: var(--space-sm);
  font-size: var(--text-sm);
  color: var(--success-text);
}

.history-card {
  margin-top: var(--space-2xl);
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-xl);
}

.history-header h3 {
  font-size: var(--font-size-lg);
  color: var(--text-primary);
  font-weight: var(--font-semibold);
}

.posts-grid {
  display: grid;
  gap: var(--space-lg);
}

.post-card {
  background: var(--bg-tertiary);
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
  transition: all var(--transition-base);
}

.post-card:hover {
  border-color: var(--gold-primary);
  transform: translateY(-2px);
}

.post-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--space-md);
  gap: var(--space-md);
}

.page-name {
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin: 0 0 var(--space-xs) 0;
}

.post-time {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  margin: 0;
}

.view-link {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  font-size: var(--text-sm);
  color: var(--gold-primary);
  text-decoration: none;
  white-space: nowrap;
  transition: color var(--transition-base);
}

.view-link:hover {
  color: var(--gold-light);
}

.view-link svg {
  flex-shrink: 0;
}

.post-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.post-message {
  color: var(--text-secondary);
  font-size: var(--text-base);
  line-height: 1.6;
  margin: 0;
  word-wrap: break-word;
}

.post-image {
  width: 100%;
  max-height: 300px;
  object-fit: cover;
  border-radius: var(--radius-md);
  border: var(--border-width) solid var(--border-color);
}

.no-posts {
  text-align: center;
  color: var(--text-tertiary);
  font-size: var(--text-sm);
  padding: var(--space-2xl);
}

@media (max-width: 768px) {
  .test-post-view {
    padding: var(--space-xl) var(--space-md);
  }

  .page-header h1 {
    font-size: var(--font-size-2xl);
  }

  .history-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-md);
  }

  .filter-select {
    width: 100%;
  }

  .post-header {
    flex-direction: column;
    gap: var(--space-sm);
  }

  .view-link {
    align-self: flex-start;
  }
}
</style>
