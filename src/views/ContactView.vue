<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import BaseButton from '../components/BaseButton.vue'
import MaterialIcon from '../components/MaterialIcon.vue'
import LandingBackground from '@/components/landing/LandingBackground.vue'
import { env } from '@/config/environment'

const router = useRouter()
const { t } = useI18n()

// Ocean theme accent
const OCEAN_ACCENT = '#3A9BC0'

const name = ref('')
const email = ref('')
const subject = ref('')
const message = ref('')
const loading = ref(false)
const success = ref(false)
const error = ref('')
const mounted = ref(false)

onMounted(() => {
  // Set body bg for the ocean dark theme
  document.body.style.backgroundColor = '#081418'
  requestAnimationFrame(() => { mounted.value = true })
})

const subjectOptions = computed(() => [
  { value: 'general', label: t('contact.subjects.general') },
  { value: 'support', label: t('contact.subjects.support') },
  { value: 'partnership', label: t('contact.subjects.partnership') },
  { value: 'feedback', label: t('contact.subjects.feedback') },
])

const isValid = computed(() =>
  name.value.trim() && email.value.trim() && subject.value && message.value.trim()
)

function goBack() {
  router.back()
}

async function handleSubmit() {
  if (!isValid.value) return

  loading.value = true
  error.value = ''

  const selectedLabel = subjectOptions.value.find(o => o.value === subject.value)?.label ?? subject.value

  try {
    const contactUrl = env.isDevelopment ? '/api/contact' : `${env.api.baseUrl}/api/contact`
    const response = await fetch(contactUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name.value.trim(),
        email: email.value.trim(),
        subject: selectedLabel,
        message: message.value.trim(),
      }),
    })

    if (!response.ok) throw new Error('Request failed')
    success.value = true
  } catch {
    error.value = t('contact.error')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="contact-view" :class="{ 'is-mounted': mounted }">
    <!-- Particle canvas background -->
    <LandingBackground
      mode="particles"
      :accent-color="OCEAN_ACCENT"
      :intensity="1.2"
      :particle-density="1.5"
      particle-color-mode="vortex"
      particle-style="flow"
    />

    <div class="header">
      <router-link to="/" class="al-logo">
        <img src="/mascot/socialchef_wave.png" alt="SocialChef" class="logo-img" />
        <span class="brand-title">SocialChef</span>
      </router-link>
      <BaseButton variant="ghost" size="small" class="back-btn" @click="goBack">
        {{ t('common.back') }}
      </BaseButton>
    </div>

    <div class="contact-card">
      <h2 class="page-title">{{ t('contact.title') }}</h2>
      <p class="page-subtitle">{{ t('contact.subtitle') }}</p>

      <!-- Success state -->
      <Transition name="success-pop">
        <div v-if="success" class="success-state">
          <div class="success-ring">
            <MaterialIcon icon="check" size="2xl" />
          </div>
          <h3>{{ t('contact.successTitle') }}</h3>
          <p>{{ t('contact.successMessage') }}</p>
        </div>
      </Transition>

      <!-- Form -->
      <form v-if="!success" class="contact-form" @submit.prevent="handleSubmit">
        <div class="form-row">
          <div class="form-group" style="--stagger: 0">
            <label for="contact-name">{{ t('contact.nameLabel') }}</label>
            <input
              id="contact-name"
              v-model="name"
              type="text"
              :placeholder="t('contact.namePlaceholder')"
              required
              class="form-input"
            />
          </div>

          <div class="form-group" style="--stagger: 1">
            <label for="contact-email">{{ t('contact.emailLabel') }}</label>
            <input
              id="contact-email"
              v-model="email"
              type="email"
              :placeholder="t('contact.emailPlaceholder')"
              required
              class="form-input"
            />
          </div>
        </div>

        <div class="form-group" style="--stagger: 2">
          <label for="contact-subject">{{ t('contact.subjectLabel') }}</label>
          <select
            id="contact-subject"
            v-model="subject"
            required
            class="form-input form-select"
          >
            <option value="" disabled>{{ t('contact.subjectPlaceholder') }}</option>
            <option v-for="opt in subjectOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </div>

        <div class="form-group" style="--stagger: 3">
          <label for="contact-message">{{ t('contact.messageLabel') }}</label>
          <textarea
            id="contact-message"
            v-model="message"
            :placeholder="t('contact.messagePlaceholder')"
            required
            rows="5"
            class="form-input form-textarea"
          />
        </div>

        <p v-if="error" class="form-error">{{ error }}</p>

        <div class="form-group" style="--stagger: 4">
          <button
            type="submit"
            class="submit-btn"
            :class="{ 'is-loading': loading }"
            :disabled="!isValid || loading"
          >
            <Transition name="btn-swap" mode="out-in">
              <span v-if="loading" key="loading" class="btn-inner">
                <span class="spinner" />
              </span>
              <span v-else key="idle" class="btn-inner">
                <MaterialIcon icon="send" size="sm" />
                {{ t('contact.submit') }}
              </span>
            </Transition>
          </button>
        </div>
      </form>

      <div class="contact-email" :style="{ '--stagger': 5 }">
        <p>{{ t('contact.orEmail') }}</p>
        <a href="mailto:hello@socialchef.ai">hello@socialchef.ai</a>
      </div>
    </div>
  </div>
</template>

<style scoped>
.contact-view {
  min-height: 100vh;
  padding: var(--space-2xl);
  position: relative;
  overflow: hidden;
  /* Ocean dark theme */
  background: #081418;
  color-scheme: dark;
}

/* ── Header ── */
.header {
  max-width: 640px;
  margin: 0 auto var(--space-2xl);
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  z-index: 2;
  opacity: 0;
  animation: slideDown 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.1s forwards;
}

.al-logo {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  text-decoration: none;
}

.logo-img {
  height: 40px;
  width: auto;
  object-fit: contain;
}

.brand-title {
  font-family: var(--font-heading);
  font-size: var(--text-3xl);
  background: linear-gradient(135deg, #6EC0DE, #3A9BC0);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.back-btn {
  color: rgba(255, 255, 255, 0.6) !important;
}

.back-btn:hover {
  color: rgba(255, 255, 255, 0.9) !important;
}

/* ── Card ── */
.contact-card {
  max-width: 640px;
  margin: 0 auto;
  position: relative;
  z-index: 2;
  background: rgba(14, 34, 48, 0.7);
  border: 1px solid rgba(58, 155, 192, 0.12);
  border-radius: var(--radius-xl);
  padding: var(--space-3xl);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  box-shadow:
    0 4px 24px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 rgba(110, 192, 222, 0.06);
  opacity: 0;
  animation: cardReveal 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.25s forwards;
}

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-16px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes cardReveal {
  from {
    opacity: 0;
    transform: translateY(32px) scale(0.97);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* ── Title / subtitle ── */
.page-title {
  font-family: var(--font-heading);
  font-size: var(--text-3xl);
  color: #F4F4F5;
  margin-bottom: var(--space-sm);
  text-align: center;
}

.page-subtitle {
  font-size: var(--text-base);
  color: #A1A1AA;
  text-align: center;
  margin-bottom: var(--space-3xl);
  line-height: var(--leading-relaxed);
}

/* ── Form ── */
.contact-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-lg);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  opacity: 0;
  animation: fieldSlideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  animation-delay: calc(0.4s + var(--stagger, 0) * 0.08s);
}

@keyframes fieldSlideUp {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.form-group label {
  font-size: var(--text-sm);
  font-weight: 500;
  color: #A1A1AA;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

.form-input {
  padding: var(--space-md) var(--space-lg);
  border-radius: var(--radius-lg);
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.04);
  color: #F4F4F5;
  font-family: var(--font-body);
  font-size: var(--text-base);
  outline: none;
  transition:
    border-color 0.3s ease,
    box-shadow 0.3s ease,
    background 0.3s ease,
    transform 0.2s ease;
}

.form-input::placeholder {
  color: #71717A;
}

.form-input:focus {
  border-color: rgba(58, 155, 192, 0.5);
  box-shadow: 0 0 0 3px rgba(58, 155, 192, 0.12), 0 0 20px rgba(58, 155, 192, 0.06);
  background: rgba(255, 255, 255, 0.06);
  transform: translateY(-1px);
}

.form-select {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2371717A' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right var(--space-lg) center;
  padding-right: var(--space-3xl);
  cursor: pointer;
}

.form-select option {
  background: #0E2230;
  color: #F4F4F5;
}

.form-textarea {
  resize: vertical;
  min-height: 120px;
  line-height: var(--leading-relaxed);
}

.form-error {
  color: #ef4444;
  font-size: var(--text-sm);
  margin: 0;
  animation: shake 0.4s ease;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-6px); }
  40% { transform: translateX(5px); }
  60% { transform: translateX(-4px); }
  80% { transform: translateX(2px); }
}

/* ── Submit button ── */
.submit-btn {
  width: 100%;
  padding: var(--space-md) var(--space-2xl);
  border-radius: var(--radius-lg);
  border: none;
  background: linear-gradient(135deg, #3A9BC0, #2D7F9E);
  color: #fff;
  font-family: var(--font-body);
  font-size: var(--text-base);
  font-weight: 600;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition:
    box-shadow 0.3s ease,
    transform 0.15s ease;
}

.submit-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.15) 0%,
    transparent 50%,
    rgba(255, 255, 255, 0.05) 100%
  );
  opacity: 0;
  transition: opacity 0.3s ease;
}

