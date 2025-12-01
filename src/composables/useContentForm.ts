import { ref, computed } from 'vue'
import { useSocialAccounts } from './useSocialAccounts'

export type StickerStyle = 'bold' | 'outlined' | 'ribbon' | 'badge' | 'starburst'
export type StickerPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'center'
export type LogoPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'

export interface ContentFormOptions {
  defaultStickerStyle?: StickerStyle
  defaultStickerPosition?: StickerPosition
  defaultLogoPosition?: LogoPosition
  defaultIncludeLogo?: boolean
}

export function useContentForm(options: ContentFormOptions = {}) {
  const socialAccounts = useSocialAccounts()

  // Menu item selection
  const selectedMenuItems = ref<any[]>([])

  // Platform selection
  const selectedPlatforms = ref<string[]>([])

  // Campaign context for promotional sticker
  const promptContext = ref('')

  // Promotional sticker options
  const stickerStyle = ref<StickerStyle>(options.defaultStickerStyle || 'bold')
  const stickerPosition = ref<StickerPosition>(options.defaultStickerPosition || 'top-right')

  // Logo watermark options
  const includeLogo = ref(options.defaultIncludeLogo ?? true)
  const logoPosition = ref<LogoPosition>(options.defaultLogoPosition || 'bottom-right')

  // Available platforms with connection status
  const availablePlatforms = computed(() => [
    {
      value: 'facebook',
      label: 'Facebook',
      icon: '👥',
      isConnected: socialAccounts.isConnected('facebook'),
      connectedAccounts: socialAccounts.getConnectedAccounts('facebook'),
      isAvailable: true,
      comingSoon: false,
    },
    {
      value: 'instagram',
      label: 'Instagram',
      icon: '📷',
      isConnected: false,
      connectedAccounts: [],
      isAvailable: false,
      comingSoon: true,
    },
    {
      value: 'tiktok',
      label: 'TikTok',
      icon: '🎵',
      isConnected: false,
      connectedAccounts: [],
      isAvailable: false,
      comingSoon: true,
    },
    {
      value: 'twitter',
      label: 'Twitter/X',
      icon: '🐦',
      isConnected: false,
      connectedAccounts: [],
      isAvailable: false,
      comingSoon: true,
    },
    {
      value: 'linkedin',
      label: 'LinkedIn',
      icon: '💼',
      isConnected: false,
      connectedAccounts: [],
      isAvailable: false,
      comingSoon: true,
    },
  ])

  // Computed states
  const hasSelectedMenuItems = computed(() => selectedMenuItems.value.length > 0)
  const hasSelectedPlatforms = computed(() => selectedPlatforms.value.length > 0)
  const hasPromotionalContext = computed(() => promptContext.value.trim().length > 0)
  const selectedMenuItemsCount = computed(() => selectedMenuItems.value.length)

  // Menu item actions
  const toggleMenuItem = (item: any) => {
    const index = selectedMenuItems.value.findIndex((i) => i.name === item.name)
    if (index > -1) {
      selectedMenuItems.value.splice(index, 1)
    } else {
      selectedMenuItems.value.push(item)
    }
  }

  const isItemSelected = (item: any) => {
    return selectedMenuItems.value.some((i) => i.name === item.name)
  }

  const clearMenuItems = () => {
    selectedMenuItems.value = []
  }

  // Platform actions
  const togglePlatform = (platformValue: string) => {
    const index = selectedPlatforms.value.indexOf(platformValue)
    if (index > -1) {
      selectedPlatforms.value.splice(index, 1)
    } else {
      selectedPlatforms.value.push(platformValue)
    }
  }

  const isPlatformSelected = (platformValue: string) => {
    return selectedPlatforms.value.includes(platformValue)
  }

  const clearPlatforms = () => {
    selectedPlatforms.value = []
  }

  // Clear all form state
  const clearAll = () => {
    selectedMenuItems.value = []
    selectedPlatforms.value = []
    promptContext.value = ''
    stickerStyle.value = options.defaultStickerStyle || 'bold'
    stickerPosition.value = options.defaultStickerPosition || 'top-right'
    includeLogo.value = options.defaultIncludeLogo ?? true
    logoPosition.value = options.defaultLogoPosition || 'bottom-right'
  }

  // Reset to defaults without clearing selections
  const resetStickerOptions = () => {
    stickerStyle.value = options.defaultStickerStyle || 'bold'
    stickerPosition.value = options.defaultStickerPosition || 'top-right'
  }

  const resetLogoOptions = () => {
    includeLogo.value = options.defaultIncludeLogo ?? true
    logoPosition.value = options.defaultLogoPosition || 'bottom-right'
  }

  return {
    // Menu item state
    selectedMenuItems,
    hasSelectedMenuItems,
    selectedMenuItemsCount,
    toggleMenuItem,
    isItemSelected,
    clearMenuItems,

    // Platform state
    selectedPlatforms,
    hasSelectedPlatforms,
    availablePlatforms,
    togglePlatform,
    isPlatformSelected,
    clearPlatforms,

    // Campaign context
    promptContext,
    hasPromotionalContext,

    // Sticker options
    stickerStyle,
    stickerPosition,
    resetStickerOptions,

    // Logo options
    includeLogo,
    logoPosition,
    resetLogoOptions,

    // Global actions
    clearAll,
  }
}
