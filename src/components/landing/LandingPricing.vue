<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useGsapSection } from '@/composables/useGsapSection'
import MaterialIcon from '@/components/MaterialIcon.vue'

const { t } = useI18n()
const sectionRef = ref<HTMLElement | null>(null)
const isAnnual = ref(true)

const TIERS = [
  { key: 'pro', monthlyPrice: 79, annualPrice: 474, featured: true, savingsKey: 'yearlySavePro' },
  { key: 'business', monthlyPrice: 149, annualPrice: 894, featured: false, savingsKey: 'yearlySaveBusiness' },
] as const

const FEATURES = [
  { key: 'featureAiChat', pro: true, business: true },
  { key: 'featurePlanning', pro: true, business: true },
  { key: 'featurePublishing', pro: true, business: true },
  { key: 'featureAnalytics', pro: true, business: true },
  { key: 'featureDesign', pro: true, business: true },
  { key: 'featureAds', pro: true, business: true },
  { key: 'featureAssets', pro: true, business: true },
  { key: 'featureTeam', pro: false, business: true },
  { key: 'featureBrandVoice', pro: false, business: true },
  { key: 'featureCompetitor', pro: false, business: true },
  { key: 'featureMultiBrand', pro: false, business: true },
  { key: 'featureSupport', pro: 'supportEmail', business: 'supportPriority' },
] as const

const priceDisplay = computed(() =>
  TIERS.map((tier) => ({
    ...tier,
    price: isAnnual.value ? tier.annualPrice : tier.monthlyPrice,
    period: isAnnual.value ? t('appLanding.pricing.year') : t('appLanding.pricing.month'),
  }))
)

function scrollToWaitlist() {
  const el = document.getElementById('lp-final-cta')
  if (el) el.scrollIntoView({ behavior: 'smooth' })
}

useGsapSection(sectionRef, (el, gsapInstance) => {
  gsapInstance.from(el.querySelectorAll('.lp-comparison-table'), {
    scrollTrigger: { trigger: el, start: 'top 65%' },
    opacity: 0,
    y: 60,
    duration: 0.8,
    ease: 'power3.out',
  })
  gsapInstance.from(el.querySelectorAll('.lp-row-wrapper'), {
    scrollTrigger: { trigger: el, start: 'top 65%' },
    opacity: 0,
    y: 20,
    duration: 0.5,
    stagger: 0.04,
    ease: 'power3.out',
    delay: 0.3,
  })
})
</script>

<template>
  <section ref="sectionRef" class="lp-pricing">
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

      <!-- Comparison table -->
      <div class="lp-comparison-table">
        <!-- Header row -->
        <div class="lp-row-wrapper lp-header-row">
          <div class="lp-col-label" />
          <div
            v-for="tier in priceDisplay"
            :key="tier.key"
            class="lp-col-plan"
            :class="{ featured: tier.featured }"
          >
            <div class="lp-card-title-row">
              <h3 class="lp-tier-name">{{ t(`appLanding.pricing.${tier.key}`) }}</h3>
              <span v-if="tier.featured" class="lp-popular-badge">
                {{ t('appLanding.pricing.popular') }}
              </span>
            </div>
            <div class="lp-tier-price">
              <span class="lp-price-currency">$</span>
              <span class="lp-price-amount">{{ tier.price }}</span>
              <span class="lp-price-period">/{{ tier.period }}</span>
            </div>
            <span v-if="isAnnual" class="lp-tier-savings">
              {{ t(`appLanding.pricing.${tier.savingsKey}`) }}
            </span>
          </div>
        </div>

        <!-- Feature rows -->
        <div
          v-for="(feature, idx) in FEATURES"
          :key="feature.key"
          class="lp-row-wrapper"
          :class="{ 'row-alt': idx % 2 === 1 }"
        >
          <div class="lp-col-label">
            {{ typeof feature.pro === 'string' || typeof feature.business === 'string'
              ? t(`appLanding.pricing.${feature.key}`)
              : t(`appLanding.pricing.${feature.key}`) }}
          </div>
          <div
            v-for="tier in TIERS"
            :key="tier.key"
            class="lp-col-plan lp-col-cell"
            :class="{ featured: tier.featured }"
          >
            <template v-if="typeof feature[tier.key] === 'string'">
              <span class="lp-cell-text">{{ t(`appLanding.pricing.${feature[tier.key]}`) }}</span>
            </template>
            <template v-else-if="feature[tier.key] === true">
              <MaterialIcon icon="check_circle" size="sm" color="var(--lp-accent-blue)" />
            </template>
            <template v-else>
              <span class="lp-cell-dash">&mdash;</span>
            </template>
          </div>
        </div>

        <!-- CTA row -->
        <div class="lp-row-wrapper lp-cta-row">
          <div class="lp-col-label" />
          <div
            v-for="tier in TIERS"
            :key="tier.key"
            class="lp-col-plan"
            :class="{ featured: tier.featured }"
          >
            <button
              class="lp-card-cta"
              :class="{ primary: tier.featured }"
              @click="scrollToWaitlist"
            >
              {{ t('appLanding.pricing.cta') }}
            </button>
          </div>
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
  background: color-mix(in srgb, var(--lp-accent-orange) 15%, transparent);
  color: var(--lp-accent-orange);
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  padding: 2px 8px;
  border-radius: var(--radius-full);
  margin-left: var(--space-xs);
}

