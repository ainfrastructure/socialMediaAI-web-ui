<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import MaterialIcon from '@/components/MaterialIcon.vue'
import BaseButton from '@/components/BaseButton.vue'

const props = defineProps<{
  visible: boolean
  config: {
    enabled: boolean
    dayOfWeek: number
    hour: number
    niche: string
    count: number
  }
  loading: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'save', config: typeof props.config): void
}>()

const localConfig = ref({ ...props.config })

watch(
  () => props.config,
  (val) => {
    localConfig.value = { ...val }
  },
  { deep: true }
)

const dayLabels = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
]

const hourOptions = computed(() =>
  Array.from({ length: 24 }, (_, i) => ({
    value: i,
    label: `${i.toString().padStart(2, '0')}:00`,
  }))
)

const scheduleDescription = computed(() => {
  if (!localConfig.value.enabled) return 'Automatic generation is disabled.'
  const day = dayLabels.find((d) => d.value === localConfig.value.dayOfWeek)?.label ?? 'Monday'
  const hour = localConfig.value.hour.toString().padStart(2, '0')
  return `Generates ${localConfig.value.count} briefs every ${day} at ${hour}:00 for "${localConfig.value.niche || 'your niche'}".`
})

function handleSave() {
  emit('save', { ...localConfig.value })
}
</script>

<template>
  <Transition name="panel-slide">
    <div v-if="visible" class="schedule-panel">
      <div class="panel-header">
        <div class="panel-header-left">
          <MaterialIcon icon="schedule" size="sm" />
          <h3 class="panel-title">Weekly Schedule</h3>
        </div>
        <button class="panel-close" @click="$emit('close')" aria-label="Close schedule panel">
          <MaterialIcon icon="close" size="sm" />
        </button>
      </div>

      <div class="panel-body">
        <!-- Enable Toggle -->
        <div class="field-row toggle-row">
          <label class="field-label" for="schedule-enabled">Automatic Generation</label>
          <button
            id="schedule-enabled"
            class="toggle-switch"
            :class="{ active: localConfig.enabled }"
            role="switch"
            :aria-checked="localConfig.enabled"
            @click="localConfig.enabled = !localConfig.enabled"
          >
            <span class="toggle-thumb" />
          </button>
        </div>

        <!-- Niche -->
        <div class="field-row">
          <label class="field-label" for="schedule-niche">
            <MaterialIcon icon="category" size="xs" />
            Niche / Industry
          </label>
          <input
            id="schedule-niche"
            v-model="localConfig.niche"
            type="text"
            class="field-input"
            placeholder="e.g. social media marketing"
            maxlength="100"
          />
        </div>

        <!-- Day of Week -->
        <div class="field-row">
          <label class="field-label" for="schedule-day">
            <MaterialIcon icon="today" size="xs" />
            Day of Week
          </label>
          <div class="select-wrapper">
            <select
              id="schedule-day"
              v-model.number="localConfig.dayOfWeek"
              class="field-select"
            >
              <option v-for="d in dayLabels" :key="d.value" :value="d.value">
                {{ d.label }}
              </option>
            </select>
            <MaterialIcon icon="expand_more" size="xs" class="select-icon" />
          </div>
        </div>

        <!-- Hour -->
        <div class="field-row">
          <label class="field-label" for="schedule-hour">
            <MaterialIcon icon="schedule" size="xs" />
            Time
          </label>
          <div class="select-wrapper">
            <select
              id="schedule-hour"
              v-model.number="localConfig.hour"
              class="field-select"
            >
              <option v-for="h in hourOptions" :key="h.value" :value="h.value">
                {{ h.label }}
              </option>
            </select>
            <MaterialIcon icon="expand_more" size="xs" class="select-icon" />
          </div>
        </div>

        <!-- Brief Count -->
        <div class="field-row">
          <label class="field-label" for="schedule-count">
            <MaterialIcon icon="format_list_numbered" size="xs" />
            Briefs per Batch
          </label>
          <div class="select-wrapper">
            <select
              id="schedule-count"
              v-model.number="localConfig.count"
              class="field-select"
            >
              <option v-for="n in [3, 5, 7, 10]" :key="n" :value="n">{{ n }} briefs</option>
            </select>
            <MaterialIcon icon="expand_more" size="xs" class="select-icon" />
          </div>
        </div>

        <!-- Summary -->
        <div class="schedule-summary">
          <MaterialIcon icon="info" size="xs" />
          <span>{{ scheduleDescription }}</span>
        </div>
      </div>

      <div class="panel-footer">
        <BaseButton variant="ghost" size="small" @click="$emit('close')">
          Cancel
        </BaseButton>
        <BaseButton
          variant="primary"
          size="small"
          :disabled="loading || (!localConfig.niche && localConfig.enabled)"
          @click="handleSave"
        >
          <MaterialIcon v-if="loading" icon="hourglass_empty" size="sm" />
          {{ loading ? 'Saving...' : 'Save Schedule' }}
        </BaseButton>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.schedule-panel {
  background: var(--glass-bg);
  backdrop-filter: blur(var(--blur-md));
  -webkit-backdrop-filter: blur(var(--blur-md));
  border: var(--border-width) solid var(--glass-border);
  border-radius: var(--radius-lg);
  margin-bottom: var(--space-xl);
  overflow: hidden;
  position: relative;
}

