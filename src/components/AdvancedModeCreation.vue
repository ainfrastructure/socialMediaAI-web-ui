<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import BaseCard from './BaseCard.vue'
import BaseButton from './BaseButton.vue'
import BaseAlert from './BaseAlert.vue'
import MaterialIcon from './MaterialIcon.vue'
import MenuItemMultiSelector from './MenuItemMultiSelector.vue'
import AdvancedCustomizationPanel from './AdvancedCustomizationPanel.vue'
import CustomizationPreview from './CustomizationPreview.vue'
import PromptVariationSelector from './PromptVariationSelector.vue'
import LogoTogglePreview from './LogoTogglePreview.vue'
import UnifiedSchedulePost from './UnifiedSchedulePost.vue'
import WizardProgress from './WizardProgress.vue'
import LoadingOverlay from './LoadingOverlay.vue'
import SuccessModal from './SuccessModal.vue'
import GoldenRestaurantIcon from './icons/GoldenRestaurantIcon.vue'
import GoldenComboIcon from './icons/GoldenComboIcon.vue'
import GoldenCalendarIcon from './icons/GoldenCalendarIcon.vue'
import GoldenUploadIcon from './icons/GoldenUploadIcon.vue'
import GoldenSparkleIcon from './icons/GoldenSparkleIcon.vue'
import type { SavedRestaurant } from '@/services/restaurantService'
import { api } from '@/services/api'
import { useFacebookStore } from '@/stores/facebook'
import { useInstagramStore } from '@/stores/instagram'

interface MenuItem {
  name: string
  price?: string
  imageUrl?: string
  [key: string]: any
}

interface StyleVariation {
  style: 'elegant' | 'vibrant' | 'rustic' | 'modern'
  title: string
  hashtags: string[]
  prompt: string
}

