<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { CSSProperties, Component } from 'vue'
import GoldenTargetIcon from './icons/GoldenTargetIcon.vue'
import GoldenSparkleIcon from './icons/GoldenSparkleIcon.vue'
import GoldenPaletteIcon from './icons/GoldenPaletteIcon.vue'

interface MenuItem {
  name: string
  price?: string
  imageUrl?: string
}

interface TextOverlay {
  text: string
  font: string
  size: number
  color: string
}

interface CustomizationOptions {
  logoPosition: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center' | 'none'
  textOverlay?: TextOverlay
  strictnessMode: 'strict' | 'flexible' | 'creative'
  holidayTheme: string
  customHolidayText: string
  comboTextPlacement?: 'top' | 'bottom' | 'side' | 'none'
  comboItemArrangement?: 'sideBySide' | 'stacked' | 'overlapping' | 'diagonal'
}

interface WeeklyCustomizationOptions {
  layout: 'verticalStack' | 'gridWithHeader' | 'calendarGrid' | 'filmstrip' | 'featuredGrid'
}

type PostType = 'single' | 'combo' | 'weekly'

const props = defineProps<{
  postType: PostType
  customization: CustomizationOptions
  weeklyCustomization?: WeeklyCustomizationOptions
  menuItems?: MenuItem[]
  weekLength?: 5 | 7
}>()

const { t } = useI18n()

