<template>
  <BaseCard variant="glass-intense" class="filter-bar">
    <div class="filter-bar-header">
      <div class="filter-icon">🔍</div>
      <h3 class="filter-title">Filters</h3>
      <BaseButton
        v-if="hasActiveFilters"
        variant="ghost"
        size="small"
        class="clear-all-btn"
        @click="$emit('clear')"
      >
        Clear All
      </BaseButton>
    </div>

    <div class="filters-grid">
      <!-- Platform Filter (Dropdown) -->
      <div v-if="showPlatform" class="filter-item">
        <label class="filter-label">
          <span class="label-icon">📱</span>
          <span class="label-text">Platforms</span>
        </label>
        <div class="dropdown-wrapper" ref="platformDropdownRef">
          <button class="filter-dropdown-btn" @click="toggleDropdown('platform')">
            <span class="btn-text">
              {{ selectedPlatforms.length > 0 ? `${selectedPlatforms.length} Selected` : 'All Platforms' }}
            </span>
            <span :class="['btn-arrow', { open: openDropdown === 'platform' }]">▼</span>
          </button>
          <Teleport to="body">
            <div
              v-if="openDropdown === 'platform' && platformDropdownRef"
              class="dropdown-menu-portal"
              :style="getDropdownPosition(platformDropdownRef)"
            >
              <label
                v-for="platform in platforms"
                :key="platform.value"
                class="dropdown-item"
              >
                <input
                  type="checkbox"
                  :value="platform.value"
                  :checked="isChecked('platforms', platform.value)"
                  class="checkbox-input"
                  @change="toggleCheckbox('platforms', platform.value)"
                />
                <span class="checkbox-custom"></span>
                <span class="checkbox-text">{{ platform.label }}</span>
              </label>
            </div>
          </Teleport>
        </div>
      </div>

      <!-- Restaurant Filter (Modal Button) -->
      <div v-if="showRestaurant" class="filter-item">
        <label class="filter-label">
          <span class="label-icon">🏪</span>
          <span class="label-text">Restaurants</span>
        </label>
        <button class="restaurant-filter-btn" @click="showRestaurantModal = true">
          <span class="btn-icon">🏪</span>
          <span class="btn-text">
            {{ selectedRestaurants.length > 0 ? `${selectedRestaurants.length} Selected` : 'Select Restaurants' }}
          </span>
          <span class="btn-arrow">→</span>
        </button>
      </div>

      <!-- Content Type Filter (Dropdown) -->
      <div v-if="showContentType" class="filter-item">
        <label class="filter-label">
          <span class="label-icon">📸</span>
          <span class="label-text">Content Type</span>
        </label>
        <div class="dropdown-wrapper" ref="contentDropdownRef">
          <button class="filter-dropdown-btn" @click="toggleDropdown('content')">
            <span class="btn-text">
              {{ selectedContentTypes.length > 0 ? `${selectedContentTypes.length} Selected` : 'All Types' }}
            </span>
            <span :class="['btn-arrow', { open: openDropdown === 'content' }]">▼</span>
          </button>
          <Teleport to="body">
            <div
              v-if="openDropdown === 'content' && contentDropdownRef"
              class="dropdown-menu-portal"
              :style="getDropdownPosition(contentDropdownRef)"
            >
              <label
                v-for="type in contentTypes"
                :key="type.value"
                class="dropdown-item"
              >
                <input
                  type="checkbox"
                  :value="type.value"
                  :checked="isChecked('content_types', type.value)"
                  class="checkbox-input"
                  @change="toggleCheckbox('content_types', type.value)"
                />
                <span class="checkbox-custom"></span>
                <span class="checkbox-text">{{ type.label }}</span>
              </label>
            </div>
          </Teleport>
        </div>
      </div>

      <!-- Sort Filter (Single select) -->
      <div v-if="showSort" class="filter-item">
        <label class="filter-label">
          <span class="label-icon">🔃</span>
          <span class="label-text">Sort By</span>
        </label>
        <div class="select-wrapper">
          <select
            :value="modelValue.sort"
            class="filter-select"
            @change="updateFilter('sort', ($event.target as HTMLSelectElement).value)"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
          <span class="select-arrow">▼</span>
        </div>
      </div>
    </div>

    <!-- Active Filters Tags -->
    <div v-if="hasActiveFilters" class="active-filters">
      <span class="active-filters-label">Active:</span>
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
        <!-- Restaurant tags -->
        <span
          v-for="restaurantId in selectedRestaurants"
          :key="restaurantId"
          class="filter-tag"
          @click="toggleCheckbox('restaurant_ids', restaurantId)"
        >
          {{ getRestaurantName(restaurantId) }}
          <span class="tag-close">×</span>
        </span>
        <!-- Content type tags -->
        <span
          v-for="type in selectedContentTypes"
          :key="type"
          class="filter-tag"
          @click="toggleCheckbox('content_types', type)"
        >
          {{ type === 'image' ? 'Images' : 'Videos' }}
          <span class="tag-close">×</span>
        </span>
      </div>
    </div>

    <!-- Restaurant Filter Modal -->
    <RestaurantFilterModal
      v-model="showRestaurantModal"
      :restaurants="restaurants"
      :selected-restaurant-ids="selectedRestaurants"
      @update:selected-restaurant-ids="updateRestaurants"
    />
  </BaseCard>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import BaseCard from './BaseCard.vue'