interface CustomizationOptions {
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

type LogoVariant = 'full' | 'blackOutline' | 'goldOutline'
type PostType = 'single' | 'combo' | 'weekly'
type WeekLength = 5 | 7

// Weekly-specific customization options
interface WeeklyCustomizationOptions {
  layout: 'verticalStack' | 'gridWithHeader' | 'calendarGrid' | 'filmstrip'
  showDates: boolean
  dateFormat: 'full' | 'short' | 'dayOnly'
  showWeekNumber: boolean
  showMonthName: boolean
  startDate: string
  endDate: string
  theme: string
  customThemeText: string
}

const props = defineProps<{
  restaurant: SavedRestaurant
  menuItems: MenuItem[]
}>()

interface WeeklyMenuDataItem {
  day: string
  dayKey: string
  dishName: string
  price?: string
  imageUrl?: string
}

const emit = defineEmits<{
  (e: 'back'): void
  (e: 'complete', data: {
    imageUrl: string
    postText: string
    hashtags: string[]
    menuItems: MenuItem[]
    customization: CustomizationOptions
    selectedVariation: StyleVariation | null
    postType: PostType
    weekLength?: 5 | 7
    includeWeeklyPrices?: boolean
    weeklyMenuData?: WeeklyMenuDataItem[]
    weeklyCustomization?: WeeklyCustomizationOptions
    platforms?: string[]
    publishNow?: boolean
    scheduledTime?: string
    timezone?: string
    onResult?: (result: { success: boolean; postUrls?: Record<string, string>; error?: string }) => void
  }): void
}>()

const { t } = useI18n()

// Stores
const facebookStore = useFacebookStore()
const instagramStore = useInstagramStore()

// Platform configuration
type PlatformType = 'facebook' | 'instagram' | 'tiktok' | 'twitter' | 'linkedin' | 'youtube'
const allPlatforms = computed(() => [
  { id: 'facebook' as PlatformType, name: 'Facebook', icon: 'facebook', connected: (facebookStore.connectedPages?.length ?? 0) > 0 },
  { id: 'instagram' as PlatformType, name: 'Instagram', icon: 'instagram', connected: (instagramStore.connectedAccounts?.length ?? 0) > 0 },
  { id: 'tiktok' as PlatformType, name: 'TikTok', icon: 'tiktok', connected: false },
  { id: 'twitter' as PlatformType, name: 'X (Twitter)', icon: 'twitter', connected: false },
  { id: 'linkedin' as PlatformType, name: 'LinkedIn', icon: 'linkedin', connected: false },
  { id: 'youtube' as PlatformType, name: 'YouTube', icon: 'youtube', connected: false }
])

// State
const currentStep = ref(1)
const totalSteps = 5

// Post Type Selection (part of Step 1)
const postType = ref<PostType>('single')
const weekLength = ref<WeekLength>(5)
const includeWeeklyPrices = ref(false)

// Weekly customization options (Step 2 - specific to weekly posts)
const weeklyCustomization = ref<WeeklyCustomizationOptions>({
  layout: 'gridWithHeader',
  showDates: false,
  dateFormat: 'short',
  showWeekNumber: false,
  showMonthName: false,
  startDate: '',
  endDate: '',
  theme: 'none',
  customThemeText: ''
})

// Weekly layout options
const weeklyLayouts = computed(() => [
  { value: 'verticalStack', label: t('weeklyCustomization.layout.verticalStack'), icon: 'view_list', description: t('weeklyCustomization.layout.verticalStackDesc') },
  { value: 'gridWithHeader', label: t('weeklyCustomization.layout.gridWithHeader'), icon: 'grid_view', description: t('weeklyCustomization.layout.gridWithHeaderDesc') },
  { value: 'calendarGrid', label: t('weeklyCustomization.layout.calendarGrid'), icon: 'calendar_month', description: t('weeklyCustomization.layout.calendarGridDesc') },
  { value: 'filmstrip', label: t('weeklyCustomization.layout.filmstrip'), icon: 'movie', description: t('weeklyCustomization.layout.filmstripDesc') }
])

// Weekly theme presets
const weeklyThemes = computed(() => [
  { value: 'none', label: t('weeklyCustomization.themes.none'), icon: 'block' },
  { value: 'studentWeek', label: t('weeklyCustomization.themes.studentWeek'), icon: 'school' },
  { value: 'christmas', label: t('weeklyCustomization.themes.christmas'), icon: 'ac_unit' },
  { value: 'easter', label: t('weeklyCustomization.themes.easter'), icon: 'egg' },
  { value: 'summer', label: t('weeklyCustomization.themes.summer'), icon: 'wb_sunny' },
  { value: 'valentines', label: t('weeklyCustomization.themes.valentines'), icon: 'favorite' },
  { value: 'halloween', label: t('weeklyCustomization.themes.halloween'), icon: 'auto_awesome' },
  { value: 'thanksgiving', label: t('weeklyCustomization.themes.thanksgiving'), icon: 'dinner_dining' },
  { value: 'newYear', label: t('weeklyCustomization.themes.newYear'), icon: 'celebration' },
  { value: 'custom', label: t('weeklyCustomization.themes.custom'), icon: 'edit' }
])

// For weekly menu - map items to days with custom prices
interface WeeklyMenuItem {
  item: MenuItem | null
  customPrice: string // Allow price override for special menus (e.g., student discount)
}

const weeklyMenuItems = ref<Record<string, WeeklyMenuItem>>({
  monday: { item: null, customPrice: '' },
  tuesday: { item: null, customPrice: '' },
  wednesday: { item: null, customPrice: '' },
  thursday: { item: null, customPrice: '' },
  friday: { item: null, customPrice: '' },
  saturday: { item: null, customPrice: '' },
  sunday: { item: null, customPrice: '' }
})

// Day selector modal state
const showDaySelectorModal = ref(false)
const selectedDayForModal = ref<string | null>(null)

// Step 1: Menu Selection
const selectedMenuItems = ref<MenuItem[]>([])

// Image upload state (alternative to menu selection)
const uploadedImage = ref<File | null>(null)
const uploadedImagePreview = ref<string | null>(null)

// Step 2: Customization
const customization = ref<CustomizationOptions>({
  logoPosition: 'top-left',
  textOverlay: {
    text: '',
    font: 'playfair',
    size: 24,
    color: '#FFFFFF'
  },
  strictnessMode: 'flexible',
  holidayTheme: 'none',
  customHolidayText: '',
  comboTextPlacement: 'bottom',
  comboItemArrangement: 'sideBySide'
})

// Step 3: Style Variations
const styleVariations = ref<StyleVariation[]>([])
const selectedVariation = ref<StyleVariation | null>(null)
const generatingVariations = ref(false)
const variationsError = ref('')

// Step 4: Image Generation
const generatedImageUrl = ref('')
const generatingImage = ref(false)
const imageError = ref('')
const selectedLogoVariant = ref<LogoVariant>('full')

// Step 5: Post Content & Publishing
const postText = ref('')
const hashtags = ref<string[]>([])
const generatingContent = ref(false)

// Publishing state
const selectedPlatform = ref<PlatformType>('facebook')
const publishType = ref<'now' | 'schedule'>('now')
const scheduleDate = ref('')
const scheduleTime = ref('')
const publishing = ref(false)
const publishSuccess = ref(false)
const publishError = ref('')
const publishedPostUrl = ref('')
const publishedPostUrls = ref<Record<string, string>>({})
const selectedPlatforms = ref<PlatformType[]>([])
const failedPlatforms = ref<Array<{ platform: string, error: string }>>([])

// Wizard progress tracking
const highestCompletedStep = ref(0)

// Computed
const canProceedStep1 = computed(() => {
  // Allow proceeding with uploaded image for single/combo posts
  if (uploadedImage.value && (postType.value === 'single' || postType.value === 'combo')) {
    return true
  }

  if (postType.value === 'single') {
    return selectedMenuItems.value.length === 1
  } else if (postType.value === 'combo') {
    return selectedMenuItems.value.length === 2
  } else {
    // Weekly menu
    const requiredDays = weekLength.value
    const assignedDays = Object.values(weeklyMenuItems.value)
      .slice(0, requiredDays)
      .filter(entry => entry.item !== null).length
    return assignedDays === requiredDays
  }
})

// Get active days based on week length
const activeDays = computed(() => {
  const allDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  return allDays.slice(0, weekLength.value)
})

// Count assigned days for weekly menu
const assignedDaysCount = computed(() => {
  return activeDays.value.filter(day => weeklyMenuItems.value[day].item !== null).length
})

// Get the max items for menu selector based on post type
const maxItemsForSelector = computed(() => {
  if (postType.value === 'single') return 1
  if (postType.value === 'combo') return 2
  return 5 // Not used in weekly mode, but fallback
})

// Dynamic subtitle for step 1
const step1Subtitle = computed(() => {
  if (postType.value === 'single') {
    return t('advancedMode.step1.subtitleSingle')
  } else if (postType.value === 'combo') {
    return t('advancedMode.step1.subtitleCombo')
  } else {
    return t('advancedMode.step1.subtitleWeekly')
  }
})

const canProceedStep2 = computed(() => {
  return true // Customization always has defaults
})

const canProceedStep3 = computed(() => {
  return selectedVariation.value !== null
})

const canProceedStep4 = computed(() => {
  return generatedImageUrl.value !== ''
})

const canProceedStep5 = computed(() => {
  return generatedImageUrl.value !== ''
})

const stepLabels = computed(() => [
  { number: 1, label: t('advancedMode.steps.menuSelection') },
  { number: 2, label: t('advancedMode.steps.customize') },
  { number: 3, label: t('advancedMode.steps.styleSelection') },
  { number: 4, label: t('advancedMode.steps.preview') },
  { number: 5, label: t('advancedMode.steps.publish') }
])

// Get next step label for button text
const nextStepLabel = computed(() => {
  const nextIndex = currentStep.value // stepLabels is 0-indexed, currentStep is 1-indexed
  if (nextIndex < stepLabels.value.length) {
    return stepLabels.value[nextIndex].label
  }
  return t('advancedMode.navigation.next')
})

// Watch for step 3 entry - auto-generate variations
watch(currentStep, async (newStep, oldStep) => {
  if (newStep === 3 && oldStep === 2 && styleVariations.value.length === 0) {
    await generateStyleVariations()
  }
  // Auto-generate image when entering step 4 (Preview)
  if (newStep === 4 && oldStep === 3 && !generatedImageUrl.value && selectedVariation.value) {
    await generateImage()
  }
})

// Methods

// Navigation
function nextStep() {
  if (currentStep.value < totalSteps) {
    // Update highest completed step
    if (currentStep.value > highestCompletedStep.value) {
      highestCompletedStep.value = currentStep.value
    }
    currentStep.value++
  }
}

function prevStep() {
  if (currentStep.value > 1) {
    currentStep.value--
  }
}

function navigateToStep(stepNumber: number) {
  // Only allow navigation to accessible steps
  if (stepNumber <= highestCompletedStep.value + 1) {
    currentStep.value = stepNumber
  }
}

function goToStep(step: number) {
  if (step >= 1 && step <= totalSteps) {
    currentStep.value = step
  }
}

// Post Type handling
function handlePostTypeChange(type: PostType) {
  postType.value = type
  // Reset selections when changing type
  selectedMenuItems.value = []
  weeklyMenuItems.value = {
    monday: { item: null, customPrice: '' },
    tuesday: { item: null, customPrice: '' },
    wednesday: { item: null, customPrice: '' },
    thursday: { item: null, customPrice: '' },
    friday: { item: null, customPrice: '' },
    saturday: { item: null, customPrice: '' },
    sunday: { item: null, customPrice: '' }
  }
}

// Weekly menu day selection
function openDaySelector(day: string) {
  selectedDayForModal.value = day
  showDaySelectorModal.value = true
}

function selectItemForDay(item: MenuItem) {
  if (selectedDayForModal.value) {
    weeklyMenuItems.value[selectedDayForModal.value] = {
      item: item,
      customPrice: item.price || '' // Default to original price
    }
  }
  showDaySelectorModal.value = false
  selectedDayForModal.value = null
}

function clearDaySelection(day: string) {
  weeklyMenuItems.value[day] = { item: null, customPrice: '' }
}

function updateDayPrice(day: string, price: string) {
  weeklyMenuItems.value[day].customPrice = price
}

function closeDaySelector() {
  showDaySelectorModal.value = false
  selectedDayForModal.value = null
}

// Image upload handlers
function handleImageUpload(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (file) {
    // Clear menu item selection if image is uploaded
    selectedMenuItems.value = []

    uploadedImage.value = file

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      uploadedImagePreview.value = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }
}

function removeUploadedImage() {
  uploadedImage.value = null
  uploadedImagePreview.value = null
}

// Get menu items for API calls (handles both regular and weekly modes)
function getMenuItemsForApi(): MenuItem[] {
  if (postType.value === 'weekly') {
    return activeDays.value
      .map(day => weeklyMenuItems.value[day].item)
      .filter((item): item is MenuItem => item !== null)
  }
  return selectedMenuItems.value
}

// Get weekly menu data with day assignments for API (includes custom prices)
function getWeeklyMenuDataForApi() {
  if (postType.value !== 'weekly') return undefined

  const dayLabels: Record<string, string> = {
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
    sunday: 'Sunday'
  }

  return activeDays.value.map(day => {
    const entry = weeklyMenuItems.value[day]
    if (!entry.item) return null
    return {
      day: dayLabels[day],
      dayKey: day,
      dishName: entry.item.name,
      price: includeWeeklyPrices.value ? (entry.customPrice || entry.item.price || '') : undefined,
      imageUrl: entry.item.imageUrl
    }
  }).filter(Boolean)
}

// Step 3: Generate Style Variations
async function generateStyleVariations() {
  generatingVariations.value = true
  variationsError.value = ''

  try {
    const menuItemsForApi = getMenuItemsForApi()
    const weeklyMenuData = getWeeklyMenuDataForApi()
    const postTypeOptions = {
      postType: postType.value,
      weekLength: postType.value === 'weekly' ? weekLength.value : undefined,
      includeWeeklyPrices: postType.value === 'weekly' ? includeWeeklyPrices.value : undefined,
      weeklyMenuData: weeklyMenuData, // Contains day, dishName, price for each day
      weeklyCustomization: postType.value === 'weekly' ? weeklyCustomization.value : undefined
    }

    const response = await api.generateStyleVariations(
      props.restaurant,
      menuItemsForApi,
      customization.value,
      postTypeOptions
    )

    if (response.success && response.variations) {
      styleVariations.value = response.variations
    } else {
      throw new Error(response.error || 'Failed to generate style variations')
    }
  } catch (error: any) {
    console.error('Error generating style variations:', error)
    variationsError.value = error.message || t('advancedMode.messages.generationError')
  } finally {
    generatingVariations.value = false
  }
}

// Step 3: Select Variation
function handleVariationSelect(variation: StyleVariation) {
  selectedVariation.value = variation
}

// Step 3: Regenerate Variations
async function regenerateVariations() {
  styleVariations.value = []
  selectedVariation.value = null
  await generateStyleVariations()
}

// Step 3: Go to Step 4 and auto-generate image
async function goToStep4AndGenerate() {
  if (!selectedVariation.value) return
  currentStep.value = 4
  // Auto-start generation after a brief moment for UI to update
  await nextTick()
  await generateImage()
}

// Step 4: Generate Image
async function generateImage() {
  if (!selectedVariation.value) {
    imageError.value = t('advancedMode.messages.styleRequired')
    return
  }

  generatingImage.value = true
  imageError.value = ''

  try {
    const menuItemsForApi = getMenuItemsForApi()
    const weeklyMenuData = getWeeklyMenuDataForApi()
    const postTypeOptions = {
      postType: postType.value,
      weekLength: postType.value === 'weekly' ? weekLength.value : undefined,
      includeWeeklyPrices: postType.value === 'weekly' ? includeWeeklyPrices.value : undefined,
      weeklyMenuData: weeklyMenuData, // Contains day, dishName, price for each day
      weeklyCustomization: postType.value === 'weekly' ? weeklyCustomization.value : undefined
    }

    const response = await api.generateAdvancedImage(
      selectedVariation.value.prompt,
      customization.value,
      menuItemsForApi,
      props.restaurant.brand_dna?.logo_url,
      props.restaurant.place_id,
      postTypeOptions
    )

    if (response.success && response.data?.imageUrl) {
      generatedImageUrl.value = response.data.imageUrl

      // Auto-advance to next step
      setTimeout(() => {
        nextStep()
      }, 500)

      // Also generate post content in parallel
      await generatePostContent()
    } else {
      throw new Error(response.error || 'Failed to generate image')
    }
  } catch (error: any) {
    console.error('Error generating image:', error)
    imageError.value = error.message || t('advancedMode.messages.generationError')
  } finally {
    generatingImage.value = false
  }
}

// Step 5: Generate Post Content
async function generatePostContent() {
  if (!selectedVariation.value) return

  generatingContent.value = true

  try {
    const menuItemsForApi = getMenuItemsForApi()
    const menuItemNames = menuItemsForApi.map(item => item.name)

    // Build context based on post type
    let context: string | undefined
    if (postType.value === 'combo') {
      context = 'This is a combo/bundle offer featuring 2 items together as a special deal.'
    } else if (postType.value === 'weekly') {
      context = `This is a weekly menu post featuring ${weekLength.value} dishes, one for each day of the ${weekLength.value === 5 ? 'work week' : 'week'}.`
    }

    const response = await api.generatePostContent(
      'facebook',
      props.restaurant.name,
      menuItemNames,
      'image',
      context,
      props.restaurant.brand_dna,
      'en'
    )

    if (response.success && response.data) {
      postText.value = response.data.postText || ''
      hashtags.value = response.data.hashtags || []
    }
  } catch (error: any) {
    console.error('Error generating post content:', error)
    // Don't show error - content is optional and can be edited
  } finally {
    generatingContent.value = false
  }
}

// Step 5: Add Hashtag
function addHashtag(tag: string) {
  const cleanTag = tag.replace(/^#/, '').trim()
  if (cleanTag && !hashtags.value.includes(cleanTag)) {
    hashtags.value.push(cleanTag)
  }
}

// Step 5: Remove Hashtag
function removeHashtag(index: number) {
  hashtags.value.splice(index, 1)
}

// Handle logo selection
function handleLogoSelect(variant: LogoVariant) {
  selectedLogoVariant.value = variant
}

// Handle publish from UnifiedSchedulePost component
async function handleUnifiedPublish(data: {
  platforms: string[]
  publishType: 'now' | 'schedule'
  scheduledDate?: string
  scheduledTime?: string
  timezone?: string
}) {
  publishing.value = true
  publishError.value = ''
  publishSuccess.value = false
  publishedPostUrl.value = ''
  publishedPostUrls.value = {}

  // Set the selected platforms for display
  if (data.platforms.length > 0) {
    selectedPlatform.value = data.platforms[0] as PlatformType
    selectedPlatforms.value = data.platforms as PlatformType[]
  }

  try {
    const menuItemsForApi = getMenuItemsForApi()
    const weeklyMenuData = getWeeklyMenuDataForApi()

    // Build scheduled time if scheduling
    let scheduledTime: string | undefined
    if (data.publishType === 'schedule' && data.scheduledDate && data.scheduledTime) {
      scheduledTime = new Date(`${data.scheduledDate}T${data.scheduledTime}`).toISOString()
    }

    // Emit complete with all data for parent to handle actual publishing
    const result = await new Promise<{ success: boolean; postUrls?: Record<string, string>; error?: string }>((resolve) => {
      emit('complete', {
        imageUrl: generatedImageUrl.value,
        postText: postText.value,
        hashtags: hashtags.value,
        menuItems: menuItemsForApi,
        customization: customization.value,
        selectedVariation: selectedVariation.value,
        postType: postType.value,
        weekLength: postType.value === 'weekly' ? weekLength.value : undefined,
        includeWeeklyPrices: postType.value === 'weekly' ? includeWeeklyPrices.value : undefined,
        weeklyMenuData: weeklyMenuData as WeeklyMenuDataItem[] | undefined,
        weeklyCustomization: postType.value === 'weekly' ? weeklyCustomization.value : undefined,
        platforms: data.platforms,
        publishNow: data.publishType === 'now',
        scheduledTime: scheduledTime,
        timezone: data.timezone,
        onResult: resolve
      })

      // Fallback timeout in case parent doesn't respond
      setTimeout(() => resolve({ success: true }), 15000)
    })

    if (result.success) {
      publishSuccess.value = true
      if (result.postUrls) {
        publishedPostUrls.value = result.postUrls
        // Set first URL as main for backward compatibility
        const firstUrl = Object.values(result.postUrls)[0]
        if (firstUrl) publishedPostUrl.value = firstUrl
      }
    } else {
      publishError.value = result.error || t('advancedMode.publish.error')
    }
  } catch (err: any) {
    publishError.value = err.message || t('advancedMode.publish.error')
  } finally {
    publishing.value = false
  }
}

// Success modal helpers
function getPlatformName(platformId: PlatformType): string {
  const platform = allPlatforms.value.find(p => p.id === platformId)
  return platform?.name || platformId
}

function closeSuccessModal() {
  publishSuccess.value = false
}

function openPostUrl() {
  if (publishedPostUrl.value) {
    window.open(publishedPostUrl.value, '_blank')
  }
}

function createAnother() {
  // Reset to step 1 and clear all state
  publishSuccess.value = false
  publishedPostUrl.value = ''
  publishError.value = ''
  currentStep.value = 1
  selectedMenuItems.value = []
  uploadedImage.value = null
  uploadedImagePreview.value = null
  styleVariations.value = []
  selectedVariation.value = null
  generatedImageUrl.value = ''
  postText.value = ''
  hashtags.value = []
  weeklyMenuItems.value = {
    monday: { item: null, customPrice: '' },
    tuesday: { item: null, customPrice: '' },
    wednesday: { item: null, customPrice: '' },
    thursday: { item: null, customPrice: '' },
    friday: { item: null, customPrice: '' },
    saturday: { item: null, customPrice: '' },
    sunday: { item: null, customPrice: '' }
  }
}
</script>

<template>
  <div class="advanced-mode-creation">
    <!-- Wizard Progress -->
    <WizardProgress
      :current-step="currentStep"
      :step-labels="stepLabels"
      :highest-completed-step="highestCompletedStep"
      @navigate="navigateToStep"
    />

    <!-- Step 1: Menu Item Selection -->
    <BaseCard v-show="currentStep === 1" variant="glass" class="step-card">
      <div class="step-header">
        <h3 class="step-title">{{ t('advancedMode.step1.title') }}</h3>
        <p class="step-subtitle">{{ step1Subtitle }}</p>
      </div>

      <!-- Post Type Selector -->
      <div class="post-type-section">
        <h4 class="section-label">{{ t('advancedMode.postType.title') }}</h4>
        <div class="post-type-options">
          <div
            :class="['post-type-card', { selected: postType === 'single' }]"
            @click="handlePostTypeChange('single')"
          >
            <GoldenRestaurantIcon :size="40" class="post-type-icon" />
            <span class="post-type-title">{{ t('advancedMode.postType.single.title') }}</span>
            <span class="post-type-description">{{ t('advancedMode.postType.single.description') }}</span>
          </div>
          <div
            :class="['post-type-card', { selected: postType === 'combo' }]"
            @click="handlePostTypeChange('combo')"
          >
            <GoldenComboIcon :size="40" class="post-type-icon" />
            <span class="post-type-title">{{ t('advancedMode.postType.combo.title') }}</span>
            <span class="post-type-description">{{ t('advancedMode.postType.combo.description') }}</span>
          </div>
          <div
            :class="['post-type-card', { selected: postType === 'weekly' }]"
            @click="handlePostTypeChange('weekly')"
          >
            <GoldenCalendarIcon :size="40" class="post-type-icon" />
            <span class="post-type-title">{{ t('advancedMode.postType.weekly.title') }}</span>
            <span class="post-type-description">{{ t('advancedMode.postType.weekly.description') }}</span>
          </div>
        </div>

        <!-- Weekly Menu Options (shown when weekly is selected) -->
        <div v-if="postType === 'weekly'" class="weekly-options">
          <div class="week-length-selector">
            <span class="option-label">{{ t('advancedMode.postType.weekLengthLabel') }}</span>
            <div class="radio-group">
              <label class="radio-option">
                <input type="radio" v-model="weekLength" :value="5" />
                <span>{{ t('advancedMode.postType.fiveDays') }}</span>
              </label>
              <label class="radio-option">
                <input type="radio" v-model="weekLength" :value="7" />
                <span>{{ t('advancedMode.postType.sevenDays') }}</span>
              </label>
            </div>
          </div>
          <label class="checkbox-option">
            <input type="checkbox" v-model="includeWeeklyPrices" />
            <span>{{ t('advancedMode.postType.includePrices') }}</span>
          </label>
        </div>
      </div>

      <!-- Menu Selection for Single/Combo -->
      <div v-if="postType !== 'weekly'" class="menu-selection-section">
        <!-- Image Upload Option -->
        <div class="image-upload-section">
          <h4 class="section-label">{{ t('advancedMode.step1.uploadTitle') }}</h4>
          <div v-if="uploadedImagePreview" class="uploaded-image-preview">
            <img :src="uploadedImagePreview" alt="Uploaded image" class="preview-image" />
            <button class="remove-image-btn" @click="removeUploadedImage" :title="t('common.remove')">
              <MaterialIcon icon="close" size="sm" />
            </button>
            <div class="upload-badge">
              <MaterialIcon icon="check_circle" size="sm" />
            </div>
          </div>
          <label v-else class="upload-button">
            <input
              type="file"
              accept="image/*"
              @change="handleImageUpload"
              class="upload-input"
            />
            <div class="upload-content">
              <GoldenUploadIcon :size="32" />
              <span class="upload-text">{{ t('advancedMode.step1.uploadButton') }}</span>
              <span class="upload-hint">{{ t('advancedMode.step1.uploadHint') }}</span>
            </div>
          </label>
        </div>

        <!-- Divider -->
        <div v-if="menuItems.length > 0" class="divider">
          <span class="divider-text">{{ t('advancedMode.step1.orDivider') }}</span>
        </div>

        <!-- Menu Item Selector -->
        <MenuItemMultiSelector
          v-if="menuItems.length > 0"
          :menu-items="menuItems"
          :max-items="maxItemsForSelector"
          @update:selected-items="selectedMenuItems = $event"
        />
      </div>

      <!-- Day Assignment for Weekly Menu -->
      <div v-else class="weekly-menu-section">
        <h4 class="section-label">{{ t('advancedMode.postType.assignDishes') }}</h4>
        <div class="day-assignment-list">
          <div
            v-for="day in activeDays"
            :key="day"
            class="day-assignment-row"
          >
            <span class="day-label">{{ t(`advancedMode.postType.days.${day}`) }}</span>
            <div class="day-item-slot">
              <div v-if="weeklyMenuItems[day].item" class="selected-item-preview">
                <img
                  v-if="weeklyMenuItems[day].item?.imageUrl"
                  :src="weeklyMenuItems[day].item?.imageUrl"
                  :alt="weeklyMenuItems[day].item?.name"
                  class="item-thumbnail"
                />
                <div class="item-info">
                  <span class="item-name">{{ weeklyMenuItems[day].item?.name }}</span>
                  <div v-if="includeWeeklyPrices" class="price-input-wrapper">
                    <input
                      type="text"
                      class="price-input"
                      :value="weeklyMenuItems[day].customPrice"
                      :placeholder="weeklyMenuItems[day].item?.price || t('advancedMode.postType.enterPrice')"
                      @input="updateDayPrice(day, ($event.target as HTMLInputElement).value)"
                    />
                  </div>
                </div>
                <button class="clear-btn" @click="clearDaySelection(day)">×</button>
              </div>
              <button
                v-else
                class="select-dish-btn"
                @click="openDaySelector(day)"
              >
                {{ t('advancedMode.postType.selectDish') }}
              </button>
            </div>
          </div>
        </div>
        <p class="selection-count">
          {{ assignedDaysCount }} {{ t('advancedMode.postType.of') }} {{ weekLength }} {{ t('advancedMode.postType.dishesSelected') }}
        </p>
      </div>

      <!-- Day Selector Modal -->
      <div v-if="showDaySelectorModal" class="day-selector-modal-overlay" @click.self="closeDaySelector">
        <div class="day-selector-modal">
          <div class="modal-header">
            <h3>{{ t('advancedMode.postType.selectDishFor', { day: selectedDayForModal ? t(`advancedMode.postType.days.${selectedDayForModal}`) : '' }) }}</h3>
            <button class="modal-close-btn" @click="closeDaySelector">×</button>
          </div>
          <div class="modal-content">
            <div class="menu-items-grid">
              <div
                v-for="item in menuItems"
                :key="item.name"
                class="menu-item-card"
                @click="selectItemForDay(item)"
              >
                <img
                  v-if="item.imageUrl"
                  :src="item.imageUrl"
                  :alt="item.name"
                  class="menu-item-image"
                />
                <div class="menu-item-info">
                  <span class="menu-item-name">{{ item.name }}</span>
                  <span v-if="item.price" class="menu-item-price">{{ item.price }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="step-navigation">
        <BaseButton variant="ghost" @click="emit('back')">
          {{ t('advancedMode.navigation.back') }}
        </BaseButton>
        <BaseButton
          variant="primary"
          size="large"
          :disabled="!canProceedStep1"
          @click="nextStep"
        >
          {{ nextStepLabel }} →
        </BaseButton>
      </div>
    </BaseCard>

    <!-- Step 2: Customization -->
    <BaseCard v-show="currentStep === 2" variant="glass" class="step-card">
      <div class="step-header">
        <h3 class="step-title">{{ t('advancedMode.step2.title') }}</h3>
        <p class="step-subtitle">{{ t('advancedMode.step2.subtitle') }}</p>
      </div>

      <div class="customization-layout">
        <!-- Options Panel (Top) -->
        <div class="options-panel">
          <!-- Common customization options -->
          <AdvancedCustomizationPanel v-model="customization" :post-type="postType" />

          <!-- Weekly-specific customization options -->
          <div v-if="postType === 'weekly'" class="weekly-customization-section">
        <!-- Menu Layout Selection -->
        <div class="customization-group">
          <h4 class="group-title">{{ t('weeklyCustomization.layout.title') }}</h4>
          <div class="layout-options-grid">
            <button
              v-for="layout in weeklyLayouts"
              :key="layout.value"
              :class="['layout-option-card', { selected: weeklyCustomization.layout === layout.value }]"
              @click="weeklyCustomization.layout = layout.value as any"
            >
              <MaterialIcon :icon="layout.icon" size="lg" class="layout-icon" />
              <span class="layout-label">{{ layout.label }}</span>
              <span class="layout-desc">{{ layout.description }}</span>
            </button>
          </div>
        </div>

        <!-- Date Display Options -->
        <div class="customization-group">
          <h4 class="group-title">{{ t('weeklyCustomization.dates.title') }}</h4>
          <div class="date-options-container">
            <label class="toggle-option">
              <input type="checkbox" v-model="weeklyCustomization.showDates" />
              <span>{{ t('weeklyCustomization.dates.showDates') }}</span>
            </label>

            <div v-if="weeklyCustomization.showDates" class="date-sub-options">
              <div class="date-format-row">
                <label class="format-label">{{ t('weeklyCustomization.dates.dateRange') }}</label>
                <div class="date-range-inputs">
                  <input type="date" v-model="weeklyCustomization.startDate" class="date-input" />
                  <span class="date-separator">→</span>
                  <input type="date" v-model="weeklyCustomization.endDate" class="date-input" />
                </div>
              </div>

              <div class="format-options">
                <label class="radio-option">
                  <input type="radio" v-model="weeklyCustomization.dateFormat" value="full" />
                  <span>{{ t('weeklyCustomization.dates.formatFull') }}</span>
                </label>
                <label class="radio-option">
                  <input type="radio" v-model="weeklyCustomization.dateFormat" value="short" />
                  <span>{{ t('weeklyCustomization.dates.formatShort') }}</span>
                </label>
                <label class="radio-option">
                  <input type="radio" v-model="weeklyCustomization.dateFormat" value="dayOnly" />
                  <span>{{ t('weeklyCustomization.dates.formatDayOnly') }}</span>
                </label>
              </div>

              <div class="additional-date-options">
                <label class="toggle-option">
                  <input type="checkbox" v-model="weeklyCustomization.showWeekNumber" />
                  <span>{{ t('weeklyCustomization.dates.showWeekNumber') }}</span>
                </label>
                <label class="toggle-option">
                  <input type="checkbox" v-model="weeklyCustomization.showMonthName" />
                  <span>{{ t('weeklyCustomization.dates.showMonthName') }}</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <!-- Theme Selection -->
        <div class="customization-group">
          <h4 class="group-title">{{ t('weeklyCustomization.themes.title') }}</h4>
          <div class="theme-options-grid">
            <button
              v-for="theme in weeklyThemes"
              :key="theme.value"
              :class="['theme-option-card', { selected: weeklyCustomization.theme === theme.value }]"
              @click="weeklyCustomization.theme = theme.value"
            >
              <MaterialIcon :icon="theme.icon" size="lg" class="theme-icon" />
              <span class="theme-label">{{ theme.label }}</span>
            </button>
          </div>

          <!-- Custom theme text input -->
          <div v-if="weeklyCustomization.theme === 'custom'" class="custom-theme-input-wrapper">
            <input
              v-model="weeklyCustomization.customThemeText"
              type="text"
              :placeholder="t('weeklyCustomization.themes.customPlaceholder')"
              class="custom-theme-text-input"
              maxlength="50"
            />
          </div>
        </div>
      </div>
        </div>

        <!-- Preview Panel (Bottom) -->
        <div class="preview-panel">
          <label class="preview-panel-label">{{ t('advancedMode.step2.previewLabel', 'Preview') }}</label>
          <CustomizationPreview
            :post-type="postType"
            :customization="customization"
            :weekly-customization="weeklyCustomization"
            :menu-items="postType === 'weekly' ? getMenuItemsForApi() : selectedMenuItems"
          />
        </div>
      </div>

      <div class="step-navigation">
        <BaseButton variant="ghost" @click="prevStep">
          {{ t('advancedMode.navigation.back') }}
        </BaseButton>
        <BaseButton variant="primary" size="large" :disabled="!canProceedStep2" @click="nextStep">
          {{ nextStepLabel }} →
        </BaseButton>
      </div>
    </BaseCard>

    <!-- Step 3: Style Variation Selection -->
    <BaseCard v-show="currentStep === 3" variant="glass" class="step-card">
      <div class="step-header">
        <h3 class="step-title">{{ t('advancedMode.step3.title') }}</h3>
        <p class="step-subtitle">{{ t('advancedMode.step3.subtitle') }}</p>
      </div>

      <BaseAlert v-if="variationsError" type="error">
        {{ variationsError }}
      </BaseAlert>

      <PromptVariationSelector
        :variations="styleVariations"
        :generating="generatingVariations"
        @select="handleVariationSelect"
        @regenerate="regenerateVariations"
      />

      <div class="step-navigation">
        <BaseButton variant="ghost" @click="prevStep">
          {{ t('advancedMode.navigation.back') }}
        </BaseButton>
        <BaseButton
          variant="primary"
          size="large"
          :disabled="!canProceedStep3"
          @click="goToStep4AndGenerate"
        >
          {{ t('advancedMode.navigation.generate') }}
        </BaseButton>
      </div>
    </BaseCard>

    <!-- Step 4: Image Generation -->
    <BaseCard v-show="currentStep === 4" variant="glass" class="step-card">
      <div class="step-header">
        <h3 class="step-title">{{ t('advancedMode.step4.title') }}</h3>
        <p class="step-subtitle">{{ t('advancedMode.step4.subtitle') }}</p>
      </div>

      <BaseAlert v-if="imageError" type="error">
        {{ imageError }}
      </BaseAlert>

      <!-- Generate Button (if not generated yet) -->
      <div v-if="!generatedImageUrl && !generatingImage" class="generate-section">
        <div class="generate-preview">
          <div class="preview-info">
            <GoldenSparkleIcon :size="32" class="info-icon" />
            <div class="info-text">
              <h4 class="info-title">{{ t('advancedMode.step4.generatingWithAI') }}</h4>
              <p class="info-description">
                {{ selectedVariation?.title || t('advancedMode.step3.selectedStyle') }}
              </p>
            </div>
          </div>
        </div>

        <BaseButton
          variant="primary"
          size="large"
          full-width
          @click="generateImage"
        >
          {{ t('advancedMode.step4.generateButton') }}
        </BaseButton>
      </div>

      <!-- Generating State -->
      <div v-else-if="generatingImage" class="generating-state">
        <div class="loading-spinner"></div>
        <p class="loading-text">{{ t('advancedMode.step4.generating') }}</p>
      </div>

      <!-- Generated Image with Logo Toggle -->
      <LogoTogglePreview
        v-else
        :image-url="generatedImageUrl"
        :logo-position="customization.logoPosition"
        @select-logo="handleLogoSelect"
      />

      <div class="step-navigation">
        <BaseButton variant="ghost" @click="prevStep">
          {{ t('advancedMode.navigation.back') }}
        </BaseButton>
        <BaseButton
          v-if="canProceedStep4"
          variant="primary"
          size="large"
          @click="nextStep"
        >
          {{ nextStepLabel }} →
        </BaseButton>
      </div>
    </BaseCard>

    <!-- Step 5: Preview & Publish -->
    <BaseCard v-show="currentStep === 5" variant="glass" class="step-card publish-step">
      <div class="step-header">
        <h3 class="step-title">{{ t('advancedMode.step5.title') }}</h3>
        <p class="step-subtitle">{{ t('advancedMode.step5.subtitle') }}</p>
      </div>

      <!-- Success Alert -->
      <BaseAlert v-if="publishSuccess" type="success" class="publish-success-alert">
        <div class="success-content">
          <span>{{ t('advancedMode.publish.success') }}</span>
          <a v-if="publishedPostUrl" :href="publishedPostUrl" target="_blank" class="post-link">
            {{ t('advancedMode.publish.viewPost') }} →
          </a>
        </div>
      </BaseAlert>

      <!-- Error Alert -->
      <BaseAlert v-if="publishError" type="error">
        {{ publishError }}
      </BaseAlert>

      <div class="publish-layout">
        <!-- Image Preview at Top -->
        <div class="image-preview-top">
          <label class="form-label">{{ t('advancedMode.step5.imagePreview') }}</label>
          <div class="preview-image-wrapper">
            <img :src="generatedImageUrl" alt="Generated post" class="preview-image-large" />
          </div>
        </div>

        <!-- Content section -->
        <div class="content-section">
          <!-- Post Text -->
          <div class="form-group">
            <label class="form-label">{{ t('advancedMode.step5.postTextLabel') }}</label>
            <textarea
              v-model="postText"
              :placeholder="t('advancedMode.step5.postTextPlaceholder')"
              class="form-textarea"
              rows="4"
            ></textarea>
          </div>

          <!-- Hashtags -->
          <div class="form-group">
            <div class="hashtags-header">
              <label class="form-label">{{ t('advancedMode.step5.hashtagsLabel') }}</label>
              <button
                v-if="hashtags.length > 0"
                type="button"
                class="clear-all-btn"
                @click="hashtags = []"
              >
                <MaterialIcon icon="delete_sweep" size="sm" />
                {{ t('common.clearAll', 'Clear All') }}
              </button>
            </div>
            <div class="hashtags-container">
              <span
                v-for="(tag, index) in hashtags"
                :key="index"
                class="hashtag-tag"
              >
                #{{ tag }}
                <button class="remove-tag" @click="removeHashtag(index)">×</button>
              </span>
              <span v-if="hashtags.length === 0" class="hashtags-empty">
                {{ t('advancedMode.step5.noHashtags', 'No hashtags yet. Add some below.') }}
              </span>
            </div>
            <div class="hashtag-input-wrapper">
              <MaterialIcon icon="tag" size="sm" class="hashtag-input-icon" />
              <input
                type="text"
                :placeholder="t('advancedMode.step5.addHashtag')"
                class="hashtag-input"
                @keyup.enter="addHashtag(($event.target as HTMLInputElement).value); ($event.target as HTMLInputElement).value = ''"
              />
            </div>
            <span class="hashtag-hint">{{ t('advancedMode.step5.hashtagHint', 'Press Enter to add') }}</span>
          </div>

          <!-- Platform & Publish Options using UnifiedSchedulePost -->
          <UnifiedSchedulePost
            :image-url="generatedImageUrl"
            :post-text="postText"
            :hashtags="hashtags"
            :show-preview="false"
            :show-cancel-button="false"
            @publish="handleUnifiedPublish"
          />
        </div>
      </div>

      <div class="step-navigation step-5-nav">
        <BaseButton variant="ghost" @click="prevStep">
          {{ t('advancedMode.navigation.back') }}
        </BaseButton>
        <!-- Publish button is handled by UnifiedSchedulePost component above -->
      </div>
    </BaseCard>

    <!-- Loading Overlays -->
    <LoadingOverlay
      :visible="generatingVariations"
      :title="t('advancedMode.step3.generatingVariations', 'Creating style variations...')"
      :subtitle="t('common.pleaseWait', 'Please wait...')"
    />

    <LoadingOverlay
      :visible="generatingImage"
      :title="t('advancedMode.step4.generating', 'Cooking up your image...')"
      :subtitle="t('common.pleaseWait', 'Please wait...')"
    />

    <LoadingOverlay
      :visible="publishing"
      :title="t('advancedMode.step5.publishing', 'Publishing your post...')"
      :subtitle="t('common.pleaseWait', 'Please wait...')"
    />

    <!-- Success Modal -->
    <SuccessModal
      :visible="publishSuccess"
      :published-urls="publishedPostUrls"
      :failed-platforms="failedPlatforms"
      @create-another="createAnother"
      @close="closeSuccessModal"
    />
  </div>
</template>

<style scoped>
.advanced-mode-creation {
  display: flex;
  flex-direction: column;
  gap: var(--space-2xl);
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--space-xl);
}

/* Progress Indicator */
.wizard-progress {
  padding: var(--space-xl);
  background: var(--glass-bg);
  border: var(--border-width) solid var(--glass-border);
  border-radius: var(--radius-lg);
  backdrop-filter: blur(var(--blur-md));
  display: flex;
  justify-content: center;
}

.wizard-progress-track {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 700px;
  width: 100%;
  gap: 0;
}

.progress-step-wrapper {
  display: flex;
  align-items: center;
}

.progress-step-wrapper:not(:last-child) {
  flex: 1;
}

.progress-step-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-sm);
  cursor: pointer;
  transition: var(--transition-base);
}

