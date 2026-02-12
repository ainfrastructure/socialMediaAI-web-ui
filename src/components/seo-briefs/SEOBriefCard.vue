<script setup lang="ts">
import { computed } from 'vue'
import MaterialIcon from '@/components/MaterialIcon.vue'
import type { ContentBrief } from '@/types/seoBriefs'

const props = defineProps<{
  brief: ContentBrief
}>()

const emit = defineEmits<{
  (e: 'view', briefId: string): void
  (e: 'update-status', briefId: string, status: ContentBrief['status']): void
}>()

const statusConfig = computed(() => {
  const map: Record<ContentBrief['status'], { label: string; icon: string; cssClass: string }> = {
    draft: { label: 'Draft', icon: 'edit_note', cssClass: 'status-draft' },
    in_progress: { label: 'In Progress', icon: 'pending', cssClass: 'status-progress' },
    completed: { label: 'Completed', icon: 'check_circle', cssClass: 'status-completed' },
    archived: { label: 'Archived', icon: 'archive', cssClass: 'status-archived' },
  }
  return map[props.brief.status]
})

const trendScoreLabel = computed(() => {
  if (props.brief.trendScore >= 80) return 'Hot'
  if (props.brief.trendScore >= 50) return 'Rising'
  return 'Moderate'
})

const trendScoreClass = computed(() => {
  if (props.brief.trendScore >= 80) return 'trend-hot'
  if (props.brief.trendScore >= 50) return 'trend-rising'
  return 'trend-moderate'
})

const wordCountDisplay = computed(() =>
  `${props.brief.wordCountTarget.min.toLocaleString()}–${props.brief.wordCountTarget.max.toLocaleString()} words`
)
</script>

<template>
  <div class="brief-card" @click="$emit('view', brief.id)">
    <!-- Header: status + trend score -->
    <div class="brief-card-header">
      <span :class="['brief-status', statusConfig.cssClass]">
        <MaterialIcon :icon="statusConfig.icon" size="xs" />
        {{ statusConfig.label }}
      </span>
      <span :class="['trend-badge', trendScoreClass]">
        <MaterialIcon icon="trending_up" size="xs" />
        {{ trendScoreLabel }} ({{ brief.trendScore }})
      </span>
    </div>

    <!-- Title & headline -->
    <h3 class="brief-title">{{ brief.title }}</h3>
    <p class="brief-headline">{{ brief.headline }}</p>

    <!-- Keywords -->
    <div class="brief-keywords">
      <span class="keyword-label">
        <MaterialIcon icon="key" size="xs" />
        Keywords
      </span>
      <div class="keyword-tags">
        <span class="keyword-tag primary">{{ brief.targetKeywords.primary }}</span>
        <span
          v-for="kw in brief.targetKeywords.secondary.slice(0, 3)"
          :key="kw"
          class="keyword-tag secondary"
        >
          {{ kw }}
        </span>
        <span
          v-if="brief.targetKeywords.secondary.length > 3"
          class="keyword-tag more"
        >
          +{{ brief.targetKeywords.secondary.length - 3 }}
        </span>
      </div>
    </div>

    <!-- Meta row: word count + links -->
    <div class="brief-meta">
      <span class="meta-item">
        <MaterialIcon icon="notes" size="xs" />
        {{ wordCountDisplay }}
      </span>
      <span class="meta-item">
        <MaterialIcon icon="link" size="xs" />
        {{ brief.internalLinks.length }} internal link{{ brief.internalLinks.length !== 1 ? 's' : '' }}
      </span>
      <span class="meta-item">
        <MaterialIcon icon="list" size="xs" />
        {{ brief.outline.length }} sections
      </span>
    </div>

    <!-- Actions -->
    <div class="brief-actions" @click.stop>
      <button
        v-if="brief.status === 'draft'"
        class="action-btn action-start"
        @click="$emit('update-status', brief.id, 'in_progress')"
        title="Start writing"
      >
        <MaterialIcon icon="play_arrow" size="sm" />
      </button>
      <button
        v-if="brief.status === 'in_progress'"
        class="action-btn action-complete"
        @click="$emit('update-status', brief.id, 'completed')"
        title="Mark completed"
      >
        <MaterialIcon icon="check" size="sm" />
      </button>
      <button
        v-if="brief.status !== 'archived'"
        class="action-btn action-archive"
        @click="$emit('update-status', brief.id, 'archived')"
        title="Archive"
      >
        <MaterialIcon icon="archive" size="sm" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.brief-card {
  background: var(--glass-bg);
  backdrop-filter: blur(var(--blur-md));
  -webkit-backdrop-filter: blur(var(--blur-md));
  border: var(--border-width) solid var(--glass-border);
  border-radius: var(--radius-lg);
  padding: var(--space-xl);
  cursor: pointer;
  transition: var(--transition-base);
  position: relative;
}

