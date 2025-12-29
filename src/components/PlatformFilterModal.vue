<template>
  <BaseModal
    :model-value="modelValue"
    size="lg"
    title="Select Platforms"
    :show-close-button="true"
    @update:model-value="(val: boolean) => !val && close()"
    @close="close"
  >
    <template #header>
      <div class="modal-header-content">
        <div class="header-icon">📱</div>
        <h2 class="modal-title">Select Platforms</h2>
      </div>
    </template>

    <!-- Selected Count -->
    <div v-if="selectedCount > 0" class="selected-count">
      {{ selectedCount }} platform{{ selectedCount !== 1 ? 's' : '' }} selected
    </div>

    <!-- Platform Grid -->
    <div class="platforms-grid">
      <div
        v-for="platform in platforms"
        :key="platform.value"
        :class="['platform-card', { selected: isSelected(platform.value) }]"
        @click="togglePlatform(platform.value)"
      >
        <!-- Checkbox -->
        <div class="checkbox-wrapper">
          <input
            type="checkbox"
            :checked="isSelected(platform.value)"
            class="checkbox-input"
            @click.stop
          />
          <span class="checkbox-custom"></span>
        </div>

        <!-- Platform Icon -->
        <div class="platform-icon">
          {{ platform.emoji }}
        </div>

        <!-- Platform Info -->
        <div class="platform-info">
          <h3 class="platform-name">{{ platform.label }}</h3>
          <p class="platform-description">{{ platform.description }}</p>
        </div>
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
import { computed } from 'vue'
import BaseModal from './BaseModal.vue'
import BaseButton from './BaseButton.vue'

interface Props {
  modelValue: boolean
  selectedPlatforms: string[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'update:selectedPlatforms', value: string[]): void
}>()

const platforms = [
  {
    value: 'instagram',
    label: 'Instagram',
    emoji: '📷',
    description: 'Photo & video sharing'
  },
  {
    value: 'facebook',
    label: 'Facebook',
    emoji: '👥',
    description: 'Social networking'
  },
  {
    value: 'tiktok',
    label: 'TikTok',
    emoji: '🎵',
    description: 'Short-form videos'
  },
  {
    value: 'twitter',
    label: 'Twitter',
    emoji: '🐦',
    description: 'Microblogging platform'
  },
  {
    value: 'linkedin',
    label: 'LinkedIn',
    emoji: '💼',
    description: 'Professional network'
  },
]

const selectedCount = computed(() => props.selectedPlatforms.length)

const isSelected = (value: string) => {
  return props.selectedPlatforms.includes(value)
}

const togglePlatform = (value: string) => {
  const current = [...props.selectedPlatforms]
  const index = current.indexOf(value)

  if (index > -1) {
    current.splice(index, 1)
  } else {
    current.push(value)
  }

  emit('update:selectedPlatforms', current)
}

const clearSelection = () => {
  emit('update:selectedPlatforms', [])
}

const close = () => {
  emit('update:modelValue', false)
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

/* Selected Count */
.selected-count {
  padding: var(--space-sm) var(--space-xl);
  background: rgba(15, 61, 46, 0.1);
  border-bottom: 1px solid rgba(15, 61, 46, 0.1);
  color: var(--gold-light);
  font-size: var(--text-sm);
  font-weight: 600;
  text-align: center;
}

/* Platform Grid */
.platforms-grid {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-xl);
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--space-lg);
  align-content: start;
}

.platforms-grid::-webkit-scrollbar {
  width: 8px;
}

.platforms-grid::-webkit-scrollbar-track {
  background: rgba(15, 61, 46, 0.1);
  border-radius: 4px;
}

.platforms-grid::-webkit-scrollbar-thumb {
  background: rgba(15, 61, 46, 0.3);
  border-radius: 4px;
}

.platforms-grid::-webkit-scrollbar-thumb:hover {
  background: rgba(15, 61, 46, 0.5);
}

/* Platform Card */
.platform-card {
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
  align-items: center;
  text-align: center;
}

.platform-card:hover {
  border-color: rgba(15, 61, 46, 0.4);
  background: rgba(255, 255, 255, 0.8);
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(15, 61, 46, 0.2), 0 0 20px rgba(15, 61, 46, 0.15);
}

.platform-card.selected {
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

.platform-card.selected .checkbox-custom {
  background: var(--gradient-gold);
  border-color: var(--gold-primary);
}

.platform-card.selected .checkbox-custom::after {
  content: '✓';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: var(--text-on-gold);
  font-size: 14px;
  font-weight: bold;
}

/* Platform Icon */
.platform-icon {
  width: 80px;
  height: 80px;
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.5);
  border: 1px solid rgba(15, 61, 46, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
  transition: all 0.2s ease;
}

.platform-card:hover .platform-icon {
  transform: scale(1.1);
  border-color: var(--gold-primary);
}

/* Platform Info */
.platform-info {
  flex: 1;
  width: 100%;
}

.platform-name {
  font-family: var(--font-heading);
  font-size: var(--text-lg);
  color: var(--text-primary);
  margin: 0 0 var(--space-xs) 0;
  font-weight: 600;
}

.platform-description {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin: 0;
}

/* Responsive */
@media (max-width: 768px) {
  .platforms-grid {
    grid-template-columns: 1fr;
    padding: var(--space-md);
  }
}
</style>
