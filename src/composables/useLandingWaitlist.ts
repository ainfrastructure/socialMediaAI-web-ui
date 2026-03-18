import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { waitlistService } from '@/services/waitlistService'

export function useLandingWaitlist(referrer = 'landing-page') {
  const { t } = useI18n()

  const email = ref('')
  const loading = ref(false)
  const success = ref(false)
  const error = ref('')
  const count = ref(0)

  async function submit() {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email.value || !emailRegex.test(email.value)) {
      error.value = t('appLanding.earlyBird.invalidEmail')
      return
    }

    loading.value = true
    error.value = ''

    try {
      const response = await waitlistService.join(email.value, { referrer })

      if (response.success) {
        success.value = true
        const newCount = (response as any).count ?? (response as any).data?.count
        if (newCount !== undefined) {
          count.value = newCount
        } else {
          count.value += 1
        }
      } else if ((response as any).error === 'already_on_waitlist') {
        error.value = t('appLanding.earlyBird.alreadyOnList')
      } else {
        error.value = (response as any).error || t('appLanding.earlyBird.error')
      }
    } catch {
      error.value = t('appLanding.earlyBird.error')
    } finally {
      loading.value = false
    }
  }

  return { email, loading, success, error, count, submit }
}
