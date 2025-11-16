<script setup lang="ts">
interface Review {
  author_name: string
  profile_photo_url?: string
  relative_time_description: string
  rating: number
  text: string
}

interface Props {
  review: Review
}

defineProps<Props>()
</script>

<template>
  <div class="review-item">
    <div class="review-header">
      <div class="review-author">
        <img
          v-if="review.profile_photo_url"
          :src="review.profile_photo_url"
          :alt="review.author_name"
          class="author-photo"
        />
        <div v-else class="author-photo-placeholder">
          {{ review.author_name.charAt(0).toUpperCase() }}
        </div>
        <div class="author-info">
          <span class="author-name">{{ review.author_name }}</span>
          <span class="review-time">{{ review.relative_time_description }}</span>
        </div>
      </div>
      <div class="review-rating">
        <span
          v-for="star in 5"
          :key="star"
          class="star"
          :class="{ 'filled': star <= review.rating }"
        >
          {{ star <= review.rating ? '★' : '☆' }}
        </span>
      </div>
    </div>
    <p class="review-text">{{ review.text }}</p>
  </div>
</template>

<style scoped>
.review-item {
  padding: var(--space-xl);
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: var(--radius-lg);
  transition: var(--transition-base);
}

.review-item:hover {
  background: rgba(0, 0, 0, 0.3);
  border-color: rgba(212, 175, 55, 0.2);
}

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--space-md);
  gap: var(--space-md);
}

.review-author {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  flex: 1;
  min-width: 0;
}

.author-photo {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid rgba(212, 175, 55, 0.3);
  flex-shrink: 0;
}

.author-photo-placeholder {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--gold-primary) 0%, #b8860b 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-on-gold);
  border: 2px solid rgba(212, 175, 55, 0.3);
  flex-shrink: 0;
}

.author-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
  min-width: 0;
}

.author-name {
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.review-time {
  font-size: var(--text-xs);
  color: var(--text-secondary);
}

.review-rating {
  display: flex;
  gap: 0.125rem;
  flex-shrink: 0;
}

.star {
  font-size: 1rem;
  color: var(--text-muted);
}

.star.filled {
  color: var(--gold-primary);
}

.review-text {
  font-size: var(--text-sm);
  line-height: var(--leading-normal);
  color: var(--text-secondary);
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
}

/* Responsive */
@media (max-width: 480px) {
  .review-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .review-rating {
    margin-left: 52px;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .review-item {
    transition: none;
  }
}
</style>
