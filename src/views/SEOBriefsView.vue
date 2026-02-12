<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import DashboardLayout from '@/components/DashboardLayout.vue'
import MaterialIcon from '@/components/MaterialIcon.vue'
import Toast from '@/components/Toast.vue'
import SEOBriefsHeader from '@/components/seo-briefs/SEOBriefsHeader.vue'
import SEOBriefCard from '@/components/seo-briefs/SEOBriefCard.vue'
import SEOBriefDetailModal from '@/components/seo-briefs/SEOBriefDetailModal.vue'
import SEOTrendingKeywords from '@/components/seo-briefs/SEOTrendingKeywords.vue'
import SEOSchedulePanel from '@/components/seo-briefs/SEOSchedulePanel.vue'
import { useSEOBriefsStore } from '@/stores/seoBriefs'
import type { ContentBrief, SEOBriefBatch } from '@/types/seoBriefs'

const store = useSEOBriefsStore()

// Local state
const showSchedule = ref(false)
const selectedBrief = ref<ContentBrief | null>(null)
const showDetailModal = ref(false)
const nicheInput = ref('')
const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref<'success' | 'error' | 'info'>('success')

// Computed
const displayedBatch = computed(() => store.currentBatch ?? store.latestBatch)

const statusSummary = computed(() => {
  const counts = store.briefsByStatus
  return [
    { label: 'Draft', count: counts.draft.length, icon: 'edit_note', cssClass: 'summary-draft' },
    { label: 'In Progress', count: counts.in_progress.length, icon: 'pending', cssClass: 'summary-progress' },
    { label: 'Completed', count: counts.completed.length, icon: 'check_circle', cssClass: 'summary-completed' },
  ]
})

const hasBriefs = computed(() => {
  return displayedBatch.value && displayedBatch.value.briefs.length > 0
})

const batchDateDisplay = computed(() => {
  if (!displayedBatch.value) return ''
  const date = new Date(displayedBatch.value.generatedAt)
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
})

// Actions
async function handleGenerate() {
  const niche = nicheInput.value.trim() || store.scheduleConfig.niche || 'social media marketing'
  const batch = await store.generateBriefs(niche, 5)
  if (batch) {
    showNotification('Generated 5 new SEO content briefs!', 'success')
  } else if (store.error) {
    showNotification(store.error, 'error')
  }
}

function handleViewBrief(briefId: string) {
  if (!displayedBatch.value) return
  const brief = displayedBatch.value.briefs.find((b) => b.id === briefId)
  if (brief) {
    selectedBrief.value = brief
    showDetailModal.value = true
  }
}

async function handleUpdateStatus(briefId: string, status: ContentBrief['status']) {
  if (!displayedBatch.value) return
  await store.updateBriefStatus(displayedBatch.value.id, briefId, status)
  if (!store.error) {
    // Update selected brief if viewing detail
    if (selectedBrief.value?.id === briefId) {
      selectedBrief.value = { ...selectedBrief.value, status }
    }
    showNotification(`Brief marked as ${status.replace('_', ' ')}`, 'success')
  } else {
    showNotification(store.error, 'error')
  }
}

async function handleDeleteBatch(batchId: string) {
  await store.deleteBatch(batchId)
  if (!store.error) {
    showNotification('Batch deleted', 'info')
  } else {
    showNotification(store.error, 'error')
  }
}

function handleSelectBatch(batch: SEOBriefBatch) {
  store.setCurrentBatch(batch)
}

async function handleSaveSchedule(config: typeof store.scheduleConfig) {
  await store.updateScheduleConfig(config)
  if (!store.error) {
    showNotification('Schedule updated', 'success')
    showSchedule.value = false
  } else {
    showNotification(store.error, 'error')
  }
}

function showNotification(message: string, type: 'success' | 'error' | 'info') {
  toastMessage.value = message
  toastType.value = type
  showToast.value = true
}

function closeDetailModal() {
  showDetailModal.value = false
  selectedBrief.value = null
}

onMounted(async () => {
  await Promise.all([
    store.fetchBatches(),
    store.fetchScheduleConfig(),
  ])

  // If we have batches, load the latest one
  if (store.latestBatch) {
    store.setCurrentBatch(store.latestBatch)
  }

  // Fetch trending keywords if niche is configured
  if (store.scheduleConfig.niche) {
    nicheInput.value = store.scheduleConfig.niche
    await store.fetchTrendingKeywords(store.scheduleConfig.niche)
  }
})
</script>

