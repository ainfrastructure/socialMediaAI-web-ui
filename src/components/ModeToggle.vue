<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { usePreferencesStore, type CreationMode } from '@/stores/preferences'

const { t } = useI18n()
const preferencesStore = usePreferencesStore()

const showConfirmDialog = ref(false)
const pendingMode = ref<CreationMode | null>(null)

function handleModeSwitch(mode: CreationMode) {
  // Attempt to switch mode - returns false if blocked
  const switched = preferencesStore.setCreationMode(mode)

  if (!switched) {
    // Mode switch blocked due to unsaved work - show confirmation
    pendingMode.value = mode
    showConfirmDialog.value = true
  }
}

function confirmSwitch() {
  if (pendingMode.value) {
    preferencesStore.setCreationMode(pendingMode.value, true) // Force switch
  }
  showConfirmDialog.value = false
  pendingMode.value = null
}

function cancelSwitch() {
  showConfirmDialog.value = false
  pendingMode.value = null
}
</script>

<template>
  <div class="mode-toggle-wrapper">
    <div class="mode-toggle">
      <button
        :class="['mode-button', { active: preferencesStore.creationMode === 'easy' }]"
        @click="handleModeSwitch('easy')"
        :title="t('modeToggle.easyTitle', 'Easy Mode - Quick post creation')"
      >
        <span class="mode-label">{{ t('modeToggle.easy', 'Easy') }}</span>
      </button>
      <button
        :class="['mode-button', { active: preferencesStore.creationMode === 'advanced' }]"
        @click="handleModeSwitch('advanced')"
        :title="t('modeToggle.advancedTitle', 'Advanced Mode - Full customization')"
      >
        <span class="mode-label">{{ t('modeToggle.advanced', 'Advanced') }}</span>
      </button>
      <div
        class="toggle-slider"
        :class="{ 'slider-advanced': preferencesStore.creationMode === 'advanced' }"
      />
    </div>

    <!-- Confirmation Dialog -->
    <Teleport to="body">
      <div v-if="showConfirmDialog" class="confirm-overlay" @click.self="cancelSwitch">
        <div class="confirm-dialog">
          <h3 class="confirm-title">{{ t('modeToggle.confirmTitle', 'Switch Mode?') }}</h3>
          <p class="confirm-message">
            {{ t('modeToggle.confirmMessage', 'You have unsaved work. Switching modes will discard your current progress.') }}
          </p>
          <div class="confirm-actions">
            <button class="confirm-btn cancel" @click="cancelSwitch">
              {{ t('common.cancel', 'Cancel') }}
            </button>
            <button class="confirm-btn confirm" @click="confirmSwitch">
              {{ t('modeToggle.switchAnyway', 'Switch Anyway') }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.mode-toggle {
  position: relative;
  display: flex;
  background: var(--bg-tertiary);
  padding: 4px;
  border-radius: var(--radius-md);
  border: var(--border-width) solid var(--border-color);
}

.mode-button {
  position: relative;
  z-index: 2;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-sm) var(--space-lg);
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
  min-width: 80px;
  text-align: center;
}

.mode-button:hover {
  color: var(--text-primary);
}

.mode-button.active {
  color: var(--text-on-gold);
}

.mode-label {
  font-size: inherit;
}

.toggle-slider {
  position: absolute;
  top: 4px;
  left: 4px;
  width: calc(50% - 4px);
  height: calc(100% - 8px);
  background: var(--gradient-gold);
  border-radius: var(--radius-sm);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 1;
  box-shadow: var(--shadow-sm);
}

.toggle-slider.slider-advanced {
  transform: translateX(100%);
}

/* Responsive */
@media (max-width: 640px) {
  .mode-toggle-wrapper {
    width: 100%;
  }

  .mode-toggle {
    width: 100%;
    padding: 3px;
  }

  .mode-button {
    flex: 1;
    min-width: 0;
    padding: var(--space-md) var(--space-lg);
    font-size: var(--text-base);
  }

  .toggle-slider {
    top: 3px;
    left: 3px;
    width: calc(50% - 3px);
    height: calc(100% - 6px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .toggle-slider {
    transition-duration: 0.01ms;
  }
}

/* Confirmation Dialog */
.mode-toggle-wrapper {
  display: inline-flex;
}

.confirm-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.confirm-dialog {
  background: var(--bg-secondary);
  border: 1px solid var(--gold-primary);
  border-radius: var(--radius-lg);
  padding: var(--space-2xl);
  max-width: 400px;
  width: 90%;
  text-align: center;
  animation: slideUp 0.3s ease;
  box-shadow: var(--glow-gold-md);
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.confirm-title {
  font-family: var(--font-heading);
  font-size: var(--text-xl);
  color: var(--gold-primary);
  margin: 0 0 var(--space-md) 0;
}

.confirm-message {
  font-size: var(--text-base);
  color: var(--text-secondary);
  line-height: var(--leading-normal);
  margin: 0 0 var(--space-xl) 0;
}

.confirm-actions {
  display: flex;
  gap: var(--space-md);
  justify-content: center;
}

.confirm-btn {
  padding: var(--space-md) var(--space-xl);
  border-radius: var(--radius-md);
  font-family: var(--font-body);
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  cursor: pointer;
  transition: var(--transition-base);
  min-width: 100px;
}

.confirm-btn.cancel {
  background: transparent;
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
}

.confirm-btn.cancel:hover {
  border-color: var(--text-primary);
  color: var(--text-primary);
}

.confirm-btn.confirm {
  background: var(--gradient-gold);
  border: none;
  color: var(--text-on-gold);
}

.confirm-btn.confirm:hover {
  transform: translateY(-1px);
  box-shadow: var(--glow-gold-sm);
}
</style>
