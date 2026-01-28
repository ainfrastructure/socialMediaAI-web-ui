<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import MaterialIcon from './MaterialIcon.vue'

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

// Logo Position Options
const logoPositions = computed(() => [
  { value: 'top-left', label: t('advancedMode.logoPositions.topLeft'), icon: 'north_west' },
  { value: 'top-right', label: t('advancedMode.logoPositions.topRight'), icon: 'north_east' },
  { value: 'bottom-left', label: t('advancedMode.logoPositions.bottomLeft'), icon: 'south_west' },
  { value: 'bottom-right', label: t('advancedMode.logoPositions.bottomRight'), icon: 'south_east' },
  { value: 'center', label: t('advancedMode.logoPositions.center'), icon: 'filter_center_focus' },
  { value: 'none', label: t('advancedMode.logoPositions.none'), icon: 'block' },
])

// Font Options (reserved for future text overlay feature)
const _fonts = computed(() => [
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
    icon: 'gps_fixed'
  },
  {
    value: 'flexible',
    label: t('advancedMode.strictness.flexible'),
    description: t('advancedMode.strictness.flexibleDesc'),
    icon: 'auto_awesome'
  },
  {
    value: 'creative',
    label: t('advancedMode.strictness.creative'),
    description: t('advancedMode.strictness.creativeDesc'),
    icon: 'palette'
  },
])

// Holiday Theme Options
const holidayThemes = computed(() => [
  { value: 'none', label: t('weeklyCustomization.themes.none'), icon: 'block' },
  { value: 'studentWeek', label: t('weeklyCustomization.themes.studentWeek'), icon: 'school' },
  { value: 'christmas', label: t('weeklyCustomization.themes.christmas'), icon: 'park' },
  { value: 'easter', label: t('weeklyCustomization.themes.easter'), icon: 'egg' },
  { value: 'summer', label: t('weeklyCustomization.themes.summer'), icon: 'wb_sunny' },
  { value: 'valentines', label: t('weeklyCustomization.themes.valentines'), icon: 'favorite' },
  { value: 'halloween', label: t('weeklyCustomization.themes.halloween'), icon: 'nightlight' },
  { value: 'thanksgiving', label: t('weeklyCustomization.themes.thanksgiving'), icon: 'dinner_dining' },
  { value: 'newYear', label: t('weeklyCustomization.themes.newYear'), icon: 'celebration' },
  { value: 'custom', label: t('weeklyCustomization.themes.custom'), icon: 'edit' }
])

// Combo Text Placement Options
const comboTextPlacements = computed(() => [
  { value: 'top', label: t('advancedMode.comboOptions.top'), icon: 'vertical_align_top' },
  { value: 'bottom', label: t('advancedMode.comboOptions.bottom'), icon: 'vertical_align_bottom' },
  { value: 'side', label: t('advancedMode.comboOptions.side'), icon: 'format_textdirection_l_to_r' },
  { value: 'none', label: t('advancedMode.comboOptions.noText'), icon: 'block' },
])

// Combo Item Arrangement Options
const comboArrangements = computed(() => [
  { value: 'sideBySide', label: t('advancedMode.comboOptions.sideBySide'), icon: 'view_column' },
  { value: 'stacked', label: t('advancedMode.comboOptions.stacked'), icon: 'view_agenda' },
  { value: 'overlapping', label: t('advancedMode.comboOptions.overlapping'), icon: 'layers' },
  { value: 'diagonal', label: t('advancedMode.comboOptions.diagonal'), icon: 'trending_up' },
])

// Selection handler methods
function selectLogoPosition(position: CustomizationOptions['logoPosition']) {
  emit('update:modelValue', { ...props.modelValue, logoPosition: position })
}

function selectStrictnessMode(mode: CustomizationOptions['strictnessMode']) {
  emit('update:modelValue', { ...props.modelValue, strictnessMode: mode })
}

function selectHolidayTheme(theme: string) {
  emit('update:modelValue', { ...props.modelValue, holidayTheme: theme })
}

function updateCustomHolidayText(text: string) {
  emit('update:modelValue', { ...props.modelValue, customHolidayText: text })
}

function updateComboTextPlacement(placement: CustomizationOptions['comboTextPlacement']) {
  emit('update:modelValue', { ...props.modelValue, comboTextPlacement: placement })
}

