<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import MaterialIcon from '@/components/MaterialIcon.vue'
import PlatformLogo from '@/components/PlatformLogo.vue'

interface Props {
  rank: number
  imageUrl: string | null
  postText: string
  brandName: string
  reach: number
  likes: number
  engagementRate: number
  platforms?: string[]
}

defineProps<Props>()
defineEmits<{ (e: 'click'): void }>()

const { t } = useI18n()

const medalIcon = (rank: number) => {
  if (rank === 1) return '🥇'
  if (rank === 2) return '🥈'
  if (rank === 3) return '🥉'
  return null
}
</script>

<template>
  <div class="top-post-card reveal-card" @click="$emit('click')">
    <!-- Image area -->
    <div class="post-image-area">
      <img v-if="imageUrl" :src="imageUrl" alt="" class="post-img" />
      <div v-else class="post-img-placeholder">
        <MaterialIcon icon="article" size="md" />
      </div>

      <!-- Rank badge -->
      <span class="rank-badge" :class="{ gold: rank === 1, silver: rank === 2, bronze: rank === 3 }">
        <span v-if="medalIcon(rank)" class="medal">{{ medalIcon(rank) }}</span>
        <span v-else>#{{ rank }}</span>
      </span>

      <!-- Platform badges -->
      <div v-if="platforms?.length" class="post-platforms">
        <PlatformLogo
          v-for="p in platforms.slice(0, 3)"
          :key="p"
          :platform="(p as 'facebook' | 'instagram' | 'tiktok' | 'twitter' | 'linkedin')"
          :size="18"
          class="platform-chip"
        />
      </div>
    </div>

    <!-- Content area -->
    <div class="post-content">
      <p class="post-text">{{ postText.substring(0, 80) }}{{ postText.length > 80 ? '...' : '' }}</p>
      <span class="post-brand">{{ brandName }}</span>

      <!-- Metrics row -->
      <div class="post-stats">
        <div class="stat">
          <MaterialIcon icon="visibility" size="xs" />
          <span class="stat-value">{{ reach.toLocaleString() }}</span>
          <span class="stat-label">{{ t('analytics.reach') }}</span>
        </div>
        <div class="stat">
          <MaterialIcon icon="thumb_up" size="xs" />
          <span class="stat-value">{{ likes.toLocaleString() }}</span>
          <span class="stat-label">{{ t('analytics.likes') }}</span>
        </div>
        <div class="stat engagement-stat">
          <MaterialIcon icon="trending_up" size="xs" />
          <span class="stat-value">{{ engagementRate.toFixed(1) }}%</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.top-post-card {
  display: flex;
  background: var(--bg-secondary);
  border: 1px solid var(--glass-border);
  border-left: 3px solid rgba(176, 138, 90, 0.3);
  border-radius: var(--radius-xl);
  overflow: hidden;
  cursor: pointer;
  transition: var(--transition-base);
  min-height: 120px;
}

.top-post-card:nth-child(1) {
  border-left-color: #b08a5a;
}

.top-post-card:nth-child(2) {
  border-left-color: #94a3b8;
}

.top-post-card:nth-child(3) {
  border-left-color: #c9a97a;
}

.top-post-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 28px rgba(15, 61, 46, 0.1);
  border-color: rgba(15, 61, 46, 0.18);
}

/* Image area */
.post-image-area {
  position: relative;
  width: 140px;
  flex-shrink: 0;
  overflow: hidden;
  background: var(--bg-tertiary);
}

.post-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s ease;
}

.top-post-card:hover .post-img {
  transform: scale(1.05);
}

.post-img-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  background: linear-gradient(135deg, var(--bg-tertiary), var(--bg-elevated));
}

/* Rank badge */
.rank-badge {
  position: absolute;
  top: var(--space-sm);
  left: var(--space-sm);
  min-width: 28px;
  height: 28px;
  border-radius: var(--radius-full);
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  color: white;
  font-size: 12px;
  font-weight: var(--font-bold);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 6px;
}

.rank-badge.gold { background: linear-gradient(135deg, #f59e0b, #d97706); }
.rank-badge.silver { background: linear-gradient(135deg, #94a3b8, #64748b); }
.rank-badge.bronze { background: linear-gradient(135deg, #d97706, #92400e); }

.medal {
  font-size: 16px;
  line-height: 1;
}

/* Platform badges */
.post-platforms {
  position: absolute;
  bottom: var(--space-xs);
  right: var(--space-xs);
  display: flex;
  gap: 3px;
}

.platform-chip {
  background: rgba(255, 255, 255, 0.9);
  border-radius: var(--radius-full);
  padding: 2px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);
}

/* Content area */
.post-content {
  flex: 1;
  padding: var(--space-md) var(--space-lg);
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  min-width: 0;
}

.post-text {
  font-size: var(--text-sm);
  color: var(--text-primary);
  margin: 0;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.post-brand {
  font-size: var(--text-xs);
  color: var(--text-muted);
}

/* Stats row */
.post-stats {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  margin-top: auto;
  padding-top: var(--space-sm);
}

.stat {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: var(--text-xs);
  color: var(--text-secondary);
}

.stat-value {
  font-weight: var(--font-semibold);
  color: var(--text-primary);
}

.stat-label {
  color: var(--text-muted);
  display: none;
}

.engagement-stat {
  margin-left: auto;
  padding: 3px 10px;
  background: linear-gradient(135deg, var(--gold-primary), var(--gold-light));
  border-radius: var(--radius-full);
  color: var(--text-on-gold);
}

.engagement-stat .stat-value {
  color: inherit;
  font-weight: var(--font-bold);
}

/* Responsive */
@media (max-width: 768px) {
  .top-post-card {
    flex-direction: column;
  }

  .post-image-area {
    width: 100%;
    height: 140px;
  }

  .stat-label {
    display: inline;
  }
}

@media (prefers-reduced-motion: reduce) {
  .top-post-card:hover {
    transform: none;
  }
  .top-post-card:hover .post-img {
    transform: none;
  }
}
</style>
