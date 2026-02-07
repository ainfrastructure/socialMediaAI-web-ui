<script setup lang="ts">
import { computed } from 'vue'
import { useFacebookStore } from '../stores/facebook'
import BaseButton from './BaseButton.vue'
import { errorLog } from '@/utils/debug'

interface Platform {
  value: string
  label: string
  icon: string
  isConnected: boolean
  connectedAccounts: any[]
  isAvailable: boolean
  comingSoon: boolean
}

interface Props {
  platform: Platform
  selected?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  selected: false
})

const emit = defineEmits<{
  (e: 'toggle', value: string): void
  (e: 'connect'): void
}>()

const facebookStore = useFacebookStore()

const isConnecting = computed(() => {
  if (props.platform.value === 'facebook') {
    return facebookStore.connecting
  }
  return false
})

async function handleConnect() {
  if (props.platform.value === 'facebook') {
    try {
      await facebookStore.connectFacebook()
      // Emit to parent that connection was successful
      emit('connect')
    } catch (error) {
      errorLog('Failed to connect:', error)
    }
  }
}

function handleToggle() {
  if (props.platform.isConnected) {
    emit('toggle', props.platform.value)
  }
}
</script>

<template>
  <label
    class="platform-card"
    :class="{
      selected: selected,
      'coming-soon': platform.comingSoon,
      connected: platform.isConnected,
      'not-connected': !platform.isConnected && platform.isAvailable
    }"
  >
    <!-- Connected Platform - Shows Checkbox -->
    <template v-if="platform.isConnected">
      <input
        type="checkbox"
        :value="platform.value"
        :checked="selected"
        @change="handleToggle"
        class="platform-checkbox"
      />
      <span class="platform-icon">{{ platform.icon }}</span>
      <div class="platform-content">
        <span class="platform-name">{{ platform.label }}</span>
        <span class="platform-status connected">
          ✓ {{ platform.connectedAccounts.length }} connected
        </span>
      </div>
    </template>

    <!-- Coming Soon Platform - Disabled -->
    <template v-else-if="platform.comingSoon">
      <input
        type="checkbox"
        disabled
        class="platform-checkbox"
      />
      <span class="platform-icon">{{ platform.icon }}</span>
      <div class="platform-content">
        <span class="platform-name">{{ platform.label }}</span>
        <span class="platform-status coming-soon">{{ $t('connectAccounts.comingSoon') }}</span>
      </div>
    </template>

    <!-- Not Connected Platform - Shows Connect Button -->
    <template v-else-if="platform.isAvailable && !platform.isConnected">
      <div class="platform-not-connected">
        <div class="platform-header">
          <span class="platform-icon">{{ platform.icon }}</span>
          <span class="platform-name">{{ platform.label }}</span>
        </div>
        <BaseButton
          variant="primary"
          size="small"
          @click="handleConnect"
          :disabled="isConnecting"
          class="connect-btn"
        >
          {{ isConnecting ? 'Connecting...' : `Connect ${platform.label}` }}
        </BaseButton>
      </div>
    </template>
  </label>
</template>

<style scoped>
.platform-card {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-lg);
  background: rgba(255, 255, 255, 0.8);
  border: 2px solid rgba(15, 61, 46, 0.1);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-base);
  user-select: none;
}

.platform-card:hover {
  background: rgba(255, 255, 255, 0.9);
  border-color: rgba(15, 61, 46, 0.2);
}

.platform-card.selected {
  background: rgba(15, 61, 46, 0.08);
  border-color: var(--gold-primary);
}

.platform-card.coming-soon {
  opacity: 0.5;
  cursor: not-allowed;
}

.platform-card.not-connected {
  cursor: default;
  padding: var(--space-lg);
}

.platform-card.not-connected:hover {
  background: rgba(255, 255, 255, 0.8);
  border-color: rgba(15, 61, 46, 0.15);
}

.platform-checkbox {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: var(--gold-primary);
  flex-shrink: 0;
}

.platform-checkbox:disabled {
  cursor: not-allowed;
}

.platform-icon {
  font-size: var(--text-lg);
  flex-shrink: 0;
}

.platform-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 0;
}

.platform-name {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-primary);
}

.platform-status {
  font-size: 0.7rem;
  font-weight: var(--font-medium);
}

.platform-status.connected {
  color: #4ade80;
}

.platform-status.coming-soon {
  color: var(--text-muted);
  font-style: italic;
}

.platform-not-connected {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  width: 100%;
}

.platform-header {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.platform-not-connected .platform-icon {
  font-size: var(--text-2xl);
}

.platform-not-connected .platform-name {
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
}

.connect-btn {
  width: 100%;
}
</style>
