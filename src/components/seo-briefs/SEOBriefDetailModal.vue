<script setup lang="ts">
import { computed } from 'vue'
import MaterialIcon from '@/components/MaterialIcon.vue'
import BaseButton from '@/components/BaseButton.vue'
import BaseModal from '@/components/BaseModal.vue'
import type { ContentBrief } from '@/types/seoBriefs'

const props = defineProps<{
  brief: ContentBrief | null
  visible: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'update-status', briefId: string, status: ContentBrief['status']): void
}>()

const statusConfig = computed(() => {
  if (!props.brief) return null
  const map: Record<ContentBrief['status'], { label: string; icon: string; cssClass: string }> = {
    draft: { label: 'Draft', icon: 'edit_note', cssClass: 'status-draft' },
    in_progress: { label: 'In Progress', icon: 'pending', cssClass: 'status-progress' },
    completed: { label: 'Completed', icon: 'check_circle', cssClass: 'status-completed' },
    archived: { label: 'Archived', icon: 'archive', cssClass: 'status-archived' },
  }
  return map[props.brief.status]
})

const wordCountDisplay = computed(() => {
  if (!props.brief) return ''
  return `${props.brief.wordCountTarget.min.toLocaleString()}–${props.brief.wordCountTarget.max.toLocaleString()} words`
})

const relevanceIcon = (relevance: string) => {
  if (relevance === 'high') return 'star'
  if (relevance === 'medium') return 'star_half'
  return 'star_outline'
}
</script>

<template>
  <BaseModal :model-value="visible" @update:model-value="!$event && $emit('close')" size="lg">
    <template v-if="brief">
      <div class="brief-detail">
        <!-- Header -->
        <div class="detail-header">
          <div class="detail-header-top">
            <span v-if="statusConfig" :class="['brief-status', statusConfig.cssClass]">
              <MaterialIcon :icon="statusConfig.icon" size="xs" />
              {{ statusConfig.label }}
            </span>
            <span class="trend-score">
              <MaterialIcon icon="trending_up" size="xs" />
              Trend Score: {{ brief.trendScore }}/100
            </span>
          </div>
          <h2 class="detail-title">{{ brief.title }}</h2>
          <p class="detail-headline">{{ brief.headline }}</p>
        </div>

        <!-- Keywords Section -->
        <div class="detail-section">
          <h3 class="section-title">
            <MaterialIcon icon="key" size="sm" />
            Target Keywords
          </h3>
          <div class="keywords-grid">
            <div class="keyword-group">
              <span class="keyword-group-label">Primary</span>
              <span class="keyword-chip primary">{{ brief.targetKeywords.primary }}</span>
            </div>
            <div class="keyword-group">
              <span class="keyword-group-label">Secondary</span>
              <div class="keyword-chips">
                <span
                  v-for="kw in brief.targetKeywords.secondary"
                  :key="kw"
                  class="keyword-chip secondary"
                >
                  {{ kw }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Word Count Target -->
        <div class="detail-section">
          <h3 class="section-title">
            <MaterialIcon icon="notes" size="sm" />
            Word Count Target
          </h3>
          <div class="word-count-bar">
            <div class="word-count-range">
              <span class="wc-min">{{ brief.wordCountTarget.min.toLocaleString() }}</span>
              <div class="wc-bar">
                <div class="wc-bar-fill"></div>
              </div>
              <span class="wc-max">{{ brief.wordCountTarget.max.toLocaleString() }}</span>
            </div>
            <span class="wc-label">{{ wordCountDisplay }}</span>
          </div>
        </div>

        <!-- Content Outline -->
        <div class="detail-section">
          <h3 class="section-title">
            <MaterialIcon icon="list" size="sm" />
            Content Outline
          </h3>
          <ol class="outline-list">
            <li v-for="(section, i) in brief.outline" :key="i" class="outline-item">
              {{ section }}
            </li>
          </ol>
        </div>

        <!-- Internal Linking Strategy -->
        <div class="detail-section">
          <h3 class="section-title">
            <MaterialIcon icon="link" size="sm" />
            Internal Linking Strategy
          </h3>
          <div v-if="brief.internalLinks.length === 0" class="empty-links">
            No internal links suggested.
          </div>
          <div v-else class="links-list">
            <div
              v-for="(link, i) in brief.internalLinks"
              :key="i"
              class="link-item"
            >
              <div class="link-info">
                <MaterialIcon :icon="relevanceIcon(link.relevance)" size="xs" />
                <span class="link-anchor">"{{ link.anchor }}"</span>
                <span class="link-arrow">→</span>
                <span class="link-url">{{ link.targetUrl }}</span>
              </div>
              <span :class="['link-relevance', `relevance-${link.relevance}`]">
                {{ link.relevance }}
              </span>
            </div>
          </div>
        </div>

        <!-- Actions Footer -->
        <div class="detail-actions">
          <BaseButton variant="ghost" size="small" @click="$emit('close')">
            Close
          </BaseButton>
          <div class="detail-actions-right">
            <BaseButton
              v-if="brief.status === 'draft'"
              variant="primary"
              size="small"
              @click="$emit('update-status', brief.id, 'in_progress')"
            >
              <MaterialIcon icon="play_arrow" size="sm" />
              Start Writing
            </BaseButton>
            <BaseButton
              v-if="brief.status === 'in_progress'"
              variant="primary"
              size="small"
              @click="$emit('update-status', brief.id, 'completed')"
            >
              <MaterialIcon icon="check" size="sm" />
              Mark Complete
            </BaseButton>
            <BaseButton
              v-if="brief.status !== 'archived'"
              variant="secondary"
              size="small"
              @click="$emit('update-status', brief.id, 'archived')"
            >
              <MaterialIcon icon="archive" size="sm" />
              Archive
            </BaseButton>
          </div>
        </div>
      </div>
    </template>
  </BaseModal>
</template>

<style scoped>
.brief-detail {
  max-width: 720px;
}

.detail-header {
  margin-bottom: var(--space-2xl);
}

.detail-header-top {
  display: flex;
  align-items: center;
  gap: var(--space-md);
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
}

.status-progress {
  background: var(--warning-bg);
  color: var(--warning-text);
}

.status-completed {
  background: var(--success-bg);
  color: var(--success-text);
}

.status-archived {
  background: var(--glass-bg);
  color: var(--text-muted);
}

.trend-score {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  color: var(--text-secondary);
}

.detail-title {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
  color: var(--text-primary);
  margin: 0 0 var(--space-sm);
  line-height: var(--leading-tight);
}

.detail-headline {
  font-size: var(--text-base);
  color: var(--text-secondary);
  margin: 0;
  line-height: var(--leading-relaxed);
}

.detail-section {
  margin-bottom: var(--space-2xl);
}

.section-title {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0 0 var(--space-lg);
  padding-bottom: var(--space-sm);
  border-bottom: 1px solid var(--border-color);
}

.keywords-grid {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.keyword-group-label {
  font-size: var(--text-xs);
  color: var(--text-muted);
  font-weight: var(--font-medium);
  display: block;
  margin-bottom: var(--space-sm);
}

.keyword-chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs);
}

