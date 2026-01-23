<template>
  <DashboardLayout>
    <div class="profile-view">
    <div class="profile-container">
      <!-- Header -->
      <div class="profile-header">
        <h1 class="page-title">{{ $t('profile.title') }}</h1>
        <p class="page-subtitle">{{ $t('profile.subtitleExtended') }}</p>
      </div>

      <!-- Personal Information -->
      <BaseCard variant="glass" class="section-card">
        <div class="section-header">
          <h2 class="section-title">{{ $t('profile.personalInfo') }}</h2>
          <button v-if="!editingPersonal" @click="editingPersonal = true" class="edit-btn">
            {{ $t('profile.edit') }}
          </button>
        </div>

        <div v-if="!editingPersonal" class="info-display">
          <div class="info-item">
            <span class="info-label">{{ $t('profile.email') }}</span>
            <span class="info-value">{{ authStore.user?.email }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">{{ $t('profile.userId') }}</span>
            <span class="info-value info-muted">{{ authStore.user?.id }}</span>
          </div>
        </div>

        <form v-else @submit.prevent="updatePersonalInfo" class="edit-form">
          <BaseInput
            v-model="personalForm.email"
            type="email"
            :label="$t('profile.emailAddress')"
            placeholder="your@email.com"
            required
            disabled
          />

          <BaseAlert v-if="personalError" type="error">
            {{ personalError }}
          </BaseAlert>

          <BaseAlert v-if="personalSuccess" type="success">
            {{ $t('profile.profileUpdated') }}
          </BaseAlert>

          <div class="form-actions">
            <BaseButton
              type="button"
              variant="ghost"
              @click="cancelPersonalEdit"
            >
              {{ $t('profile.cancel') }}
            </BaseButton>
            <BaseButton
              type="submit"
              variant="primary"
              :disabled="savingPersonal"
            >
              {{ savingPersonal ? $t('profile.saving') : $t('profile.saveChanges') }}
            </BaseButton>
          </div>
        </form>
      </BaseCard>

      <!-- Subscription & Plan -->
      <BaseCard variant="glass" class="section-card">
        <div class="section-header">
          <h2 class="section-title">{{ $t('profile.subscriptionAndPlan') }}</h2>
          <router-link to="/plans" class="upgrade-link">
            {{ $t('profile.viewPlans') }}
          </router-link>
        </div>

        <div class="plan-info">
          <div class="plan-badge-container">
            <div class="plan-badge" :class="planBadgeClass">
              {{ planDisplayName }}
            </div>
            <span v-if="subscription?.status" class="status-badge" :class="statusBadgeClass">
              {{ subscription.status }}
            </span>
          </div>

          <div class="plan-details">
            <!-- For monthly users, show monthly limit -->
            <div v-if="!isLifetimeMember && !isYearlyMember" class="info-item">
              <span class="info-label">{{ $t('profile.monthlyCredits') }}</span>
              <span class="info-value">{{ usage?.monthly_limit || 0 }}</span>
            </div>
            <!-- For yearly users, show total allocation -->
            <div v-if="isYearlyMember" class="info-item">
              <span class="info-label">{{ $t('plans.creditsUpfront') }}</span>
              <span class="info-value">600</span>
            </div>
            <!-- For lifetime users, show total allocation -->
            <div v-if="isLifetimeMember" class="info-item">
              <span class="info-label">{{ $t('plans.creditsTotal') }}</span>
              <span class="info-value">5000</span>
            </div>
            <div v-if="!isLifetimeMember && !isYearlyMember" class="info-item">
              <span class="info-label">{{ $t('profile.creditsUsedThisMonth') }}</span>
              <span class="info-value">{{ usage?.credits_this_month || 0 }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">{{ $t('profile.remainingCredits') }}</span>
              <span class="info-value credits-remaining">{{ usage?.remaining_credits || 0 }}</span>
            </div>
            <div v-if="subscription?.current_period_end && !isLifetimeMember" class="info-item">
              <span class="info-label">
                {{ subscription.cancel_at_period_end ? $t('profile.subscriptionEnds') : $t('profile.nextBillingDate') }}
              </span>
              <span class="info-value">{{ formatDate(subscription.current_period_end) }}</span>
            </div>
          </div>

          <div v-if="subscription?.cancel_at_period_end" class="cancel-notice">
            {{ $t('profile.cancelNotice') }}
          </div>

          <!-- Lifetime users don't need upgrade/cancel buttons -->
          <div v-if="isLifetimeMember" class="plan-actions">
            <router-link to="/plans">
              <BaseButton variant="secondary">
                {{ $t('profile.viewPlans') }}
              </BaseButton>
            </router-link>
          </div>
          <!-- Regular subscription users -->
          <div v-else class="plan-actions">
            <router-link to="/plans">
              <BaseButton variant="primary">
                {{ $t('profile.upgradePlan') }}
              </BaseButton>
            </router-link>
          </div>
        </div>
      </BaseCard>

      <!-- Billing Information -->
      <BaseCard variant="glass" class="section-card">
        <div class="section-header">
          <h2 class="section-title">{{ $t('profile.billingInformation') }}</h2>
        </div>

        <div class="billing-info">
          <p class="billing-description">
            {{ $t('profile.billingDescription') }}
          </p>

          <BaseButton
            variant="secondary"
            @click="openCustomerPortal"
            :disabled="loadingPortal"
          >
            {{ loadingPortal ? $t('profile.loading') : $t('profile.manageBilling') }}
          </BaseButton>
        </div>
      </BaseCard>

      <!-- Referral Program -->
      <BaseCard id="referral-section" v-if="isReferralEligible" variant="glass" class="section-card referral-section">
        <div class="section-header">
          <h2 class="section-title">{{ $t('referral.sectionTitle') }}</h2>
        </div>

        <div v-if="referralLoading" class="referral-loading">
          <p>{{ $t('common.loading') }}</p>
        </div>

        <div v-else-if="referralStats && referralStats.code" class="referral-content">
          <!-- Referral Code Card -->
          <ReferralCodeCard
            :code="referralStats.code"
            :referral-link="referralStats.referral_link || ''"
            :is-active="true"
          />

          <!-- Referral Stats Card (only show if there are any stats) -->
          <ReferralStatsCard
            v-if="hasReferralStats"
            :total-referrals="referralStats.total_referrals"
            :successful-referrals="referralStats.successful_referrals"
            :pending-referrals="referralStats.pending_referrals"
            :total-credits-formatted="referralStats.total_credits_formatted"
            :current-balance-formatted="referralStats.current_balance_formatted"
            :referrals="referralStats.referrals"
          />
        </div>

        <div v-else class="referral-not-eligible">
          <p>{{ $t('referral.requiresSubscription') }}</p>
        </div>
      </BaseCard>

      <!-- Notification Preferences -->
      <NotificationPreferencesSection />

      <!-- Contact Us -->
      <BaseCard variant="glass" class="section-card">
        <div class="section-header">
          <h2 class="section-title">Contact Us</h2>
        </div>

        <div class="feedback-section">
          <p class="feedback-description">
            Have a question, suggestion, or feedback? We'd love to hear from you! Send us a message and we'll get back to you as soon as possible.
          </p>

          <form @submit.prevent="submitFeedback" class="feedback-form">
            <div class="form-group">
              <label for="feedback-message" class="form-label">Your Message</label>
              <textarea
                id="feedback-message"
                v-model="feedbackMessage"
                class="feedback-textarea"
                placeholder="Share your thoughts, suggestions, or issues..."
                rows="5"
                maxlength="2000"
                :disabled="submittingFeedback"
              ></textarea>
              <div class="character-count">
                {{ feedbackMessage.length }}/2000
              </div>
            </div>

            <BaseAlert v-if="feedbackError" type="error">
              {{ feedbackError }}
            </BaseAlert>

            <BaseAlert v-if="feedbackSuccess" type="success">
              Thank you for your feedback! We've received your message and will get back to you soon.
            </BaseAlert>

            <BaseButton
              type="submit"
              variant="primary"
              :disabled="submittingFeedback || !feedbackMessage.trim()"
            >
              {{ submittingFeedback ? 'Sending...' : 'Send Feedback' }}
            </BaseButton>
          </form>
        </div>
      </BaseCard>

      <!-- Account Security -->
      <BaseCard variant="glass" class="section-card danger-section">
        <div class="section-header">
          <h2 class="section-title">{{ $t('profile.accountSecurity') }}</h2>
        </div>

        <div class="security-actions">
          <div class="security-item">
            <div class="security-info">
              <h3 class="security-title danger-text">{{ $t('profile.deleteAccountDanger') }}</h3>
              <p class="security-description">{{ $t('profile.deleteAccountDescription') }}</p>
            </div>
            <router-link to="/delete-me">
              <BaseButton variant="danger" size="small">
                {{ $t('profile.deleteAccount') }}
              </BaseButton>
            </router-link>
          </div>
        </div>
      </BaseCard>
    </div>


        </div>
  </DashboardLayout>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '../stores/auth'
import { api } from '../services/api'
import { referralService } from '../services/referralService'
import DashboardLayout from '../components/DashboardLayout.vue'
import BaseCard from '../components/BaseCard.vue'
import BaseButton from '../components/BaseButton.vue'
import BaseInput from '../components/BaseInput.vue'
import BaseAlert from '../components/BaseAlert.vue'
import ReferralCodeCard from '../components/ReferralCodeCard.vue'
import ReferralStatsCard from '../components/ReferralStatsCard.vue'
import type { ReferralStats } from '../services/referralService'
import NotificationPreferencesSection from '../components/NotificationPreferencesSection.vue'
import { notificationPreferencesService } from '../services/notificationPreferencesService'

const authStore = useAuthStore()
const { t } = useI18n()

// Personal Information
const editingPersonal = ref(false)
const savingPersonal = ref(false)
const personalError = ref('')
const personalSuccess = ref(false)
const personalForm = reactive({
  email: authStore.user?.email || ''
})

// Billing portal
const loadingPortal = ref(false)

// Sentry test
const testingSentry = ref(false)
const sentryTestSuccess = ref(false)

// Feedback
const feedbackMessage = ref('')
const submittingFeedback = ref(false)
const feedbackSuccess = ref(false)
const feedbackError = ref('')

// Referral
const referralStats = ref<ReferralStats | null>(null)
const referralLoading = ref(false)

// Computed - must be defined before isReferralEligible uses subscription
const subscription = computed(() => authStore.user?.subscription)
const usage = computed(() => authStore.user?.usage)

// Check if user is eligible for referral program (any active paid subscription)
// Lifetime users can refer others but won't earn credits themselves
const isReferralEligible = computed(() => {
  const tier = subscription.value?.tier
  const status = subscription.value?.status
  return status === 'active' && (tier === 'monthly' || tier === 'yearly' || tier === 'lifetime')
})

// Check if user has any referral stats to show
const hasReferralStats = computed(() => {
  if (!referralStats.value) return false
  return (
    referralStats.value.total_referrals > 0 ||
    referralStats.value.successful_referrals > 0 ||
    referralStats.value.pending_referrals > 0
  )
})

async function loadReferralStats() {
  if (!isReferralEligible.value) {
    return
  }

  referralLoading.value = true
  try {
    const response = await referralService.getStats()
    if (response.success && response.data) {
      referralStats.value = {
        eligible: response.data.eligible ?? true,
        code: response.data.code,
        referral_link: response.data.referral_link,
        total_referrals: response.data.total_referrals,
        successful_referrals: response.data.successful_referrals,
        pending_referrals: response.data.pending_referrals,
        total_credits_earned: response.data.total_credits_earned ?? 0,
        total_credits_formatted: response.data.total_credits_formatted,
        current_balance: response.data.current_balance ?? 0,
        current_balance_formatted: response.data.current_balance_formatted,
        referrals: response.data.referrals ?? [],
      }
    }
  } catch (err) {
    console.error('Failed to load referral stats:', err)
  } finally {
    referralLoading.value = false
  }
}

onMounted(() => {
  loadReferralStats()
})

const planDisplayName = computed(() => {
  const tier = subscription.value?.tier || 'monthly'
  return tier.charAt(0).toUpperCase() + tier.slice(1)
})

const planBadgeClass = computed(() => {
  const tier = subscription.value?.tier || 'monthly'
  return `plan-${tier}`
})

const isLifetimeMember = computed(() => subscription.value?.tier === 'lifetime')
const isYearlyMember = computed(() => subscription.value?.tier === 'yearly')

const statusBadgeClass = computed(() => {
  const status = subscription.value?.status || 'inactive'
  return `status-${status}`
})

function formatDate(dateString: string | null): string {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

async function updatePersonalInfo() {
  savingPersonal.value = true
  personalError.value = ''
  personalSuccess.value = false

  try {
    // API call to update profile would go here
    await new Promise(resolve => setTimeout(resolve, 1000)) // Simulated API call

    personalSuccess.value = true
    setTimeout(() => {
      editingPersonal.value = false
      personalSuccess.value = false
    }, 2000)
  } catch (err: any) {
    personalError.value = err.message || t('profile.failedToUpdateProfile')
  } finally {
    savingPersonal.value = false
  }
}

function cancelPersonalEdit() {
  editingPersonal.value = false
  personalForm.email = authStore.user?.email || ''
  personalError.value = ''
  personalSuccess.value = false
}

async function openCustomerPortal() {
  loadingPortal.value = true
  try {
    const response = await api.createCustomerPortal()
    if (response.success && response.data?.url) {
      window.location.href = response.data.url
    } else {
      alert(t('profile.failedToOpenPortal'))
    }
  } catch (err) {

    alert(t('profile.failedToOpenPortal'))
  } finally {
    loadingPortal.value = false
  }
}

async function testSentryError() {
  testingSentry.value = true
  sentryTestSuccess.value = false

  try {
    // Call backend to send test error to Sentry
    const response = await notificationPreferencesService.testSentry()

    if (response.success) {
      // Show success message
      sentryTestSuccess.value = true
      console.log('[Sentry Test] Event ID:', response.data?.eventId)

      // Hide success message after 5 seconds
      setTimeout(() => {
        sentryTestSuccess.value = false
      }, 5000)
    } else {
      console.error('[Sentry Test] Failed:', response.error)
      alert('Failed to send test error: ' + response.error)
    }
  } catch (error) {
    console.error('[Sentry Test] Error:', error)
    alert('Failed to send test error')
  } finally {
    testingSentry.value = false
  }
}

async function submitFeedback() {
  submittingFeedback.value = true
  feedbackSuccess.value = false
  feedbackError.value = ''

  try {
    // Validate message
    if (!feedbackMessage.value.trim()) {
      feedbackError.value = 'Please enter a message'
      return
    }

    // Call backend to send feedback
    const response = await notificationPreferencesService.submitFeedback(feedbackMessage.value.trim())

    if (response.success) {
      // Show success message
      feedbackSuccess.value = true
      feedbackMessage.value = '' // Clear the form
      console.log('[Feedback] Message sent successfully')

      // Hide success message after 10 seconds
      setTimeout(() => {
        feedbackSuccess.value = false
      }, 10000)
    } else {
      feedbackError.value = response.error || 'Failed to send feedback. Please try again.'
      console.error('[Feedback] Failed:', response.error)
    }
  } catch (error) {
    feedbackError.value = 'Failed to send feedback. Please try again.'
    console.error('[Feedback] Error:', error)
  } finally {
    submittingFeedback.value = false
  }
}

</script>

<style scoped>
.profile-view {
  min-height: 100vh;
  min-height: 100dvh;
  padding: var(--space-3xl) var(--space-2xl);
  background: var(--bg-primary);
  width: 100%;
  max-width: 100vw;
  overflow-x: hidden;
}

.profile-container {
  max-width: var(--max-width-lg);
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: var(--space-2xl);
}

/* Header */
.profile-header {
  margin-bottom: var(--space-xl);
}

.page-title {
  font-family: var(--font-heading);
  font-size: var(--text-4xl);
  font-weight: var(--font-bold);
  background: var(--gradient-gold);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: var(--space-md);
}

.page-subtitle {
  color: var(--text-secondary);
  font-size: var(--text-lg);
}

/* Section Card */
.section-card {
  animation: fadeInUp 0.6s var(--ease-smooth);
  animation-fill-mode: both;
}

.section-card:nth-child(2) { animation-delay: 0.1s; }
.section-card:nth-child(3) { animation-delay: 0.2s; }
.section-card:nth-child(4) { animation-delay: 0.3s; }
.section-card:nth-child(5) { animation-delay: 0.4s; }
.section-card:nth-child(6) { animation-delay: 0.5s; }
.section-card:nth-child(7) { animation-delay: 0.6s; }

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

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-xl);
  padding-bottom: var(--space-lg);
  border-bottom: 1px solid rgba(15, 61, 46, 0.1);
}

.section-title {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  color: var(--text-primary);
}

.edit-btn {
  padding: var(--space-sm) var(--space-lg);
  background: transparent;
  border: 1px solid rgba(15, 61, 46, 0.3);
  border-radius: var(--radius-md);
  color: var(--gold-primary);
  font-family: var(--font-body);
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  cursor: pointer;
  transition: var(--transition-base);
}

.edit-btn:hover {
  background: rgba(15, 61, 46, 0.1);
  border-color: rgba(15, 61, 46, 0.5);
}

.upgrade-link {
  padding: var(--space-sm) var(--space-lg);
  background: transparent;
  border: 1px solid rgba(15, 61, 46, 0.3);
  border-radius: var(--radius-md);
  color: var(--gold-primary);
  font-family: var(--font-body);
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  text-decoration: none;
  transition: var(--transition-base);
  display: inline-block;
}

.upgrade-link:hover {
  background: rgba(15, 61, 46, 0.1);
  border-color: rgba(15, 61, 46, 0.5);
}

/* Info Display */
.info-display {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-md) 0;
}

