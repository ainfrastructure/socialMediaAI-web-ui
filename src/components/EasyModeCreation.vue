<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import BaseCard from './BaseCard.vue'
import BaseButton from './BaseButton.vue'
import BaseAlert from './BaseAlert.vue'
import MaterialIcon from './MaterialIcon.vue'
import WizardProgress from './WizardProgress.vue'
import GoldenImageIcon from './icons/GoldenImageIcon.vue'
import GoldenVideoIcon from './icons/GoldenVideoIcon.vue'
import GoldenBlockIcon from './icons/GoldenBlockIcon.vue'
import GoldenSchoolIcon from './icons/GoldenSchoolIcon.vue'
import GoldenChristmasIcon from './icons/GoldenChristmasIcon.vue'
import GoldenEasterIcon from './icons/GoldenEasterIcon.vue'
import GoldenSummerIcon from './icons/GoldenSummerIcon.vue'
import GoldenHeartIcon from './icons/GoldenHeartIcon.vue'
import GoldenHalloweenIcon from './icons/GoldenHalloweenIcon.vue'
import GoldenThanksgivingIcon from './icons/GoldenThanksgivingIcon.vue'
import GoldenCelebrationIcon from './icons/GoldenCelebrationIcon.vue'
import GoldenEditIcon from './icons/GoldenEditIcon.vue'
import UnifiedSchedulePost from './UnifiedSchedulePost.vue'
import GeneratingProgress from './GeneratingProgress.vue'
import { ImageSourceSelector, SectionLabel, StyleTemplateGrid, ContentDivider } from './creation'
import { useFacebookStore } from '@/stores/facebook'
import { useInstagramStore } from '@/stores/instagram'
import { usePreferencesStore } from '@/stores/preferences'
import { useAuthStore } from '@/stores/auth'
import { useSocialAccounts } from '@/composables/useSocialAccounts'
import type { Brand } from '@/services/brandService'
import { debugLog } from '@/utils/debug'

interface MenuItem {
  name: string
  price?: string | number
  imageUrl?: string
  [key: string]: any
}

interface StyleTemplate {
  id: string
  name: string
  description: string
  icon: string
  preview: string
}

interface PublishResult {
  platform: string
  success: boolean
  url?: string
  error?: string
}

interface PublishResults {
  success: boolean
  platforms: PublishResult[]
}

const props = defineProps<{
  brand: Brand
  menuItems: MenuItem[]
  brandType?: string
  generating?: boolean
  animating?: boolean // When true, video is being generated from image (brief loading)
  videoGeneratingInBackground?: boolean // When true, video is generating in background (user can continue)
  generatedImageUrl?: string
  generatedVideoUrl?: string
  postText?: string
  hashtags?: string[]
  publishing?: boolean
  publishResults?: PublishResults | null
  error?: string | null
  initialScheduleDate?: string // Format: YYYY-MM-DD, pre-fills schedule date
  lockDate?: boolean // When true, date cannot be changed in the schedule step
}>()

const emit = defineEmits<{
  (e: 'back'): void
  (e: 'generate', data: {
    menuItem: MenuItem | null
    context: string
    styleTemplate: string
    customPrompt?: string
    strictnessMode: 'strict' | 'flexible' | 'creative'
    holidayTheme: string
    customHolidayText: string
    includeLogo: boolean
    uploadedImage: File | null
    uploadedLogo: File | null
    isExistingImage: boolean
    mediaType: 'image'
  }): void
  (e: 'animate', data: {
    videoOptions: {
      duration: 4 | 6 | 8
      aspectRatio: '16:9' | '9:16'
      generateAudio: boolean
    }
  }): void
  (e: 'publish', data: {
    platforms: string[]
    publishType: 'now' | 'schedule'
    scheduleDate?: string
    scheduleTime?: string
    timezone?: string
    postText?: string
    hashtags?: string[]
    accountSelections?: Record<string, any>
  }): void
  (e: 'feedback', feedbackText: string): void
  (e: 'reset'): void
}>()

const facebookStore = useFacebookStore()
const instagramStore = useInstagramStore()
const preferencesStore = usePreferencesStore()
const authStore = useAuthStore()
const { isConnected: _isConnected } = useSocialAccounts()
const { t } = useI18n()

// Wizard State
const currentStep = ref(1)
const totalSteps = 4

// State
const selectedMenuItem = ref<MenuItem | null>(null)
const promptContext = ref('')
const selectedStyleTemplate = ref<string>('behindTheScenes')
const customPrompt = ref<string>('')  // For custom style prompt
const strictnessMode = ref<'strict' | 'flexible' | 'creative'>('strict')
const holidayTheme = ref<string>('none')

// Animation state (for Step 3 - animate image to video)
const showAnimationOptions = ref(false)
const animationVideoDuration = ref<4 | 6 | 8>(4)
const animationVideoAspectRatio = ref<'16:9' | '9:16'>('9:16')
const animationIncludeAudio = ref(true)
const activeMediaType = ref<'image' | 'video'>('image') // Toggle between showing image or video
const customHolidayText = ref<string>('')
const includeLogo = ref(true)
const uploadedImage = ref<File | null>(null)
const uploadedImagePreview = ref<string | null>(null)
const isExistingImage = ref(false)

// Logo upload state
const uploadedLogo = ref<File | null>(null)
const uploadedLogoPreview = ref<string | null>(null)

// Video element refs for controlling playback
const previewVideoRef = ref<HTMLVideoElement | null>(null)
const publishVideoRef = ref<HTMLVideoElement | null>(null)

// Editable content state (local to preview, initialized from props)
const editedPostText = ref('')
const editedHashtags = ref<string[]>([])
const newHashtag = ref('')

// Inline feedback state
const feedbackText = ref('')

// Validation state
const step1Error = ref<string>('')

// Pagination for menu items
const currentPage = ref(1)
const itemsPerPage = ref(12)
const gridContainer = ref<HTMLElement | null>(null)
const step1NavigationRef = ref<HTMLElement | null>(null)
const generatingOverlayRef = ref<HTMLElement | null>(null)
const componentRoot = ref<HTMLElement | null>(null)

const templateKeyPrefix = computed(() => {
  if (props.brandType === 'resort') return 'playground.styleTemplatesResort'
  if (props.brandType === 'general') return 'playground.styleTemplatesGeneral'
  return 'playground.styleTemplates'
})

// Style templates (7 options) - Behind the Scenes is default
const styleTemplates = computed<StyleTemplate[]>(() => {
  const keyPrefix = templateKeyPrefix.value
  if (props.brandType === 'resort') {
    return [
      {
        id: 'resortSunset',
        name: t(`${keyPrefix}.resortSunset.name`),
        description: t(`${keyPrefix}.resortSunset.description`),
        icon: 'sunny',
        preview: t(`${keyPrefix}.resortSunset.preview`)
      },
      {
        id: 'resortPool',
        name: t(`${keyPrefix}.resortPool.name`),
        description: t(`${keyPrefix}.resortPool.description`),
        icon: 'pool',
        preview: t(`${keyPrefix}.resortPool.preview`)
      },
      {
        id: 'resortSuite',
        name: t(`${keyPrefix}.resortSuite.name`),
        description: t(`${keyPrefix}.resortSuite.description`),
        icon: 'hotel',
        preview: t(`${keyPrefix}.resortSuite.preview`)
      }
    ]
  }

  return [
    {
      id: 'behindTheScenes',
      name: t(`${keyPrefix}.behindTheScenes.name`),
      description: t(`${keyPrefix}.behindTheScenes.description`),
      icon: 'videocam',
      preview: t(`${keyPrefix}.behindTheScenes.preview`)
    },
    {
      id: 'cleanStrict',
      name: t(`${keyPrefix}.cleanStrict.name`),
      description: t(`${keyPrefix}.cleanStrict.description`),
      icon: 'photo_camera',
      preview: t(`${keyPrefix}.cleanStrict.preview`)
    },
    {
      id: 'zoomIn',
      name: t(`${keyPrefix}.zoomIn.name`),
      description: t(`${keyPrefix}.zoomIn.description`),
      icon: 'zoom_in',
      preview: t(`${keyPrefix}.zoomIn.preview`)
    },
    {
      id: 'oneBite',
      name: t(`${keyPrefix}.oneBite.name`),
      description: t(`${keyPrefix}.oneBite.description`),
      icon: 'restaurant',
      preview: t(`${keyPrefix}.oneBite.preview`)
    },
    {
      id: 'studioShot',
      name: t(`${keyPrefix}.studioShot.name`),
      description: t(`${keyPrefix}.studioShot.description`),
      icon: 'light',
      preview: t(`${keyPrefix}.studioShot.preview`)
    },
    {
      id: 'infographic',
      name: t(`${keyPrefix}.infographic.name`),
      description: t(`${keyPrefix}.infographic.description`),
      icon: 'schema',
      preview: t(`${keyPrefix}.infographic.preview`)
    },
    {
      id: 'placeOnTable',
      name: t(`${keyPrefix}.placeOnTable.name`),
      description: t(`${keyPrefix}.placeOnTable.description`),
      icon: 'dining',
      preview: t(`${keyPrefix}.placeOnTable.preview`)
    },
    {
      id: 'custom',
      name: t(`${keyPrefix}.custom.name`),
      description: t(`${keyPrefix}.custom.description`),
      icon: 'edit',
      preview: t(`${keyPrefix}.custom.preview`)
    }
  ]
})

const customPromptPlaceholder = computed(() => {
  if (props.brandType && props.brandType !== 'restaurant') {
    return t('easyMode.step2.customPromptGenericPlaceholder', 'Describe how you want the scene captured...')
  }
  return t('easyMode.step2.customPromptPlaceholder', 'Describe how you want your dish photographed...')
})

watch(
  () => props.brandType,
  () => {
    const availableIds = styleTemplates.value.map(template => template.id)
    if (!availableIds.includes(selectedStyleTemplate.value)) {
      selectedStyleTemplate.value = availableIds[0] || 'behindTheScenes'
    }
  },
  { immediate: true }
)

// Gold SVG icons for style templates
function _getStyleIcon(styleId: string): string {
  const goldGradient = `<defs><linearGradient id="goldGrad-${styleId}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#E5C775"/><stop offset="50%" style="stop-color:#D4AF37"/><stop offset="100%" style="stop-color:#B8943D"/></linearGradient></defs>`

  const icons: Record<string, string> = {
    behindTheScenes: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">${goldGradient}<path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" fill="url(#goldGrad-${styleId})"/></svg>`,
    cleanStrict: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">${goldGradient}<circle cx="12" cy="12" r="3.2" fill="url(#goldGrad-${styleId})"/><path d="M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z" fill="url(#goldGrad-${styleId})"/></svg>`,
    zoomIn: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">${goldGradient}<path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" fill="url(#goldGrad-${styleId})"/><path d="M12 10h-2v2H8v-2H6V8h2V6h2v2h2v2z" fill="url(#goldGrad-${styleId})"/></svg>`,
    oneBite: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">${goldGradient}<path d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z" fill="url(#goldGrad-${styleId})"/></svg>`,
    studioShot: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">${goldGradient}<path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7zm2.85 11.1l-.85.6V16h-4v-2.3l-.85-.6C7.8 12.16 7 10.63 7 9c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.63-.8 3.16-2.15 4.1z" fill="url(#goldGrad-${styleId})"/></svg>`,
    infographic: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">${goldGradient}<path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" fill="url(#goldGrad-${styleId})"/></svg>`,
    placeOnTable: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">${goldGradient}<path d="M20 3H4c-1.1 0-2 .9-2 2v2c0 1.1.9 2 2 2h1v9c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V9h1c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-9 12H9v-5h2v5zm4 0h-2v-5h2v5zM4 7V5h16v2H4z" fill="url(#goldGrad-${styleId})"/></svg>`,
    custom: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">${goldGradient}<path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="url(#goldGrad-${styleId})"/></svg>`
  }

  return icons[styleId] || icons.behindTheScenes
}

// Computed
const paginatedMenuItems = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return props.menuItems.slice(start, end)
})

