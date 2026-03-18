<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import MaterialIcon from '@/components/MaterialIcon.vue'

defineProps<{ visible: boolean }>()

const { t } = useI18n()

const platforms = [
  { name: 'Instagram', icon: 'photo_camera', color: '#E4405F', status: 'sent' },
  { name: 'Facebook', icon: 'thumb_up', color: '#1877F2', status: 'sent' },
  { name: 'TikTok', icon: 'music_note', color: '#00f2ea', status: 'sent' },
  { name: 'X', icon: 'tag', color: '#8b98a5', status: 'optimized' },
  { name: 'LinkedIn', icon: 'work', color: '#0A66C2', status: 'optimized' },
  { name: 'Pinterest', icon: 'push_pin', color: '#BD081C', status: 'optimized' },
]
</script>

<template>
  <div class="lp-publish-card">
    <div class="lp-publish-header">
      <div class="lp-publish-icon">
        <MaterialIcon icon="rocket_launch" size="sm" />
      </div>
      <div class="lp-publish-meta">
        <span class="lp-publish-title">{{ t('appLanding.publishing.postTitle') }}</span>
        <span class="lp-publish-sub">6 platforms</span>
      </div>
      <span class="lp-publish-badge">
        <MaterialIcon icon="check_circle" size="xs" />
        {{ t('appLanding.publishing.sent') }}
      </span>
    </div>

    <div class="lp-publish-platforms">
      <div
        v-for="platform in platforms"
        :key="platform.name"
        class="lp-publish-platform"
      >
        <div class="lp-platform-icon" :style="{ background: platform.color + '18', color: platform.color }">
          <MaterialIcon :icon="platform.icon" size="sm" />
        </div>
        <div class="lp-platform-info">
          <span class="lp-platform-name">{{ platform.name }}</span>
          <span class="lp-platform-status">
            {{ t(`appLanding.publishing.${platform.status}`) }}
          </span>
        </div>
        <MaterialIcon icon="check_circle" size="sm" class="lp-platform-check" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.lp-publish-card {
  background: var(--lp-bg-surface);
  border: 1px solid var(--lp-border);
  border-radius: var(--radius-xl);
  overflow: hidden;
}

.lp-publish-header {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-lg) var(--space-xl);
  border-bottom: 1px solid var(--lp-border);
}

.lp-publish-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-lg);
  background: var(--lp-gradient-aurora);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex-shrink: 0;
}

.lp-publish-meta {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.lp-publish-title {
  font-weight: var(--font-semibold);
  color: var(--lp-text-primary);
  font-size: var(--text-sm);
}

.lp-publish-sub {
  font-size: var(--text-xs);
  color: var(--lp-text-muted);
}

.lp-publish-badge {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  color: #22c55e;
  background: rgba(34, 197, 94, 0.1);
  padding: var(--space-xs) var(--space-md);
  border-radius: var(--radius-full);
}

.lp-publish-platforms {
  padding: var(--space-md) var(--space-xl) var(--space-xl);
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.lp-publish-platform {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-md) var(--space-lg);
  background: var(--lp-bg-primary);
  border-radius: var(--radius-lg);
  transition: background 0.2s ease;
}

.lp-publish-platform:hover {
  background: var(--lp-bg-elevated);
}

.lp-platform-icon {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.lp-platform-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.lp-platform-name {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--lp-text-primary);
}

.lp-platform-status {
  font-size: var(--text-xs);
  color: var(--lp-text-muted);
}

.lp-platform-check {
  color: #22c55e;
  flex-shrink: 0;
}
</style>
