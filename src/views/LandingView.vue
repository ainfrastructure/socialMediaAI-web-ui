<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '../stores/auth'
import BaseCard from '../components/BaseCard.vue'
import BaseButton from '../components/BaseButton.vue'
import MaterialIcon from '../components/MaterialIcon.vue'
import LoginModal from '../components/LoginModal.vue'
import PaywallModal from '../components/PaywallModal.vue'

const router = useRouter()
const authStore = useAuthStore()
useI18n()

const showLoginModal = ref(false)
const showPaywallModal = ref(false)

// Check if user has an active subscription
const hasSubscription = computed(() => {
  return authStore.isAuthenticated &&
    authStore.subscriptionTier &&
    ['monthly', 'yearly', 'lifetime'].includes(authStore.subscriptionTier)
})

function handleCTAClick() {
  if (authStore.isAuthenticated) {
    if (hasSubscription.value) {
      router.push('/posts/create')
    } else {
      showPaywallModal.value = true
    }
  } else {
    showLoginModal.value = true
  }
}

function onLoginSuccess() {
  showLoginModal.value = false
  // Only show paywall if user doesn't have an active subscription
  if (hasSubscription.value) {
    router.push('/posts/create')
  } else {
    showPaywallModal.value = true
  }
}

function onPaymentSuccess() {
  showPaywallModal.value = false
  router.push('/posts/create')
}

// Testimonials data
const testimonials = [
  {
    id: 1,
    quote: 'landing.socialProof.testimonial1Quote',
    name: 'Maria S.',
    restaurant: 'Italian Bistro'
  },
  {
    id: 2,
    quote: 'landing.socialProof.testimonial2Quote',
    name: 'David K.',
    restaurant: 'Urban Grill'
  },
  {
    id: 3,
    quote: 'landing.socialProof.testimonial3Quote',
    name: 'Pierre L.',
    restaurant: 'French Corner'
  }
]

// Benefits data
const benefits = [
  {
    id: 'time',
    icon: 'schedule',
    title: 'landing.benefits.time.title',
    description: 'landing.benefits.time.description'
  },
  {
    id: 'professional',
    icon: 'auto_awesome',
    title: 'landing.benefits.professional.title',
    description: 'landing.benefits.professional.description'
  },
  {
    id: 'growth',
    icon: 'trending_up',
    title: 'landing.benefits.growth.title',
    description: 'landing.benefits.growth.description'
  },
  {
    id: 'easy',
    icon: 'thumb_up',
    title: 'landing.benefits.easy.title',
    description: 'landing.benefits.easy.description'
  }
]
</script>

