<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import GradientBackground from '../components/GradientBackground.vue'
import BaseCard from '../components/BaseCard.vue'
import SimpleOnboarding from '../components/SimpleOnboarding.vue'

const router = useRouter()
const authStore = useAuthStore()

async function handleComplete() {
  // Update auth store
  await authStore.refreshProfile()

  // Redirect to playground
  router.push('/playground')
}
</script>

<template>
  <div class="onboarding-view">
    <GradientBackground />

    <div class="container">
      <!-- Header -->
      <div class="header">
        <h1 class="brand-title">Welcome to SocialChef!</h1>
        <p class="brand-subtitle">Let's create your first post together</p>
      </div>

      <!-- Main Content -->
      <BaseCard variant="glass-intense" class="onboarding-card">
        <SimpleOnboarding @complete="handleComplete" />
      </BaseCard>
    </div>
  </div>
</template>

<style scoped>
.onboarding-view {
  min-height: 100vh;
  position: relative;
  padding: var(--space-3xl) var(--space-lg);
}

.container {
  max-width: 900px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
}

.header {
  text-align: center;
  margin-bottom: var(--space-4xl);
  animation: fadeInUp 0.6s var(--ease-smooth);
}

.brand-title {
  font-family: var(--font-heading);
  font-size: var(--text-4xl);
  font-weight: var(--font-bold);
  margin: 0 0 var(--space-md) 0;
  background: var(--gradient-gold);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.brand-subtitle {
  font-size: var(--text-lg);
  color: var(--text-secondary);
  margin: 0;
}

.onboarding-card {
  padding: var(--space-4xl);
  position: relative;
  animation: fadeInUp 0.8s var(--ease-smooth);
}

.loading-overlay {
  position: absolute;
  inset: 0;
  background: rgba(10, 10, 10, 0.95);
  backdrop-filter: blur(var(--blur-lg));
  border-radius: var(--radius-lg);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-xl);
  z-index: 10;
}

.spinner {
  width: 60px;
  height: 60px;
  border: 4px solid var(--border-color);
  border-top-color: var(--gold-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-overlay p {
  font-size: var(--text-lg);
  color: var(--text-secondary);
  margin: 0;
}

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

/* Mobile Responsive */
@media (max-width: 768px) {
  .onboarding-view {
    padding: var(--space-xl) var(--space-md);
  }

  .brand-title {
    font-size: var(--text-3xl);
  }

  .brand-subtitle {
    font-size: var(--text-base);
  }

  .onboarding-card {
    padding: var(--space-2xl) var(--space-lg);
  }
}
</style>
