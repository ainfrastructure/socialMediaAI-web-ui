<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="modelValue" class="modal-overlay" @click.self="close">
        <div class="modal-container">
          <BaseCard variant="glass-intense" class="modal-card">
            <!-- Header -->
            <div class="modal-header">
              <div class="header-icon">📱</div>
              <h2 class="modal-title">Select Platforms</h2>
              <button class="close-btn" @click="close">×</button>
            </div>

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

            <!-- Footer Actions -->
            <div class="modal-footer">
              <BaseButton variant="ghost" @click="clearSelection">
                Clear All
              </BaseButton>
              <BaseButton variant="primary" @click="close">
                Apply Filters
              </BaseButton>
            </div>
          </BaseCard>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import BaseCard from './BaseCard.vue'
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
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: var(--space-xl);
}

.modal-container {
  width: 100%;
  max-width: 700px;
  max-height: 90vh;
  animation: modalSlideUp 0.3s ease;
}

@keyframes modalSlideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-card {
  display: flex;
  flex-direction: column;
  max-height: 90vh;
  padding: 0;
  overflow: hidden;
}

/* Header */
.modal-header {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-xl);
  border-bottom: 1px solid rgba(212, 175, 55, 0.15);
  background: linear-gradient(135deg, rgba(20, 20, 20, 0.8), rgba(30, 30, 30, 0.8));
}

.header-icon {
  font-size: 1.75rem;
  filter: drop-shadow(0 2px 4px rgba(212, 175, 55, 0.3));
}

.modal-title {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  color: var(--gold-primary);
  margin: 0;
  flex: 1;
}

.close-btn {
  width: 36px;
  height: 36px;
  border: none;
  background: rgba(212, 175, 55, 0.1);
  color: var(--gold-primary);
  font-size: 1.5rem;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.close-btn:hover {
  background: rgba(212, 175, 55, 0.2);
  transform: rotate(90deg);
}

/* Selected Count */
.selected-count {
  padding: var(--space-sm) var(--space-xl);
  background: rgba(212, 175, 55, 0.1);
  border-bottom: 1px solid rgba(212, 175, 55, 0.1);
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
  background: rgba(10, 10, 10, 0.5);
  border-radius: 4px;
}

.platforms-grid::-webkit-scrollbar-thumb {
  background: rgba(212, 175, 55, 0.3);
  border-radius: 4px;
}

.platforms-grid::-webkit-scrollbar-thumb:hover {
  background: rgba(212, 175, 55, 0.5);
}

/* Platform Card */
.platform-card {
  position: relative;
  padding: var(--space-lg);
  background: rgba(20, 20, 20, 0.6);
  border: 2px solid rgba(212, 175, 55, 0.15);
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
  border-color: rgba(212, 175, 55, 0.4);
  background: rgba(20, 20, 20, 0.8);
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4), 0 0 20px rgba(212, 175, 55, 0.15);
}

.platform-card.selected {
  border-color: var(--gold-primary);
  background: linear-gradient(135deg, rgba(212, 175, 55, 0.1), rgba(212, 175, 55, 0.05));
  box-shadow: 0 0 24px rgba(212, 175, 55, 0.2);
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
  border: 2px solid rgba(212, 175, 55, 0.4);
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
  background: rgba(10, 10, 10, 0.5);
  border: 1px solid rgba(212, 175, 55, 0.2);
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

/* Footer */
.modal-footer {
  display: flex;
  justify-content: space-between;
  gap: var(--space-md);
  padding: var(--space-xl);
  border-top: 1px solid rgba(212, 175, 55, 0.15);
  background: linear-gradient(135deg, rgba(20, 20, 20, 0.8), rgba(30, 30, 30, 0.8));
}

/* Transitions */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

/* Responsive */
@media (max-width: 768px) {
  .modal-overlay {
    padding: var(--space-md);
  }

  .platforms-grid {
    grid-template-columns: 1fr;
    padding: var(--space-md);
  }

  .modal-footer {
    flex-direction: column;
  }

  .modal-footer button {
    width: 100%;
  }
}
</style>
