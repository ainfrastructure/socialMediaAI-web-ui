<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import BaseCard from '../components/BaseCard.vue'
import BaseButton from '../components/BaseButton.vue'

const router = useRouter()
const { t } = useI18n()

function goBack() {
  router.back()
}
</script>

<template>
  <div class="privacy-view">
    <div class="header">
      <h1 class="brand-title">SocialChef</h1>
      <BaseButton variant="ghost" size="small" @click="goBack">
        {{ t('common.back') }}
      </BaseButton>
    </div>

    <BaseCard variant="glass" class="privacy-card">
      <h2 class="page-title">{{ t('privacy.title') }}</h2>
      <p class="last-updated">{{ t('privacy.lastUpdated') }}</p>

      <div class="content">
        <section class="section">
          <h3>{{ t('privacy.sections.introduction.title') }}</h3>
          <p>{{ t('privacy.sections.introduction.content') }}</p>
        </section>

        <section class="section">
          <h3>{{ t('privacy.sections.informationWeCollect.title') }}</h3>
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
          <h3>{{ t('privacy.sections.howWeUse.title') }}</h3>
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
          <h3>{{ t('privacy.sections.dataSharing.title') }}</h3>
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
          <h3>{{ t('privacy.sections.dataSecurity.title') }}</h3>
          <p>{{ t('privacy.sections.dataSecurity.content') }}</p>
        </section>

        <section class="section">
          <h3>{{ t('privacy.sections.dataRetention.title') }}</h3>
          <p>{{ t('privacy.sections.dataRetention.content') }}</p>
        </section>

        <section class="section">
          <h3>{{ t('privacy.sections.yourRights.title') }}</h3>
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
          <h3>{{ t('privacy.sections.cookies.title') }}</h3>
          <p>{{ t('privacy.sections.cookies.content') }}</p>
        </section>

        <section class="section">
          <h3>{{ t('privacy.sections.thirdParty.title') }}</h3>
          <p>{{ t('privacy.sections.thirdParty.content') }}</p>
        </section>

        <section class="section">
          <h3>{{ t('privacy.sections.children.title') }}</h3>
          <p>{{ t('privacy.sections.children.content') }}</p>
        </section>

        <section class="section">
          <h3>{{ t('privacy.sections.changes.title') }}</h3>
          <p>{{ t('privacy.sections.changes.content') }}</p>
        </section>

        <section class="section">
          <h3>{{ t('privacy.sections.contact.title') }}</h3>
          <p>{{ t('privacy.sections.contact.content') }}</p>
          <p class="contact-email">
            <a href="mailto:hello@socialchef.ai">hello@socialchef.ai</a>
          </p>
        </section>
      </div>
    </BaseCard>
  </div>
</template>

<style scoped>
.privacy-view {
  min-height: 100vh;
  padding: var(--space-2xl);
}

.header {
  max-width: var(--max-width-lg);
  margin: 0 auto var(--space-2xl);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.brand-title {
  font-family: var(--font-heading);
  font-size: var(--text-3xl);
  background: var(--gradient-gold);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.privacy-card {
  max-width: var(--max-width-lg);
  margin: 0 auto;
  animation: fadeInUp 0.6s var(--ease-smooth);
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.page-title {
  font-family: var(--font-heading);
  font-size: var(--text-3xl);
  color: var(--text-primary);
  margin-bottom: var(--space-sm);
  text-align: center;
}

.last-updated {
  font-size: var(--text-sm);
  color: var(--text-muted);
  text-align: center;
  margin-bottom: var(--space-3xl);
}

.content {
  display: flex;
  flex-direction: column;
  gap: var(--space-2xl);
}

.section h3 {
  font-family: var(--font-heading);
  font-size: var(--text-xl);
  color: var(--text-primary);
  margin-bottom: var(--space-md);
}

.section p {
  color: var(--text-secondary);
  line-height: var(--leading-relaxed);
  margin-bottom: var(--space-md);
}

.section p:last-child {
  margin-bottom: 0;
}

.section ul {
  color: var(--text-secondary);
  line-height: var(--leading-relaxed);
  margin-left: var(--space-xl);
  margin-bottom: var(--space-md);
}

.section ul:last-child {
  margin-bottom: 0;
}

.section li {
  margin-bottom: var(--space-sm);
}

.contact-email a {
  color: var(--gold-primary);
  text-decoration: none;
  transition: var(--transition-fast);
}

.contact-email a:hover {
  color: var(--gold-light);
  text-decoration: underline;
}

@media (max-width: 768px) {
  .privacy-view {
    padding: var(--space-lg);
  }

  .header {
    flex-direction: column;
    gap: var(--space-md);
    text-align: center;
  }

  .page-title {
    font-size: var(--text-2xl);
  }

  .section h3 {
    font-size: var(--text-lg);
  }
}
</style>