<template>
  <div class="landing-page">
    <!-- Hero Section -->
    <section class="hero-section">
      <div class="hero-content">
        <div class="hero-text">
          <img src="../assets/socialchef_logo.svg" alt="SocialChef" class="hero-logo" />
          <h1 class="hero-headline">{{ $t('landing.hero.headline') }}</h1>
          <p class="hero-subheadline">{{ $t('landing.hero.subheadline') }}</p>
          <BaseButton
            variant="primary"
            size="large"
            class="hero-cta"
            @click="handleCTAClick"
          >
            {{ $t('landing.hero.cta') }}
          </BaseButton>
        </div>
        <div class="hero-image">
          <div class="image-placeholder">
            <MaterialIcon icon="smartphone" size="lg" />
            <span>{{ $t('landing.hero.imagePlaceholder') }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- How It Works Section -->
    <section class="how-it-works-section">
      <div class="section-container">
        <h2 class="section-title">{{ $t('landing.howItWorks.title') }}</h2>

        <div class="steps-grid">
          <!-- Step 1 -->
          <div class="step-card">
            <div class="step-number">1</div>
            <div class="step-image-placeholder">
              <MaterialIcon icon="photo_camera" size="lg" />
              <span>{{ $t('landing.howItWorks.step1Image') }}</span>
            </div>
            <h3 class="step-title">{{ $t('landing.howItWorks.step1Title') }}</h3>
            <p class="step-description">{{ $t('landing.howItWorks.step1Description') }}</p>
          </div>

          <!-- Step 2 -->
          <div class="step-card">
            <div class="step-number">2</div>
            <div class="step-image-placeholder">
              <MaterialIcon icon="auto_awesome" size="lg" />
              <span>{{ $t('landing.howItWorks.step2Image') }}</span>
            </div>
            <h3 class="step-title">{{ $t('landing.howItWorks.step2Title') }}</h3>
            <p class="step-description">{{ $t('landing.howItWorks.step2Description') }}</p>
          </div>

          <!-- Step 3 -->
          <div class="step-card">
            <div class="step-number">3</div>
            <div class="step-image-placeholder">
              <MaterialIcon icon="send" size="lg" />
              <span>{{ $t('landing.howItWorks.step3Image') }}</span>
            </div>
            <h3 class="step-title">{{ $t('landing.howItWorks.step3Title') }}</h3>
            <p class="step-description">{{ $t('landing.howItWorks.step3Description') }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Auto-Posting Feature Section (KEY DIFFERENTIATOR) -->
    <section class="auto-posting-section">
      <div class="section-container">
        <div class="auto-posting-content">
          <div class="auto-posting-text">
            <span class="feature-badge">{{ $t('landing.autoPosting.badge') }}</span>
            <h2 class="auto-posting-title">{{ $t('landing.autoPosting.title') }}</h2>
            <h3 class="auto-posting-headline">{{ $t('landing.autoPosting.headline') }}</h3>
            <p class="auto-posting-description">{{ $t('landing.autoPosting.description') }}</p>

            <div class="auto-posting-features">
              <div class="feature-item">
                <MaterialIcon icon="check_circle" size="sm" color="var(--gold-primary)" />
                <span>{{ $t('landing.autoPosting.feature1') }}</span>
              </div>
              <div class="feature-item">
                <MaterialIcon icon="check_circle" size="sm" color="var(--gold-primary)" />
                <span>{{ $t('landing.autoPosting.feature2') }}</span>
              </div>
              <div class="feature-item">
                <MaterialIcon icon="check_circle" size="sm" color="var(--gold-primary)" />
                <span>{{ $t('landing.autoPosting.feature3') }}</span>
              </div>
            </div>
          </div>
          <div class="auto-posting-image">
            <div class="image-placeholder large">
              <MaterialIcon icon="compare" size="lg" />
              <span>{{ $t('landing.autoPosting.imagePlaceholder') }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Benefits Grid Section -->
    <section class="benefits-section">
      <div class="section-container">
        <h2 class="section-title">{{ $t('landing.benefits.title') }}</h2>

        <div class="benefits-grid">
          <BaseCard
            v-for="benefit in benefits"
            :key="benefit.id"
            variant="glass"
            class="benefit-card"
            hoverable
          >
            <div class="benefit-icon">
              <MaterialIcon :icon="benefit.icon" size="lg" color="var(--gold-primary)" />
            </div>
            <h3 class="benefit-title">{{ $t(benefit.title) }}</h3>
            <p class="benefit-description">{{ $t(benefit.description) }}</p>
          </BaseCard>
        </div>
      </div>
    </section>

    <!-- Social Proof Section -->
    <section class="social-proof-section">
      <div class="section-container">
        <h2 class="section-title">{{ $t('landing.socialProof.title') }}</h2>

        <!-- Stats -->
        <div class="stats-row">
          <div class="stat-item">
            <span class="stat-number">500+</span>
            <span class="stat-label">{{ $t('landing.socialProof.stat1') }}</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <span class="stat-number">10,000+</span>
            <span class="stat-label">{{ $t('landing.socialProof.stat2') }}</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <span class="stat-number">4.9/5</span>
            <span class="stat-label">{{ $t('landing.socialProof.stat3') }}</span>
          </div>
        </div>

        <!-- Testimonials -->
        <div class="testimonials-grid">
          <BaseCard
            v-for="testimonial in testimonials"
            :key="testimonial.id"
            variant="glass"
            class="testimonial-card"
          >
            <div class="testimonial-photo-placeholder">
              <MaterialIcon icon="person" size="lg" />
            </div>
            <p class="testimonial-quote">"{{ $t(testimonial.quote) }}"</p>
            <div class="testimonial-author">
              <span class="author-name">{{ testimonial.name }}</span>
              <span class="author-restaurant">{{ testimonial.restaurant }}</span>
            </div>
          </BaseCard>
        </div>
      </div>
    </section>

    <!-- Pricing Preview Section -->
    <section class="pricing-section">
      <div class="section-container">
        <h2 class="section-title">{{ $t('landing.pricing.title') }}</h2>
        <p class="section-subtitle">{{ $t('landing.pricing.subtitle') }}</p>

        <div class="pricing-preview">
          <BaseCard variant="glass" class="pricing-card">
            <h3 class="pricing-tier">{{ $t('landing.pricing.monthly') }}</h3>
            <div class="pricing-price">$29<span>/{{ $t('landing.pricing.perMonth') }}</span></div>
            <p class="pricing-credits">100 {{ $t('landing.pricing.images') }}</p>
          </BaseCard>

          <BaseCard variant="glass-intense" class="pricing-card featured">
            <span class="pricing-badge">{{ $t('landing.pricing.mostPopular') }}</span>
            <h3 class="pricing-tier">{{ $t('landing.pricing.yearly') }}</h3>
            <div class="pricing-price">$199<span>/{{ $t('landing.pricing.perYear') }}</span></div>
            <p class="pricing-credits">600 {{ $t('landing.pricing.images') }}</p>
          </BaseCard>

          <BaseCard variant="glass" class="pricing-card">
            <h3 class="pricing-tier">{{ $t('landing.pricing.lifetime') }}</h3>
            <div class="pricing-price">$499<span> {{ $t('landing.pricing.oneTime') }}</span></div>
            <p class="pricing-credits">1500 {{ $t('landing.pricing.images') }}</p>
          </BaseCard>
        </div>

        <router-link to="/plans" class="view-pricing-link">
          {{ $t('landing.pricing.viewAll') }} →
        </router-link>
      </div>
    </section>

    <!-- Final CTA Section -->
    <section class="final-cta-section">
      <div class="section-container">
        <h2 class="final-cta-title">{{ $t('landing.finalCta.title') }}</h2>
        <p class="final-cta-subtitle">{{ $t('landing.finalCta.subtitle') }}</p>
        <BaseButton
          variant="primary"
          size="large"
          class="final-cta-button"
          @click="handleCTAClick"
        >
          {{ $t('landing.hero.cta') }}
        </BaseButton>
      </div>
    </section>

    <!-- Footer -->
    <footer class="landing-footer">
      <div class="footer-content">
        <p class="footer-made-with">{{ $t('landing.footer.madeWith') }}</p>
        <div class="footer-links">
          <router-link to="/privacy-policy">{{ $t('auth.privacyPolicy') }}</router-link>
          <span class="footer-divider">·</span>
          <router-link to="/terms">{{ $t('auth.termsOfService') }}</router-link>
        </div>
        <p class="footer-copyright">{{ $t('landing.footer.copyright') }}</p>
      </div>
    </footer>

    <!-- Modals -->
    <LoginModal
      v-model="showLoginModal"
      @login-success="onLoginSuccess"
    />

    <PaywallModal
      v-model="showPaywallModal"
      @payment-success="onPaymentSuccess"
    />
  </div>
</template>

<style scoped>
.landing-page {
  min-height: 100vh;
  background: var(--bg-primary);
}

/* Hero Section */
.hero-section {
  min-height: 100vh;
  display: flex;
  align-items: center;
  padding: var(--space-2xl);
  position: relative;
  overflow: hidden;
}

.hero-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(ellipse at 30% 20%, rgba(212, 175, 55, 0.08) 0%, transparent 50%);
  pointer-events: none;
}

.hero-content {
  max-width: var(--max-width-2xl);
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4xl);
  align-items: center;
  position: relative;
  z-index: 1;
}

.hero-logo {
  height: 80px;
  width: auto;
  margin-bottom: var(--space-xl);
  filter: drop-shadow(0 4px 12px rgba(212, 175, 55, 0.3));
}

.hero-headline {
  font-family: var(--font-heading);
  font-size: var(--text-5xl);
  font-weight: var(--font-bold);
  background: var(--gradient-gold);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: var(--space-lg);
  line-height: 1.1;
}

.hero-subheadline {
  font-size: var(--text-xl);
  color: var(--text-secondary);
  margin-bottom: var(--space-2xl);
  line-height: var(--leading-relaxed);
}

.hero-cta {
  font-size: var(--text-lg);
  padding: var(--space-lg) var(--space-3xl);
}

.hero-image {
  display: flex;
  justify-content: center;
  align-items: center;
}

/* Image Placeholders */
.image-placeholder {
  background: var(--bg-secondary);
  border: 2px dashed var(--border-color);
  border-radius: var(--radius-lg);
  padding: var(--space-3xl);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-md);
  color: var(--text-muted);
  text-align: center;
  min-height: 300px;
  width: 100%;
  max-width: 400px;
}

