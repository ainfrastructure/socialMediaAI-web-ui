<template>
  <div class="autocomplete-container">
    <BaseInput
      v-model="searchQuery"
      type="text"
      :label="computedLabel"
      :placeholder="computedPlaceholder"
      :disabled="disabled"
      :autofocus="autofocus"
      class="main-search-input"
      @input="handleInput"
      @focus="handleFocus"
      @blur="handleBlur"
      @keydown="handleKeydown"
    />

    <div v-if="showDropdown" class="autocomplete-dropdown" ref="dropdownRef">
      <div v-if="isLoading" class="dropdown-item loading">
        <div class="spinner"></div>
        <span>{{ $t('restaurantSearch.searching') }}</span>
      </div>

      <div v-else-if="error" class="dropdown-item error">
        <span>{{ error }}</span>
      </div>

      <div v-else-if="suggestions.length === 0 && searchQuery.trim()" class="dropdown-item empty">
        <span>{{ $t('restaurantSearch.noResults') }}</span>
      </div>

      <div
        v-else
        v-for="(suggestion, index) in suggestions"
        :key="suggestion.place_id"
        :class="['dropdown-item', { active: index === activeIndex, saved: isRestaurantSaved(suggestion) }]"
        @mousedown.prevent="selectSuggestion(suggestion)"
        @mouseenter="activeIndex = index"
      >
        <div class="restaurant-info">
          <div class="restaurant-name">{{ suggestion.name }}</div>
          <div class="restaurant-address">{{ suggestion.address }}</div>
        </div>
        <div v-if="isRestaurantSaved(suggestion)" class="saved-badge">
          <span class="checkmark">✓</span>
          <span class="saved-text">{{ $t('restaurantSearch.alreadyAdded') }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import BaseInput from './BaseInput.vue'
import { placesService, type RestaurantSuggestion } from '../services/placesService'

interface Props {
  modelValue?: RestaurantSuggestion | null
  label?: string
  placeholder?: string
  disabled?: boolean
  autofocus?: boolean
  debounceMs?: number
  savedRestaurants?: Array<{ place_id: string; name: string }>
}

interface Emits {
  (e: 'update:modelValue', value: RestaurantSuggestion | null): void
  (e: 'select', value: RestaurantSuggestion): void
  (e: 'dropdownOpen', value: boolean): void
}

const props = withDefaults(defineProps<Props>(), {
  label: '',
  placeholder: '',
  disabled: false,
  autofocus: false,
  debounceMs: 300,
  savedRestaurants: () => []
})

const emit = defineEmits<Emits>()
const { t } = useI18n()

// Computed label and placeholder with i18n fallbacks
const computedLabel = computed(() => props.label || t('restaurantSearch.searchLabel'))
const computedPlaceholder = computed(() => props.placeholder || t('restaurantSearch.searchPlaceholder'))

const searchQuery = ref('')
const suggestions = ref<RestaurantSuggestion[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)
const showDropdown = ref(false)
const activeIndex = ref(-1)
const dropdownRef = ref<HTMLElement | null>(null)
let debounceTimer: ReturnType<typeof setTimeout> | null = null

// Watch for external model value changes
watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue) {
      searchQuery.value = newValue.name
    } else {
      searchQuery.value = ''
    }
  },
  { immediate: true }
)

// Watch dropdown state and emit event
watch(showDropdown, (isOpen) => {
  emit('dropdownOpen', isOpen)
})

const handleInput = () => {
  error.value = null

  // Clear previous timer
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }

  const query = searchQuery.value.trim()

  if (!query) {
    suggestions.value = []
    showDropdown.value = false
    activeIndex.value = -1
    emit('update:modelValue', null)
    return
  }

  // Set loading state immediately
  isLoading.value = true
  showDropdown.value = true

  // Debounce the search
  debounceTimer = setTimeout(async () => {
    await performSearch(query)
  }, props.debounceMs)
}

const performSearch = async (query: string) => {
  try {
    isLoading.value = true
    error.value = null

    const results = await placesService.searchPlaces(query)
    suggestions.value = results
    activeIndex.value = -1
  } catch (err) {
    error.value = t('restaurantSearch.searchError')
    suggestions.value = []

  } finally {
    isLoading.value = false
  }
}

const selectSuggestion = (suggestion: RestaurantSuggestion) => {
  // Prevent selecting already saved restaurants
  if (isRestaurantSaved(suggestion)) {
    return
  }

  searchQuery.value = suggestion.name
  emit('update:modelValue', suggestion)
  emit('select', suggestion)
  showDropdown.value = false
  activeIndex.value = -1
  suggestions.value = []
}

const handleFocus = () => {
  if (suggestions.value.length > 0) {
    showDropdown.value = true
  }
}

const handleBlur = () => {
  // Delay to allow click events on dropdown items
  setTimeout(() => {
    showDropdown.value = false
  }, 200)
}

const handleKeydown = (event: KeyboardEvent) => {
  if (!showDropdown.value || suggestions.value.length === 0) {
    return
  }

  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      activeIndex.value = Math.min(activeIndex.value + 1, suggestions.value.length - 1)
      scrollToActiveItem()
      break

    case 'ArrowUp':
      event.preventDefault()
      activeIndex.value = Math.max(activeIndex.value - 1, -1)
      scrollToActiveItem()
      break

    case 'Enter':
      event.preventDefault()
      if (activeIndex.value >= 0 && activeIndex.value < suggestions.value.length) {
        selectSuggestion(suggestions.value[activeIndex.value])
      }
      break

    case 'Escape':
      event.preventDefault()
      showDropdown.value = false
      activeIndex.value = -1
      break
  }
}

