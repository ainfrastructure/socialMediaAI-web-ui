<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'

type LogoVariant = 'full' | 'blackOutline' | 'goldOutline'

const props = defineProps<{
  imageUrl: string
  logoPosition: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center' | 'none'
}>()

const emit = defineEmits<{
  (e: 'selectLogo', variant: LogoVariant): void
}>()

const { t } = useI18n()

// State
const selectedLogo = ref<LogoVariant>('full')

// Logo paths (public folder)
const logoVariants = computed(() => ({
  full: '/socialchef_logo.svg',
  blackOutline: '/outline-logo-black.svg',
  goldOutline: '/outline-logo-gold.svg'
}))

// Logo variant labels
const logoLabels = computed(() => ({
  full: t('advancedMode.step4.fullLogo'),
  blackOutline: t('advancedMode.step4.blackOutline'),
  goldOutline: t('advancedMode.step4.goldOutline')
}))

// Select logo variant
function selectLogoVariant(variant: LogoVariant) {
  selectedLogo.value = variant
  emit('selectLogo', variant)
}

// Get logo position styles
const logoPositionStyles = computed(() => {
  const baseStyles: any = {
    position: 'absolute',
    width: '80px',
    height: 'auto',
    zIndex: 10,
    pointerEvents: 'none'
  }

  const positions: Record<string, any> = {
    'top-left': { top: '20px', left: '20px' },
    'top-right': { top: '20px', right: '20px' },
    'bottom-left': { bottom: '20px', left: '20px' },
    'bottom-right': { bottom: '20px', right: '20px' },
    'center': {
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)'
    },
    'none': { display: 'none' }
  }

  return {
    ...baseStyles,
    ...positions[props.logoPosition]
  }
})
</script>

<template>
  <div class="logo-toggle-preview">
    <!-- Preview Section -->
    <div class="preview-container">
      <div class="image-wrapper">
        <!-- Generated Image -->
        <img
          :src="imageUrl"
          alt="Generated post image"
          class="preview-image"
        />

        <!-- Logo Overlay -->
        <img
          v-if="logoPosition !== 'none'"
          :src="logoVariants[selectedLogo]"
          :alt="`Social Chef ${logoLabels[selectedLogo]}`"
          class="logo-overlay"
          :style="logoPositionStyles"
        />
      </div>
    </div>

    <!-- Logo Toggle Controls -->
    <div class="logo-controls">
      <div class="controls-header">
        <h4 class="controls-title">{{ t('advancedMode.step4.logoVariantLabel') }}</h4>
        <p class="controls-hint">{{ t('advancedMode.step4.logoVariantHint') }}</p>
      </div>

      <div class="logo-variants">
        <button
          v-for="(variant, key) in logoVariants"
          :key="key"
          :class="['logo-variant-button', { 'selected': selectedLogo === key }]"
          @click="selectLogoVariant(key as LogoVariant)"
        >
          <!-- Logo Preview -->
          <div class="variant-preview">
            <img :src="variant" :alt="logoLabels[key as LogoVariant]" class="variant-logo" />
          </div>

          <!-- Label -->
          <span class="variant-label">{{ logoLabels[key as LogoVariant] }}</span>

          <!-- Selected Indicator -->
          <div v-if="selectedLogo === key" class="selected-indicator">
            <span class="indicator-icon">✓</span>
          </div>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.logo-toggle-preview {
  display: flex;
  flex-direction: column;
  gap: var(--space-2xl);
}

/* Preview Container */
.preview-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: var(--space-xl);
  background: var(--glass-bg);
  border: var(--border-width) solid var(--glass-border);
  border-radius: var(--radius-lg);
  backdrop-filter: blur(var(--blur-md));
}

.image-wrapper {
  position: relative;
  max-width: 800px;
  width: 100%;
  border-radius: var(--radius-md);
  overflow: hidden;
  box-shadow: var(--shadow-xl);
}

.preview-image {
  width: 100%;
  height: auto;
  display: block;
}

.logo-overlay {
  transition: var(--transition-base);
  filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.3));
}

/* Logo Controls */
.logo-controls {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
  padding: var(--space-xl);
  background: var(--glass-bg);
  border: var(--border-width) solid var(--glass-border);
  border-radius: var(--radius-lg);
  backdrop-filter: blur(var(--blur-md));
}

.controls-header {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.controls-title {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
}

.controls-hint {
  font-size: var(--text-sm);
  color: var(--text-muted);
}

/* Logo Variants */
.logo-variants {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-md);
}

.logo-variant-button {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-lg);
  background: var(--bg-secondary);
  border: 2px solid var(--border-color);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: var(--transition-base);
}

.logo-variant-button:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  border-color: var(--gold-primary);
}

.logo-variant-button.selected {
  background: var(--gold-subtle);
  border-color: var(--gold-primary);
  box-shadow: var(--glow-gold-sm);
}

/* Variant Preview */
.variant-preview {
  width: 100%;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-sm);
  background: var(--bg-elevated);
  border-radius: var(--radius-sm);
}

.variant-logo {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

/* Variant Label */
.variant-label {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-secondary);
  text-align: center;
}

.logo-variant-button.selected .variant-label {
  color: var(--gold-primary);
  font-weight: var(--font-semibold);
}

/* Selected Indicator */
.selected-indicator {
  position: absolute;
  top: var(--space-sm);
  right: var(--space-sm);
  width: 28px;
  height: 28px;
  background: var(--gold-primary);
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-md);
}

.indicator-icon {
  color: var(--text-on-gold);
  font-size: var(--text-sm);
  font-weight: var(--font-bold);
}

/* Responsive */
@media (max-width: 768px) {
  .logo-variants {
    grid-template-columns: 1fr;
  }

  .logo-controls {
    padding: var(--space-lg);
  }

  .preview-container {
    padding: var(--space-lg);
  }

  .logo-overlay {
    width: 60px !important;
  }
}

@media (max-width: 480px) {
  .logo-overlay {
    width: 50px !important;
  }

  .variant-preview {
    height: 60px;
  }
}
</style>
