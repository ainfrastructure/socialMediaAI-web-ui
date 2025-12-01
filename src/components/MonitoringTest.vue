<script setup lang="ts">
import { captureError } from '@/config/sentry'
import { trackEvent } from '@/utils/monitoring'
import BaseButton from './BaseButton.vue'
import BaseCard from './BaseCard.vue'

function testSentry() {
  const error = new Error('🧪 Test error from Sentry - monitoring is working!')
  captureError(error, {
    test: true,
    timestamp: new Date().toISOString(),
    component: 'MonitoringTest'
  })
  alert('✅ Error sent to Sentry! Check your Sentry dashboard.')
}

function testPostHog() {
  trackEvent('test_button_clicked', {
    test: true,
    timestamp: new Date().toISOString(),
    message: 'PostHog is working!'
  })
  alert('✅ Event sent to PostHog! Check your PostHog dashboard > Live Events.')
}

function testBoth() {
  testSentry()
  testPostHog()
}
</script>

<template>
  <BaseCard variant="glass" class="test-container">
    <h2 class="test-title">🔍 Monitoring Test Panel</h2>
    <p class="test-description">
      Click the buttons below to test Sentry and PostHog integration
    </p>

    <div class="test-buttons">
      <BaseButton variant="primary" @click="testSentry">
        Test Sentry Error Tracking
      </BaseButton>

      <BaseButton variant="secondary" @click="testPostHog">
        Test PostHog Analytics
      </BaseButton>

      <BaseButton variant="ghost" @click="testBoth">
        Test Both
      </BaseButton>
    </div>

    <div class="test-info">
      <h3>What to check:</h3>
      <ul>
        <li>
          <strong>Sentry:</strong> Go to
          <a href="https://sentry.io" target="_blank" rel="noopener">sentry.io</a>
          → Issues → You should see a new error
        </li>
        <li>
          <strong>PostHog:</strong> Go to
          <a href="https://posthog.com" target="_blank" rel="noopener">posthog.com</a>
          → Activity → Live Events → Look for "test_button_clicked"
        </li>
      </ul>
    </div>
  </BaseCard>
</template>

<style scoped>
.test-container {
  max-width: 600px;
  margin: var(--space-2xl) auto;
  padding: var(--space-2xl);
}

.test-title {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  color: var(--text-primary);
  margin-bottom: var(--space-md);
  text-align: center;
}

.test-description {
  color: var(--text-secondary);
  text-align: center;
  margin-bottom: var(--space-2xl);
}

.test-buttons {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  margin-bottom: var(--space-2xl);
}

.test-info {
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: var(--space-lg);
}

.test-info h3 {
  font-family: var(--font-heading);
  font-size: var(--text-lg);
  color: var(--gold-primary);
  margin-bottom: var(--space-md);
}

.test-info ul {
  list-style: none;
  padding: 0;
}

.test-info li {
  color: var(--text-secondary);
  margin-bottom: var(--space-md);
  padding-left: var(--space-lg);
  position: relative;
}

.test-info li::before {
  content: '→';
  position: absolute;
  left: 0;
  color: var(--gold-primary);
}

.test-info a {
  color: var(--gold-light);
  text-decoration: none;
}

.test-info a:hover {
  text-decoration: underline;
}
</style>