<template>
  <DashboardLayout>
    <div class="seo-briefs-view">
      <!-- Header -->
      <SEOBriefsHeader
        :generating="store.generating"
        :batch-count="store.totalBatches"
        @generate="handleGenerate"
        @toggle-schedule="showSchedule = !showSchedule"
      />

      <!-- Schedule Panel (collapsible) -->
      <SEOSchedulePanel
        :visible="showSchedule"
        :config="store.scheduleConfig"
        :loading="store.scheduleLoading"
        @close="showSchedule = false"
        @save="handleSaveSchedule"
      />

      <!-- Niche Input -->
      <div class="niche-bar">
        <div class="niche-input-wrapper">
          <MaterialIcon icon="search" size="sm" class="niche-icon" />
          <input
            v-model="nicheInput"
            type="text"
            class="niche-input"
            placeholder="Enter your niche (e.g. social media marketing, fitness, cooking)..."
            maxlength="100"
            @keydown.enter="handleGenerate"
          />
        </div>
        <span class="niche-hint">Press Enter or click "Generate Briefs" to create content briefs</span>
      </div>

      <!-- Loading State -->
      <div v-if="store.loading && !store.generating" class="loading-state">
        <div class="loading-spinner" />
        <p>Loading briefs...</p>
      </div>

      <!-- Generating State -->
      <div v-else-if="store.generating" class="generating-state">
        <div class="generating-animation">
          <MaterialIcon icon="auto_awesome" size="lg" />
        </div>
        <h3>Generating SEO Briefs</h3>
        <p>Analyzing trends and creating content strategies...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="!hasBriefs && !store.loading" class="empty-state">
        <div class="empty-icon">
          <MaterialIcon icon="article" size="xl" />
        </div>
        <h2 class="empty-title">No Content Briefs Yet</h2>
        <p class="empty-desc">
          Generate your first batch of SEO content briefs based on trending search data.
          Enter your niche above and click "Generate Briefs" to get started.
        </p>
        <button class="empty-cta" @click="handleGenerate">
          <MaterialIcon icon="auto_awesome" size="sm" />
          Generate Your First Batch
        </button>
      </div>

      <!-- Content: Briefs + Sidebar -->
      <template v-else>
        <!-- Error Banner -->
        <div v-if="store.error" class="error-banner">
          <MaterialIcon icon="error" size="sm" />
          <span>{{ store.error }}</span>
          <button class="error-dismiss" @click="store.clearError" aria-label="Dismiss error">
            <MaterialIcon icon="close" size="xs" />
          </button>
        </div>

        <!-- Status Summary -->
        <div class="status-summary">
          <div
            v-for="item in statusSummary"
            :key="item.label"
            :class="['summary-item', item.cssClass]"
          >
            <MaterialIcon :icon="item.icon" size="xs" />
            <span class="summary-count">{{ item.count }}</span>
            <span class="summary-label">{{ item.label }}</span>
          </div>
        </div>

        <!-- Batch Selector (if multiple batches) -->
        <div v-if="store.batches.length > 1" class="batch-selector">
          <span class="batch-selector-label">
            <MaterialIcon icon="folder" size="xs" />
            Batches
          </span>
          <div class="batch-tabs">
            <button
              v-for="batch in store.batches.slice(0, 5)"
              :key="batch.id"
              :class="['batch-tab', { active: displayedBatch?.id === batch.id }]"
              @click="handleSelectBatch(batch)"
            >
              Week {{ batch.weekNumber }}
              <span class="batch-tab-count">{{ batch.briefs.length }}</span>
            </button>
          </div>
        </div>

        <!-- Batch Date Label -->
        <div v-if="displayedBatch" class="batch-date">
          <MaterialIcon icon="event" size="xs" />
          <span>{{ batchDateDisplay }}</span>
          <span class="batch-niche-tag">{{ displayedBatch.niche }}</span>
        </div>

        <!-- Main Content Grid -->
        <div class="content-grid">
          <!-- Briefs Column -->
          <div class="briefs-column">
            <div class="briefs-grid">
              <SEOBriefCard
                v-for="brief in displayedBatch?.briefs ?? []"
                :key="brief.id"
                :brief="brief"
                class="reveal-card"
                @view="handleViewBrief"
                @update-status="handleUpdateStatus"
              />
            </div>
          </div>

          <!-- Sidebar: Trending Keywords -->
          <div class="sidebar-column">
            <SEOTrendingKeywords :keywords="store.trendingKeywords" />
          </div>
        </div>

        <!-- Batch Actions -->
        <div v-if="displayedBatch" class="batch-actions">
          <button
            class="batch-delete-btn"
            @click="handleDeleteBatch(displayedBatch!.id)"
          >
            <MaterialIcon icon="delete_outline" size="sm" />
            Delete This Batch
          </button>
        </div>
      </template>

      <!-- Detail Modal -->
      <SEOBriefDetailModal
        :brief="selectedBrief"
        :visible="showDetailModal"
        @close="closeDetailModal"
        @update-status="handleUpdateStatus"
      />
    </div>

    <!-- Toast -->
    <Toast
      v-model="showToast"
      :message="toastMessage"
      :type="toastType"
    />
  </DashboardLayout>