.info-label {
  color: var(--text-secondary);
  font-size: var(--text-base);
  font-weight: var(--font-medium);
}

.info-value {
  color: var(--text-primary);
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  text-align: right;
}

.info-muted {
  color: var(--text-muted);
  font-size: var(--text-sm);
  font-family: monospace;
}

.credits-remaining {
  color: var(--gold-primary);
}

/* Edit Form */
.edit-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.form-actions {
  display: flex;
  gap: var(--space-md);
  justify-content: flex-end;
}

/* Plan Info */
.plan-info {
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
}

.plan-badge-container {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.plan-badge {
  display: inline-block;
  padding: var(--space-md) var(--space-xl);
  border-radius: var(--radius-full);
  font-family: var(--font-heading);
  font-size: var(--text-lg);
  font-weight: var(--font-bold);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.plan-free {
  background: rgba(128, 128, 128, 0.2);
  color: var(--text-secondary);
  border: 1px solid rgba(128, 128, 128, 0.3);
}

.plan-monthly {
  background: rgba(59, 130, 246, 0.2);
  color: #93c5fd;
  border: 1px solid rgba(59, 130, 246, 0.3);
}

.plan-yearly {
  background: rgba(15, 61, 46, 0.2);
  color: var(--gold-primary);
  border: 1px solid rgba(15, 61, 46, 0.3);
}

.plan-lifetime {
  background: rgba(168, 85, 247, 0.2);
  color: #c4b5fd;
  border: 1px solid rgba(168, 85, 247, 0.3);
}

/* Legacy tier classes for backwards compatibility */
.plan-basic {
  background: rgba(59, 130, 246, 0.2);
  color: #93c5fd;
  border: 1px solid rgba(59, 130, 246, 0.3);
}

.plan-pro {
  background: rgba(15, 61, 46, 0.2);
  color: var(--gold-primary);
  border: 1px solid rgba(15, 61, 46, 0.3);
}

.plan-enterprise {
  background: rgba(168, 85, 247, 0.2);
  color: #c4b5fd;
  border: 1px solid rgba(168, 85, 247, 0.3);
}

.status-badge {
  display: inline-block;
  padding: var(--space-xs) var(--space-md);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.status-active {
  background: rgba(34, 197, 94, 0.2);
  color: #86efac;
  border: 1px solid rgba(34, 197, 94, 0.3);
}

.status-trialing {
  background: rgba(59, 130, 246, 0.2);
  color: #93c5fd;
  border: 1px solid rgba(59, 130, 246, 0.3);
}

.status-past_due,
.status-canceled,
.status-inactive {
  background: rgba(239, 68, 68, 0.2);
  color: #fca5a5;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.plan-details {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  background: rgba(255, 255, 255, 0.3);
  padding: var(--space-xl);
  border-radius: var(--radius-md);
  border: 1px solid rgba(15, 61, 46, 0.1);
}

.plan-actions {
  display: flex;
  gap: var(--space-md);
  flex-wrap: wrap;
}

.cancel-notice {
  padding: var(--space-md);
  background: rgba(251, 191, 36, 0.1);
  border: 1px solid rgba(251, 191, 36, 0.3);
  border-radius: var(--radius-md);
  color: #fcd34d;
  font-size: var(--text-sm);
}

/* Billing Info */
.billing-info {
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
}

.billing-description {
  color: var(--text-secondary);
  line-height: var(--leading-normal);
}

/* Referral Section */
.referral-section {
  border: 1px solid rgba(15, 61, 46, 0.15);
}

.referral-loading {
  text-align: center;
  padding: var(--space-2xl);
  color: var(--text-secondary);
}

.referral-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
}

.referral-not-eligible {
  text-align: center;
  padding: var(--space-xl);
  color: var(--text-secondary);
}

/* Feedback Section */
.feedback-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.feedback-description {
  color: var(--text-secondary);
  font-size: var(--text-sm);
  line-height: 1.6;
}

.feedback-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.form-label {
  font-family: var(--font-heading);
  font-size: var(--text-sm);
  color: var(--text-primary);
  font-weight: 500;
}

.feedback-textarea {
  width: 100%;
  padding: var(--space-md);
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-family: var(--font-body);
  font-size: var(--text-sm);
  line-height: 1.6;
  resize: vertical;
  min-height: 120px;
  transition: all 0.2s ease;
}

.feedback-textarea:focus {
  outline: none;
  border-color: var(--border-focus);
  background: rgba(255, 255, 255, 0.08);
}

.feedback-textarea:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.feedback-textarea::placeholder {
  color: var(--text-tertiary);
}

.character-count {
  text-align: right;
  font-size: var(--text-xs);
  color: var(--text-tertiary);
}

/* Security Section */
.danger-section {
  border: 1px solid rgba(239, 68, 68, 0.2);
}

.security-actions {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.security-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-lg);
}

.security-info {
  flex: 1;
}

.security-title {
  font-family: var(--font-heading);
  font-size: var(--text-lg);
  color: var(--text-primary);
  margin-bottom: var(--space-xs);
}

.security-description {
  color: var(--text-secondary);
  font-size: var(--text-sm);
}

.security-divider {
  height: 1px;
  background: rgba(15, 61, 46, 0.1);
}

.danger-text {
  color: #fca5a5;
}

/* Responsive */
@media (max-width: 768px) {
  .profile-view {
    padding: var(--space-xl) var(--space-lg);
  }

  .page-title {
    font-size: var(--text-3xl);
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-md);
  }

  .info-item {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-xs);
  }

  .info-value {
    text-align: left;
  }

  .security-item,
  .dev-tool-item {
    flex-direction: column;
    align-items: flex-start;
  }

  .form-actions {
    flex-direction: column;
  }

  .form-actions button {
    width: 100%;
  }

  .plan-actions {
    flex-direction: column;
  }

  .plan-actions a,
  .plan-actions button {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .profile-view {
    padding: var(--space-lg) var(--space-sm);
  }

  .page-title {
    font-size: var(--text-2xl);
  }

  .section-title {
    font-size: var(--text-lg);
  }

  .section-card {
    padding: var(--space-lg);
  }

  .info-label {
    font-size: var(--text-xs);
  }

  .info-value {
    font-size: var(--text-sm);
  }

  .form-actions button {
    min-height: var(--touch-target-min);
  }

  .plan-badge {
    font-size: var(--text-xs);
    padding: var(--space-xs) var(--space-sm);
  }
}

