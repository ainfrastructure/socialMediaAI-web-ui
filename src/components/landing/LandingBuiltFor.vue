<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useGsapSection } from '@/composables/useGsapSection'
import MaterialIcon from '@/components/MaterialIcon.vue'
const { t } = useI18n()
const sectionRef = ref<HTMLElement | null>(null)

const personas = [
  { key: 'persona1', icon: 'restaurant' },
  { key: 'persona2', icon: 'home_repair_service' },
  { key: 'persona3', icon: 'rocket_launch' },
  { key: 'persona4', icon: 'store' },
]

useGsapSection(sectionRef, (el, gsapInstance) => {
  gsapInstance.from(el.querySelectorAll('.lp-persona-card'), {
    scrollTrigger: { trigger: el, start: 'top 65%' },
    opacity: 0,
    y: 40,
    duration: 0.7,
    stagger: 0.12,
    ease: 'power3.out',
  })
})
</script>

<template>
  <section ref="sectionRef" class="lp-built-for">
    <div class="lp-section-inner">
      <span class="lp-eyebrow">{{ t('appLanding.builtFor.eyebrow') }}</span>
      <h2 class="lp-section-title">{{ t('appLanding.builtFor.title') }}</h2>
      <p class="lp-section-sub">{{ t('appLanding.builtFor.subtitle') }}</p>
    </div>

    <!-- Persona cards -->
    <div class="lp-personas-grid">
      <div
        v-for="persona in personas"
        :key="persona.key"
        class="lp-persona-card"
      >
        <div class="lp-persona-icon">
          <MaterialIcon :icon="persona.icon" size="lg" color="var(--lp-accent-blue)" />
        </div>
        <h3 class="lp-persona-title">{{ t(`appLanding.builtFor.${persona.key}Title`) }}</h3>
        <p class="lp-persona-pain">{{ t(`appLanding.builtFor.${persona.key}Pain`) }}</p>
        <p class="lp-persona-result">{{ t(`appLanding.builtFor.${persona.key}Result`) }}</p>
      </div>
    </div>

  </section>
</template>

<style scoped>
.lp-built-for {
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
  max-width: 640px;
  margin: 0 auto var(--space-5xl);
  line-height: 1.6;
}

/* Persona cards */
.lp-personas-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-xl);
  max-width: var(--lp-max-width);
  margin: 0 auto var(--space-5xl);
}

.lp-persona-card {
  background: var(--lp-glass-bg);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid var(--lp-border);
  border-radius: var(--radius-xl);
  padding: var(--space-2xl);
  text-align: left;
  display: flex;
  flex-direction: column;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}

@media (hover: hover) {
  .lp-persona-card:hover {
    border-color: var(--lp-border-light);
    box-shadow: var(--lp-shadow-card);
  }
}

.lp-persona-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-lg);
  background: color-mix(in srgb, var(--lp-accent-orange) 10%, transparent);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--space-lg);
}

.lp-persona-title {
  font-family: var(--font-heading);
  font-size: var(--text-lg);
  font-weight: var(--font-bold);
  color: var(--lp-text-primary);
  margin: 0 0 var(--space-sm);
}

.lp-persona-pain {
  font-size: var(--text-sm);
  color: var(--lp-text-muted);
  line-height: 1.5;
  margin: 0 0 var(--space-md);
}

.lp-persona-result {
  font-size: var(--text-sm);
  color: var(--lp-accent-blue);
  line-height: 1.5;
  margin: 0;
  font-weight: var(--font-medium);
}

/* Mobile */
@media (max-width: 1024px) {
  .lp-personas-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .lp-built-for {
    padding: var(--space-3xl) var(--space-md);
  }

  .lp-personas-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-sm);
  }

  .lp-persona-card {
    flex-direction: row;
    align-items: center;
    padding: var(--space-md) var(--space-lg);
    gap: var(--space-md);
  }

  .lp-persona-icon {
    margin-bottom: 0;
    flex-shrink: 0;
    width: 40px;
    height: 40px;
  }

  .lp-persona-title {
    font-size: var(--text-sm);
    margin: 0;
  }

  .lp-persona-pain,
  .lp-persona-result {
    display: none;
  }
}
</style>
