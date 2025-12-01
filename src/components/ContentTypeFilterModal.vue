<template>
  <BaseModal
    :model-value="modelValue"
    size="md"
    title="Select Content Types"
    :show-close-button="true"
    @update:model-value="(val: boolean) => !val && close()"
    @close="close"
  >
    <template #header>
      <div class="modal-header-content">
        <div class="header-icon">📸</div>
        <h2 class="modal-title">Select Content Types</h2>
      </div>
    </template>

    <!-- Selected Count -->
    <div v-if="selectedCount > 0" class="selected-count">
      {{ selectedCount }} type{{ selectedCount !== 1 ? 's' : '' }} selected
    </div>

    <!-- Content Type Grid -->
    <div class="content-types-grid">
      <div
        v-for="type in contentTypes"
        :key="type.value"
        :class="['content-type-card', { selected: isSelected(type.value) }]"
        @click="toggleContentType(type.value)"
      >
        <!-- Checkbox -->
        <div class="checkbox-wrapper">
          <input
            type="checkbox"
            :checked="isSelected(type.value)"
            class="checkbox-input"
            @click.stop
          />
          <span class="checkbox-custom"></span>
        </div>

        <!-- Content Type Icon -->
        <div class="content-type-icon">
          {{ type.emoji }}
        </div>

        <!-- Content Type Info -->
        <div class="content-type-info">
          <h3 class="content-type-name">{{ type.label }}</h3>
          <p class="content-type-description">{{ type.description }}</p>
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
  selectedContentTypes: string[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'update:selectedContentTypes', value: string[]): void
}>()

const contentTypes = [
  {
    value: 'image',
    label: 'Images',
    emoji: '🖼️',
    description: 'Static images & photos'
  },
  {
    value: 'video',
    label: 'Videos',
    emoji: '🎬',
    description: 'Video content & reels'
  },
]

const selectedCount = computed(() => props.selectedContentTypes.length)

const isSelected = (value: string) => {
  return props.selectedContentTypes.includes(value)
}

const toggleContentType = (value: string) => {
  const current = [...props.selectedContentTypes]
  const index = current.indexOf(value)

  if (index > -1) {
    current.splice(index, 1)
  } else {
    current.push(value)
  }

  emit('update:selectedContentTypes', current)
}

const clearSelection = () => {
  emit('update:selectedContentTypes', [])
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
  filter: drop-shadow(0 2px 4px rgba(212, 175, 55, 0.3));
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
  background: rgba(212, 175, 55, 0.1);
  border-bottom: 1px solid rgba(212, 175, 55, 0.1);
  color: var(--gold-light);
  font-size: var(--text-sm);
  font-weight: 600;
  text-align: center;
  margin: calc(-1 * var(--space-xl)) calc(-1 * var(--space-xl)) var(--space-lg);
}

/* Content Type Grid */
.content-types-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: var(--space-lg);
  align-content: start;
}

.content-types-grid::-webkit-scrollbar {
  width: 8px;
}

.content-types-grid::-webkit-scrollbar-track {
  background: rgba(10, 10, 10, 0.5);
  border-radius: 4px;
}

.content-types-grid::-webkit-scrollbar-thumb {
  background: rgba(212, 175, 55, 0.3);
  border-radius: 4px;
}

.content-types-grid::-webkit-scrollbar-thumb:hover {
  background: rgba(212, 175, 55, 0.5);
}

/* Content Type Card */
.content-type-card {
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

.content-type-card:hover {
  border-color: rgba(212, 175, 55, 0.4);
  background: rgba(20, 20, 20, 0.8);
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4), 0 0 20px rgba(212, 175, 55, 0.15);
}

.content-type-card.selected {
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

.content-type-card.selected .checkbox-custom {
  background: var(--gradient-gold);
  border-color: var(--gold-primary);
}

.content-type-card.selected .checkbox-custom::after {
  content: '✓';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: var(--text-on-gold);
  font-size: 14px;
  font-weight: bold;
}

/* Content Type Icon */
.content-type-icon {
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

.content-type-card:hover .content-type-icon {
  transform: scale(1.1);
  border-color: var(--gold-primary);
}

/* Content Type Info */
.content-type-info {
  flex: 1;
  width: 100%;
}

.content-type-name {
  font-family: var(--font-heading);
  font-size: var(--text-lg);
  color: var(--text-primary);
  margin: 0 0 var(--space-xs) 0;
  font-weight: 600;
}

.content-type-description {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin: 0;
}

/* Responsive */
@media (max-width: 768px) {
  .content-types-grid {
    grid-template-columns: 1fr;
  }
}
</style>
