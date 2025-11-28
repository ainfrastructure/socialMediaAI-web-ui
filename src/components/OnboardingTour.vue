<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import BaseButton from './BaseButton.vue'

const { t } = useI18n()

const emit = defineEmits<{
  (e: 'complete'): void
}>()

interface TourStep {
  title: string
  description: string
  icon: string
  details: string[]
  readTime: number // seconds required to read
}

const currentStep = ref(0)
const secondsRemaining = ref(0)
const canProceed = ref(false)
let readTimer: ReturnType<typeof setInterval> | null = null

const tourSteps = computed<TourStep[]>(() => [
  {
    title: t('onboarding.tour.welcomeTitle'),
    icon: '🎉',
    description: t('onboarding.tour.welcomeDescription'),
    readTime: 5,
    details: t('onboarding.tour.welcomeDetails') as unknown as string[]
  },
  {
    title: t('onboarding.tour.searchTitle'),
    icon: '🔍',
    description: t('onboarding.tour.searchDescription'),
    readTime: 4,
    details: t('onboarding.tour.searchDetails') as unknown as string[]
  },
  {
    title: t('onboarding.tour.createTitle'),
    icon: '🎨',
    description: t('onboarding.tour.createDescription'),
    readTime: 4,
    details: t('onboarding.tour.createDetails') as unknown as string[]
  },
  {
    title: t('onboarding.tour.scheduleTitle'),
    icon: '📅',
    description: t('onboarding.tour.scheduleDescription'),
    readTime: 4,
    details: t('onboarding.tour.scheduleDetails') as unknown as string[]
  },
  {
    title: t('onboarding.tour.connectTitle'),
    icon: '🔗',
    description: t('onboarding.tour.connectDescription'),
    readTime: 4,
    details: t('onboarding.tour.connectDetails') as unknown as string[]
  },
  {
    title: t('onboarding.tour.readyTitle'),
    icon: '🚀',
    description: t('onboarding.tour.readyDescription'),
    readTime: 3,
    details: t('onboarding.tour.readyDetails') as unknown as string[]
  }
])

// Start read timer when step changes
function startReadTimer() {
  canProceed.value = false
  secondsRemaining.value = tourSteps.value[currentStep.value].readTime

  if (readTimer) {
    clearInterval(readTimer)
  }

  readTimer = setInterval(() => {
    if (secondsRemaining.value > 0) {
      secondsRemaining.value--
    } else {
      canProceed.value = true
      if (readTimer) {
        clearInterval(readTimer)
      }
    }
  }, 1000)
}

// Watch for step changes
watch(currentStep, () => {
  startReadTimer()
})

// Initialize on mount
onMounted(() => {
  startReadTimer()
})

const progress = computed(() => {
  return ((currentStep.value + 1) / tourSteps.value.length) * 100
})

const canGoNext = computed(() => currentStep.value < tourSteps.value.length - 1)
const canGoPrev = computed(() => currentStep.value > 0)
const isLastStep = computed(() => currentStep.value === tourSteps.value.length - 1)

function nextStep() {
  if (canGoNext.value) {
    currentStep.value++
  } else if (isLastStep.value) {
    emit('complete')
  }
}

function prevStep() {
  if (canGoPrev.value) {
    currentStep.value--
  }
}
</script>

<template>
  <div class="onboarding-tour">
    <!-- Progress Bar -->
    <div class="progress-container">
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: `${progress}%` }"></div>
      </div>
      <p class="progress-text">Step {{ currentStep + 1 }} of {{ tourSteps.length }}</p>
    </div>

    <!-- Tour Content -->
    <div class="tour-content">
      <div class="step-icon">{{ tourSteps[currentStep].icon }}</div>
      <h2 class="step-title">{{ tourSteps[currentStep].title }}</h2>
      <p class="step-description">{{ tourSteps[currentStep].description }}</p>

      <ul class="step-details">
        <li v-for="(detail, index) in tourSteps[currentStep].details" :key="index" class="detail-item">
          <span class="detail-bullet">•</span>
          <span class="detail-text">{{ detail }}</span>
        </li>
      </ul>
    </div>

    <!-- Navigation -->
    <div class="tour-navigation">
      <BaseButton
        v-if="canGoPrev"
        variant="ghost"
        @click="prevStep"
      >
        ← {{ $t('onboarding.tour.previous') }}
      </BaseButton>
      <div v-else></div>

      <div class="next-button-container">
        <BaseButton
          variant="primary"
          :disabled="!canProceed"
          @click="nextStep"
        >
          {{ isLastStep ? $t('onboarding.tour.finish') + ' →' : $t('onboarding.tour.next') + ' →' }}
        </BaseButton>
        <p v-if="!canProceed" class="timer-text">
          {{ $t('common.loading') }}
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.onboarding-tour {
  display: flex;
  flex-direction: column;
  gap: var(--space-3xl);
  width: 100%;
  max-width: 700px;
  margin: 0 auto;
}

.progress-container {
  text-align: center;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: var(--bg-elevated);
  border-radius: var(--radius-full);
  overflow: hidden;
  margin-bottom: var(--space-md);
}

.progress-fill {
  height: 100%;
  background: var(--gradient-gold);
  transition: width var(--transition-base);
  border-radius: var(--radius-full);
}

.progress-text {
  font-size: var(--text-sm);
  color: var(--text-muted);
  margin: 0;
}

.tour-content {
  text-align: center;
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

.step-icon {
  font-size: 80px;
  margin-bottom: var(--space-xl);
  animation: bounce 2s ease-in-out infinite;
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.step-title {
  font-family: var(--font-heading);
  font-size: var(--text-4xl);
  color: var(--text-primary);
  margin-bottom: var(--space-lg);
  background: var(--gradient-gold);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.step-description {
  font-size: var(--text-lg);
  color: var(--text-secondary);
  margin-bottom: var(--space-3xl);
  line-height: var(--leading-relaxed);
}

.step-details {
  list-style: none;
  padding: 0;
  margin: 0;
  text-align: left;
  max-width: 500px;
  margin: 0 auto;
}

.detail-item {
  display: flex;
  align-items: flex-start;
  gap: var(--space-md);
  margin-bottom: var(--space-lg);
  padding: var(--space-lg);
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
  backdrop-filter: blur(var(--blur-md));
  transition: var(--transition-base);
}

.detail-item:hover {
  transform: translateX(4px);
  border-color: var(--gold-primary);
  background: var(--gold-subtle);
}

.detail-bullet {
  color: var(--gold-primary);
  font-weight: var(--font-bold);
  font-size: var(--text-2xl);
  flex-shrink: 0;
  line-height: 1;
}

.detail-text {
  color: var(--text-secondary);
  font-size: var(--text-base);
  line-height: var(--leading-normal);
}

.tour-navigation {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space-lg);
  padding-top: var(--space-2xl);
  border-top: 1px solid var(--border-color);
}

.next-button-container {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--space-sm);
}

.timer-text {
  font-size: var(--text-sm);
  color: var(--gold-primary);
  margin: 0;
  font-weight: var(--font-medium);
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .step-icon {
    font-size: 60px;
  }

  .step-title {
    font-size: var(--text-3xl);
  }

  .step-description {
    font-size: var(--text-base);
  }

  .tour-navigation {
    flex-direction: column;
  }
}
</style>
