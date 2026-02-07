<script setup lang="ts">
/**
 * CarouselImageSelector - Multi-image selector with tabs for Upload vs Library
 * Supports 2-10 images with drag-to-reorder functionality
 */
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import MaterialIcon from '../MaterialIcon.vue'
import MediaLibraryPicker from './MediaLibraryPicker.vue'
import type { CarouselItem } from '@/types/scheduling'

interface Props {
  modelValue: CarouselItem[]
  minImages?: number
  maxImages?: number
  acceptTypes?: string
  brandId?: string
}

const props = withDefaults(defineProps<Props>(), {
  minImages: 2,
  maxImages: 10,
  acceptTypes: 'image/*'
})

const emit = defineEmits<{
  (e: 'update:modelValue', items: CarouselItem[]): void
}>()

const { t } = useI18n()

const activeTab = ref<'upload' | 'library'>('library')

function handleUpdate(items: CarouselItem[]) {
  emit('update:modelValue', items)
}
</script>

<template>
  <div class="carousel-image-selector">
    <!-- Tab Navigation -->
    <div class="tab-nav">
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'library' }"
        @click="activeTab = 'library'"
      >
        <MaterialIcon icon="photo_library" size="sm" />
        <span>{{ t('contentCreate.fromLibrary', 'From Library') }}</span>
      </button>
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'upload' }"
        @click="activeTab = 'upload'"
      >
        <MaterialIcon icon="upload" size="sm" />
        <span>{{ t('contentCreate.uploadNew', 'Upload New') }}</span>
      </button>
    </div>

    <!-- Tab Content -->
    <div class="tab-content">
      <MediaLibraryPicker
        v-if="activeTab === 'library'"
        :model-value="modelValue"
        :min-items="minImages"
        :max-items="maxImages"
        :brand-id="brandId"
        @update:model-value="handleUpdate"
      />

      <div v-else class="upload-tab">
        <div class="upload-instructions">
          <MaterialIcon icon="info" size="sm" :color="'var(--text-secondary)'" />
          <p>{{ t('contentCreate.uploadInstructions', 'Upload 2-10 new images for your carousel') }}</p>
        </div>
        <!-- Upload component content moved to separate slot/component if needed -->
        <p class="upload-note">{{ t('contentCreate.uploadFeatureComingSoon', 'Direct upload coming soon. For now, please use the Library tab to select from your existing posts.') }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.carousel-image-selector {
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
  width: 100%;
}

.tab-nav {
  display: flex;
  gap: var(--space-sm);
  padding: var(--space-sm);
  background: var(--bg-tertiary);
  border-radius: var(--radius-lg);
}

.tab-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  padding: var(--space-md) var(--space-lg);
  background: transparent;
  border: 2px solid transparent;
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  font-size: var(--text-base);
  font-weight: var(--font-medium);
  cursor: pointer;
  transition: var(--transition-base);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tab-btn:hover {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.tab-btn.active {
  background: var(--gradient-gold);
  border-color: var(--gold-primary);
  color: var(--text-on-gold);
  box-shadow: var(--glow-gold-sm);
}

.tab-content {
  min-height: 400px;
}

.upload-tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-5xl);
  gap: var(--space-xl);
  text-align: center;
}

.upload-instructions {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-lg);
  background: var(--bg-tertiary);
  border-radius: var(--radius-lg);
  max-width: 500px;
}

.upload-instructions p {
  margin: 0;
  font-size: var(--text-base);
  color: var(--text-primary);
  text-align: left;
}

.upload-note {
  font-size: var(--text-sm);
  color: var(--text-muted);
  max-width: 400px;
}

/* Mobile responsive */
@media (max-width: 768px) {
  .tab-btn span {
    display: none;
  }

  .tab-nav {
    justify-content: center;
  }
}
</style>
