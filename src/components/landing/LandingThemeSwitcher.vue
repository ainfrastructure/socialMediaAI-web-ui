<script setup lang="ts">
import { ref } from 'vue'
import { useLandingTheme, type BgMode } from '@/composables/useLandingTheme'
import MaterialIcon from '@/components/MaterialIcon.vue'

const { activeThemeId, isDarkMode, bgMode, bgIntensity, bgParticleCount, bgParticleColorMode, bgParticleStyle, fontThemeId, fontThemes, themes, setTheme, toggleMode, setBgMode, setBgIntensity, setBgParticleCount, setBgParticleColorMode, setBgParticleStyle, setFontTheme } = useLandingTheme()
const isOpen = ref(false)

const emit = defineEmits<{ (e: 'themeChanged'): void }>()

function selectTheme(id: string) {
  setTheme(id)
  emit('themeChanged')
}

function handleToggleMode() {
  toggleMode()
  emit('themeChanged')
}

function selectBg(mode: BgMode) {
  setBgMode(mode)
  emit('themeChanged')
}

const families = [
  { label: 'Default', ids: ['orange'] },
  { label: 'Gold', ids: ['gold', 'rose', 'honey'] },
  { label: 'YachtZoo', ids: ['bronze', 'ocean', 'teal'] },
  { label: 'Extra', ids: ['ember', 'violet'] },
]

const bgOptions: { mode: BgMode; label: string; icon: string }[] = [
  { mode: 'none', label: 'None', icon: 'block' },
  { mode: 'wave', label: '3D Wave', icon: 'waves' },
  { mode: 'particles', label: 'Particles', icon: 'grain' },
]
</script>

