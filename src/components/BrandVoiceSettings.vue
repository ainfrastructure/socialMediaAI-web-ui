<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import BaseCard from './BaseCard.vue'
import BaseButton from './BaseButton.vue'
import BaseAlert from './BaseAlert.vue'
import MaterialIcon from './MaterialIcon.vue'
import type { ToneSettings, BrandVoiceConfig, PlatformOverride } from '@/types/brandVoice'

export type { ToneSettings, BrandVoiceConfig, PlatformOverride }

// ============================================================================
// Props & Emits
// ============================================================================

interface Props {
  brandId: string
  initialConfig?: BrandVoiceConfig | null
  saving?: boolean
  savedSuccess?: boolean
  savedError?: string | null
}

const props = withDefaults(defineProps<Props>(), {
  initialConfig: null,
  saving: false,
  savedSuccess: false,
  savedError: null,
})

const emit = defineEmits<{
  (e: 'save', config: BrandVoiceConfig): void
}>()

// ============================================================================
// Default Config
// ============================================================================

function getDefaultConfig(): BrandVoiceConfig {
  return {
    toneMatrix: {
      formality: 50,
      humor: 30,
      technicality: 40,
      enthusiasm: 60,
    },
    keywords: {
      include: [],
      exclude: [],
    },
    voiceSamples: ['', '', ''],
    platformOverrides: {
      instagram: { enabled: false, toneAdjustments: {} },
      facebook: { enabled: false, toneAdjustments: {} },
      twitter: { enabled: false, toneAdjustments: {} },
      linkedin: { enabled: false, toneAdjustments: {} },
      tiktok: { enabled: false, toneAdjustments: {} },
    },
  }
}

// ============================================================================
// State
// ============================================================================

const config = reactive<BrandVoiceConfig>(getDefaultConfig())
const includeKeywordInput = ref('')
const excludeKeywordInput = ref('')
const saveSuccess = ref(false)
const saveError = ref<string | null>(null)
const hasChanges = ref(false)

// ============================================================================
// Tone Slider Definitions
// ============================================================================

interface ToneSlider {
  key: keyof ToneSettings
  label: string
  icon: string
  lowLabel: string
  highLabel: string
  description: string
}

const toneSliders: ToneSlider[] = [
  {
    key: 'formality',
    label: 'Formality',
    icon: 'business_center',
    lowLabel: 'Casual',
    highLabel: 'Formal',
    description: 'How professional vs. relaxed your brand sounds',
  },
  {
    key: 'humor',
    label: 'Humor',
    icon: 'sentiment_very_satisfied',
    lowLabel: 'Serious',
    highLabel: 'Playful',
    description: 'The level of wit and playfulness in your content',
  },
  {
    key: 'technicality',
    label: 'Technicality',
    icon: 'science',
    lowLabel: 'Simple',
    highLabel: 'Technical',
    description: 'How specialized or jargon-rich your language is',
  },
  {
    key: 'enthusiasm',
    label: 'Enthusiasm',
    icon: 'local_fire_department',
    lowLabel: 'Calm',
    highLabel: 'Energetic',
    description: 'The energy and excitement level in your messaging',
  },
]

// ============================================================================
// Platform Definitions
// ============================================================================

interface PlatformDef {
  id: string
  name: string
  icon: string
  description: string
}

const platforms: PlatformDef[] = [
  { id: 'instagram', name: 'Instagram', icon: '📸', description: 'Visual storytelling & lifestyle content' },
  { id: 'facebook', name: 'Facebook', icon: '📘', description: 'Community engagement & longer-form posts' },
  { id: 'twitter', name: 'X / Twitter', icon: '𝕏', description: 'Quick, punchy, conversational' },
  { id: 'linkedin', name: 'LinkedIn', icon: '💼', description: 'Professional & thought leadership' },
  { id: 'tiktok', name: 'TikTok', icon: '🎵', description: 'Trendy, fun, younger audience' },
]

// ============================================================================
// Computed
// ============================================================================

const filledSamplesCount = computed(() =>
  config.voiceSamples.filter((s) => s.trim().length > 0).length
)