const totalPages = computed(() => {
  return Math.ceil(props.menuItems.length / itemsPerPage.value)
})

const canGenerate = computed(() => {
  const hasSelection = selectedMenuItem.value !== null || uploadedImage.value !== null
  const hasCredits = authStore.canGenerateContent
  return hasSelection && hasCredits
})

const outOfCredits = computed(() => !authStore.canGenerateContent)

// Check if has logo (existing or uploaded)
const hasLogo = computed(() => {
  return props.brand.brand_dna?.logo_url || uploadedLogoPreview.value
})

// Get current logo URL (uploaded preview takes priority)
const currentLogoUrl = computed(() => {
  return uploadedLogoPreview.value || props.brand.brand_dna?.logo_url
})

// Step labels for progress indicator
const stepLabels = computed(() => [
  { number: 1, label: t('easyMode.steps.menu', 'Menu') },
  { number: 2, label: t('easyMode.steps.customize', 'Customize') },
  { number: 3, label: t('easyMode.steps.preview', 'Preview') },
  { number: 4, label: t('easyMode.steps.publish', 'Publish') }
])

// Track highest completed step to control navigation
const highestCompletedStep = computed(() => {
  // Step 1 complete: menu item selected OR image uploaded
  if (!selectedMenuItem.value && !uploadedImagePreview.value) return 0

  // Step 2 is accessible once step 1 is complete (style always has default)
  // Step 3 complete: image OR video generated
  const hasMedia = props.generatedImageUrl || props.generatedVideoUrl
  if (!hasMedia) return 1

  // Step 4 accessible after generation
  return 3
})

// Dynamic items per page calculation
function calculateItemsPerPage() {
  if (!gridContainer.value) return

  // On mobile (< 480px), limit to 6 items to reduce scrolling
  const isMobile = window.innerWidth < 480
  if (isMobile) {
    itemsPerPage.value = 6
    return
  }

  const containerWidth = gridContainer.value.offsetWidth
  const containerHeight = window.innerHeight - gridContainer.value.getBoundingClientRect().top - 250 // Reserve space for pagination and other elements

  // Grid settings from CSS
  const minCardWidth = 180 // matches CSS minmax(180px, 1fr)
  const gap = 16 // var(--space-lg) = 16px

  // Calculate columns that fit
  const columns = Math.floor((containerWidth + gap) / (minCardWidth + gap))

  // Card has aspect ratio 1:1 for image + additional height for text
  // Estimate total card height: image (180px) + padding (32px) + text (~60px) = ~272px
  const estimatedCardHeight = 272

  // Calculate rows that fit
  const rows = Math.max(2, Math.floor((containerHeight + gap) / (estimatedCardHeight + gap)))

  // Calculate total items
  const calculatedItems = columns * rows

  // Set bounds: minimum 8, maximum 20
  itemsPerPage.value = Math.max(8, Math.min(20, calculatedItems))
}

// Methods
function selectMenuItem(item: MenuItem) {
  selectedMenuItem.value = item
  step1Error.value = '' // Clear error when item is selected
  // Clear uploaded image if menu item is selected
  uploadedImage.value = null
  uploadedImagePreview.value = null
  isExistingImage.value = false
  // Scroll to next button for better mobile UX
  nextTick(() => {
    step1NavigationRef.value?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  })
}

function _selectStyleTemplate(templateId: string) {
  selectedStyleTemplate.value = templateId
}

// Handler for ImageSourceSelector (receives File + source info)
function handleImageUploadFile(data: { file: File; source: 'upload' | 'library' }) {
  // Clear menu item selection if image is uploaded
  selectedMenuItem.value = null
  step1Error.value = '' // Clear error when image is uploaded

  uploadedImage.value = data.file
  isExistingImage.value = data.source === 'library'

  // Create preview
  const reader = new FileReader()
  reader.onload = (e) => {
    uploadedImagePreview.value = e.target?.result as string
  }
  reader.readAsDataURL(data.file)
}

function _handleImageUpload(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (file) {
    handleImageUploadFile({ file, source: 'upload' })
  }
}

function removeUploadedImage() {
  uploadedImage.value = null
  uploadedImagePreview.value = null
  isExistingImage.value = false
}

// Handle logo upload
function handleLogoUpload(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (file) {
    uploadedLogo.value = file

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      uploadedLogoPreview.value = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }
}

function removeUploadedLogo() {
  uploadedLogo.value = null
  uploadedLogoPreview.value = null
}

function nextPage() {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
  }
}

function prevPage() {
  if (currentPage.value > 1) {
    currentPage.value--
  }
}

function handleGenerate() {
  if (!selectedMenuItem.value && !uploadedImage.value) return

  // Stay on Step 2 - will auto-advance when generation completes
  // Always generate image first - video can be created later via "Animate Image" in Step 3
  emit('generate', {
    menuItem: selectedMenuItem.value,
    context: promptContext.value.trim(),
    styleTemplate: selectedStyleTemplate.value,
    customPrompt: selectedStyleTemplate.value === 'custom' ? customPrompt.value.trim() : undefined,
    strictnessMode: strictnessMode.value,
    holidayTheme: holidayTheme.value,
    customHolidayText: customHolidayText.value,
    includeLogo: includeLogo.value,
    uploadedImage: uploadedImage.value,
    uploadedLogo: uploadedLogo.value,
    isExistingImage: isExistingImage.value,
    mediaType: 'image' // Always generate image first
  })
}