import BaseButton from './BaseButton.vue'
import RestaurantFilterModal from './RestaurantFilterModal.vue'

interface Filters {
  platforms?: string[]
  restaurant_ids?: string[]
  content_types?: string[]
  sort?: string
}

interface Props {
  modelValue: Filters
  restaurants?: any[]
  showPlatform?: boolean
  showRestaurant?: boolean
  showContentType?: boolean
  showSort?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  restaurants: () => [],
  showPlatform: true,
  showRestaurant: true,
  showContentType: false,
  showSort: false,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: Filters): void
  (e: 'change'): void
  (e: 'clear'): void
}>()

const platforms = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'twitter', label: 'Twitter' },
  { value: 'linkedin', label: 'LinkedIn' },
]

const contentTypes = [
  { value: 'image', label: 'Images' },
  { value: 'video', label: 'Videos' },
]

const showRestaurantModal = ref(false)
const openDropdown = ref<string | null>(null)
const platformDropdownRef = ref<HTMLElement | null>(null)
const contentDropdownRef = ref<HTMLElement | null>(null)

const selectedPlatforms = computed(() => props.modelValue.platforms || [])
const selectedRestaurants = computed(() => props.modelValue.restaurant_ids || [])
const selectedContentTypes = computed(() => props.modelValue.content_types || [])

const hasActiveFilters = computed(() => {
  return !!(
    (props.modelValue.platforms && props.modelValue.platforms.length > 0) ||
    (props.modelValue.restaurant_ids && props.modelValue.restaurant_ids.length > 0) ||
    (props.modelValue.content_types && props.modelValue.content_types.length > 0)
  )
})

const updateRestaurants = (restaurantIds: string[]) => {
  const newFilters = { ...props.modelValue, restaurant_ids: restaurantIds }
  emit('update:modelValue', newFilters)
  emit('change')
}

