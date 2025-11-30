<script setup lang="ts">
import { computed } from 'vue'
import MaterialIcon from './MaterialIcon.vue'

interface StepLabel {
  number: number
  label: string
}

interface Props {
  currentStep: number
  stepLabels: StepLabel[]
  highestCompletedStep?: number
}

const props = withDefaults(defineProps<Props>(), {
  highestCompletedStep: 0
})

const emit = defineEmits<{
  (e: 'navigate', stepNumber: number): void
}>()

function handleStepClick(stepNumber: number) {
  // Only allow navigation to accessible steps
  if (stepNumber <= props.highestCompletedStep + 1) {
    emit('navigate', stepNumber)
  }
}

const isStepDisabled = computed(() => (stepNumber: number) => {
  return stepNumber > props.highestCompletedStep + 1
})
</script>

<template>
  <div class="wizard-progress">
    <div class="wizard-progress-track">
      <div
        v-for="(step, index) in stepLabels"
        :key="step.number"
        class="progress-step-wrapper"
      >
        <div
          :class="['progress-step-item', {
            'active': currentStep === step.number,
            'completed': currentStep > step.number,
            'disabled': isStepDisabled(step.number)
          }]"
          @click="handleStepClick(step.number)"
        >
          <div class="progress-step-circle">
            <MaterialIcon v-if="currentStep > step.number" icon="check_circle" size="md" :color="'var(--success-text)'" />
            <span v-else>{{ step.number }}</span>
          </div>
          <span class="progress-step-label">{{ step.label }}</span>
        </div>
        <div
          v-if="index < stepLabels.length - 1"
          :class="['progress-line', { 'completed': currentStep > step.number }]"
        ></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.wizard-progress {
  padding: var(--space-2xl) var(--space-xl);
  margin-bottom: var(--space-2xl);
}

.wizard-progress-track {
  display: flex;
  justify-content: center;
  align-items: center;
  max-width: 800px;
  margin: 0 auto;
}

.progress-step-wrapper {
  display: flex;
  align-items: center;
  flex: 1;
}

.progress-step-wrapper:last-child {
  flex: 0;
}

.progress-step-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-sm);
  cursor: pointer;
  transition: var(--transition-base);
  z-index: 2;
}

.progress-step-circle {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-full);
  background: var(--bg-secondary);
  border: 3px solid var(--border-color);
  color: var(--text-muted);
  font-family: var(--font-heading);
  font-size: var(--text-xl);
  font-weight: var(--font-bold);
  transition: var(--transition-base);
}

.progress-step-item.active .progress-step-circle {
  background: var(--gradient-gold);
  border-color: var(--gold-primary);
  color: var(--text-on-gold);
  box-shadow: var(--glow-gold-md);
  transform: scale(1.05);
}

.progress-step-item.completed .progress-step-circle {
  background: var(--gradient-gold);
  border-color: var(--gold-primary);
  color: var(--text-on-gold);
}

.progress-step-label {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--text-secondary);
  transition: var(--transition-base);
  white-space: nowrap;
}

.progress-step-item.active .progress-step-label {
  color: var(--gold-primary);
  font-weight: var(--font-bold);
}

.progress-step-item.completed .progress-step-label {
  color: var(--text-primary);
}

.progress-step-item.disabled {
  cursor: not-allowed;
  opacity: 0.4;
}

.progress-step-item.disabled .progress-step-circle {
  background: var(--bg-tertiary);
  border-color: var(--border-color);
}

.progress-step-item.disabled .progress-step-label {
  color: var(--text-muted);
}

/* Connecting Lines */
.progress-line {
  flex: 1;
  height: 3px;
  background: var(--border-color);
  margin: 0 var(--space-md);
  transition: var(--transition-base);
  position: relative;
  top: -14px; /* Align with center of circles */
}

.progress-line.completed {
  background: var(--gold-primary);
}

/* Responsive */
@media (max-width: 768px) {
  .wizard-progress {
    padding: var(--space-lg);
  }

  .wizard-progress-track {
    max-width: 100%;
  }

  .progress-step-circle {
    width: 48px;
    height: 48px;
    font-size: var(--text-lg);
  }

  .progress-step-label {
    font-size: var(--text-xs);
  }

  .progress-line {
    margin: 0 var(--space-sm);
  }
}
</style>