// Watch for generation start to scroll loader into view
watch(() => props.generating, (isGenerating) => {
  if (isGenerating) {
    // Use setTimeout to ensure DOM is fully rendered after v-if becomes true
    setTimeout(() => {
      generatingOverlayRef.value?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 100)
  }
})

// Watch for generation complete to auto-advance to Step 3
watch(() => [props.generating, props.generatedImageUrl, props.generatedVideoUrl, props.postText], ([generating, imageUrl, videoUrl, postText]) => {
  // When generating finishes AND we have media (image or video) and text, advance to Step 3
  const hasMedia = imageUrl || videoUrl
  if (!generating && hasMedia && postText && currentStep.value === 2) {
    currentStep.value = 3
  }
})

// Watch for video URL to know when animation is complete
watch(() => props.generatedVideoUrl, (newUrl) => {
  if (newUrl) {
    showAnimationOptions.value = false
    activeMediaType.value = 'video' // Switch to show the new video
  }
})

// Handle animate image to video
function handleAnimateImage() {
  if (!props.generatedImageUrl || props.animating) return

  showAnimationOptions.value = false

  emit('animate', {
    videoOptions: {
      duration: animationVideoDuration.value,
      aspectRatio: animationVideoAspectRatio.value,
      generateAudio: animationIncludeAudio.value
    }
  })
}

function handlePublish(data: {
  platforms: string[]
  publishType: 'now' | 'schedule'
  scheduledDate?: string
  scheduledTime?: string
  timezone?: string
  accountSelections?: Record<string, any>
}) {
  emit('publish', {
    platforms: data.platforms,
    publishType: data.publishType,
    scheduleDate: data.scheduledDate,
    scheduleTime: data.scheduledTime,
    timezone: data.timezone,
    postText: editedPostText.value,
    hashtags: editedHashtags.value,
    accountSelections: data.accountSelections
  })
}

function resetAndCreateNew() {
  // Reset all state
  currentStep.value = 1
  selectedMenuItem.value = null
  promptContext.value = ''
  selectedStyleTemplate.value = 'behindTheScenes'
  customPrompt.value = ''
  includeLogo.value = true
  uploadedImage.value = null
  uploadedImagePreview.value = null
  isExistingImage.value = false
  uploadedLogo.value = null
  uploadedLogoPreview.value = null
  step1Error.value = ''
  currentPage.value = 1
  editedPostText.value = ''
  editedHashtags.value = []
  newHashtag.value = ''

  // Reset animation state
  showAnimationOptions.value = false
  animationVideoDuration.value = 4
  animationVideoAspectRatio.value = '9:16'
  animationIncludeAudio.value = true
  activeMediaType.value = 'image'

  // Clear flow state for mode switching
  preferencesStore.clearFlowState()

  // Emit reset event to parent
  emit('reset')
}

// Helper function to scroll to top of component (works in scrollable containers)
function scrollToComponentTop() {
  nextTick(() => {
    // First try to scroll the component into view (works in scrollable containers like DashboardLayout)
    if (componentRoot.value) {
      componentRoot.value.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    // Also try window scroll as fallback
    window.scrollTo({ top: 0, behavior: 'smooth' })
  })
}

// Step navigation
function nextStep() {
  // Validate step 1: image is required
  if (currentStep.value === 1) {
    if (!selectedMenuItem.value && !uploadedImage.value) {
      step1Error.value = t('easyMode.step1.imageRequired', 'Please select a menu item or upload an image to continue')
      return
    }
    step1Error.value = ''
  }

  // Step 3 -> 4: Emit feedback if provided, then continue to publish options
  if (currentStep.value === 3) {
    debugLog('[EasyMode] Step 3 -> 4, emitting feedback:', feedbackText.value)
    if (feedbackText.value.trim()) {
      emit('feedback', feedbackText.value.trim())
    }
  }

  if (currentStep.value < totalSteps) {
    currentStep.value++
    // Scroll to top of component to ensure user starts at the top
    scrollToComponentTop()
  }
}

function prevStep() {
  if (currentStep.value > 1) {
    currentStep.value--
    // Scroll to top when going back too
    scrollToComponentTop()
  }
}

// Expose functions and state so parent can call them
defineExpose({
  currentStep,
  prevStep
})

function goToStep(step: number) {
  // Only allow navigation to completed steps or next available step
  if (step >= 1 && step <= highestCompletedStep.value + 1 && step <= totalSteps) {
    currentStep.value = step
  }
}

// Initialize edited content when entering Step 3 for the first time (not when going back from step 4)
watch(() => currentStep.value, (newStep, oldStep) => {
  // Only initialize when coming from step 2 (forward), not from step 4 (backward)
  if (newStep === 3 && oldStep === 2) {
    editedPostText.value = props.postText || ''
    // Strip any leading # from hashtags when setting from props
    editedHashtags.value = (props.hashtags || []).map(tag => tag.replace(/^#/, ''))
    newHashtag.value = ''
  }

  // Pause any playing videos when changing steps
  if (previewVideoRef.value) {
    previewVideoRef.value.pause()
  }
  if (publishVideoRef.value) {
    publishVideoRef.value.pause()
  }
})

// Also update when props change while on step 3 (and edited content is empty)
watch(() => [props.postText, props.hashtags], () => {
  if (currentStep.value === 3 && !editedPostText.value && props.postText) {
    editedPostText.value = props.postText
    // Strip any leading # from hashtags when setting from props
    editedHashtags.value = (props.hashtags || []).map(tag => tag.replace(/^#/, ''))
  }
})

// Track flow started state - mark as started when user takes any meaningful action
watch([selectedMenuItem, uploadedImage, promptContext], ([menuItem, image, context]) => {
  if (menuItem || image || context) {
    preferencesStore.markFlowStarted()
  }
})

// Helper function to capitalize first letter of platform name
function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

// Computed for successful and failed platforms
const successfulPlatforms = computed(() => {
  if (!props.publishResults?.platforms) return []
  return props.publishResults.platforms.filter(p => p.success)
})

const failedPlatforms = computed(() => {
  if (!props.publishResults?.platforms) return []
  return props.publishResults.platforms.filter(p => !p.success)
})

// Hashtag management functions
function addHashtag() {
  const tag = newHashtag.value.trim().replace(/^#/, '')
  if (tag && !editedHashtags.value.includes(tag)) {
    editedHashtags.value.push(tag)
    newHashtag.value = ''
  }
}

function removeHashtag(index: number) {
  editedHashtags.value.splice(index, 1)
}

function handleHashtagKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter') {
    event.preventDefault()
    addHashtag()
  }
}

// Lifecycle hooks
onMounted(async () => {
  // Calculate initial items per page
  setTimeout(() => {
    calculateItemsPerPage()
  }, 100) // Small delay to ensure DOM is fully rendered

  // Add resize listener
  window.addEventListener('resize', calculateItemsPerPage)

  // Load social accounts to check connection status
  await Promise.all([
    facebookStore.loadConnectedPages(),
    instagramStore.loadConnectedAccounts()
  ])
})

onUnmounted(() => {
  // Cleanup resize listener
  window.removeEventListener('resize', calculateItemsPerPage)
})
</script>

<template>
  <div ref="componentRoot" class="easy-mode-creation">
    <!-- Progress Indicator - Reusable Component -->
    <WizardProgress
      :current-step="currentStep"
      :step-labels="stepLabels"
      :highest-completed-step="highestCompletedStep"
      @navigate="goToStep"
    />

    <!-- Step 1: Menu Item Selection or Image Upload -->
    <BaseCard v-show="currentStep === 1" variant="glass" class="step-card">
      <div class="step-header">
        <div class="step-info">
          <h3 class="step-title">{{ t('easyMode.step1.title', 'Pick Your Dish or Upload Image') }}</h3>
          <p class="step-subtitle">{{ t('easyMode.step1.subtitle', 'Choose a menu item or upload your own image') }}</p>
          <p class="step-description">{{ t('easyMode.step1.description', 'An image is required to create your post. Select a dish from your menu or upload your own photo.') }}</p>
        </div>
      </div>

      <!-- Error Alert -->
      <BaseAlert v-if="step1Error" type="error" :dismissible="false" class="step-error">
        {{ step1Error }}
      </BaseAlert>

      <!-- Image Source Selection (Upload or Browse Existing) -->
      <div class="image-upload-section">
        <ImageSourceSelector
          :entity="props.brand"
          :preview-url="uploadedImagePreview"
          @select="handleImageUploadFile"
          @remove="removeUploadedImage"
        />
      </div>

      <!-- Divider -->
      <ContentDivider v-if="menuItems.length > 0" text="OR" />

      <!-- Menu Items Grid with Pagination -->
      <div v-if="menuItems.length > 0">
        <div ref="gridContainer" class="menu-items-grid-easy">
          <div
            v-for="(item, index) in paginatedMenuItems"
            :key="index"
            :class="['menu-item-card-easy', { 'selected': selectedMenuItem === item }]"
            @click="selectMenuItem(item)"
          >
            <div class="menu-item-image-wrapper">
              <img
                v-if="item.imageUrl"
                :src="item.imageUrl"
                :alt="item.name"
                class="menu-item-image"
              />
              <div v-else class="menu-item-placeholder">
                <MaterialIcon icon="restaurant" size="xl" :color="'var(--text-muted)'" />
              </div>
            </div>

            <div class="menu-item-details">
              <h4 class="menu-item-name">{{ item.name }}</h4>
              <p v-if="item.price" class="menu-item-price">{{ item.price }}</p>
            </div>

            <div v-if="selectedMenuItem === item" class="selected-badge">
              <MaterialIcon icon="check_circle" size="sm" :color="'var(--text-on-gold)'" />
            </div>
          </div>
        </div>

        <!-- Pagination Controls -->
        <div v-if="totalPages > 1" class="pagination-controls">
          <button
            class="pagination-btn"
            :disabled="currentPage === 1"
            @click="prevPage"
          >
            ← Previous
          </button>
          <span class="pagination-info">
            Page {{ currentPage }} of {{ totalPages }}
          </span>
          <button
            class="pagination-btn"
            :disabled="currentPage === totalPages"
            @click="nextPage"
          >
            Next →
          </button>
        </div>
      </div>

      <div v-else-if="!uploadedImage" class="empty-state">
        <p class="empty-text">{{ t('easyMode.step1.empty', 'No menu items available. Upload an image to continue.') }}</p>
      </div>

      <!-- Step 1 Navigation -->
      <div ref="step1NavigationRef" class="step-navigation">
        <BaseButton
          variant="primary"
          size="large"
          @click="nextStep"
          class="next-button"
        >
          {{ t('easyMode.step1.nextButton', 'Customize Post') }}
        </BaseButton>
      </div>
    </BaseCard>

    <!-- Step 2: Customize (Style + Promo + Logo) -->
    <BaseCard v-show="currentStep === 2" variant="glass" class="step-card generate-section">
      <!-- Generating Loading State with Progress -->
      <div v-if="props.generating" ref="generatingOverlayRef">
        <GeneratingProgress :active="props.generating" :estimated-duration="20" />
      </div>

      <!-- Normal customization form -->
      <template v-else>
        <div class="step-header">
          <div class="step-info">
            <h3 class="step-title">{{ t('easyMode.step2.title', 'Customize Your Post') }}</h3>
            <p class="step-subtitle">{{ t('easyMode.step2.subtitle', 'Choose style, add promotions, and branding') }}</p>
          </div>
        </div>

        <!-- Style Selection -->
      <div class="customization-section">
        <SectionLabel icon="palette">{{ t('easyMode.step2.styleLabel', 'Visual Style') }}</SectionLabel>
        <StyleTemplateGrid
          v-model="selectedStyleTemplate"
          :templates="styleTemplates"
        />
        <!-- Custom Prompt Input (shown when 'custom' style is selected) -->
        <div v-if="selectedStyleTemplate === 'custom'" class="custom-prompt-section">
          <textarea
            v-model="customPrompt"
            :placeholder="customPromptPlaceholder"
            class="custom-prompt-input"
            rows="4"
          ></textarea>
        </div>
      </div>

      <!-- Holiday/Inspired Theme -->
      <div class="customization-section">
        <SectionLabel icon="celebration">{{ t('advancedMode.holidayTheme.label', 'Theme / Inspiration') }}</SectionLabel>
        <p class="section-hint">{{ t('advancedMode.holidayTheme.hint', 'Add a seasonal or themed style to your image') }}</p>
        <div class="holiday-theme-options">
          <button
            :class="['holiday-theme-button', { 'selected': holidayTheme === 'none' }]"
            @click="holidayTheme = 'none'"
          >
            <GoldenBlockIcon :size="24" class="holiday-icon" />
            <span class="holiday-label">{{ t('weeklyCustomization.themes.none', 'None') }}</span>
          </button>
          <button
            :class="['holiday-theme-button', { 'selected': holidayTheme === 'studentWeek' }]"
            @click="holidayTheme = 'studentWeek'"
          >
            <GoldenSchoolIcon :size="24" class="holiday-icon" />
            <span class="holiday-label">{{ t('weeklyCustomization.themes.studentWeek', 'Student') }}</span>
          </button>
          <button
            :class="['holiday-theme-button', { 'selected': holidayTheme === 'christmas' }]"
            @click="holidayTheme = 'christmas'"
          >
            <GoldenChristmasIcon :size="24" class="holiday-icon" />
            <span class="holiday-label">{{ t('weeklyCustomization.themes.christmas', 'Christmas') }}</span>
          </button>
          <button
            :class="['holiday-theme-button', { 'selected': holidayTheme === 'easter' }]"
            @click="holidayTheme = 'easter'"
          >
            <GoldenEasterIcon :size="24" class="holiday-icon" />
            <span class="holiday-label">{{ t('weeklyCustomization.themes.easter', 'Easter') }}</span>
          </button>
          <button
            :class="['holiday-theme-button', { 'selected': holidayTheme === 'summer' }]"
            @click="holidayTheme = 'summer'"
          >
            <GoldenSummerIcon :size="24" class="holiday-icon" />
            <span class="holiday-label">{{ t('weeklyCustomization.themes.summer', 'Summer') }}</span>
          </button>
          <button
            :class="['holiday-theme-button', { 'selected': holidayTheme === 'valentines' }]"
            @click="holidayTheme = 'valentines'"
          >
            <GoldenHeartIcon :size="24" class="holiday-icon" />
            <span class="holiday-label">{{ t('weeklyCustomization.themes.valentines', 'Valentine') }}</span>
          </button>
          <button
            :class="['holiday-theme-button', { 'selected': holidayTheme === 'halloween' }]"
            @click="holidayTheme = 'halloween'"
          >
            <GoldenHalloweenIcon :size="24" class="holiday-icon" />
            <span class="holiday-label">{{ t('weeklyCustomization.themes.halloween', 'Halloween') }}</span>
          </button>
          <button
            :class="['holiday-theme-button', { 'selected': holidayTheme === 'thanksgiving' }]"
            @click="holidayTheme = 'thanksgiving'"
          >
            <GoldenThanksgivingIcon :size="24" class="holiday-icon" />
            <span class="holiday-label">{{ t('weeklyCustomization.themes.thanksgiving', 'Thanks') }}</span>
          </button>
          <button
            :class="['holiday-theme-button', { 'selected': holidayTheme === 'newYear' }]"
            @click="holidayTheme = 'newYear'"
          >
            <GoldenCelebrationIcon :size="24" class="holiday-icon" />
            <span class="holiday-label">{{ t('weeklyCustomization.themes.newYear', 'New Year') }}</span>
          </button>
          <button
            :class="['holiday-theme-button', { 'selected': holidayTheme === 'custom' }]"
            @click="holidayTheme = 'custom'"
          >
            <GoldenEditIcon :size="24" class="holiday-icon" />
            <span class="holiday-label">{{ t('weeklyCustomization.themes.custom', 'Custom') }}</span>
          </button>
        </div>
        <div v-if="holidayTheme === 'custom'" class="custom-theme-input-wrapper">
          <input
            type="text"
            v-model="customHolidayText"
            class="custom-theme-text-input"
            :placeholder="t('advancedMode.holidayTheme.customPlaceholder', 'e.g., Spring Festival, Local Event...')"
            maxlength="50"
          />
        </div>
      </div>

      <!-- Campaign Context / Promo -->
      <div class="customization-section">
        <SectionLabel icon="auto_awesome">{{ t('easyMode.step2.promoLabel', 'Special Offer (Optional)') }}</SectionLabel>
        <input
          id="context-input"
          v-model="promptContext"
          type="text"
          class="context-input-easy"
          :placeholder="t('easyMode.step2.promoPlaceholder', 'e.g., 20% OFF, COMBO DEAL, NEW ITEM...')"
          maxlength="50"
        />
        <p class="input-note">
          {{ promptContext.length }}/50 {{ t('common.characters', 'characters') }}
        </p>
      </div>

      <!-- Logo Section -->
      <div class="customization-section">
        <SectionLabel icon="label">{{ t('easyMode.step2.logoLabel', 'Restaurant Logo') }}</SectionLabel>

        <div class="logo-management">
          <!-- Current Logo Preview -->
          <div v-if="currentLogoUrl" class="current-logo">
            <div class="logo-preview-container">
              <img :src="currentLogoUrl" :alt="brand.name" class="logo-preview-image" />
              <button
                v-if="uploadedLogoPreview"
                class="remove-logo-btn"
                @click="removeUploadedLogo"
                :title="t('easyMode.step2.removeLogo', 'Remove uploaded logo')"
              >
            <MaterialIcon icon="close" size="sm" :color="'var(--text-primary)'" />              </button>
            </div>
            <span class="logo-status">
              {{ uploadedLogoPreview ? t('easyMode.step2.newLogo', 'New logo') : t('easyMode.step2.currentLogo', 'Current logo') }}
            </span>
          </div>

          <!-- Upload New Logo -->
          <label class="upload-logo-btn">
            <input
              type="file"
              accept="image/*"
              @change="handleLogoUpload"
              class="upload-input"
            />
            <span class="upload-logo-content">
              <MaterialIcon icon="upload" size="md" :color="'var(--text-primary)'" />
              <span class="upload-logo-text">
                {{ currentLogoUrl ? t('easyMode.step2.changeLogo', 'Change logo') : t('easyMode.step2.uploadLogo', 'Upload logo') }}
              </span>
            </span>
          </label>

          <!-- Include Logo Toggle -->
          <label v-if="hasLogo" class="checkbox-label-easy">
            <input
              type="checkbox"
              v-model="includeLogo"
              class="checkbox-input-easy"
            />
            <span class="checkbox-text">
              <span>{{ t('easyMode.step2.includeLogo', 'Include logo on image') }}</span>
            </span>
          </label>
        </div>
      </div>

        <!-- Out of Credits Alert -->
        <BaseAlert v-if="outOfCredits" type="warning" class="credits-warning">
          {{ t('easyMode.step2.outOfCredits', 'You are out of credits. Please upgrade your plan to generate more content.') }}
        </BaseAlert>

        <!-- Step 2 Navigation -->
        <div class="step-navigation">
          <BaseButton
            variant="secondary"
            size="large"
            @click="prevStep"
            class="prev-button"
          >
            {{ t('common.back', 'Back') }}
          </BaseButton>
          <BaseButton
            variant="primary"
            size="large"
            :disabled="!canGenerate"
            @click="handleGenerate"
            class="next-button"
          >
            {{ t('easyMode.step2.generateButton', 'Generate Image') }}
          </BaseButton>
        </div>
      </template>
    </BaseCard>

    <!-- Step 3: Preview Generated Content -->
    <BaseCard v-show="currentStep === 3" variant="glass" class="step-card">
      <div class="step-header">
        <div class="step-info">
          <h3 class="step-title">{{ t('easyMode.step3.title', 'Preview Your Post') }}</h3>
          <p class="step-subtitle">{{ t('easyMode.step3.subtitle', 'Review your generated content') }}</p>
        </div>
      </div>

      <!-- Generated Content Preview -->
      <div class="preview-section">
        <!-- Consistent Layout: Image top, Content bottom -->
        <div class="preview-content">
          <!-- Generated Media -->
          <div class="preview-image-container">
            <!-- Loading State for Media -->
            <div v-if="props.generating && !props.generatedImageUrl && !props.generatedVideoUrl" class="image-loading">
              <GeneratingProgress
                :active="props.generating"
                :estimated-duration="20"
              />
            </div>
            <!-- Animation Loading State -->
            <div v-else-if="props.animating" class="image-loading">
              <GeneratingProgress
                :active="props.animating"
                :estimated-duration="120"
              />
            </div>
            <!-- Generated Video (when ready AND selected) -->
            <video
              ref="previewVideoRef"
              v-else-if="props.generatedVideoUrl && activeMediaType === 'video'"
              :src="props.generatedVideoUrl"
              controls
              autoplay
              muted
              loop
              preload="metadata"
              playsinline
              class="preview-video-display"
            >
              {{ t('common.videoNotSupported', 'Your browser does not support the video tag.') }}
            </video>
            <!-- Generated Image (when ready AND selected, or when video not available) -->
            <img v-else-if="props.generatedImageUrl" :src="props.generatedImageUrl" alt="Generated post image" class="preview-image-display" />
          </div>

          <!-- Media Type Toggle (shows when both image and video are available) -->
          <div v-if="props.generatedImageUrl && props.generatedVideoUrl" class="media-toggle-container">
            <div class="media-toggle">
              <button
                :class="['media-toggle-button', { 'active': activeMediaType === 'image' }]"
                @click="activeMediaType = 'image'"
              >
                <GoldenImageIcon :size="20" />
                <span>{{ t('easyMode.step3.showImage') }}</span>
              </button>
              <button
                :class="['media-toggle-button', { 'active': activeMediaType === 'video' }]"
                @click="activeMediaType = 'video'"
              >
                <GoldenVideoIcon :size="20" />
                <span>{{ t('easyMode.step3.showVideo') }}</span>
              </button>
            </div>
          </div>

          <!-- Video Generating in Background Banner -->
          <div v-if="props.videoGeneratingInBackground && !props.generatedVideoUrl" class="video-background-banner">
            <div class="banner-icon">
              <div class="spinner-small"></div>
            </div>
            <div class="banner-content">
              <span class="banner-title">{{ t('easyMode.step3.videoGeneratingTitle', 'Video generating...') }}</span>
              <span class="banner-subtitle">{{ t('easyMode.step3.videoGeneratingSubtitle', 'You can post the image now. Video will be ready soon.') }}</span>
            </div>
          </div>

          <!-- Animate Image Button (shows after image is generated, before video exists, and not already generating) -->
          <div v-if="props.generatedImageUrl && !props.generatedVideoUrl && !props.animating && !props.videoGeneratingInBackground && !showAnimationOptions" class="animate-image-section">
            <button
              class="animate-image-button"
              @click="showAnimationOptions = true"
            >
              <GoldenVideoIcon :size="24" />
              <span class="animate-button-text">{{ t('easyMode.step3.animateImage') }}</span>
              <span class="animate-credits-badge">{{ t('easyMode.step3.animateCredits') }}</span>
            </button>
          </div>

          <!-- Animation Options Panel (expandable) -->
          <div v-if="showAnimationOptions && !props.animating && !props.videoGeneratingInBackground && !props.generatedVideoUrl" class="animation-options-panel">
            <div class="animation-options-header">
              <h4 class="animation-options-title">{{ t('easyMode.step3.animationOptionsTitle') }}</h4>
              <button class="close-animation-options" @click="showAnimationOptions = false">
                <MaterialIcon icon="close" size="sm" />
              </button>
            </div>

            <!-- Duration Selection -->
            <div class="video-option-group">
              <label class="video-option-label">{{ t('easyMode.step2.durationLabel') }}</label>
              <div class="duration-options">
                <button
                  v-for="duration in [4, 6, 8]"
                  :key="duration"
                  :class="['duration-button', { 'selected': animationVideoDuration === duration }]"
                  @click="animationVideoDuration = duration as 4 | 6 | 8"
                >
                  {{ duration }}{{ t('easyMode.step2.seconds') }}
                </button>
              </div>
              <p v-if="animationVideoDuration > 4" class="duration-warning">
                {{ t('easyMode.step2.durationWarning', 'Longer videos take more time to generate and may fail during high demand.') }}
              </p>
            </div>

            <!-- Aspect Ratio Selection -->
            <div class="video-option-group">
              <label class="video-option-label">{{ t('easyMode.step2.aspectRatioLabel') }}</label>
              <div class="aspect-ratio-options">
                <button
                  :class="['aspect-ratio-button', { 'selected': animationVideoAspectRatio === '9:16' }]"
                  @click="animationVideoAspectRatio = '9:16'"
                >
                  <MaterialIcon icon="stay_current_portrait" size="md" />
                  <span>9:16</span>
                  <span class="aspect-hint">{{ t('easyMode.step2.portrait') }}</span>
                </button>
                <button
                  :class="['aspect-ratio-button', { 'selected': animationVideoAspectRatio === '16:9' }]"
                  @click="animationVideoAspectRatio = '16:9'"
                >
                  <MaterialIcon icon="stay_current_landscape" size="md" />
                  <span>16:9</span>
                  <span class="aspect-hint">{{ t('easyMode.step2.landscape') }}</span>
                </button>
              </div>
            </div>

            <!-- Audio Toggle -->
            <div class="video-option-group">
              <label class="checkbox-label-easy">
                <input
                  type="checkbox"
                  v-model="animationIncludeAudio"
                  class="checkbox-input-easy"
                />
                <span class="checkbox-text">
                  <span>{{ t('easyMode.step2.includeAudio') }}</span>
                </span>
              </label>
            </div>

            <!-- Generate Video Button -->
            <BaseButton
              variant="primary"
              size="large"
              class="generate-animation-button"
              @click="handleAnimateImage"
            >
              <GoldenVideoIcon :size="20" />
              {{ t('easyMode.step3.generateVideoFromImage') }} - {{ t('easyMode.step3.generateVideoCredits') }}
            </BaseButton>
          </div>

          <!-- Post Content - Editable -->
          <div class="preview-post-content">
            <h4 class="preview-content-label">{{ t('playground.postContentTitle', 'Post Content') }}</h4>

            <!-- Editable Post Text -->
            <div class="preview-text-section">
              <label class="preview-label">{{ t('posts.postText', 'Post Text') }}</label>
              <textarea
                v-model="editedPostText"
                class="editable-textarea"
                :placeholder="t('easyMode.step3.editPostText', 'Edit your post text')"
                rows="4"
              ></textarea>
            </div>

            <!-- Editable Hashtags -->
            <div class="preview-text-section">
              <label class="preview-label">{{ t('posts.hashtags', 'Hashtags') }}</label>
              <div class="editable-hashtags">
                <div class="hashtag-chips">
                  <span
                    v-for="(tag, index) in editedHashtags"
                    :key="index"
                    class="hashtag-chip"
                  >
                    #{{ tag }}
                    <button
                      type="button"
                      class="remove-hashtag"
                      @click="removeHashtag(index)"
                      :aria-label="t('common.remove', 'Remove')"
                    >
                      <MaterialIcon icon="close" size="xs" />
                    </button>
                  </span>
                </div>
                <div class="add-hashtag-container">
                  <input
                    v-model="newHashtag"
                    type="text"
                    class="editable-input hashtag-input"
                    :placeholder="t('easyMode.step3.addHashtagPlaceholder', 'Type hashtag and press Enter')"
                    @keydown="handleHashtagKeydown"
                  />
                  <button
                    type="button"
                    class="add-hashtag-btn"
                    @click="addHashtag"
                    :disabled="!newHashtag.trim()"
                  >
                    <MaterialIcon icon="add" size="sm" />
                  </button>
                </div>
              </div>
            </div>

            <!-- Loading placeholder for content -->
            <div v-if="props.generating && !props.postText" class="content-loading">
              <p class="loading-text">{{ t('common.generatingContent', 'Generating content...') }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Inline Feedback Section -->
      <div class="inline-feedback-section">
        <div class="feedback-header">
          <MaterialIcon icon="lightbulb" size="md" class="feedback-icon" />
          <div class="feedback-header-text">
            <h4 class="feedback-title">{{ t('feedback.inlineTitle') }}</h4>
            <p class="feedback-subtitle">{{ t('feedback.inlineSubtitle') }}</p>
          </div>
        </div>
        <label class="feedback-label">{{ t('feedback.whatDidYouLike') }}</label>
        <textarea
          v-model="feedbackText"
          class="feedback-textarea"
          :placeholder="t('feedback.feedbackPlaceholder')"
          rows="3"
        ></textarea>
      </div>

      <!-- Step 3 Navigation -->
      <div class="step-navigation">
        <BaseButton
          variant="secondary"
          size="large"
          @click="prevStep"
          class="prev-button"
        >
          {{ t('common.back', 'Back') }}
        </BaseButton>
        <BaseButton
          variant="primary"
          size="large"
          @click="nextStep"
          class="next-button"
          :disabled="!props.generatedImageUrl && !props.generatedVideoUrl"
        >
          {{ t('common.next', 'Next') }}
        </BaseButton>
      </div>
    </BaseCard>

    <!-- Step 4: Platform Selection and Scheduling -->
    <BaseCard v-show="currentStep === 4" variant="glass" class="step-card">
      <!-- Success State -->
      <div v-if="props.publishResults?.success" class="publish-success">
        <img src="/socialchef_logo.svg" alt="Social Chef" class="success-logo" />
        <h3 class="success-title">{{ t('easyMode.step4.successTitle', 'Congratulations!') }}</h3>
        <p class="success-message">{{ t('easyMode.step4.successMessage', 'Your post has been published successfully!') }}</p>

        <!-- Show all successful platform links -->
        <div class="platform-links-container">
          <a
            v-for="result in successfulPlatforms"
            :key="result.platform"
            :href="result.url"
            target="_blank"
            rel="noopener noreferrer"
            class="view-post-link"
          >
            {{ t('easyMode.step4.viewOnPlatform', { platform: capitalizeFirst(result.platform) }, `View on ${capitalizeFirst(result.platform)}`) }} →
          </a>
        </div>

        <!-- Show partial failure warning if some platforms failed -->
        <BaseAlert v-if="failedPlatforms.length > 0" type="warning" class="partial-failure-alert">
          <strong>{{ t('easyMode.step4.partialFailureWarning', 'Some platforms failed to publish:') }}</strong>
          <ul class="failed-platforms-list">
            <li v-for="failed in failedPlatforms" :key="failed.platform">
              {{ capitalizeFirst(failed.platform) }}: {{ failed.error }}
            </li>
          </ul>
        </BaseAlert>

        <div class="success-actions">
          <BaseButton variant="primary" size="large" @click="resetAndCreateNew">
            {{ t('easyMode.step4.createAnother', 'Create Another Post') }}
          </BaseButton>
        </div>
      </div>

      <!-- Normal publish flow -->
      <template v-else>
        <div class="step-header">
          <div class="step-info">
            <h3 class="step-title">{{ t('easyMode.step4.title', 'Publish Your Post') }}</h3>
            <p class="step-subtitle">{{ t('easyMode.step4.subtitle', 'Choose platform and when to publish') }}</p>
          </div>
        </div>

        <!-- Error Alert -->
        <BaseAlert v-if="props.error" type="error" class="publish-error">
          {{ props.error }}
        </BaseAlert>

        <!-- Publishing Loading State -->
        <div v-if="props.publishing" class="publishing-overlay">
          <div class="publishing-content">
            <img src="/socialchef_logo.svg" alt="Social Chef" class="publishing-logo" />
            <p class="publishing-title">{{ t('advancedMode.publish.publishingTitle', 'Sharing your post') }}</p>
            <p class="publishing-subtitle">{{ t('advancedMode.publish.publishingSubtitle', 'Uploading to your social accounts') }}</p>
          </div>
        </div>

        <!-- Unified Schedule Post Component -->
        <UnifiedSchedulePost
          v-else
          :disabled="props.publishing"
          :show-preview="true"
          :image-url="props.generatedImageUrl"
          :video-url="props.generatedVideoUrl"
          :post-text="editedPostText"
          :hashtags="editedHashtags"
          :initial-schedule-date="props.initialScheduleDate"
          :lock-date="props.lockDate"
          :brand-id="props.brand?.id"
          @publish="handlePublish"
          @cancel="prevStep"
        />
      </template>
    </BaseCard>

  </div>
</template>

<style scoped>
.easy-mode-creation {
  display: flex;
  flex-direction: column;
  gap: var(--space-2xl);
  animation: fadeInUp 0.6s var(--ease-smooth);
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

/* Wizard Progress Indicator */
.wizard-progress {
  padding: var(--space-2xl) var(--space-xl);
  margin-bottom: var(--space-2xl);
}

.wizard-progress-track {
  display: flex;
  justify-content: center;
  align-items: center;
  max-width: 800px;
  margin: 0 auto;
}

.progress-step-wrapper {
  display: flex;
  align-items: center;
  flex: 1;
}

.progress-step-wrapper:last-child {
  flex: 0;
}

.progress-step-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-sm);
  cursor: pointer;
  transition: var(--transition-base);
  z-index: 2;
}

.progress-step-circle {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-full);
  background: var(--bg-secondary);
  border: 3px solid var(--border-color);
  color: var(--text-muted);
  font-family: var(--font-heading);
  font-size: var(--text-xl);
  font-weight: var(--font-bold);
  transition: var(--transition-base);
}

.progress-step-item.active .progress-step-circle {
  background: var(--gradient-gold);
  border-color: var(--gold-primary);
  color: var(--text-on-gold);
  box-shadow: var(--glow-gold-md);
  transform: scale(1.05);
}

.progress-step-item.completed .progress-step-circle {
  background: var(--gradient-gold);
  border-color: var(--gold-primary);
  color: var(--text-on-gold);
}

.progress-step-label {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--text-secondary);
  transition: var(--transition-base);
  white-space: nowrap;
}

.progress-step-item.active .progress-step-label {
  color: var(--gold-primary);
  font-weight: var(--font-bold);
}

.progress-step-item.completed .progress-step-label {
  color: var(--text-primary);
}

.progress-step-item.disabled {
  cursor: not-allowed;
  opacity: 0.4;
}

.progress-step-item.disabled .progress-step-circle {
  background: var(--bg-tertiary);
  border-color: var(--border-color);
}

.progress-step-item.disabled .progress-step-label {
  color: var(--text-muted);
}

/* Connecting Lines */
.progress-line {
  flex: 1;
  height: 3px;
  background: var(--border-color);
  margin: 0 var(--space-md);
  transition: var(--transition-base);
  position: relative;
  top: -14px; /* Align with center of circles */
}

.progress-line.completed {
  background: var(--gold-primary);
}

/* Step Card */
.step-card {
  animation: fadeInUp 0.6s var(--ease-smooth);
  animation-fill-mode: both;
}

.step-header {
  display: flex;
  align-items: flex-start;
  gap: var(--space-lg);
  margin-bottom: var(--space-xl);
}

.step-info {
  flex: 1;
}

.step-title {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  color: var(--text-primary);
  margin: 0 0 var(--space-xs) 0;
}

.step-subtitle {
  font-size: var(--text-base);
  color: var(--text-secondary);
  margin: 0;
}

.step-description {
  font-size: var(--text-sm);
  color: var(--text-muted);
  margin: var(--space-md) 0 0 0;
  padding: var(--space-md);
  background: var(--bg-elevated);
  border-left: 3px solid var(--gold-primary);
  border-radius: var(--radius-sm);
}

.step-error {
  margin-top: var(--space-lg);
}

/* Preview Section */
.preview-section {
  margin-top: var(--space-2xl);
}

.preview-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-2xl);
}

.preview-image-container {
  width: 100%;
  min-height: 400px;
  border-radius: var(--radius-lg);
  overflow: hidden;
  border: 2px solid var(--gold-primary);
  box-shadow: var(--glow-gold-md);
  background: var(--bg-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-image-display {
  width: 100%;
  height: auto;
  display: block;
}

.preview-video-display {
  width: 100%;
  max-height: 600px;
  display: block;
  background: var(--bg-tertiary);
}

/* Step 2 Generating Overlay */
.step-generating-overlay {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-5xl) var(--space-2xl);
  min-height: 400px;
  cursor: default;
  user-select: none;
  pointer-events: none;
}

.image-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-5xl) var(--space-2xl);
  width: 100%;
  cursor: default;
  user-select: none;
  pointer-events: none;
}