function updateComboItemArrangement(arrangement: CustomizationOptions['comboItemArrangement']) {
  emit('update:modelValue', { ...props.modelValue, comboItemArrangement: arrangement })
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
          :class="['option-button strictness-button', { 'selected': props.modelValue.strictnessMode === mode.value }]"
          @click="selectStrictnessMode(mode.value as CustomizationOptions['strictnessMode'])"
        >
          <span class="option-icon"><MaterialIcon :icon="mode.icon" size="md" :color="'var(--gold-primary)'" /></span>
          <span class="option-label">{{ mode.label }}</span>
          <span class="option-description">{{ mode.description }}</span>
        </button>
      </div>
    </div>

    <!-- Business Logo Position -->
    <div class="customization-section">
      <label class="section-label">
        {{ t('advancedMode.step2.logoPositionLabel') }}
        <span class="section-hint">{{ t('advancedMode.step2.logoPositionHint') }}</span>
      </label>
      <div class="option-grid logo-positions">
        <button
          v-for="position in logoPositions"
          :key="position.value"
          :class="['option-button', { 'selected': props.modelValue.logoPosition === position.value }]"
          @click="selectLogoPosition(position.value as CustomizationOptions['logoPosition'])"
        >
          <span class="option-icon"><MaterialIcon :icon="position.icon" size="md" :color="'var(--gold-primary)'" /></span>
          <span class="option-label">{{ position.label }}</span>
        </button>
      </div>
    </div>

    <!-- Holiday/Inspired Theme -->
    <div class="customization-section">
      <label class="section-label">
        {{ t('advancedMode.holidayTheme.label', 'Theme / Inspiration') }}
        <span class="section-hint">{{ t('advancedMode.holidayTheme.hint', 'Add a seasonal or themed style to your image') }}</span>
      </label>
      <div class="option-grid holiday-themes">
        <button
          v-for="theme in holidayThemes"
          :key="theme.value"
          :class="['option-button holiday-button', { 'selected': props.modelValue.holidayTheme === theme.value }]"
          @click="selectHolidayTheme(theme.value)"
        >
          <span class="option-icon"><MaterialIcon :icon="theme.icon" size="md" :color="'var(--gold-primary)'" /></span>
          <span class="option-label">{{ theme.label }}</span>
        </button>
      </div>
      <!-- Custom theme text input -->
      <div v-if="props.modelValue.holidayTheme === 'custom'" class="custom-theme-input-wrapper">
        <input
          type="text"
          class="custom-theme-text-input"
          :value="props.modelValue.customHolidayText"
          @input="updateCustomHolidayText(($event.target as HTMLInputElement).value)"
          :placeholder="t('advancedMode.holidayTheme.customPlaceholder', 'Enter your custom theme...')"
        />
      </div>
    </div>

    <!-- Text Overlay (for Single & Combo) -->
    <div v-if="postType === 'single' || postType === 'combo'" class="customization-section">
      <label class="section-label">
        {{ t('advancedMode.textOverlay.label', 'Text Overlay') }}
        <span class="section-hint">{{ t('advancedMode.textOverlay.hint', 'Add custom text to your image (optional)') }}</span>
      </label>
      <div class="text-overlay-input-wrapper">
        <input
          type="text"
          class="text-overlay-input"
          :value="props.modelValue.textOverlay?.text || ''"
          @input="emit('update:modelValue', { ...props.modelValue, textOverlay: { ...props.modelValue.textOverlay, text: ($event.target as HTMLInputElement).value, font: 'playfair', size: 24, color: '#FFFFFF' } })"
          :placeholder="t('advancedMode.textOverlay.placeholder', 'Enter text to overlay on image...')"
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
            :class="['option-button', { 'selected': props.modelValue.comboTextPlacement === placement.value }]"
            @click="updateComboTextPlacement(placement.value as CustomizationOptions['comboTextPlacement'])"
          >
            <span class="option-icon"><MaterialIcon :icon="placement.icon" size="md" :color="'var(--gold-primary)'" /></span>
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
            :class="['option-button', { 'selected': props.modelValue.comboItemArrangement === arrangement.value }]"
            @click="updateComboItemArrangement(arrangement.value as CustomizationOptions['comboItemArrangement'])"
          >
            <span class="option-icon"><MaterialIcon :icon="arrangement.icon" size="md" :color="'var(--gold-primary)'" /></span>
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
  color: var(--gold-primary);
  display: flex;
  align-items: center;
  justify-content: center;
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

/* Text Overlay Input */
.text-overlay-input-wrapper {
  margin-top: var(--space-sm);
}

.text-overlay-input {
  width: 100%;
  padding: var(--space-md);
  background: var(--bg-secondary);
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: var(--text-base);
  transition: var(--transition-base);
}

.text-overlay-input:focus {
  outline: none;
  border-color: var(--gold-primary);
  box-shadow: 0 0 0 3px var(--gold-subtle);
}

.text-overlay-input::placeholder {
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

@media (max-width: 480px) {
  .strictness-grid {
    gap: var(--space-sm);
  }

  .strictness-button {
    flex-direction: row;
    justify-content: flex-start;
    align-items: center;
    min-height: auto;
    padding: var(--space-md);
    gap: var(--space-md);
  }

  .strictness-button .option-icon {
    font-size: 24px;
    flex-shrink: 0;
  }

  .strictness-button .option-label {
    text-align: left;
  }

  .option-description {
    display: none;
  }

  .option-button {
    min-height: 60px;
    padding: var(--space-md);
  }

  .logo-positions {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 390px) {
  .strictness-button {
    padding: var(--space-sm) var(--space-md);
  }

  .strictness-button .option-icon {
    font-size: 20px;
  }

  .option-button {
    min-height: 50px;
    padding: var(--space-sm);
  }

  .option-icon {
    font-size: 18px;
  }

  .option-label {
    font-size: var(--text-xs);
  }

  .logo-positions {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