.submit-btn:hover:not(:disabled) {
  box-shadow:
    0 8px 32px rgba(58, 155, 192, 0.3),
    0 0 40px rgba(58, 155, 192, 0.15);
  transform: translateY(-1px);
}

.submit-btn:hover:not(:disabled)::before {
  opacity: 1;
}

.submit-btn:active:not(:disabled) {
  transform: translateY(0) scale(0.99);
}

.submit-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn-inner {
  display: inline-flex;
  align-items: center;
  gap: var(--space-sm);
  justify-content: center;
}

/* Button swap transition */
.btn-swap-enter-active,
.btn-swap-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.btn-swap-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.btn-swap-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.spinner {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ── Success state ── */
.success-state {
  text-align: center;
  padding: var(--space-3xl) 0;
}

.success-ring {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3A9BC0, #6EC0DE);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto var(--space-xl);
  animation: successPop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  box-shadow: 0 0 40px rgba(58, 155, 192, 0.3);
}

@keyframes successPop {
  0% { transform: scale(0); opacity: 0; }
  60% { transform: scale(1.15); }
  100% { transform: scale(1); opacity: 1; }
}

.success-state h3 {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  color: #F4F4F5;
  margin: 0 0 var(--space-sm);
  animation: fadeUp 0.5s ease 0.2s both;
}

.success-state p {
  color: #A1A1AA;
  margin: 0;
  line-height: var(--leading-relaxed);
  animation: fadeUp 0.5s ease 0.35s both;
}

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Success transition wrapper */
.success-pop-enter-active {
  transition: opacity 0.4s ease;
}

.success-pop-enter-from {
  opacity: 0;
}

/* ── Contact email ── */
.contact-email {
  text-align: center;
  margin-top: var(--space-2xl);
  padding-top: var(--space-2xl);
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  opacity: 0;
  animation: fieldSlideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  animation-delay: calc(0.4s + var(--stagger, 5) * 0.08s);
}

.contact-email p {
  font-size: var(--text-sm);
  color: #71717A;
  margin: 0 0 var(--space-xs);
}

.contact-email a {
  color: #6EC0DE;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.3s ease, text-shadow 0.3s ease;
}

.contact-email a:hover {
  color: #3A9BC0;
  text-shadow: 0 0 12px rgba(58, 155, 192, 0.3);
}

/* ── Responsive ── */
@media (max-width: 768px) {
  .contact-view {
    padding: var(--space-lg);
  }

  .header {
    flex-direction: column;
    gap: var(--space-md);
    text-align: center;
  }

  .contact-card {
    padding: var(--space-2xl) var(--space-xl);
  }

  .page-title {
    font-size: var(--text-2xl);
  }

  .form-row {
    grid-template-columns: 1fr;
  }
}

/* ── Reduced motion ── */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
</style>