.loading-logo {
  width: 120px;
  height: 120px;
  margin-bottom: var(--space-xl);
  animation: bounce 2s ease-in-out infinite;
  filter: drop-shadow(0 4px 20px rgba(15, 61, 46, 0.4));
  cursor: default;
  user-select: none;
  pointer-events: none;
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-20px);
  }
}

.loading-title {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  color: var(--gold-primary);
  margin: 0 0 var(--space-sm) 0;
  font-weight: var(--font-semibold);
}

.loading-subtitle {
  font-size: var(--text-base);
  color: var(--text-muted);
  margin: 0;
}

.content-loading {
  padding: var(--space-2xl);
  text-align: center;
  background: var(--bg-elevated);
  border-radius: var(--radius-md);
  border: 1px dashed var(--border-color);
}

.loading-text {
  font-size: var(--text-base);
  color: var(--text-muted);
  margin: 0;
}

.preview-post-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.preview-content-label {
  font-family: var(--font-heading);
  font-size: var(--text-xl);
  color: var(--text-primary);
  margin: 0 0 var(--space-md) 0;
}

.preview-text-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.preview-label {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--gold-primary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.preview-text {
  font-size: var(--text-base);
  color: var(--text-secondary);
  line-height: var(--leading-relaxed);
  padding: var(--space-md);
  background: var(--bg-elevated);
  border-radius: var(--radius-md);
  border-left: 3px solid var(--gold-primary);
  margin: 0;
}

.preview-hashtags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
}