.progress-step-circle {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-full);
  background: var(--bg-secondary);
  border: 2px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: var(--font-semibold);
  color: var(--text-muted);
  transition: var(--transition-base);
}

.progress-step-item.active .progress-step-circle {
  background: var(--gold-primary);
  border-color: var(--gold-primary);
  color: var(--text-on-gold);
  box-shadow: var(--glow-gold-sm);
}

.progress-step-item.completed .progress-step-circle {
  background: var(--gold-subtle);
  border-color: var(--gold-primary);
  color: var(--gold-primary);
}

.progress-step-label {
  font-size: var(--text-xs);
  color: var(--text-muted);
  text-align: center;
}

.progress-step-item.active .progress-step-label {
  color: var(--gold-primary);
  font-weight: var(--font-semibold);
}

.progress-line {
  flex: 1;
  height: 2px;
  background: var(--border-color);
  margin: 0 var(--space-sm);
  transition: var(--transition-base);
}

.progress-line.completed {
  background: var(--gold-primary);
}

/* Step Card */
.step-card {
  padding: var(--space-2xl);
  animation: fadeInUp 0.4s var(--ease-smooth);
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* Animation classes for Step 4 content reveal */
.animate-fade-in {
  animation: fadeInScale 0.6s var(--ease-smooth);
}

.animate-fade-in-delay {
  animation: fadeInUp 0.6s var(--ease-smooth) 0.3s both;
}

.step-header {
  margin-bottom: var(--space-2xl);
}

.step-title {
  font-family: var(--font-heading);
  font-size: var(--text-3xl);
  color: var(--text-primary);
  margin-bottom: var(--space-sm);
}

.step-subtitle {
  font-size: var(--text-lg);
  color: var(--text-secondary);
}

/* Step Navigation */
.step-navigation {
  display: flex;
  justify-content: space-between;
  gap: var(--space-md);
  margin-top: var(--space-2xl);
  padding-top: var(--space-2xl);
  border-top: 1px solid var(--border-color);
}

.step-navigation.step-5-nav {
  justify-content: flex-start;
}

/* Generate Section (Step 4) */
.generate-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
}

