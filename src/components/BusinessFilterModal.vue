<template>
  <BaseModal
    :model-value="modelValue"
    size="xl"
    title="Select Businesses"
    :show-close-button="true"
    @update:model-value="(val: boolean) => !val && close()"
    @close="close"
  >
    <template #header>
      <div class="modal-header-content">
        <div class="header-icon">🏪</div>
        <h2 class="modal-title">Select Businesses</h2>
      </div>
    </template>

    <!-- Search Bar -->
    <div class="search-container">
      <div class="search-wrapper">
        <span class="search-icon">🔍</span>
        <input
          v-model="searchQuery"
          type="text"
          class="search-input"
          placeholder="Search businesses..."
        />
      </div>
    </div>

    <!-- Selected Count -->
    <div v-if="selectedCount > 0" class="selected-count">
      {{ selectedCount }} business{{ selectedCount !== 1 ? 's' : '' }} selected
    </div>

    <!-- Business Grid -->
    <div class="businesses-grid">
      <div
        v-for="business in filteredBusinesses"
        :key="business.id"
        :class="['business-card', { selected: isSelected(business.id) }]"
        @click="toggleBusiness(business.id)"
      >
        <!-- Checkbox -->
        <div class="checkbox-wrapper">
          <input
            type="checkbox"
            :checked="isSelected(business.id)"
            class="checkbox-input"
            @click.stop
          />
          <span class="checkbox-custom"></span>
        </div>

        <!-- Business Logo/Image -->
        <div class="business-logo">
          <img
            v-if="business.brand_dna?.logo_url"
            :src="business.brand_dna.logo_url"
            :alt="business.name"
            class="logo-image"
            @error="handleImageError($event, business)"
          />
          <div v-else class="logo-placeholder">
            {{ getInitials(business.name) }}
          </div>
        </div>

        <!-- Business Info -->
        <div class="business-info">
          <h3 class="business-name">{{ business.name }}</h3>
          <p v-if="business.city || business.address" class="business-location">
            📍 {{ business.city || business.address }}
          </p>
        </div>

        <!-- Social Media Platforms -->
        <div v-if="business.platforms && business.platforms.length > 0" class="platforms">
          <span
            v-for="platform in business.platforms"
            :key="platform"
            :class="['platform-icon', `platform-${platform}`]"
            :title="platform"
          >
            {{ getPlatformEmoji(platform) }}
          </span>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="filteredBusinesses.length === 0" class="empty-state">
        <div class="empty-icon">🔍</div>
        <p class="empty-text">No businesses found</p>
        <p class="empty-hint">Try a different search term</p>
      </div>
    </div>

    <template #footer>
      <BaseButton variant="ghost" @click="clearSelection">
        Clear All
      </BaseButton>
      <BaseButton variant="primary" @click="close">
        Apply Filters
      </BaseButton>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import BaseModal from './BaseModal.vue'
import BaseButton from './BaseButton.vue'
import { warnLog } from '@/utils/debug'

interface Business {
  id: string
  name: string
  brand_dna?: {
    logo_url?: string
    brand_name?: string
  }
  location?: string
  city?: string
  address?: string
  platforms?: string[]
}

interface Props {
  modelValue: boolean
  businesses: Business[]
  selectedBusinessIds: string[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'update:selectedBusinessIds', value: string[]): void
}>()

const searchQuery = ref('')

const filteredBusinesses = computed(() => {
  if (!searchQuery.value.trim()) {
    return props.businesses
  }
  const query = searchQuery.value.toLowerCase()
  return props.businesses.filter((business) =>
    business.name.toLowerCase().includes(query) ||
    business.location?.toLowerCase().includes(query) ||
    business.city?.toLowerCase().includes(query) ||
    business.address?.toLowerCase().includes(query)
  )
})

const selectedCount = computed(() => props.selectedBusinessIds.length)

const isSelected = (id: string) => {
  return props.selectedBusinessIds.includes(id)
}

const toggleBusiness = (id: string) => {
  const currentIds = [...props.selectedBusinessIds]
  const index = currentIds.indexOf(id)

  if (index > -1) {
    currentIds.splice(index, 1)
  } else {
    currentIds.push(id)
  }

  emit('update:selectedBusinessIds', currentIds)
}

const clearSelection = () => {
  emit('update:selectedBusinessIds', [])
}

const close = () => {
  emit('update:modelValue', false)
}

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const getPlatformEmoji = (platform: string) => {
  const emojis: Record<string, string> = {
    instagram: '📷',
    facebook: '👥',
    tiktok: '🎵',
    twitter: '🐦',
    linkedin: '💼',
  }
  return emojis[platform] || '📱'
}

const handleImageError = (event: Event, business: Business) => {
  const img = event.target as HTMLImageElement
  img.style.display = 'none'
  warnLog(`Failed to load logo for business: ${business.name}`)
}
</script>