.preview-hashtag {
  display: inline-block;
  padding: var(--space-xs) var(--space-md);
  background: rgba(15, 61, 46, 0.1);
  border: 1px solid rgba(15, 61, 46, 0.3);
  border-radius: var(--radius-full);
  color: var(--gold-light);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
}

/* Editable inputs for Step 3 */
.editable-textarea,
.editable-input {
  width: 100%;
  padding: var(--space-md);
  background: var(--bg-elevated);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-family: var(--font-body);
  font-size: var(--text-base);
  line-height: var(--leading-relaxed);
  transition: var(--transition-base);
}

.editable-textarea:focus,
.editable-input:focus {
  outline: none;
  border-color: var(--gold-primary);
  box-shadow: 0 0 0 3px rgba(15, 61, 46, 0.15);
}

.editable-textarea::placeholder,
.editable-input::placeholder {
  color: var(--text-muted);
}

.editable-textarea {
  resize: vertical;
  min-height: 100px;
}

/* Editable Hashtags */
.editable-hashtags {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.hashtag-chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
  min-height: 32px;
}

.hashtag-chip {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-xs) var(--space-md);
  background: rgba(15, 61, 46, 0.1);
  border: 1px solid rgba(15, 61, 46, 0.3);
  border-radius: var(--radius-full);
  color: var(--gold-light);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
}

