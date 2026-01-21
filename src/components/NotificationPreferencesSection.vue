<template>
  <BaseCard variant="glass" class="section-card">
    <div class="section-header">
      <h2 class="section-title">{{ $t('profile.notificationPreferences') }}</h2>
    </div>

    <div v-if="prefsStore.loading && !prefsStore.initialized" class="loading-state">
      {{ $t('common.loading') }}
    </div>

    <div v-else-if="prefsStore.error && !prefsStore.preferences" class="error-state">
      <BaseAlert type="error">{{ prefsStore.error }}</BaseAlert>
    </div>

    <div v-else class="preferences-content">
      <!-- Post Failures -->
      <div class="preference-group">
        <h3 class="group-title">Post Failures</h3>
        <p class="group-description">Get notified when posts fail to publish</p>

        <div class="checkbox-group">
          <label class="checkbox-item">
            <input
              type="checkbox"
              v-model="localPrefs.notify_post_failed"
              @change="handleUpdate"
              class="checkbox-input"
            />
            <div class="checkbox-content">
              <span class="checkbox-label">{{ $t('profile.notifications.postEvents.failed') }}</span>
              <span class="checkbox-hint">{{ $t('profile.notifications.postEvents.failedHint') }}</span>
            </div>
          </label>
        </div>
      </div>

      <div class="preference-divider"></div>

      <!-- Account & Billing -->
      <div class="preference-group">
        <h3 class="group-title">{{ $t('profile.notifications.account.title') }}</h3>
        <p class="group-description">{{ $t('profile.notifications.account.description') }}</p>

        <div class="checkbox-group">
          <label class="checkbox-item">
            <input
              type="checkbox"
              v-model="localPrefs.notify_subscription_changes"
              @change="handleUpdate"
              class="checkbox-input"
            />
            <div class="checkbox-content">
              <span class="checkbox-label">{{ $t('profile.notifications.account.subscription') }}</span>
              <span class="checkbox-hint">{{ $t('profile.notifications.account.subscriptionHint') }}</span>
            </div>
          </label>

          <label class="checkbox-item">
            <input
              type="checkbox"
              v-model="localPrefs.notify_payment_issues"
              @change="handleUpdate"
              class="checkbox-input"
            />
            <div class="checkbox-content">
              <span class="checkbox-label">{{ $t('profile.notifications.account.payment') }}</span>
              <span class="checkbox-hint">{{ $t('profile.notifications.account.paymentHint') }}</span>
            </div>
          </label>

          <label class="checkbox-item">
            <input
              type="checkbox"
              v-model="localPrefs.notify_credits_low"
              @change="handleUpdate"
              class="checkbox-input"
            />
            <div class="checkbox-content">
              <span class="checkbox-label">{{ $t('profile.notifications.account.creditsLow') }}</span>
              <span class="checkbox-hint">{{ $t('profile.notifications.account.creditsLowHint') }}</span>
            </div>
          </label>
        </div>
      </div>

      <div class="preference-divider"></div>

      <!-- Activity Digest -->
      <div class="preference-group">
        <h3 class="group-title">{{ $t('profile.notifications.digest.title') }}</h3>
        <p class="group-description">{{ $t('profile.notifications.digest.description') }}</p>

        <div class="digest-controls">
          <div class="form-row">
            <label class="form-label">{{ $t('profile.notifications.digest.frequency') }}</label>
            <select v-model="localPrefs.digest_frequency" @change="handleUpdate" class="form-select">
              <option value="never">{{ $t('profile.notifications.digest.never') }}</option>
              <option value="daily">{{ $t('profile.notifications.digest.daily') }}</option>
              <option value="weekly">{{ $t('profile.notifications.digest.weekly') }}</option>
              <option value="monthly">{{ $t('profile.notifications.digest.monthly') }}</option>
            </select>
          </div>

          <div v-if="localPrefs.digest_frequency === 'weekly'" class="form-row">
            <label class="form-label">{{ $t('profile.notifications.digest.dayOfWeek') }}</label>
            <select
              v-model.number="localPrefs.digest_day_of_week"
              @change="handleUpdate"
              class="form-select"
            >
              <option :value="0">{{ $t('profile.notifications.digest.days.sunday') }}</option>
              <option :value="1">{{ $t('profile.notifications.digest.days.monday') }}</option>
              <option :value="2">{{ $t('profile.notifications.digest.days.tuesday') }}</option>
              <option :value="3">{{ $t('profile.notifications.digest.days.wednesday') }}</option>
              <option :value="4">{{ $t('profile.notifications.digest.days.thursday') }}</option>
              <option :value="5">{{ $t('profile.notifications.digest.days.friday') }}</option>
              <option :value="6">{{ $t('profile.notifications.digest.days.saturday') }}</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Success/Error Messages -->
      <BaseAlert v-if="saveSuccess" type="success" class="save-alert">
        {{ $t('profile.notifications.saveSuccess') }}
      </BaseAlert>
      <BaseAlert v-if="saveError" type="error" class="save-alert">
        {{ saveError }}
      </BaseAlert>
    </div>
  </BaseCard>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useNotificationPreferencesStore } from '@/stores/notificationPreferences'
