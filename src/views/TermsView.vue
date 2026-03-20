<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import BaseButton from '../components/BaseButton.vue'
import SocialChefLogo from '../components/SocialChefLogo.vue'
import LandingBackground from '@/components/landing/LandingBackground.vue'

const router = useRouter()
const { t } = useI18n()

const OCEAN_ACCENT = '#3A9BC0'
const mounted = ref(false)
const PAGE_BG = '#081418'
let originalHtmlBg = ''
let originalBodyBg = ''

onMounted(() => {
  originalHtmlBg = document.documentElement.style.backgroundColor
  originalBodyBg = document.body.style.backgroundColor
  document.documentElement.style.backgroundColor = PAGE_BG
  document.body.style.backgroundColor = PAGE_BG
  requestAnimationFrame(() => { mounted.value = true })
})

onUnmounted(() => {
  document.documentElement.style.backgroundColor = originalHtmlBg
  document.body.style.backgroundColor = originalBodyBg
})

function goBack() {
  router.back()
}
</script>

<template>
  <div class="terms-view" :class="{ 'is-mounted': mounted }">
    <LandingBackground
      mode="particles"
      :accent-color="OCEAN_ACCENT"
      :intensity="1.2"
      :particle-density="1.5"
      particle-color-mode="vortex"
      particle-style="flow"
    />

    <div class="header">
      <router-link to="/" class="al-logo">
        <SocialChefLogo :mark-size="36" show-wordmark />
      </router-link>
      <BaseButton variant="ghost" size="small" class="back-btn" @click="goBack">
        {{ t('common.back') }}
      </BaseButton>
    </div>

    <div class="terms-card">
      <h2 class="page-title">{{ t('terms.title') }}</h2>
      <p class="last-updated">{{ t('terms.lastUpdated') }}</p>

      <div class="content">
        <section class="section">
          <h3><span class="section-num">1.</span> {{ t('terms.sections.acceptance.title') }}</h3>
          <p>{{ t('terms.sections.acceptance.content') }}</p>
        </section>

        <section class="section">
          <h3><span class="section-num">2.</span> {{ t('terms.sections.description.title') }}</h3>
          <p>{{ t('terms.sections.description.content') }}</p>
        </section>

        <section class="section">
          <h3><span class="section-num">3.</span> {{ t('terms.sections.eligibility.title') }}</h3>
          <p>{{ t('terms.sections.eligibility.content') }}</p>
        </section>

        <section class="section">
          <h3><span class="section-num">4.</span> {{ t('terms.sections.account.title') }}</h3>
          <p>{{ t('terms.sections.account.intro') }}</p>
          <ul>
            <li>{{ t('terms.sections.account.items.accurate') }}</li>
            <li>{{ t('terms.sections.account.items.security') }}</li>
            <li>{{ t('terms.sections.account.items.notify') }}</li>
            <li>{{ t('terms.sections.account.items.responsible') }}</li>
          </ul>
        </section>

        <section class="section">
          <h3><span class="section-num">5.</span> {{ t('terms.sections.acceptableUse.title') }}</h3>
          <p>{{ t('terms.sections.acceptableUse.intro') }}</p>
          <ul>
            <li>{{ t('terms.sections.acceptableUse.items.illegal') }}</li>
            <li>{{ t('terms.sections.acceptableUse.items.harmful') }}</li>
            <li>{{ t('terms.sections.acceptableUse.items.infringe') }}</li>
            <li>{{ t('terms.sections.acceptableUse.items.spam') }}</li>
            <li>{{ t('terms.sections.acceptableUse.items.interfere') }}</li>
            <li>{{ t('terms.sections.acceptableUse.items.impersonate') }}</li>
            <li>{{ t('terms.sections.acceptableUse.items.reverse') }}</li>
          </ul>
        </section>

        <section class="section">
          <h3><span class="section-num">6.</span> {{ t('terms.sections.content.title') }}</h3>
          <p>{{ t('terms.sections.content.ownership') }}</p>
          <p>{{ t('terms.sections.content.license') }}</p>
          <p>{{ t('terms.sections.content.responsibility') }}</p>
        </section>

        <section class="section">
          <h3><span class="section-num">7.</span> {{ t('terms.sections.socialMedia.title') }}</h3>
          <p>{{ t('terms.sections.socialMedia.content') }}</p>
        </section>

        <section class="section">
          <h3><span class="section-num">8.</span> {{ t('terms.sections.subscription.title') }}</h3>
          <p>{{ t('terms.sections.subscription.billing') }}</p>
          <p>{{ t('terms.sections.subscription.cancellation') }}</p>
          <p>{{ t('terms.sections.subscription.changes') }}</p>
        </section>

        <section class="section">
          <h3><span class="section-num">9.</span> {{ t('terms.sections.intellectual.title') }}</h3>
          <p>{{ t('terms.sections.intellectual.content') }}</p>
        </section>

        <section class="section">
          <h3><span class="section-num">10.</span> {{ t('terms.sections.disclaimer.title') }}</h3>
          <p>{{ t('terms.sections.disclaimer.content') }}</p>
        </section>

        <section class="section">
          <h3><span class="section-num">11.</span> {{ t('terms.sections.limitation.title') }}</h3>
          <p>{{ t('terms.sections.limitation.content') }}</p>
        </section>

        <section class="section">
          <h3><span class="section-num">12.</span> {{ t('terms.sections.indemnification.title') }}</h3>
          <p>{{ t('terms.sections.indemnification.content') }}</p>
        </section>

        <section class="section">
          <h3><span class="section-num">13.</span> {{ t('terms.sections.termination.title') }}</h3>
          <p>{{ t('terms.sections.termination.content') }}</p>
        </section>

        <section class="section">
          <h3><span class="section-num">14.</span> {{ t('terms.sections.changes.title') }}</h3>
          <p>{{ t('terms.sections.changes.content') }}</p>
        </section>

        <section class="section">
          <h3><span class="section-num">15.</span> {{ t('terms.sections.governing.title') }}</h3>
          <p>{{ t('terms.sections.governing.content') }}</p>
        </section>

        <section class="section">
          <h3><span class="section-num">16.</span> {{ t('terms.sections.contact.title') }}</h3>
          <p>{{ t('terms.sections.contact.content') }}</p>
          <p class="contact-email">
            <a href="mailto:hello@socialchef.ai">hello@socialchef.ai</a>
          </p>
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped>
.terms-view {
  min-height: 100vh;
  padding: var(--space-2xl);
  position: relative;
  overflow: hidden;
  background: #081418;
  color-scheme: dark;
}