// Get logo position style
const logoPositionStyle = computed(() => {
  const positions: Record<string, CSSProperties> = {
    'top-left': { top: '12px', left: '12px' },
    'top-right': { top: '12px', right: '12px' },
    'bottom-left': { bottom: '12px', left: '12px' },
    'bottom-right': { bottom: '12px', right: '12px' },
    center: { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' },
    none: { display: 'none' },
  }

  return positions[props.customization.logoPosition] || positions['top-left']
})

// Get strictness icon component
const strictnessIconComponent = computed(() => {
  const icons: Record<string, Component> = {
    strict: GoldenTargetIcon,
    flexible: GoldenSparkleIcon,
    creative: GoldenPaletteIcon,
  }
  return icons[props.customization.strictnessMode] || GoldenSparkleIcon
})

// Get strictness label
const strictnessLabel = computed(() => {
  return t(`advancedMode.strictness.${props.customization.strictnessMode}`)
})

// Get holiday theme icon
const holidayThemeIcon = computed(() => {
  const icons: Record<string, string> = {
    none: '',
    studentWeek: '🎓',
    christmas: '🎄',
    easter: '🐰',
    summer: '☀️',
    valentines: '❤️',
    halloween: '🎃',
    thanksgiving: '🦃',
    newYear: '🎆',
    custom: '✏️',
  }
  return icons[props.customization.holidayTheme] || ''
})

// Get combo arrangement class
const comboArrangementClass = computed(() => {
  if (props.postType !== 'combo') return ''
  return `arrangement-${props.customization.comboItemArrangement || 'sideBySide'}`
})

// Get weekly layout class
const weeklyLayoutClass = computed(() => {
  if (props.postType !== 'weekly') return ''
  return `layout-${props.weeklyCustomization?.layout || 'gridWithHeader'}`
})

// Get text overlay style
const textOverlayStyle = computed(() => {
  if (!props.customization.textOverlay?.text) return {}
  return {
    fontFamily: getFontFamily(props.customization.textOverlay.font),
    fontSize: `${Math.min(props.customization.textOverlay.size / 2, 18)}px`,
    color: props.customization.textOverlay.color,
  }
})

function getFontFamily(font: string): string {
  const fonts: Record<string, string> = {
    playfair: '"Playfair Display", serif',
    inter: '"Inter", sans-serif',
    montserrat: '"Montserrat", sans-serif',
    lora: '"Lora", serif',
    roboto: '"Roboto", sans-serif',
  }
  return fonts[font] || fonts['inter']
}

// Get display items (max 2 for preview)
const displayItems = computed(() => {
  return (props.menuItems || []).slice(0, props.postType === 'combo' ? 2 : 1)
})

// Days for weekly preview (dynamic based on weekLength)
const allWeekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const weekDays = computed(() => allWeekDays.slice(0, props.weekLength || 5))

// For featured grid: first day is featured, rest go in grid
const featuredDay = computed(() => weekDays.value[0])
const gridDays = computed(() => weekDays.value.slice(1))
</script>

<template>
  <div class="customization-preview">
    <div class="preview-header">
      <h4 class="preview-title">{{ t('advancedMode.preview.title') }}</h4>
      <div class="preview-badges">
        <span v-if="customization.strictnessMode" class="badge strictness-badge">
          <component :is="strictnessIconComponent" :size="16" class="strictness-icon" />
          {{ strictnessLabel }}
        </span>
        <span
          v-if="customization.holidayTheme && customization.holidayTheme !== 'none'"
          class="badge holiday-badge"
        >
          {{ holidayThemeIcon }}
        </span>
      </div>
    </div>

    <div class="preview-container">
      <!-- Single Post Preview -->
      <div v-if="postType === 'single'" class="preview-frame single-preview">
        <div class="food-placeholder">
          <img
            v-if="displayItems[0]?.imageUrl"
            :src="displayItems[0].imageUrl"
            :alt="displayItems[0]?.name || 'Food'"
            class="food-image"
          />
          <div v-else class="placeholder-icon">🍽️</div>
        </div>

        <!-- Logo Position Indicator -->
        <div
          v-if="customization.logoPosition !== 'none'"
          class="logo-indicator"
          :style="logoPositionStyle"
        >
          <span class="logo-icon">📍</span>
        </div>

        <!-- Text Overlay Preview -->
        <div
          v-if="customization.textOverlay?.text"
          class="text-overlay-preview"
          :style="textOverlayStyle"
        >
          {{ customization.textOverlay.text }}
        </div>

        <!-- Holiday Decoration -->
        <div
          v-if="customization.holidayTheme && customization.holidayTheme !== 'none'"
          class="holiday-decoration"
        >
          {{ holidayThemeIcon }}
        </div>
      </div>

      <!-- Combo Post Preview -->
      <div
        v-else-if="postType === 'combo'"
        :class="['preview-frame combo-preview', comboArrangementClass]"
      >
        <div class="combo-items">
          <div class="combo-item">
            <img
              v-if="displayItems[0]?.imageUrl"
              :src="displayItems[0].imageUrl"
              :alt="displayItems[0]?.name || 'Item 1'"
              class="combo-image"
            />
            <div v-else class="placeholder-icon small">🍔</div>
          </div>
          <div class="combo-item">
            <img
              v-if="displayItems[1]?.imageUrl"
              :src="displayItems[1].imageUrl"
              :alt="displayItems[1]?.name || 'Item 2'"
              class="combo-image"
            />
            <div v-else class="placeholder-icon small">🍟</div>
          </div>
        </div>

        <!-- Combo Text Placement Indicator -->
        <div
          v-if="customization.comboTextPlacement && customization.comboTextPlacement !== 'none'"
          :class="['combo-text-indicator', `text-${customization.comboTextPlacement}`]"
        >
          <span class="text-placeholder">COMBO</span>
        </div>

        <!-- Logo Position Indicator -->
        <div
          v-if="customization.logoPosition !== 'none'"
          class="logo-indicator"
          :style="logoPositionStyle"
        >
          <span class="logo-icon">📍</span>
        </div>

        <!-- Holiday Decoration -->
        <div
          v-if="customization.holidayTheme && customization.holidayTheme !== 'none'"
          class="holiday-decoration"
        >
          {{ holidayThemeIcon }}
        </div>
      </div>

      <!-- Weekly Menu Preview -->
      <div
        v-else-if="postType === 'weekly'"
        :class="['preview-frame weekly-preview', weeklyLayoutClass, `week-${weekLength || 5}`]"
      >
        <div class="weekly-header">
          <span class="weekly-title">Weekly Menu</span>
          <span
            v-if="customization.holidayTheme && customization.holidayTheme !== 'none'"
            class="holiday-icon"
          >
            {{ holidayThemeIcon }}
          </span>
        </div>

        <!-- Featured Grid Layout: 1 big + grid (2x2 for 5 days, 2x3 for 7 days) -->
        <template v-if="weeklyCustomization?.layout === 'featuredGrid'">
          <div :class="['featured-grid-layout', weekLength === 7 ? 'seven-days' : 'five-days']">
            <div class="featured-day">
              <span class="day-name">{{ featuredDay }}</span>
              <div class="dish-image-placeholder large"></div>
              <span class="dish-name">Featured Dish</span>
            </div>
            <div :class="['small-days-grid', weekLength === 7 ? 'grid-2x3' : 'grid-2x2']">
              <div v-for="day in gridDays" :key="day" class="small-day-slot">
                <span class="day-name">{{ day }}</span>
                <div class="dish-image-placeholder small"></div>
                <span class="dish-name">Dish</span>
              </div>
            </div>
          </div>
        </template>

        <!-- Other layouts (all use the nice card styling) -->
        <div v-else class="weekly-days">
          <div v-for="day in weekDays" :key="day" class="day-slot">
            <span class="day-name">{{ day }}</span>
            <div class="dish-image-placeholder"></div>
            <span class="dish-name">Dish Name</span>
          </div>
        </div>

        <!-- Logo Position Indicator -->
        <div
          v-if="customization.logoPosition !== 'none'"
          class="logo-indicator"
          :style="logoPositionStyle"
        >
          <span class="logo-icon">📍</span>
        </div>
      </div>
    </div>

    <p class="preview-hint">{{ t('advancedMode.preview.placeholder') }}</p>
  </div>
</template>

<style scoped>
.customization-preview {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.preview-title {
  font-family: var(--font-heading);
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
}

.preview-badges {
  display: flex;
  gap: var(--space-sm);
}

.badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-xs) var(--space-sm);
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  color: var(--text-secondary);
}