import type { NotificationPreferences } from '@/types/notifications'
import BaseCard from './BaseCard.vue'
import BaseAlert from './BaseAlert.vue'

const { t } = useI18n()
const prefsStore = useNotificationPreferencesStore()

const localPrefs = ref<NotificationPreferences>({
  notify_post_published: false, // Hidden - not shown in UI
  notify_post_failed: true,
  notify_post_scheduled: false, // Hidden - not shown in UI
  digest_frequency: 'weekly',
  digest_day_of_week: 1,
  digest_time_utc: '09:00:00',
  notify_subscription_changes: true,
  notify_payment_issues: true,
  notify_credits_low: true,
  credits_low_threshold: 10,
  notify_new_features: false, // Hidden - not shown in UI
  notify_announcements: false, // Hidden - not shown in UI
})

const saveSuccess = ref(false)
const saveError = ref<string | null>(null)
let saveTimeout: number | null = null

// Load preferences on mount
onMounted(async () => {
  if (!prefsStore.initialized) {
    await prefsStore.loadPreferences()
  }
})

// Watch for preferences loaded from store
watch(
  () => prefsStore.preferences,
  (newPrefs) => {
    if (newPrefs) {
      localPrefs.value = { ...newPrefs }
    }
  },
  { immediate: true },
)

async function handleUpdate() {
  saveSuccess.value = false
  saveError.value = null

  // Clear previous timeout
  if (saveTimeout) {
    clearTimeout(saveTimeout)
  }

  // Debounce save
  saveTimeout = window.setTimeout(async () => {
    const result = await prefsStore.updatePreferences(localPrefs.value)

    if (result.success) {
      saveSuccess.value = true
      setTimeout(() => {
        saveSuccess.value = false
      }, 3000)
    } else {
      saveError.value = result.error || t('profile.notifications.saveError')
    }
  }, 500)
}
</script>

<style scoped>
.section-card {
  animation: fadeInUp 0.6s var(--ease-smooth);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-xl);
  padding-bottom: var(--space-lg);
  border-bottom: 1px solid rgba(15, 61, 46, 0.1);
}

.section-title {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  color: var(--text-primary);
}

.loading-state,
.error-state {
  padding: var(--space-2xl);
  text-align: center;
  color: var(--text-secondary);
}

.preferences-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-2xl);
}

.preference-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.group-title {
  font-family: var(--font-heading);
  font-size: var(--text-lg);
  color: var(--text-primary);
  margin-bottom: var(--space-xs);
}

.group-description {
  color: var(--text-secondary);
  font-size: var(--text-sm);
  line-height: var(--leading-normal);
}

.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.checkbox-item {
  display: flex;
  align-items: flex-start;
  gap: var(--space-md);
  padding: var(--space-lg);
  background: transparent;
  border: 1px solid rgba(15, 61, 46, 0.1);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: var(--transition-base);
}

.checkbox-item:hover {
  background: rgba(15, 61, 46, 0.05);
  border-color: rgba(15, 61, 46, 0.2);
}

.checkbox-input {
  margin-top: 2px;
  width: 20px;
  height: 20px;
  accent-color: var(--gold-primary);
  cursor: pointer;
  flex-shrink: 0;
}

.checkbox-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  flex: 1;
}

.checkbox-label {
  font-size: var(--text-base);
  font-weight: var(--font-medium);
  color: var(--text-primary);
}

.checkbox-hint {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  line-height: var(--leading-normal);
}

.digest-controls {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.form-row {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.form-label {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-secondary);
}

.form-select {
  padding: var(--space-md) var(--space-lg);
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: var(--text-base);
  font-family: var(--font-body);
  cursor: pointer;
  transition: var(--transition-base);
}

.form-select:hover {
  border-color: var(--border-hover);
  background: var(--bg-elevated);
}

.form-select:focus {
  outline: none;
  border-color: var(--gold-primary);
  box-shadow: 0 0 0 3px rgba(15, 61, 46, 0.12);
}

.preference-divider {
  height: 1px;
  background: rgba(15, 61, 46, 0.1);
}

.save-alert {
  margin-top: var(--space-lg);
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

@media (prefers-reduced-motion: reduce) {
  .section-card {
    animation: none;
  }
}
</style>
