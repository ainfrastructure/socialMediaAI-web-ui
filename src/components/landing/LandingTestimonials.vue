<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useGsapSection } from '@/composables/useGsapSection'
import MaterialIcon from '@/components/MaterialIcon.vue'

const { t } = useI18n()
const sectionRef = ref<HTMLElement | null>(null)

const testimonials = [
  { key: 'testimonial1', name: 'Sarah K.', role: 'restaurantOwner', rating: 5, avatar: 'SK' },
  { key: 'testimonial2', name: 'Marcus L.', role: 'fitnessCoach', rating: 5, avatar: 'ML' },
  { key: 'testimonial3', name: 'Emma R.', role: 'ecommerceFounder', rating: 5, avatar: 'ER' },
]

useGsapSection(sectionRef, (el, gsapInstance) => {
  gsapInstance.from(el.querySelectorAll('.lp-testimonial-card'), {
    scrollTrigger: { trigger: el, start: 'top 65%' },
    opacity: 0,
    y: 40,
    stagger: 0.12,
    duration: 0.7,
    ease: 'power3.out',
  })
})
</script>

<template>
  <section ref="sectionRef" class="lp-testimonials">
    <div class="lp-section-inner">
      <span class="lp-eyebrow">{{ t('appLanding.testimonials.eyebrow') }}</span>
      <h2 class="lp-section-title">{{ t('appLanding.testimonials.title') }}</h2>
      <p class="lp-section-sub">{{ t('appLanding.testimonials.subtitle') }}</p>

      <div class="lp-testimonials-grid">
        <div v-for="test in testimonials" :key="test.key" class="lp-testimonial-card">
          <div class="lp-test-stars">
            <MaterialIcon v-for="s in test.rating" :key="s" icon="star" size="xs" />
          </div>

          <blockquote class="lp-test-quote">
            "{{ t(`appLanding.testimonials.${test.key}`) }}"
          </blockquote>

          <div class="lp-test-author">
            <div class="lp-test-avatar">{{ test.avatar }}</div>
            <div>
              <span class="lp-test-name">{{ test.name }}</span>
              <span class="lp-test-role">{{ t(`appLanding.testimonials.${test.role}`) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.lp-testimonials {
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

.lp-testimonials-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-2xl);
}

.lp-testimonial-card {
  background: var(--lp-bg-surface);
  border: 1px solid var(--lp-border);
  border-radius: var(--radius-xl);
  padding: var(--space-2xl);
  text-align: left;
  display: flex;
  flex-direction: column;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}

.lp-testimonial-card:hover {
  border-color: var(--lp-border-light);
  box-shadow: var(--lp-shadow-card);
}

.lp-test-stars {
  display: flex;
  gap: 2px;
  color: #F59E0B;
  margin-bottom: var(--space-lg);
}

.lp-test-quote {
  font-size: var(--text-sm);
  color: var(--lp-text-secondary);
  line-height: 1.7;
  margin: 0 0 var(--space-xl);
  flex: 1;
}

.lp-test-author {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.lp-test-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--lp-bg-elevated);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--text-xs);
  font-weight: var(--font-bold);
  color: var(--lp-text-secondary);
}

.lp-test-name {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--lp-text-primary);
  display: block;
}

.lp-test-role {
  font-size: var(--text-xs);
  color: var(--lp-text-muted);
}

@media (max-width: 768px) {
  .lp-testimonials-grid {
    grid-template-columns: 1fr;
    max-width: 400px;
    margin: 0 auto;
  }
}
</style>
