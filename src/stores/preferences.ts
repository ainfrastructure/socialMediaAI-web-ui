import { defineStore } from 'pinia'
import { ref } from 'vue'

export type CreationMode = 'easy' | 'advanced'

export const usePreferencesStore = defineStore('preferences', () => {
  const creationMode = ref<CreationMode>(
    (localStorage.getItem('creationMode') as CreationMode) || 'easy'
  )

  const selectedBrandId = ref<string | null>(
    localStorage.getItem('selectedBrandId')
  )

  const hasStartedFlow = ref<boolean>(false)

  function setCreationMode(mode: CreationMode, force = false): boolean {
    if (!force && hasStartedFlow.value && mode !== creationMode.value) {
      return false
    }

    creationMode.value = mode
    localStorage.setItem('creationMode', mode)

    if (force) {
      hasStartedFlow.value = false
    }

    return true
  }

  function markFlowStarted() {
    hasStartedFlow.value = true
  }

  function clearFlowState() {
    hasStartedFlow.value = false
  }

  function toggleMode() {
    const newMode = creationMode.value === 'easy' ? 'advanced' : 'easy'
    setCreationMode(newMode)
  }

  function resetPreferences() {
    creationMode.value = 'easy'
    selectedBrandId.value = null
    hasStartedFlow.value = false
    localStorage.removeItem('creationMode')
    localStorage.removeItem('selectedBrandId')
  }

  function setSelectedBrand(brandId: string | null) {
    selectedBrandId.value = brandId
    if (brandId) {
      localStorage.setItem('selectedBrandId', brandId)
    } else {
      localStorage.removeItem('selectedBrandId')
    }
  }

  function clearSelectedBrand() {
    selectedBrandId.value = null
    localStorage.removeItem('selectedBrandId')
  }

  return {
    creationMode,
    selectedBrandId,
    hasStartedFlow,
    setCreationMode,
    toggleMode,
    markFlowStarted,
    clearFlowState,
    resetPreferences,
    setSelectedBrand,
    clearSelectedBrand
  }
})