.brief-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
  border-color: var(--border-hover);
}

.brief-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: var(--glass-highlight);
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
}

.brief-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-md);
}

.brief-status {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--radius-full);
}

.status-draft {
  background: var(--info-bg);
  color: var(--info-text);
  border: 1px solid var(--info-border);
}

.status-progress {
  background: var(--warning-bg);
  color: var(--warning-text);
  border: 1px solid var(--warning-border);
}

.status-completed {
  background: var(--success-bg);
  color: var(--success-text);
  border: 1px solid var(--success-border);
}

.status-archived {
  background: var(--glass-bg);
  color: var(--text-muted);
  border: 1px solid var(--border-color);
}

.trend-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--radius-full);
}

.trend-hot {
  background: var(--error-bg);
  color: var(--error-text);
  border: 1px solid var(--error-border);
}

.trend-rising {
  background: var(--warning-bg);
  color: var(--warning-text);
  border: 1px solid var(--warning-border);
}

.trend-moderate {
  background: var(--info-bg);
  color: var(--info-text);
  border: 1px solid var(--info-border);
}

.brief-title {
  font-family: var(--font-heading);
  font-size: var(--text-lg);
  font-weight: var(--font-bold);
  color: var(--text-primary);
  margin: 0 0 var(--space-xs);
  line-height: var(--leading-tight);
}

.brief-headline {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin: 0 0 var(--space-lg);
  line-height: var(--leading-normal);
}

.brief-keywords {
  margin-bottom: var(--space-lg);
}

.keyword-label {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  font-size: var(--text-xs);
  color: var(--text-muted);
  font-weight: var(--font-medium);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: var(--space-sm);
}

.keyword-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs);
}

.keyword-tag {
  font-size: var(--text-xs);
  padding: 2px var(--space-sm);
  border-radius: var(--radius-sm);
  font-weight: var(--font-medium);
}

.keyword-tag.primary {
  background: var(--gold-subtle);
  color: var(--gold-primary);
  border: 1px solid var(--gold-primary);
}

.keyword-tag.secondary {
  background: var(--glass-bg);
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
}

.keyword-tag.more {
  background: transparent;
  color: var(--text-muted);
  border: 1px dashed var(--border-color);
}

.brief-meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-lg);
  margin-bottom: var(--space-lg);
}

.meta-item {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  font-size: var(--text-xs);
  color: var(--text-muted);
}

.brief-actions {
  display: flex;
  gap: var(--space-sm);
  justify-content: flex-end;
}

.action-btn {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-md);
  border: var(--border-width) solid var(--border-color);
  background: var(--glass-bg);
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: var(--transition-base);
}

.action-btn:hover {
  border-color: var(--border-hover);
  transform: translateY(-1px);
}

.action-start:hover {
  color: var(--gold-primary);
  background: var(--gold-subtle);
}

.action-complete:hover {
  color: var(--success-text);
  background: var(--success-bg);
}

.action-archive:hover {
  color: var(--text-muted);
  background: var(--bg-tertiary);
}

@media (max-width: 768px) {
  .brief-card {
    padding: var(--space-lg);
  }

  .brief-meta {
    gap: var(--space-md);
  }
}
</style>