const activeOverridesCount = computed(() =>
  Object.values(config.platformOverrides).filter((o) => o.enabled).length
)

// ============================================================================
// Watchers — track changes
// ============================================================================

watch(
  () => config,
  () => {
    hasChanges.value = true
  },
  { deep: true },
)

// ============================================================================
// Lifecycle
// ============================================================================

onMounted(() => {
  if (props.initialConfig) {
    Object.assign(config, JSON.parse(JSON.stringify(props.initialConfig)))
  }
  // Reset change tracker after initial load
  hasChanges.value = false
})

watch(
  () => props.initialConfig,
  (newConfig) => {
    if (newConfig) {
      Object.assign(config, JSON.parse(JSON.stringify(newConfig)))
      hasChanges.value = false
    }
  },
)

// ============================================================================
// Keywords
// ============================================================================

function addKeyword(type: 'include' | 'exclude') {
  const inputRef = type === 'include' ? includeKeywordInput : excludeKeywordInput
  const raw = inputRef.value.trim()
  if (!raw) return

  // Split by comma for batch entry
  const keywords = raw
    .split(',')
    .map((k) => k.trim())
    .filter((k) => k.length > 0)

  for (const keyword of keywords) {
    if (keyword.length > 50) continue // skip overly long keywords
    if (config.keywords[type].includes(keyword)) continue // no duplicates
    config.keywords[type].push(keyword)
  }

  inputRef.value = ''
}

function removeKeyword(type: 'include' | 'exclude', index: number) {
  if (index >= 0 && index < config.keywords[type].length) {
    config.keywords[type].splice(index, 1)
  }
}

function handleKeywordKeydown(event: KeyboardEvent, type: 'include' | 'exclude') {
  if (event.key === 'Enter' || event.key === ',') {
    event.preventDefault()
    addKeyword(type)
  }
  // Backspace on empty input removes last tag
  if (event.key === 'Backspace') {
    const inputRef = type === 'include' ? includeKeywordInput : excludeKeywordInput
    if (inputRef.value === '' && config.keywords[type].length > 0) {
      config.keywords[type].pop()
    }
  }
}

// ============================================================================
// Platform Overrides
// ============================================================================

function togglePlatformOverride(platformId: string) {
  const override = config.platformOverrides[platformId]
  if (override) {
    override.enabled = !override.enabled
    if (!override.enabled) {
      override.toneAdjustments = {}
    }
  }
}

function getPlatformToneValue(platformId: string, toneKey: keyof ToneSettings): number {
  const override = config.platformOverrides[platformId]
  if (override?.toneAdjustments[toneKey] !== undefined) {
    return override.toneAdjustments[toneKey]!
  }
  return config.toneMatrix[toneKey]
}

function setPlatformToneValue(platformId: string, toneKey: keyof ToneSettings, value: number) {
  const override = config.platformOverrides[platformId]
  if (override) {
    override.toneAdjustments[toneKey] = value
  }
}

function resetPlatformOverride(platformId: string) {
  const override = config.platformOverrides[platformId]
  if (override) {
    override.toneAdjustments = {}
  }
}

// ============================================================================
// Save
// ============================================================================

function handleSave() {
  saveSuccess.value = false
  saveError.value = null

  // Clean up voice samples — trim whitespace
  config.voiceSamples = config.voiceSamples.map((s) => s.trim())

  emit('save', JSON.parse(JSON.stringify(config)) as BrandVoiceConfig)
}

// Watch parent's save state props for feedback
watch(
  () => props.savedSuccess,
  (success) => {
    if (success) {
      saveSuccess.value = true
      hasChanges.value = false
      setTimeout(() => {
        saveSuccess.value = false
      }, 3000)
    }
  },
)

watch(
  () => props.savedError,
  (error) => {
    if (error) {
      saveError.value = error
    }
  },
)

// ============================================================================
// Helpers
// ============================================================================

