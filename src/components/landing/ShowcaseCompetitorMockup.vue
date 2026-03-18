<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { gsap } from 'gsap'
import MaterialIcon from '@/components/MaterialIcon.vue'

const props = defineProps<{ visible: boolean }>()

const { t } = useI18n()
const scanLineRef = ref<HTMLElement | null>(null)
let scanTween: gsap.core.Tween | null = null

const competitors = [
  { name: 'Competitor A', followers: '24.5K', engagement: '3.2%', posts: 85, color: '#ef4444' },
  { name: 'You', followers: '12.4K', engagement: '4.8%', posts: 142, color: '#F97316', isYou: true },
  { name: 'Competitor B', followers: '18.1K', engagement: '2.1%', posts: 62, color: '#8B5CF6' },
]

function startScan() {
  if (!scanLineRef.value) return
  scanTween = gsap.fromTo(scanLineRef.value,
    { top: '0%' },
    { top: '100%', duration: 3, ease: 'none', repeat: -1 }
  )
}

function stopScan() {
  scanTween?.kill()
  scanTween = null
}

watch(() => props.visible, (v) => {
  if (v) startScan()
  else stopScan()
}, { immediate: true })

onUnmounted(() => stopScan())
</script>

<template>
  <div class="lp-spy-dashboard">
    <div ref="scanLineRef" class="lp-scan-line" />

    <div class="lp-spy-header">
      <MaterialIcon icon="radar" size="sm" />
      <span>{{ t('appLanding.competitor.dashTitle') }}</span>
    </div>

    <div class="lp-competitor-rows">
      <div
        v-for="comp in competitors"
        :key="comp.name"
        class="lp-competitor-row"
        :class="{ highlight: comp.isYou }"
      >
        <div class="lp-comp-name">
          <span class="lp-comp-dot" :style="{ background: comp.color }" />
          {{ comp.name }}
        </div>
        <div class="lp-comp-stat">
          <span class="lp-comp-label">{{ t('appLanding.competitor.followers') }}</span>
          <span class="lp-comp-value">{{ comp.followers }}</span>
        </div>
        <div class="lp-comp-stat">
          <span class="lp-comp-label">{{ t('appLanding.competitor.engagement') }}</span>
          <span class="lp-comp-value">{{ comp.engagement }}</span>
        </div>
        <div class="lp-comp-stat">
          <span class="lp-comp-label">{{ t('appLanding.competitor.postsMonth') }}</span>
          <span class="lp-comp-value">{{ comp.posts }}</span>
        </div>

        <div class="lp-comp-bar-bg">
          <div class="lp-comp-bar-fill" :style="{ width: `${(comp.posts / 142) * 100}%`, background: comp.color }" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.lp-spy-dashboard {
  background: var(--lp-bg-surface);
  border: 1px solid var(--lp-border);
  border-radius: var(--radius-xl);
  overflow: hidden;
  position: relative;
}

.lp-scan-line {
  position: absolute;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--lp-accent-cyan), transparent);
  opacity: 0.5;
  z-index: 2;
  pointer-events: none;
}

.lp-spy-header {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-lg) var(--space-xl);
  border-bottom: 1px solid var(--lp-border);
  font-weight: var(--font-semibold);
  color: var(--lp-text-primary);
  font-size: var(--text-sm);
}

.lp-spy-header .material-icon {
  color: var(--lp-accent-cyan);
}

.lp-competitor-rows {
  padding: var(--space-lg);
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.lp-competitor-row {
  display: grid;
  grid-template-columns: 1.5fr 1fr 1fr 1fr;
  gap: var(--space-md);
  align-items: center;
  padding: var(--space-md) var(--space-lg);
  border-radius: var(--radius-lg);
  background: var(--lp-bg-primary);
  border: 1px solid var(--lp-border);
  transition: border-color 0.3s ease;
}

.lp-competitor-row.highlight {
  border-color: var(--lp-accent-orange);
  background: rgba(249, 115, 22, 0.05);
}

.lp-comp-name {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  font-weight: var(--font-semibold);
  color: var(--lp-text-primary);
  font-size: var(--text-sm);
}

.lp-comp-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.lp-comp-stat {
  display: flex;
  flex-direction: column;
}

.lp-comp-label {
  font-size: 9px;
  color: var(--lp-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.lp-comp-value {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--lp-text-primary);
}

.lp-comp-bar-bg {
  grid-column: 1 / -1;
  height: 4px;
  border-radius: 2px;
  background: var(--lp-bg-elevated);
}

.lp-comp-bar-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.8s ease;
}

@media (max-width: 768px) {
  .lp-competitor-row {
    grid-template-columns: 1fr 1fr;
    gap: var(--space-sm);
  }

  .lp-comp-name {
    grid-column: 1 / -1;
  }
}
</style>
