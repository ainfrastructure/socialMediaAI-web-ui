<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import BaseModal from './BaseModal.vue'
import MaterialIcon from './MaterialIcon.vue'
import BaseButton from './BaseButton.vue'
import BaseAlert from './BaseAlert.vue'
import PlatformLogo from './PlatformLogo.vue'

interface FailedPlatform {
  platform: string
  error: string
}

interface Props {
  visible: boolean
  publishedUrls: Record<string, string>
  failedPlatforms?: FailedPlatform[]
}

const props = withDefaults(defineProps<Props>(), {
  failedPlatforms: () => []
})

const emit = defineEmits<{
  (e: 'createAnother'): void
  (e: 'close'): void
}>()

const { t } = useI18n()

const successfulPlatforms = computed(() => {
  return Object.entries(props.publishedUrls).map(([platform, url]) => ({
    platform,
    url
  }))
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
    :show-close-button="true"
    :close-on-overlay-click="true"
    card-variant="solid"
    @update:model-value="handleClose"
  >
    <div class="success-content">
      <div class="success-icon">
        <MaterialIcon icon="celebration" size="xl" :color="'var(--gold-primary)'" />
      </div>
      <h3 class="success-title">{{ t('easyMode.step4.successTitle', 'Congratulations!') }}</h3>
      <p class="success-message">{{ t('easyMode.step4.successMessage', 'Your post has been published successfully!') }}</p>

      <!-- Show all successful platform links with branded buttons -->
      <div class="platform-links-container">
        <a
          v-for="result in successfulPlatforms"
          :key="result.platform"
          :href="result.url"
          target="_blank"
          rel="noopener noreferrer"
          class="platform-button"
          :class="`platform-button--${result.platform}`"
        >
          <PlatformLogo
            :platform="result.platform as 'facebook' | 'instagram' | 'tiktok' | 'twitter' | 'linkedin' | 'youtube'"
            :size="32"
            :show-background="false"
          />
          <span class="platform-button-text">
            {{ t('easyMode.step4.viewOnPlatform', { platform: capitalizeFirst(result.platform) }, `View on ${capitalizeFirst(result.platform)}`) }}
          </span>
          <MaterialIcon icon="arrow_forward" size="sm" />
        </a>
      </div>

      <!-- Show partial failure warning if some platforms failed -->
      <BaseAlert v-if="failedPlatforms.length > 0" type="warning" class="partial-failure-alert">
        <strong>{{ t('easyMode.step4.partialFailureWarning', 'Some platforms failed to publish:') }}</strong>
        <ul class="failed-platforms-list">
          <li v-for="failed in failedPlatforms" :key="failed.platform">
            {{ capitalizeFirst(failed.platform) }}: {{ failed.error }}
          </li>
        </ul>
      </BaseAlert>

      <div class="success-actions">
        <BaseButton variant="primary" size="large" @click="handleCreateAnother">
          {{ t('easyMode.step4.createAnother', 'Create Another Post') }}
        </BaseButton>
      </div>
    </div>
  </BaseModal>
</template>

<style scoped>
.success-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: var(--space-3xl) var(--space-xl);
}

.success-icon {
  font-size: 4rem;
  margin-bottom: var(--space-xl);
  animation: bounceIcon 0.6s ease-out;
}

@keyframes bounceIcon {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.2);
  }
}

.success-title {
  font-family: var(--font-heading);
  font-size: var(--text-3xl);
  background: var(--gradient-gold);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 var(--space-md) 0;
}

.success-message {
  font-size: var(--text-lg);
  color: var(--text-secondary);
  margin: 0 0 var(--space-xl) 0;
}

.platform-links-container {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--space-md);
  margin-bottom: var(--space-xl);
  width: 100%;
}

.platform-button {
  display: inline-flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-md) var(--space-xl);
  border-radius: var(--radius-lg);
  color: white;
  font-weight: 600;
  font-size: var(--text-base);
  text-decoration: none;
  transition: all var(--transition-base);
  border: none;
  min-width: 220px;
  box-shadow: var(--shadow-md);
}

.platform-button:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-lg);
}

.platform-button:active {
  transform: translateY(-1px);
}

/* Facebook Button */
.platform-button--facebook {
  background: #1877F2;
}

.platform-button--facebook:hover {
  background: #0d5dbf;
}

/* Instagram Button */
.platform-button--instagram {
  background: linear-gradient(135deg, #f58529, #dd2a7b, #8134af, #515bd4);
}

.platform-button--instagram:hover {
  background: linear-gradient(135deg, #ff9142, #e83e8c, #9146b6, #5f6ee8);
}

/* TikTok Button (if needed) */
.platform-button--tiktok {
  background: linear-gradient(135deg, #000000, #25f4ee);
}

.platform-button--tiktok:hover {
  background: linear-gradient(135deg, #1a1a1a, #3ffffa);
}

/* Twitter Button (if needed) */
.platform-button--twitter {
  background: #000000;
  border: 1px solid #333;
}

.platform-button--twitter:hover {
  background: #1a1a1a;
}

/* LinkedIn Button (if needed) */
.platform-button--linkedin {
  background: #0a66c2;
}

.platform-button--linkedin:hover {
  background: #084f94;
}

.platform-button-text {
  flex: 1;
  text-align: center;
}

.partial-failure-alert {
  max-width: 500px;
  width: 100%;
  text-align: left;
  margin-bottom: var(--space-xl);
}

.failed-platforms-list {
  margin: var(--space-sm) 0 0 var(--space-lg);
  padding: 0;
  list-style-type: disc;
}

.failed-platforms-list li {
  margin: var(--space-xs) 0;
  font-size: var(--text-sm);
}

.success-actions {
  display: flex;
  gap: var(--space-lg);
  justify-content: center;
}

/* Responsive */
@media (max-width: 768px) {
  .success-content {
    padding: var(--space-2xl) var(--space-lg);
  }

  .success-title {
    font-size: var(--text-2xl);
  }

  .success-message {
    font-size: var(--text-base);
  }

  .platform-links-container {
    flex-direction: column;
    width: 100%;
  }

  .platform-button {
    width: 100%;
    min-width: unset;
    justify-content: space-between;
  }

  .platform-button-text {
    flex: 1;
    text-align: left;
  }
}

/* Accessibility: Reduced Motion */
@media (prefers-reduced-motion: reduce) {
  .platform-button {
    transition: none;
  }

  .platform-button:hover {
    transform: none;
  }
}
</style>