/* Comparison table */
.lp-comparison-table {
  display: grid;
  grid-template-columns: 1.2fr 1fr 1fr;
  max-width: 880px;
  margin: 0 auto;
  background: var(--lp-glass-bg);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid var(--lp-border);
  border-radius: var(--radius-xl);
  overflow: hidden;
}

/* Row wrapper — each row spans all 3 columns and uses subgrid */
.lp-row-wrapper {
  display: grid;
  grid-column: 1 / -1;
  grid-template-columns: subgrid;
  align-items: center;
  transition: background 0.15s ease;
}

.lp-row-wrapper:not(.lp-header-row):not(.lp-cta-row):hover {
  background: rgba(255, 255, 255, 0.03);
}

.row-alt {
  background: rgba(255, 255, 255, 0.015);
}

/* Header row */
.lp-header-row {
  border-bottom: 1px solid var(--lp-border);
}

.lp-header-row .lp-col-plan {
  padding: var(--space-2xl) var(--space-xl);
}

/* Columns */
.lp-col-label {
  padding: var(--space-sm) var(--space-xl);
  text-align: left;
  font-size: var(--text-sm);
  color: var(--lp-text-secondary);
  line-height: 1.4;
}

.lp-col-plan {
  padding: var(--space-sm) var(--space-lg);
  text-align: center;
}

/* Featured column accent */
.lp-col-plan.featured {
  background: color-mix(in srgb, var(--lp-accent-orange) 4%, transparent);
}

/* Header content */
.lp-card-title-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-md);
}

.lp-tier-name {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
  color: var(--lp-text-primary);
  margin: 0;
}

.lp-popular-badge {
  display: inline-block;
  background: var(--lp-accent-orange);
  color: #fff;
  font-size: var(--text-xs);
  font-weight: var(--font-bold);
  padding: 4px 12px;
  border-radius: var(--radius-full);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.lp-tier-price {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 2px;
  margin-bottom: var(--space-sm);
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

.lp-tier-savings {
  display: inline-block;
  background: color-mix(in srgb, var(--lp-accent-orange) 15%, transparent);
  color: var(--lp-accent-blue);
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  padding: 2px 10px;
  border-radius: var(--radius-full);
  margin-top: var(--space-xs);
}

/* Feature cells */
.lp-col-cell {
  padding: var(--space-md) var(--space-lg);
}

.lp-cell-dash {
  color: var(--lp-text-muted);
  font-size: var(--text-lg);
  opacity: 0.5;
}

.lp-cell-text {
  font-size: var(--text-sm);
  color: var(--lp-text-secondary);
  font-weight: var(--font-medium);
}

/* CTA row */
.lp-cta-row {
  border-top: 1px solid var(--lp-border);
}

.lp-cta-row .lp-col-plan {
  padding: var(--space-xl);
}

.lp-card-cta {
  width: 100%;
  padding: var(--space-md) var(--space-xl);
  border-radius: var(--radius-lg);
  font-family: var(--font-body);
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  cursor: pointer;
  transition: all 0.25s ease;
  background: transparent;
  border: 1px solid var(--lp-border-light);
  color: var(--lp-text-primary);
}

.lp-card-cta.primary {
  background: var(--lp-accent-orange);
  border-color: var(--lp-accent-orange);
  color: #fff;
}

/* Hover effects (desktop only) */
@media (hover: hover) {
  .lp-card-cta:hover {
    background: color-mix(in srgb, var(--lp-accent-orange) 8%, transparent);
  }

  .lp-card-cta.primary:hover {
    background: var(--lp-accent-orange-hover);
    box-shadow: 0 0 20px var(--lp-accent-orange-glow);
  }
}

@media (hover: none) {
  .lp-card-cta.primary:active {
    background: var(--lp-accent-orange-hover);
  }
}

/* Mobile responsive */
@media (max-width: 768px) {
  .lp-pricing {
    padding: var(--space-3xl) var(--space-md);
  }

  .lp-billing-toggle {
    margin-bottom: var(--space-2xl);
  }

  .lp-comparison-table {
    grid-template-columns: 1.4fr 1fr 1fr;
  }

  .lp-header-row .lp-col-plan {
    padding: var(--space-lg) var(--space-sm);
  }

  .lp-col-label {
    padding: var(--space-sm) var(--space-md);
    font-size: var(--text-xs);
  }

  .lp-col-plan {
    padding: var(--space-sm);
  }

  .lp-col-cell {
    padding: var(--space-sm);
  }

  .lp-tier-name {
    font-size: var(--text-lg);
  }

  .lp-price-amount {
    font-size: var(--text-3xl);
  }

  .lp-price-currency {
    font-size: var(--text-base);
  }

  .lp-price-period {
    font-size: var(--text-xs);
  }

  .lp-popular-badge {
    font-size: 9px;
    padding: 2px 6px;
  }

  .lp-card-title-row {
    flex-direction: column;
    gap: var(--space-xs);
  }

  .lp-cta-row .lp-col-plan {
    padding: var(--space-md) var(--space-sm);
  }

  .lp-card-cta {
    padding: var(--space-sm) var(--space-md);
    font-size: var(--text-sm);
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .lp-row-wrapper {
    transition: none;
  }

  .lp-card-cta {
    transition: none;
  }

  .lp-toggle,
  .lp-toggle-dot {
    transition: none;
  }
}
</style>
