<template>
  <div class="profile-view">
    <div class="profile-container">
      <!-- Header -->
      <div class="profile-header">
        <h1 class="page-title">Profile Settings</h1>
        <p class="page-subtitle">Manage your account information and subscription</p>
      </div>

      <!-- Personal Information -->
      <BaseCard variant="glass" class="section-card">
        <div class="section-header">
          <h2 class="section-title">Personal Information</h2>
          <button v-if="!editingPersonal" @click="editingPersonal = true" class="edit-btn">
            Edit
          </button>
        </div>

        <div v-if="!editingPersonal" class="info-display">
          <div class="info-item">
            <span class="info-label">Email</span>
            <span class="info-value">{{ authStore.user?.email }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">User ID</span>
            <span class="info-value info-muted">{{ authStore.user?.id }}</span>
          </div>
        </div>

        <form v-else @submit.prevent="updatePersonalInfo" class="edit-form">
          <BaseInput
            v-model="personalForm.email"
            type="email"
            label="Email Address"
            placeholder="your@email.com"
            required
            disabled
          />

          <BaseAlert v-if="personalError" type="error">
            {{ personalError }}
          </BaseAlert>

          <BaseAlert v-if="personalSuccess" type="success">
            Profile updated successfully!
          </BaseAlert>

          <div class="form-actions">
            <BaseButton
              type="button"
              variant="ghost"
              @click="cancelPersonalEdit"
            >
              Cancel
            </BaseButton>
            <BaseButton
              type="submit"
              variant="primary"
              :disabled="savingPersonal"
            >
              {{ savingPersonal ? 'Saving...' : 'Save Changes' }}
            </BaseButton>
          </div>
        </form>
      </BaseCard>

      <!-- Subscription & Plan -->
      <BaseCard variant="glass" class="section-card">
        <div class="section-header">
          <h2 class="section-title">Subscription & Plan</h2>
          <router-link to="/plans" class="upgrade-link">
            View Plans
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
            <div class="info-item">
              <span class="info-label">Monthly Credits</span>
              <span class="info-value">{{ usage?.monthly_limit || 0 }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Credits Used This Month</span>
              <span class="info-value">{{ usage?.credits_this_month || 0 }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Remaining Credits</span>
              <span class="info-value credits-remaining">{{ usage?.remaining_credits || 0 }}</span>
            </div>
            <div v-if="subscription?.current_period_end" class="info-item">
              <span class="info-label">
                {{ subscription.cancel_at_period_end ? 'Subscription Ends' : 'Next Billing Date' }}
              </span>
              <span class="info-value">{{ formatDate(subscription.current_period_end) }}</span>
            </div>
          </div>

          <div v-if="subscription?.cancel_at_period_end" class="cancel-notice">
            ⚠️ Your subscription will be cancelled at the end of the current billing period.
          </div>

          <div v-if="subscription?.tier !== 'free'" class="plan-actions">
            <router-link to="/plans">
              <BaseButton variant="primary">
                Upgrade Plan
              </BaseButton>
            </router-link>
            <BaseButton
              v-if="!subscription?.cancel_at_period_end"
              variant="ghost"
              @click="showCancelModal = true"
            >
              Cancel Subscription
            </BaseButton>
          </div>
          <div v-else class="plan-actions">
            <router-link to="/plans">
              <BaseButton variant="primary">
                Upgrade to Premium
              </BaseButton>
            </router-link>
          </div>
        </div>
      </BaseCard>

      <!-- Billing Information -->
      <BaseCard variant="glass" class="section-card">
        <div class="section-header">
          <h2 class="section-title">Billing Information</h2>
        </div>

        <div class="billing-info">
          <p class="billing-description">
            Billing is managed through Stripe. Click below to manage your payment methods, view invoices, and update billing information.
          </p>

          <BaseButton
            variant="secondary"
            @click="openCustomerPortal"
            :disabled="loadingPortal"
          >
            {{ loadingPortal ? 'Loading...' : 'Manage Billing' }}
          </BaseButton>
        </div>
      </BaseCard>

      <!-- Account Security -->
      <BaseCard variant="glass" class="section-card danger-section">
        <div class="section-header">
          <h2 class="section-title">Account Security</h2>
        </div>

        <div class="security-actions">
          <div class="security-item">
            <div class="security-info">
              <h3 class="security-title">Password</h3>
              <p class="security-description">Reset your password via email</p>
            </div>
            <router-link to="/auth/reset-password">
              <BaseButton variant="ghost" size="small">
                Reset Password
              </BaseButton>
            </router-link>
          </div>

          <div class="security-divider"></div>

          <div class="security-item">
            <div class="security-info">
              <h3 class="security-title danger-text">Delete Account</h3>
              <p class="security-description">Permanently delete your account and all data</p>
            </div>
            <BaseButton variant="danger" size="small" @click="showDeleteModal = true">
              Delete Account
            </BaseButton>
          </div>
        </div>
      </BaseCard>
    </div>

    <!-- Cancel Subscription Modal -->
    <Teleport to="body">
      <div v-if="showCancelModal" class="modal-overlay" @click="showCancelModal = false">
        <div class="modal-content" @click.stop>
          <h3 class="modal-title">Cancel Subscription</h3>
          <p class="modal-text">
            Are you sure you want to cancel your subscription? You'll still have access until the end of your current billing period.
          </p>
          <div class="modal-actions">
            <BaseButton variant="ghost" @click="showCancelModal = false">
              Keep Subscription
            </BaseButton>
            <BaseButton variant="danger" @click="confirmCancelSubscription">
              Cancel Subscription
            </BaseButton>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Delete Account Modal -->
    <Teleport to="body">
      <div v-if="showDeleteModal" class="modal-overlay" @click="showDeleteModal = false">
        <div class="modal-content" @click.stop>
          <h3 class="modal-title danger-text">Delete Account</h3>
          <p class="modal-text">
            ⚠️ This action cannot be undone. All your data, restaurants, and generated content will be permanently deleted.
          </p>
          <BaseInput
            v-model="deleteConfirmText"
            label="Type 'DELETE' to confirm"
            placeholder="DELETE"
          />
          <div class="modal-actions">
            <BaseButton variant="ghost" @click="showDeleteModal = false">
              Cancel
            </BaseButton>
            <BaseButton
              variant="danger"
              @click="confirmDeleteAccount"
              :disabled="deleteConfirmText !== 'DELETE'"
            >
              Delete My Account
            </BaseButton>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { api } from '../services/api'
import BaseCard from '../components/BaseCard.vue'
import BaseButton from '../components/BaseButton.vue'
import BaseInput from '../components/BaseInput.vue'
import BaseAlert from '../components/BaseAlert.vue'

const router = useRouter()
const authStore = useAuthStore()

// Personal Information
const editingPersonal = ref(false)
const savingPersonal = ref(false)
const personalError = ref('')
const personalSuccess = ref(false)
const personalForm = reactive({
  email: authStore.user?.email || ''
})

// Modals
const showCancelModal = ref(false)
const showDeleteModal = ref(false)
const deleteConfirmText = ref('')
const loadingPortal = ref(false)

// Computed
const subscription = computed(() => authStore.user?.subscription)
const usage = computed(() => authStore.user?.usage)

const planDisplayName = computed(() => {
  const tier = subscription.value?.tier || 'free'
  return tier.charAt(0).toUpperCase() + tier.slice(1)
})

const planBadgeClass = computed(() => {
  const tier = subscription.value?.tier || 'free'
  return `plan-${tier}`
})

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
    personalError.value = err.message || 'Failed to update profile'
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
      alert('Failed to open billing portal')
    }
  } catch (err) {
    console.error('Failed to open customer portal:', err)
    alert('Failed to open billing portal')
  } finally {
    loadingPortal.value = false
  }
}