const scrollToActiveItem = () => {
  if (!dropdownRef.value || activeIndex.value < 0) return

  const activeItem = dropdownRef.value.querySelector('.dropdown-item.active') as HTMLElement
  if (activeItem) {
    activeItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }
}

const isRestaurantSaved = (suggestion: RestaurantSuggestion): boolean => {
  return props.savedRestaurants?.some(saved => saved.place_id === suggestion.place_id) || false
}
</script>

<style scoped>
.autocomplete-container {
  position: relative;
  width: 100%;
  max-width: var(--max-width-2xl);
  margin: 0 auto;
}

/* Make the main search input bigger and more prominent */
.autocomplete-container :deep(.main-search-input) {
  width: 100%;
}

.autocomplete-container :deep(.main-search-input label) {
  font-size: var(--text-xl);
  font-weight: var(--font-semibold);
  margin-bottom: var(--space-lg);
}

.autocomplete-container :deep(.main-search-input input) {
  width: 100%;
  font-size: var(--text-lg);
  padding: var(--space-xl) var(--space-2xl);
  border-radius: var(--radius-lg);
  min-height: 60px;
}

.autocomplete-dropdown {
  position: absolute;
  top: calc(100% + 0.5rem);
  left: 0;
  right: 0;
  max-height: 400px;
  overflow-y: auto;
  z-index: 99999;

  background: rgba(250, 247, 240, 0.98);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  backdrop-filter: blur(20px);
  box-shadow: var(--shadow-xl);
}

.dropdown-item {
  padding: 1rem;
  cursor: pointer;
  border-bottom: 1px solid var(--border-color);
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.dropdown-item:last-child {
  border-bottom: none;
}

.dropdown-item:hover,
.dropdown-item.active {
  background: var(--bg-elevated);
}

.dropdown-item.saved {
  background: rgba(76, 175, 80, 0.05);
  border-left: 3px solid rgba(76, 175, 80, 0.5);
  cursor: not-allowed;
  opacity: 0.7;
}

.dropdown-item.saved:hover {
  background: rgba(76, 175, 80, 0.05);
  transform: none;
}

.dropdown-item.loading,
.dropdown-item.error,
.dropdown-item.empty {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 1.5rem;
  cursor: default;
  color: var(--text-secondary);
}

.dropdown-item.error {
  color: var(--color-danger);
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(15, 61, 46, 0.2);
  border-top-color: var(--gold-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.restaurant-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
}

.restaurant-name {
  font-size: 1rem;
  font-weight: 500;
  color: var(--text-primary);
}

.restaurant-address {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.saved-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.75rem;
  background: rgba(76, 175, 80, 0.15);
  border: 1px solid rgba(76, 175, 80, 0.3);
  border-radius: var(--radius-full);
  flex-shrink: 0;
}

.checkmark {
  font-size: 0.875rem;
  font-weight: bold;
  color: #4CAF50;
}

.saved-text {
  font-size: 0.75rem;
  font-weight: 600;
  color: #4CAF50;
  white-space: nowrap;
}

/* Scrollbar styling */
.autocomplete-dropdown::-webkit-scrollbar {
  width: 8px;
}

.autocomplete-dropdown::-webkit-scrollbar-track {
  background: var(--bg-tertiary);
  border-radius: 4px;
}

.autocomplete-dropdown::-webkit-scrollbar-thumb {
  background: rgba(15, 61, 46, 0.25);
  border-radius: 4px;
}

.autocomplete-dropdown::-webkit-scrollbar-thumb:hover {
  background: rgba(15, 61, 46, 0.4);
}

/* Responsive */
@media (max-width: 768px) {
  .autocomplete-dropdown {
    max-height: 50vh;
    max-height: 50dvh;
  }

  .dropdown-item {
    min-height: var(--touch-target-min);
    padding: var(--space-md);
  }
}

@media (max-width: 480px) {
  .autocomplete-container :deep(.main-search-input input) {
    min-height: var(--touch-target-comfortable);
    font-size: var(--text-base);
    padding: var(--space-md) var(--space-lg);
  }

  .autocomplete-dropdown {
    max-height: 40vh;
    max-height: 40dvh;
    border-radius: var(--radius-md);
  }

  .dropdown-item {
    padding: var(--space-sm) var(--space-md);
    gap: var(--space-sm);
  }

  .restaurant-name {
    font-size: var(--text-sm);
  }

  .restaurant-address {
    font-size: var(--text-xs);
  }

  .modal-title {
    font-size: var(--text-lg);
  }
}

@media (max-width: 390px) {
  .autocomplete-container :deep(.main-search-input input) {
    min-height: 48px;
    padding: var(--space-sm) var(--space-md);
  }

  .autocomplete-dropdown {
    max-height: 35vh;
    max-height: 35dvh;
  }

  .dropdown-item {
    font-size: var(--text-sm);
  }

  .modal-title {
    font-size: var(--text-base);
  }
}

/* ===== DARK MODE OVERRIDES ===== */
:root[data-theme="dark"] .autocomplete-dropdown {
  background: var(--bg-secondary);
  border-color: var(--border-color);
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.5);
}

:root[data-theme="dark"] .dropdown-item:hover,
:root[data-theme="dark"] .dropdown-item.active {
  background: var(--bg-elevated);
}

:root[data-theme="dark"] .spinner {
  border-color: var(--border-color);
  border-top-color: var(--gold-primary);
}

:root[data-theme="dark"] .autocomplete-dropdown::-webkit-scrollbar-thumb {
  background: var(--accent-alpha-30);
}

:root[data-theme="dark"] .autocomplete-dropdown::-webkit-scrollbar-thumb:hover {
  background: var(--accent-alpha-50);
}
</style>