.remove-hashtag {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2px;
  background: transparent;
  border: none;
  color: var(--gold-light);
  cursor: pointer;
  border-radius: 50%;
  transition: var(--transition-fast);
}

.remove-hashtag:hover {
  background: rgba(15, 61, 46, 0.2);
  color: var(--gold-primary);
}

.add-hashtag-container {
  display: flex;
  gap: var(--space-sm);
}

.hashtag-input {
  flex: 1;
}

.add-hashtag-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-sm) var(--space-md);
  background: var(--gold-subtle);
  border: 1px solid var(--gold-primary);
  border-radius: var(--radius-md);
  color: var(--gold-primary);
  cursor: pointer;
  transition: var(--transition-base);
}

.add-hashtag-btn:hover:not(:disabled) {
  background: var(--gold-primary);
  color: var(--text-on-gold);
}

.add-hashtag-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.preview-placeholder {
  padding: var(--space-5xl) var(--space-2xl);
  text-align: center;
  background: var(--bg-elevated);
  border-radius: var(--radius-lg);
  border: 2px dashed var(--border-color);
}

.preview-info {
  font-size: var(--text-lg);
  color: var(--text-muted);
  margin: 0;
}

/* Inline Feedback Section */
.inline-feedback-section {
  margin-top: var(--space-2xl);
  padding: var(--space-xl);
  background: var(--gold-subtle);
  border: 1px dashed var(--gold-primary);
  border-radius: var(--radius-lg);
}

.inline-feedback-section .feedback-header {
  display: flex;
  align-items: flex-start;
  gap: var(--space-md);
  margin-bottom: var(--space-lg);
}

.inline-feedback-section .feedback-icon {
  color: var(--gold-primary);
  flex-shrink: 0;
  margin-top: 2px;
}

.inline-feedback-section .feedback-header-text {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.inline-feedback-section .feedback-title {
  font-family: var(--font-heading);
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--gold-primary);
  margin: 0;
}

.inline-feedback-section .feedback-subtitle {
  font-size: var(--text-sm);
  color: var(--text-muted);
  margin: 0;
}

.inline-feedback-section .feedback-label {
  display: block;
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-secondary);
  margin-bottom: var(--space-sm);
}

.inline-feedback-section .feedback-textarea {
  width: 100%;
  padding: var(--space-md);
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-family: var(--font-body);
  font-size: var(--text-base);
  line-height: var(--leading-normal);
  resize: vertical;
  transition: all var(--transition-base);
}

.inline-feedback-section .feedback-textarea:focus {
  outline: none;
  border-color: var(--gold-primary);
  background: var(--bg-elevated);
}

.inline-feedback-section .feedback-textarea::placeholder {
  color: var(--text-muted);
}

/* Step Navigation */
.step-navigation {
  display: flex;
  justify-content: space-between;
  gap: var(--space-lg);
  margin-top: var(--space-2xl);
  padding-top: var(--space-2xl);
  border-top: 1px solid var(--border-color);
}

.step-navigation .next-button,
.step-navigation .prev-button {
  flex: 1;
  max-width: 200px;
}

.step-navigation .next-button:only-child {
  margin-left: auto;
}

.step-navigation .generate-button {
  flex: 1;
}

/* Menu Items Grid */
.menu-items-grid-easy {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: var(--space-lg);
}

.menu-item-card-easy {
  position: relative;
  display: flex;
  flex-direction: column;
  padding: var(--space-lg);
  background: var(--bg-secondary);
  border: 2px solid var(--border-color);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: var(--transition-base);
}

.menu-item-card-easy:hover {
  border-color: var(--gold-primary);
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.menu-item-card-easy.selected {
  border-color: var(--gold-primary);
  background: var(--gold-subtle);
  box-shadow: var(--glow-gold-md);
}

.menu-item-image-wrapper {
  width: 100%;
  aspect-ratio: 1;
  border-radius: var(--radius-md);
  overflow: hidden;
  margin-bottom: var(--space-md);
  background: var(--bg-tertiary);
}

.menu-item-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.menu-item-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-elevated);
}

.placeholder-icon {
  font-size: var(--text-4xl);
  opacity: 0.3;
}

.menu-item-details {
  flex: 1;
}

.menu-item-name {
  font-family: var(--font-heading);
  font-size: var(--text-base);
  color: var(--text-primary);
  margin: 0 0 var(--space-xs) 0;
}

.menu-item-price {
  font-size: var(--text-sm);
  color: var(--gold-primary);
  font-weight: var(--font-semibold);
  margin: 0;
}

.selected-badge {
  position: absolute;
  top: var(--space-md);
  right: var(--space-md);
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--gradient-gold);
  border-radius: var(--radius-full);
  box-shadow: var(--shadow-md);
}

.badge-icon {
  color: var(--text-on-gold);
  font-size: var(--text-lg);
  font-weight: var(--font-bold);
}

/* Style Templates Grid */
.style-templates-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: var(--space-lg);
}

.style-template-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--space-xl);
  background: var(--bg-secondary);
  border: 2px solid var(--border-color);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: var(--transition-base);
  text-align: center;
}

.style-template-card:hover {
  border-color: var(--gold-primary);
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.style-template-card.selected {
  border-color: var(--gold-primary);
  background: var(--gold-subtle);
  box-shadow: var(--glow-gold-md);
}

.template-icon {
  font-size: var(--text-5xl);
  margin-bottom: var(--space-md);
}

.template-name {
  font-family: var(--font-heading);
  font-size: var(--text-lg);
  color: var(--text-primary);
  margin: 0 0 var(--space-xs) 0;
}

.template-description {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin: 0;
  line-height: var(--leading-normal);
}

.template-selected-badge {
  position: absolute;
  top: var(--space-md);
  right: var(--space-md);
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--gradient-gold);
  border-radius: var(--radius-full);
  box-shadow: var(--shadow-md);
}

/* Customization Sections */
.customization-section {
  margin-bottom: var(--space-2xl);
  padding-bottom: var(--space-2xl);
  border-bottom: 1px solid var(--border-color);
}

.customization-section:last-of-type {
  border-bottom: none;
  margin-bottom: var(--space-xl);
  padding-bottom: 0;
}

/* Custom Prompt Input */
.custom-prompt-section {
  margin-top: var(--space-lg);
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-8px); }
  to { opacity: 1; transform: translateY(0); }
}

.custom-prompt-input {
  width: 100%;
  padding: var(--space-lg);
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-family: var(--font-body);
  font-size: var(--text-base);
  line-height: 1.6;
  resize: vertical;
  min-height: 100px;
  transition: var(--transition-base);
}

.custom-prompt-input:focus {
  outline: none;
  border-color: var(--gold-primary);
  box-shadow: 0 0 0 2px var(--gold-subtle);
}

.custom-prompt-input::placeholder {
  color: var(--text-muted);
}

.section-label {
  font-family: var(--font-heading);
  font-size: var(--text-lg);
  color: var(--text-primary);
  margin: 0 0 var(--space-lg) 0;
  font-weight: var(--font-semibold);
}

.section-hint {
  font-size: var(--text-sm);
  color: var(--text-muted);
  margin-bottom: var(--space-lg);
  line-height: 1.4;
}

.video-option-group {
  margin-bottom: var(--space-lg);
}

.video-option-group:last-child {
  margin-bottom: 0;
}

.video-option-label {
  display: block;
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-secondary);
  margin-bottom: var(--space-sm);
}

/* Duration Options */
.duration-options {
  display: flex;
  gap: var(--space-sm);
}

.duration-button {
  flex: 1;
  padding: var(--space-sm) var(--space-md);
  background: var(--bg-secondary);
  border: 2px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  cursor: pointer;
  transition: all 0.2s ease;
}

.duration-button:hover {
  border-color: var(--gold-primary);
  background: var(--gold-subtle);
}

.duration-button.selected {
  border-color: var(--gold-primary);
  background: var(--gold-subtle);
  color: var(--gold-primary);
}

.duration-warning {
  margin-top: var(--space-xs);
  font-size: var(--text-xs);
  color: var(--warning-text, #f59e0b);
  font-style: italic;
}

/* Aspect Ratio Options */
.aspect-ratio-options {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-sm);
}

.aspect-ratio-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-md);
  background: var(--bg-secondary);
  border: 2px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.aspect-ratio-button:hover {
  border-color: var(--gold-primary);
  background: var(--gold-subtle);
}

.aspect-ratio-button.selected {
  border-color: var(--gold-primary);
  background: var(--gold-subtle);
}

.aspect-ratio-button .aspect-hint {
  font-size: var(--text-xs);
  color: var(--text-muted);
}

.aspect-ratio-button.selected .aspect-hint {
  color: var(--gold-primary);
}

/* Holiday Theme Options */
.holiday-theme-options {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: var(--space-sm);
}

.holiday-theme-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-sm) var(--space-xs);
  background: var(--bg-secondary);
  border: 2px solid var(--border-color);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 0;
}

.holiday-theme-button:hover {
  border-color: var(--gold-primary);
  background: var(--gold-subtle);
}

.holiday-theme-button.selected {
  border-color: var(--gold-primary);
  background: var(--gold-subtle);
  box-shadow: var(--glow-gold-sm);
}

.holiday-icon {
  flex-shrink: 0;
}

.holiday-label {
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  color: var(--text-primary);
  text-align: center;
  word-break: break-word;
  line-height: 1.2;
  max-width: 100%;
}

.custom-theme-input-wrapper {
  margin-top: var(--space-md);
}

.custom-theme-text-input {
  width: 100%;
  padding: var(--space-md);
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: var(--text-sm);
  transition: all 0.2s ease;
}

.custom-theme-text-input:focus {
  outline: none;
  border-color: var(--gold-primary);
  box-shadow: var(--glow-gold-sm);
}

.custom-theme-text-input::placeholder {
  color: var(--text-muted);
}

/* Logo Management */
.logo-management {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-xl);
}

.current-logo {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-sm);
}

.logo-preview-container {
  position: relative;
  width: 80px;
  height: 80px;
  border-radius: var(--radius-md);
  overflow: hidden;
  border: 2px solid var(--gold-primary);
  background: var(--bg-secondary);
}

.logo-preview-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.remove-logo-btn {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--error-bg);
  border: none;
  border-radius: var(--radius-full);
  color: var(--error-text);
  font-size: var(--text-sm);
  cursor: pointer;
  transition: var(--transition-base);
}

.remove-logo-btn:hover {
  background: var(--error-border);
  transform: scale(1.1);
}

.logo-status {
  font-size: var(--text-xs);
  color: var(--text-muted);
}

.upload-logo-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-lg) var(--space-xl);
  background: var(--bg-secondary);
  border: 2px dashed var(--border-color);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: var(--transition-base);
}

.upload-logo-btn:hover {
  border-color: var(--gold-primary);
  background: var(--gold-subtle);
}

.upload-logo-content {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.upload-logo-icon {
  font-size: var(--text-xl);
}

.upload-logo-text {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-primary);
}

/* Customization Options */
.customization-options {
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
}

