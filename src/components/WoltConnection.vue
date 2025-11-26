<script setup lang="ts">
import { ref, onMounted } from 'vue'
import BaseCard from './BaseCard.vue'
import BaseButton from './BaseButton.vue'
import BaseAlert from './BaseAlert.vue'
import { woltService } from '../services/woltService'

const isConnected = ref(false)
const loading = ref(true)
const venueId = ref('')
const error = ref('')

onMounted(() => {
  checkConnection()
})

const checkConnection = async () => {
  loading.value = true
  error.value = ''
  isConnected.value = false // Reset to false first
  venueId.value = ''

  try {
    const connected = await woltService.isAuthenticated()
    console.log('🔍 Connection check result:', connected)
    isConnected.value = connected

    if (connected) {
      const id = await woltService.getVenueId()
      console.log('🏢 Venue ID:', id)
      venueId.value = id || ''
    }
  } catch (err: any) {
    console.error('❌ Failed to check Wolt connection:', err)
    error.value = err.message
    isConnected.value = false // Ensure it's false on error
  } finally {
    loading.value = false
  }
}

const connect = async () => {
  try {
    loading.value = true
    error.value = ''
    await woltService.initiateOAuth()
  } catch (err: any) {
    console.error('Failed to initiate Wolt OAuth:', err)
    error.value = err.message
    loading.value = false
  }
}

const disconnect = async () => {
  if (!confirm('Are you sure you want to disconnect your Wolt account?')) {
    return
  }

  try {
    loading.value = true
    error.value = ''
    await woltService.logout()
    isConnected.value = false
    venueId.value = ''
  } catch (err: any) {
    console.error('Failed to disconnect Wolt:', err)
    error.value = err.message
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <BaseCard variant="glass" class="wolt-connection">
    <div class="connection-header">
      <div class="header-content">
        <div class="wolt-logo">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="32" height="32" rx="8" fill="#009DE0"/>
            <path d="M8 12L11 22H13L15 16L17 22H19L22 12H20L18 18L16 12H14L12 18L10 12H8Z" fill="white"/>
          </svg>
        </div>
        <div class="header-info">
          <h3 class="connection-title">Wolt Integration</h3>
          <p class="connection-description">
            Connect your Wolt venue to sync menu items automatically
          </p>
        </div>
      </div>
      <div v-if="isConnected" class="connection-status connected">
        <span class="status-dot"></span>
        Connected
      </div>
      <div v-else class="connection-status disconnected">
        <span class="status-dot"></span>
        Not Connected
      </div>
    </div>

    <BaseAlert v-if="error" type="error" @close="error = ''">
      {{ error }}
    </BaseAlert>

    <div v-if="loading" class="connection-loading">
      <div class="spinner-small"></div>
      <span>Checking connection...</span>
    </div>

    <div v-else-if="isConnected" class="connection-content">
      <BaseAlert type="success">
        Your Wolt venue is connected and ready to sync menu items.
      </BaseAlert>

      <div class="venue-info">
        <div class="info-row">
          <span class="info-label">Venue ID:</span>
          <span class="info-value">{{ venueId }}</span>
        </div>
      </div>

      <div class="connection-actions">
        <BaseButton variant="danger" size="medium" @click="disconnect">
          Disconnect Wolt
        </BaseButton>
      </div>
    </div>

    <div v-else class="connection-content">
      <BaseAlert type="info">
        Connect your Wolt venue to automatically fetch and sync your menu items.
      </BaseAlert>

      <div class="features-list">
        <div class="feature-item">
          <span class="feature-icon">✓</span>
          <span class="feature-text">Automatic menu synchronization</span>
        </div>
        <div class="feature-item">
          <span class="feature-icon">✓</span>
          <span class="feature-text">Real-time menu updates</span>
        </div>
        <div class="feature-item">
          <span class="feature-icon">✓</span>
          <span class="feature-text">Menu item management</span>
        </div>
      </div>

      <div class="connection-actions">
        <BaseButton variant="primary" size="large" @click="connect" full-width>
          Connect Wolt Account
        </BaseButton>
      </div>

      <p class="connection-note">
        You will be redirected to Wolt to authorize access to your venue.
      </p>
    </div>
  </BaseCard>
</template>

<style scoped>
.wolt-connection {
  animation: fadeInUp 0.6s var(--ease-smooth);
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.connection-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding-bottom: var(--space-xl);
  margin-bottom: var(--space-xl);
  border-bottom: 1px solid rgba(212, 175, 55, 0.1);
}

.header-content {
  display: flex;
  gap: var(--space-lg);
  align-items: flex-start;
}

.wolt-logo {
  flex-shrink: 0;
}

.header-info {
  flex: 1;
}

.connection-title {
  font-family: var(--font-heading);
  font-size: var(--text-xl);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin: 0 0 var(--space-xs) 0;
}

.connection-description {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin: 0;
  line-height: var(--leading-normal);
}

.connection-status {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-lg);
  border-radius: var(--radius-full);
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  white-space: nowrap;
}

.connection-status.connected {
  background: rgba(76, 175, 80, 0.1);
  border: 1px solid #4CAF50;
  color: #4CAF50;
}

.connection-status.disconnected {
  background: rgba(158, 158, 158, 0.1);
  border: 1px solid #9E9E9E;
  color: #9E9E9E;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: currentColor;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.connection-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-md);
  padding: var(--space-2xl);
  color: var(--text-secondary);
}

.spinner-small {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(212, 175, 55, 0.2);
  border-top-color: var(--gold-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.connection-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
}

.venue-info {
  padding: var(--space-lg);
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(212, 175, 55, 0.1);
  border-radius: var(--radius-md);
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-label {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.info-value {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-primary);
  font-family: monospace;
}

.features-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.feature-item {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  font-size: var(--text-base);
  color: var(--text-secondary);
}

.feature-icon {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--gold-primary);
  color: var(--text-on-gold);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--text-sm);
  font-weight: var(--font-bold);
  flex-shrink: 0;
}

.feature-text {
  flex: 1;
}

.connection-actions {
  display: flex;
  gap: var(--space-lg);
  justify-content: flex-end;
}

.connection-note {
  font-size: var(--text-xs);
  color: var(--text-muted);
  text-align: center;
  font-style: italic;
  margin: 0;
}

/* Responsive */
@media (max-width: 768px) {
  .connection-header {
    flex-direction: column;
    gap: var(--space-lg);
  }

  .header-content {
    width: 100%;
  }

  .connection-status {
    align-self: flex-start;
  }

  .connection-actions {
    flex-direction: column;
  }

  .connection-actions > * {
    width: 100%;
  }
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  .wolt-connection,
  .spinner-small,
  .status-dot {
    animation: none;
  }
}
</style>
