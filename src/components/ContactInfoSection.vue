<script setup lang="ts">
import { useI18n } from 'vue-i18n'

interface Props {
  rating?: number
  userRatingsTotal?: number
  phoneNumber?: string
  website?: string
}

defineProps<Props>()
const { t } = useI18n()
</script>

<template>
  <div v-if="rating || phoneNumber || website" class="contact-info-section">
    <h3 class="section-subtitle">{{ t('restaurantSearch.contactInfo') }}</h3>

    <div class="info-grid">
      <div v-if="rating" class="info-item">
        <span class="info-icon">⭐</span>
        <div class="info-content">
          <span class="info-value">{{ rating }} / 5</span>
          <span v-if="userRatingsTotal" class="info-meta">
            {{ userRatingsTotal }} {{ t('restaurantSearch.reviews') }}
          </span>
        </div>
      </div>

      <div v-if="phoneNumber" class="info-item">
        <span class="info-icon">📞</span>
        <div class="info-content">
          <a :href="`tel:${phoneNumber}`" class="info-link">{{ phoneNumber }}</a>
        </div>
      </div>

      <div v-if="website" class="info-item">
        <span class="info-icon">🌐</span>
        <div class="info-content">
          <a :href="website" target="_blank" rel="noopener noreferrer" class="info-link">
            {{ t('restaurantSearch.visitWebsite') }}
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.contact-info-section {
  margin-bottom: var(--space-2xl);
}

.section-subtitle {
  font-family: var(--font-heading);
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin: 0 0 var(--space-lg) 0;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--space-lg);
}

.info-item {
  display: flex;
  align-items: flex-start;
  gap: var(--space-md);
  padding: var(--space-lg);
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: var(--radius-md);
  transition: var(--transition-base);
}

.info-item:hover {
  background: rgba(0, 0, 0, 0.3);
  border-color: rgba(212, 175, 55, 0.2);
}

.info-icon {
  font-size: 1.5rem;
  line-height: 1;
  flex-shrink: 0;
}

.info-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
  min-width: 0;
}

.info-value {
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
}

.info-meta {
  font-size: var(--text-xs);
  color: var(--text-secondary);
}

.info-link {
  font-size: var(--text-base);
  color: var(--gold-primary);
  text-decoration: none;
  transition: var(--transition-base);
  word-break: break-word;
}

.info-link:hover {
  color: var(--gold-light);
  text-decoration: underline;
}

/* Responsive */
@media (max-width: 768px) {
  .info-grid {
    grid-template-columns: 1fr;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .info-item {
    transition: none;
  }

  .info-link {
    transition: none;
  }
}
</style>
