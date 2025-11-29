<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'

export interface CustomizationOptions {
  logoPosition: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center' | 'none'
  textOverlay?: {
    text: string
    font: string
    size: number
    color: string
  }
  strictnessMode: 'strict' | 'flexible' | 'creative'
  holidayTheme: string
  customHolidayText: string
  comboTextPlacement?: 'top' | 'bottom' | 'side' | 'none'
  comboItemArrangement?: 'sideBySide' | 'stacked' | 'overlapping' | 'diagonal'
}

type PostType = 'single' | 'combo' | 'weekly'

const props = withDefaults(defineProps<{
  modelValue: CustomizationOptions
  postType?: PostType
}>(), {
  postType: 'single'
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: CustomizationOptions): void
}>()

const { t } = useI18n()

// Local state (synced with modelValue)
const localCustomization = ref<CustomizationOptions>({ ...props.modelValue })

// Watch for external changes
watch(() => props.modelValue, (newValue) => {
  localCustomization.value = { ...newValue }
}, { deep: true })

// Watch for local changes and emit
watch(localCustomization, (newValue) => {
  emit('update:modelValue', { ...newValue })
}, { deep: true })

// Logo Position Options
const logoPositions = computed(() => [
  { value: 'top-left', label: t('advancedMode.logoPositions.topLeft'), icon: '↖️' },
  { value: 'top-right', label: t('advancedMode.logoPositions.topRight'), icon: '↗️' },
  { value: 'bottom-left', label: t('advancedMode.logoPositions.bottomLeft'), icon: '↙️' },
  { value: 'bottom-right', label: t('advancedMode.logoPositions.bottomRight'), icon: '↘️' },
  { value: 'center', label: t('advancedMode.logoPositions.center'), icon: '⊙' },
  { value: 'none', label: t('advancedMode.logoPositions.none'), icon: '⊘' },
])

// Font Options
const fonts = computed(() => [
  { value: 'playfair', label: t('advancedMode.fonts.playfair') },
  { value: 'inter', label: t('advancedMode.fonts.inter') },
  { value: 'montserrat', label: t('advancedMode.fonts.montserrat') },
  { value: 'lora', label: t('advancedMode.fonts.lora') },
  { value: 'roboto', label: t('advancedMode.fonts.roboto') },
])

// Strictness Mode Options
const strictnessModes = computed(() => [
  {
    value: 'strict',
    label: t('advancedMode.strictness.strict'),
    description: t('advancedMode.strictness.strictDesc'),
    icon: '🎯'
  },
  {
    value: 'flexible',
    label: t('advancedMode.strictness.flexible'),
    description: t('advancedMode.strictness.flexibleDesc'),
    icon: '✨'
  },
  {
    value: 'creative',
    label: t('advancedMode.strictness.creative'),
    description: t('advancedMode.strictness.creativeDesc'),
    icon: '🎨'
  },
])

// Holiday Theme Options
const holidayThemes = computed(() => [
  { value: 'none', label: t('weeklyCustomization.themes.none'), icon: '⊘' },
  { value: 'studentWeek', label: t('weeklyCustomization.themes.studentWeek'), icon: '🎓' },
  { value: 'christmas', label: t('weeklyCustomization.themes.christmas'), icon: '🎄' },
  { value: 'easter', label: t('weeklyCustomization.themes.easter'), icon: '🐰' },
  { value: 'summer', label: t('weeklyCustomization.themes.summer'), icon: '☀️' },
  { value: 'valentines', label: t('weeklyCustomization.themes.valentines'), icon: '❤️' },
  { value: 'halloween', label: t('weeklyCustomization.themes.halloween'), icon: '🎃' },
  { value: 'thanksgiving', label: t('weeklyCustomization.themes.thanksgiving'), icon: '🦃' },
  { value: 'newYear', label: t('weeklyCustomization.themes.newYear'), icon: '🎆' },
  { value: 'custom', label: t('weeklyCustomization.themes.custom'), icon: '✏️' }
])

