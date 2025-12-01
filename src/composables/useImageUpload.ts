import { ref, computed } from 'vue'

export interface UseImageUploadOptions {
  maxSizeMB?: number
  allowedTypes?: string[]
  onError?: (message: string) => void
}

const DEFAULT_MAX_SIZE_MB = 10
const DEFAULT_ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

export function useImageUpload(options: UseImageUploadOptions = {}) {
  const {
    maxSizeMB = DEFAULT_MAX_SIZE_MB,
    allowedTypes = DEFAULT_ALLOWED_TYPES,
    onError
  } = options

  const uploadedFile = ref<File | null>(null)
  const preview = ref<string | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const hasFile = computed(() => uploadedFile.value !== null)
  const fileName = computed(() => uploadedFile.value?.name || null)
  const fileSize = computed(() => uploadedFile.value?.size || 0)
  const fileSizeFormatted = computed(() => {
    const size = fileSize.value
    if (size === 0) return ''
    if (size < 1024) return `${size} B`
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
    return `${(size / (1024 * 1024)).toFixed(1)} MB`
  })

  function validateFile(file: File): string | null {
    // Check file type
    if (!allowedTypes.includes(file.type)) {
      return `Invalid file type. Allowed: ${allowedTypes.map(t => t.split('/')[1]).join(', ')}`
    }

    // Check file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024
    if (file.size > maxSizeBytes) {
      return `File too large. Maximum size: ${maxSizeMB}MB`
    }

    return null
  }

  function handleFileSelect(file: File | null): boolean {
    error.value = null

    if (!file) {
      clear()
      return false
    }

    const validationError = validateFile(file)
    if (validationError) {
      error.value = validationError
      onError?.(validationError)
      return false
    }

    isLoading.value = true
    uploadedFile.value = file

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      preview.value = e.target?.result as string
      isLoading.value = false
    }
    reader.onerror = () => {
      error.value = 'Failed to read file'
      onError?.('Failed to read file')
      isLoading.value = false
    }
    reader.readAsDataURL(file)

    return true
  }

  function handleInputChange(event: Event): boolean {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0] || null
    const success = handleFileSelect(file)
    // Reset input so same file can be selected again
    input.value = ''
    return success
  }

  function handleDrop(event: DragEvent): boolean {
    event.preventDefault()
    const file = event.dataTransfer?.files?.[0] || null
    return handleFileSelect(file)
  }

  function clear() {
    uploadedFile.value = null
    preview.value = null
    error.value = null
    isLoading.value = false
  }

  // Get base64 data for API calls (without data URL prefix)
  function getBase64Data(): string | null {
    if (!preview.value) return null
    const base64 = preview.value.split(',')[1]
    return base64 || null
  }

  // Get full data for API calls
  function getUploadData(): { base64Data: string; mimeType: string } | null {
    if (!preview.value || !uploadedFile.value) return null
    const base64Data = getBase64Data()
    if (!base64Data) return null
    return {
      base64Data,
      mimeType: uploadedFile.value.type
    }
  }

  return {
    // State
    uploadedFile,
    preview,
    isLoading,
    error,

    // Computed
    hasFile,
    fileName,
    fileSize,
    fileSizeFormatted,

    // Methods
    handleFileSelect,
    handleInputChange,
    handleDrop,
    clear,
    validateFile,
    getBase64Data,
    getUploadData
  }
}