const isChecked = (key: keyof Filters, value: string) => {
  const values = props.modelValue[key] as string[] | undefined
  return values?.includes(value) || false
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

const getRestaurantName = (id: string) => {
  const restaurant = props.restaurants.find((r) => r.id === id)
  return restaurant?.name || 'Restaurant'
}

const toggleDropdown = (dropdown: string) => {
  if (openDropdown.value === dropdown) {
    openDropdown.value = null
  } else {
    openDropdown.value = dropdown
  }
}

const getDropdownPosition = (element: HTMLElement | null): Record<string, string> => {
  if (!element) return {}

  const rect = element.getBoundingClientRect()
  return {
    position: 'fixed',
    top: `${rect.bottom + 4}px`,
    left: `${rect.left}px`,
    width: `${rect.width}px`,
  }
}

const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as Node

  // Check if click is outside all dropdowns
  const clickedOutsidePlatform = platformDropdownRef.value && !platformDropdownRef.value.contains(target)
  const clickedOutsideContent = contentDropdownRef.value && !contentDropdownRef.value.contains(target)

  // Check if click is on a dropdown menu
  const clickedOnDropdownMenu = (target as HTMLElement).closest('.dropdown-menu-portal')

  if (clickedOutsidePlatform && clickedOutsideContent && !clickedOnDropdownMenu) {
    openDropdown.value = null
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.filter-bar {
  margin-bottom: var(--space-xl);
  padding: var(--space-xl);
  background: linear-gradient(135deg, rgba(20, 20, 20, 0.95), rgba(30, 30, 30, 0.95)) !important;
  backdrop-filter: blur(24px);
  border: 1px solid rgba(212, 175, 55, 0.2);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.4),
    0 0 40px rgba(212, 175, 55, 0.08),
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
  border-bottom: 1px solid rgba(212, 175, 55, 0.15);
}

.filter-icon {
  font-size: 1.5rem;
  filter: drop-shadow(0 2px 4px rgba(212, 175, 55, 0.3));
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
  gap: var(--space-xl);
  margin-bottom: var(--space-md);
  overflow: visible;
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.filter-label {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.8px;
  margin-bottom: var(--space-xs);
}

.label-icon {
  font-size: 1rem;
  filter: grayscale(0.3);
}

.label-text {
  flex: 1;
}

/* Dropdown Components */
.dropdown-wrapper {
  position: relative;
  overflow: visible;
}

.filter-dropdown-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
  padding: var(--space-md);
  background: rgba(10, 10, 10, 0.9);
  border: 1px solid rgba(212, 175, 55, 0.25);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: 0.9375rem;
  font-family: var(--font-body);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.filter-dropdown-btn:hover {
  border-color: var(--gold-primary);
  background: rgba(10, 10, 10, 1);
  box-shadow: 0 0 12px rgba(212, 175, 55, 0.15);
  transform: translateY(-1px);
}

.filter-dropdown-btn .btn-arrow {
  color: var(--gold-primary);
  font-size: 0.75rem;
  transition: transform 0.3s ease;
}

.filter-dropdown-btn .btn-arrow.open {
  transform: rotate(180deg);
}

.dropdown-menu-portal {
  position: fixed;
  background: rgba(20, 20, 20, 0.98);
  border: 1px solid rgba(212, 175, 55, 0.3);
  border-radius: var(--radius-md);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4), 0 0 20px rgba(212, 175, 55, 0.1);
  z-index: 9999;
  max-height: 250px;
  overflow-y: auto;
  padding: var(--space-xs);
  animation: dropdownSlideDown 0.2s ease;
}

@keyframes dropdownSlideDown {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.dropdown-menu-portal::-webkit-scrollbar {
  width: 6px;
}

.dropdown-menu-portal::-webkit-scrollbar-track {
  background: rgba(10, 10, 10, 0.5);
  border-radius: 3px;
}

.dropdown-menu-portal::-webkit-scrollbar-thumb {
  background: rgba(212, 175, 55, 0.3);
  border-radius: 3px;
}

.dropdown-menu-portal::-webkit-scrollbar-thumb:hover {
  background: rgba(212, 175, 55, 0.5);
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: background 0.2s ease;
  position: relative;
}

.dropdown-item:hover {
  background: rgba(212, 175, 55, 0.08);
}

.checkbox-input {
  position: absolute;
  opacity: 0;
  cursor: pointer;
}

.checkbox-custom {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(212, 175, 55, 0.4);
  border-radius: var(--radius-sm);
  position: relative;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.checkbox-input:checked + .checkbox-custom {
  background: var(--gradient-gold);
  border-color: var(--gold-primary);
}

.checkbox-input:checked + .checkbox-custom::after {
  content: '✓';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: var(--text-on-gold);
  font-size: 12px;
  font-weight: bold;
}

.checkbox-text {
  font-size: 0.9375rem;
  color: var(--text-primary);
  font-weight: 500;
}

/* Restaurant Filter Button */
.restaurant-filter-btn {
  width: 100%;
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-md);
  background: rgba(10, 10, 10, 0.9);
  border: 1px solid rgba(212, 175, 55, 0.25);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: 0.9375rem;
  font-family: var(--font-body);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.restaurant-filter-btn:hover {
  border-color: var(--gold-primary);
  background: rgba(10, 10, 10, 1);
  box-shadow: 0 0 12px rgba(212, 175, 55, 0.15);
  transform: translateY(-1px);
}

.restaurant-filter-btn:active {
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

.restaurant-filter-btn:hover .btn-arrow {
  transform: translateX(4px);
}

/* Select Wrapper (for Sort) */
.select-wrapper {
  position: relative;
}

.filter-select {
  width: 100%;
  background: rgba(10, 10, 10, 0.9);
  border: 1px solid rgba(212, 175, 55, 0.25);
  border-radius: var(--radius-md);
  padding: var(--space-sm) var(--space-lg) var(--space-sm) var(--space-md);
  color: var(--text-primary);
  font-size: 0.9375rem;
  font-family: var(--font-body);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  appearance: none;
}

.filter-select:hover {
  border-color: var(--gold-primary);
  background: rgba(10, 10, 10, 1);
  box-shadow: 0 0 12px rgba(212, 175, 55, 0.15);
  transform: translateY(-1px);
}

.filter-select:focus {
  outline: none;
  border-color: var(--gold-primary);
  background: rgba(10, 10, 10, 1);
  box-shadow: 0 0 20px rgba(212, 175, 55, 0.25);
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
  border-top: 1px solid rgba(212, 175, 55, 0.1);
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
  background: linear-gradient(135deg, rgba(212, 175, 55, 0.15), rgba(212, 175, 55, 0.25));
  border: 1px solid rgba(212, 175, 55, 0.4);
  border-radius: var(--radius-full);
  color: var(--gold-light);
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.filter-tag:hover {
  background: linear-gradient(135deg, rgba(212, 175, 55, 0.25), rgba(212, 175, 55, 0.35));
  border-color: var(--gold-primary);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(212, 175, 55, 0.2);
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
}
</style>