// Combo Text Placement Options
const comboTextPlacements = computed(() => [
  { value: 'top', label: t('advancedMode.comboOptions.top'), icon: '⬆️' },
  { value: 'bottom', label: t('advancedMode.comboOptions.bottom'), icon: '⬇️' },
  { value: 'side', label: t('advancedMode.comboOptions.side'), icon: '➡️' },
  { value: 'none', label: t('advancedMode.comboOptions.noText'), icon: '⊘' },
])

// Combo Item Arrangement Options
const comboArrangements = computed(() => [
  { value: 'sideBySide', label: t('advancedMode.comboOptions.sideBySide'), icon: '⬜⬜' },
  { value: 'stacked', label: t('advancedMode.comboOptions.stacked'), icon: '⬜\n⬜' },
  { value: 'overlapping', label: t('advancedMode.comboOptions.overlapping'), icon: '⬛⬜' },
  { value: 'diagonal', label: t('advancedMode.comboOptions.diagonal'), icon: '↗️' },
])

// Text overlay enabled state
const textOverlayEnabled = ref(!!localCustomization.value.textOverlay?.text)

// Initialize text overlay if enabled
if (!localCustomization.value.textOverlay) {
  localCustomization.value.textOverlay = {
    text: '',
    font: 'playfair',
    size: 24,
    color: '#FFFFFF'
  }
}

// Initialize new fields with defaults if not present
if (!localCustomization.value.strictnessMode) {
  localCustomization.value.strictnessMode = 'flexible'
}
if (!localCustomization.value.holidayTheme) {
  localCustomization.value.holidayTheme = 'none'
}
if (!localCustomization.value.customHolidayText) {
  localCustomization.value.customHolidayText = ''
}
if (props.postType === 'combo') {
  if (!localCustomization.value.comboTextPlacement) {
    localCustomization.value.comboTextPlacement = 'bottom'
  }
  if (!localCustomization.value.comboItemArrangement) {
    localCustomization.value.comboItemArrangement = 'sideBySide'
  }
}

// Toggle text overlay
function toggleTextOverlay() {
  textOverlayEnabled.value = !textOverlayEnabled.value
  if (!textOverlayEnabled.value) {
    localCustomization.value.textOverlay!.text = ''
  }
}
</script>

