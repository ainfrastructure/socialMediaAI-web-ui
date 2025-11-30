<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import MaterialIcon from './MaterialIcon.vue'
import BaseButton from './BaseButton.vue'
import BaseAlert from './BaseAlert.vue'

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
  <Transition name="fade">
    <div v-if="visible" class="success-modal-overlay" @click.self="handleClose">
      <div class="success-modal">
        <div class="success-content">
          <div class="success-icon">
            <MaterialIcon icon="celebration" size="xl" :color="'var(--gold-primary)'" />
          </div>
          <h3 class="success-title">{{ t('easyMode.step4.successTitle', 'Congratulations!') }}</h3>
          <p class="success-message">{{ t('easyMode.step4.successMessage', 'Your post has been published successfully!') }}</p>

          <!-- Show all successful platform links -->
          <div class="platform-links-container">
            <a
              v-for="result in successfulPlatforms"
              :key="result.platform"
              :href="result.url"
              target="_blank"
              rel="noopener noreferrer"
              class="view-post-link"
            >
              {{ t('easyMode.step4.viewOnPlatform', { platform: capitalizeFirst(result.platform) }, `View on ${capitalizeFirst(result.platform)}`) }} →
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
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.success-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(10, 10, 10, 0.95);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-xl);
}

.success-modal {
  max-width: 600px;
  width: 100%;
  background: var(--bg-secondary);
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
  animation: fadeInUp 0.5s var(--ease-smooth);
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

.view-post-link {
  display: inline-flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-md) var(--space-xl);
  background: var(--gold-subtle);
  border: 1px solid var(--gold-primary);
  border-radius: var(--radius-md);
  color: var(--gold-light);
  font-weight: var(--font-semibold);
  text-decoration: none;
  transition: var(--transition-base);
}

.view-post-link:hover {
  background: rgba(212, 175, 55, 0.2);
  transform: translateY(-2px);
  box-shadow: var(--glow-gold-sm);
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

/* Transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Responsive */
@media (max-width: 768px) {
  .success-modal {
    max-width: 90%;
    margin: var(--space-lg);
  }

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
  }

  .view-post-link {
    width: 100%;
    justify-content: center;
  }
}
</style>