function getToneLabel(value: number, lowLabel: string, highLabel: string): string {
  if (value <= 20) return lowLabel
  if (value <= 40) return `Slightly ${lowLabel.toLowerCase()}`
  if (value <= 60) return 'Balanced'
  if (value <= 80) return `Slightly ${highLabel.toLowerCase()}`
  return highLabel
}

function getSliderGradient(value: number): string {
  const percentage = value
  return `linear-gradient(to right, var(--gold-primary) 0%, var(--gold-primary) ${percentage}%, var(--bg-tertiary) ${percentage}%, var(--bg-tertiary) 100%)`
}

function getSamplePlaceholder(index: number): string {
  const placeholders = [
    'Paste an example social media post that captures your brand\'s tone...',
    'Add another example — maybe a different style or platform...',
    'One more example to help the AI learn your voice...',
  ]
  return placeholders[index] || 'Add an example post...'
}
</script>

<template>
  <div class="brand-voice-settings">
    <!-- Header -->
    <div class="settings-header">
      <div class="header-content">
        <h2 class="settings-title">
          <MaterialIcon icon="record_voice_over" size="lg" color="var(--gold-primary)" />
          Brand Voice Configuration
        </h2>
        <p class="settings-subtitle">
          Define how your brand communicates across platforms. These settings guide AI content generation.
        </p>
      </div>
      <BaseButton
        variant="primary"
        size="small"
        :disabled="props.saving || !hasChanges"
        @click="handleSave"
      >
        <MaterialIcon icon="save" size="sm" color="var(--text-on-gold)" />
        {{ props.saving ? 'Saving...' : 'Save Changes' }}
      </BaseButton>
    </div>

    <!-- ===================== SECTION 1: Tone Matrix ===================== -->
    <BaseCard variant="glass" class="section-card">
      <div class="section-header">
        <div class="section-title-row">
          <MaterialIcon icon="tune" size="md" color="var(--gold-primary)" />
          <h3 class="section-title">Tone Matrix</h3>
        </div>
        <p class="section-description">
          Adjust the sliders to define your brand's voice personality. These values guide how AI generates content.
        </p>
      </div>

      <div class="tone-sliders">
        <div
          v-for="slider in toneSliders"
          :key="slider.key"
          class="tone-slider-group"
        >
          <div class="slider-header">
            <div class="slider-label-row">
              <MaterialIcon :icon="slider.icon" size="sm" color="var(--bronze-primary)" />
              <span class="slider-label">{{ slider.label }}</span>
            </div>
            <span class="slider-value-badge">
              {{ getToneLabel(config.toneMatrix[slider.key], slider.lowLabel, slider.highLabel) }}
            </span>
          </div>
          <p class="slider-description">{{ slider.description }}</p>
          <div class="slider-track-wrapper">
            <span class="slider-endpoint">{{ slider.lowLabel }}</span>
            <div class="slider-container">
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                v-model.number="config.toneMatrix[slider.key]"
                class="tone-range-input"
                :style="{ background: getSliderGradient(config.toneMatrix[slider.key]) }"
                :aria-label="`${slider.label} - ${slider.lowLabel} to ${slider.highLabel}`"
                :aria-valuenow="config.toneMatrix[slider.key]"
                :aria-valuemin="0"
                :aria-valuemax="100"
              />
              <span class="slider-value-display">{{ config.toneMatrix[slider.key] }}</span>
            </div>
            <span class="slider-endpoint">{{ slider.highLabel }}</span>
          </div>
        </div>
      </div>
    </BaseCard>

    <!-- ===================== SECTION 2: Keywords ===================== -->
    <BaseCard variant="glass" class="section-card">
      <div class="section-header">
        <div class="section-title-row">
          <MaterialIcon icon="label" size="md" color="var(--gold-primary)" />
          <h3 class="section-title">Keywords</h3>
        </div>
        <p class="section-description">
          Define words and phrases the AI should include or avoid in your content.
        </p>
      </div>

      <div class="keywords-grid">
        <!-- Include Keywords -->
        <div class="keyword-list-section">
          <div class="keyword-list-header">
            <MaterialIcon icon="add_circle" size="sm" color="var(--success-text)" />
            <span class="keyword-list-title">Include Keywords</span>
            <span class="keyword-count-badge">{{ config.keywords.include.length }}</span>
          </div>
          <p class="keyword-list-hint">Words and phrases to weave into your content</p>

          <div class="tag-input-wrapper">
            <div class="tags-display" v-if="config.keywords.include.length > 0">
              <span
                v-for="(keyword, index) in config.keywords.include"
                :key="`include-${index}`"
                class="keyword-tag keyword-tag--include"
              >
                {{ keyword }}
                <button
                  type="button"
                  class="tag-remove-btn"
                  @click="removeKeyword('include', index)"
                  :aria-label="`Remove keyword: ${keyword}`"
                >
                  <MaterialIcon icon="close" size="xs" />
                </button>
              </span>
            </div>
            <div class="tag-input-row">
              <input
                v-model="includeKeywordInput"
                type="text"
                class="tag-input"
                placeholder="Type a keyword and press Enter..."
                maxlength="50"
                @keydown="handleKeywordKeydown($event, 'include')"
                aria-label="Add include keyword"
              />
              <button
                type="button"
                class="tag-add-btn"
                :disabled="!includeKeywordInput.trim()"
                @click="addKeyword('include')"
                aria-label="Add keyword"
              >
                <MaterialIcon icon="add" size="sm" />
              </button>
            </div>
          </div>
        </div>

        <!-- Exclude Keywords -->
        <div class="keyword-list-section">
          <div class="keyword-list-header">
            <MaterialIcon icon="block" size="sm" color="var(--error-text)" />
            <span class="keyword-list-title">Prohibited Phrases</span>
            <span class="keyword-count-badge">{{ config.keywords.exclude.length }}</span>
          </div>
          <p class="keyword-list-hint">Words and phrases the AI should never use</p>

          <div class="tag-input-wrapper">
            <div class="tags-display" v-if="config.keywords.exclude.length > 0">
              <span
                v-for="(keyword, index) in config.keywords.exclude"
                :key="`exclude-${index}`"
                class="keyword-tag keyword-tag--exclude"
              >
                {{ keyword }}
                <button
                  type="button"
                  class="tag-remove-btn"
                  @click="removeKeyword('exclude', index)"
                  :aria-label="`Remove prohibited phrase: ${keyword}`"
                >
                  <MaterialIcon icon="close" size="xs" />
                </button>
              </span>
            </div>
            <div class="tag-input-row">
              <input
                v-model="excludeKeywordInput"
                type="text"
                class="tag-input"
                placeholder="Type a phrase and press Enter..."
                maxlength="50"
                @keydown="handleKeywordKeydown($event, 'exclude')"
                aria-label="Add prohibited phrase"
              />
              <button
                type="button"
                class="tag-add-btn"
                :disabled="!excludeKeywordInput.trim()"
                @click="addKeyword('exclude')"
                aria-label="Add prohibited phrase"
              >
                <MaterialIcon icon="add" size="sm" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </BaseCard>

    <!-- ===================== SECTION 3: Voice Samples ===================== -->
    <BaseCard variant="glass" class="section-card">
      <div class="section-header">
        <div class="section-title-row">
          <MaterialIcon icon="format_quote" size="md" color="var(--gold-primary)" />
          <h3 class="section-title">Voice Samples</h3>
          <span class="section-badge">{{ filledSamplesCount }}/3</span>
        </div>
        <p class="section-description">
          Paste example posts that match your desired brand voice. The AI uses these as reference for generating new content.
        </p>
      </div>

      <div class="voice-samples-grid">
        <div
          v-for="(_, index) in config.voiceSamples"
          :key="`sample-${index}`"
          class="voice-sample-card"
        >
          <div class="sample-header">
            <span class="sample-number">Sample {{ index + 1 }}</span>
            <span
              v-if="config.voiceSamples[index].trim()"
              class="sample-status sample-status--filled"
            >
              <MaterialIcon icon="check_circle" size="xs" color="var(--success-text)" />
              Added
            </span>
            <span v-else class="sample-status sample-status--empty">
              <MaterialIcon icon="circle" size="xs" color="var(--text-muted)" />
              Empty
            </span>
          </div>
          <textarea
            v-model="config.voiceSamples[index]"
            class="sample-textarea"
            :placeholder="getSamplePlaceholder(index)"
            rows="4"
            maxlength="500"
            :aria-label="`Voice sample ${index + 1}`"
          ></textarea>
          <div class="sample-footer">
            <span class="char-count">{{ config.voiceSamples[index].length }}/500</span>
          </div>
        </div>
      </div>
    </BaseCard>

    <!-- ===================== SECTION 4: Platform Overrides ===================== -->
    <BaseCard variant="glass" class="section-card">
      <div class="section-header">
        <div class="section-title-row">
          <MaterialIcon icon="devices" size="md" color="var(--gold-primary)" />
          <h3 class="section-title">Platform Overrides</h3>
          <span v-if="activeOverridesCount > 0" class="section-badge">
            {{ activeOverridesCount }} active
          </span>
        </div>
        <p class="section-description">
          Enable per-platform tone adjustments. When enabled, these override the base tone for that specific platform.
        </p>
      </div>

      <div class="platform-overrides-list">
        <div
          v-for="platform in platforms"
          :key="platform.id"
          :class="[
            'platform-override-card',
            { 'platform-override-card--active': config.platformOverrides[platform.id]?.enabled }
          ]"
        >
          <div class="platform-override-header" @click="togglePlatformOverride(platform.id)">
            <div class="platform-info">
              <span class="platform-icon">{{ platform.icon }}</span>
              <div class="platform-text">
                <span class="platform-name">{{ platform.name }}</span>
                <span class="platform-desc">{{ platform.description }}</span>
              </div>
            </div>
            <button
              type="button"
              :class="[
                'toggle-switch',
                { 'toggle-switch--on': config.platformOverrides[platform.id]?.enabled }
              ]"
              role="switch"
              :aria-checked="config.platformOverrides[platform.id]?.enabled ? 'true' : 'false'"
              :aria-label="`Toggle ${platform.name} override`"
              @click.stop="togglePlatformOverride(platform.id)"
            >
              <span class="toggle-switch-knob"></span>
            </button>
          </div>

          <!-- Override Tone Adjustments -->
          <Transition name="slide-expand">
            <div
              v-if="config.platformOverrides[platform.id]?.enabled"
              class="platform-tone-adjustments"
            >
              <div class="adjustment-header">
                <span class="adjustment-label">Tone Adjustments for {{ platform.name }}</span>
                <button
                  type="button"
                  class="reset-btn"
                  @click="resetPlatformOverride(platform.id)"
                  aria-label="Reset to base tone"
                >
                  <MaterialIcon icon="restart_alt" size="xs" />
                  Reset
                </button>
              </div>
              <div class="adjustment-sliders">
                <div
                  v-for="slider in toneSliders"
                  :key="`${platform.id}-${slider.key}`"
                  class="adjustment-slider-row"
                >
                  <span class="adjustment-slider-label">{{ slider.label }}</span>
                  <div class="adjustment-slider-track">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="1"
                      :value="getPlatformToneValue(platform.id, slider.key)"
                      @input="setPlatformToneValue(platform.id, slider.key, Number(($event.target as HTMLInputElement).value))"
                      class="tone-range-input tone-range-input--compact"
                      :style="{ background: getSliderGradient(getPlatformToneValue(platform.id, slider.key)) }"
                      :aria-label="`${platform.name} ${slider.label}`"
                    />
                  </div>
                  <span class="adjustment-value">{{ getPlatformToneValue(platform.id, slider.key) }}</span>
                </div>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </BaseCard>

    <!-- ===================== Save Bar ===================== -->
    <Transition name="slide-up">
      <div v-if="hasChanges" class="save-bar">
        <div class="save-bar-content">
          <span class="save-bar-text">
            <MaterialIcon icon="edit_note" size="sm" color="var(--warning-text)" />
            You have unsaved changes
          </span>
          <BaseButton
            variant="primary"
            size="small"
            :disabled="props.saving"
            @click="handleSave"
          >
            <MaterialIcon icon="save" size="sm" color="var(--text-on-gold)" />
            {{ props.saving ? 'Saving...' : 'Save Changes' }}
          </BaseButton>
        </div>
      </div>
    </Transition>

    <!-- Status Alerts -->
    <BaseAlert v-if="saveSuccess" type="success" class="status-alert">
      Brand voice settings saved successfully.
    </BaseAlert>
    <BaseAlert v-if="saveError" type="error" class="status-alert">
      {{ saveError }}
    </BaseAlert>
  </div>
