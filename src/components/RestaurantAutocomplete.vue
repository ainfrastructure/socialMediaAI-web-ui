<template>
  <div class="autocomplete-container">
    <BaseInput
      v-model="searchQuery"
      type="text"
      :label="label"
      :placeholder="placeholder"
      :disabled="disabled"
      :autofocus="autofocus"
      @input="handleInput"
      @focus="handleFocus"
      @blur="handleBlur"
      @keydown="handleKeydown"
    />

    <div v-if="showDropdown" class="autocomplete-dropdown" ref="dropdownRef">
      <div v-if="isLoading" class="dropdown-item loading">
        <div class="spinner"></div>
        <span>Searching...</span>
      </div>

      <div v-else-if="error" class="dropdown-item error">
        <span>{{ error }}</span>
      </div>

      <div v-else-if="suggestions.length === 0 && searchQuery.trim()" class="dropdown-item empty">
        <span>No restaurants found</span>
      </div>

      <div
        v-else
        v-for="(suggestion, index) in suggestions"
        :key="suggestion.place_id"
        :class="['dropdown-item', { active: index === activeIndex }]"
        @mousedown.prevent="selectSuggestion(suggestion)"
        @mouseenter="activeIndex = index"
      >
        <div class="restaurant-info">
          <div class="restaurant-name">{{ suggestion.name }}</div>
          <div class="restaurant-address">{{ suggestion.address }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import BaseInput from './BaseInput.vue'
import { placesService, type RestaurantSuggestion } from '../services/placesService'

interface Props {
  modelValue?: RestaurantSuggestion | null
  label?: string
  placeholder?: string
  disabled?: boolean
  autofocus?: boolean
  debounceMs?: number
}

interface Emits {
  (e: 'update:modelValue', value: RestaurantSuggestion | null): void
  (e: 'select', value: RestaurantSuggestion): void
}

const props = withDefaults(defineProps<Props>(), {
  label: 'Search Restaurants',
  placeholder: 'Type to search for restaurants...',
  disabled: false,
  autofocus: false,
  debounceMs: 300,
})

const emit = defineEmits<Emits>()

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

    const results = await placesService.searchRestaurants(query)
    suggestions.value = results
    activeIndex.value = -1
  } catch (err) {
    error.value = 'Failed to search restaurants. Please try again.'
    suggestions.value = []

  } finally {
    isLoading.value = false
  }
}

const selectSuggestion = (suggestion: RestaurantSuggestion) => {
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
</script>

<style scoped>
.autocomplete-container {
  position: relative;
  width: 100%;
}

.autocomplete-dropdown {
  position: absolute;
  top: calc(100% + 0.5rem);
  left: 0;
  right: 0;
  max-height: 400px;
  overflow-y: auto;
  z-index: 9999;

  background: rgba(26, 26, 26, 0.98);
  border: 1px solid rgba(212, 175, 55, 0.3);
  border-radius: 12px;
  backdrop-filter: blur(20px);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.4),
    0 0 20px rgba(212, 175, 55, 0.1);
}

.dropdown-item {
  padding: 1rem;
  cursor: pointer;
  border-bottom: 1px solid rgba(212, 175, 55, 0.1);
  transition: all 0.2s ease;
}

.dropdown-item:last-child {
  border-bottom: none;
}

.dropdown-item:hover,
.dropdown-item.active {
  background: rgba(212, 175, 55, 0.1);
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
  border: 2px solid rgba(212, 175, 55, 0.2);
  border-top-color: var(--accent-gold);
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

/* Scrollbar styling */
.autocomplete-dropdown::-webkit-scrollbar {
  width: 8px;
}

.autocomplete-dropdown::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
}

.autocomplete-dropdown::-webkit-scrollbar-thumb {
  background: rgba(212, 175, 55, 0.3);
  border-radius: 4px;
}

.autocomplete-dropdown::-webkit-scrollbar-thumb:hover {
  background: rgba(212, 175, 55, 0.5);
}
</style>
