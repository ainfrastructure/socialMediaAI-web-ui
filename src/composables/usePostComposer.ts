import { ref, computed, onUnmounted } from 'vue'
import type {
  ComposerPlatform,
  PlatformConfig,
  ComposerPost,
  PlatformPreviewData,
  HashtagSuggestion,
} from '@/types/composer'

/** Platform configuration with character limits and media rules */
const PLATFORM_CONFIGS: Record<ComposerPlatform, PlatformConfig> = {
  instagram: {
    id: 'instagram',
    name: 'Instagram',
    icon: '📸',
    maxChars: 2200,
    maxHashtags: 30,
    maxImages: 10,
    supportedMediaTypes: ['image', 'video', 'carousel'],
    hashtagStyle: 'appended',
  },
  facebook: {
    id: 'facebook',
    name: 'Facebook',
    icon: '📘',
    maxChars: 63206,
    maxHashtags: 30,
    maxImages: 10,
    supportedMediaTypes: ['image', 'video', 'carousel'],
    hashtagStyle: 'inline',
  },
  twitter: {
    id: 'twitter',
    name: 'X (Twitter)',
    icon: '🐦',
    maxChars: 280,
    maxHashtags: 10,
    maxImages: 4,
    supportedMediaTypes: ['image', 'video'],
    hashtagStyle: 'inline',
  },
  linkedin: {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: '💼',
    maxChars: 3000,
    maxHashtags: 30,
    maxImages: 9,
    supportedMediaTypes: ['image', 'video', 'carousel'],
    hashtagStyle: 'appended',
  },
}

/** Common hashtag suggestions grouped by category */
const COMMON_HASHTAGS: HashtagSuggestion[] = [
  { tag: '#foodie', relevance: 'high' },
  { tag: '#instafood', relevance: 'high' },
  { tag: '#restaurant', relevance: 'high' },
  { tag: '#foodphotography', relevance: 'medium' },
  { tag: '#delicious', relevance: 'medium' },
  { tag: '#foodstagram', relevance: 'medium' },
  { tag: '#yummy', relevance: 'medium' },
  { tag: '#homemade', relevance: 'low' },
  { tag: '#foodlover', relevance: 'low' },
  { tag: '#chef', relevance: 'low' },
  { tag: '#cooking', relevance: 'low' },
  { tag: '#tasty', relevance: 'low' },
  { tag: '#healthyfood', relevance: 'low' },
  { tag: '#brunch', relevance: 'low' },
  { tag: '#dinner', relevance: 'low' },
]

/**
 * Composable for managing multi-platform post composition.
 * Handles character counting, platform-specific previews, hashtag management, and image uploads.
 */