.image-placeholder.large {
  min-height: 350px;
  max-width: 500px;
}

.image-placeholder span {
  font-size: var(--text-sm);
  max-width: 200px;
}

/* Section Styles */
.section-container {
  max-width: var(--max-width-2xl);
  margin: 0 auto;
  padding: var(--space-5xl) var(--space-2xl);
}

.section-title {
  font-family: var(--font-heading);
  font-size: var(--text-4xl);
  font-weight: var(--font-bold);
  color: var(--text-primary);
  text-align: center;
  margin-bottom: var(--space-3xl);
}

.section-subtitle {
  font-size: var(--text-lg);
  color: var(--text-secondary);
  text-align: center;
  margin-top: calc(-1 * var(--space-2xl));
  margin-bottom: var(--space-3xl);
}

/* How It Works Section */
.how-it-works-section {
  background: var(--bg-secondary);
}

.steps-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-2xl);
}

.step-card {
  text-align: center;
  position: relative;
}

.step-number {
  width: 48px;
  height: 48px;
  background: var(--gradient-gold);
  color: var(--text-on-gold);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-heading);
  font-size: var(--text-xl);
  font-weight: var(--font-bold);
  margin: 0 auto var(--space-xl);
}

.step-image-placeholder {
  background: var(--bg-tertiary);
  border: 2px dashed var(--border-color);
  border-radius: var(--radius-lg);
  padding: var(--space-2xl);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  color: var(--text-muted);
  text-align: center;
  min-height: 180px;
  margin-bottom: var(--space-lg);
}

