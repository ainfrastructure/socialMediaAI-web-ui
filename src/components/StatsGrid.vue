<script setup lang="ts">
interface Stat {
  icon: string
  label: string
  value: string | number
  subtext?: string
}

interface Props {
  stats: Stat[]
}

defineProps<Props>()
</script>

<template>
  <div class="stats-grid">
    <div
      v-for="(stat, index) in stats"
      :key="index"
      class="stat-item"
    >
      <div class="stat-icon">{{ stat.icon }}</div>
      <div class="stat-content">
        <div class="stat-label">{{ stat.label }}</div>
        <div class="stat-value">
          {{ stat.value }}
          <span v-if="stat.subtext" class="stat-subtext">
            {{ stat.subtext }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: var(--space-lg);
}

.stat-item {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-lg);
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(212, 175, 55, 0.15);
  border-radius: var(--radius-lg);
  transition: var(--transition-base);
}

.stat-item:hover {
  background: rgba(0, 0, 0, 0.3);
  border-color: rgba(212, 175, 55, 0.3);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.stat-icon {
  font-size: 2rem;
  line-height: 1;
  flex-shrink: 0;
}

.stat-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
  min-width: 0;
}

.stat-label {
  font-size: var(--text-xs);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-secondary);
}

.stat-value {
  font-size: var(--text-lg);
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.2;
}

.stat-subtext {
  font-size: var(--text-xs);
  font-weight: 500;
  color: var(--text-secondary);
  margin-left: 0.25rem;
}

/* Responsive */
@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .stat-item {
    transition: none;
  }

  .stat-item:hover {
    transform: none;
  }
}
</style>
