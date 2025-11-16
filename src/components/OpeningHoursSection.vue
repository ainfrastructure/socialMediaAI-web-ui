<script setup lang="ts">
import { useI18n } from 'vue-i18n'

interface OpeningHours {
  open_now?: boolean
  weekday_text?: string[]
}

interface Props {
  openingHours?: OpeningHours | null
  loading?: boolean
}

defineProps<Props>()
const { t } = useI18n()
</script>

<template>
  <div class="opening-hours-section">
    <h3 class="section-subtitle">{{ t('restaurantSearch.openingHours') }}</h3>

    <div v-if="loading" class="loading-text">
      {{ t('restaurantSearch.loadingHours') }}
    </div>

    <div v-else-if="openingHours" class="opening-hours">
      <div
        v-if="openingHours.open_now !== undefined"
        class="status-badge"
        :class="{ 'open': openingHours.open_now, 'closed': !openingHours.open_now }"
      >
        {{ openingHours.open_now ? `🟢 ${t('restaurantSearch.openNow')}` : `🔴 ${t('restaurantSearch.closed')}` }}
      </div>

      <div v-if="openingHours.weekday_text && openingHours.weekday_text.length > 0" class="hours-list">
        <div
          v-for="(day, index) in openingHours.weekday_text"
          :key="index"
          class="hours-item"
        >
          {{ day }}
        </div>
      </div>
    </div>

    <div v-else class="no-hours">
      {{ t('restaurantSearch.hoursNotAvailable') }}
    </div>
  </div>
</template>

<style scoped>
.opening-hours-section {
  margin-bottom: var(--space-2xl);
}

.section-subtitle {
  font-family: var(--font-heading);
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin: 0 0 var(--space-lg) 0;
}

.loading-text {
  color: var(--text-muted);
  font-size: var(--text-sm);
  font-style: italic;
}

.opening-hours {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-sm) var(--space-lg);
  border-radius: var(--radius-full);
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  width: fit-content;
}

.status-badge.open {
  background: rgba(76, 175, 80, 0.15);
  color: #81C784;
  border: 1px solid rgba(76, 175, 80, 0.3);
}

.status-badge.closed {
  background: rgba(244, 67, 54, 0.15);
  color: #E57373;
  border: 1px solid rgba(244, 67, 54, 0.3);
}

.hours-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.hours-item {
  padding: var(--space-sm) var(--space-md);
  background: rgba(0, 0, 0, 0.2);
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
  color: var(--text-secondary);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.no-hours {
  color: var(--text-muted);
  font-size: var(--text-sm);
  font-style: italic;
}
</style>
