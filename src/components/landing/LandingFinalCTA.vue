<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useGsapSection } from '@/composables/useGsapSection'
import { useLandingWaitlist } from '@/composables/useLandingWaitlist'
import MaterialIcon from '@/components/MaterialIcon.vue'

const { t } = useI18n()
const sectionRef = ref<HTMLElement | null>(null)
const { email, loading, success, error, submit } = useLandingWaitlist('landing-final-cta')

useGsapSection(sectionRef, (el, gsapInstance) => {
  gsapInstance.from(el.querySelector('.lp-cta-content'), {
    scrollTrigger: { trigger: el, start: 'top 70%' },
    opacity: 0,
    y: 50,
    duration: 0.9,
    ease: 'power3.out',
  })
})
</script>

<template>
  <section id="lp-final-cta" ref="sectionRef" class="lp-final-cta">
    <div class="lp-section-inner">
      <div class="lp-cta-content">
        <h2 class="lp-cta-title">{{ t('appLanding.finalCta.title') }}</h2>
        <p class="lp-cta-sub">{{ t('appLanding.finalCta.subtitle') }}</p>

        <div v-if="!success" class="lp-cta-form">
          <form @submit.prevent="submit" class="lp-form-row">
            <input
              v-model="email"
              type="email"
              :placeholder="t('appLanding.earlyBird.inputPlaceholder')"
              :disabled="loading"
              class="lp-form-input"
            />
            <button type="submit" class="lp-form-submit" :disabled="loading">
              <span v-if="loading" class="lp-spinner" />
              <span v-else>{{ t('appLanding.earlyBird.cta') }}</span>
            </button>
          </form>
          <p v-if="error" class="lp-form-error">{{ error }}</p>
          <div class="lp-form-meta">
            <MaterialIcon icon="lock" size="xs" />
            <span>{{ t('appLanding.earlyBird.noCreditCard') }}</span>
          </div>
        </div>

        <div v-else class="lp-cta-success">
          <div class="lp-success-icon">
            <MaterialIcon icon="check_circle" size="2xl" />
          </div>
          <h3>{{ t('appLanding.earlyBird.successTitle') }}</h3>
          <p>{{ t('appLanding.earlyBird.successMessage') }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.lp-final-cta {
  padding: var(--lp-section-gap) var(--space-xl);
  position: relative;
  overflow: hidden;
}

.lp-section-inner {
  max-width: 720px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
}

.lp-cta-content {
  padding: var(--space-5xl) var(--space-3xl);
  text-align: center;
}

.lp-cta-title {
  font-family: var(--font-heading);
  font-size: clamp(2rem, 4vw, 2.75rem);
  font-weight: var(--font-bold);
  color: var(--lp-text-primary);
  margin: 0 0 var(--space-lg);
  letter-spacing: -0.02em;
}

.lp-cta-sub {
  font-size: var(--text-lg);
  color: var(--lp-text-secondary);
  margin: 0 0 var(--space-3xl);
  line-height: 1.6;
}

.lp-form-row {
  display: flex;
  gap: var(--space-sm);
  max-width: 480px;
  margin: 0 auto;
}

.lp-form-input {
  flex: 1;
  padding: var(--space-md) var(--space-lg);
  border-radius: var(--radius-lg);
  border: 1px solid var(--lp-border-light);
  background: var(--lp-bg-primary);
  color: var(--lp-text-primary);
  font-family: var(--font-body);
  font-size: var(--text-base);
  outline: none;
  transition: border-color 0.25s ease;
}

.lp-form-input::placeholder {
  color: var(--lp-text-muted);
}

.lp-form-input:focus {
  border-color: var(--lp-accent-orange);
}

.lp-form-submit {
  background: var(--lp-accent-orange);
  color: #fff;
  border: none;
  padding: var(--space-md) var(--space-2xl);
  border-radius: var(--radius-lg);
  font-family: var(--font-body);
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.25s ease, box-shadow 0.25s ease;
}

.lp-form-submit:hover {
  background: var(--lp-accent-orange-hover);
  box-shadow: 0 0 20px var(--lp-accent-orange-glow);
}

.lp-form-submit:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.lp-spinner {
  display: inline-block;
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.lp-form-error {
  color: #ef4444;
  font-size: var(--text-sm);
  margin: var(--space-md) 0 0;
}

.lp-form-meta {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-xs);
  margin-top: var(--space-lg);
  font-size: var(--text-xs);
  color: var(--lp-text-muted);
}

/* Success */
.lp-cta-success {
  text-align: center;
}

.lp-success-icon {
  color: #22c55e;
  margin-bottom: var(--space-lg);
}

.lp-cta-success h3 {
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
  color: var(--lp-text-primary);
  margin: 0 0 var(--space-sm);
}

.lp-cta-success p {
  color: var(--lp-text-secondary);
  margin: 0;
}

@media (max-width: 480px) {
  .lp-form-row {
    flex-direction: column;
  }

  .lp-cta-content {
    padding: var(--space-3xl) var(--space-xl);
  }
}
</style>