.generate-preview {
  padding: var(--space-2xl);
  background: var(--glass-bg);
  border: var(--border-width) solid var(--glass-border);
  border-radius: var(--radius-lg);
  backdrop-filter: blur(var(--blur-md));
}

.preview-info {
  display: flex;
  align-items: center;
  gap: var(--space-lg);
}

.info-icon {
  font-size: 48px;
}

.info-text {
  flex: 1;
}

.info-title {
  font-size: var(--text-xl);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin-bottom: var(--space-xs);
}

.info-description {
  font-size: var(--text-base);
  color: var(--text-secondary);
}

/* Generating State */
.generating-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-5xl);
  gap: var(--space-xl);
}

.loading-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid var(--glass-border);
  border-top-color: var(--gold-primary);
  border-radius: var(--radius-full);
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text {
  color: var(--text-secondary);
  font-size: var(--text-lg);
}

/* Preview Content (Step 5) */
.preview-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-2xl);
}

.image-preview-section,
.content-editor-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.section-title {
  font-size: var(--text-xl);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
}

.preview-image-wrapper {
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-lg);
}

.preview-image {
  width: 100%;
  height: auto;
  display: block;
}

/* Form Elements */
.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.form-label {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-secondary);
}

.form-textarea,
.form-input {
  padding: var(--space-md);
  background: var(--bg-secondary);
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: var(--text-base);
  font-family: var(--font-body);
  transition: var(--transition-base);
}

