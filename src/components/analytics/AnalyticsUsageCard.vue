<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import MaterialIcon from '@/components/MaterialIcon.vue'

interface Props {
  creditsThisMonth: number
  monthlyLimit: number
  creditsUsagePercent: number
  subscriptionTier: string
  brandCount: number
}

const props = defineProps<Props>()
const { t } = useI18n()

const circumference = 2 * Math.PI * 52
const progressOffset = computed(() =>
  circumference - (props.creditsUsagePercent / 100) * circumference
)

const ringColor = computed(() => {
  if (props.creditsUsagePercent > 90) return '#ef4444'
  if (props.creditsUsagePercent > 75) return '#f97316'
  return 'var(--gold-primary)'
})
</script>

<template>
  <div class="usage-card reveal-card">
    <div class="card-header">
      <div class="chart-title-area">
        <div class="chart-icon">
          <MaterialIcon icon="speed" size="sm" />
        </div>
        <div>
          <h3 class="chart-title">{{ t('analytics.usageOverview') }}</h3>
          <span class="chart-subtitle">{{ t('analytics.monthlyUsage') }}</span>
        </div>
      </div>
    </div>

    <div class="usage-body">
      <!-- Circular Progress -->
      <div class="progress-ring-wrap">
        <svg class="progress-ring" width="120" height="120" viewBox="0 0 120 120">
          <!-- Background track -->
          <circle
            cx="60" cy="60" r="52"
            fill="none"
            stroke="var(--bg-tertiary)"
            stroke-width="8"
          />
          <!-- Progress arc -->
          <circle
            cx="60" cy="60" r="52"
            fill="none"
            :stroke="ringColor"
            stroke-width="8"
            stroke-linecap="round"
            :stroke-dasharray="circumference"
            :stroke-dashoffset="progressOffset"
            class="progress-arc"
            transform="rotate(-90 60 60)"
          />
        </svg>
        <div class="progress-center">
          <span class="progress-percent">{{ creditsUsagePercent }}%</span>
          <span class="progress-label">{{ t('analytics.used') }}</span>
        </div>
      </div>

      <!-- Credits text -->
      <div class="credits-info">
        <span class="credits-numbers">{{ creditsThisMonth }} / {{ monthlyLimit }}</span>
        <span class="credits-label">{{ t('analytics.creditsUsed') }}</span>
      </div>
    </div>

    <!-- Stats row -->
    <div class="stats-row">
      <div class="stat-item">
        <div class="stat-icon tier">
          <MaterialIcon icon="workspace_premium" size="sm" />
        </div>
        <div class="stat-text">
          <span class="stat-label">{{ t('analytics.subscription') }}</span>
          <span class="stat-value">{{ subscriptionTier }}</span>
        </div>
      </div>
      <div class="stat-item">
        <div class="stat-icon brands">
          <MaterialIcon icon="storefront" size="sm" />
        </div>
        <div class="stat-text">
          <span class="stat-label">{{ t('analytics.restaurants') }}</span>
          <span class="stat-value">{{ brandCount }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.usage-card {
  background: linear-gradient(165deg, var(--bg-secondary), rgba(26, 77, 58, 0.04));
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
  padding: var(--space-xl);
  overflow: hidden;
  position: relative;
  display: flex;
  flex-direction: column;
}

.card-header {
  margin-bottom: var(--space-xl);
}

.chart-title-area {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.chart-icon {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  background: linear-gradient(135deg, rgba(15, 61, 46, 0.1), rgba(15, 61, 46, 0.04));
  color: var(--gold-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.chart-title {
  font-family: var(--font-heading);
  font-size: var(--text-lg);
  color: var(--text-primary);
  margin: 0;
}

.chart-subtitle {
  font-size: var(--text-xs);
  color: var(--text-muted);
}

/* Usage body with ring */
.usage-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-lg) 0;
  flex: 1;
}

.progress-ring-wrap {
  position: relative;
  width: 120px;
  height: 120px;
}

.progress-ring {
  display: block;
}

.progress-arc {
  transition: stroke-dashoffset 0.8s ease;
}

.progress-center {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.progress-percent {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
  color: var(--text-primary);
  line-height: 1;
}

.progress-label {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
  margin-top: 2px;
}

.credits-info {
  text-align: center;
}

.credits-numbers {
  display: block;
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
}

.credits-label {
  display: block;
  font-size: var(--text-xs);
  color: var(--text-muted);
}

/* Stats row */
.stats-row {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  padding-top: var(--space-lg);
  border-top: 1px solid var(--glass-border);
  margin-top: auto;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.stat-icon {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-icon.tier {
  background: linear-gradient(135deg, rgba(176, 138, 90, 0.15), rgba(176, 138, 90, 0.05));
  color: #b08a5a;
}

.stat-icon.brands {
  background: linear-gradient(135deg, rgba(15, 61, 46, 0.1), rgba(15, 61, 46, 0.04));
  color: var(--gold-primary);
}

.stat-text {
  display: flex;
  flex-direction: column;
}

.stat-label {
  font-size: var(--text-xs);
  color: var(--text-muted);
}

.stat-value {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  text-transform: capitalize;
}

@media (max-width: 768px) {
  .usage-card {
    padding: var(--space-lg);
  }
}
</style>
