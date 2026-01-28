<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import BaseModal from '../BaseModal.vue'
import BaseButton from '../BaseButton.vue'
import BaseInput from '../BaseInput.vue'
import BaseAlert from '../BaseAlert.vue'

interface Props {
  modelValue: boolean
  folderPath: string
  folderName: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'rename', oldPath: string, newPath: string): void
}>()

const { t } = useI18n()
const newFolderName = ref('')
const renaming = ref(false)
const error = ref('')

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      newFolderName.value = props.folderName
      error.value = ''
    }
  }
)

function handleClose() {
  emit('update:modelValue', false)
  newFolderName.value = ''
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

  // Check if name is unchanged
  if (name.trim() === props.folderName) {
    error.value = t('businessManagement.folderNameUnchanged')
    return false
  }

  return true
}

async function handleRename() {
  error.value = ''

  if (!validateFolderName(newFolderName.value)) {
    return
  }

  renaming.value = true

  try {
    // Build new path by replacing last folder name
    const pathParts = props.folderPath.split('/')
    pathParts[pathParts.length - 1] = newFolderName.value.trim()
    const newPath = pathParts.join('/')

    emit('rename', props.folderPath, newPath)
    handleClose()
  } catch (err: any) {
    error.value = err.message || t('businessManagement.renameFolderError')
  } finally {
    renaming.value = false
  }
}
</script>

<template>
  <BaseModal :model-value="modelValue" @update:model-value="handleClose" size="sm">
    <template #title>{{ $t('businessManagement.renameFolder') }}</template>

    <div class="rename-folder-content">
      <BaseAlert v-if="error" type="error" class="error-alert">
        {{ error }}
      </BaseAlert>

      <div class="current-path">
        <span class="path-label">{{ $t('businessManagement.currentPath') }}:</span>
        <span class="path-value">{{ folderPath }}</span>
      </div>

      <BaseInput
        v-model="newFolderName"
        :label="$t('businessManagement.newFolderName')"
        :placeholder="$t('businessManagement.folderNamePlaceholder')"
        :disabled="renaming"
        autofocus
        required
        @keyup.enter="handleRename"
      />

      <div class="path-preview">
        <span class="preview-label">{{ $t('businessManagement.newPath') }}:</span>
        <span class="preview-value">
          {{
            folderPath.split('/').slice(0, -1).concat(newFolderName || '...').join('/')
          }}
        </span>
      </div>

      <div class="modal-actions">
        <BaseButton @click="handleClose" variant="ghost" :disabled="renaming">
          {{ $t('common.cancel') }}
        </BaseButton>
        <BaseButton
          @click="handleRename"
          variant="primary"
          :disabled="renaming || !newFolderName.trim() || newFolderName === folderName"
        >
          {{ renaming ? $t('common.renaming') : $t('common.rename') }}
        </BaseButton>
      </div>
    </div>
  </BaseModal>
</template>

<style scoped>
.rename-folder-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.error-alert {
  margin-bottom: var(--space-md);
}

.current-path {
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
