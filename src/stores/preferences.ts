import { defineStore } from 'pinia'
import { ref } from 'vue'

export type CreationMode = 'easy' | 'advanced'

export const usePreferencesStore = defineStore('preferences', () => {
  // Mode preference with localStorage persistence
  const creationMode = ref<CreationMode>(
    (localStorage.getItem('creationMode') as CreationMode) || 'easy'
  )

  // Selected business ID with localStorage persistence
  const selectedBusinessId = ref<string | null>(
    localStorage.getItem('selectedBusinessId')
  )

  // Track if user has started working on content (to prevent mode switching)
  const hasStartedFlow = ref<boolean>(false)

  // Set creation mode (returns true if switch happened, false if blocked)
  function setCreationMode(mode: CreationMode, force = false): boolean {
    // If switching modes and user has started work, block unless forced
    if (!force && hasStartedFlow.value && mode !== creationMode.value) {
      return false // Switch blocked - caller should show confirmation
    }

    creationMode.value = mode
    localStorage.setItem('creationMode', mode)

    // Reset flow state when mode changes
    if (force) {
      hasStartedFlow.value = false
    }

    return true
  }

  // Mark that user has started working on content
  function markFlowStarted() {
    hasStartedFlow.value = true
  }

  // Clear flow state (when user completes or cancels)
  function clearFlowState() {
    hasStartedFlow.value = false
  }

  // Toggle between modes
  function toggleMode() {
    const newMode = creationMode.value === 'easy' ? 'advanced' : 'easy'
    setCreationMode(newMode)
  }

  // Reset all user-specific preferences (called on logout)
  function resetPreferences() {
    creationMode.value = 'easy'
    selectedBusinessId.value = null
    hasStartedFlow.value = false
    localStorage.removeItem('creationMode')
    localStorage.removeItem('selectedBusinessId')
  }

  // Set selected business
  function setSelectedBusiness(businessId: string | null) {
    selectedBusinessId.value = businessId
    if (businessId) {
      localStorage.setItem('selectedBusinessId', businessId)
    } else {
      localStorage.removeItem('selectedBusinessId')
    }
  }

  // Clear selected business
  function clearSelectedBusiness() {
    selectedBusinessId.value = null
    localStorage.removeItem('selectedBusinessId')
  }

  return {
    creationMode,
    selectedBusinessId,
    hasStartedFlow,
    setCreationMode,
    toggleMode,
    markFlowStarted,
    clearFlowState,
    resetPreferences,
    setSelectedBusiness,
    clearSelectedBusiness
  }
})
