<script setup lang="ts">
import MaterialIcon from '@/components/MaterialIcon.vue'
import BaseButton from '@/components/BaseButton.vue'

defineProps<{
  generating: boolean
  batchCount: number
}>()

const emit = defineEmits<{
  (e: 'generate'): void
  (e: 'toggle-schedule'): void
}>()

function handleGenerate() {
  emit('generate')
}
</script>

<template>
  <div class="seo-header">
    <div class="seo-header-content">
      <div class="seo-header-left">
        <div class="seo-header-icon">
          <MaterialIcon icon="trending_up" size="lg" />
        </div>
        <div>
          <h1 class="seo-header-title">SEO Content Briefs</h1>
          <p class="seo-header-subtitle">
            Generate content briefs from trending search data.
            <span v-if="batchCount > 0" class="batch-count">{{ batchCount }} batch{{ batchCount !== 1 ? 'es' : '' }} generated</span>
          </p>
        </div>
      </div>
      <div class="seo-header-actions">
        <BaseButton
          variant="ghost"
          size="small"
          @click="$emit('toggle-schedule')"
        >
          <MaterialIcon icon="schedule" size="sm" />
          Schedule
        </BaseButton>
        <BaseButton
          variant="primary"
          size="medium"
          :disabled="generating"
          @click="handleGenerate"
        >
          <MaterialIcon icon="auto_awesome" size="sm" />
          {{ generating ? 'Generating...' : 'Generate Briefs' }}
        </BaseButton>
      </div>
    </div>
  </div>
</template>

<style scoped>
.seo-header {
  margin-bottom: var(--space-xl);
}

.seo-header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-lg);
  flex-wrap: wrap;
}

.seo-header-left {
  display: flex;
  align-items: center;
  gap: var(--space-lg);
}

.seo-header-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-lg);
  background: var(--gold-subtle);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--gold-primary);
  flex-shrink: 0;
}

.seo-header-title {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
  color: var(--text-primary);
  margin: 0;
}

.seo-header-subtitle {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin: var(--space-xs) 0 0;
}

.batch-count {
  color: var(--gold-primary);
  font-weight: var(--font-medium);
}

.seo-header-actions {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

@media (max-width: 768px) {
  .seo-header-content {
    flex-direction: column;
    align-items: flex-start;
  }

  .seo-header-actions {
    width: 100%;
  }

  .seo-header-actions :deep(.base-button) {
    flex: 1;
  }
}
</style>