</template>

<style scoped>
.seo-briefs-view {
  padding: var(--space-xl) var(--space-lg);
  max-width: 1600px;
  margin: 0 auto;
}

/* Niche Input Bar */
.niche-bar {
  margin-bottom: var(--space-xl);
}

.niche-input-wrapper {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-md) var(--space-lg);
  background: var(--glass-bg);
  backdrop-filter: blur(var(--blur-md));
  -webkit-backdrop-filter: blur(var(--blur-md));
  border: var(--border-width) solid var(--glass-border);
  border-radius: var(--radius-lg);
  transition: var(--transition-base);
}

.niche-input-wrapper:focus-within {
  border-color: var(--gold-primary);
  box-shadow: 0 0 0 2px rgba(176, 138, 90, 0.15);
}

.niche-icon {
  color: var(--text-muted);
  flex-shrink: 0;
}

.niche-input {
  flex: 1;
  background: none;
  border: none;
  color: var(--text-primary);
  font-size: var(--text-base);
  font-family: var(--font-body);
  outline: none;
}

.niche-input::placeholder {
  color: var(--text-muted);
}

.niche-hint {
  display: block;
  margin-top: var(--space-xs);
  font-size: var(--text-xs);
  color: var(--text-muted);
  padding-left: var(--space-lg);
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-lg);
  padding: var(--space-5xl) var(--space-2xl);
  color: var(--text-muted);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--border-color);
  border-top-color: var(--gold-primary);
  border-radius: var(--radius-full);
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Generating State */
.generating-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-md);
  padding: var(--space-5xl) var(--space-2xl);
  text-align: center;
}

.generating-animation {
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--gold-primary);
  animation: pulse-glow 1.5s ease-in-out infinite;
}

@keyframes pulse-glow {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.15); opacity: 0.7; }
}

.generating-state h3 {
  font-family: var(--font-heading);
  font-size: var(--text-xl);
  color: var(--text-primary);
  margin: 0;
}

.generating-state p {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin: 0;
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-lg);
  padding: var(--space-5xl) var(--space-2xl);
  text-align: center;
  background: var(--bg-secondary);
  border: 1px dashed var(--glass-border);
  border-radius: var(--radius-xl);
}

.empty-icon {
  width: 72px;
  height: 72px;
  border-radius: var(--radius-xl);
  background: var(--gold-subtle);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--gold-primary);
}

.empty-title {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  color: var(--text-primary);
  margin: 0;
}

.empty-desc {
  font-size: var(--text-base);
  color: var(--text-secondary);
  margin: 0;
  max-width: 500px;
  line-height: var(--leading-relaxed);
}

.empty-cta {
  display: inline-flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-md) var(--space-xl);
  background: var(--gradient-gold);
  color: var(--text-on-gold);
  border: none;
  border-radius: var(--radius-lg);
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  cursor: pointer;
  transition: var(--transition-base);
}

.empty-cta:hover {
  transform: translateY(-2px);
  box-shadow: var(--glow-gold-md);
}

/* Error Banner */
.error-banner {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-md) var(--space-lg);
  margin-bottom: var(--space-lg);
  background: var(--error-bg);
  border-left: 3px solid var(--error-border);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  color: var(--error-text);
}