</template>

<style scoped>
/* ===== Root ===== */
.brand-voice-settings {
  display: flex;
  flex-direction: column;
  gap: var(--space-2xl);
  animation: fadeIn 0.5s var(--ease-smooth);
  padding-bottom: 80px; /* Space for sticky save bar */
}

/* ===== Header ===== */
.settings-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space-xl);
}

.settings-title {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  color: var(--text-primary);
  letter-spacing: -0.02em;
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.settings-subtitle {
  color: var(--text-muted);
  font-size: var(--text-sm);
  margin-top: var(--space-xs);
  line-height: var(--leading-normal);
  max-width: 500px;
}

/* ===== Section Cards ===== */
.section-card {
  animation: cardFadeIn 0.5s var(--ease-smooth) both;
}

.section-card:nth-child(2) { animation-delay: 0.05s; }
.section-card:nth-child(3) { animation-delay: 0.1s; }
.section-card:nth-child(4) { animation-delay: 0.15s; }
.section-card:nth-child(5) { animation-delay: 0.2s; }

.section-header {
  margin-bottom: var(--space-xl);
  padding-bottom: var(--space-lg);
  border-bottom: 1px solid rgba(139, 90, 43, 0.1);
}

.section-title-row {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.section-title {
  font-family: var(--font-heading);
  font-size: var(--text-xl);
  color: var(--text-primary);
  letter-spacing: -0.01em;
}

.section-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px var(--space-sm);
  background: var(--gold-subtle);
  border: 1px solid rgba(26, 77, 58, 0.2);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  color: var(--gold-primary);
  margin-left: var(--space-sm);
}

.section-description {
  color: var(--text-secondary);
  font-size: var(--text-sm);
  line-height: var(--leading-normal);
  margin-top: var(--space-sm);
}

/* ===== Tone Sliders ===== */
.tone-sliders {
  display: flex;
  flex-direction: column;
  gap: var(--space-2xl);
}

.tone-slider-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.slider-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.slider-label-row {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.slider-label {
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
}

.slider-value-badge {
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  color: var(--gold-primary);
  background: var(--gold-subtle);
  padding: 2px var(--space-md);
  border-radius: var(--radius-full);
  border: 1px solid rgba(26, 77, 58, 0.15);
}

.slider-description {
  font-size: var(--text-sm);
  color: var(--text-muted);
  margin-bottom: var(--space-xs);
}

.slider-track-wrapper {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.slider-endpoint {
  font-size: var(--text-xs);
  color: var(--text-muted);
  min-width: 64px;
  white-space: nowrap;
}

.slider-endpoint:last-child {
  text-align: right;
}

.slider-container {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
}

.tone-range-input {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 6px;
  border-radius: var(--radius-full);
  outline: none;
  cursor: pointer;
  transition: opacity 0.2s;
}

.tone-range-input:hover {
  opacity: 0.9;
}

.tone-range-input:focus-visible {
  box-shadow: 0 0 0 3px rgba(26, 77, 58, 0.2);
  border-radius: var(--radius-full);
}

/* Webkit slider thumb */
.tone-range-input::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--gold-primary);
  border: 3px solid var(--bg-secondary);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.tone-range-input::-webkit-slider-thumb:hover {
  transform: scale(1.15);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
}

.tone-range-input:active::-webkit-slider-thumb {
  transform: scale(1.05);
}

/* Firefox slider thumb */
.tone-range-input::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--gold-primary);
  border: 3px solid var(--bg-secondary);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
  cursor: pointer;
}