.schedule-panel::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: var(--glass-highlight);
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-lg) var(--space-xl);
  border-bottom: 1px solid var(--border-color);
}

.panel-header-left {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  color: var(--gold-primary);
}

.panel-title {
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin: 0;
}

.panel-close {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-muted);
  cursor: pointer;
  transition: var(--transition-base);
}

.panel-close:hover {
  color: var(--text-primary);
  border-color: var(--border-hover);
  background: var(--bg-elevated);
}

.panel-body {
  padding: var(--space-xl);
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.field-row {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.toggle-row {
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}

.field-label {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-secondary);
}

.field-input {
  width: 100%;
  padding: var(--space-md);
  background: var(--bg-secondary);
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: var(--text-sm);
  font-family: var(--font-body);
  transition: var(--transition-base);
  outline: none;
}

.field-input::placeholder {
  color: var(--text-muted);
}

.field-input:focus {
  border-color: var(--gold-primary);
  box-shadow: 0 0 0 2px rgba(176, 138, 90, 0.15);
}

.select-wrapper {
  position: relative;
}

.field-select {
  width: 100%;
  padding: var(--space-md);
  padding-right: var(--space-3xl);
  background: var(--bg-secondary);
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: var(--text-sm);
  font-family: var(--font-body);
  appearance: none;
  cursor: pointer;
  transition: var(--transition-base);
  outline: none;
}

.field-select:focus {
  border-color: var(--gold-primary);
  box-shadow: 0 0 0 2px rgba(176, 138, 90, 0.15);
}

.select-icon {
  position: absolute;
  right: var(--space-md);
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted);
  pointer-events: none;
}

/* Toggle Switch */
.toggle-switch {
  width: 44px;
  height: 24px;
  border-radius: var(--radius-full);
  background: var(--bg-tertiary);
  border: var(--border-width) solid var(--border-color);
  cursor: pointer;
  position: relative;
  transition: var(--transition-base);
  flex-shrink: 0;
  padding: 0;
}

.toggle-switch.active {
  background: var(--gold-primary);
  border-color: var(--gold-primary);
}

.toggle-thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 18px;
  height: 18px;
  border-radius: var(--radius-full);
  background: var(--text-primary);
  transition: var(--transition-base);
}

.toggle-switch.active .toggle-thumb {
  left: 22px;
  background: white;
}

.schedule-summary {
  display: flex;
  align-items: flex-start;
  gap: var(--space-sm);
  padding: var(--space-md);
  background: var(--info-bg);
  border: 1px solid var(--info-border);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  color: var(--info-text);
  line-height: var(--leading-normal);
}

.panel-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--space-md);
  padding: var(--space-lg) var(--space-xl);
  border-top: 1px solid var(--border-color);
}

/* Panel Transition */
.panel-slide-enter-active,
.panel-slide-leave-active {
  transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1);
}

.panel-slide-enter-from,
.panel-slide-leave-to {
  opacity: 0;
  max-height: 0;
  margin-bottom: 0;
  transform: translateY(-8px);
}

.panel-slide-enter-to,
.panel-slide-leave-from {
  opacity: 1;
  max-height: 600px;
}

@media (max-width: 768px) {
  .panel-body {
    padding: var(--space-lg);
  }

  .panel-header,
  .panel-footer {
    padding: var(--space-md) var(--space-lg);
  }
}
</style>