.option-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.option-label {
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

.context-input-easy {
  width: 100%;
  padding: var(--space-lg);
  font-family: var(--font-body);
  font-size: var(--text-base);
  color: var(--text-primary);
  background: var(--bg-secondary);
  border: 2px solid var(--border-color);
  border-radius: var(--radius-md);
  transition: var(--transition-base);
  outline: none;
}

.context-input-easy::placeholder {
  color: var(--text-muted);
}

.context-input-easy:focus {
  border-color: var(--gold-primary);
  box-shadow: 0 0 0 3px var(--gold-subtle);
}

.input-note {
  font-size: var(--text-xs);
  color: var(--text-muted);
  margin: 0;
  text-align: right;
}

.option-hint {
  font-size: var(--text-sm);
  color: var(--text-muted);
  margin: 0;
}

.checkbox-label-easy {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  cursor: pointer;
  padding: var(--space-lg);
  background: var(--bg-secondary);
  border: 2px solid var(--border-color);
  border-radius: var(--radius-md);
  transition: var(--transition-base);
}

.checkbox-label-easy:hover {
  border-color: var(--gold-primary);
  background: var(--gold-subtle);
}

.checkbox-input-easy {
  width: 20px;
  height: 20px;
  cursor: pointer;
  accent-color: var(--gold-primary);
}

.checkbox-text {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  font-size: var(--text-base);
  color: var(--text-primary);
  font-weight: var(--font-medium);
}

.checkbox-icon {
  font-size: var(--text-xl);
}

.generate-button {
  font-size: var(--text-lg);
  padding: var(--space-xl);
}

/* Image Upload */
.image-upload-section {
  margin-bottom: var(--space-xl);
  display: flex;
  justify-content: center;
}

.upload-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-3xl);
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
}

.upload-icon {
  font-size: var(--text-4xl);
}

.upload-text {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
}

.upload-hint {
  font-size: var(--text-sm);
  color: var(--text-muted);
}

.uploaded-image-preview {
  position: relative;
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
  border-radius: var(--radius-lg);
  overflow: hidden;
  border: 2px solid var(--gold-primary);
  box-shadow: var(--glow-gold-md);
}

.preview-image {
  width: 100%;
  height: auto;
  display: block;
}

.remove-image-btn {
  position: absolute;
  top: var(--space-md);
  right: var(--space-md);
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(15, 61, 46, 0.35);
  border: none;
  border-radius: var(--radius-full);
  color: var(--text-primary);
  font-size: var(--text-lg);
  cursor: pointer;
  transition: var(--transition-base);
}

.remove-image-btn:hover {
  background: var(--error-bg);
  color: var(--error-text);
}

.upload-badge {
  position: absolute;
  top: var(--space-md);
  left: var(--space-md);
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--gradient-gold);
  border-radius: var(--radius-full);
  box-shadow: var(--shadow-md);
}

/* Divider */
.divider {
  position: relative;
  text-align: center;
  margin: var(--space-2xl) 0;
}

.divider::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: var(--border-color);
}

.divider-text {
  position: relative;
  display: inline-block;
  padding: 0 var(--space-lg);
  background: var(--bg-primary);
  color: var(--text-muted);
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
}

/* Pagination Controls */
.pagination-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-lg);
  margin-top: var(--space-xl);
  padding-top: var(--space-xl);
  border-top: 1px solid var(--border-color);
}

.pagination-btn {
  padding: var(--space-md) var(--space-xl);
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-family: var(--font-body);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  cursor: pointer;
  transition: var(--transition-base);
}

.pagination-btn:hover:not(:disabled) {
  background: var(--bg-elevated);
  border-color: var(--gold-primary);
  color: var(--gold-primary);
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-info {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  font-weight: var(--font-medium);
  min-width: 120px;
  text-align: center;
}

/* Empty State */
.empty-state {
  padding: var(--space-4xl);
  text-align: center;
}

.empty-text {
  font-size: var(--text-lg);
  color: var(--text-muted);
}

/* Loading States */
.generating-content {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  justify-content: center;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top-color: var(--text-on-gold);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(10, 10, 10, 0.95);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.loading-content {
  text-align: center;
}

.cooking-animation {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-xl);
  max-width: 500px;
}

.loading-logo {
  width: 100px;
  height: auto;
  filter: drop-shadow(0 0 20px rgba(15, 61, 46, 0.5));
  animation: bounce 1s ease-in-out infinite;
  margin-bottom: var(--space-lg);
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-20px); }
}

/* Progress Steps */
.progress-steps {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
  width: 100%;
  margin-bottom: var(--space-xl);
}

.progress-step {
  display: flex;
  align-items: center;
  gap: var(--space-lg);
  padding: var(--space-lg);
  background: rgba(255, 255, 255, 0.05);
  border-radius: var(--radius-lg);
  border: 2px solid transparent;
  transition: all 0.3s var(--ease-smooth);
  opacity: 0.5;
}

.progress-step.active {
  opacity: 1;
  border-color: var(--gold-primary);
  background: rgba(15, 61, 46, 0.1);
  box-shadow: 0 0 20px rgba(15, 61, 46, 0.3);
}

.progress-step.completed {
  opacity: 0.8;
  border-color: rgba(46, 213, 115, 0.5);
}

.step-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-full);
  background: var(--bg-secondary);
  border: 2px solid var(--border-color);
  flex-shrink: 0;
  position: relative;
}

.progress-step.active .step-icon {
  border-color: var(--gold-primary);
  background: rgba(15, 61, 46, 0.2);
}

.progress-step.completed .step-icon {
  border-color: #2ed573;
  background: rgba(46, 213, 115, 0.2);
}

.step-spinner {
  width: 24px;
  height: 24px;
  border: 3px solid rgba(15, 61, 46, 0.3);
  border-top-color: var(--gold-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.checkmark {
  font-size: var(--text-2xl);
  color: #2ed573;
  font-weight: var(--font-bold);
  animation: checkmarkPop 0.3s var(--ease-smooth);
}

@keyframes checkmarkPop {
  0% { transform: scale(0); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
}

.step-waiting {
  font-size: var(--text-2xl);
  color: var(--text-muted);
}

.step-text {
  flex: 1;
  text-align: left;
}

.step-title {
  font-family: var(--font-heading);
  font-size: var(--text-lg);
  color: var(--text-primary);
  font-weight: var(--font-semibold);
  margin-bottom: var(--space-xs);
}

.step-subtitle {
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.progress-step.active .step-title {
  color: var(--gold-primary);
}

/* Progress Bar */
.loading-bar {
  width: 100%;
  height: 8px;
  background: var(--bg-tertiary);
  border-radius: var(--radius-full);
  overflow: hidden;
  box-shadow: inset 0 2px 4px rgba(15, 61, 46, 0.1);
}

.loading-bar-fill {
  height: 100%;
  background: var(--gradient-gold);
  border-radius: var(--radius-full);
  transition: width 0.3s ease-out;
  box-shadow: 0 0 10px rgba(15, 61, 46, 0.5);
}

.progress-text {
  font-family: var(--font-heading);
  font-size: var(--text-xl);
  color: var(--gold-primary);
  font-weight: var(--font-bold);
  margin-top: var(--space-md);
}

/* Responsive */
@media (max-width: 768px) {
  .wizard-progress {
    padding: var(--space-lg) var(--space-sm);
  }

  .wizard-progress-track {
    gap: 0;
  }

  .progress-step-circle {
    width: 44px;
    height: 44px;
    font-size: var(--text-base);
  }

  .progress-step-label {
    font-size: var(--text-xs);
  }

  .progress-line {
    margin: 0 var(--space-xs);
    top: -12px;
    height: 2px;
  }

  .step-navigation {
    flex-direction: column;
    gap: var(--space-md);
  }

  .step-navigation .next-button,
  .step-navigation .prev-button {
    max-width: none;
    width: 100%;
  }

  .menu-items-grid-easy {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: var(--space-md);
  }

  .style-templates-grid {
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  }

  .step-header {
    gap: var(--space-md);
  }

  .step-title {
    font-size: var(--text-xl);
  }

  .loading-logo {
    width: 80px;
  }

  .cooking-animation {
    max-width: 90%;
  }

  .progress-steps {
    gap: var(--space-md);
  }

  .progress-step {
    padding: var(--space-md);
    gap: var(--space-md);
  }

  .step-icon {
    width: 40px;
    height: 40px;
  }

  .step-spinner {
    width: 20px;
    height: 20px;
  }

  .step-title {
    font-size: var(--text-base);
  }

  .step-subtitle {
    font-size: var(--text-xs);
  }

  .progress-text {
    font-size: var(--text-lg);
  }
}

/* Step 4: Platform Selection */
.platform-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-lg);
}

@media (max-width: 768px) {
  .platform-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .platform-grid {
    grid-template-columns: 1fr;
  }

  /* Strictness options - stack vertically on mobile */
  .strictness-options {
    grid-template-columns: 1fr;
    gap: var(--space-sm);
  }

  .strictness-button {
    flex-direction: row;
    justify-content: flex-start;
    padding: var(--space-md);
    min-height: auto;
    gap: var(--space-md);
  }

  .strictness-icon {
    flex-shrink: 0;
  }

  .strictness-button > div,
  .strictness-button > span:not(.strictness-icon) {
    text-align: left;
  }

  .strictness-label {
    font-size: var(--text-sm);
  }

  .strictness-description {
    font-size: 11px;
  }

  /* Media Type - horizontal on mobile */
  .media-type-options {
    grid-template-columns: 1fr 1fr;
    gap: var(--space-sm);
  }

  .media-type-button {
    padding: var(--space-md);
  }

  /* Holiday Theme - smaller grid on mobile */
  .holiday-theme-options {
    grid-template-columns: repeat(4, 1fr);
    gap: var(--space-xs);
  }

  .holiday-theme-button {
    padding: var(--space-xs);
  }

  .holiday-label {
    font-size: 10px;
    line-height: 1.2;
  }

  .holiday-icon {
    width: 20px;
    height: 20px;
  }
}

@media (max-width: 390px) {
  .strictness-button {
    padding: var(--space-sm);
  }

  .strictness-icon {
    font-size: 24px;
  }

  .strictness-label {
    font-size: var(--text-xs);
  }

  /* Holiday Theme - 4 columns on small screens */
  .holiday-theme-options {
    grid-template-columns: repeat(4, 1fr);
    gap: 4px;
  }

  .holiday-theme-button {
    padding: 6px 4px;
    border-width: 1px;
    min-height: 44px;
    border-radius: var(--radius-sm);
  }

  .holiday-label {
    font-size: 8px;
  }

  .holiday-icon {
    width: 16px;
    height: 16px;
  }
}

.platform-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-xl);
  background: rgba(255, 255, 255, 0.6);
  border: 2px solid var(--border-color);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all 0.3s ease;
}

.platform-card:hover:not(.disabled) {
  border-color: rgba(15, 61, 46, 0.4);
  background: rgba(255, 255, 255, 0.8);
  transform: translateY(-2px);
}

.platform-card.selected {
  border-color: var(--gold-primary);
  background: rgba(15, 61, 46, 0.1);
}

.platform-card.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.platform-card.disabled:hover {
  transform: none;
  border-color: var(--border-color);
  background: rgba(255, 255, 255, 0.6);
}

.platform-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.platform-name {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
}

.platform-status {
  font-size: var(--text-xs);
  color: var(--text-muted);
  font-weight: var(--font-medium);
}

.platform-selected-badge {
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
}

/* Publish Type Buttons */
.publish-type-buttons {
  display: flex;
  gap: var(--space-lg);
  flex-wrap: wrap;
}