.tone-range-input::-moz-range-track {
  height: 6px;
  border-radius: var(--radius-full);
  background: transparent;
}

.slider-value-display {
  position: absolute;
  right: -36px;
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--text-secondary);
  min-width: 28px;
  text-align: center;
}

/* ===== Keywords ===== */
.keywords-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-xl);
}

.keyword-list-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.keyword-list-header {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.keyword-list-title {
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
}

.keyword-count-badge {
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  color: var(--text-muted);
  background: var(--bg-tertiary);
  padding: 1px var(--space-sm);
  border-radius: var(--radius-full);
}

.keyword-list-hint {
  font-size: var(--text-sm);
  color: var(--text-muted);
}

.tag-input-wrapper {
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: var(--space-md);
  min-height: 80px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.tag-input-wrapper:focus-within {
  border-color: var(--gold-primary);
  box-shadow: 0 0 0 3px rgba(26, 77, 58, 0.1);
}

.tags-display {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs);
  margin-bottom: var(--space-sm);
}

.keyword-tag {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-xs) var(--space-md);
  border-radius: var(--radius-full);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  animation: tagAppear 0.2s var(--ease-smooth);
}

@keyframes tagAppear {
  from {
    opacity: 0;
    transform: scale(0.85);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.keyword-tag--include {
  background: var(--success-bg);
  border: 1px solid var(--success-border);
  color: var(--success-text);
}

.keyword-tag--exclude {
  background: var(--error-bg);
  border: 1px solid var(--error-border);
  color: var(--error-text);
}

.tag-remove-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border: none;
  background: transparent;
  border-radius: 50%;
  cursor: pointer;
  opacity: 0.6;
  transition: opacity 0.15s, background-color 0.15s;
  padding: 0;
  color: inherit;
}

.tag-remove-btn:hover {
  opacity: 1;
  background: rgba(0, 0, 0, 0.1);
}

.tag-input-row {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.tag-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: var(--text-primary);
  font-size: var(--text-sm);
  font-family: var(--font-body);
  padding: var(--space-xs) 0;
}

.tag-input::placeholder {
  color: var(--text-muted);
}

.tag-add-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: 1px solid var(--border-color);
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  cursor: pointer;
  color: var(--text-secondary);
  transition: all 0.15s ease;
  flex-shrink: 0;
}