.form-textarea {
  resize: vertical;
  line-height: 1.6;
}

.form-textarea:focus,
.form-input:focus {
  outline: none;
  border-color: var(--gold-primary);
  box-shadow: 0 0 0 3px var(--gold-subtle);
}

/* Hashtags */
.hashtags-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.clear-all-btn {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-xs) var(--space-sm);
  background: transparent;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  color: var(--text-muted);
  font-size: var(--text-xs);
  cursor: pointer;
  transition: var(--transition-base);
}

.clear-all-btn:hover {
  border-color: var(--gold-primary);
  color: var(--gold-primary);
}

.hashtags-container {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
  padding: var(--space-md);
  background: var(--bg-secondary);
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--radius-md);
  min-height: 60px;
  align-items: flex-start;
}

.hashtags-empty {
  color: var(--text-muted);
  font-size: var(--text-sm);
  font-style: italic;
}

.hashtag-tag {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-xs) var(--space-sm);
  background: var(--gold-subtle);
  border: 1px solid var(--gold-primary);
  border-radius: var(--radius-full);
  color: var(--gold-primary);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
}

.remove-tag {
  background: none;
  border: none;
  color: var(--gold-primary);
  cursor: pointer;
  font-size: 18px;
  line-height: 1;
  padding: 0;
  margin-left: 2px;
}

