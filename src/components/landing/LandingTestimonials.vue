<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import MaterialIcon from '@/components/MaterialIcon.vue'

const { t } = useI18n()

const testimonials = [
  { key: 'testimonial1', name: 'Taieb C.', role: 'decentralizedHiringCeo', rating: 5, logo: '/example/vetted-logo.png' },
  { key: 'testimonial2', name: 'Alireza S.', role: 'orderingPlatformCeo', rating: 5, logo: '/example/okam-logo.jpg' },
  { key: 'testimonial3', name: 'Shane L.', role: 'resortOwner', rating: 5, logo: '/example/blueocean-logo.png' },
  { key: 'testimonial4', name: 'Peter', role: 'businessOwner', rating: 5, logo: '/example/jungelpizza-logo.jpeg' },
  { key: 'testimonial5', name: 'Siamand', role: 'luxCarWashOwner', rating: 5, logo: '/example/luxbilpleie-logo.avif' },
]
</script>

<template>
  <section class="lp-testimonials">
    <div class="lp-section-inner">
      <span class="lp-eyebrow">{{ t('appLanding.testimonials.eyebrow') }}</span>
      <h2 class="lp-section-title">{{ t('appLanding.testimonials.title') }}</h2>
      <p class="lp-section-sub">{{ t('appLanding.testimonials.subtitle') }}</p>
    </div>

    <div class="lp-testimonials-track">
      <div class="lp-testimonials-scroll">
        <div v-for="(test, i) in [...testimonials, ...testimonials]" :key="`a-${test.key}-${i}`" class="lp-testimonial-card">
          <div class="lp-test-stars">
            <MaterialIcon v-for="s in test.rating" :key="s" icon="star" size="xs" />
          </div>

          <blockquote class="lp-test-quote">
            "{{ t(`appLanding.testimonials.${test.key}`) }}"
          </blockquote>

          <div class="lp-test-author">
            <div class="lp-test-avatar">
              <img :src="test.logo" :alt="test.name" class="lp-test-logo" loading="lazy" />
            </div>
            <div>
              <span class="lp-test-name">{{ test.name }}</span>
              <span class="lp-test-role">{{ t(`appLanding.testimonials.${test.role}`) }}</span>
            </div>
          </div>
        </div>
      </div>
      <div class="lp-testimonials-scroll" aria-hidden="true">
        <div v-for="(test, i) in [...testimonials, ...testimonials]" :key="`b-${test.key}-${i}`" class="lp-testimonial-card">
          <div class="lp-test-stars">
            <MaterialIcon v-for="s in test.rating" :key="s" icon="star" size="xs" />
          </div>

          <blockquote class="lp-test-quote">
            "{{ t(`appLanding.testimonials.${test.key}`) }}"
          </blockquote>

          <div class="lp-test-author">
            <div class="lp-test-avatar">
              <img :src="test.logo" :alt="test.name" class="lp-test-logo" loading="lazy" />
            </div>
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
  padding: var(--lp-section-gap) 0;
  overflow: hidden;
}

.lp-section-inner {
  max-width: var(--lp-max-width);
  margin: 0 auto;
  text-align: center;
  padding: 0 var(--space-xl);
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

.lp-testimonials-track {
  display: flex;
  overflow: hidden;
  mask-image: linear-gradient(to right, transparent, black 5%, black 95%, transparent);
  -webkit-mask-image: linear-gradient(to right, transparent, black 5%, black 95%, transparent);
}

.lp-testimonials-scroll {
  display: flex;
  gap: var(--space-2xl);
  flex-shrink: 0;
  animation: testimonial-marquee 50s linear infinite;
  padding-right: var(--space-2xl);
}

.lp-testimonials-track:hover .lp-testimonials-scroll {
  animation-play-state: paused;
}

@keyframes testimonial-marquee {
  from {
    transform: translateX(-100%);
  }
  to {
    transform: translateX(0);
  }
}

.lp-testimonial-card {
  background: var(--lp-bg-surface);
  border: 1px solid var(--lp-border);
  border-radius: var(--radius-xl);
  padding: var(--space-2xl);
  text-align: left;
  display: flex;
  flex-direction: column;
  width: 340px;
  min-height: 240px;
  flex-shrink: 0;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}

@media (hover: hover) {
  .lp-testimonial-card:hover {
    border-color: var(--lp-border-light);
    box-shadow: var(--lp-shadow-card);
  }
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
  overflow: hidden;
  flex-shrink: 0;
}

.lp-test-logo {
  width: 100%;
  height: 100%;
  object-fit: contain;
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
  .lp-testimonial-card {
    width: 280px;
    min-height: 220px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .lp-testimonials-scroll {
    animation: none;
  }
}
</style>
