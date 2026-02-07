<template>
  <div class="filter-bar">
    <!-- Platform Pills -->
    <button
      v-for="platform in platforms"
      :key="platform.id"
      :class="['filter-pill', { active: selectedPlatforms.includes(platform.id) }]"
      @click="togglePlatform(platform.id)"
    >
      <PlatformLogo :platform="platform.id as 'facebook' | 'instagram' | 'tiktok'" :size="16" />
      <span class="pill-label">{{ platform.name }}</span>
    </button>

    <!-- Divider (only if both sections have items) -->
    <span v-if="platforms.length > 0 && brands.length > 0" class="filter-divider"></span>

    <!-- Business Pills (inline if <=5, dropdown if >5) -->
    <template v-if="brands.length <= 5">
      <button
        v-for="brand in brands"
        :key="brand.id"
        :class="['filter-pill', 'brand-pill', { active: selectedBrandIds.includes(brand.id) }]"
        @click="toggleBusiness(brand.id)"
      >
        <MaterialIcon icon="store" size="xs" />
        <span class="pill-label">{{ brand.name }}</span>
      </button>
    </template>

    <!-- Business Dropdown (>5 brands) -->
    <div v-else class="filter-dropdown" @mouseleave="businessOpen = false">
      <button
        :class="['filter-pill', 'dropdown-trigger', { active: selectedBrandIds.length > 0 }]"
        @click.stop="businessOpen = !businessOpen"
      >
        <MaterialIcon icon="store" size="xs" />
        <span class="pill-label">{{ $t('scheduler.restaurants', 'Businesses') }}</span>
        <span v-if="selectedBrandIds.length > 0" class="pill-count">{{ selectedBrandIds.length }}</span>
        <MaterialIcon :icon="businessOpen ? 'expand_less' : 'expand_more'" size="xs" />
      </button>
      <div v-show="businessOpen" class="dropdown-panel" @click.stop>
        <label class="dropdown-option select-all">
          <input
            type="checkbox"
            :checked="selectedBrandIds.length === brands.length"
            :indeterminate="selectedBrandIds.length > 0 && selectedBrandIds.length < brands.length"
            @change="toggleAllBusinesses"
          />
          <span>{{ $t('common.selectAll', 'Select All') }}</span>
        </label>
        <div class="dropdown-divider"></div>
        <label
          v-for="brand in brands"
          :key="brand.id"
          class="dropdown-option"
        >
          <input
            type="checkbox"
            :checked="selectedBrandIds.includes(brand.id)"
            @change="toggleBusiness(brand.id)"
          />
          <span>{{ brand.name }}</span>
        </label>
      </div>
    </div>

    <!-- Reset Pill -->
    <button
      v-if="activeFilterCount > 0"
      class="filter-pill reset-pill"
      @click="resetFilters"
    >
      <MaterialIcon icon="close" size="xs" />
      <span class="pill-label">{{ $t('scheduler.resetFilters', 'Reset') }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import PlatformLogo from '../PlatformLogo.vue'
import MaterialIcon from '../MaterialIcon.vue'

interface Platform {
  id: string
  name: string
}

interface Brand {
  id: string
  name: string
}

const props = defineProps<{
  platforms: Platform[]
  brands: Brand[]
  selectedPlatforms: string[]
  selectedBrandIds: string[]
}>()

const emit = defineEmits<{
  (e: 'update:selectedPlatforms', value: string[]): void
  (e: 'update:selectedBrandIds', value: string[]): void
  (e: 'apply'): void
}>()

const businessOpen = ref(false)

const activeFilterCount = computed(() => {
  return props.selectedPlatforms.length + props.selectedBrandIds.length
})

const togglePlatform = (platformId: string) => {
  const current = [...props.selectedPlatforms]
  const index = current.indexOf(platformId)
  if (index === -1) {
    current.push(platformId)
  } else {
    current.splice(index, 1)
  }
  emit('update:selectedPlatforms', current)
  emit('apply')
}

const toggleBusiness = (brandId: string) => {
  const current = [...props.selectedBrandIds]
  const index = current.indexOf(brandId)
  if (index === -1) {
    current.push(brandId)
  } else {
    current.splice(index, 1)
  }
  emit('update:selectedBrandIds', current)
  emit('apply')
}

const toggleAllBusinesses = () => {
  if (props.selectedBrandIds.length === props.brands.length) {
    emit('update:selectedBrandIds', [])
  } else {
    emit('update:selectedBrandIds', props.brands.map(b => b.id))
  }
  emit('apply')
}

const resetFilters = () => {
  emit('update:selectedPlatforms', [])
  emit('update:selectedBrandIds', [])
  emit('apply')
}
</script>

<style scoped>
.filter-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-md) var(--space-lg);
  background: var(--glass-bg);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
  margin-bottom: var(--space-lg);
  position: relative;
  z-index: 100;
}

.filter-pill {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  padding: 6px 14px;
  background: var(--surface-alpha-60);
  border: 1px solid var(--accent-alpha-12);
  border-radius: var(--radius-full);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
  white-space: nowrap;
}

.filter-pill:hover {
  background: var(--accent-alpha-05);
  border-color: var(--accent-alpha-20);
  color: var(--text-primary);
}

.filter-pill.active {
  background: var(--gold-primary);
  border-color: var(--gold-primary);
  color: var(--text-on-gold);
}

.filter-pill.active :deep(.platform-logo) {
  filter: brightness(0) invert(1);
}

.pill-label {
  line-height: 1;
}

.pill-count {
  background: var(--surface-alpha-30);
  padding: 1px 6px;
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: var(--font-bold);
}

.filter-divider {
  width: 1px;
  height: 20px;
  background: var(--accent-alpha-15);
  flex-shrink: 0;
}

/* Reset Pill */
.reset-pill {
  background: var(--error-bg);
  border-color: var(--error-border);
  color: var(--error-text);
}

.reset-pill:hover {
  background: rgba(239, 68, 68, 0.2);
  border-color: rgba(239, 68, 68, 0.4);
}

/* Dropdown */
.filter-dropdown {
  position: relative;
}

.dropdown-trigger {
  gap: var(--space-xs);
}

.dropdown-panel {
  position: absolute;
  top: calc(100% + var(--space-xs));
  left: 0;
  min-width: 220px;
  max-height: 300px;
  overflow-y: auto;
  padding: var(--space-sm);
  background: var(--glass-bg);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  z-index: 1000;
}

.dropdown-option {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  cursor: pointer;
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  color: var(--text-primary);
  transition: background var(--transition-fast);
}

.dropdown-option:hover {
  background: var(--accent-alpha-05);
}

.dropdown-option.select-all {
  font-weight: var(--font-semibold);
  color: var(--gold-primary);
}

.dropdown-option input[type="checkbox"] {
  accent-color: var(--gold-primary);
}

.dropdown-divider {
  height: 1px;
  background: var(--accent-alpha-10);
  margin: var(--space-xs) 0;
}

@media (max-width: 768px) {
  .filter-bar {
    padding: var(--space-sm) var(--space-md);
    gap: var(--space-xs);
  }

  .filter-pill {
    padding: 5px 10px;
    font-size: var(--text-xs);
  }

  .filter-divider {
    display: none;
  }

  .dropdown-panel {
    position: fixed;
    left: var(--space-md);
    right: var(--space-md);
    top: auto;
    min-width: auto;
  }
}

@media (prefers-reduced-motion: reduce) {
  .filter-pill {
    transition: none;
  }
}
</style>
