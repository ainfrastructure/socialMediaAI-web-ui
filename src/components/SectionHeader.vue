<script setup lang="ts">
interface Badge {
  text: string
  variant?: 'count' | 'status' | 'platform'
}

interface Props {
  title: string
  badge?: Badge
}

defineProps<Props>()
</script>

<template>
  <div class="section-header">
    <h3 class="section-title">{{ title }}</h3>
    <span v-if="badge" :class="['section-badge', badge.variant || 'count']">
      {{ badge.text }}
    </span>
  </div>
</template>

<style scoped>
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-lg);
  padding-bottom: var(--space-md);
  border-bottom: 1px solid rgba(212, 175, 55, 0.15);
}

.section-title {
  font-family: var(--font-heading);
  font-size: var(--text-xl);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin: 0;
}

.section-badge {
  padding: var(--space-xs) var(--space-md);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  transition: var(--transition-base);
}

.section-badge.count {
  background: rgba(212, 175, 55, 0.15);
  color: var(--gold-light);
  border: 1px solid rgba(212, 175, 55, 0.3);
}

.section-badge.status {
  background: rgba(76, 175, 80, 0.15);
  color: #81C784;
  border: 1px solid rgba(76, 175, 80, 0.3);
}

.section-badge.platform {
  background: rgba(33, 150, 243, 0.15);
  color: #64B5F6;
  border: 1px solid rgba(33, 150, 243, 0.3);
}

/* Responsive */
@media (max-width: 480px) {
  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-sm);
  }
}
</style>
