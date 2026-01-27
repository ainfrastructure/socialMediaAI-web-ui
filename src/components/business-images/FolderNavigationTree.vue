<script setup lang="ts">
import { computed } from 'vue'
import type { FolderNode } from '@/composables/useBusinessImages'

interface Props {
  node: FolderNode
  currentPath: string
  level?: number
}

const props = withDefaults(defineProps<Props>(), {
  level: 0
})

const emit = defineEmits<{
  (e: 'navigate', path: string): void
  (e: 'toggle', path: string): void
}>()

const isActive = computed(() => props.currentPath === props.node.path)
const hasChildren = computed(() => props.node.children.length > 0)
const indentStyle = computed(() => ({
  paddingLeft: `${props.level * 16}px`
}))

function handleClick() {
  emit('navigate', props.node.path)
}

function handleToggle(event: Event) {
  event.stopPropagation()
  emit('toggle', props.node.path)
}
</script>

<template>
  <div class="folder-tree">
    <div
      :class="['folder-node', { active: isActive, 'has-children': hasChildren }]"
      :style="indentStyle"
      @click="handleClick"
    >
      <button
        v-if="hasChildren"
        class="expand-btn"
        type="button"
        @click="handleToggle"
      >
        <span class="expand-icon">{{ node.isExpanded ? '▼' : '▶' }}</span>
      </button>
      <span v-else class="expand-placeholder"></span>

      <span class="folder-icon">📁</span>
      <span class="folder-name">{{ node.name }}</span>
      <span class="file-count">({{ node.imageCount }})</span>
    </div>

    <div v-if="node.isExpanded && hasChildren" class="folder-children">
      <FolderNavigationTree
        v-for="child in node.children"
        :key="child.path"
        :node="child"
        :current-path="currentPath"
        :level="level + 1"
        @navigate="emit('navigate', $event)"
        @toggle="emit('toggle', $event)"
      />
    </div>
  </div>
</template>

<style scoped>
.folder-tree {
  display: flex;
  flex-direction: column;
}

.folder-node {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-sm) var(--space-md);
  cursor: pointer;
  transition: var(--transition-base);
  border-radius: var(--radius-sm);
  font-family: var(--font-body);
  font-size: var(--text-sm);
  color: var(--text-primary);
  user-select: none;
}

.folder-node:hover {
  background: rgba(15, 61, 46, 0.05);
}

.folder-node.active {
  background: var(--gold-subtle);
  color: var(--gold-primary);
  font-weight: var(--font-medium);
}

.expand-btn {
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  color: var(--text-secondary);
  transition: var(--transition-base);
}

.expand-btn:hover {
  color: var(--text-primary);
}

.expand-icon {
  font-size: var(--text-xs);
  line-height: 1;
}

.expand-placeholder {
  width: 20px;
}

.folder-icon {
  font-size: var(--text-base);
  line-height: 1;
}

.folder-name {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-count {
  font-size: var(--text-xs);
  color: var(--text-muted);
  font-weight: var(--font-normal);
}

.folder-children {
  display: flex;
  flex-direction: column;
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .folder-node,
  .expand-btn {
    transition: none;
  }
}
</style>
