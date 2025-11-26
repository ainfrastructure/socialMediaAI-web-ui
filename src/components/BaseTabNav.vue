<script setup lang="ts">
import { computed } from 'vue'

interface Tab {
  id: string
  label: string
  icon?: string
}

interface Props {
  tabs: Tab[]
  modelValue: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const activeTab = computed({
  get: () => props.modelValue,
  set: (value: string) => emit('update:modelValue', value)
})

function selectTab(tabId: string) {
  activeTab.value = tabId
}
</script>

<template>
  <div class="tab-nav">
    <div class="tab-nav-container">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        :class="['tab-button', { active: activeTab === tab.id }]"
        @click="selectTab(tab.id)"
        type="button"
      >
        <span v-if="tab.icon" class="tab-icon">{{ tab.icon }}</span>
        <span class="tab-label">{{ tab.label }}</span>
      </button>
      <div
        class="tab-indicator"
        :style="{
          transform: `translateX(${tabs.findIndex(t => t.id === activeTab) * 100}%)`
        }"
      />
    </div>
  </div>
</template>

<style scoped>
.tab-nav {
  width: 100%;
  margin-bottom: var(--space-2xl);
}

.tab-nav-container {
  position: relative;
  display: flex;
  gap: var(--space-sm);
  background: var(--bg-secondary);
  padding: var(--space-xs);
  border-radius: var(--radius-lg);
  border: var(--border-width) solid var(--border-color);
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

.tab-nav-container::-webkit-scrollbar {
  display: none;
}

.tab-button {
  position: relative;
  flex: 1;
  min-width: max-content;
  padding: var(--space-md) var(--space-xl);
  font-family: var(--font-body);
  font-size: var(--text-base);
  font-weight: var(--font-medium);
  color: var(--text-secondary);
  background: transparent;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: var(--transition-base);
  white-space: nowrap;
  z-index: 1;
}

.tab-button:hover {
  color: var(--text-primary);
  background: rgba(255, 255, 255, 0.05);
}

.tab-button.active {
  color: var(--gold-primary);
  font-weight: var(--font-semibold);
}

.tab-icon {
  margin-right: var(--space-sm);
  font-size: var(--text-lg);
}

.tab-label {
  display: inline-block;
}

.tab-indicator {
  position: absolute;
  bottom: var(--space-xs);
  left: var(--space-xs);
  height: calc(100% - var(--space-xs) * 2);
  width: calc((100% - var(--space-xs) * 2 - var(--space-sm) * 2) / 3);
  background: linear-gradient(
    135deg,
    rgba(212, 175, 55, 0.2),
    rgba(212, 175, 55, 0.1)
  );
  border: 1px solid var(--gold-primary);
  border-radius: var(--radius-md);
  transition: transform var(--transition-base);
  pointer-events: none;
  box-shadow: 0 0 20px rgba(212, 175, 55, 0.3);
}

/* Responsive */
@media (max-width: 768px) {
  .tab-button {
    padding: var(--space-md) var(--space-lg);
    font-size: var(--text-sm);
  }

  .tab-nav-container {
    justify-content: flex-start;
  }
}

@media (max-width: 480px) {
  .tab-button {
    padding: var(--space-sm) var(--space-md);
    font-size: var(--text-sm);
  }
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  .tab-button,
  .tab-indicator {
    transition: none;
  }
}
</style>