/* ── Header ── */
.header {
  max-width: 800px;
  margin: 0 auto var(--space-2xl);
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  z-index: 2;
  opacity: 0;
  animation: slideDown 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.1s forwards;
}

.al-logo {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  text-decoration: none;
}

.back-btn {
  color: rgba(255, 255, 255, 0.6) !important;
}

.back-btn:hover {
  color: rgba(255, 255, 255, 0.9) !important;
}

/* ── Card ── */
.terms-card {
  max-width: 800px;
  margin: 0 auto;
  position: relative;
  z-index: 2;
  background: rgba(14, 34, 48, 0.7);
  border: 1px solid rgba(58, 155, 192, 0.12);
  border-radius: var(--radius-xl);
  padding: var(--space-3xl);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  box-shadow:
    0 4px 24px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 rgba(110, 192, 222, 0.06);
  opacity: 0;
  animation: cardReveal 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.25s forwards;
}

/* ── Animations ── */
@keyframes slideDown {
  from { opacity: 0; transform: translateY(-16px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes cardReveal {
  from {
    opacity: 0;
    transform: translateY(32px) scale(0.97);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* ── Title / subtitle ── */
.page-title {
  font-family: var(--font-heading);
  font-size: var(--text-3xl);
  color: #F4F4F5;
  margin-bottom: var(--space-sm);
  text-align: center;
}

.last-updated {
  font-size: var(--text-sm);
  color: #71717A;
  text-align: center;
  margin-bottom: var(--space-3xl);
}

/* ── Content ── */
.content {
  display: flex;
  flex-direction: column;
  gap: var(--space-2xl);
}

.section {
  padding-bottom: var(--space-2xl);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.section:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.section h3 {
  font-family: var(--font-heading);
  font-size: var(--text-xl);
  color: #F4F4F5;
  margin-bottom: var(--space-md);
  display: flex;
  align-items: baseline;
  gap: var(--space-sm);
}

.section-num {
  color: #6EC0DE;
  font-weight: 600;
  font-family: var(--font-body);
  font-size: var(--text-lg);
}

.section p {
  color: #A1A1AA;
  line-height: var(--leading-relaxed);
  margin-bottom: var(--space-md);
}

.section p:last-child {
  margin-bottom: 0;
}

.section ul {
  color: #A1A1AA;
  line-height: var(--leading-relaxed);
  margin-left: var(--space-xl);
  margin-bottom: var(--space-md);
  list-style: none;
}

.section ul:last-child {
  margin-bottom: 0;
}

.section li {
  margin-bottom: var(--space-sm);
  position: relative;
  padding-left: var(--space-md);
}

.section li::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0.6em;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #3A9BC0;
}

/* ── Contact email ── */
.contact-email a {
  color: #6EC0DE;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.3s ease, text-shadow 0.3s ease;
}

.contact-email a:hover {
  color: #3A9BC0;
  text-shadow: 0 0 12px rgba(58, 155, 192, 0.3);
}

/* ── Responsive ── */
@media (max-width: 768px) {
  .terms-view {
    padding: var(--space-lg);
  }

  .header {
    flex-direction: column;
    gap: var(--space-md);
    text-align: center;
  }

  .terms-card {
    padding: var(--space-2xl) var(--space-xl);
  }

  .page-title {
    font-size: var(--text-2xl);
  }

  .section h3 {
    font-size: var(--text-lg);
  }
}

/* ── Reduced motion ── */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
</style>
