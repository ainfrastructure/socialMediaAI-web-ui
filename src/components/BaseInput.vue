<template>
  <div class="form-group">
    <label v-if="label" :for="inputId" class="form-label">
      {{ label }}
      <span v-if="required" class="required-mark">*</span>
    </label>

    <div class="input-wrapper">
      <input
        v-if="type !== 'textarea'"
        :id="inputId"
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :required="required"
        :disabled="disabled"
        :autofocus="autofocus"
        :class="['form-input', { 'has-error': error }]"
        @input="handleInput"
        @blur="handleBlur"
        @focus="handleFocus"
      />

      <textarea
        v-else
        :id="inputId"
        :value="modelValue"
        :placeholder="placeholder"
        :required="required"
        :disabled="disabled"
        :autofocus="autofocus"
        :rows="rows"
        :class="['form-input', 'form-textarea', { 'has-error': error }]"
        @input="handleInput"
        @blur="handleBlur"
        @focus="handleFocus"
      ></textarea>
    </div>

    <span v-if="error" class="error-message">{{ error }}</span>
    <span v-else-if="hint" class="hint-message">{{ hint }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  modelValue?: string | number
  type?: string
  label?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  autofocus?: boolean
  error?: string
  hint?: string
  rows?: number
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  type: 'text',
  label: '',
  placeholder: '',
  required: false,
  disabled: false,
  autofocus: false,
  error: '',
  hint: '',
  rows: 4
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'blur'): void
  (e: 'focus'): void
}>()

const inputId = computed(() => `input-${Math.random().toString(36).substr(2, 9)}`)

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement | HTMLTextAreaElement
  emit('update:modelValue', target.value)
}

const handleBlur = () => {
  emit('blur')
}

const handleFocus = () => {
  emit('focus')
}
</script>

<style scoped>
.form-group {
  margin-bottom: var(--space-xl);
}

.form-label {
  display: block;
  margin-bottom: var(--space-sm);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-secondary);
  font-family: var(--font-body);
}

.required-mark {
  color: var(--gold-primary);
  margin-left: var(--space-xs);
}

.input-wrapper {
  position: relative;
}

.form-input {
  width: 100%;
  padding: var(--space-md) var(--space-lg);
  background: var(--bg-tertiary);
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: var(--text-base);
  font-family: var(--font-body);
  transition: var(--transition-base);
  outline: none;
}

.form-input::placeholder {
  color: var(--text-muted);
}

.form-input:hover:not(:disabled) {
  border-color: var(--border-hover);
  background: var(--bg-elevated);
}

.form-input:focus {
  border-color: var(--gold-primary);
  background: var(--bg-secondary);
  box-shadow: 0 0 0 3px rgba(15, 61, 46, 0.12);
}

.form-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: var(--bg-primary);
}

.form-input.has-error {
  border-color: var(--error-border);
}

.form-input.has-error:focus {
  border-color: var(--error-text);
  box-shadow: 0 0 0 3px var(--error-bg);
}

.form-textarea {
  resize: vertical;
  min-height: 100px;
  line-height: var(--leading-relaxed);
}

.error-message {
  display: block;
  margin-top: var(--space-sm);
  font-size: var(--text-xs);
  color: var(--error-text);
}

.hint-message {
  display: block;
  margin-top: var(--space-sm);
  font-size: var(--text-xs);
  color: var(--text-muted);
}

/* Autofill styling */
.form-input:-webkit-autofill,
.form-input:-webkit-autofill:hover,
.form-input:-webkit-autofill:focus {
  -webkit-box-shadow: 0 0 0 100px var(--bg-tertiary) inset;
  -webkit-text-fill-color: var(--text-primary);
  border-color: var(--gold-primary);
}
</style>