.tag-add-btn:hover:not(:disabled) {
  background: var(--gold-subtle);
  border-color: var(--gold-primary);
  color: var(--gold-primary);
}

.tag-add-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

/* ===== Voice Samples ===== */
.voice-samples-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--space-xl);
}

.voice-sample-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: var(--space-lg);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.voice-sample-card:focus-within {
  border-color: var(--gold-primary);
  box-shadow: 0 0 0 3px rgba(26, 77, 58, 0.08);
}

.sample-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sample-number {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
}

.sample-status {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
}

.sample-status--filled {
  color: var(--success-text);
}

.sample-status--empty {
  color: var(--text-muted);
}

.sample-textarea {
  width: 100%;
  min-height: 100px;
  background: transparent;
  border: none;
  outline: none;
  color: var(--text-primary);
  font-size: var(--text-sm);
  font-family: var(--font-body);
  line-height: var(--leading-normal);
  resize: vertical;
}

.sample-textarea::placeholder {
  color: var(--text-muted);
}

.sample-footer {
  display: flex;
  justify-content: flex-end;
}

.char-count {
  font-size: var(--text-xs);
  color: var(--text-muted);
}

/* ===== Platform Overrides ===== */
.platform-overrides-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.platform-override-card {
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  overflow: hidden;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.platform-override-card--active {
  border-color: rgba(26, 77, 58, 0.3);
  box-shadow: 0 0 0 1px rgba(26, 77, 58, 0.08);
}

.platform-override-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-lg) var(--space-xl);
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.platform-override-header:hover {
  background: rgba(26, 77, 58, 0.03);
}

