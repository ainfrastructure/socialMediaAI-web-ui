<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { api } from '../services/api'
import GradientBackground from '../components/GradientBackground.vue'
import BaseCard from '../components/BaseCard.vue'
import BaseButton from '../components/BaseButton.vue'

const router = useRouter()
const authStore = useAuthStore()

const tierDisplayName = computed(() => authStore.user?.subscription.tier.toUpperCase() || 'FREE')
const progressPercent = computed(() => {
  if (!authStore.usageStats) return 0
  const { credits_this_month, monthly_limit } = authStore.usageStats
  return (credits_this_month / monthly_limit) * 100
})

async function handleLogout() {
  await authStore.logout()
  router.push('/login')
}

async function openCustomerPortal() {
  try {
    const response = await api.createPortalSession(window.location.href)
    if (response.success && (response as any).portal_url) {
      window.location.href = (response as any).portal_url
    }
  } catch (error) {
    console.error('Failed to open portal:', error)
  }
}

// Load user data on mount
onMounted(async () => {
  try {
    await authStore.refreshProfile()
  } catch (error) {
    console.error('Failed to load profile on dashboard mount:', error)
    // Don't block - let the page render anyway
  }
})
</script>

<template>
  <div class="dashboard-view">
    <GradientBackground />

    <div class="container">
      <!-- Hero Section -->
      <div class="hero-section">
        <h2 class="hero-title">Welcome to SocialChef</h2>
        <p class="hero-subtitle">
          Cook up stunning social media content in three simple steps
        </p>
      </div>

      <!-- How It Works Section -->
      <div class="section-header">
        <h3 class="section-title">How It Works</h3>
        <p class="section-subtitle">Three simple steps to amazing content</p>
      </div>

      <div class="steps-grid">
        <BaseCard variant="glass" hoverable class="step-card">
          <div class="step-number">1</div>
          <h4 class="step-title">Search & Save</h4>
          <p class="step-description">
            Find restaurants using Google Places and save them to your library. Access menus, photos, and brand details instantly.
          </p>
          <BaseButton variant="secondary" size="small" @click="router.push('/restaurants')">
            Search Now
          </BaseButton>
        </BaseCard>

        <BaseCard variant="glass" hoverable class="step-card">
          <div class="step-number">2</div>
          <h4 class="step-title">Cook Up Content</h4>
          <p class="step-description">
            Generate AI-powered images, videos, and captions. Save your favorites and build a content library for your restaurants.
          </p>
          <BaseButton variant="secondary" size="small" @click="router.push('/playground')">
            Start Cooking
          </BaseButton>
        </BaseCard>

        <BaseCard variant="glass" hoverable class="step-card">
          <div class="step-number">3</div>
          <h4 class="step-title">Schedule Posts</h4>
          <p class="step-description">
            Plan your content calendar and publish directly to Facebook. Schedule posts in advance and maintain consistent engagement.
          </p>
          <BaseButton variant="secondary" size="small" @click="router.push('/scheduler')">
            View Calendar
          </BaseButton>
        </BaseCard>
      </div>

      <!-- Account Info Section -->
      <BaseCard variant="glass" class="account-card">
        <h3 class="account-title">Your Account</h3>

        <div class="account-info">
          <div class="info-row">
            <span class="info-label">Email:</span>
            <span class="info-value">{{ authStore.user?.email }}</span>
          </div>

          <div class="info-row">
            <span class="info-label">Plan:</span>
            <span class="tier-badge">{{ tierDisplayName }}</span>
          </div>

          <div class="info-row">
            <span class="info-label">Status:</span>
            <span class="info-value">{{ authStore.user?.subscription.status }}</span>
          </div>

          <div class="info-row">
            <span class="info-label">Credits Used:</span>
            <span class="info-value">
              {{ authStore.usageStats?.credits_this_month }} / {{ authStore.usageStats?.monthly_limit }} this month
            </span>
          </div>

          <div class="usage-bar-container">
            <div class="usage-bar">
              <div class="usage-progress" :style="{ width: `${progressPercent}%` }"></div>
            </div>
            <span class="usage-text">{{ authStore.usageStats?.remaining_credits }} credits remaining</span>
          </div>
        </div>

        <div class="account-actions">
          <BaseButton variant="secondary" @click="router.push('/plans')">
            View Plans
          </BaseButton>
          <BaseButton variant="secondary" @click="openCustomerPortal">
            Manage Subscription
          </BaseButton>
        </div>
      </BaseCard>
    </div>
  </div>
</template>

<style scoped>
.dashboard-view {
  min-height: 100vh;
  position: relative;
  padding: 2rem 1rem;
}

.container {
  max-width: 1400px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
}

/* Header */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 3rem;
}

