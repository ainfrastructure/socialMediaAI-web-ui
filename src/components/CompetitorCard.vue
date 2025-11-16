<script setup lang="ts">
interface Competitor {
  name: string
  address: string
  distance: number
  rating?: number
  user_ratings_total?: number
  types?: string[]
}

interface Props {
  competitor: Competitor
  index: number
}

defineProps<Props>()

const formatType = (type: string): string => {
  return type
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}
</script>

<template>
  <div class="competitor-item">
    <div class="competitor-number">{{ index }}</div>
    <div class="competitor-details">
      <div class="competitor-header">
        <h3 class="competitor-name">{{ competitor.name }}</h3>
        <span class="competitor-distance">{{ competitor.distance }} km</span>
      </div>
      <p class="competitor-address">{{ competitor.address }}</p>
      <div class="competitor-meta">
        <div v-if="competitor.rating" class="competitor-rating">
          ⭐ {{ competitor.rating }}
          <span v-if="competitor.user_ratings_total" class="rating-count">
            ({{ competitor.user_ratings_total }})
          </span>
        </div>
        <div v-if="competitor.types && competitor.types.length > 0" class="competitor-types">
          <span
            v-for="type in competitor.types.slice(0, 3)"
            :key="type"
            class="type-tag-small"
          >
            {{ formatType(type) }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.competitor-item {
  display: flex;
  gap: var(--space-lg);
  padding: var(--space-xl);
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: var(--radius-lg);
  transition: var(--transition-base);
}

.competitor-item:hover {
  background: rgba(0, 0, 0, 0.3);
  border-color: rgba(212, 175, 55, 0.2);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.competitor-number {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  background: rgba(212, 175, 55, 0.15);
  border: 2px solid rgba(212, 175, 55, 0.3);
  border-radius: 50%;
  font-size: var(--text-lg);
  font-weight: var(--font-bold);
  color: var(--gold-primary);
}

.competitor-details {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  flex: 1;
  min-width: 0;
}

.competitor-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space-md);
}

.competitor-name {
  font-family: var(--font-heading);
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin: 0;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
}

.competitor-distance {
  padding: var(--space-xs) var(--space-sm);
  background: rgba(33, 150, 243, 0.15);
  color: #64B5F6;
  border: 1px solid rgba(33, 150, 243, 0.3);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  flex-shrink: 0;
  white-space: nowrap;
}

.competitor-address {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

.competitor-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-md);
}

.competitor-rating {
  font-size: var(--text-sm);
  color: var(--text-primary);
  font-weight: var(--font-medium);
}

.rating-count {
  color: var(--text-secondary);
  font-weight: var(--font-normal);
}

.competitor-types {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs);
}

.type-tag-small {
  padding: 0.125rem var(--space-sm);
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-sm);
  font-size: 0.6875rem;
  color: var(--text-muted);
}

/* Responsive */
@media (max-width: 480px) {
  .competitor-item {
    flex-direction: column;
    align-items: flex-start;
  }

  .competitor-header {
    flex-direction: column;
    align-items: flex-start;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .competitor-item {
    transition: none;
  }

  .competitor-item:hover {
    transform: none;
  }
}
</style>