<style scoped>
/* Header */
.modal-header-content {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.header-icon {
  font-size: 1.75rem;
  filter: drop-shadow(0 2px 4px rgba(15, 61, 46, 0.3));
}

.modal-title {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  color: var(--gold-primary);
  margin: 0;
  flex: 1;
}

/* Search */
.search-container {
  margin-bottom: var(--space-lg);
}

.search-wrapper {
  position: relative;
}

.search-icon {
  position: absolute;
  left: var(--space-md);
  top: 50%;
  transform: translateY(-50%);
  font-size: 1.25rem;
  opacity: 0.5;
}

.search-input {
  width: 100%;
  padding: var(--space-md) var(--space-md) var(--space-md) 3rem;
  background: rgba(255, 255, 255, 0.85);
  border: 1px solid rgba(15, 61, 46, 0.25);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: var(--text-base);
  font-family: var(--font-body);
  transition: all 0.3s ease;
}

.search-input:focus {
  outline: none;
  border-color: var(--gold-primary);
  box-shadow: 0 0 20px rgba(15, 61, 46, 0.2);
}

.search-input::placeholder {
  color: var(--text-muted);
}

/* Selected Count */
.selected-count {
  padding: var(--space-sm) var(--space-xl);
  background: rgba(15, 61, 46, 0.1);
  border-radius: var(--radius-md);
  color: var(--gold-light);
  font-size: var(--text-sm);
  font-weight: 600;
  text-align: center;
  margin-bottom: var(--space-lg);
}

/* Business Grid */
.businesses-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--space-lg);
  align-content: start;
  max-height: 400px;
  overflow-y: auto;
}

.businesses-grid::-webkit-scrollbar {
  width: 8px;
}

.businesses-grid::-webkit-scrollbar-track {
  background: rgba(15, 61, 46, 0.1);
  border-radius: 4px;
}

.businesses-grid::-webkit-scrollbar-thumb {
  background: rgba(15, 61, 46, 0.3);
  border-radius: 4px;
}

.businesses-grid::-webkit-scrollbar-thumb:hover {
  background: rgba(15, 61, 46, 0.5);
}

/* Business Card */
.business-card {
  position: relative;
  padding: var(--space-lg);
  background: rgba(255, 255, 255, 0.6);
  border: 2px solid rgba(15, 61, 46, 0.15);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.business-card:hover {
  border-color: rgba(15, 61, 46, 0.4);
  background: rgba(255, 255, 255, 0.8);
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(15, 61, 46, 0.2), 0 0 20px rgba(15, 61, 46, 0.15);
}

.business-card.selected {
  border-color: var(--gold-primary);
  background: linear-gradient(135deg, rgba(15, 61, 46, 0.1), rgba(15, 61, 46, 0.05));
  box-shadow: 0 0 24px rgba(15, 61, 46, 0.2);
}

/* Checkbox */
.checkbox-wrapper {
  position: absolute;
  top: var(--space-md);
  right: var(--space-md);
}

.checkbox-input {
  position: absolute;
  opacity: 0;
  cursor: pointer;
}

.checkbox-custom {
  width: 22px;
  height: 22px;
  border: 2px solid rgba(15, 61, 46, 0.4);
  border-radius: var(--radius-sm);
  display: block;
  position: relative;
  transition: all 0.2s ease;
}

.business-card.selected .checkbox-custom {
  background: var(--gradient-gold);
  border-color: var(--gold-primary);
}

.business-card.selected .checkbox-custom::after {
  content: '✓';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: var(--text-on-gold);
  font-size: 14px;
  font-weight: bold;
}

/* Business Logo */
.business-logo {
  width: 80px;
  height: 80px;
  border-radius: var(--radius-md);
  overflow: hidden;
  background: rgba(255, 255, 255, 0.5);
  border: 1px solid rgba(15, 61, 46, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.logo-placeholder {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  font-weight: bold;
  color: var(--gold-primary);
  text-shadow: 0 2px 4px rgba(15, 61, 46, 0.25);
}

/* Business Info */
.business-info {
  flex: 1;
}

.business-name {
  font-family: var(--font-heading);
  font-size: var(--text-lg);
  color: var(--text-primary);
  margin: 0 0 var(--space-xs) 0;
  font-weight: 600;
}

.business-location {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin: 0;
}

/* Platforms */
.platforms {
  display: flex;
  gap: var(--space-xs);
  flex-wrap: wrap;
}

.platform-icon {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  background: rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(15, 61, 46, 0.2);
  transition: all 0.2s ease;
}

.platform-icon:hover {
  transform: scale(1.1);
  border-color: var(--gold-primary);
}

/* Empty State */
.empty-state {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-5xl) var(--space-xl);
  text-align: center;
}

.empty-icon {
  font-size: 4rem;
  opacity: 0.3;
  margin-bottom: var(--space-lg);
}

.empty-text {
  font-size: var(--text-xl);
  color: var(--text-primary);
  margin: 0 0 var(--space-sm) 0;
}

.empty-hint {
  font-size: var(--text-sm);
  color: var(--text-muted);
  margin: 0;
}

/* Responsive */
@media (max-width: 768px) {
  .businesses-grid {
    grid-template-columns: 1fr;
  }
}
</style>
