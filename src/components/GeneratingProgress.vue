<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import MaterialIcon from './MaterialIcon.vue'

interface Props {
  active?: boolean
  estimatedDuration?: number
}

const props = withDefaults(defineProps<Props>(), {
  active: false,
  estimatedDuration: 25
})

const { t } = useI18n()

const progress = ref(0)
const currentStepIndex = ref(0)
let intervalId: ReturnType<typeof setInterval> | null = null

// Progress steps - analyzing is quick, generating takes most time, finalizing from 20s onwards
const steps = computed(() => [
  { key: 'analyzing', threshold: 0, icon: 'search' },
  { key: 'generating', threshold: 10, icon: 'auto_awesome' },
  { key: 'refining', threshold: 55, icon: 'tune' },
  { key: 'finalizing', threshold: 80, icon: 'check_circle' }
])

// Calculate which step we're on based on progress
const activeStep = computed(() => {
  for (let i = steps.value.length - 1; i >= 0; i--) {
    if (progress.value >= steps.value[i].threshold) {
      return i
    }
  }
  return 0
})

// Update current step index with slight delay for animation
watch(activeStep, (newStep) => {
  currentStepIndex.value = newStep
})

function startProgress() {
  progress.value = 0
  currentStepIndex.value = 0

  // Calculate update interval
  // We want to reach ~95% in estimatedDuration seconds
  // Update every 500ms for smooth animation
  const updateInterval = 500
  const totalUpdates = (props.estimatedDuration * 1000) / updateInterval
  const incrementPerUpdate = 95 / totalUpdates

  intervalId = setInterval(() => {
    if (progress.value < 95) {
      // Add some randomness for natural feel
      const randomFactor = 0.5 + Math.random()
      progress.value = Math.min(95, progress.value + (incrementPerUpdate * randomFactor))
    }
  }, updateInterval)
}

function stopProgress() {
  if (intervalId) {
    clearInterval(intervalId)
    intervalId = null
  }
  // Complete to 100%
  progress.value = 100
}

function resetProgress() {
  if (intervalId) {
    clearInterval(intervalId)
    intervalId = null
  }
  progress.value = 0
  currentStepIndex.value = 0
}

watch(() => props.active, (isActive) => {
  if (isActive) {
    startProgress()
  } else {
    stopProgress()
  }
})

onMounted(() => {
  if (props.active) {
    startProgress()
  }
})

onUnmounted(() => {
  resetProgress()
})
</script>

<template>
  <div class="generating-progress">
    <!-- Logo and title -->
    <div class="progress-header">
      <img src="/socialchef_logo.svg" alt="Social Chef" class="progress-logo" />
      <h3 class="progress-title">{{ t('generatingProgress.title') }}</h3>
    </div>

    <!-- Vertical Steps -->
    <div class="steps-container">
      <div
        v-for="(step, index) in steps"
        :key="step.key"
        :class="[
          'step-item',
          {
            'completed': index < currentStepIndex,
            'active': index === currentStepIndex,
            'pending': index > currentStepIndex
          }
        ]"
      >
        <!-- Step indicator -->
        <div class="step-indicator">
          <div class="step-circle">
            <MaterialIcon
              v-if="index < currentStepIndex"
              icon="check"
              size="xs"
              class="step-check"
            />
            <MaterialIcon
              v-else
              :icon="step.icon"
              size="xs"
              class="step-icon"
            />
          </div>
          <!-- Connector line -->
          <div v-if="index < steps.length - 1" class="step-line">
            <div
              class="step-line-fill"
              :style="{
                height: index < currentStepIndex ? '100%' :
                        index === currentStepIndex ? `${Math.min(100, (progress - step.threshold) / (steps[index + 1].threshold - step.threshold) * 100)}%` : '0%'
              }"
            ></div>
          </div>
        </div>

        <!-- Step content -->
        <div class="step-content">
          <span class="step-label">{{ t(`generatingProgress.steps.${step.key}`) }}</span>
        </div>
      </div>
    </div>

    <!-- Progress hint -->
    <p class="progress-hint">{{ t('generatingProgress.hint') }}</p>
  </div>
</template>

<style scoped>
.generating-progress {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--space-3xl) var(--space-xl);
  min-height: 400px;
  justify-content: center;
  user-select: none;
}

.progress-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: var(--space-3xl);
}

.progress-logo {
  width: 80px;
  height: 80px;
  margin-bottom: var(--space-lg);
  animation: pulse-glow 2s ease-in-out infinite;
  filter: drop-shadow(0 4px 20px rgba(212, 175, 55, 0.4));
}

@keyframes pulse-glow {
  0%, 100% {
    transform: scale(1);
    filter: drop-shadow(0 4px 20px rgba(212, 175, 55, 0.4));
  }
  50% {
    transform: scale(1.05);
    filter: drop-shadow(0 4px 30px rgba(212, 175, 55, 0.6));
  }
}

.progress-title {
  font-family: var(--font-heading);
  font-size: var(--text-xl);
  color: var(--gold-primary);
  margin: 0;
  text-align: center;
}

/* Vertical Steps */
.steps-container {
  display: flex;
  flex-direction: column;
  gap: 0;
  width: 100%;
  max-width: 280px;
}

.step-item {
  display: flex;
  gap: var(--space-md);
  position: relative;
}

.step-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
}

.step-circle {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-tertiary);
  border: 2px solid var(--border-color);
  transition: all 0.3s ease;
  position: relative;
  z-index: 1;
}

.step-item.pending .step-circle {
  opacity: 0.4;
}

.step-item.active .step-circle {
  border-color: var(--gold-primary);
  background: rgba(212, 175, 55, 0.15);
  box-shadow: 0 0 0 4px rgba(212, 175, 55, 0.1);
}

.step-item.completed .step-circle {
  border-color: var(--gold-primary);
  background: var(--gold-primary);
}

.step-icon {
  color: var(--text-muted);
  transition: color 0.3s ease;
}

.step-item.active .step-icon {
  color: var(--gold-primary);
}

.step-check {
  color: var(--bg-primary);
}

/* Connector line */
.step-line {
  width: 2px;
  height: 24px;
  background: var(--border-color);
  position: relative;
  overflow: hidden;
}

.step-line-fill {
  width: 100%;
  background: var(--gold-primary);
  transition: height 0.5s ease-out;
  position: absolute;
  top: 0;
  left: 0;
}

/* Step content */
.step-content {
  display: flex;
  align-items: center;
  min-height: 36px;
  padding-bottom: 24px;
}

.step-item:last-child .step-content {
  padding-bottom: 0;
}

.step-label {
  font-size: var(--text-sm);
  color: var(--text-muted);
  font-weight: var(--font-medium);
  transition: color 0.3s ease;
}

.step-item.active .step-label {
  color: var(--text-primary);
}

.step-item.completed .step-label {
  color: var(--text-secondary);
}

.progress-hint {
  font-size: var(--text-sm);
  color: var(--text-muted);
  margin: var(--space-2xl) 0 0 0;
  text-align: center;
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .progress-logo {
    animation: none !important;
  }

  .step-line-fill,
  .step-circle {
    transition: none !important;
  }
}

@media (max-width: 480px) {
  .generating-progress {
    padding: var(--space-2xl) var(--space-md);
    min-height: 350px;
  }

  .progress-logo {
    width: 64px;
    height: 64px;
  }

  .progress-title {
    font-size: var(--text-lg);
  }

  .step-circle {
    width: 32px;
    height: 32px;
  }

  .step-line {
    height: 20px;
  }

  .step-content {
    min-height: 32px;
    padding-bottom: 20px;
  }
}
</style>