<template>
  <div class="lp-theme-switcher" :class="{ open: isOpen }">
    <button class="lp-theme-toggle" @click="isOpen = !isOpen" :aria-label="isOpen ? 'Close theme picker' : 'Open theme picker'">
      <MaterialIcon :icon="isOpen ? 'close' : 'palette'" size="sm" />
    </button>

    <div v-if="isOpen" class="lp-theme-panel">
      <div class="lp-theme-panel-header">
        <span class="lp-theme-panel-title">Theme</span>
        <button class="lp-mode-toggle" @click="handleToggleMode">
          <MaterialIcon :icon="isDarkMode ? 'dark_mode' : 'light_mode'" size="xs" />
          <span>{{ isDarkMode ? 'Dark' : 'Light' }}</span>
        </button>
      </div>

      <!-- Typography selector -->
      <div class="lp-theme-family">
        <span class="lp-family-label">Typography</span>
        <div class="lp-font-options">
          <button
            v-for="ft in fontThemes"
            :key="ft.id"
            class="lp-font-option"
            :class="{ active: fontThemeId === ft.id }"
            @click="setFontTheme(ft.id); emit('themeChanged')"
          >
            <span class="lp-font-preview" :style="{ fontFamily: ft.heading }">Aa</span>
            <span class="lp-font-name">{{ ft.name }}</span>
          </button>
        </div>
      </div>

      <!-- Background selector -->
      <div class="lp-theme-family">
        <span class="lp-family-label">Background</span>
        <div class="lp-bg-options">
          <button
            v-for="opt in bgOptions"
            :key="opt.mode"
            class="lp-bg-option"
            :class="{ active: bgMode === opt.mode }"
            @click="selectBg(opt.mode)"
          >
            <MaterialIcon :icon="opt.icon" size="xs" />
            <span>{{ opt.label }}</span>
          </button>
        </div>
      </div>

      <!-- Intensity slider (only when bg effect is active) -->
      <div v-if="bgMode !== 'none'" class="lp-theme-family">
        <span class="lp-family-label">Intensity</span>
        <div class="lp-intensity-row">
          <input
            type="range"
            class="lp-intensity-slider"
            min="0.1"
            max="5"
            step="0.05"
            :value="bgIntensity"
            @input="(e: Event) => { setBgIntensity(parseFloat((e.target as HTMLInputElement).value)); emit('themeChanged') }"
          />
          <span class="lp-intensity-value">{{ Math.round(bgIntensity * 100) }}%</span>
        </div>
      </div>

      <!-- Particle count slider (only for particles mode) -->
      <div v-if="bgMode === 'particles'" class="lp-theme-family">
        <span class="lp-family-label">Density</span>
        <div class="lp-intensity-row">
          <input
            type="range"
            class="lp-intensity-slider"
            min="0.5"
            max="5"
            step="0.25"
            :value="bgParticleCount"
            @input="(e: Event) => { setBgParticleCount(parseFloat((e.target as HTMLInputElement).value)); emit('themeChanged') }"
          />
          <span class="lp-intensity-value">{{ Math.round(bgParticleCount * 100) }}%</span>
        </div>
      </div>

      <!-- Particle style (only for particles) -->
      <div v-if="bgMode === 'particles'" class="lp-theme-family">
        <span class="lp-family-label">Style</span>
        <div class="lp-bg-options">
          <button
            class="lp-bg-option"
            :class="{ active: bgParticleStyle === 'flow' }"
            @click="setBgParticleStyle('flow'); emit('themeChanged')"
          >
            <MaterialIcon icon="air" size="xs" />
            <span>Flow</span>
          </button>
          <button
            class="lp-bg-option"
            :class="{ active: bgParticleStyle === 'swarm' }"
            @click="setBgParticleStyle('swarm'); emit('themeChanged')"
          >
            <MaterialIcon icon="scatter_plot" size="xs" />
            <span>Swarm</span>
          </button>
        </div>
      </div>

      <!-- Particle color mode (only for particles) -->
      <div v-if="bgMode === 'particles'" class="lp-theme-family">
        <span class="lp-family-label">Particle Colors</span>
        <div class="lp-bg-options">
          <button
            class="lp-bg-option"
            :class="{ active: bgParticleColorMode === 'default' }"
            @click="setBgParticleColorMode('default'); emit('themeChanged')"
          >
            <MaterialIcon icon="palette" size="xs" />
            <span>Default</span>
          </button>
          <button
            class="lp-bg-option"
            :class="{ active: bgParticleColorMode === 'adapt' }"
            @click="setBgParticleColorMode('adapt'); emit('themeChanged')"
          >
            <MaterialIcon icon="auto_fix_high" size="xs" />
            <span>Adapt</span>
          </button>
          <button
            class="lp-bg-option"
            :class="{ active: bgParticleColorMode === 'vortex' }"
            @click="setBgParticleColorMode('vortex'); emit('themeChanged')"
          >
            <MaterialIcon icon="cyclone" size="xs" />
            <span>Vortex</span>
          </button>
        </div>
      </div>

      <!-- Color swatches -->
      <div v-for="family in families" :key="family.label" class="lp-theme-family">
        <span class="lp-family-label">{{ family.label }}</span>
        <div class="lp-theme-swatches">
          <button
            v-for="id in family.ids"
            :key="id"
            class="lp-swatch"
            :class="{ active: activeThemeId === id }"
            :title="themes.find(t => t.id === id)?.name"
            @click="selectTheme(id)"
          >
            <span
              class="lp-swatch-color"
              :style="{ background: themes.find(t => t.id === id)?.accent }"
            />
            <span class="lp-swatch-name">{{ themes.find(t => t.id === id)?.name }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.lp-theme-switcher {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 9999;
}

.lp-theme-toggle {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: 1px solid var(--lp-border-light, rgba(255,255,255,0.1));
  background: var(--lp-bg-surface, #18181B);
  color: var(--lp-text-primary, #F4F4F5);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  transition: background 0.2s ease, transform 0.2s ease;
}

.lp-theme-toggle:hover {
  transform: scale(1.05);
  background: var(--lp-bg-elevated, #27272A);
}

.lp-theme-panel {
  position: absolute;
  bottom: 60px;
  right: 0;
  width: 280px;
  max-height: 85vh;
  overflow-y: auto;
  background: var(--lp-bg-surface, #18181B);
  border: 1px solid var(--lp-border-light, rgba(255,255,255,0.1));
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.4);
  animation: panel-in 0.2s ease-out;
}

@keyframes panel-in {
  from { opacity: 0; transform: translateY(8px) scale(0.95); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.lp-theme-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.lp-theme-panel-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--lp-text-primary, #F4F4F5);
}

.lp-mode-toggle {
  display: flex;
  align-items: center;
  gap: 4px;
  background: var(--lp-bg-elevated, #27272A);
  border: 1px solid var(--lp-border, rgba(255,255,255,0.06));
  color: var(--lp-text-secondary, #A1A1AA);
  font-size: 11px;
  font-weight: 500;
  padding: 4px 10px;
  border-radius: 20px;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease;
}

.lp-mode-toggle:hover {
  background: var(--lp-bg-card, #1C1C1F);
  color: var(--lp-text-primary, #F4F4F5);
}

.lp-theme-family {
  margin-bottom: 14px;
}

.lp-theme-family:last-child {
  margin-bottom: 0;
}

.lp-family-label {
  font-size: 10px;
  font-weight: 600;
  color: var(--lp-text-muted, #71717A);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 8px;
  display: block;
}

/* Font options */
.lp-font-options {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.lp-font-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  background: none;
  border: 2px solid transparent;
  border-radius: 10px;
  padding: 6px 8px;
  cursor: pointer;
  transition: border-color 0.2s ease, background 0.2s ease;
  min-width: 52px;
}

.lp-font-option:hover {
  background: var(--lp-bg-elevated, #27272A);
}

.lp-font-option.active {
  border-color: var(--lp-accent-orange, #F97316);
  background: var(--lp-bg-elevated, #27272A);
}

.lp-font-preview {
  font-size: 18px;
  font-weight: 600;
  color: var(--lp-text-primary, #F4F4F5);
  line-height: 1.2;
}

.lp-font-name {
  font-size: 8px;
  font-weight: 500;
  color: var(--lp-text-muted, #71717A);
  white-space: nowrap;
}

.lp-font-option.active .lp-font-name {
  color: var(--lp-text-primary, #F4F4F5);
}

/* Background options */
.lp-bg-options {
  display: flex;
  gap: 6px;
}

.lp-bg-option {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  background: var(--lp-bg-elevated, #27272A);
  border: 2px solid transparent;
  border-radius: 10px;
  padding: 8px 6px;
  cursor: pointer;
  font-size: 10px;
  font-weight: 500;
  color: var(--lp-text-secondary, #A1A1AA);
  transition: border-color 0.2s ease, background 0.2s ease, color 0.2s ease;
}

.lp-bg-option:hover {
  color: var(--lp-text-primary, #F4F4F5);
}

.lp-bg-option.active {
  border-color: var(--lp-accent-orange, #F97316);
  color: var(--lp-text-primary, #F4F4F5);
  background: var(--lp-bg-card, #1C1C1F);
}

/* Intensity slider */
.lp-intensity-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.lp-intensity-slider {
  flex: 1;
  -webkit-appearance: none;
  appearance: none;
  height: 4px;
  border-radius: 2px;
  background: var(--lp-bg-elevated, #27272A);
  outline: none;
  cursor: pointer;
}

.lp-intensity-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--lp-accent-orange, #F97316);
  border: 2px solid var(--lp-bg-surface, #18181B);
  cursor: pointer;
}

.lp-intensity-slider::-moz-range-thumb {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--lp-accent-orange, #F97316);
  border: 2px solid var(--lp-bg-surface, #18181B);
  cursor: pointer;
}

.lp-intensity-value {
  font-size: 10px;
  font-weight: 600;
  color: var(--lp-text-secondary, #A1A1AA);
  min-width: 32px;
  text-align: right;
}

/* Color swatches */
.lp-theme-swatches {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.lp-swatch {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  background: none;
  border: 2px solid transparent;
  border-radius: 10px;
  padding: 6px 8px;
  cursor: pointer;
  transition: border-color 0.2s ease, background 0.2s ease;
}

.lp-swatch:hover {
  background: var(--lp-bg-elevated, #27272A);
}

.lp-swatch.active {
  border-color: var(--lp-accent-orange, #F97316);
  background: var(--lp-bg-elevated, #27272A);
}

.lp-swatch-color {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.1);
  flex-shrink: 0;
}

.lp-swatch-name {
  font-size: 9px;
  font-weight: 500;
  color: var(--lp-text-muted, #71717A);
  white-space: nowrap;
}

.lp-swatch.active .lp-swatch-name {
  color: var(--lp-text-primary, #F4F4F5);
}
</style>
