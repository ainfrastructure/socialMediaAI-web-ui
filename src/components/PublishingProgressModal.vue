<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import BaseModal from './BaseModal.vue'
import MaterialIcon from './MaterialIcon.vue'
import BaseButton from './BaseButton.vue'
import PlatformLogo from './PlatformLogo.vue'

interface PlatformProgress {
  platform: string
  status: 'pending' | 'publishing' | 'success' | 'error'
  url?: string
  error?: string
}

interface Props {
  visible: boolean
  platforms: PlatformProgress[]
  isComplete: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'createAnother'): void
  (e: 'close'): void
}>()

const { t } = useI18n()

const successCount = computed(() => {
  return props.platforms.filter(p => p.status === 'success').length
})

const errorCount = computed(() => {
  return props.platforms.filter(p => p.status === 'error').length
})

const isPublishing = computed(() => {
  return props.platforms.some(p => p.status === 'publishing' || p.status === 'pending')
})

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

function handleCreateAnother() {
  emit('createAnother')
}

function handleClose() {
  emit('close')
}
</script>

<template>
  <BaseModal
    :model-value="visible"
    size="md"
    :show-close-button="isComplete"
    :close-on-overlay-click="false"
    card-variant="solid"
    @update:model-value="handleClose"
  >
    <div class="publishing-content">
      <!-- Header Icon/Logo -->
      <div class="publishing-icon">
        <!-- Spinning icon while publishing -->
        <MaterialIcon
          v-if="isPublishing"
          icon="sync"
          size="xl"
          :color="'var(--gold-primary)'"
          class="spinning"
        />
        <!-- Social Chef logo when complete -->
        <img
          v-else
          src="/outline-logo-gold.svg"
          alt="Social Chef"
          class="social-chef-logo"
        />
      </div>

      <!-- Title -->
      <h3 class="publishing-title">
        <span v-if="isPublishing">{{ t('publishing.title', 'Publishing Your Post...') }}</span>
        <span v-else-if="successCount > 0">{{ t('publishing.successTitle', 'Congratulations!') }}</span>
        <span v-else>{{ t('publishing.errorTitle', 'Publishing Failed') }}</span>
      </h3>

      <!-- Message -->
      <p class="publishing-message">
        <span v-if="isPublishing">
          {{ t('publishing.message', 'Please wait while we publish your post to the selected platforms.') }}
        </span>
        <span v-else-if="successCount > 0">
          {{ t('publishing.successMessage', 'Your post has been published successfully!') }}
        </span>
        <span v-else>
          {{ t('publishing.errorMessage', 'Failed to publish to any platform.') }}
        </span>
      </p>

      <!-- Platform Buttons -->
      <div class="platform-buttons">
        <template v-for="platform in platforms" :key="platform.platform">
          <!-- Loading State: Transparent button with spinning icon -->
          <div
            v-if="platform.status === 'pending' || platform.status === 'publishing'"
            class="platform-loading-button"
          >
            <PlatformLogo
              :platform="platform.platform as 'facebook' | 'instagram' | 'tiktok' | 'twitter' | 'linkedin'"
              :size="24"
              :show-background="false"
            />
            <span class="platform-loading-button-text">
              Publishing to {{ capitalizeFirst(platform.platform) }}...
            </span>
            <MaterialIcon
              icon="sync"
              size="sm"
              :color="'var(--gold-primary)'"
              class="spinning"
            />
          </div>

          <!-- Success State: Branded button -->
          <a
            v-else-if="platform.status === 'success' && platform.url"
            :href="platform.url"
            target="_blank"
            rel="noopener noreferrer"
            class="platform-view-button"
            :class="`platform-view-button--${platform.platform}`"
          >
            <PlatformLogo
              :platform="platform.platform as 'facebook' | 'instagram' | 'tiktok' | 'twitter' | 'linkedin'"
              :size="24"
              :show-background="false"
            />
            <span class="platform-view-button-text">
              View on {{ capitalizeFirst(platform.platform) }}
            </span>
            <MaterialIcon icon="arrow_forward" size="sm" />
          </a>

          <!-- Error State -->
          <div
            v-else-if="platform.status === 'error' && platform.error"
            class="platform-error"
          >
            <MaterialIcon icon="error" size="sm" :color="'var(--error-text)'" />
            <span>{{ capitalizeFirst(platform.platform) }}: {{ platform.error }}</span>
          </div>
        </template>
      </div>

      <!-- Actions (only show when complete) -->
      <div v-if="isComplete" class="publishing-actions">
        <BaseButton variant="primary" size="large" @click="handleCreateAnother">
          {{ t('publishing.createAnother', 'Create Another Post') }}
        </BaseButton>
      </div>
    </div>
  </BaseModal>