.keyword-chip {
  font-size: var(--text-sm);
  padding: var(--space-xs) var(--space-md);
  border-radius: var(--radius-md);
  font-weight: var(--font-medium);
}

.keyword-chip.primary {
  background: var(--gold-subtle);
  color: var(--gold-primary);
  border: 1px solid var(--gold-primary);
  font-weight: var(--font-semibold);
}

.keyword-chip.secondary {
  background: var(--glass-bg);
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
}

.word-count-bar {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.word-count-range {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.wc-min,
.wc-max {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  min-width: 48px;
}

.wc-max {
  text-align: right;
}

.wc-bar {
  flex: 1;
  height: 8px;
  background: var(--bg-tertiary);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.wc-bar-fill {
  height: 100%;
  width: 75%;
  background: var(--gradient-gold);
  border-radius: var(--radius-full);
}

.wc-label {
  font-size: var(--text-xs);
  color: var(--text-muted);
  text-align: center;
}

.outline-list {
  margin: 0;
  padding-left: var(--space-xl);
  list-style: decimal;
}

.outline-item {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  padding: var(--space-sm) 0;
  line-height: var(--leading-normal);
  border-bottom: 1px solid var(--border-color);
}

.outline-item:last-child {
  border-bottom: none;
}

.empty-links {
  font-size: var(--text-sm);
  color: var(--text-muted);
  font-style: italic;
}

.links-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.link-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-md);
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
  gap: var(--space-md);
}

.link-info {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  flex: 1;
  min-width: 0;
  flex-wrap: wrap;
}

.link-anchor {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-primary);
}

.link-arrow {
  color: var(--text-muted);
  font-size: var(--text-xs);
}

.link-url {
  font-size: var(--text-xs);
  color: var(--gold-primary);
  font-family: monospace;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.link-relevance {
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  padding: 2px var(--space-sm);
  border-radius: var(--radius-sm);
  flex-shrink: 0;
}

.relevance-high {
  background: var(--success-bg);
  color: var(--success-text);
}

.relevance-medium {
  background: var(--warning-bg);
  color: var(--warning-text);
}

.relevance-low {
  background: var(--info-bg);
  color: var(--info-text);
}

.detail-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: var(--space-xl);
  border-top: 1px solid var(--border-color);
}

.detail-actions-right {
  display: flex;
  gap: var(--space-sm);
}

@media (max-width: 768px) {
  .link-info {
    flex-direction: column;
    align-items: flex-start;
  }

  .link-arrow {
    display: none;
  }

  .detail-actions {
    flex-direction: column;
    gap: var(--space-md);
  }

  .detail-actions-right {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>
