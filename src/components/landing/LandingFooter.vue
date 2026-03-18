<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<template>
  <footer class="lp-footer">
    <div class="lp-footer-inner">
      <div class="lp-footer-logo">
        <img src="/mascot/socialchef_wave.png" alt="SocialChef" class="lp-footer-logo-img" />
        <span class="lp-footer-logo-text">SocialChef</span>
      </div>

      <div class="lp-footer-links">
        <router-link to="/privacy-policy">{{ t('appLanding.footer.privacy') }}</router-link>
        <router-link to="/terms">{{ t('appLanding.footer.terms') }}</router-link>
      </div>

      <p class="lp-footer-copy">
        {{ t('appLanding.footer.copyright', { year: new Date().getFullYear() }) }}
      </p>
    </div>
  </footer>
</template>

<style scoped>
.lp-footer {
  border-top: 1px solid var(--lp-border);
  padding: var(--space-3xl) var(--space-xl);
}

.lp-footer-inner {
  max-width: var(--lp-max-width);
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--space-lg);
}

.lp-footer-logo {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.lp-footer-logo-img {
  width: 28px;
  height: 28px;
  object-fit: contain;
}

.lp-footer-logo-text {
  font-family: var(--font-heading);
  font-weight: var(--font-bold);
  font-size: var(--text-base);
  color: var(--lp-text-primary);
}

.lp-footer-links {
  display: flex;
  gap: var(--space-xl);
}

.lp-footer-links a {
  font-size: var(--text-sm);
  color: var(--lp-text-muted);
  text-decoration: none;
  transition: color 0.25s ease;
}

.lp-footer-links a:hover {
  color: var(--lp-text-primary);
}

.lp-footer-copy {
  font-size: var(--text-xs);
  color: var(--lp-text-muted);
  margin: 0;
}

@media (max-width: 768px) {
  .lp-footer-inner {
    flex-direction: column;
    text-align: center;
  }
}
</style>
