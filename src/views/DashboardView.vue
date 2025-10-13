<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { api } from '../services/api'

const router = useRouter()
const authStore = useAuthStore()

const message = ref('')
const messageType = ref<'success' | 'error' | 'info'>('info')
const generatedImageUrl = ref('')
const generating = ref(false)
const prompt = ref('')

const tierDisplayName = computed(() => authStore.user?.subscription.tier.toUpperCase() || 'FREE')
const progressPercent = computed(() => {
  if (!authStore.usageStats) return 0
  const { posts_this_month, monthly_limit } = authStore.usageStats
  return (posts_this_month / monthly_limit) * 100
})

async function handleLogout() {
  await authStore.logout()
  router.push('/login')
}

async function generateImage() {
  if (!prompt.value.trim()) {
    showMessage('Please enter a prompt', 'error')
    return
  }

  if (!authStore.canGenerateContent) {
    showMessage('Usage limit exceeded. Please upgrade your plan.', 'error')
    return
  }

  generating.value = true
  generatedImageUrl.value = ''

  try {
    const response = await api.generateImage(prompt.value)

    if (!response.success) {
      showMessage(response.error || 'Failed to generate image', 'error')
      return
    }

    showMessage('Image generated successfully!', 'success')
    generatedImageUrl.value = response.imageUrl || ''

    // Refresh profile to update usage stats
    await authStore.refreshProfile()
  } catch (error: any) {
    showMessage(error.message || 'Network error', 'error')
  } finally {
    generating.value = false
  }
}

async function openManageSubscription() {
  try {
    const response = await api.createPortalSession(window.location.href)

    if (!response.success) {
      showMessage(response.error || 'Failed to open portal', 'error')
      return
    }

    window.location.href = response.portal_url || ''
  } catch (error: any) {
    showMessage(error.message || 'Network error', 'error')
  }
}

function showMessage(msg: string, type: 'success' | 'error' | 'info') {
  message.value = msg
  messageType.value = type
  setTimeout(() => (message.value = ''), 5000)
}
</script>

<template>
  <div class="dashboard">
    <div class="header">
      <h1>🎨 Social Media AI</h1>
      <button class="btn-secondary btn-small" @click="handleLogout">Logout</button>
    </div>

    <div v-if="message" :class="`alert alert-${messageType}`">
      {{ message }}
    </div>

    <div class="card">
      <h2>Welcome, {{ authStore.user?.email }}!</h2>

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
            >{{ authStore.usageStats?.posts_this_month }} /
            {{ authStore.usageStats?.monthly_limit }} posts this month</span
          >
        </div>
        <div class="usage-bar">
          <div class="usage-progress" :style="{ width: `${progressPercent}%` }"></div>
        </div>
        <div class="info-row">
          <strong>Remaining:</strong>
          <span>{{ authStore.usageStats?.remaining_posts }} posts</span>
        </div>
      </div>

      <div class="generate-section">
        <h3>Generate Image</h3>
        <div class="form-group">
          <label for="prompt">Enter your prompt:</label>
          <textarea
            id="prompt"
            v-model="prompt"
            placeholder="Describe the image you want to generate... (e.g., A beautiful sunset over mountains)"
            rows="3"
            :disabled="generating"
          ></textarea>
        </div>
        <button
          class="btn-primary btn-large"
          :disabled="!authStore.canGenerateContent || generating || !prompt.trim()"
          @click="generateImage"
        >
          {{ generating ? 'Generating...' : 'Generate Image' }}
        </button>
      </div>

      <div class="actions">
        <button class="btn-secondary" @click="openManageSubscription">
          Manage Subscription
        </button>
        <button class="btn-secondary" @click="router.push('/plans')">View Plans</button>
      </div>

      <div v-if="generatedImageUrl" class="generated-image">
        <h3>Generated Image:</h3>
        <img :src="generatedImageUrl" alt="Generated image" />
        <a :href="generatedImageUrl" target="_blank" class="btn-secondary btn-small"
          >Open in New Tab</a
        >
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.header {
  max-width: 800px;
  margin: 0 auto 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: white;
}

.header h1 {
  font-size: 2em;
  margin: 0;
}

.card {
  max-width: 800px;
  margin: 0 auto;
  background: white;
  padding: 30px;
  border-radius: 10px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.card h2 {
  margin-bottom: 20px;
  color: #333;
}

.user-info {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid #e9ecef;
}

.info-row:last-child {
  border-bottom: none;
}

.tier-badge {
  background: #667eea;
  color: white;
  padding: 4px 12px;
  border-radius: 15px;
  font-weight: bold;
}

.usage-bar {
  width: 100%;
  height: 10px;
  background: #e9ecef;
  border-radius: 5px;
  overflow: hidden;
  margin: 10px 0;
}

.usage-progress {
  height: 100%;
  background: #667eea;
  transition: width 0.3s;
}

.actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.generate-section {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.generate-section h3 {
  margin-top: 0;
  margin-bottom: 15px;
  color: #333;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
}

.form-group textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 1em;
  font-family: inherit;
  resize: vertical;
  box-sizing: border-box;
}

.form-group textarea:focus {
  outline: none;
  border-color: #667eea;
}

.form-group textarea:disabled {
  background: #e9ecef;
  cursor: not-allowed;
}

.actions button {
  flex: 1;
  min-width: 150px;
}

button {
  padding: 12px 20px;
  border: none;
  border-radius: 5px;
  font-size: 1em;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-large {
  width: 100%;
  padding: 15px 20px;
  font-size: 1.1em;
  font-weight: 600;
}

.btn-primary {
  background: #667eea;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #5568d3;
}

.btn-primary:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #5a6268;
}

.btn-small {
  padding: 8px 16px;
  font-size: 0.9em;
}

.alert {
  max-width: 800px;
  margin: 0 auto 20px;
  padding: 15px;
  border-radius: 5px;
  font-size: 0.9em;
}

.alert-success {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.alert-error {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.alert-info {
  background: #d1ecf1;
  color: #0c5460;
  border: 1px solid #bee5eb;
}

.generated-image {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e9ecef;
}

.generated-image h3 {
  margin-bottom: 10px;
  color: #333;
}

.generated-image img {
  max-width: 100%;
  border-radius: 8px;
  margin-bottom: 10px;
}
</style>