<template>
  <div class="customization-panel">
    <!-- Strictness Mode -->
    <div class="customization-section">
      <label class="section-label">
        {{ t('advancedMode.strictness.label') }}
        <span class="section-hint">{{ t('advancedMode.strictness.hint') }}</span>
      </label>
      <div class="option-grid strictness-grid">
        <button
          v-for="mode in strictnessModes"
          :key="mode.value"
          :class="['option-button strictness-button', { 'selected': localCustomization.strictnessMode === mode.value }]"
          @click="localCustomization.strictnessMode = mode.value as any"
        >
          <span class="option-icon">{{ mode.icon }}</span>
          <span class="option-label">{{ mode.label }}</span>
          <span class="option-description">{{ mode.description }}</span>
        </button>
      </div>
    </div>

    <!-- Restaurant Logo Position -->
    <div class="customization-section">
      <label class="section-label">
        {{ t('advancedMode.step2.logoPositionLabel') }}
        <span class="section-hint">{{ t('advancedMode.step2.logoPositionHint') }}</span>
      </label>
      <div class="option-grid logo-positions">
        <button
          v-for="position in logoPositions"
          :key="position.value"
          :class="['option-button', { 'selected': localCustomization.logoPosition === position.value }]"
          @click="localCustomization.logoPosition = position.value as any"
        >
          <span class="option-icon">{{ position.icon }}</span>
          <span class="option-label">{{ position.label }}</span>
        </button>
      </div>
    </div>

    <!-- Text Overlay -->
    <div class="customization-section">
      <label class="section-label">
        <input
          type="checkbox"
          v-model="textOverlayEnabled"
          @change="toggleTextOverlay"
          class="checkbox-toggle"
        />
        {{ t('advancedMode.step2.textOverlayLabel') }}
      </label>

      <div v-if="textOverlayEnabled" class="text-overlay-controls">
        <div class="form-group">
          <input
            v-model="localCustomization.textOverlay!.text"
            type="text"
            :placeholder="t('advancedMode.step2.textOverlayPlaceholder')"
            class="text-input"
            maxlength="50"
          />
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="input-label">{{ t('advancedMode.step2.fontLabel') }}</label>
            <select v-model="localCustomization.textOverlay!.font" class="select-input">
              <option v-for="font in fonts" :key="font.value" :value="font.value">
                {{ font.label }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label class="input-label">{{ t('advancedMode.step2.textSizeLabel') }}</label>
            <input
              v-model.number="localCustomization.textOverlay!.size"
              type="range"
              min="16"
              max="48"
              class="range-input"
            />
            <span class="range-value">{{ localCustomization.textOverlay!.size }}px</span>
          </div>

          <div class="form-group">
            <label class="input-label">{{ t('advancedMode.step2.textColorLabel') }}</label>
            <input
              v-model="localCustomization.textOverlay!.color"
              type="color"
              class="color-input"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Holiday Inspiration -->
    <div class="customization-section">
      <label class="section-label">
        {{ t('advancedMode.holidayInspiration.label') }}
        <span class="section-hint">{{ t('advancedMode.holidayInspiration.hint') }}</span>
      </label>
      <div class="option-grid holiday-themes">
        <button
          v-for="theme in holidayThemes"
          :key="theme.value"
          :class="['option-button holiday-button', { 'selected': localCustomization.holidayTheme === theme.value }]"
          @click="localCustomization.holidayTheme = theme.value"
        >
          <span class="option-icon">{{ theme.icon }}</span>
          <span class="option-label">{{ theme.label }}</span>
        </button>
      </div>

      <!-- Custom theme text input -->
      <div v-if="localCustomization.holidayTheme === 'custom'" class="custom-theme-input-wrapper">
        <input
          v-model="localCustomization.customHolidayText"
          type="text"
          :placeholder="t('weeklyCustomization.themes.customPlaceholder')"
          class="custom-theme-text-input"
          maxlength="50"
        />
      </div>
    </div>

    <!-- Combo-Specific Options -->
    <template v-if="postType === 'combo'">
      <!-- Text Placement -->
      <div class="customization-section">
        <label class="section-label">
          {{ t('advancedMode.comboOptions.textPlacement') }}
          <span class="section-hint">{{ t('advancedMode.comboOptions.textPlacementHint') }}</span>
        </label>
        <div class="option-grid combo-grid">
          <button
            v-for="placement in comboTextPlacements"
            :key="placement.value"
            :class="['option-button', { 'selected': localCustomization.comboTextPlacement === placement.value }]"
            @click="localCustomization.comboTextPlacement = placement.value as any"
          >
            <span class="option-icon">{{ placement.icon }}</span>
            <span class="option-label">{{ placement.label }}</span>
          </button>
        </div>
      </div>

      <!-- Item Arrangement -->
      <div class="customization-section">
        <label class="section-label">
          {{ t('advancedMode.comboOptions.itemArrangement') }}
          <span class="section-hint">{{ t('advancedMode.comboOptions.itemArrangementHint') }}</span>
        </label>
        <div class="option-grid combo-grid">
          <button
            v-for="arrangement in comboArrangements"
            :key="arrangement.value"
            :class="['option-button', { 'selected': localCustomization.comboItemArrangement === arrangement.value }]"
            @click="localCustomization.comboItemArrangement = arrangement.value as any"
          >
            <span class="option-icon arrangement-icon">{{ arrangement.icon }}</span>
            <span class="option-label">{{ arrangement.label }}</span>
          </button>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.customization-panel {
  display: flex;
  flex-direction: column;
  gap: var(--space-2xl);
}

/* Section */
.customization-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.section-label {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
}

.section-hint {
  font-size: var(--text-sm);
  font-weight: var(--font-normal);
  color: var(--text-muted);
}

.checkbox-toggle {
  margin-right: var(--space-sm);
  width: 18px;
  height: 18px;
  accent-color: var(--gold-primary);
  cursor: pointer;
}

/* Option Grid */
.option-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: var(--space-md);
}