.brand-title {
  font-family: var(--font-heading);
  font-size: 3rem;
  font-weight: 700;
  margin: 0;
  background: linear-gradient(135deg, var(--text-primary) 0%, var(--gold-primary) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Hero Section */
.hero-section {
  margin-bottom: 4rem;
  text-align: center;
  animation: fadeInUp 0.6s var(--ease-smooth);
}

.hero-title {
  font-family: var(--font-heading);
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0 0 1rem 0;
  color: var(--text-primary);
}

.hero-subtitle {
  font-size: 1.25rem;
  color: var(--gold-primary);
  margin: 0 0 1rem 0;
  font-weight: 500;
}

.hero-description {
  font-size: 1rem;
  color: var(--text-secondary);
  margin: 0;
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.6;
}

/* Section Headers */
.section-header {
  text-align: center;
  margin: 4rem 0 2rem 0;
}

.section-title {
  font-family: var(--font-heading);
  font-size: 2rem;
  font-weight: 700;
  margin: 0 0 0.5rem 0;
  color: var(--text-primary);
}

.section-subtitle {
  font-size: 1rem;
  color: var(--text-secondary);
  margin: 0;
}

/* Steps Grid */
.steps-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
  margin-bottom: 4rem;
}

.step-card {
  text-align: center;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  animation: fadeInUp 0.6s var(--ease-smooth);
  animation-fill-mode: both;
  cursor: default;
}

.step-card:nth-child(1) { animation-delay: 0.1s; }
.step-card:nth-child(2) { animation-delay: 0.2s; }
.step-card:nth-child(3) { animation-delay: 0.3s; }
.step-card:nth-child(4) { animation-delay: 0.4s; }

.step-number {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: var(--gradient-gold);
  color: var(--text-on-gold);
  font-size: 1.5rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem auto;
  box-shadow: var(--glow-gold-md);
}

.step-title {
  font-family: var(--font-heading);
  font-size: 1.25rem;
  color: var(--text-primary);
  margin: 0;
}

.step-description {
  color: var(--text-secondary);
  line-height: 1.6;
  margin: 0;
  flex: 1;
}

/* Features Grid */
.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 4rem;
}

.feature-card {
  padding: 2rem;
  text-align: center;
  animation: fadeInUp 0.6s var(--ease-smooth);
  animation-fill-mode: both;
}

.feature-card:nth-child(1) { animation-delay: 0.1s; }
.feature-card:nth-child(2) { animation-delay: 0.15s; }
.feature-card:nth-child(3) { animation-delay: 0.2s; }
.feature-card:nth-child(4) { animation-delay: 0.25s; }
.feature-card:nth-child(5) { animation-delay: 0.3s; }
.feature-card:nth-child(6) { animation-delay: 0.35s; }

.feature-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.feature-title {
  font-family: var(--font-heading);
  font-size: 1.125rem;
  color: var(--text-primary);
  margin: 0 0 0.75rem 0;
}

.feature-description {
  color: var(--text-secondary);
  line-height: 1.6;
  margin: 0;
  font-size: 0.875rem;
}

/* Quick Actions Grid */
.quick-actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 4rem;
}

.action-card {
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  animation: fadeInUp 0.6s var(--ease-smooth);
  animation-fill-mode: both;
}

.action-card:nth-child(1) { animation-delay: 0.1s; }
.action-card:nth-child(2) { animation-delay: 0.15s; }
.action-card:nth-child(3) { animation-delay: 0.2s; }
.action-card:nth-child(4) { animation-delay: 0.25s; }
.action-card:nth-child(5) { animation-delay: 0.3s; }
.action-card:nth-child(6) { animation-delay: 0.35s; }

.action-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-xl);
}

.action-icon {
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

.action-title {
  font-family: var(--font-heading);
  font-size: 1.125rem;
  color: var(--text-primary);
  margin: 0 0 0.5rem 0;
}

.action-description {
  color: var(--text-secondary);
  font-size: 0.875rem;
  margin: 0;
}

/* CTA Section */
.cta-card {
  text-align: center;
  padding: 3rem 2rem;
  margin-bottom: 3rem;
  animation: fadeInUp 0.8s var(--ease-smooth);
}

.cta-title {
  font-family: var(--font-heading);
  font-size: 2rem;
  color: var(--text-primary);
  margin: 0 0 1rem 0;
}

.cta-description {
  font-size: 1.125rem;
  color: var(--text-secondary);
  margin: 0 0 2rem 0;
}

.cta-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

/* Account Section */
.account-card {
  padding: 2rem;
  animation: fadeInUp 0.9s var(--ease-smooth);
}

.account-title {
  font-family: var(--font-heading);
  font-size: 1.5rem;
  color: var(--text-primary);
  margin: 0 0 1.5rem 0;
  text-align: center;
}

.account-info {
  background: var(--bg-tertiary);
  padding: 1.5rem;
  border-radius: var(--radius-md);
  margin-bottom: 1.5rem;
  border: 1px solid var(--border-color);
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid var(--border-color);
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  font-weight: 600;
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.info-value {
  color: var(--text-primary);
  font-size: 0.875rem;
}

.tier-badge {
  background: var(--gradient-gold);
  color: var(--text-on-gold);
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  font-weight: 600;
  font-size: 0.75rem;
}

.usage-bar-container {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
}

.usage-bar {
  width: 100%;
  height: 8px;
  background: var(--bg-primary);
  border-radius: 999px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.usage-progress {
  height: 100%;
  background: var(--gradient-gold);
  transition: width 0.3s ease;
  border-radius: 999px;
}

.usage-text {
  font-size: 0.75rem;
  color: var(--text-muted);
  display: block;
  text-align: center;
}

.account-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

/* Animations */
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

/* Responsive */
@media (max-width: 768px) {
  .brand-title {
    font-size: 2rem;
  }

  .hero-title {
    font-size: 1.75rem;
  }

  .hero-subtitle {
    font-size: 1rem;
  }

  .section-title {
    font-size: 1.5rem;
  }

  .steps-grid,
  .features-grid,
  .quick-actions-grid {
    grid-template-columns: 1fr;
  }

  .cta-title {
    font-size: 1.5rem;
  }

  .cta-actions {
    flex-direction: column;
  }

  .account-actions {
    flex-direction: column;
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
</style>
