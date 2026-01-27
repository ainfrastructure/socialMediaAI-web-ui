<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import BaseModal from '../BaseModal.vue'
import BaseButton from '../BaseButton.vue'
import BaseInput from '../BaseInput.vue'
import BaseAlert from '../BaseAlert.vue'

interface Props {
  modelValue: boolean
  currentPath?: string
}

const props = withDefaults(defineProps<Props>(), {
  currentPath: '/'
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'create', folderPath: string): void
}>()

const { t } = useI18n()
const folderName = ref('')
const creating = ref(false)
const error = ref('')

function handleClose() {
  emit('update:modelValue', false)
  folderName.value = ''
  error.value = ''
}

function validateFolderName(name: string): boolean {
  // Check for empty name
  if (!name.trim()) {
    error.value = t('businessManagement.folderNameRequired')
    return false
  }

  // Check for invalid characters
  const invalidChars = /[<>:"|?*\\/]/
  if (invalidChars.test(name)) {
    error.value = t('businessManagement.invalidFolderName')
    return false
  }

  return true
}

async function handleCreate() {
  error.value = ''

  if (!validateFolderName(folderName.value)) {
    return
  }

  creating.value = true

  try {
    // Build full path
    const fullPath =
      props.currentPath === '/'
        ? folderName.value.trim()
        : `${props.currentPath}/${folderName.value.trim()}`

    emit('create', fullPath)
    handleClose()
  } catch (err: any) {
    error.value = err.message || t('businessManagement.createFolderError')
  } finally {
    creating.value = false
  }
}
</script>

<template>
  <BaseModal :model-value="modelValue" @update:model-value="handleClose" size="sm">
    <template #title>{{ $t('businessManagement.createFolder') }}</template>

    <div class="create-folder-content">
      <BaseAlert v-if="error" type="error" class="error-alert">
        {{ error }}
      </BaseAlert>

      <div class="path-info">
        <span class="path-label">{{ $t('businessManagement.createIn') }}:</span>
        <span class="path-value">{{ currentPath === '/' ? 'Root' : currentPath }}</span>
      </div>

      <BaseInput
        v-model="folderName"
        :label="$t('businessManagement.folderName')"
        :placeholder="$t('businessManagement.folderNamePlaceholder')"
        :disabled="creating"
        autofocus
        required
        @keyup.enter="handleCreate"
      />

      <div class="path-preview">
        <span class="preview-label">{{ $t('businessManagement.fullPath') }}:</span>
        <span class="preview-value">
          {{ currentPath === '/' ? folderName || '...' : `${currentPath}/${folderName || '...'}` }}
        </span>
      </div>

      <div class="modal-actions">
        <BaseButton @click="handleClose" variant="ghost" :disabled="creating">
          {{ $t('common.cancel') }}
        </BaseButton>
        <BaseButton
          @click="handleCreate"
          variant="primary"
          :disabled="creating || !folderName.trim()"
        >
          {{ creating ? $t('common.creating') : $t('common.create') }}
        </BaseButton>
      </div>
    </div>
  </BaseModal>
</template>

<style scoped>
.create-folder-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.error-alert {
  margin-bottom: var(--space-md);
}

.path-info {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  padding: var(--space-md);
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  border: 1px solid rgba(15, 61, 46, 0.1);
}

.path-label,
.preview-label {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-secondary);
}

.path-value,
.preview-value {
  font-size: var(--text-base);
  color: var(--text-primary);
  font-family: var(--font-mono, monospace);
}

.path-preview {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  padding: var(--space-md);
  background: rgba(15, 61, 46, 0.05);
  border-radius: var(--radius-md);
  border: 1px solid rgba(15, 61, 46, 0.1);
}

.preview-value {
  color: var(--gold-primary);
}

.modal-actions {
  display: flex;
  gap: var(--space-md);
  justify-content: flex-end;
  margin-top: var(--space-md);
}

@media (max-width: 768px) {
  .modal-actions {
    flex-direction: column-reverse;
  }

  .modal-actions button {
    width: 100%;
  }
}
</style>
