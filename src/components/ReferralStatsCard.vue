<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import BaseCard from './BaseCard.vue'
import MaterialIcon from './MaterialIcon.vue'
import type { ReferralListItem } from '../services/referralService'

interface Props {
  totalReferrals: number
  successfulReferrals: number
  pendingReferrals: number
  totalCreditsFormatted: string
  currentBalanceFormatted: string
  referrals: ReferralListItem[]
}

const props = defineProps<Props>()

const { t } = useI18n()

// Get status icon and color
function getStatusInfo(status: string): { icon: string; color: string; label: string } {
  switch (status) {
    case 'pending':
      return {
        icon: 'hourglass_empty',
        color: 'var(--warning-text)',
        label: t('referral.statusPending'),
      }
    case 'converted':
      return {
        icon: 'check_circle',
        color: 'var(--info-text)',
        label: t('referral.statusConverted'),
      }
    case 'credited':
      return {
        icon: 'paid',
        color: 'var(--success-text)',
        label: t('referral.statusCredited'),
      }
    case 'expired':
      return {
        icon: 'cancel',
        color: 'var(--text-muted)',
        label: t('referral.statusExpired'),
      }
    default:
      return {
        icon: 'help',
        color: 'var(--text-muted)',
        label: status,
      }
  }
}

// Format date
function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

// Stats items
const stats = computed(() => [
  {
    icon: 'group_add',
    value: props.totalReferrals,
    label: t('referral.totalReferrals'),
    color: 'var(--text-primary)',
  },
  {
    icon: 'check_circle',
    value: props.successfulReferrals,
    label: t('referral.successfulReferrals'),
    color: 'var(--success-text)',
  },
  {
    icon: 'hourglass_empty',
    value: props.pendingReferrals,
    label: t('referral.pendingReferrals'),
    color: 'var(--warning-text)',
  },
])
</script>

<template>
  <BaseCard variant="glass" class="referral-stats-card">
    <div class="card-header">
      <MaterialIcon icon="analytics" size="md" color="var(--gold-primary)" />
      <h3>{{ $t('referral.stats') }}</h3>
    </div>

    <!-- Stats Grid -->
    <div class="stats-grid">
      <div v-for="stat in stats" :key="stat.label" class="stat-item">
        <MaterialIcon :icon="stat.icon" size="md" :color="stat.color" />
        <div class="stat-value">{{ stat.value }}</div>
        <div class="stat-label">{{ stat.label }}</div>
      </div>
    </div>

    <!-- Credits Section -->
    <div class="credits-section">
      <div class="credit-item">
        <div class="credit-label">{{ $t('referral.creditsEarned') }}</div>
        <div class="credit-value">{{ totalCreditsFormatted }}</div>
      </div>
      <div class="credit-item highlight">
        <div class="credit-label">{{ $t('referral.currentBalance') }}</div>
        <div class="credit-value">{{ currentBalanceFormatted }}</div>
      </div>
    </div>

    <!-- Referral History -->
    <div class="history-section" v-if="referrals.length > 0">
      <h4>{{ $t('referral.referralHistory') }}</h4>
      <div class="history-list">
        <div v-for="referral in referrals" :key="referral.id" class="history-item">
          <div class="history-info">
            <div class="history-email">{{ referral.referred_email_masked }}</div>
            <div class="history-date">{{ formatDate(referral.created_at) }}</div>
          </div>
          <div class="history-status">
            <span
              class="status-badge"
              :style="{ color: getStatusInfo(referral.status).color }"
            >
              <MaterialIcon
                :icon="getStatusInfo(referral.status).icon"
                size="sm"
                :color="getStatusInfo(referral.status).color"
              />
              {{ getStatusInfo(referral.status).label }}
            </span>
            <span v-if="referral.credit_amount_formatted" class="credit-badge">
              +{{ referral.credit_amount_formatted }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="empty-state">
      <MaterialIcon icon="people_outline" size="xl" color="var(--text-muted)" />
      <p>{{ $t('referral.noReferrals') }}</p>
    </div>
  </BaseCard>
</template>

<style scoped>
.referral-stats-card {
  padding: var(--space-xl);
}

.card-header {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  margin-bottom: var(--space-xl);
}

.card-header h3 {
  font-family: var(--font-heading);
  font-size: var(--text-lg);
  color: var(--text-primary);
  margin: 0;
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-lg);
  margin-bottom: var(--space-xl);
}

.stat-item {
  text-align: center;
  padding: var(--space-md);
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
}

.stat-value {
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
  color: var(--text-primary);
  margin: var(--space-sm) 0;
}

.stat-label {
  font-size: var(--text-xs);
  color: var(--text-secondary);
}

/* Credits Section */
.credits-section {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-lg);
  padding: var(--space-lg);
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
  margin-bottom: var(--space-xl);
}

.credit-item {
  text-align: center;
}

.credit-item.highlight {
  background: var(--gold-subtle);
  border-radius: var(--radius-md);
  padding: var(--space-md);
}

.credit-label {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin-bottom: var(--space-xs);
}

.credit-value {
  font-size: var(--text-xl);
  font-weight: var(--font-bold);
  color: var(--gold-primary);
}

/* History Section */
.history-section h4 {
  font-family: var(--font-heading);
  font-size: var(--text-base);
  color: var(--text-primary);
  margin-bottom: var(--space-md);
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-md);
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
  gap: var(--space-md);
}

.history-info {
  flex: 1;
  min-width: 0;
}

.history-email {
  font-size: var(--text-sm);
  color: var(--text-primary);
  font-weight: var(--font-medium);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.history-date {
  font-size: var(--text-xs);
  color: var(--text-muted);
}

.history-status {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  flex-shrink: 0;
}

.status-badge {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
}

.credit-badge {
  background: var(--success-bg);
  color: var(--success-text);
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: var(--space-2xl);
}

.empty-state p {
  color: var(--text-muted);
  margin-top: var(--space-md);
  font-size: var(--text-sm);
}

/* Responsive */
@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .credits-section {
    grid-template-columns: 1fr;
  }

  .history-item {
    flex-direction: column;
    align-items: flex-start;
  }

  .history-status {
    width: 100%;
    justify-content: space-between;
    margin-top: var(--space-sm);
  }
}
</style>
