<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import BaseModal from '../BaseModal.vue'
import BaseButton from '../BaseButton.vue'
import BaseAlert from '../BaseAlert.vue'
import type { FolderNode } from '@/composables/useBusinessImages'

interface Props {
  modelValue: boolean
  selectedCount: number
  folderStructure: FolderNode | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'move', targetFolderPath: string): void
}>()

const { t } = useI18n()
const selectedFolderPath = ref<string>('/')
const moving = ref(false)
const error = ref('')

const selectedFolderName = computed(() => {
  if (selectedFolderPath.value === '/') return 'Root'
  const parts = selectedFolderPath.value.split('/')
  return parts[parts.length - 1]
})

function handleClose() {
  emit('update:modelValue', false)
  selectedFolderPath.value = '/'
  error.value = ''
}

function selectFolder(path: string) {
  selectedFolderPath.value = path
}

async function handleMove() {
  error.value = ''

  if (!selectedFolderPath.value) {
    error.value = t('restaurantManagement.selectFolderError')
    return
  }

  moving.value = true

  try {
    const targetPath = selectedFolderPath.value === '/' ? 'uncategorized' : selectedFolderPath.value
    emit('move', targetPath)
    handleClose()
  } catch (err: any) {
    error.value = err.message || t('restaurantManagement.moveImagesError')
  } finally {
    moving.value = false
  }
}

function renderFolderTree(node: FolderNode, level: number = 0): any {
  return [
    {
      node,
      level,
      children: node.children.flatMap((child) => renderFolderTree(child, level + 1))
    }
  ]
}

const flatFolders = computed(() => {
  if (!props.folderStructure) return []
  return renderFolderTree(props.folderStructure).flat(Infinity)
})
</script>

<template>
  <BaseModal :model-value="modelValue" @update:model-value="handleClose" size="md">
    <template #title>
      {{ $t('restaurantManagement.moveImages', { count: selectedCount }) }}
    </template>

    <div class="move-images-content">
      <BaseAlert v-if="error" type="error" class="error-alert">
        {{ error }}
      </BaseAlert>

      <div class="info-box">
        <p>{{ $t('restaurantManagement.moveImagesInfo', { count: selectedCount }) }}</p>
      </div>

      <div class="folder-tree-container">
        <div class="folder-tree-header">
          {{ $t('restaurantManagement.selectDestination') }}
        </div>

        <div class="folder-tree-list">
          <template v-for="{ node, level } in flatFolders" :key="node.path">
            <button
              :class="['folder-item', { selected: selectedFolderPath === node.path }]"
              :style="{ paddingLeft: `${level * 20 + 12}px` }"
              @click="selectFolder(node.path)"
            >
              <span class="folder-icon">{{ node.path === '/' ? '🏠' : '📁' }}</span>
              <span class="folder-name">{{ node.name }}</span>
              <span class="image-count">({{ node.imageCount }})</span>
            </button>
          </template>
        </div>
      </div>

      <div class="selected-preview">
        <span class="preview-label">{{ $t('restaurantManagement.movingTo') }}:</span>
        <span class="preview-value">{{ selectedFolderPath }}</span>
      </div>

      <div class="modal-actions">
        <BaseButton @click="handleClose" variant="ghost" :disabled="moving">
          {{ $t('common.cancel') }}
        </BaseButton>
        <BaseButton @click="handleMove" variant="primary" :disabled="moving">
          {{
            moving
              ? $t('common.moving')
              : $t('restaurantManagement.moveCount', { count: selectedCount })
          }}
        </BaseButton>
      </div>
    </div>
  </BaseModal>
</template>

<style scoped>
.move-images-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.error-alert {
  margin-bottom: var(--space-md);
}

.info-box {
  padding: var(--space-md);
  background: rgba(15, 61, 46, 0.05);
  border-radius: var(--radius-md);
  border: 1px solid rgba(15, 61, 46, 0.1);
}

.info-box p {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.folder-tree-container {
  border: 1px solid rgba(15, 61, 46, 0.1);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.folder-tree-header {
  padding: var(--space-md);
  background: var(--bg-secondary);
  border-bottom: 1px solid rgba(15, 61, 46, 0.1);
  font-weight: var(--font-medium);
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.folder-tree-list {
  max-height: 300px;
  overflow-y: auto;
}

.folder-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-md);
  background: transparent;
  border: none;
  border-bottom: 1px solid rgba(15, 61, 46, 0.05);
  cursor: pointer;
  transition: var(--transition-base);
  font-family: var(--font-body);
  font-size: var(--text-base);
  text-align: left;
}

.folder-item:hover {
  background: rgba(15, 61, 46, 0.05);
}

.folder-item.selected {
  background: rgba(15, 61, 46, 0.1);
  border-left: 3px solid var(--gold-primary);
}

.folder-item:last-child {
  border-bottom: none;
}

.folder-icon {
  font-size: var(--text-lg);
  flex-shrink: 0;
}

.folder-name {
  flex: 1;
  color: var(--text-primary);
  font-weight: var(--font-medium);
}

.image-count {
  font-size: var(--text-sm);
  color: var(--text-muted);
}

.selected-preview {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  padding: var(--space-md);
  background: rgba(15, 61, 46, 0.05);
  border-radius: var(--radius-md);
  border: 1px solid rgba(15, 61, 46, 0.1);
}

.preview-label {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-secondary);
}

.preview-value {
  font-size: var(--text-base);
  color: var(--gold-primary);
  font-family: var(--font-mono, monospace);
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

  .folder-tree-list {
    max-height: 200px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .folder-item {
    transition: none;
  }
}
</style>