.step-image-placeholder span {
  font-size: var(--text-xs);
}

.step-title {
  font-family: var(--font-heading);
  font-size: var(--text-xl);
  color: var(--text-primary);
  margin-bottom: var(--space-sm);
}

.step-description {
  font-size: var(--text-base);
  color: var(--text-secondary);
}

/* Auto-Posting Section */
.auto-posting-section {
  background: linear-gradient(135deg, rgba(212, 175, 55, 0.05) 0%, transparent 50%);
}

.auto-posting-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4xl);
  align-items: center;
}

.feature-badge {
  display: inline-block;
  background: var(--gold-subtle);
  color: var(--gold-primary);
  padding: var(--space-xs) var(--space-md);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: var(--space-lg);
}

.auto-posting-title {
  font-family: var(--font-heading);
  font-size: var(--text-3xl);
  color: var(--text-primary);
  margin-bottom: var(--space-sm);
}

.auto-posting-headline {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  background: var(--gradient-gold);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: var(--space-lg);
}

.auto-posting-description {
  font-size: var(--text-lg);
  color: var(--text-secondary);
  line-height: var(--leading-relaxed);
  margin-bottom: var(--space-xl);
}

.auto-posting-features {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.feature-item {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  color: var(--text-secondary);
}

/* Benefits Section */
.benefits-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-xl);
}

