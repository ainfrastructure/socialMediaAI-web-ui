<template>
  <div class="favorites-view">
    <GradientBackground />

    <div class="container">
      <div class="header">
        <h1 class="title">Favorite Posts</h1>
        <p class="subtitle">Your saved marketing content</p>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="loading-container">
        <div class="spinner"></div>
        <p>Loading favorites...</p>
      </div>

      <!-- Empty State -->
      <BaseCard v-else-if="favorites.length === 0" variant="glass-intense" class="empty-state">
        <div class="empty-content">
          <h3>No favorites yet</h3>
          <p>Go to the Playground to create and save your first post!</p>
          <BaseButton variant="primary" @click="router.push('/playground')">
            Go to Playground
          </BaseButton>
        </div>
      </BaseCard>

      <!-- Favorites Grid -->
      <div v-else class="favorites-grid">
        <BaseCard
          v-for="favorite in favorites"
          :key="favorite.id"
          variant="glass"
          hoverable
          class="favorite-card"
          @click="viewDetails(favorite)"
        >
          <!-- Media Preview -->
          <div class="media-container" @click.stop>
            <img
              v-if="favorite.content_type === 'image'"
              :src="favorite.media_url"
              alt="Favorite post"
              class="favorite-media"
            />
            <video
              v-else
              :src="favorite.media_url"
              class="favorite-media"
              controls
            ></video>

            <!-- Content Type Badge -->
            <span :class="['type-badge', favorite.content_type]">
              {{ favorite.content_type === 'image' ? '📸' : '🎥' }}
              {{ favorite.content_type }}
            </span>

            <!-- Platform Badge -->
            <span v-if="favorite.platform" :class="['platform-badge', `platform-${favorite.platform}`]">
              {{ favorite.platform }}
            </span>
          </div>

          <!-- Post Details -->
          <div class="favorite-details">
            <!-- Restaurant Name -->
            <div v-if="favorite.saved_restaurants?.name" class="restaurant-name">
              🏪 {{ favorite.saved_restaurants.name }}
            </div>

            <!-- Post Text -->
            <p v-if="favorite.post_text" class="post-text">
              {{ truncateText(favorite.post_text, 150) }}
            </p>

            <!-- Hashtags -->
            <div v-if="favorite.hashtags && favorite.hashtags.length > 0" class="hashtags">
              <span v-for="(tag, idx) in favorite.hashtags.slice(0, 3)" :key="idx" class="hashtag">
                {{ tag }}
              </span>
              <span v-if="favorite.hashtags.length > 3" class="more-tags">
                +{{ favorite.hashtags.length - 3 }}
              </span>
            </div>

            <!-- Actions -->
            <div class="favorite-actions" @click.stop>
              <BaseButton variant="primary" size="small" @click="schedulePost(favorite)">
                📅 Schedule
              </BaseButton>
              <BaseButton variant="danger" size="small" @click="deleteFavorite(favorite.id)">
                🗑️ Delete
              </BaseButton>
            </div>

            <!-- Created Date -->
            <div class="created-date">
              {{ formatDate(favorite.created_at) }}
            </div>
          </div>
        </BaseCard>
      </div>
    </div>

    <!-- Schedule Modal -->
    <ScheduleModal
      v-model="showScheduleModal"
      :favorite-post="selectedFavorite"
      @scheduled="handleScheduled"
    />

    <!-- Detail Modal -->
    <Teleport to="body">
      <div v-if="showDetailModal" class="modal-overlay" @click.self="closeDetailModal">
        <BaseCard variant="glass-intense" class="detail-modal">
          <div class="modal-header">
            <h3 class="modal-title">Post Details</h3>
            <button class="close-btn" @click="closeDetailModal">&times;</button>
          </div>

          <div v-if="selectedFavorite" class="modal-body">
            <!-- Media -->
            <img
              v-if="selectedFavorite.content_type === 'image'"
              :src="selectedFavorite.media_url"
              alt="Post"
              class="detail-media"
            />
            <video
              v-else
              :src="selectedFavorite.media_url"
              class="detail-media"
              controls
            ></video>

            <!-- Full Post Text -->
            <div v-if="selectedFavorite.post_text" class="detail-section">
              <h4>Post Text</h4>
              <p class="full-text">{{ selectedFavorite.post_text }}</p>
              <BaseButton variant="ghost" size="small" @click="copyToClipboard(selectedFavorite.post_text)">
                📋 Copy
              </BaseButton>
            </div>

            <!-- Call to Action -->
            <div v-if="selectedFavorite.call_to_action" class="detail-section">
              <h4>Call to Action</h4>
              <p>{{ selectedFavorite.call_to_action }}</p>
            </div>

            <!-- Hashtags -->
            <div v-if="selectedFavorite.hashtags && selectedFavorite.hashtags.length > 0" class="detail-section">
              <h4>Hashtags</h4>
              <div class="hashtags-full">
                <span v-for="(tag, idx) in selectedFavorite.hashtags" :key="idx" class="hashtag">
                  {{ tag }}
                </span>
              </div>
              <BaseButton variant="ghost" size="small" @click="copyToClipboard(selectedFavorite.hashtags.join(' '))">
                📋 Copy All
              </BaseButton>
            </div>

            <!-- Prompt -->
            <div v-if="selectedFavorite.prompt" class="detail-section">
              <h4>Original Prompt</h4>
              <p class="prompt-text">{{ selectedFavorite.prompt }}</p>
            </div>
          </div>
        </BaseCard>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import GradientBackground from '../components/GradientBackground.vue'
