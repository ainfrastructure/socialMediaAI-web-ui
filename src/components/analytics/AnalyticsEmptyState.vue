<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import MaterialIcon from '@/components/MaterialIcon.vue'

const { t } = useI18n()
const router = useRouter()
</script>

<template>
  <div class="empty-state">
    <div class="empty-icon-wrap">
      <MaterialIcon icon="storefront" size="xl" />
    </div>
    <h2 class="empty-title">{{ t('analytics.emptyStateTitle') }}</h2>
    <p class="empty-desc">{{ t('analytics.emptyStateDescription') }}</p>
    <button class="create-btn" @click="router.push('/create')">
      <MaterialIcon icon="add" size="sm" />
      {{ t('analytics.createFirstPost') }}
    </button>
  </div>
</template>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-5xl) var(--space-xl);
  text-align: center;
  min-height: 400px;
}

.empty-icon-wrap {
  width: 120px;
  height: 120px;
  border-radius: var(--radius-full);
  background: linear-gradient(135deg, rgba(15, 61, 46, 0.15), rgba(15, 61, 46, 0.05));
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--space-xl);
  color: var(--gold-primary);
}

.empty-title {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  color: var(--text-primary);
  margin: 0 0 var(--space-md) 0;
}

.empty-desc {
  color: var(--text-secondary);
  font-size: var(--text-base);
  max-width: 400px;
  margin: 0 0 var(--space-xl) 0;
  line-height: var(--leading-relaxed);
}

.create-btn {
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

.create-btn:hover {
  transform: translateY(-2px);
  box-shadow: var(--glow-gold-md);
}

@media (prefers-reduced-motion: reduce) {
  .create-btn:hover {
    transform: none;
  }
}
</style>