@media (max-width: 390px) {
  .profile-view {
    padding: var(--space-md) var(--space-xs);
  }

  .page-title {
    font-size: var(--text-xl);
  }

  .section-card {
    padding: var(--space-md);
  }

  .security-item span {
    font-size: var(--text-sm);
  }

  .usage-stat-value {
    font-size: var(--text-xl);
  }
}

/* Reduce motion */
@media (prefers-reduced-motion: reduce) {
  .section-card {
    animation: none;
  }
}

/* ===== DARK MODE OVERRIDES ===== */
:root[data-theme="dark"] .profile-view {
  background: var(--bg-primary);
}

:root[data-theme="dark"] .section-header {
  border-bottom-color: var(--border-color);
}

:root[data-theme="dark"] .edit-btn {
  border-color: var(--border-color);
  color: var(--gold-primary);
}

:root[data-theme="dark"] .edit-btn:hover {
  background: var(--accent-alpha-10);
  border-color: var(--accent-alpha-30);
}

:root[data-theme="dark"] .upgrade-link {
  border-color: var(--border-color);
  color: var(--gold-primary);
}

:root[data-theme="dark"] .upgrade-link:hover {
  background: var(--accent-alpha-10);
  border-color: var(--accent-alpha-30);
}

:root[data-theme="dark"] .plan-details {
  background: var(--bg-tertiary);
  border-color: var(--border-color);
}

:root[data-theme="dark"] .security-divider {
  background: var(--border-color);
}
</style>
