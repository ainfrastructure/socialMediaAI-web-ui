<template>
  <BaseCard variant="glass-intense" class="filter-bar">
    <div class="filter-bar-header">
      <div class="filter-icon">🔍</div>
      <h3 class="filter-title">{{ t('filters.title') }}</h3>
      <BaseButton
        v-if="hasActiveFilters"
        variant="ghost"
        size="small"
        class="clear-all-btn"
        @click="$emit('clear')"
      >
        {{ t('filters.clearAll') }}
      </BaseButton>
    </div>

    <div class="filters-grid">
      <!-- Platform Filter (Modal Button) -->
      <button v-if="showPlatform" class="filter-btn" @click="showPlatformModal = true">
        <span class="btn-icon">📱</span>
        <span class="btn-text">
          {{ selectedPlatforms.length > 0 ? t('filters.platformsCount', { count: selectedPlatforms.length }) : t('filters.platforms') }}
        </span>
        <span class="btn-arrow">→</span>
      </button>

      <!-- Brand Filter (Modal Button) -->
      <button v-if="showBrand" class="filter-btn" @click="showBrandModal = true">
        <span class="btn-icon">🏪</span>
        <span class="btn-text">
          {{ selectedBrands.length > 0 ? t('filters.brandsCount', { count: selectedBrands.length }) : t('filters.brands') }}
        </span>
        <span class="btn-arrow">→</span>
      </button>

      <!-- Content Type Filter (Modal Button) -->
      <button v-if="showContentType" class="filter-btn" @click="showContentTypeModal = true">
        <span class="btn-icon">📸</span>
        <span class="btn-text">
          {{ selectedContentTypes.length > 0 ? t('filters.contentTypeCount', { count: selectedContentTypes.length }) : t('filters.contentType') }}
        </span>
        <span class="btn-arrow">→</span>
      </button>

      <!-- Sort Filter (Single select) -->
      <div v-if="showSort" class="select-wrapper">
        <span class="select-icon">🔃</span>
        <select
          :value="modelValue.sort"
          class="filter-select"
          @change="updateFilter('sort', ($event.target as HTMLSelectElement).value)"
        >
          <option value="newest">{{ t('filters.newestFirst') }}</option>
          <option value="oldest">{{ t('filters.oldestFirst') }}</option>
        </select>
        <span class="select-arrow">▼</span>
      </div>
    </div>

    <!-- Active Filters Tags -->
    <div v-if="hasActiveFilters" class="active-filters">
      <span class="active-filters-label">{{ t('filters.active') }}</span>
      <div class="filter-tags">
        <!-- Platform tags -->
        <span
          v-for="platform in selectedPlatforms"
          :key="platform"
          class="filter-tag"
          @click="toggleCheckbox('platforms', platform)"
        >
          {{ getPlatformName(platform) }}
          <span class="tag-close">×</span>
        </span>
        <!-- Brand tags -->
        <span
          v-for="brandId in selectedBrands"
          :key="brandId"
          class="filter-tag"
          @click="toggleCheckbox('brand_ids', brandId)"
        >
          {{ getBrandName(brandId) }}
          <span class="tag-close">×</span>
        </span>
        <!-- Content type tags -->
        <span
          v-for="type in selectedContentTypes"
          :key="type"
          class="filter-tag"
          @click="toggleCheckbox('content_types', type)"
        >
          {{ type === 'image' ? t('filters.images') : t('filters.videos') }}
          <span class="tag-close">×</span>
        </span>
      </div>
    </div>

    <!-- Filter Modals -->
    <PlatformFilterModal
      v-model="showPlatformModal"
      :selected-platforms="selectedPlatforms"
      @update:selected-platforms="updatePlatforms"
    />

    <BrandFilterModal
      v-model="showBrandModal"
      :brands="brands"
      :selected-brand-ids="selectedBrands"
      @update:selected-brand-ids="updateBrands"
    />

    <ContentTypeFilterModal
      v-model="showContentTypeModal"
      :selected-content-types="selectedContentTypes"
      @update:selected-content-types="updateContentTypes"
    />
  </BaseCard>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import BaseCard from './BaseCard.vue'
import BaseButton from './BaseButton.vue'
import BrandFilterModal from './BrandFilterModal.vue'
import PlatformFilterModal from './PlatformFilterModal.vue'
import ContentTypeFilterModal from './ContentTypeFilterModal.vue'

interface Filters {
  platforms?: string[]
  brand_ids?: string[]
  content_types?: string[]
  sort?: string
}

interface Props {
  modelValue: Filters
  brands?: any[]
  showPlatform?: boolean
  showBrand?: boolean
  showContentType?: boolean
  showSort?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  brands: () => [],
  showPlatform: true,
  showBrand: true,
  showContentType: false,
  showSort: false,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: Filters): void
  (e: 'change'): void
  (e: 'clear'): void
}>()

const { t } = useI18n()