.benefit-card {
  text-align: center;
  padding: var(--space-2xl);
}

.benefit-icon {
  margin-bottom: var(--space-lg);
}

.benefit-title {
  font-family: var(--font-heading);
  font-size: var(--text-xl);
  color: var(--text-primary);
  margin-bottom: var(--space-sm);
}

.benefit-description {
  font-size: var(--text-base);
  color: var(--text-secondary);
  line-height: var(--leading-relaxed);
}

/* Social Proof Section */
.social-proof-section {
  background: var(--bg-secondary);
}

.stats-row {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: var(--space-3xl);
  margin-bottom: var(--space-4xl);
}

.stat-item {
  text-align: center;
}

.stat-number {
  display: block;
  font-family: var(--font-heading);
  font-size: var(--text-4xl);
  font-weight: var(--font-bold);
  background: var(--gradient-gold);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.stat-label {
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.stat-divider {
  width: 1px;
  height: 60px;
  background: var(--border-color);
}

.testimonials-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-xl);
}

.testimonial-card {
  text-align: center;
  padding: var(--space-2xl);
}

.testimonial-photo-placeholder {
  width: 80px;
  height: 80px;
  background: var(--bg-tertiary);
  border: 2px dashed var(--border-color);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  margin: 0 auto var(--space-lg);
}

.testimonial-quote {
  font-size: var(--text-base);
  color: var(--text-secondary);
  font-style: italic;
  line-height: var(--leading-relaxed);
  margin-bottom: var(--space-lg);
}

.testimonial-author {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.author-name {
  font-weight: var(--font-semibold);
  color: var(--text-primary);
}

.author-restaurant {
  font-size: var(--text-sm);
  color: var(--gold-primary);
}

/* Pricing Section */
.pricing-preview {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-xl);
  margin-bottom: var(--space-2xl);
}

.pricing-card {
  text-align: center;
  padding: var(--space-2xl);
  position: relative;
}

.pricing-card.featured {
  border: 2px solid var(--gold-primary);
}

.pricing-badge {
  position: absolute;
  top: var(--space-md);
  left: 50%;
  transform: translateX(-50%);
  background: var(--gradient-gold);
  color: var(--text-on-gold);
  padding: var(--space-xs) var(--space-md);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  text-transform: uppercase;
}

.pricing-tier {
  font-family: var(--font-heading);
  font-size: var(--text-xl);
  color: var(--text-primary);
  margin-bottom: var(--space-md);
  margin-top: var(--space-lg);
}

.pricing-price {
  font-family: var(--font-heading);
  font-size: var(--text-4xl);
  font-weight: var(--font-bold);
  background: var(--gradient-gold);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: var(--space-sm);
}

.pricing-price span {
  font-size: var(--text-base);
  font-weight: var(--font-normal);
}

