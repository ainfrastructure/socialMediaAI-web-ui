import { computed } from 'vue'
import { useFacebookStore } from '../stores/facebook'
import { useInstagramStore } from '../stores/instagram'

export type SocialPlatform = 'facebook' | 'instagram' | 'twitter' | 'linkedin' | 'tiktok' | 'youtube'

export interface PlatformInfo {
  id: SocialPlatform
  name: string
  icon: string
  isConnected: boolean
  connectedAccounts: Array<{ id: string; name: string }>
  isAvailable: boolean
  comingSoon: boolean
}

/**
 * Composable for managing social media account connections
 * Centralizes logic for checking connection status across platforms
 */
export function useSocialAccounts() {
  const facebookStore = useFacebookStore()
  const instagramStore = useInstagramStore()

  /**
   * Check if a specific platform is connected
   */
  const isConnected = (platform: SocialPlatform): boolean => {
    switch (platform) {
      case 'facebook':
        return facebookStore.connectedPages.length > 0
      case 'instagram':
        return instagramStore.connectedAccounts.length > 0
      // Future platforms
      case 'twitter':
      case 'linkedin':
      case 'tiktok':
      case 'youtube':
        return false
      default:
        return false
    }
  }

  /**
   * Get connected accounts for a specific platform
   */
  const getConnectedAccounts = (platform: SocialPlatform) => {
    switch (platform) {
      case 'facebook':
        return facebookStore.connectedPages.map((page) => ({
          id: page.pageId,
          name: page.pageName,
        }))
      case 'instagram':
        return instagramStore.connectedAccounts.map((account) => ({
          id: account.instagramAccountId,
          name: account.username,
        }))
      // Future platforms
      default:
        return []
    }
  }

  /**
   * Get total number of connected accounts across all platforms
   */
  const totalConnectedAccounts = computed(() => {
    return facebookStore.connectedPages.length + instagramStore.connectedAccounts.length
  })

  /**
   * Check if any accounts are connected
   */
  const hasAnyConnections = computed(() => {
    return totalConnectedAccounts.value > 0
  })

  /**
   * Get all platform information with connection status
   */
  const platforms = computed<PlatformInfo[]>(() => [
    {
      id: 'facebook',
      name: 'Facebook',
      icon: '📘',
      isConnected: facebookStore.connectedPages.length > 0,
      connectedAccounts: facebookStore.connectedPages.map((page) => ({
        id: page.pageId,
        name: page.pageName,
      })),
      isAvailable: true,
      comingSoon: false,
    },
    {
      id: 'instagram',
      name: 'Instagram',
      icon: '📸',
      isConnected: instagramStore.connectedAccounts.length > 0,
      connectedAccounts: instagramStore.connectedAccounts.map((account) => ({
        id: account.instagramAccountId,
        name: account.username,
      })),
      isAvailable: true,
      comingSoon: false,
    },
    {
      id: 'twitter',
      name: 'Twitter',
      icon: '🐦',
      isConnected: false,
      connectedAccounts: [],
      isAvailable: false,
      comingSoon: true,
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      icon: '💼',
      isConnected: false,
      connectedAccounts: [],
      isAvailable: false,
      comingSoon: true,
    },
    {
      id: 'tiktok',
      name: 'TikTok',
      icon: '🎵',
      isConnected: false,
      connectedAccounts: [],
      isAvailable: false,
      comingSoon: true,
    },
    {
      id: 'youtube',
      name: 'YouTube',
      icon: '📺',
      isConnected: false,
      connectedAccounts: [],
      isAvailable: false,
      comingSoon: true,
    },
  ])

  /**
   * Get only available platforms (not coming soon)
   */
  const availablePlatforms = computed(() => {
    return platforms.value.filter((p) => p.isAvailable)
  })

  /**
   * Get only connected platforms
   */
  const connectedPlatforms = computed(() => {
    return platforms.value.filter((p) => p.isConnected)
  })

  return {
    // Functions
    isConnected,
    getConnectedAccounts,

    // Computed values
    platforms,
    availablePlatforms,
    connectedPlatforms,
    totalConnectedAccounts,
    hasAnyConnections,

    // Store references (for loading states, etc.)
    facebookStore,
    instagramStore,
  }
}