async function confirmCancelSubscription() {
  try {
    // API call to cancel subscription would go here
    await new Promise(resolve => setTimeout(resolve, 1000)) // Simulated API call

    showCancelModal.value = false
    await authStore.refreshProfile()
  } catch (err) {
    console.error('Failed to cancel subscription:', err)
    alert('Failed to cancel subscription')
  }
}

async function confirmDeleteAccount() {
  if (deleteConfirmText.value !== 'DELETE') return

  try {
    // API call to delete account would go here
    await new Promise(resolve => setTimeout(resolve, 1000)) // Simulated API call

    await authStore.logout()
    router.push('/login')
  } catch (err) {
    console.error('Failed to delete account:', err)
    alert('Failed to delete account')
  }
}
</script>

<style scoped>
.profile-view {
  min-height: 100vh;
  padding: var(--space-3xl) var(--space-2xl);
  background: var(--bg-primary);
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
  border-bottom: 1px solid rgba(212, 175, 55, 0.1);
}

.section-title {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  color: var(--text-primary);
}

.edit-btn {
  padding: var(--space-sm) var(--space-lg);
  background: transparent;
  border: 1px solid rgba(212, 175, 55, 0.3);
  border-radius: var(--radius-md);
  color: var(--gold-primary);
  font-family: var(--font-body);
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  cursor: pointer;
  transition: var(--transition-base);
}

.edit-btn:hover {
  background: rgba(212, 175, 55, 0.1);
  border-color: rgba(212, 175, 55, 0.5);
}

.upgrade-link {
  padding: var(--space-sm) var(--space-lg);
  background: transparent;
  border: 1px solid rgba(212, 175, 55, 0.3);
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
  background: rgba(212, 175, 55, 0.1);
  border-color: rgba(212, 175, 55, 0.5);
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

.plan-basic {
  background: rgba(59, 130, 246, 0.2);
  color: #93c5fd;
  border: 1px solid rgba(59, 130, 246, 0.3);
}

.plan-pro {
  background: rgba(212, 175, 55, 0.2);
  color: var(--gold-primary);
  border: 1px solid rgba(212, 175, 55, 0.3);
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
  background: rgba(0, 0, 0, 0.3);
  padding: var(--space-xl);
  border-radius: var(--radius-md);
  border: 1px solid rgba(212, 175, 55, 0.1);
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
  background: rgba(212, 175, 55, 0.1);
}

.danger-text {
  color: #fca5a5;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: var(--space-xl);
}

.modal-content {
  background: rgba(26, 26, 26, 0.95);
  border: 1px solid rgba(212, 175, 55, 0.2);
  border-radius: var(--radius-lg);
  padding: var(--space-3xl);
  max-width: 500px;
  width: 100%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.7);
}

.modal-title {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  color: var(--text-primary);
  margin-bottom: var(--space-lg);
}

.modal-text {
  color: var(--text-secondary);
  line-height: var(--leading-normal);
  margin-bottom: var(--space-2xl);
}

.modal-actions {
  display: flex;
  gap: var(--space-md);
  justify-content: flex-end;
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

  .security-item {
    flex-direction: column;
    align-items: flex-start;
  }

  .form-actions,
  .modal-actions {
    flex-direction: column;
  }

  .form-actions button,
  .modal-actions button {
    width: 100%;
  }

  .plan-actions {
    flex-direction: column;
  }

  .plan-actions a,
  .plan-actions button {
    width: 100%;
  }

  .modal-content {
    padding: var(--space-2xl);
  }
}

/* Reduce motion */
@media (prefers-reduced-motion: reduce) {
  .section-card {
    animation: none;
  }
}
</style>