.pricing-credits {
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.view-pricing-link {
  display: block;
  text-align: center;
  color: var(--gold-primary);
  font-weight: var(--font-medium);
  text-decoration: none;
  transition: var(--transition-base);
}

.view-pricing-link:hover {
  color: var(--gold-light);
}

/* Final CTA Section */
.final-cta-section {
  background: linear-gradient(135deg, rgba(212, 175, 55, 0.1) 0%, rgba(212, 175, 55, 0.02) 100%);
  text-align: center;
  padding: var(--space-5xl) var(--space-2xl);
}

.final-cta-title {
  font-family: var(--font-heading);
  font-size: var(--text-4xl);
  font-weight: var(--font-bold);
  background: var(--gradient-gold);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: var(--space-lg);
}

.final-cta-subtitle {
  font-size: var(--text-xl);
  color: var(--text-secondary);
  margin-bottom: var(--space-2xl);
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.final-cta-button {
  font-size: var(--text-lg);
  padding: var(--space-lg) var(--space-3xl);
}

/* Footer */
.landing-footer {
  background: var(--bg-secondary);
  padding: var(--space-3xl) var(--space-2xl);
  text-align: center;
}

.footer-content {
  max-width: var(--max-width-lg);
  margin: 0 auto;
}

.footer-made-with {
  font-size: var(--text-sm);
  color: var(--text-muted);
  margin-bottom: var(--space-lg);
}

.footer-links {
  display: flex;
  justify-content: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-lg);
}

.footer-links a {
  color: var(--text-secondary);
  text-decoration: none;
  font-size: var(--text-sm);
  transition: var(--transition-base);
}

.footer-links a:hover {
  color: var(--gold-primary);
}

.footer-divider {
  color: var(--text-muted);
}

.footer-copyright {
  font-size: var(--text-xs);
  color: var(--text-muted);
}

/* Responsive */
@media (max-width: 1024px) {
  .hero-content {
    grid-template-columns: 1fr;
    text-align: center;
  }

  .hero-image {
    order: -1;
  }

  .auto-posting-content {
    grid-template-columns: 1fr;
    text-align: center;
  }

  .auto-posting-image {
    order: -1;
  }

  .auto-posting-features {
    align-items: center;
  }
}

@media (max-width: 768px) {
  .hero-section {
    min-height: auto;
    padding: var(--space-3xl) var(--space-lg);
  }

  .hero-headline {
    font-size: var(--text-4xl);
  }

  .hero-subheadline {
    font-size: var(--text-lg);
  }

  .section-container {
    padding: var(--space-3xl) var(--space-lg);
  }

  .section-title {
    font-size: var(--text-3xl);
  }

  .steps-grid {
    grid-template-columns: 1fr;
    gap: var(--space-3xl);
  }

  .benefits-grid {
    grid-template-columns: 1fr;
  }

  .stats-row {
    flex-direction: column;
    gap: var(--space-xl);
  }

  .stat-divider {
    width: 60px;
    height: 1px;
  }

  .testimonials-grid {
    grid-template-columns: 1fr;
  }

  .pricing-preview {
    grid-template-columns: 1fr;
  }

  .final-cta-title {
    font-size: var(--text-3xl);
  }

  .final-cta-subtitle {
    font-size: var(--text-lg);
  }
}

@media (max-width: 480px) {
  .hero-logo {
    height: 60px;
  }

  .hero-headline {
    font-size: var(--text-3xl);
  }

  .image-placeholder {
    min-height: 200px;
    padding: var(--space-xl);
  }
}

/* Animation */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.hero-content,
.step-card,
.benefit-card,
.testimonial-card,
.pricing-card {
  animation: fadeInUp 0.6s var(--ease-smooth);
  animation-fill-mode: both;
}

.step-card:nth-child(1) { animation-delay: 0.1s; }
.step-card:nth-child(2) { animation-delay: 0.2s; }
.step-card:nth-child(3) { animation-delay: 0.3s; }

.benefit-card:nth-child(1) { animation-delay: 0.1s; }
.benefit-card:nth-child(2) { animation-delay: 0.15s; }
.benefit-card:nth-child(3) { animation-delay: 0.2s; }
.benefit-card:nth-child(4) { animation-delay: 0.25s; }

@media (prefers-reduced-motion: reduce) {
  .hero-content,
  .step-card,
  .benefit-card,
  .testimonial-card,
  .pricing-card {
    animation: none;
  }
}
</style>