const platforms = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'twitter', label: 'Twitter' },
  { value: 'linkedin', label: 'LinkedIn' },
]

const showBrandModal = ref(false)
const showPlatformModal = ref(false)
const showContentTypeModal = ref(false)

const selectedPlatforms = computed(() => props.modelValue.platforms || [])
const selectedBrands = computed(() => props.modelValue.brand_ids || [])
const selectedContentTypes = computed(() => props.modelValue.content_types || [])

const hasActiveFilters = computed(() => {
  return !!(
    (props.modelValue.platforms && props.modelValue.platforms.length > 0) ||
    (props.modelValue.brand_ids && props.modelValue.brand_ids.length > 0) ||
    (props.modelValue.content_types && props.modelValue.content_types.length > 0)
  )
})

const updateBrands = (brandIds: string[]) => {
  const newFilters = { ...props.modelValue, brand_ids: brandIds }
  emit('update:modelValue', newFilters)
  emit('change')
}

const updatePlatforms = (platforms: string[]) => {
  const newFilters = { ...props.modelValue, platforms }
  emit('update:modelValue', newFilters)
  emit('change')
}

const updateContentTypes = (contentTypes: string[]) => {
  const newFilters = { ...props.modelValue, content_types: contentTypes }
  emit('update:modelValue', newFilters)
  emit('change')
}

const toggleCheckbox = (key: keyof Filters, value: string) => {
  const currentValues = (props.modelValue[key] as string[]) || []
  let newValues: string[]

  if (currentValues.includes(value)) {
    newValues = currentValues.filter((v) => v !== value)
  } else {
    newValues = [...currentValues, value]
  }

  const newFilters = { ...props.modelValue, [key]: newValues }
  emit('update:modelValue', newFilters)
  emit('change')
}

const updateFilter = (key: keyof Filters, value: string) => {
  const newFilters = { ...props.modelValue, [key]: value }
  emit('update:modelValue', newFilters)
  emit('change')
}

const getPlatformName = (platform: string) => {
  const found = platforms.find((p) => p.value === platform)
  return found?.label || platform
}

const getBrandName = (id: string) => {
  const brand = props.brands.find((r) => r.id === id)
  return brand?.name || t('filters.brands')
}

</script>

<style scoped>
.filter-bar {
  margin-bottom: var(--space-xl);
  padding: var(--space-xl);
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(250, 247, 240, 0.95)) !important;
  backdrop-filter: blur(24px);
  border: 1px solid rgba(15, 61, 46, 0.2);
  box-shadow:
    0 8px 32px rgba(15, 61, 46, 0.2),
    0 0 40px rgba(15, 61, 46, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
  position: relative;
  overflow: visible;
}

.filter-bar::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--gold-primary), transparent);
  opacity: 0.6;
}

.filter-bar-header {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  margin-bottom: var(--space-lg);
  padding-bottom: var(--space-md);
  border-bottom: 1px solid rgba(15, 61, 46, 0.15);
}

.filter-icon {
  font-size: 1.5rem;
  filter: drop-shadow(0 2px 4px rgba(15, 61, 46, 0.3));
}

.filter-title {
  font-family: var(--font-heading);
  font-size: var(--text-lg);
  color: var(--gold-primary);
  margin: 0;
  flex: 1;
  letter-spacing: 0.5px;
}

.clear-all-btn {
  opacity: 0.8;
  transition: opacity 0.2s ease;
}

.clear-all-btn:hover {
  opacity: 1;
}

.filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: var(--space-md);
  margin-bottom: var(--space-md);
  overflow: visible;
}

/* Filter Button (consistent styling for all filters) */
.filter-btn {
  width: 100%;
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-md);
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(15, 61, 46, 0.25);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: 0.9375rem;
  font-family: var(--font-body);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.filter-btn:hover {
  border-color: var(--gold-primary);
  background: rgba(255, 255, 255, 1);
  box-shadow: 0 0 12px rgba(15, 61, 46, 0.15);
  transform: translateY(-1px);
}

.filter-btn:active {
  transform: translateY(0);
}

.btn-icon {
  font-size: 1.25rem;
}

.btn-text {
  flex: 1;
  text-align: left;
}

.btn-arrow {
  color: var(--gold-primary);
  transition: transform 0.3s ease;
}

.filter-btn:hover .btn-arrow {
  transform: translateX(4px);
}

/* Select Wrapper (for Sort) */
.select-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.select-icon {
  position: absolute;
  left: var(--space-md);
  font-size: 1.25rem;
  pointer-events: none;
  z-index: 1;
}

.filter-select {
  width: 100%;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(15, 61, 46, 0.25);
  border-radius: var(--radius-md);
  padding: var(--space-md) var(--space-xl) var(--space-md) 3.5rem;
  color: var(--text-primary);
  font-size: 0.9375rem;
  font-family: var(--font-body);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  appearance: none;
  height: 46px;
}

