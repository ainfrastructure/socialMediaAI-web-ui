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
  <div class="privacy-view" :class="{ 'is-mounted': mounted }">
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

    <div class="privacy-card">
      <h2 class="page-title">{{ t('privacy.title') }}</h2>
      <p class="last-updated">{{ t('privacy.lastUpdated') }}</p>

      <div class="content">
        <section class="section">
          <h3><span class="section-num">1.</span> {{ t('privacy.sections.introduction.title') }}</h3>
          <p>{{ t('privacy.sections.introduction.content') }}</p>
        </section>

        <section class="section">
          <h3><span class="section-num">2.</span> {{ t('privacy.sections.informationWeCollect.title') }}</h3>
          <p>{{ t('privacy.sections.informationWeCollect.intro') }}</p>
          <ul>
            <li>{{ t('privacy.sections.informationWeCollect.items.accountInfo') }}</li>
            <li>{{ t('privacy.sections.informationWeCollect.items.socialMedia') }}</li>
            <li>{{ t('privacy.sections.informationWeCollect.items.content') }}</li>
            <li>{{ t('privacy.sections.informationWeCollect.items.usage') }}</li>
            <li>{{ t('privacy.sections.informationWeCollect.items.device') }}</li>
          </ul>
        </section>

        <section class="section">
          <h3><span class="section-num">3.</span> {{ t('privacy.sections.howWeUse.title') }}</h3>
          <p>{{ t('privacy.sections.howWeUse.intro') }}</p>
          <ul>
            <li>{{ t('privacy.sections.howWeUse.items.provideService') }}</li>
            <li>{{ t('privacy.sections.howWeUse.items.improveService') }}</li>
            <li>{{ t('privacy.sections.howWeUse.items.communicate') }}</li>
            <li>{{ t('privacy.sections.howWeUse.items.security') }}</li>
            <li>{{ t('privacy.sections.howWeUse.items.legal') }}</li>
          </ul>
        </section>

        <section class="section">
          <h3><span class="section-num">4.</span> {{ t('privacy.sections.dataSharing.title') }}</h3>
          <p>{{ t('privacy.sections.dataSharing.intro') }}</p>
          <ul>
            <li>{{ t('privacy.sections.dataSharing.items.socialPlatforms') }}</li>
            <li>{{ t('privacy.sections.dataSharing.items.serviceProviders') }}</li>
            <li>{{ t('privacy.sections.dataSharing.items.legal') }}</li>
            <li>{{ t('privacy.sections.dataSharing.items.businessTransfer') }}</li>
          </ul>
          <p>{{ t('privacy.sections.dataSharing.noSelling') }}</p>
        </section>

        <section class="section">
          <h3><span class="section-num">5.</span> {{ t('privacy.sections.dataSecurity.title') }}</h3>
          <p>{{ t('privacy.sections.dataSecurity.content') }}</p>
        </section>

        <section class="section">
          <h3><span class="section-num">6.</span> {{ t('privacy.sections.dataRetention.title') }}</h3>
          <p>{{ t('privacy.sections.dataRetention.content') }}</p>
        </section>

        <section class="section">
          <h3><span class="section-num">7.</span> {{ t('privacy.sections.yourRights.title') }}</h3>
          <p>{{ t('privacy.sections.yourRights.intro') }}</p>
          <ul>
            <li>{{ t('privacy.sections.yourRights.items.access') }}</li>
            <li>{{ t('privacy.sections.yourRights.items.correction') }}</li>
            <li>{{ t('privacy.sections.yourRights.items.deletion') }}</li>
            <li>{{ t('privacy.sections.yourRights.items.portability') }}</li>
            <li>{{ t('privacy.sections.yourRights.items.withdraw') }}</li>
          </ul>
          <p>{{ t('privacy.sections.yourRights.contact') }}</p>
        </section>

        <section class="section">
          <h3><span class="section-num">8.</span> {{ t('privacy.sections.cookies.title') }}</h3>
          <p>{{ t('privacy.sections.cookies.content') }}</p>
        </section>

        <section class="section">
          <h3><span class="section-num">9.</span> {{ t('privacy.sections.thirdParty.title') }}</h3>
          <p>{{ t('privacy.sections.thirdParty.content') }}</p>
        </section>

        <section class="section">
          <h3><span class="section-num">10.</span> {{ t('privacy.sections.children.title') }}</h3>
          <p>{{ t('privacy.sections.children.content') }}</p>
        </section>

        <section class="section">
          <h3><span class="section-num">11.</span> {{ t('privacy.sections.changes.title') }}</h3>
          <p>{{ t('privacy.sections.changes.content') }}</p>
        </section>

        <section class="section">
          <h3><span class="section-num">12.</span> {{ t('privacy.sections.contact.title') }}</h3>
          <p>{{ t('privacy.sections.contact.content') }}</p>
          <p class="contact-email">
            <a href="mailto:hello@socialchef.ai">hello@socialchef.ai</a>
          </p>
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped>
.privacy-view {
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
.privacy-card {
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
  .privacy-view {
    padding: var(--space-lg);
  }

  .header {
    flex-direction: column;
    gap: var(--space-md);
    text-align: center;
  }

  .privacy-card {
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