.strictness-badge {
  background: var(--gold-subtle);
  border-color: var(--gold-primary);
  color: var(--gold-primary);
}

.strictness-icon {
  display: inline-flex;
  align-items: center;
}

.preview-container {
  aspect-ratio: 1;
  background: var(--bg-tertiary);
  border: 2px solid var(--border-color);
  border-radius: var(--radius-lg);
  overflow: hidden;
  position: relative;
}

.preview-frame {
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Single Preview */
.single-preview .food-placeholder {
  width: 70%;
  height: 70%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.food-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.placeholder-icon {
  font-size: 64px;
  opacity: 0.5;
}

.placeholder-icon.small {
  font-size: 32px;
}

/* Logo Indicator */
.logo-indicator {
  position: absolute;
  width: 32px;
  height: 32px;
  background: var(--gold-subtle);
  border: 2px dashed var(--gold-primary);
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo-icon {
  font-size: 14px;
}

/* Text Overlay Preview */
.text-overlay-preview {
  position: absolute;
  bottom: 20%;
  left: 50%;
  transform: translateX(-50%);
  padding: var(--space-xs) var(--space-md);
  background: rgba(0, 0, 0, 0.6);
  border-radius: var(--radius-sm);
  text-align: center;
  max-width: 80%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Holiday Decoration */
.holiday-decoration {
  position: absolute;
  top: 12px;
  right: 48px;
  font-size: 24px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
}

/* Combo Preview */
.combo-preview .combo-items {
  display: flex;
  gap: var(--space-md);
  padding: var(--space-lg);
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
}

.combo-item {
  width: 40%;
  aspect-ratio: 1;
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.combo-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Combo Arrangement Variations */
.arrangement-sideBySide .combo-items {
  flex-direction: row;
}

.arrangement-stacked .combo-items {
  flex-direction: column;
}

.arrangement-stacked .combo-item {
  width: 60%;
  height: 35%;
}

.arrangement-overlapping .combo-items {
  position: relative;
}

.arrangement-overlapping .combo-item:first-child {
  position: absolute;
  left: 15%;
  z-index: 1;
}

.arrangement-overlapping .combo-item:last-child {
  position: absolute;
  right: 15%;
  z-index: 2;
}

.arrangement-diagonal .combo-items {
  position: relative;
}

.arrangement-diagonal .combo-item:first-child {
  position: absolute;
  top: 15%;
  left: 15%;
}

.arrangement-diagonal .combo-item:last-child {
  position: absolute;
  bottom: 15%;
  right: 15%;
}

/* Combo Text Indicator */
.combo-text-indicator {
  position: absolute;
  padding: var(--space-xs) var(--space-md);
  background: var(--gold-primary);
  color: var(--text-on-gold);
  font-size: var(--text-xs);
  font-weight: var(--font-bold);
  border-radius: var(--radius-sm);
}

.text-top {
  top: var(--space-md);
  left: 50%;
  transform: translateX(-50%);
}

.text-bottom {
  bottom: var(--space-md);
  left: 50%;
  transform: translateX(-50%);
}

.text-side {
  right: var(--space-md);
  top: 50%;
  transform: translateY(-50%);
  writing-mode: vertical-rl;
}

/* Weekly Preview */
.weekly-preview {
  flex-direction: column;
  padding: var(--space-md);
  gap: var(--space-sm);
}

.weekly-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  padding: var(--space-sm);
}

.weekly-title {
  font-family: var(--font-heading);
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
}

.holiday-icon {
  font-size: 16px;
}

.weekly-days {
  display: flex;
  gap: var(--space-xs);
  flex: 1;
  width: 100%;
}

.day-slot {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-sm);
  background: var(--bg-elevated);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  min-height: 80px;
}

.day-slot .day-name {
  font-weight: var(--font-semibold);
  color: var(--gold-primary);
  font-size: var(--text-xs);
  margin-bottom: var(--space-xs);
}

.day-slot .dish-image-placeholder {
  flex: 1;
  width: 100%;
  min-height: 30px;
  background: linear-gradient(135deg, var(--bg-tertiary) 0%, var(--bg-elevated) 100%);
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
}

.day-slot .dish-image-placeholder::before {
  content: '🍽️';
  font-size: 16px;
  opacity: 0.4;
}

.day-slot .dish-name {
  font-size: 8px;
  color: var(--text-secondary);
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

/* Weekly Layout Variations */
.layout-verticalStack .weekly-days {
  flex-direction: column;
  gap: var(--space-xs);
}

.layout-verticalStack .day-slot {
  flex-direction: row;
  align-items: center;
  min-height: auto;
  padding: var(--space-xs) var(--space-sm);
}

.layout-verticalStack .day-slot .day-name {
  min-width: 30px;
  margin-bottom: 0;
  margin-right: var(--space-sm);
}

.layout-verticalStack .day-slot .dish-image-placeholder {
  width: 30px;
  height: 30px;
  min-height: auto;
  flex: none;
}

.layout-verticalStack .day-slot .dish-name {
  flex: 1;
  text-align: left;
  margin-left: var(--space-sm);
}

.layout-gridWithHeader .weekly-days {
  flex-wrap: wrap;
  gap: var(--space-xs);
}

.layout-gridWithHeader .day-slot {
  width: calc(33.33% - var(--space-xs));
  flex: none;
  min-height: 70px;
}

/* Calendar Grid - adapts to week length */
.layout-calendarGrid.week-5 .weekly-days {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: var(--space-xs);
}

.layout-calendarGrid.week-7 .weekly-days {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-xs);
}

.layout-calendarGrid.week-7 .day-slot {
  min-height: 60px;
}

.layout-calendarGrid.week-7 .day-slot .dish-image-placeholder {
  min-height: 20px;
}

.layout-calendarGrid.week-7 .day-slot .day-name {
  font-size: 9px;
}

.layout-calendarGrid.week-7 .day-slot .dish-name {
  font-size: 7px;
}

.layout-filmstrip .weekly-days {
  flex-wrap: nowrap;
  overflow-x: hidden;
}

/* Featured Grid Layout: 1 big + 2x2 */
.featured-grid-layout {
  display: flex;
  gap: var(--space-sm);
  width: 100%;
  height: 100%;
  padding: var(--space-sm);
}

.featured-day {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--bg-elevated);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: var(--space-sm);
  min-width: 0;
}

.featured-day .day-name {
  font-weight: var(--font-semibold);
  color: var(--gold-primary);
  font-size: var(--text-xs);
  margin-bottom: var(--space-xs);
}

.featured-day .dish-image-placeholder.large {
  flex: 1;
  width: 100%;
  min-height: 60px;
  background: linear-gradient(135deg, var(--bg-tertiary) 0%, var(--bg-elevated) 100%);
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
}

.featured-day .dish-image-placeholder.large::before {
  content: '🍽️';
  font-size: 28px;
  opacity: 0.4;
}

.featured-day .dish-name {
  font-size: 9px;
  color: var(--text-secondary);
  margin-top: var(--space-xs);
  text-align: center;
}

.small-days-grid {
  display: grid;
  gap: var(--space-xs);
  flex: 1;
}

.small-days-grid.grid-2x2 {
  grid-template-columns: repeat(2, 1fr);
  grid-template-rows: repeat(2, 1fr);
}

.small-days-grid.grid-2x3 {
  grid-template-columns: repeat(2, 1fr);
  grid-template-rows: repeat(3, 1fr);
}

.small-day-slot {
  display: flex;
  flex-direction: column;
  background: var(--bg-elevated);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  padding: var(--space-xs);
}

.small-day-slot .day-name {
  font-weight: var(--font-semibold);
  color: var(--gold-primary);
  font-size: 8px;
  margin-bottom: 2px;
}

.small-day-slot .dish-image-placeholder.small {
  flex: 1;
  width: 100%;
  min-height: 20px;
  background: linear-gradient(135deg, var(--bg-tertiary) 0%, var(--bg-elevated) 100%);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.small-day-slot .dish-image-placeholder.small::before {
  content: '🍽️';
  font-size: 12px;
  opacity: 0.4;
}

.small-day-slot .dish-name {
  font-size: 7px;
  color: var(--text-secondary);
  margin-top: 2px;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.preview-hint {
  font-size: var(--text-xs);
  color: var(--text-muted);
  text-align: center;
}

/* Responsive */
@media (max-width: 768px) {
  .preview-container {
    max-height: 300px;
  }

  .placeholder-icon {
    font-size: 48px;
  }

  .placeholder-icon.small {
    font-size: 24px;
  }
}
</style>
