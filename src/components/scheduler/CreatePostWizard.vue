<template>
  <Teleport to="body">
    <div v-if="modelValue" class="modal-overlay" @click.self="$emit('update:modelValue', false)">
      <BaseCard variant="glass-intense" class="wizard-modal">
        <div class="wizard-header">
          <h2 class="wizard-title">{{ $t('scheduler.createPostFor', 'Create Post for') }} {{ formattedDate }}</h2>
          <button class="wizard-close-btn" @click="$emit('update:modelValue', false)">&times;</button>
        </div>

        <div class="wizard-body">
          <p class="wizard-subtitle">{{ $t('scheduler.howToCreate', 'How would you like to create your post?') }}</p>

          <div class="creation-options">
            <!-- From Saved Posts Option -->
            <button
              class="creation-option-card"
              @click="$emit('select', 'saved')"
            >
              <div class="option-icon">✨</div>
              <h3 class="option-title">{{ $t('scheduler.fromSavedPosts', 'From Saved Posts') }}</h3>
              <p class="option-description">
                {{ $t('scheduler.chooseSavedPosts', 'Choose from your saved posts') }}
              </p>
            </button>

            <!-- Create New Option -->
            <button
              class="creation-option-card"
              @click="$emit('select', 'new')"
            >
              <div class="option-icon-logo">
                <img src="/src/assets/socialchef_logo.svg" alt="SocialChef" class="chef-logo-icon" />
              </div>
              <h3 class="option-title">{{ $t('scheduler.createNew', 'Create New') }}</h3>
              <p class="option-description">
                {{ $t('scheduler.cookUpFresh', 'Cook up fresh content') }}
              </p>
            </button>
          </div>
        </div>
      </BaseCard>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import BaseCard from '../BaseCard.vue'

const props = defineProps<{
  modelValue: boolean
  selectedDate: string | null
}>()

defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'select', method: 'saved' | 'new'): void
}>()

const formattedDate = computed(() => {
  if (!props.selectedDate) return ''
  const date = new Date(props.selectedDate + 'T00:00:00')
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
})
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(15, 61, 46, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: var(--space-lg);
}

.wizard-modal {
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.wizard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: var(--space-lg);
  border-bottom: 1px solid rgba(15, 61, 46, 0.1);
  margin-bottom: var(--space-xl);
}

.wizard-title {
  font-family: var(--font-heading);
  font-size: var(--text-xl);
  color: var(--text-primary);
  margin: 0;
}

.wizard-close-btn {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  font-size: var(--text-2xl);
  cursor: pointer;
  padding: var(--space-sm);
  line-height: 1;
  transition: color var(--transition-base);
}

.wizard-close-btn:hover {
  color: var(--text-primary);
}

.wizard-body {
  text-align: center;
}

.wizard-subtitle {
  color: var(--text-secondary);
  margin-bottom: var(--space-2xl);
}

.creation-options {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-lg);
}

.creation-option-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-2xl) var(--space-lg);
  background: rgba(255, 255, 255, 0.8);
  border: 2px solid rgba(15, 61, 46, 0.1);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all var(--transition-base);
  text-align: center;
  color: var(--text-primary);
}

.creation-option-card:hover {
  border-color: rgba(15, 61, 46, 0.25);
  background: rgba(15, 61, 46, 0.03);
  transform: translateY(-4px);
}

.option-icon {
  font-size: 48px;
}

.option-icon-logo {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chef-logo-icon {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.option-title {
  font-family: var(--font-heading);
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  margin: 0;
}

.option-description {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin: 0;
}

@media (max-width: 600px) {
  .creation-options {
    grid-template-columns: 1fr;
  }
}

/* ===== DARK MODE OVERRIDES ===== */
:root[data-theme="dark"] .modal-overlay {
  background: rgba(0, 0, 0, 0.7);
}

:root[data-theme="dark"] .wizard-header {
  border-bottom-color: var(--border-color);
}

:root[data-theme="dark"] .creation-option-card {
  background: var(--bg-tertiary);
  border-color: var(--border-color);
}

:root[data-theme="dark"] .creation-option-card:hover {
  border-color: var(--accent-alpha-30);
  background: var(--bg-elevated);
}
</style>
