<script setup lang="ts">
import { ref, computed } from 'vue'

interface Props {
  modelValue?: string
  label?: string
  disabled?: boolean
  hint?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '#0f3d2e',
  label: '',
  disabled: false,
  hint: ''
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const colorInput = ref<HTMLInputElement | null>(null)
const localValue = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

function openColorPicker() {
  if (!props.disabled) {
    colorInput.value?.click()
  }
}

function handleInput(e: Event) {
  const target = e.target as HTMLInputElement
  emit('update:modelValue', target.value)
}
</script>

<template>
  <div class="color-picker">
    <label v-if="label" class="color-label">
      {{ label }}
    </label>

    <div
      :class="['color-display', { disabled: disabled }]"
      @click="openColorPicker"
    >
      <div class="color-swatch" :style="{ backgroundColor: modelValue }">
        <div class="color-overlay"></div>
      </div>
      <div class="color-info">
        <span class="color-value">{{ modelValue }}</span>
        <input
          ref="colorInput"
          type="color"
          :value="modelValue"
          :disabled="disabled"
          class="hidden-input"
          @input="handleInput"
        />
      </div>
    </div>

    <span v-if="hint" class="hint-message">{{ hint }}</span>
  </div>
</template>

<style scoped>
.color-picker {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.color-label {
  display: block;
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-secondary);
  font-family: var(--font-body);
}

.color-display {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-md);
  background: var(--bg-tertiary);
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: var(--transition-base);
}

.color-display:hover:not(.disabled) {
  border-color: var(--border-hover);
  background: var(--bg-elevated);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(15, 61, 46, 0.08);
}

.color-display.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.color-swatch {
  position: relative;
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md);
  border: 2px solid var(--border-color);
  flex-shrink: 0;
  overflow: hidden;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
}

.color-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.2) 0%,
    rgba(255, 255, 255, 0) 50%,
    rgba(0, 0, 0, 0.1) 100%
  );
  pointer-events: none;
}

.color-info {
  flex: 1;
  display: flex;
  align-items: center;
}

.color-value {
  font-family: var(--font-mono, 'Courier New', monospace);
  font-size: var(--text-sm);
  color: var(--text-primary);
  font-weight: var(--font-medium);
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.hidden-input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
  width: 0;
  height: 0;
}

.hint-message {
  display: block;
  font-size: var(--text-xs);
  color: var(--text-muted);
}

@media (prefers-reduced-motion: reduce) {
  .color-display {
    transition: none;
  }

  .color-display:hover:not(.disabled) {
    transform: none;
  }
}
</style>