.platform-info {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.platform-icon {
  font-size: var(--text-xl);
  line-height: 1;
}

.platform-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.platform-name {
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
}

.platform-desc {
  font-size: var(--text-xs);
  color: var(--text-muted);
}

/* Toggle Switch */
.toggle-switch {
  position: relative;
  width: 44px;
  height: 24px;
  border-radius: var(--radius-full);
  border: 1px solid var(--border-color);
  background: var(--bg-elevated);
  cursor: pointer;
  transition: all 0.25s ease;
  flex-shrink: 0;
  padding: 0;
}

.toggle-switch--on {
  background: var(--gold-primary);
  border-color: var(--gold-primary);
}

.toggle-switch-knob {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
  transition: transform 0.25s ease;
}

.toggle-switch--on .toggle-switch-knob {
  transform: translateX(20px);
}

.toggle-switch:focus-visible {
  box-shadow: 0 0 0 3px rgba(26, 77, 58, 0.2);
}

/* Platform Tone Adjustments */
.platform-tone-adjustments {
  padding: 0 var(--space-xl) var(--space-xl);
  border-top: 1px solid rgba(139, 90, 43, 0.08);
}

.adjustment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-md) 0;
}

.adjustment-label {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-secondary);
}

.reset-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-xs) var(--space-sm);
  border: none;
  background: transparent;
  color: var(--text-muted);
  font-size: var(--text-xs);
  font-family: var(--font-body);
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: all 0.15s ease;
}

