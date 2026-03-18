<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useGsapSection } from '@/composables/useGsapSection'
import MaterialIcon from '@/components/MaterialIcon.vue'

const { t } = useI18n()
const sectionRef = ref<HTMLElement | null>(null)
const isAnnual = ref(true)

const plans = [
  {
    key: 'starter',
    icon: 'rocket_launch',
    monthlyPrice: 29,
    annualPrice: 19,
    featured: false,
    features: ['starterF1', 'starterF2', 'starterF3', 'starterF4'],
  },
  {
    key: 'pro',
    icon: 'auto_awesome',
    monthlyPrice: 79,
    annualPrice: 59,
    featured: true,
    features: ['proF1', 'proF2', 'proF3', 'proF4', 'proF5'],
  },
  {
    key: 'business',
    icon: 'business',
    monthlyPrice: 199,
    annualPrice: 149,
    featured: false,
    features: ['businessF1', 'businessF2', 'businessF3', 'businessF4', 'businessF5'],
  },
]

function scrollToWaitlist() {
  const el = document.getElementById('lp-final-cta')
  if (el) el.scrollIntoView({ behavior: 'smooth' })
}

useGsapSection(sectionRef, (el, gsapInstance) => {
  gsapInstance.from(el.querySelectorAll('.lp-pricing-card'), {
    scrollTrigger: { trigger: el, start: 'top 65%' },
    opacity: 0,
    y: 60,
    stagger: 0.12,
    duration: 0.8,
    ease: 'power3.out',
  })
})
</script>

<template>
  <section id="lp-pricing" ref="sectionRef" class="lp-pricing">
    <div class="lp-section-inner">
      <span class="lp-eyebrow">{{ t('appLanding.pricing.eyebrow') }}</span>
      <h2 class="lp-section-title">{{ t('appLanding.pricing.title') }}</h2>
      <p class="lp-section-sub">{{ t('appLanding.pricing.subtitle') }}</p>

      <!-- Billing toggle -->
      <div class="lp-billing-toggle">
        <span :class="{ active: !isAnnual }">{{ t('appLanding.pricing.monthly') }}</span>
        <button class="lp-toggle" :class="{ annual: isAnnual }" @click="isAnnual = !isAnnual">
          <span class="lp-toggle-dot" />
        </button>
        <span :class="{ active: isAnnual }">
          {{ t('appLanding.pricing.annual') }}
          <span class="lp-save-badge">{{ t('appLanding.pricing.save') }}</span>
        </span>
      </div>

      <div class="lp-pricing-grid">
        <div
          v-for="plan in plans"
          :key="plan.key"
          class="lp-pricing-card"
          :class="{ featured: plan.featured }"
        >
          <div v-if="plan.featured" class="lp-popular-badge">
            {{ t('appLanding.pricing.popular') }}
          </div>

          <div class="lp-plan-icon">
            <MaterialIcon :icon="plan.icon" size="lg" />
          </div>

          <h3 class="lp-plan-name">{{ t(`appLanding.pricing.${plan.key}`) }}</h3>

          <div class="lp-plan-price">
            <span class="lp-price-currency">$</span>
            <span class="lp-price-amount">{{ isAnnual ? plan.annualPrice : plan.monthlyPrice }}</span>
            <span class="lp-price-period">/{{ t('appLanding.pricing.month') }}</span>
          </div>

          <ul class="lp-plan-features">
            <li v-for="f in plan.features" :key="f">
              <MaterialIcon icon="check" size="xs" />
              {{ t(`appLanding.pricing.${f}`) }}
            </li>
          </ul>

          <button
            class="lp-plan-cta primary"
            @click="scrollToWaitlist"
          >
            {{ t('appLanding.pricing.cta') }}
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.lp-pricing {
  padding: var(--lp-section-gap) var(--space-xl);
  position: relative;
  z-index: 2;
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
  margin: 0 auto var(--space-3xl);
  line-height: 1.6;
}

/* Billing toggle */
.lp-billing-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-md);
  margin-bottom: var(--space-5xl);
  font-size: var(--text-sm);
  color: var(--lp-text-muted);
}

.lp-billing-toggle span.active {
  color: var(--lp-text-primary);
  font-weight: var(--font-medium);
}

.lp-toggle {
  width: 48px;
  height: 26px;
  border-radius: var(--radius-full);
  border: none;
  background: var(--lp-bg-elevated);
  cursor: pointer;
  position: relative;
  padding: 3px;
  transition: background 0.3s ease;
}

.lp-toggle.annual {
  background: var(--lp-accent-orange);
}

.lp-toggle-dot {
  display: block;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #fff;
  transition: transform 0.3s ease;
}

