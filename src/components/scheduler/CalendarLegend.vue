<template>
  <div class="calendar-legend">
    <div class="legend-item">
      <div class="legend-dot legend-published"></div>
      <span>{{ $t('scheduler.published', 'Published') }}</span>
    </div>
    <div class="legend-item">
      <div class="legend-dot legend-scheduled"></div>
      <span>{{ $t('scheduler.scheduled', 'Scheduled') }}</span>
    </div>
    <div class="legend-item">
      <div class="legend-dot legend-failed"></div>
      <span>{{ $t('scheduler.failed', 'Failed') }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped>
.calendar-legend {
  display: flex;
  justify-content: center;
  gap: var(--space-xl);
  padding: var(--space-md) 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: var(--space-md);
  max-width: 100%;
  overflow: hidden;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.legend-dot {
  width: 12px;
  height: 12px;
  border-radius: var(--radius-full);
}

.legend-published {
  background: linear-gradient(135deg, #34c759, #30d158);
}

.legend-scheduled {
  background: linear-gradient(135deg, var(--gold-primary), var(--gold-light));
}

.legend-failed {
  background: linear-gradient(135deg, #ff3b30, #ff453a);
}

@media (max-width: 768px) {
  .calendar-legend {
    flex-wrap: wrap;
    gap: var(--space-md);
  }
}
</style>
