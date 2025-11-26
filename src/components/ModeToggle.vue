<script setup lang="ts">
import { usePreferencesStore } from '@/stores/preferences'

const preferencesStore = usePreferencesStore()
</script>

<template>
  <div class="mode-toggle">
    <button
      :class="['mode-button', { active: preferencesStore.creationMode === 'easy' }]"
      @click="preferencesStore.setCreationMode('easy')"
      title="Easy Mode - Quick post creation"
    >
      <span class="mode-label">Easy</span>
    </button>
    <button
      :class="['mode-button', { active: preferencesStore.creationMode === 'advanced' }]"
      @click="preferencesStore.setCreationMode('advanced')"
      title="Advanced Mode - Full customization"
    >
      <span class="mode-label">Advanced</span>
    </button>
    <div
      class="toggle-slider"
      :class="{ 'slider-advanced': preferencesStore.creationMode === 'advanced' }"
    />
  </div>
</template>

<style scoped>
.mode-toggle {
  position: relative;
  display: inline-flex;
  background: var(--bg-tertiary);
  padding: var(--space-xs);
  border-radius: var(--radius-md);
  border: var(--border-width) solid var(--border-color);
}

.mode-button {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-sm) var(--space-md);
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  font-family: var(--font-body);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-secondary);
  cursor: pointer;
  transition: var(--transition-base);
  white-space: nowrap;
  min-width: 90px;
}

.mode-button:hover {
  color: var(--text-primary);
}

.mode-button.active {
  color: var(--text-on-gold);
}

.mode-label {
  font-size: var(--text-sm);
}

.toggle-slider {
  position: absolute;
  top: var(--space-xs);
  left: var(--space-xs);
  width: calc(50% - 6px);
  height: calc(100% - 8px);
  background: var(--gradient-gold);
  border-radius: var(--radius-sm);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 1;
  box-shadow: var(--shadow-sm);
}

.toggle-slider.slider-advanced {
  transform: translateX(calc(100% + 4px));
}

/* Responsive */
@media (max-width: 640px) {
  .mode-button {
    min-width: 70px;
    padding: var(--space-sm);
    font-size: var(--text-xs);
  }
}

@media (prefers-reduced-motion: reduce) {
  .toggle-slider {
    transition-duration: 0.01ms;
  }
}
</style>