.error-dismiss {
  margin-left: auto;
  background: none;
  border: none;
  padding: var(--space-xs);
  cursor: pointer;
  color: var(--error-text);
  display: flex;
  border-radius: var(--radius-sm);
  transition: var(--transition-fast);
  opacity: 0.7;
}

.error-dismiss:hover {
  opacity: 1;
  background: rgba(0, 0, 0, 0.05);
}

/* Status Summary */
.status-summary {
  display: flex;
  gap: var(--space-lg);
  margin-bottom: var(--space-xl);
  flex-wrap: wrap;
}

.summary-item {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
}

.summary-count {
  font-weight: var(--font-bold);
}

.summary-label {
  font-weight: var(--font-medium);
}

.summary-draft {
  background: var(--info-bg);
  color: var(--info-text);
  border: 1px solid var(--info-border);
}

.summary-progress {
  background: var(--warning-bg);
  color: var(--warning-text);
  border: 1px solid var(--warning-border);
}

.summary-completed {
  background: var(--success-bg);
  color: var(--success-text);
  border: 1px solid var(--success-border);
}

/* Batch Selector */
.batch-selector {
  margin-bottom: var(--space-lg);
}

.batch-selector-label {
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

.batch-tabs {
  display: flex;
  gap: var(--space-sm);
  overflow-x: auto;
  padding-bottom: var(--space-xs);
}

.batch-tab {
  display: inline-flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  background: var(--glass-bg);
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  color: var(--text-secondary);
  cursor: pointer;
  transition: var(--transition-base);
  white-space: nowrap;
}

.batch-tab:hover {
  border-color: var(--border-hover);
  color: var(--text-primary);
}

.batch-tab.active {
  background: var(--gold-subtle);
  border-color: var(--gold-primary);
  color: var(--gold-primary);
  font-weight: var(--font-semibold);
}

.batch-tab-count {
  font-size: var(--text-xs);
  padding: 1px 6px;
  border-radius: var(--radius-sm);
  background: var(--bg-tertiary);
}

.batch-tab.active .batch-tab-count {
  background: var(--gold-primary);
  color: white;
}

/* Batch Date */
.batch-date {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin-bottom: var(--space-xl);
}

.batch-niche-tag {
  padding: 2px var(--space-sm);
  background: var(--glass-bg);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
  color: var(--text-muted);
}

/* Content Grid */
.content-grid {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: var(--space-xl);
  align-items: start;
}

/* Briefs Grid */
.briefs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: var(--space-lg);
}

/* Sidebar Column */
.sidebar-column {
  position: sticky;
  top: calc(var(--space-2xl) + 60px);
}

/* Batch Actions */
.batch-actions {
  margin-top: var(--space-2xl);
  padding-top: var(--space-xl);
  border-top: 1px solid var(--border-color);
  display: flex;
  justify-content: flex-end;
}

.batch-delete-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-lg);
  background: none;
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-muted);
  font-size: var(--text-sm);
  cursor: pointer;
  transition: var(--transition-base);
}

.batch-delete-btn:hover {
  border-color: var(--error-border);
  color: var(--error-text);
  background: var(--error-bg);
}

/* Reveal animation */
@keyframes seo-reveal {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.reveal-card {
  animation: seo-reveal 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
}

.reveal-card:nth-child(1) { animation-delay: 0ms; }
.reveal-card:nth-child(2) { animation-delay: 80ms; }
.reveal-card:nth-child(3) { animation-delay: 160ms; }
.reveal-card:nth-child(4) { animation-delay: 240ms; }
.reveal-card:nth-child(5) { animation-delay: 320ms; }

/* Responsive */
@media (max-width: 1200px) {
  .content-grid {
    grid-template-columns: 1fr;
  }

  .sidebar-column {
    position: static;
  }
}

@media (max-width: 768px) {
  .seo-briefs-view {
    padding: var(--space-md);
  }

  .briefs-grid {
    grid-template-columns: 1fr;
  }

  .status-summary {
    gap: var(--space-sm);
  }

  .summary-item {
    flex: 1;
    justify-content: center;
    min-width: 100px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .empty-cta:hover {
    transform: none;
  }

  .reveal-card {
    animation: none !important;
  }

  .generating-animation {
    animation: none;
  }
}
</style>