.hashtag-input-wrapper {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  background: var(--bg-secondary);
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--radius-md);
}

.hashtag-input-wrapper:focus-within {
  border-color: var(--gold-primary);
  box-shadow: 0 0 0 3px var(--gold-subtle);
}

.hashtag-input-icon {
  color: var(--text-muted);
}

.hashtag-input {
  flex: 1;
  background: transparent;
  border: none;
  color: var(--text-primary);
  font-size: var(--text-sm);
  outline: none;
}

.hashtag-hint {
  font-size: var(--text-xs);
  color: var(--text-muted);
  margin-top: var(--space-xs);
}

/* Schedule Preview (Step 6) */
.schedule-preview {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-2xl);
}

.final-preview {
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-xl);
}

.final-preview-image {
  width: 100%;
  height: auto;
  display: block;
}

.content-summary {
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.summary-label {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.summary-text {
  font-size: var(--text-base);
  color: var(--text-primary);
  line-height: 1.6;
}

.summary-hashtags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
}

.summary-hashtag {
  padding: var(--space-xs) var(--space-sm);
  background: var(--gold-subtle);
  border: 1px solid var(--gold-primary);
  border-radius: var(--radius-full);
  color: var(--gold-primary);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
}

/* Post Type Selector */
.post-type-section {
  margin-bottom: var(--space-2xl);
}

.section-label {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin-bottom: var(--space-lg);
}

.post-type-options {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-lg);
}