import BaseCard from '../components/BaseCard.vue'
import BaseButton from '../components/BaseButton.vue'
import ScheduleModal from '../components/ScheduleModal.vue'
import { api } from '../services/api'

const router = useRouter()

const favorites = ref<any[]>([])
const loading = ref(false)
const selectedFavorite = ref<any>(null)
const showScheduleModal = ref(false)
const showDetailModal = ref(false)

const fetchFavorites = async () => {
  try {
    loading.value = true
    const response = await api.getFavorites()

    if (response.success) {
      favorites.value = response.data?.favorites || []
    }
  } catch (error) {
    console.error('Error fetching favorites:', error)
  } finally {
    loading.value = false
  }
}

const schedulePost = (favorite: any) => {
  selectedFavorite.value = favorite
  showScheduleModal.value = true
}

const viewDetails = (favorite: any) => {
  selectedFavorite.value = favorite
  showDetailModal.value = true
}

const closeDetailModal = () => {
  showDetailModal.value = false
  selectedFavorite.value = null
}

const deleteFavorite = async (id: string) => {
  if (!confirm('Are you sure you want to delete this favorite?')) {
    return
  }

  try {
    const response = await api.deleteFavorite(id)

    if (response.success) {
      await fetchFavorites()
    }
  } catch (error) {
    console.error('Error deleting favorite:', error)
  }
}

const handleScheduled = () => {
  showScheduleModal.value = false
  selectedFavorite.value = null
}

const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    alert('Copied to clipboard!')
  } catch (error) {
    console.error('Failed to copy:', error)
  }
}

onMounted(() => {
  fetchFavorites()
})
</script>

<style scoped>
.favorites-view {
  min-height: 100vh;
  position: relative;
  padding: 2rem 1rem;
}

.container {
  max-width: 1400px;
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

.loading-container {
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
  to {
    transform: rotate(360deg);
  }
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

.favorites-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 2rem;
}

.favorite-card {
  overflow: hidden;
  display: flex;
  flex-direction: column;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.favorite-card:hover {
  transform: translateY(-2px);
}

.media-container {
  position: relative;
  width: 100%;
  height: 250px;
  overflow: hidden;
}

.favorite-media {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.type-badge {
  position: absolute;
  top: 1rem;
  left: 1rem;
  padding: 0.5rem 1rem;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
  text-transform: capitalize;
}

.type-badge.image {
  border-left: 3px solid #4CAF50;
}

.type-badge.video {
  border-left: 3px solid #2196F3;
}

.platform-badge {
  position: absolute;
  top: 1rem;
  right: 1rem;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
}

.platform-badge.platform-instagram {
  background: rgba(225, 48, 108, 0.9);
  color: white;
}

.platform-badge.platform-facebook {
  background: rgba(66, 103, 178, 0.9);
  color: white;
}

.platform-badge.platform-tiktok {
  background: rgba(0, 0, 0, 0.9);
  color: white;
}

.platform-badge.platform-twitter {
  background: rgba(29, 161, 242, 0.9);
  color: white;
}

.favorite-details {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  flex: 1;
}

.restaurant-name {
  font-size: 0.875rem;
  color: var(--gold-primary);
  font-weight: 600;
}

.post-text {
  color: var(--text-secondary);
  line-height: 1.6;
  margin: 0;
  flex: 1;
}

.hashtags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.hashtag {
  padding: 0.25rem 0.75rem;
  background: rgba(212, 175, 55, 0.15);
  color: var(--gold-light);
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 500;
}

.more-tags {
  padding: 0.25rem 0.75rem;
  background: rgba(212, 175, 55, 0.1);
  color: var(--text-muted);
  border-radius: 6px;
  font-size: 0.75rem;
}

.favorite-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: auto;
  padding-top: 1rem;
  border-top: 1px solid rgba(212, 175, 55, 0.2);
}

.created-date {
  font-size: 0.75rem;
  color: var(--text-muted);
  text-align: center;
}

/* Detail Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(var(--blur-md));
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-xl);
  z-index: 1000;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.detail-modal {
  max-width: 800px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-xl);
  border-bottom: 1px solid rgba(212, 175, 55, 0.2);
}

.modal-title {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  color: var(--gold-primary);
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 2rem;
  line-height: 1;
  cursor: pointer;
  padding: 0;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: rgba(212, 175, 55, 0.1);
  color: var(--gold-primary);
}

.modal-body {
  padding: var(--space-xl);
}

.detail-media {
  width: 100%;
  max-height: 400px;
  object-fit: contain;
  border-radius: var(--radius-md);
  margin-bottom: var(--space-xl);
}

.detail-section {
  margin-bottom: var(--space-xl);
  padding-bottom: var(--space-xl);
  border-bottom: 1px solid rgba(212, 175, 55, 0.1);
}

.detail-section:last-child {
  border-bottom: none;
}

.detail-section h4 {
  font-family: var(--font-heading);
  font-size: var(--text-lg);
  color: var(--gold-primary);
  margin: 0 0 var(--space-md) 0;
}

.full-text,
.prompt-text {
  color: var(--text-secondary);
  line-height: 1.6;
  white-space: pre-wrap;
  margin-bottom: var(--space-md);
}

.hashtags-full {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: var(--space-md);
}

/* Responsive */
@media (max-width: 768px) {
  .title {
    font-size: 2rem;
  }

  .favorites-grid {
    grid-template-columns: 1fr;
  }

  .favorite-actions {
    flex-direction: column;
  }
}
</style>
