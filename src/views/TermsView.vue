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
  <div class="terms-view">
    <div class="header">
      <h1 class="brand-title">SocialChef</h1>
      <BaseButton variant="ghost" size="small" @click="goBack">
        {{ t('common.back') }}
      </BaseButton>
    </div>

    <BaseCard variant="glass" class="terms-card">
      <h2 class="page-title">{{ t('terms.title') }}</h2>
      <p class="last-updated">{{ t('terms.lastUpdated') }}</p>

      <div class="content">
        <section class="section">
          <h3>{{ t('terms.sections.acceptance.title') }}</h3>
          <p>{{ t('terms.sections.acceptance.content') }}</p>
        </section>

        <section class="section">
          <h3>{{ t('terms.sections.description.title') }}</h3>
          <p>{{ t('terms.sections.description.content') }}</p>
        </section>

        <section class="section">
          <h3>{{ t('terms.sections.eligibility.title') }}</h3>
          <p>{{ t('terms.sections.eligibility.content') }}</p>
        </section>

        <section class="section">
          <h3>{{ t('terms.sections.account.title') }}</h3>
          <p>{{ t('terms.sections.account.intro') }}</p>
          <ul>
            <li>{{ t('terms.sections.account.items.accurate') }}</li>
            <li>{{ t('terms.sections.account.items.security') }}</li>
            <li>{{ t('terms.sections.account.items.notify') }}</li>
            <li>{{ t('terms.sections.account.items.responsible') }}</li>
          </ul>
        </section>

        <section class="section">
          <h3>{{ t('terms.sections.acceptableUse.title') }}</h3>
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
          <h3>{{ t('terms.sections.content.title') }}</h3>
          <p>{{ t('terms.sections.content.ownership') }}</p>
          <p>{{ t('terms.sections.content.license') }}</p>
          <p>{{ t('terms.sections.content.responsibility') }}</p>
        </section>

        <section class="section">
          <h3>{{ t('terms.sections.socialMedia.title') }}</h3>
          <p>{{ t('terms.sections.socialMedia.content') }}</p>
        </section>

        <section class="section">
          <h3>{{ t('terms.sections.subscription.title') }}</h3>
          <p>{{ t('terms.sections.subscription.billing') }}</p>
          <p>{{ t('terms.sections.subscription.cancellation') }}</p>
          <p>{{ t('terms.sections.subscription.changes') }}</p>
        </section>

        <section class="section">
          <h3>{{ t('terms.sections.intellectual.title') }}</h3>
          <p>{{ t('terms.sections.intellectual.content') }}</p>
        </section>

        <section class="section">
          <h3>{{ t('terms.sections.disclaimer.title') }}</h3>
          <p>{{ t('terms.sections.disclaimer.content') }}</p>
        </section>

        <section class="section">
          <h3>{{ t('terms.sections.limitation.title') }}</h3>
          <p>{{ t('terms.sections.limitation.content') }}</p>
        </section>

        <section class="section">
          <h3>{{ t('terms.sections.indemnification.title') }}</h3>
          <p>{{ t('terms.sections.indemnification.content') }}</p>
        </section>

        <section class="section">
          <h3>{{ t('terms.sections.termination.title') }}</h3>
          <p>{{ t('terms.sections.termination.content') }}</p>
        </section>

        <section class="section">
          <h3>{{ t('terms.sections.changes.title') }}</h3>
          <p>{{ t('terms.sections.changes.content') }}</p>
        </section>

        <section class="section">
          <h3>{{ t('terms.sections.governing.title') }}</h3>
          <p>{{ t('terms.sections.governing.content') }}</p>
        </section>

        <section class="section">
          <h3>{{ t('terms.sections.contact.title') }}</h3>
          <p>{{ t('terms.sections.contact.content') }}</p>
          <p class="contact-email">
            <a href="mailto:hello@socialchef.ai">hello@socialchef.ai</a>
          </p>
        </section>
      </div>
    </BaseCard>
  </div>
</template>

<style scoped>
.terms-view {
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

.terms-card {
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
  .terms-view {
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