.post-type-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-xl);
  background: var(--bg-secondary);
  border: 2px solid var(--border-color);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: var(--transition-base);
  text-align: center;
}

.post-type-card:hover {
  border-color: var(--gold-primary);
  background: var(--gold-subtle);
}

.post-type-card.selected {
  border-color: var(--gold-primary);
  background: var(--gold-subtle);
  box-shadow: var(--glow-gold-sm);
}

.post-type-icon {
  font-size: 36px;
}

.post-type-title {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
}

.post-type-description {
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

/* Weekly Options */
.weekly-options {
  margin-top: var(--space-xl);
  padding: var(--space-lg);
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.week-length-selector {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.option-label {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-secondary);
}

.radio-group {
  display: flex;
  gap: var(--space-xl);
}

.radio-option {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  cursor: pointer;
  color: var(--text-primary);
  font-size: var(--text-base);
}

.radio-option input[type="radio"] {
  accent-color: var(--gold-primary);
  width: 18px;
  height: 18px;
}

.checkbox-option {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  cursor: pointer;
  color: var(--text-primary);
  font-size: var(--text-base);
}

.checkbox-option input[type="checkbox"] {
  accent-color: var(--gold-primary);
  width: 18px;
  height: 18px;
}

/* Menu Selection Section */
.menu-selection-section {
  margin-top: var(--space-lg);
}

/* Image Upload Section */
.image-upload-section {
  margin-bottom: var(--space-xl);
}

.image-upload-section .section-label {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-secondary);
  margin-bottom: var(--space-md);
}

.upload-button {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-2xl);
  background: var(--bg-secondary);
  border: 2px dashed var(--border-color);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: var(--transition-base);
}

.upload-button:hover {
  border-color: var(--gold-primary);
  background: var(--gold-subtle);
}

.upload-input {
  display: none;
}

.upload-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-sm);
  color: var(--text-secondary);
}

.upload-text {
  font-size: var(--text-base);
  font-weight: var(--font-medium);
  color: var(--text-primary);
}

.upload-hint {
  font-size: var(--text-xs);
  color: var(--text-muted);
}

.uploaded-image-preview {
  position: relative;
  width: 200px;
  height: 200px;
  border-radius: var(--radius-lg);
  overflow: hidden;
  border: 2px solid var(--gold-primary);
  box-shadow: var(--glow-gold-sm);
}

.uploaded-image-preview .preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-image-btn {
  position: absolute;
  top: var(--space-sm);
  right: var(--space-sm);
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.7);
  border: none;
  border-radius: var(--radius-full);
  color: var(--text-primary);
  cursor: pointer;
  transition: var(--transition-base);
}

.remove-image-btn:hover {
  background: var(--error-bg);
}

.upload-badge {
  position: absolute;
  bottom: var(--space-sm);
  right: var(--space-sm);
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--gold-primary);
  border-radius: var(--radius-full);
  color: var(--text-on-gold);
}

/* Divider */
.divider {
  display: flex;
  align-items: center;
  gap: var(--space-lg);
  margin: var(--space-xl) 0;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--border-color);
}

.divider-text {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

/* Weekly Menu Section */
.weekly-menu-section {
  margin-top: var(--space-lg);
}

.day-assignment-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.day-assignment-row {
  display: flex;
  align-items: center;
  gap: var(--space-lg);
  padding: var(--space-md);
  background: var(--bg-secondary);
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--radius-md);
}

.day-label {
  min-width: 100px;
  font-weight: var(--font-semibold);
  color: var(--text-primary);
}

.day-item-slot {
  flex: 1;
}

.selected-item-preview {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-sm);
  background: var(--gold-subtle);
  border: 1px solid var(--gold-primary);
  border-radius: var(--radius-md);
}

.item-thumbnail {
  width: 48px;
  height: 48px;
  object-fit: cover;
  border-radius: var(--radius-sm);
}

.item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.item-name {
  font-weight: var(--font-medium);
  color: var(--text-primary);
}

.item-price {
  font-size: var(--text-sm);
  color: var(--gold-primary);
}

.price-input-wrapper {
  margin-top: var(--space-xs);
}

.price-input {
  width: 100px;
  padding: var(--space-xs) var(--space-sm);
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-size: var(--text-sm);
  transition: var(--transition-fast);
}

.price-input:focus {
  outline: none;
  border-color: var(--gold-primary);
}

.price-input::placeholder {
  color: var(--text-muted);
}

.clear-btn {
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 24px;
  cursor: pointer;
  padding: var(--space-xs);
  transition: var(--transition-fast);
}

.clear-btn:hover {
  color: var(--error-text);
}

.select-dish-btn {
  width: 100%;
  padding: var(--space-md) var(--space-lg);
  background: var(--bg-tertiary);
  border: 2px dashed var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  font-size: var(--text-base);
  cursor: pointer;
  transition: var(--transition-base);
}

.select-dish-btn:hover {
  border-color: var(--gold-primary);
  color: var(--gold-primary);
  background: var(--gold-subtle);
}

.selection-count {
  margin-top: var(--space-lg);
  font-size: var(--text-sm);
  color: var(--text-muted);
  text-align: center;
}

/* Day Selector Modal */
.day-selector-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: var(--space-xl);
}

.day-selector-modal {
  background: var(--bg-secondary);
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--radius-xl);
  max-width: 800px;
  width: 100%;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-xl);
  border-bottom: 1px solid var(--border-color);
}

.modal-header h3 {
  font-family: var(--font-heading);
  font-size: var(--text-xl);
  color: var(--text-primary);
}

.modal-close-btn {
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 28px;
  cursor: pointer;
  padding: var(--space-xs);
  transition: var(--transition-fast);
}

.modal-close-btn:hover {
  color: var(--text-primary);
}

.modal-content {
  padding: var(--space-xl);
  overflow-y: auto;
}

.menu-items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: var(--space-lg);
}

.menu-item-card {
  background: var(--bg-tertiary);
  border: 2px solid var(--border-color);
  border-radius: var(--radius-md);
  overflow: hidden;
  cursor: pointer;
  transition: var(--transition-base);
}

.menu-item-card:hover {
  border-color: var(--gold-primary);
  transform: translateY(-2px);
}

.menu-item-image {
  width: 100%;
  height: 120px;
  object-fit: cover;
}

.menu-item-info {
  padding: var(--space-md);
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.menu-item-name {
  font-weight: var(--font-medium);
  color: var(--text-primary);
  font-size: var(--text-sm);
}

.menu-item-price {
  font-size: var(--text-sm);
  color: var(--gold-primary);
}

/* Responsive */
@media (max-width: 1024px) {
  .preview-content,
  .schedule-preview {
    grid-template-columns: 1fr;
  }

  .post-type-options {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .advanced-mode-creation {
    padding: var(--space-lg);
  }

  .step-card {
    padding: var(--space-lg);
  }

  .wizard-progress-track {
    flex-wrap: wrap;
    gap: var(--space-md);
  }

  .progress-step-wrapper {
    flex: none;
  }

  .progress-line {
    display: none;
  }

  .step-navigation {
    flex-direction: column;
  }
}

/* Publish Step Layout */
.publish-step {
  max-width: 800px;
  margin: 0 auto;
}

.publish-layout {
  display: flex;
  flex-direction: column;
  gap: var(--space-2xl);
}

.content-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
}

.image-preview-top {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.image-preview-top .preview-image-wrapper {
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-xl);
  border: 2px solid var(--gold-subtle);
  max-width: 400px;
}

.preview-image-large {
  width: 100%;
  max-height: 500px;
  object-fit: contain;
  display: block;
  background: var(--bg-secondary);
}

/* Platform Options */
/* Platform Cards Grid */
.platform-cards-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-md);
}

.platform-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-lg);
  background: var(--bg-secondary);
  border: 2px solid var(--border-color);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: var(--transition-base);
  text-align: center;
}

.platform-card:hover:not(.disabled) {
  border-color: var(--gold-primary);
  transform: translateY(-2px);
}