</template>

<style scoped>
.publishing-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: var(--space-3xl) var(--space-xl);
}

.publishing-icon {
  font-size: 4rem;
  margin-bottom: var(--space-xl);
}

.social-chef-logo {
  width: 80px;
  height: 80px;
  object-fit: contain;
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.publishing-title {
  font-family: var(--font-heading);
  font-size: var(--text-3xl);
  background: var(--gradient-gold);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 var(--space-md) 0;
}

.publishing-message {
  font-size: var(--text-lg);
  color: var(--text-secondary);
  margin: 0 0 var(--space-2xl) 0;
}

.platform-buttons {
  width: 100%;
  max-width: 500px;
  margin-bottom: var(--space-2xl);
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

/* Loading state button (transparent with spinning icon) */
.platform-loading-button {
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
  padding: var(--space-md) var(--space-xl);
  border-radius: var(--radius-lg);
  background: transparent;
  border: 2px solid var(--glass-border);
  color: var(--text-secondary);
  font-weight: 600;
  font-size: var(--text-base);
  width: 100%;
  transition: all var(--transition-base);
}

.platform-loading-button-text {
  flex: 1;
  text-align: center;
}

.platform-view-button {
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
  padding: var(--space-md) var(--space-xl);
  border-radius: var(--radius-lg);
  color: white;
  font-weight: 600;
  font-size: var(--text-base);
  text-decoration: none;
  transition: all var(--transition-base);
  box-shadow: var(--shadow-md);
  width: 100%;
}

.platform-view-button:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-lg);
}

.platform-view-button:active {
  transform: translateY(-1px);
}

.platform-view-button-text {
  flex: 1;
  text-align: center;
}

/* Facebook Button */
.platform-view-button--facebook {
  background: #1877F2;
}

.platform-view-button--facebook:hover {
  background: #0d5dbf;
}

/* Instagram Button */
.platform-view-button--instagram {
  background: linear-gradient(135deg, #f58529, #dd2a7b, #8134af, #515bd4);
}

.platform-view-button--instagram:hover {
  background: linear-gradient(135deg, #ff9142, #e83e8c, #9146b6, #5f6ee8);
}

/* TikTok Button */
.platform-view-button--tiktok {
  background: linear-gradient(135deg, #000000, #25f4ee);
}

.platform-view-button--tiktok:hover {
  background: linear-gradient(135deg, #1a1a1a, #3ffffa);
}

/* Twitter Button */
.platform-view-button--twitter {
  background: #000000;
  border: 1px solid #333;
}

.platform-view-button--twitter:hover {
  background: #1a1a1a;
}

/* LinkedIn Button */
.platform-view-button--linkedin {
  background: #0a66c2;
}

.platform-view-button--linkedin:hover {
  background: #084f94;
}

.platform-error {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-md);
  background: var(--error-bg);
  border: 1px solid var(--error-border);
  border-radius: var(--radius-lg);
  font-size: var(--text-sm);
  color: var(--error-text);
  text-align: left;
}

.publishing-actions {
  display: flex;
  gap: var(--space-lg);
  justify-content: center;
}

/* Responsive */
@media (max-width: 768px) {
  .publishing-content {
    padding: var(--space-2xl) var(--space-lg);
  }

  .publishing-title {
    font-size: var(--text-2xl);
  }

  .publishing-message {
    font-size: var(--text-base);
  }

  .platform-buttons {
    max-width: 100%;
  }
}

/* Accessibility: Reduced Motion */
@media (prefers-reduced-motion: reduce) {
  .spinning {
    animation: none;
  }

  .platform-button {
    transition: none;
  }

  .platform-button:hover {
    transform: none;
  }
}
</style>
