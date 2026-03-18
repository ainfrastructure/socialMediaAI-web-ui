<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import MaterialIcon from '@/components/MaterialIcon.vue'

const { t } = useI18n()

const tools = [
  { key: 'designCropBg', icon: 'crop' },
  { key: 'designRatio', icon: 'aspect_ratio' },
  { key: 'designText', icon: 'text_fields' },
  { key: 'designDraw', icon: 'draw' },
  { key: 'designCta', icon: 'smart_button' },
]

const colors = ['#FF6B35', '#8B5CF6', '#06B6D4', '#3B82F6', '#22C55E', '#EF4444']
</script>

<template>
  <div class="demo-studio" data-demo-studio>
    <!-- Header -->
    <div class="dst-header">
      <div class="dst-close" data-demo-studio-close>
        <MaterialIcon icon="close" size="xs" />
      </div>
      <span class="dst-title">{{ t('appLanding.cinematic.designTitle') }}</span>
      <div class="dst-download">
        <MaterialIcon icon="download" size="xs" />
      </div>
    </div>

    <!-- Image area -->
    <div class="dst-canvas" data-demo-studio-canvas>
      <img src="/example/vetted-wave-flow.png" alt="" class="dst-canvas-img" />
      <!-- Text overlay drawn on canvas -->
      <div class="dst-text-overlay" data-demo-studio-text-overlay>
        {{ t('appLanding.cinematic.designOverlayText') }}
      </div>
    </div>

    <!-- Toolbar -->
    <div class="dst-toolbar" data-demo-studio-toolbar>
      <div
        v-for="tool in tools"
        :key="tool.key"
        class="dst-tool"
        :data-tool="tool.key"
      >
        <MaterialIcon :icon="tool.icon" size="xs" />
        <span>{{ t(`appLanding.cinematic.${tool.key}`) }}</span>
      </div>
    </div>

    <!-- Color palette -->
    <div class="dst-colors" data-demo-studio-colors>
      <div
        v-for="color in colors"
        :key="color"
        class="dst-color"
        :style="{ background: color }"
      />
    </div>

    <!-- Bottom: AI prompt input -->
    <div class="dst-bottom">
      <div class="dst-input">
        <span class="dst-prompt-text" data-demo-studio-prompt>{{ t('appLanding.cinematic.designPrompt') }}</span>
      </div>
      <div class="dst-send" data-demo-studio-send>
        <MaterialIcon icon="send" size="xs" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.demo-studio {
  position: absolute;
  inset: 0;
  z-index: 30;
  background: var(--lp-bg-primary, #09090B);
  display: flex;
  flex-direction: column;
  transform: translateX(100%);
}

/* Header */
.dst-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-sm) var(--space-md);
  border-bottom: 1px solid var(--lp-border, rgba(255, 255, 255, 0.08));
  flex-shrink: 0;
}

.dst-close, .dst-download {
  width: 24px;
  height: 24px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--lp-text-secondary);
}

.dst-title {
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  color: var(--lp-text-primary);
}

/* Canvas */
.dst-canvas {
  flex: 1;
  margin: var(--space-sm);
  border-radius: var(--radius-md);
  overflow: hidden;
  position: relative;
}

.dst-canvas-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
  background: #0a0a0c;
}

.dst-text-overlay {
  position: absolute;
  bottom: 12px;
  left: 10px;
  right: 10px;
  font-size: 11px;
  font-weight: var(--font-bold);
  color: #fff;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.6);
  background: rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  padding: 6px 10px;
  border-radius: var(--radius-sm);
  line-height: 1.3;
  opacity: 0;
}

/* Toolbar */
.dst-toolbar {
  display: flex;
  gap: 2px;
  padding: 0 var(--space-sm);
  flex-shrink: 0;
}

.dst-tool {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: var(--space-xs) 0;
  border-radius: var(--radius-sm);
  font-size: 7px;
  color: var(--lp-text-secondary);
  opacity: 0;
}

.dst-tool .material-icon {
  font-size: 14px;
}

/* Colors */
.dst-colors {
  display: flex;
  gap: var(--space-xs);
  padding: var(--space-xs) var(--space-md);
  justify-content: center;
  flex-shrink: 0;
}

.dst-color {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.15);
  opacity: 0;
}

/* Bottom */
.dst-bottom {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-sm) var(--space-md);
  border-top: 1px solid var(--lp-border, rgba(255, 255, 255, 0.08));
  flex-shrink: 0;
}

.dst-input {
  flex: 1;
  background: var(--lp-bg-primary, rgba(0, 0, 0, 0.2));
  border: 1px solid var(--lp-border, rgba(255, 255, 255, 0.06));
  border-radius: var(--radius-md);
  padding: 5px var(--space-sm);
  min-height: 24px;
  display: flex;
  align-items: center;
}

.dst-prompt-text {
  font-size: 9px;
  color: var(--lp-text-primary);
  display: inline-block;
  overflow: hidden;
  white-space: nowrap;
  max-width: 0;
}

.dst-send {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--lp-accent-orange);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
</style>