.platform-card.selected {
  border-color: var(--gold-primary);
  background: var(--gold-subtle);
  box-shadow: var(--glow-gold-sm);
}

.platform-card.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.platform-card-icon {
  color: var(--text-primary);
}

.platform-card.selected .platform-card-icon {
  color: var(--gold-primary);
}

.platform-card-name {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
}

.platform-status {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  font-size: var(--text-xs);
}

.platform-status.connected {
  color: var(--success-text);
}

.platform-status.not-connected {
  color: var(--text-muted);
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* Publish Options Grid */
.publish-options-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-md);
}

.publish-option-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-xl);
  background: var(--bg-secondary);
  border: 2px solid var(--border-color);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: var(--transition-base);
  text-align: center;
}

.publish-option-card:hover {
  border-color: var(--gold-primary);
  transform: translateY(-2px);
}

.publish-option-card.active {
  border-color: var(--gold-primary);
  background: var(--gold-subtle);
  box-shadow: var(--glow-gold-sm);
}

.publish-option-icon {
  color: var(--text-muted);
}

.publish-option-card.active .publish-option-icon {
  color: var(--gold-primary);
}

.publish-option-title {
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
}

.publish-option-desc {
  font-size: var(--text-xs);
  color: var(--text-muted);
}

.publish-option.active {
  border-color: var(--gold-primary);
  background: var(--gold-subtle);
}

.publish-option input {
  display: none;
}

.option-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.option-title {
  font-weight: var(--font-semibold);
  color: var(--text-primary);
}

.option-desc {
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

/* Schedule DateTime */
.schedule-datetime {
  margin-top: var(--space-md);
}

.datetime-inputs {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-lg);
}

.date-input,
.time-input {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

/* Success Alert */
.publish-success-alert {
  margin-bottom: var(--space-xl);
}

.success-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
}

.post-link {
  color: var(--gold-primary);
  font-weight: var(--font-semibold);
  text-decoration: none;
  transition: var(--transition-fast);
}

.post-link:hover {
  text-decoration: underline;
}

@media (max-width: 768px) {
  .publish-options-grid {
    grid-template-columns: 1fr;
  }

  .platform-cards-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .datetime-inputs {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .platform-cards-grid {
    grid-template-columns: 1fr;
  }
}

/* Customization Layout (Options + Preview at Bottom) */
.customization-layout {
  display: flex;
  flex-direction: column;
  gap: var(--space-2xl);
}

.options-panel {
  display: flex;
  flex-direction: column;
  gap: var(--space-2xl);
}

.preview-panel {
  padding: var(--space-xl);
  background: var(--bg-secondary);
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--radius-lg);
}

.preview-panel-label {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-secondary);
  margin-bottom: var(--space-md);
}

/* Weekly Customization Section */
.weekly-customization-section {
  margin-top: var(--space-2xl);
  padding-top: var(--space-2xl);
  border-top: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  gap: var(--space-2xl);
}

.customization-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.group-title {
  font-family: var(--font-heading);
  font-size: var(--text-xl);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
}

/* Layout Options Grid */
.layout-options-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--space-md);
}

.layout-option-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-xl);
  background: var(--glass-bg);
  border: 2px solid var(--border-color);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: var(--transition-base);
  text-align: center;
}

.layout-option-card:hover {
  border-color: var(--gold-primary);
  background: var(--gold-subtle);
  transform: translateY(-2px);
}

.layout-option-card.selected {
  border-color: var(--gold-primary);
  background: var(--gold-subtle);
  box-shadow: var(--glow-gold-sm);
}

.layout-icon {
  font-size: 32px;
}

.layout-label {
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
}

.layout-desc {
  font-size: var(--text-xs);
  color: var(--text-muted);
  line-height: 1.4;
}

/* Date Options */
.date-options-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
  padding: var(--space-lg);
  background: var(--glass-bg);
  border: var(--border-width) solid var(--glass-border);
  border-radius: var(--radius-md);
}

.toggle-option {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  cursor: pointer;
  color: var(--text-primary);
  font-size: var(--text-base);
}

.toggle-option input[type="checkbox"] {
  accent-color: var(--gold-primary);
  width: 18px;
  height: 18px;
}

.date-sub-options {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
  padding-left: var(--space-lg);
  border-left: 2px solid var(--gold-subtle);
}

.date-format-row {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.format-label {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-secondary);
}

.date-range-inputs {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.date-range-inputs .date-input {
  padding: var(--space-sm) var(--space-md);
  background: var(--bg-secondary);
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: var(--text-sm);
  transition: var(--transition-fast);
}

.date-range-inputs .date-input:focus {
  outline: none;
  border-color: var(--gold-primary);
}

.date-separator {
  color: var(--text-muted);
  font-size: var(--text-lg);
}

.format-options {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-lg);
}

.radio-option {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  cursor: pointer;
  color: var(--text-primary);
  font-size: var(--text-sm);
}

.radio-option input[type="radio"] {
  accent-color: var(--gold-primary);
  width: 16px;
  height: 16px;
}

.additional-date-options {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-lg);
}

/* Theme Options Grid */
.theme-options-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: var(--space-md);
}

.theme-option-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-lg);
  background: var(--glass-bg);
  border: 2px solid var(--border-color);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: var(--transition-base);
}

.theme-option-card:hover {
  border-color: var(--gold-primary);
  background: var(--gold-subtle);
}

.theme-option-card.selected {
  border-color: var(--gold-primary);
  background: var(--gold-subtle);
  box-shadow: var(--glow-gold-sm);
}

.theme-icon {
  font-size: 28px;
}

.theme-label {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  text-align: center;
}

.theme-option-card.selected .theme-label {
  color: var(--gold-primary);
  font-weight: var(--font-semibold);
}

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

/* Responsive for weekly customization */
@media (max-width: 768px) {
  .layout-options-grid {
    grid-template-columns: 1fr 1fr;
  }

  .theme-options-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .date-range-inputs {
    flex-direction: column;
    align-items: flex-start;
  }

  .date-separator {
    display: none;
  }

  .format-options,
  .additional-date-options {
    flex-direction: column;
    gap: var(--space-md);
  }
}

/* Success Modal */
.success-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: var(--space-xl);
}

.success-modal {
  position: relative;
  max-width: 500px;
  width: 100%;
  padding: var(--space-3xl);
  text-align: center;
  animation: modalSlideIn 0.3s var(--ease-smooth);
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.success-modal .modal-close-btn {
  position: absolute;
  top: var(--space-lg);
  right: var(--space-lg);
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-secondary);
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--radius-full);
  color: var(--text-secondary);
  cursor: pointer;
  transition: var(--transition-base);
}

.success-modal .modal-close-btn:hover {
  background: var(--bg-elevated);
  color: var(--text-primary);
}

.success-modal-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-xl);
}

.success-celebration {
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--gold-subtle);
  border-radius: var(--radius-full);
  animation: celebrationPulse 1.5s ease-in-out infinite;
}

@keyframes celebrationPulse {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(212, 175, 55, 0.4);
  }
  50% {
    transform: scale(1.05);
    box-shadow: 0 0 0 15px rgba(212, 175, 55, 0);
  }
}

.celebration-icon {
  color: var(--gold-primary);
  font-size: 48px;
}

.success-modal-title {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
  color: var(--text-primary);
  background: var(--gradient-gold);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.success-modal-message {
  font-size: var(--text-base);
  color: var(--text-secondary);
  max-width: 350px;
}

.success-image-preview {
  width: 100%;
  max-width: 300px;
  border-radius: var(--radius-lg);
  overflow: hidden;
  border: var(--border-width) solid var(--gold-primary);
  box-shadow: var(--glow-gold-sm);
}

.success-image-preview img {
  width: 100%;
  height: auto;
  display: block;
}

.published-links {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  margin-bottom: var(--space-lg);
}

.platform-link {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-md) var(--space-lg);
  background: var(--bg-tertiary);
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--gold-primary);
  text-decoration: none;
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  transition: var(--transition-base);
}

.platform-link:hover {
  background: var(--gold-subtle);
  border-color: var(--gold-primary);
}

.platform-link-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
}

.platform-link-icon svg {
  color: var(--gold-primary);
}

.success-modal-actions {
  display: flex;
  gap: var(--space-md);
  flex-wrap: wrap;
  justify-content: center;
}

.success-modal-actions .base-button {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

/* Modal Transition */
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s var(--ease-smooth);
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .success-modal,
.modal-leave-to .success-modal {
  transform: translateY(-20px) scale(0.95);
}
</style>