.publish-type-btn {
  flex: 1;
  min-width: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-xl);
  background: rgba(255, 255, 255, 0.6);
  border: 2px solid var(--border-color);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all 0.3s ease;
  color: var(--text-secondary);
}

.publish-type-btn:hover {
  border-color: rgba(15, 61, 46, 0.4);
  background: rgba(255, 255, 255, 0.8);
}

.publish-type-btn.active {
  border-color: var(--gold-primary);
  background: rgba(15, 61, 46, 0.1);
  color: var(--text-primary);
}

.publish-type-icon {
  font-size: 2.5rem;
}

.chef-icon {
  width: 40px;
  height: 40px;
  object-fit: contain;
}

.publish-type-text {
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
}

/* Publish Success State */
.publish-success {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: var(--space-3xl) var(--space-xl);
  animation: fadeInUp 0.5s var(--ease-smooth);
}

.success-logo {
  width: 120px;
  height: auto;
  margin-bottom: var(--space-xl);
  animation: bounce 0.6s ease-out;
}

@keyframes bounce {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.2); }
}

.success-title {
  font-family: var(--font-heading);
  font-size: var(--text-3xl);
  background: var(--gradient-gold);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 var(--space-md) 0;
}

.success-message {
  font-size: var(--text-lg);
  color: var(--text-secondary);
  margin: 0 0 var(--space-xl) 0;
}

.view-post-link {
  display: inline-flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-md) var(--space-xl);
  background: var(--gold-subtle);
  border: 1px solid var(--gold-primary);
  border-radius: var(--radius-md);
  color: var(--gold-light);
  font-weight: var(--font-semibold);
  text-decoration: none;
  transition: var(--transition-base);
  margin-bottom: var(--space-2xl);
}

.view-post-link:hover {
  background: rgba(15, 61, 46, 0.2);
  transform: translateY(-2px);
  box-shadow: var(--glow-gold-sm);
}

/* Platform Links Container */
.platform-links-container {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--space-md);
  margin-bottom: var(--space-xl);
}

/* Partial Failure Alert */
.partial-failure-alert {
  max-width: 500px;
  text-align: left;
  margin-bottom: var(--space-xl);
}

.failed-platforms-list {
  margin: var(--space-sm) 0 0 var(--space-lg);
  padding: 0;
  list-style-type: disc;
}

.failed-platforms-list li {
  margin: var(--space-xs) 0;
  font-size: var(--text-sm);
}

.success-actions {
  display: flex;
  gap: var(--space-lg);
}

/* Publish Error */
.publish-error {
  margin-bottom: var(--space-xl);
}

/* Publishing Overlay */
.publishing-overlay {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-3xl);
}

.publishing-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.publishing-logo {
  width: 80px;
  height: 80px;
  margin-bottom: var(--space-xl);
  animation: bounce 2s ease-in-out infinite;
  filter: drop-shadow(0 4px 20px rgba(15, 61, 46, 0.4));
}

.publishing-title {
  font-family: var(--font-heading);
  font-size: var(--text-xl);
  color: var(--gold-primary);
  margin: 0 0 var(--space-sm) 0;
  font-weight: var(--font-semibold);
}

.publishing-subtitle {
  font-size: var(--text-base);
  color: var(--text-muted);
  margin: 0;
}

/* Date Picker Container */
.date-picker-container {
  width: 100%;
}

/* VueDatePicker Custom Styling */
.date-picker-container :deep(.dp__theme_dark) {
  --dp-background-color: rgba(255, 255, 255, 0.9);
  --dp-text-color: var(--text-primary);
  --dp-hover-color: rgba(15, 61, 46, 0.1);
  --dp-hover-text-color: var(--gold-light);
  --dp-hover-icon-color: var(--gold-light);
  --dp-primary-color: var(--gold-primary);
  --dp-primary-disabled-color: rgba(15, 61, 46, 0.3);
  --dp-primary-text-color: var(--text-on-gold);
  --dp-secondary-color: var(--text-muted);
  --dp-border-color: var(--border-color);
  --dp-menu-border-color: var(--gold-primary);
  --dp-border-color-hover: var(--gold-primary);
  --dp-disabled-color: rgba(128, 128, 128, 0.3);
  --dp-scroll-bar-background: var(--bg-elevated);
  --dp-scroll-bar-color: var(--gold-primary);
  --dp-success-color: var(--gold-primary);
  --dp-success-color-disabled: rgba(15, 61, 46, 0.3);
  --dp-icon-color: var(--text-muted);
  --dp-danger-color: var(--error-text);
  --dp-marker-color: var(--gold-primary);
  --dp-tooltip-color: var(--bg-elevated);
  --dp-disabled-color-text: var(--text-muted);
  --dp-highlight-color: rgba(15, 61, 46, 0.2);
  --dp-range-between-dates-background-color: rgba(15, 61, 46, 0.1);
  --dp-range-between-dates-text-color: var(--text-primary);
  --dp-range-between-border-color: var(--gold-primary);
}

.date-picker-container :deep(.dp__input_wrap) {
  width: 100%;
}

.date-picker-container :deep(.dp__input) {
  background: rgba(255, 255, 255, 0.6);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: var(--text-base);
  font-family: var(--font-body);
  padding: var(--space-md) var(--space-lg);
  padding-left: 44px;
  transition: all 0.3s ease;
  height: auto;
  min-height: 48px;
  width: 100%;
}

.date-picker-container :deep(.dp__input_icon) {
  left: 12px;
  color: var(--gold-primary);
}

.date-picker-container :deep(.dp__input:hover) {
  border-color: rgba(15, 61, 46, 0.4);
}

.date-picker-container :deep(.dp__input:focus) {
  outline: none;
  border-color: var(--gold-primary);
  box-shadow: 0 0 0 3px rgba(15, 61, 46, 0.15);
}

.date-picker-container :deep(.dp__input::placeholder) {
  color: var(--text-muted);
}

.date-picker-container :deep(.dp__menu) {
  background: rgba(255, 255, 255, 0.95);
  border: 2px solid var(--gold-primary);
  border-radius: var(--radius-lg);
  box-shadow: var(--glow-gold-md);
  backdrop-filter: blur(20px);
}

.date-picker-container :deep(.dp__calendar_header_item) {
  color: var(--gold-primary);
  font-weight: var(--font-semibold);
}

.date-picker-container :deep(.dp__today) {
  border: 1px solid var(--gold-primary);
}

.date-picker-container :deep(.dp__active_date),
.date-picker-container :deep(.dp__overlay_cell_active) {
  background: var(--gradient-gold);
  color: var(--text-on-gold);
  font-weight: var(--font-semibold);
}

.date-picker-container :deep(.dp__time_input) {
  background: rgba(255, 255, 255, 0.6);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
}

.date-picker-container :deep(.dp__time_input:hover) {
  border-color: var(--gold-primary);
}

.date-picker-container :deep(.dp__arrow_top),
.date-picker-container :deep(.dp__arrow_bottom) {
  color: var(--gold-primary);
}

.date-picker-container :deep(.dp__button) {
  color: var(--gold-primary);
  transition: var(--transition-base);
}

.date-picker-container :deep(.dp__button:hover) {
  background: rgba(15, 61, 46, 0.1);
}

.date-picker-container :deep(.dp__action_row) {
  padding: var(--space-md);
  gap: var(--space-md);
}

.date-picker-container :deep(.dp__action_button) {
  background: var(--gradient-gold);
  color: var(--text-on-gold);
  border: none;
  border-radius: var(--radius-md);
  padding: var(--space-sm) var(--space-lg);
  font-weight: var(--font-semibold);
  transition: var(--transition-base);
}

.date-picker-container :deep(.dp__action_button:hover) {
  transform: translateY(-1px);
  box-shadow: var(--glow-gold-sm);
}

.date-picker-container :deep(.dp__selection_preview) {
  color: var(--gold-primary);
  font-weight: var(--font-medium);
}

/* ===== VIDEO GENERATING BACKGROUND BANNER ===== */
.video-background-banner {
  margin-top: var(--space-lg);
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-md) var(--space-lg);
  background: linear-gradient(135deg, rgba(15, 61, 46, 0.08), rgba(15, 61, 46, 0.04));
  border: 1px solid rgba(15, 61, 46, 0.2);
  border-radius: var(--radius-lg);
}

.video-background-banner .banner-icon {
  flex-shrink: 0;
}

.video-background-banner .spinner-small {
  width: 24px;
  height: 24px;
  border: 3px solid rgba(15, 61, 46, 0.2);
  border-top-color: var(--gold-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.video-background-banner .banner-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.video-background-banner .banner-title {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--gold-primary);
}

.video-background-banner .banner-subtitle {
  font-size: var(--text-xs);
  color: var(--text-secondary);
}

/* ===== ANIMATE IMAGE SECTION ===== */
.animate-image-section {
  margin-top: var(--space-lg);
  display: flex;
  justify-content: center;
}

.animate-image-button {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-md) var(--space-xl);
  background: linear-gradient(135deg, var(--gold-subtle), var(--bg-secondary));
  border: 2px solid var(--gold-primary);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all 0.2s ease;
}

.animate-image-button:hover {
  background: var(--gold-subtle);
  box-shadow: var(--glow-gold-sm);
  transform: translateY(-2px);
}

.animate-button-text {
  font-size: var(--text-base);
  font-weight: var(--font-medium);
  color: var(--text-primary);
}

.animate-credits-badge {
  font-size: var(--text-xs);
  padding: var(--space-xs) var(--space-sm);
  background: var(--gold-primary);
  color: var(--text-on-gold);
  border-radius: var(--radius-full);
}

/* Animation Options Panel */
.animation-options-panel {
  margin-top: var(--space-lg);
  padding: var(--space-xl);
  background: var(--bg-elevated);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animation-options-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-lg);
}

.animation-options-title {
  font-family: var(--font-heading);
  font-size: var(--text-lg);
  color: var(--text-primary);
  margin: 0;
}

.close-animation-options {
  background: none;
  border: none;
  cursor: pointer;
  padding: var(--space-xs);
  color: var(--text-muted);
  transition: color 0.2s;
}

.close-animation-options:hover {
  color: var(--text-primary);
}

.generate-animation-button {
  width: 100%;
  margin-top: var(--space-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
}

/* Media Toggle */
.media-toggle-container {
  display: flex;
  justify-content: center;
  margin-top: var(--space-md);
}

.media-toggle {
  display: inline-flex;
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  padding: var(--space-xs);
  border: 1px solid var(--border-color);
}

.media-toggle-button {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-sm) var(--space-lg);
  background: transparent;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s ease;
  color: var(--text-secondary);
}

.media-toggle-button:hover {
  color: var(--text-primary);
}

.media-toggle-button.active {
  background: var(--gold-subtle);
  color: var(--gold-primary);
  box-shadow: var(--glow-gold-sm);
}

/* Reduced Motion */
@media (prefers-reduced-motion: reduce) {
  .easy-mode-creation,
  .step-card,
  .spinner,
  .loading-logo,
  .loading-bar-fill,
  .animation-options-panel {
    animation: none;
  }
}

/* ===== DARK MODE OVERRIDES ===== */
:root[data-theme="dark"] .date-picker-container {
  background: var(--bg-secondary);
  border-color: var(--border-color);
}

:root[data-theme="dark"] :deep(.dp__theme_dark) {
  --dp-hover-color: var(--accent-alpha-10);
  --dp-secondary-color: var(--accent-alpha-05);
  --dp-border-color: var(--border-color);
}
</style>