.filter-select:hover {
  border-color: var(--gold-primary);
  background: rgba(255, 255, 255, 1);
  box-shadow: 0 0 12px rgba(15, 61, 46, 0.15);
  transform: translateY(-1px);
}

.filter-select:focus {
  outline: none;
  border-color: var(--gold-primary);
  background: rgba(255, 255, 255, 1);
  box-shadow: 0 0 20px rgba(15, 61, 46, 0.25);
  transform: translateY(-1px);
}

.filter-select option {
  background: var(--bg-primary);
  color: var(--text-primary);
  padding: var(--space-sm);
}

.select-arrow {
  position: absolute;
  right: var(--space-md);
  top: 50%;
  transform: translateY(-50%);
  color: var(--gold-primary);
  font-size: 0.625rem;
  pointer-events: none;
  transition: transform 0.3s ease;
}

.filter-select:focus + .select-arrow {
  transform: translateY(-50%) rotate(180deg);
}

/* Active Filters Tags */
.active-filters {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding-top: var(--space-lg);
  border-top: 1px solid rgba(15, 61, 46, 0.1);
  margin-top: var(--space-md);
}

.active-filters-label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.filter-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
  flex: 1;
}

.filter-tag {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-xs) var(--space-md);
  background: linear-gradient(135deg, rgba(15, 61, 46, 0.15), rgba(15, 61, 46, 0.25));
  border: 1px solid rgba(15, 61, 46, 0.4);
  border-radius: var(--radius-full);
  color: var(--gold-light);
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.filter-tag:hover {
  background: linear-gradient(135deg, rgba(15, 61, 46, 0.25), rgba(15, 61, 46, 0.35));
  border-color: var(--gold-primary);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(15, 61, 46, 0.2);
}

.tag-close {
  font-size: 1.125rem;
  line-height: 1;
  opacity: 0.7;
  transition: opacity 0.2s ease;
}

.filter-tag:hover .tag-close {
  opacity: 1;
}

/* Responsive */
@media (max-width: 768px) {
  .filters-grid {
    grid-template-columns: 1fr;
    gap: var(--space-md);
  }

  .filter-bar-header {
    flex-wrap: wrap;
  }

  .active-filters {
    flex-direction: column;
    align-items: flex-start;
  }

  .checkbox-group {
    max-height: 150px;
  }

  .filter-btn {
    min-height: var(--touch-target-min);
  }

  .clear-btn {
    min-height: var(--touch-target-min);
  }
}

@media (max-width: 480px) {
  .filter-bar {
    padding: var(--space-md);
  }

  .filter-bar-header {
    flex-direction: column;
    align-items: stretch;
    gap: var(--space-sm);
  }

  .filter-title {
    font-size: var(--text-base);
  }

  .filter-btn {
    width: 100%;
    justify-content: center;
  }

  .filter-actions {
    width: 100%;
  }

  .clear-btn {
    width: 100%;
    justify-content: center;
  }

  .filter-tags {
    flex-wrap: wrap;
  }

  .filter-tag {
    font-size: var(--text-xs);
  }
}

@media (max-width: 390px) {
  .filter-bar {
    padding: var(--space-sm);
  }

  .filter-title {
    font-size: var(--text-sm);
  }

  .filter-btn {
    font-size: var(--text-xs);
    padding: var(--space-sm);
  }
}

/* ===== DARK MODE OVERRIDES ===== */
:root[data-theme="dark"] .filter-bar {
  background: linear-gradient(135deg, var(--bg-secondary), var(--bg-tertiary)) !important;
  border-color: var(--border-color);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.3),
    0 0 40px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.02);
}

:root[data-theme="dark"] .filter-bar-header {
  border-bottom-color: var(--border-color);
}

:root[data-theme="dark"] .filter-icon {
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
}

:root[data-theme="dark"] .filter-btn {
  background: var(--bg-tertiary);
  border-color: var(--border-color);
}

:root[data-theme="dark"] .filter-btn:hover {
  background: var(--bg-elevated);
  box-shadow: 0 0 12px rgba(0, 0, 0, 0.2);
}

:root[data-theme="dark"] .filter-select {
  background: var(--bg-tertiary);
  border-color: var(--border-color);
}

:root[data-theme="dark"] .filter-select:hover {
  background: var(--bg-elevated);
  box-shadow: 0 0 12px rgba(0, 0, 0, 0.2);
}

:root[data-theme="dark"] .filter-select:focus {
  background: var(--bg-elevated);
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.3);
}

:root[data-theme="dark"] .active-filters {
  border-top-color: var(--border-color);
}

:root[data-theme="dark"] .filter-tag {
  background: linear-gradient(135deg, var(--accent-alpha-15), var(--accent-alpha-25));
  border-color: var(--accent-alpha-40);
}

:root[data-theme="dark"] .filter-tag:hover {
  background: linear-gradient(135deg, var(--accent-alpha-25), var(--accent-alpha-35));
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}
</style>
