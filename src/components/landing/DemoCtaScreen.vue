<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const emit = defineEmits<{ (e: 'cta-click'): void }>()

function scrollToSection(sectionId: string) {
  document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' })
}

function handleClick(ev: MouseEvent) {
  ev.stopPropagation()
  emit('cta-click')
  scrollToSection('lp-final-cta')
}
</script>

<template>
  <div class="demo-cta" data-demo-cta>
    <div class="dcta-glow" />
    <h3 class="dcta-headline" data-demo-cta-headline>
      {{ t('appLanding.cinematic.ctaPhoneHeadline') }}
    </h3>
    <p class="dcta-subtext" data-demo-cta-subtext>
      {{ t('appLanding.cinematic.ctaPhoneSubtext') }}
    </p>
    <button class="dcta-btn" data-demo-cta-btn @click="handleClick">
      {{ t('appLanding.cinematic.ctaPhoneButton') }}
    </button>
  </div>
</template>

<style scoped>
.demo-cta {
  position: absolute;
  inset: 0;
  z-index: 40;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-md);
  background: var(--lp-bg-primary, #09090B);
  opacity: 0;
  pointer-events: none;
  text-align: center;
  padding: var(--space-xl);
}

.dcta-glow {
  position: absolute;
  width: 200px;
  height: 200px;
  border-radius: 50%;
  background: var(--lp-accent-orange);
  filter: blur(80px);
  opacity: 0.12;
  top: 40%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
}

.dcta-headline {
  font-family: var(--font-heading);
  font-size: 16px;
  font-weight: var(--font-bold);
  color: var(--lp-text-primary);
  line-height: 1.2;
  margin: 0;
  opacity: 0;
  position: relative;
  z-index: 1;
}

.dcta-subtext {
  font-size: 10px;
  color: var(--lp-text-secondary);
  line-height: 1.5;
  margin: 0;
  opacity: 0;
  position: relative;
  z-index: 1;
}

.dcta-btn {
  margin-top: var(--space-sm);
  border: none;
  font-family: var(--font-body);
  font-size: 11px;
  font-weight: var(--font-bold);
  padding: var(--space-sm) var(--space-xl);
  border-radius: var(--radius-md);
  background: var(--lp-accent-orange);
  color: #fff;
  cursor: pointer;
  opacity: 0;
  position: relative;
  z-index: 1;
  transition: background 0.2s ease, transform 0.15s ease;
  pointer-events: auto;
}

.dcta-btn:active {
  transform: scale(0.95);
}
</style>
