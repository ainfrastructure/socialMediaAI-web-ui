import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface GeneratedPostContent {
  postText: string
  hashtags: string[]
}

export interface VideoOptions {
  duration: 4 | 6 | 8
  aspectRatio: '16:9' | '9:16'
  resolution: '720p' | '1080p'
}

export interface StickerOptions {
  text: string
  style: 'bold' | 'outlined' | 'ribbon' | 'badge' | 'starburst'
  position: 'top-left' | 'top-center' | 'top-right' | 'center' | 'bottom-left' | 'bottom-right'
}

export interface LogoOptions {
  include: boolean
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  url?: string
}

export const useGenerationStore = defineStore('generation', () => {
  // Active tab state
  const activeTab = ref<'image' | 'video'>('image')

  // AI-generated prompts
  const imagePrompts = ref<string[]>([])
  const videoPrompts = ref<string[]>([])
  const selectedImagePromptIndex = ref<number | null>(null)
  const selectedVideoPromptIndex = ref<number | null>(null)
  const loadingPrompts = ref(false)
  const editablePrompt = ref('')

  // Image generation state
  const generatingImage = ref(false)
  const generatedImageUrl = ref('')

  // Video generation state
  const generatingVideo = ref(false)
  const generatedVideoUrl = ref('')
  const videoOperationId = ref('')
  const videoProgress = ref(0)

  // Video options
  const videoOptions = ref<VideoOptions>({
    duration: 8,
    aspectRatio: '16:9',
    resolution: '720p'
  })

  // Sticker options
  const stickerOptions = ref<StickerOptions>({
    text: '',
    style: 'bold',
    position: 'top-right'
  })

  // Logo options
  const logoOptions = ref<LogoOptions>({
    include: false,
    position: 'bottom-right'
  })

  // Post content
  const generatingPostContent = ref(false)
  const generatedPostContent = ref<GeneratedPostContent | null>(null)

  // Messages
  const message = ref('')
  const messageType = ref<'success' | 'error' | 'info'>('info')

  // Error state
  const error = ref<string | null>(null)

  // Computed
  const selectedPrompt = computed(() => {
    if (activeTab.value === 'image' && selectedImagePromptIndex.value !== null) {
      return imagePrompts.value[selectedImagePromptIndex.value]
    } else if (activeTab.value === 'video' && selectedVideoPromptIndex.value !== null) {
      return videoPrompts.value[selectedVideoPromptIndex.value]
    }
    return null
  })

  const hasImagePrompts = computed(() => imagePrompts.value.length > 0)
  const hasVideoPrompts = computed(() => videoPrompts.value.length > 0)
  const hasGeneratedContent = computed(() => !!generatedImageUrl.value || !!generatedVideoUrl.value)
  const isGenerating = computed(() => generatingImage.value || generatingVideo.value)

  const promptCount = computed(() => imagePrompts.value.length + videoPrompts.value.length)

  // Actions
  function setActiveTab(tab: 'image' | 'video') {
    activeTab.value = tab

    // Auto-select first prompt if none selected
    if (tab === 'image' && selectedImagePromptIndex.value === null && imagePrompts.value.length > 0) {
      selectImagePrompt(0)
    } else if (tab === 'video' && selectedVideoPromptIndex.value === null && videoPrompts.value.length > 0) {
      selectVideoPrompt(0)
    }

    // Update editable prompt
    if (selectedPrompt.value) {
      editablePrompt.value = selectedPrompt.value
    }
  }

  function selectImagePrompt(index: number) {
    selectedImagePromptIndex.value = index
    editablePrompt.value = imagePrompts.value[index]
    // Clear generated image when selecting new prompt
    generatedImageUrl.value = ''
  }

  function selectVideoPrompt(index: number) {
    selectedVideoPromptIndex.value = index
    editablePrompt.value = videoPrompts.value[index]
    // Clear generated video when selecting new prompt
    generatedVideoUrl.value = ''
  }

  function setPrompts(newImagePrompts: string[], newVideoPrompts: string[]) {
    imagePrompts.value = newImagePrompts
    videoPrompts.value = newVideoPrompts

    // Auto-select first prompt based on active tab
    if (activeTab.value === 'image' && newImagePrompts.length > 0) {
      selectImagePrompt(0)
    } else if (activeTab.value === 'video' && newVideoPrompts.length > 0) {
      selectVideoPrompt(0)
    }
  }

  function setGeneratedImage(url: string) {
    generatedImageUrl.value = url
    generatingImage.value = false
  }

  function setGeneratedVideo(url: string) {
    generatedVideoUrl.value = url
    generatingVideo.value = false
    videoProgress.value = 100
  }

  function setVideoProgress(progress: number) {
    videoProgress.value = progress
  }

  function setPostContent(content: GeneratedPostContent | null) {
    generatedPostContent.value = content
  }

  function showMessage(msg: string, type: 'success' | 'error' | 'info' = 'info') {
    message.value = msg
    messageType.value = type
  }

  function clearMessage() {
    message.value = ''
  }

  function clearImageGeneration() {
    generatedImageUrl.value = ''
    generatingImage.value = false
  }

  function clearVideoGeneration() {
    generatedVideoUrl.value = ''
    generatingVideo.value = false
    videoProgress.value = 0
    videoOperationId.value = ''
  }

  function clearPrompts() {
    imagePrompts.value = []
    videoPrompts.value = []
    selectedImagePromptIndex.value = null
    selectedVideoPromptIndex.value = null
    editablePrompt.value = ''
  }

  function clearAll() {
    clearPrompts()
    clearImageGeneration()
    clearVideoGeneration()
    generatedPostContent.value = null
    error.value = null
    message.value = ''
  }

  function reset() {
    clearAll()
    activeTab.value = 'image'
    videoOptions.value = { duration: 8, aspectRatio: '16:9', resolution: '720p' }
    stickerOptions.value = { text: '', style: 'bold', position: 'top-right' }
    logoOptions.value = { include: false, position: 'bottom-right' }
  }

  // State setters for loading states (views manage API calls)
  function setLoadingPrompts(loading: boolean) {
    loadingPrompts.value = loading
  }

  function setGeneratingImage(generating: boolean) {
    generatingImage.value = generating
  }

  function setGeneratingVideo(generating: boolean) {
    generatingVideo.value = generating
  }

  function setError(err: string | null) {
    error.value = err
  }

  function setVideoOperationId(id: string) {
    videoOperationId.value = id
  }

  return {
    // State
    activeTab,
    imagePrompts,
    videoPrompts,
    selectedImagePromptIndex,
    selectedVideoPromptIndex,
    loadingPrompts,
    editablePrompt,
    generatingImage,
    generatedImageUrl,
    generatingVideo,
    generatedVideoUrl,
    videoOperationId,
    videoProgress,
    videoOptions,
    stickerOptions,
    logoOptions,
    generatingPostContent,
    generatedPostContent,
    message,
    messageType,
    error,

    // Computed
    selectedPrompt,
    hasImagePrompts,
    hasVideoPrompts,
    hasGeneratedContent,
    isGenerating,
    promptCount,

    // Actions
    setActiveTab,
    selectImagePrompt,
    selectVideoPrompt,
    setPrompts,
    setGeneratedImage,
    setGeneratedVideo,
    setVideoProgress,
    setPostContent,
    showMessage,
    clearMessage,
    clearImageGeneration,
    clearVideoGeneration,
    clearPrompts,
    clearAll,
    reset,

    // State setters (views manage API calls)
    setLoadingPrompts,
    setGeneratingImage,
    setGeneratingVideo,
    setError,
    setVideoOperationId,
  }
})