export function usePostComposer(initialPlatforms?: ComposerPlatform[]) {
  // State
  const post = ref<ComposerPost>({
    text: '',
    hashtags: [],
    images: [],
    platformOverrides: {},
  })

  const selectedPlatforms = ref<ComposerPlatform[]>(
    initialPlatforms ?? ['instagram', 'facebook']
  )

  const imagePreviewUrls = ref<Map<string, string>>(new Map())

  // Computed: Platform configs for selected platforms
  const activePlatformConfigs = computed(() =>
    selectedPlatforms.value.map((id) => PLATFORM_CONFIGS[id])
  )

  /**
   * Build the full text for a given platform, combining post text with hashtags.
   */
  function getFullText(platform: ComposerPlatform): string {
    const override = post.value.platformOverrides[platform]
    const baseText = override?.text ?? post.value.text
    const hashtags = post.value.hashtags

    if (hashtags.length === 0) return baseText

    const hashtagString = hashtags.join(' ')
    const config = PLATFORM_CONFIGS[platform]

    if (config.hashtagStyle === 'appended') {
      return baseText ? `${baseText}\n\n${hashtagString}` : hashtagString
    }
    // inline: just append with a space
    return baseText ? `${baseText} ${hashtagString}` : hashtagString
  }

  /**
   * Calculate character count for a specific platform.
   */
  function getCharCount(platform: ComposerPlatform): number {
    return getFullText(platform).length
  }

  // Computed: Platform preview data for each active platform
  const platformPreviews = computed<PlatformPreviewData[]>(() =>
    selectedPlatforms.value.map((platformId) => {
      const config = PLATFORM_CONFIGS[platformId]
      const fullText = getFullText(platformId)
      const charCount = fullText.length

      return {
        platform: platformId,
        text: fullText,
        hashtags: post.value.hashtags,
        charCount,
        maxChars: config.maxChars,
        isOverLimit: charCount > config.maxChars,
        imagePreviewUrls: Array.from(imagePreviewUrls.value.values()),
      }
    })
  )

  // Computed: Whether any platform is over the character limit
  const hasOverLimitPlatform = computed(() =>
    platformPreviews.value.some((p) => p.isOverLimit)
  )

  // Computed: Smallest max char limit among selected platforms
  const strictestCharLimit = computed(() => {
    if (selectedPlatforms.value.length === 0) return Infinity
    return Math.min(
      ...selectedPlatforms.value.map((id) => PLATFORM_CONFIGS[id].maxChars)
    )
  })

  // Computed: Max images allowed (smallest across selected platforms)
  const maxImagesAllowed = computed(() => {
    if (selectedPlatforms.value.length === 0) return 10
    return Math.min(
      ...selectedPlatforms.value.map((id) => PLATFORM_CONFIGS[id].maxImages)
    )
  })

  // Computed: Filtered hashtag suggestions (exclude already-selected ones)
  const hashtagSuggestions = computed<HashtagSuggestion[]>(() => {
    const selected = new Set(post.value.hashtags.map((h) => h.toLowerCase()))
    return COMMON_HASHTAGS.filter((s) => !selected.has(s.tag.toLowerCase()))
  })

  /** Toggle a platform selection on/off */
  function togglePlatform(platform: ComposerPlatform) {
    const idx = selectedPlatforms.value.indexOf(platform)
    if (idx >= 0) {
      selectedPlatforms.value.splice(idx, 1)
      // Clean up override if unselecting
      delete post.value.platformOverrides[platform]
    } else {
      selectedPlatforms.value.push(platform)
    }
  }

  /** Set platform-specific text override */
  function setPlatformOverride(platform: ComposerPlatform, text: string) {
    post.value.platformOverrides[platform] = { text }
  }

  /** Clear platform-specific text override */
  function clearPlatformOverride(platform: ComposerPlatform) {
    delete post.value.platformOverrides[platform]
  }

  /** Add a hashtag (normalizes to lowercase with # prefix) */
  function addHashtag(tag: string) {
    let normalized = tag.trim().toLowerCase()
    if (!normalized) return

    if (!normalized.startsWith('#')) {
      normalized = '#' + normalized
    }

    // Remove special chars except # and alphanumeric/underscore
    normalized = normalized.replace(/[^#\w]/g, '')

    if (normalized.length <= 1) return // just a #
    if (post.value.hashtags.includes(normalized)) return

    // Check max hashtags for strictest platform
    const maxHashtags = Math.min(
      ...selectedPlatforms.value.map((id) => PLATFORM_CONFIGS[id].maxHashtags)
    )
    if (post.value.hashtags.length >= maxHashtags) return

    post.value.hashtags.push(normalized)
  }

  /** Remove a hashtag by index */
  function removeHashtag(index: number) {
    if (index >= 0 && index < post.value.hashtags.length) {
      post.value.hashtags.splice(index, 1)
    }
  }

  /** Maximum file size in bytes (10 MB) */
  const MAX_FILE_SIZE = 10 * 1024 * 1024

  /** Add images (validates type, size, and count) */
  function addImages(files: File[]): string | null {
    const imageFiles = files.filter((f) => f.type.startsWith('image/'))

    if (imageFiles.length !== files.length) {
      return 'Only image files are allowed'
    }

    // Validate file sizes
    const oversized = imageFiles.filter((f) => f.size > MAX_FILE_SIZE)
    if (oversized.length > 0) {
      return `Some files exceed the 10 MB limit: ${oversized.map((f) => f.name).join(', ')}`
    }

    const totalAfterAdd = post.value.images.length + imageFiles.length
    if (totalAfterAdd > maxImagesAllowed.value) {
      return `Maximum ${maxImagesAllowed.value} images allowed across selected platforms`
    }

    for (const file of imageFiles) {
      post.value.images.push(file)
      const url = URL.createObjectURL(file)
      imagePreviewUrls.value.set(file.name + file.lastModified, url)
    }

    return null // no error
  }

  /** Remove an image by index */
  function removeImage(index: number) {
    if (index < 0 || index >= post.value.images.length) return

    const file = post.value.images[index]
    const key = file.name + file.lastModified
    const url = imagePreviewUrls.value.get(key)
    if (url) {
      URL.revokeObjectURL(url)
      imagePreviewUrls.value.delete(key)
    }

    post.value.images.splice(index, 1)
  }

  /** Get preview URL for an image */
  function getImagePreviewUrl(file: File): string | undefined {
    return imagePreviewUrls.value.get(file.name + file.lastModified)
  }

  /** Reset the composer to initial state */
  function reset() {
    post.value = {
      text: '',
      hashtags: [],
      images: [],
      platformOverrides: {},
    }
    // Revoke all object URLs
    imagePreviewUrls.value.forEach((url) => URL.revokeObjectURL(url))
    imagePreviewUrls.value.clear()
  }

  /** Validate the post before submission */
  function validate(): string[] {
    const errors: string[] = []

    if (!post.value.text.trim() && post.value.hashtags.length === 0) {
      errors.push('Post content is required')
    }

    if (selectedPlatforms.value.length === 0) {
      errors.push('Select at least one platform')
    }

    for (const preview of platformPreviews.value) {
      if (preview.isOverLimit) {
        const config = PLATFORM_CONFIGS[preview.platform]
        errors.push(
          `${config.name} exceeds character limit (${preview.charCount}/${preview.maxChars})`
        )
      }
    }

    return errors
  }

  // Cleanup object URLs on unmount
  onUnmounted(() => {
    imagePreviewUrls.value.forEach((url) => URL.revokeObjectURL(url))
    imagePreviewUrls.value.clear()
  })

  return {
    // State
    post,
    selectedPlatforms,

    // Computed
    activePlatformConfigs,
    platformPreviews,
    hasOverLimitPlatform,
    strictestCharLimit,
    maxImagesAllowed,
    hashtagSuggestions,

    // Methods
    togglePlatform,
    setPlatformOverride,
    clearPlatformOverride,
    addHashtag,
    removeHashtag,
    addImages,
    removeImage,
    getImagePreviewUrl,
    getFullText,
    getCharCount,
    reset,
    validate,

    // Constants
    PLATFORM_CONFIGS,
  }
}
