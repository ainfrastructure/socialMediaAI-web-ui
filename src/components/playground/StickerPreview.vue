<template>
  <div class="banner-preview-container">
    <h5 class="preview-label">👁️ {{ $t('playground.livePreview', 'Live Preview') }}</h5>
    <div class="banner-preview-frame">
      <!-- Simulated Image Placeholder -->
      <div class="preview-image-placeholder">
        <div class="preview-food-icon">🍽️</div>
        <div class="preview-image-text">{{ $t('playground.yourGeneratedImage', 'Your Generated Image') }}</div>
      </div>

      <!-- Promotional Sticker Overlay -->
      <div
        v-if="promotionalText"
        :class="['preview-sticker', `style-${stickerStyle}`, `position-${stickerPosition}`]"
        :style="{
          backgroundColor: brandColor,
          borderColor: brandColor,
          transform: stickerStyle === 'ribbon' ? 'rotate(0deg)' : 'rotate(-5deg)'
        }"
      >
        <span class="sticker-text">{{ promotionalText.toUpperCase() }}</span>
      </div>

      <!-- Logo Watermark -->
      <div
        v-if="showLogo && logoUrl"
        :class="['preview-logo', `logo-${logoPosition}`]"
      >
        <img
          :src="logoUrl"
          :alt="logoAlt"
          class="preview-logo-img"
        />
      </div>
    </div>
    <p class="preview-description">
      {{ $t('playground.previewDescription', 'Preview how your sticker and logo will appear') }}
    </p>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  promotionalText: string
  stickerStyle: string
  stickerPosition: string
  brandColor: string
  showLogo: boolean
  logoUrl?: string
  logoAlt?: string
  logoPosition: string
}>()
</script>

<style scoped>
.banner-preview-container {
  margin-top: var(--space-xl);
  padding: var(--space-lg);
  background: rgba(0, 0, 0, 0.2);
  border-radius: var(--radius-lg);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.preview-label {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--text-secondary);
  margin: 0 0 var(--space-md) 0;
  text-align: center;
}

.banner-preview-frame {
  position: relative;
  width: 100%;
  max-width: 300px;
  aspect-ratio: 1 / 1;
  margin: 0 auto;
  border-radius: var(--radius-md);
  overflow: hidden;
}

.preview-image-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(
    135deg,
    rgba(212, 175, 55, 0.1) 0%,
    rgba(212, 175, 55, 0.05) 50%,
    rgba(212, 175, 55, 0.1) 100%
  );
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-md);
}

.preview-food-icon {
  font-size: 64px;
  opacity: 0.5;
}

.preview-image-text {
  font-size: var(--text-sm);
  color: var(--text-muted);
}

.preview-sticker {
  position: absolute;
  padding: var(--space-sm) var(--space-md);
  color: white;
  font-weight: var(--font-bold);
  font-size: var(--text-sm);
  white-space: nowrap;
  z-index: 10;
}

/* Sticker Styles */
.preview-sticker.style-bold {
  border-radius: var(--radius-sm);
}

.preview-sticker.style-outlined {
  background: transparent !important;
  border: 3px solid;
}

.preview-sticker.style-ribbon {
  padding: var(--space-xs) var(--space-lg);
  clip-path: polygon(0 0, 100% 0, 95% 50%, 100% 100%, 0 100%, 5% 50%);
  transform: rotate(0deg) !important;
}

.preview-sticker.style-badge {
  border-radius: var(--radius-full);
  padding: var(--space-md);
  min-width: 60px;
  text-align: center;
}

.preview-sticker.style-starburst {
  border-radius: 0;
  clip-path: polygon(
    50% 0%,
    61% 35%,
    98% 35%,
    68% 57%,
    79% 91%,
    50% 70%,
    21% 91%,
    32% 57%,
    2% 35%,
    39% 35%
  );
  padding: var(--space-lg);
  text-align: center;
}

/* Sticker Positions */
.preview-sticker.position-top-left {
  top: var(--space-md);
  left: var(--space-md);
}

.preview-sticker.position-top-center {
  top: var(--space-md);
  left: 50%;
  transform: translateX(-50%) rotate(-5deg);
}

.preview-sticker.position-top-right {
  top: var(--space-md);
  right: var(--space-md);
}

.preview-sticker.position-center {
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(-5deg);
}

.preview-sticker.position-bottom-left {
  bottom: var(--space-md);
  left: var(--space-md);
}

.preview-sticker.position-bottom-right {
  bottom: var(--space-md);
  right: var(--space-md);
}

.sticker-text {
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
}

/* Logo Watermark */
.preview-logo {
  position: absolute;
  width: 48px;
  height: 48px;
  z-index: 5;
  opacity: 0.9;
}

.preview-logo.logo-top-left {
  top: var(--space-sm);
  left: var(--space-sm);
}

.preview-logo.logo-top-right {
  top: var(--space-sm);
  right: var(--space-sm);
}

.preview-logo.logo-bottom-left {
  bottom: var(--space-sm);
  left: var(--space-sm);
}

.preview-logo.logo-bottom-right {
  bottom: var(--space-sm);
  right: var(--space-sm);
}

.preview-logo-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: var(--radius-sm);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.preview-description {
  text-align: center;
  font-size: var(--text-xs);
  color: var(--text-muted);
  margin: var(--space-md) 0 0;
}
</style>