.logo-positions {
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
}

.strictness-grid {
  grid-template-columns: repeat(3, 1fr);
}

.holiday-themes {
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
}

.combo-grid {
  grid-template-columns: repeat(4, 1fr);
}

.option-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  padding: var(--space-lg);
  background: var(--glass-bg);
  border: var(--border-width) solid var(--glass-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: var(--transition-base);
  backdrop-filter: blur(var(--blur-md));
  min-height: 80px;
}

.option-button:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  border-color: var(--gold-primary);
}

.option-button.selected {
  background: var(--gold-subtle);
  border-color: var(--gold-primary);
  box-shadow: var(--glow-gold-sm);
}

.option-icon {
  font-size: 24px;
}

.option-label {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  text-align: center;
  line-height: 1.3;
}

.option-button.selected .option-label {
  color: var(--gold-primary);
  font-weight: var(--font-semibold);
}

/* Strictness Button */
.strictness-button {
  min-height: 120px;
  padding: var(--space-xl);
}

.strictness-button .option-icon {
  font-size: 32px;
}

.option-description {
  font-size: var(--text-xs);
  color: var(--text-muted);
  text-align: center;
  line-height: 1.4;
  margin-top: var(--space-xs);
}

.strictness-button.selected .option-description {
  color: var(--text-secondary);
}

/* Holiday Button */
.holiday-button {
  min-height: 70px;
  padding: var(--space-md);
}

.holiday-button .option-icon {
  font-size: 20px;
}

.holiday-button .option-label {
  font-size: var(--text-xs);
}

/* Arrangement Icon */
.arrangement-icon {
  font-size: 18px;
  white-space: pre-line;
  line-height: 1;
}

/* Text Overlay Controls */
.text-overlay-controls {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
  padding: var(--space-lg);
  background: var(--glass-bg);
  border: var(--border-width) solid var(--glass-border);
  border-radius: var(--radius-md);
  backdrop-filter: blur(var(--blur-md));
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  flex: 1;
}

.form-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: var(--space-md);
}

.input-label {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-secondary);
}

.text-input,
.select-input {
  padding: var(--space-md);
  background: var(--bg-secondary);
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: var(--text-base);
  transition: var(--transition-base);
}

.text-input:focus,
.select-input:focus {
  outline: none;
  border-color: var(--gold-primary);
  box-shadow: 0 0 0 3px var(--gold-subtle);
}

.range-input {
  width: 100%;
  accent-color: var(--gold-primary);
}

.range-value {
  font-size: var(--text-sm);
  color: var(--text-muted);
  text-align: center;
}

.color-input {
  width: 60px;
  height: 40px;
  padding: 4px;
  background: var(--bg-secondary);
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--radius-md);
  cursor: pointer;
}

.color-input::-webkit-color-swatch-wrapper {
  padding: 0;
}

.color-input::-webkit-color-swatch {
  border: none;
  border-radius: var(--radius-sm);
}

/* Custom Theme Input */
.custom-theme-input-wrapper {
  margin-top: var(--space-md);
}

.custom-theme-text-input {
  width: 100%;
  padding: var(--space-md);
  background: var(--bg-secondary);
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: var(--text-base);
  transition: var(--transition-base);
}

.custom-theme-text-input:focus {
  outline: none;
  border-color: var(--gold-primary);
  box-shadow: 0 0 0 3px var(--gold-subtle);
}

.custom-theme-text-input::placeholder {
  color: var(--text-muted);
}

/* Responsive */
@media (max-width: 768px) {
  .option-grid {
    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  }

  .strictness-grid {
    grid-template-columns: 1fr;
  }

  .combo-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .holiday-themes {
    grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
  }
}
</style>