.lp-toggle.annual .lp-toggle-dot {
  transform: translateX(22px);
}

.lp-save-badge {
  display: inline-block;
  background: rgba(249, 115, 22, 0.15);
  color: var(--lp-accent-orange);
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  padding: 2px 8px;
  border-radius: var(--radius-full);
  margin-left: var(--space-xs);
}

/* Grid */
.lp-pricing-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-2xl);
  align-items: stretch;
}

.lp-pricing-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: var(--space-3xl) var(--space-2xl);
  border-radius: var(--radius-xl);
  background: var(--lp-bg-surface);
  border: 1px solid var(--lp-border);
  position: relative;
  transition: border-color 0.3s ease, box-shadow 0.3s ease, transform 0.3s ease;
}

@media (hover: hover) {
  .lp-pricing-card:hover {
    border-color: var(--lp-border-light);
    transform: translateY(-4px);
  }
}
@media (hover: none) {
  .lp-pricing-card:active { transform: scale(0.98); }
}

.lp-pricing-card.featured {
  border-color: var(--lp-accent-orange);
  box-shadow: 0 0 40px var(--lp-accent-orange-glow), var(--lp-shadow-card);
}

@media (hover: hover) {
  .lp-pricing-card.featured:hover {
    transform: translateY(-4px);
  }
}
@media (hover: none) {
  .lp-pricing-card.featured:active { transform: scale(0.98); }
}

.lp-popular-badge {
  position: absolute;
  top: -12px;
  background: var(--lp-accent-orange);
  color: #fff;
  font-size: var(--text-xs);
  font-weight: var(--font-bold);
  padding: 4px 16px;
  border-radius: var(--radius-full);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.lp-plan-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-lg);
  background: linear-gradient(135deg, rgba(249, 115, 22, 0.15), rgba(139, 92, 246, 0.1));
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--space-xl);
  color: var(--lp-accent-orange);
}

.lp-plan-name {
  font-family: var(--font-body);
  font-size: var(--text-xl);
  font-weight: var(--font-semibold);
  color: var(--lp-text-primary);
  margin: 0 0 var(--space-lg);
}

.lp-plan-price {
  display: flex;
  align-items: baseline;
  gap: 2px;
  margin-bottom: var(--space-2xl);
}

.lp-price-currency {
  font-size: var(--text-xl);
  font-weight: var(--font-semibold);
  color: var(--lp-text-secondary);
}

.lp-price-amount {
  font-size: var(--text-5xl);
  font-weight: var(--font-bold);
  color: var(--lp-text-primary);
  line-height: 1;
}

.lp-price-period {
  font-size: var(--text-sm);
  color: var(--lp-text-muted);
}

.lp-plan-features {
  list-style: none;
  padding: 0;
  margin: 0 0 var(--space-3xl);
  width: 100%;
  text-align: left;
}

.lp-plan-features li {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) 0;
  font-size: var(--text-sm);
  color: var(--lp-text-secondary);
  border-bottom: 1px solid var(--lp-border);
}

.lp-plan-features li:last-child {
  border-bottom: none;
}

.lp-plan-features li .material-icon {
  color: #22c55e;
  flex-shrink: 0;
}

.lp-plan-cta {
  width: 100%;
  padding: var(--space-md) var(--space-xl);
  border-radius: var(--radius-lg);
  font-family: var(--font-body);
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  cursor: pointer;
  transition: all 0.25s ease;
  margin-top: auto;
  background: transparent;
  border: 1px solid var(--lp-border-light);
  color: var(--lp-text-primary);
}

@media (hover: hover) {
  .lp-plan-cta:hover { background: var(--lp-bg-elevated); }
}
@media (hover: none) {
  .lp-plan-cta:active { background: var(--lp-bg-elevated); }
}

.lp-plan-cta.primary {
  background: var(--lp-accent-orange);
  border-color: var(--lp-accent-orange);
  color: #fff;
}

@media (hover: hover) {
  .lp-plan-cta.primary:hover {
    background: var(--lp-accent-orange-hover);
    box-shadow: 0 0 20px var(--lp-accent-orange-glow);
  }
}
@media (hover: none) {
  .lp-plan-cta.primary:active {
    background: var(--lp-accent-orange-hover);
  }
}

@media (max-width: 768px) {
  .lp-pricing-grid {
    grid-template-columns: 1fr;
    max-width: 400px;
    margin: 0 auto;
  }

  .lp-pricing-card.featured {
    transform: none;
    order: -1;
  }

  @media (hover: hover) {
    .lp-pricing-card.featured:hover {
      transform: translateY(-4px);
    }
  }
}
</style>
