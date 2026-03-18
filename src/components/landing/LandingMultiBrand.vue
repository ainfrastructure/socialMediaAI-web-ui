<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useGsapSection } from '@/composables/useGsapSection'
import MaterialIcon from '@/components/MaterialIcon.vue'

const { t } = useI18n()
const sectionRef = ref<HTMLElement | null>(null)

const brands = [
  { name: 'Café Aurora', color: '#F59E0B', icon: 'local_cafe', accounts: 4 },
  { name: 'FitLife Gym', color: '#22C55E', icon: 'fitness_center', accounts: 3 },
  { name: 'Urban Style', color: '#8B5CF6', icon: 'checkroom', accounts: 5 },
]

useGsapSection(sectionRef, (el, g) => {
  const cards = el.querySelectorAll('.lp-brand-card')
  const bars = el.querySelectorAll('.lp-brand-bar-fill')

  // Set initial hidden state immediately
  g.set(cards, { opacity: 0, y: 40, rotation: -5 })
  g.set(bars, { scaleX: 0, transformOrigin: 'left' })

  // Staggered card entrance on scroll
  g.to(cards, {
    scrollTrigger: { trigger: el, start: 'top 65%' },
    opacity: 1,
    y: 0,
    rotation: 0,
    stagger: 0.15,
    duration: 0.8,
    ease: 'power3.out',
  })

  // Bar fills after cards land
  g.to(bars, {
    scrollTrigger: { trigger: el, start: 'top 55%' },
    scaleX: 1,
    stagger: 0.15,
    duration: 0.6,
    ease: 'power2.out',
  })
})
</script>

<template>
  <section ref="sectionRef" class="lp-multibrand">
    <div class="lp-section-inner">
      <span class="lp-eyebrow">{{ t('appLanding.multiBrand.eyebrow') }}</span>
      <h2 class="lp-section-title">{{ t('appLanding.multiBrand.title') }}</h2>
      <p class="lp-section-sub">{{ t('appLanding.multiBrand.subtitle') }}</p>

      <div class="lp-brand-stack">
        <div
          v-for="(brand, i) in brands"
          :key="brand.name"
          class="lp-brand-card"
          :style="{
            '--brand-color': brand.color,
            '--card-rotate': `${(i - 1) * 3}deg`,
            '--card-offset': `${i * 20}px`,
          }"
        >
          <div class="lp-brand-header">
            <div class="lp-brand-icon">
              <MaterialIcon :icon="brand.icon" size="md" />
            </div>
            <div class="lp-brand-info">
              <h3>{{ brand.name }}</h3>
              <span>{{ t('appLanding.multiBrand.accounts', { count: brand.accounts }) }}</span>
            </div>
          </div>

          <div class="lp-brand-stats">
            <div class="lp-brand-stat">
              <span class="lp-stat-value">{{ ['2.1K', '5.4K', '8.2K'][i] }}</span>
              <span class="lp-stat-label">{{ t('appLanding.multiBrand.followers') }}</span>
            </div>
            <div class="lp-brand-stat">
              <span class="lp-stat-value">{{ ['28', '45', '67'][i] }}</span>
              <span class="lp-stat-label">{{ t('appLanding.multiBrand.postsMonth') }}</span>
            </div>
            <div class="lp-brand-stat">
              <span class="lp-stat-value">{{ ['4.2%', '3.8%', '5.1%'][i] }}</span>
              <span class="lp-stat-label">{{ t('appLanding.multiBrand.engagement') }}</span>
            </div>
          </div>

          <div class="lp-brand-bar">
            <div class="lp-brand-bar-fill" :style="{ width: `${[45, 65, 85][i]}%` }" />
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.lp-multibrand {
  padding: var(--lp-section-gap) var(--space-xl);
}

.lp-section-inner {
  max-width: var(--lp-max-width);
  margin: 0 auto;
  text-align: center;
}

.lp-eyebrow {
  display: inline-block;
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  color: var(--lp-accent-orange);
  text-transform: uppercase;
  letter-spacing: 0.15em;
  margin-bottom: var(--space-lg);
}

.lp-section-title {
  font-family: var(--font-heading);
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: var(--font-bold);
  color: var(--lp-text-primary);
  margin: 0 0 var(--space-lg);
  letter-spacing: -0.02em;
}

.lp-section-sub {
  font-size: var(--text-lg);
  color: var(--lp-text-secondary);
  max-width: 600px;
  margin: 0 auto var(--space-5xl);
  line-height: 1.6;
}

.lp-brand-stack {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-2xl);
  max-width: 900px;
  margin: 0 auto;
}

.lp-brand-card {
  background: var(--lp-bg-surface);
  border: 1px solid var(--lp-border);
  border-radius: var(--radius-xl);
  padding: var(--space-2xl);
  text-align: left;
  transition: border-color 0.3s ease, transform 0.3s ease, box-shadow 0.3s ease;
}

.lp-brand-card:hover {
  border-color: var(--brand-color, var(--lp-border-light));
  transform: translateY(-4px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
}

.lp-brand-header {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  margin-bottom: var(--space-xl);
}

.lp-brand-icon {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-lg);
  background: color-mix(in srgb, var(--brand-color, var(--lp-accent-orange)) 15%, transparent);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--brand-color);
}

.lp-brand-info h3 {
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  color: var(--lp-text-primary);
  margin: 0;
}

.lp-brand-info span {
  font-size: var(--text-xs);
  color: var(--lp-text-muted);
}

.lp-brand-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-md);
  margin-bottom: var(--space-lg);
}

.lp-brand-stat {
  display: flex;
  flex-direction: column;
}

.lp-stat-value {
  font-size: var(--text-lg);
  font-weight: var(--font-bold);
  color: var(--lp-text-primary);
}

.lp-stat-label {
  font-size: 9px;
  color: var(--lp-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.lp-brand-bar {
  height: 4px;
  border-radius: 2px;
  background: var(--lp-bg-elevated);
}

.lp-brand-bar-fill {
  height: 100%;
  border-radius: 2px;
  background: var(--brand-color, var(--lp-accent-orange));
  transition: width 0.8s ease;
}

@media (max-width: 768px) {
  .lp-brand-stack {
    grid-template-columns: 1fr;
    max-width: 400px;
  }
}
</style>
