import { defineStore } from 'pinia'
import { ref } from 'vue'

export type CreationMode = 'easy' | 'advanced'

export const usePreferencesStore = defineStore('preferences', () => {
  // Mode preference with localStorage persistence
  const creationMode = ref<CreationMode>(
    (localStorage.getItem('creationMode') as CreationMode) || 'easy'
  )

  // Track if user has seen Facebook onboarding
  const hasSeenFacebookOnboarding = ref<boolean>(
    localStorage.getItem('hasSeenFacebookOnboarding') === 'true'
  )

  // Track if this is user's first time in playground
  const isFirstTimeUser = ref<boolean>(
    localStorage.getItem('isFirstTimeUser') !== 'false' // default true
  )

  // Set creation mode
  function setCreationMode(mode: CreationMode) {
    creationMode.value = mode
    localStorage.setItem('creationMode', mode)
  }

  // Toggle between modes
  function toggleMode() {
    const newMode = creationMode.value === 'easy' ? 'advanced' : 'easy'
    setCreationMode(newMode)
  }

  // Mark Facebook onboarding as seen
  function markFacebookOnboardingSeen() {
    hasSeenFacebookOnboarding.value = true
    localStorage.setItem('hasSeenFacebookOnboarding', 'true')
  }

  // Mark user as no longer first-time
  function markUserExperienced() {
    isFirstTimeUser.value = false
    localStorage.setItem('isFirstTimeUser', 'false')
  }

  // Reset onboarding (for testing)
  function resetOnboarding() {
    hasSeenFacebookOnboarding.value = false
    isFirstTimeUser.value = true
    localStorage.removeItem('hasSeenFacebookOnboarding')
    localStorage.removeItem('isFirstTimeUser')
  }

  return {
    creationMode,
    hasSeenFacebookOnboarding,
    isFirstTimeUser,
    setCreationMode,
    toggleMode,
    markFacebookOnboardingSeen,
    markUserExperienced,
    resetOnboarding
  }
})