.reset-btn:hover {
  color: var(--gold-primary);
  background: var(--gold-subtle);
}

.adjustment-sliders {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.adjustment-slider-row {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.adjustment-slider-label {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  min-width: 90px;
}

.adjustment-slider-track {
  flex: 1;
}

.tone-range-input--compact {
  height: 4px;
}

.tone-range-input--compact::-webkit-slider-thumb {
  width: 16px;
  height: 16px;
}

.tone-range-input--compact::-moz-range-thumb {
  width: 16px;
  height: 16px;
}

.adjustment-value {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--text-secondary);
  min-width: 28px;
  text-align: right;
}

/* ===== Save Bar ===== */
.save-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
  padding: var(--space-md) var(--space-xl);
  background: var(--glass-intense-bg);
  backdrop-filter: blur(var(--blur-lg));
  -webkit-backdrop-filter: blur(var(--blur-lg));
  border-top: 1px solid var(--border-color);
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.08);
}

.save-bar-content {
  max-width: 900px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.save-bar-text {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--warning-text);
}

/* ===== Status Alerts ===== */
.status-alert {
  position: fixed;
  bottom: 80px;
  right: var(--space-xl);
  z-index: 101;
  max-width: 400px;
  animation: slideIn 0.3s var(--ease-smooth);
}

/* ===== Transitions ===== */
.slide-expand-enter-active,
.slide-expand-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.slide-expand-enter-from,
.slide-expand-leave-to {
  max-height: 0;
  opacity: 0;
  padding-top: 0;
  padding-bottom: 0;
}

.slide-expand-enter-to,
.slide-expand-leave-from {
  max-height: 400px;
  opacity: 1;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}

/* ===== Animations ===== */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes cardFadeIn {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ===== Responsive ===== */
@media (max-width: 768px) {
  .settings-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .keywords-grid {
    grid-template-columns: 1fr;
  }

  .voice-samples-grid {
    grid-template-columns: 1fr;
  }

  .slider-track-wrapper {
    flex-wrap: wrap;
  }

  .slider-endpoint {
    min-width: auto;
  }

  .slider-value-display {
    position: static;
    margin-left: var(--space-sm);
  }

  .adjustment-slider-row {
    flex-wrap: wrap;
  }

  .adjustment-slider-label {
    min-width: 100%;
    margin-bottom: var(--space-xs);
  }

  .save-bar-content {
    flex-direction: column;
    gap: var(--space-md);
    text-align: center;
  }

  .platform-override-header {
    padding: var(--space-md) var(--space-lg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .brand-voice-settings,
  .section-card,
  .keyword-tag {
    animation: none;
  }

  .slide-expand-enter-active,
  .slide-expand-leave-active,
  .slide-up-enter-active,
  .slide-up-leave-active {
    transition: none;
  }
}
</style>
