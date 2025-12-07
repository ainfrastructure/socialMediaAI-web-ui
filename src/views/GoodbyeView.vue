<template>
  <div class="goodbye-view">
    <div class="goodbye-container">
      <div class="goodbye-card">
        <div class="goodbye-icon">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        <h1 class="goodbye-title">{{ $t('deleteAccount.goodbyeTitle') }}</h1>
        <p class="goodbye-message">{{ $t('deleteAccount.goodbyeMessage') }}</p>
        <p class="goodbye-subtext">{{ $t('deleteAccount.goodbyeSubtext') }}</p>

        <BaseButton variant="primary" @click="goHome">
          {{ $t('deleteAccount.returnToHome') }}
        </BaseButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import BaseButton from '../components/BaseButton.vue'

const router = useRouter()

function goHome() {
  router.push('/')
}
</script>

<style scoped>
.goodbye-view {
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-2xl);
  background: var(--bg-primary);
}

.goodbye-container {
  width: 100%;
  max-width: 450px;
}

.goodbye-card {
  background: rgba(26, 26, 26, 0.8);
  border: 1px solid rgba(212, 175, 55, 0.2);
  border-radius: var(--radius-xl);
  padding: var(--space-4xl);
  text-align: center;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  animation: fadeInUp 0.6s var(--ease-smooth);
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

.goodbye-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto var(--space-2xl);
  background: rgba(34, 197, 94, 0.2);
  border: 2px solid rgba(34, 197, 94, 0.3);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.goodbye-icon svg {
  width: 40px;
  height: 40px;
  color: #86efac;
}

.goodbye-title {
  font-family: var(--font-heading);
  font-size: var(--text-3xl);
  font-weight: var(--font-bold);
  background: var(--gradient-gold);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: var(--space-lg);
}

.goodbye-message {
  font-size: var(--text-lg);
  color: var(--text-primary);
  margin-bottom: var(--space-md);
  line-height: var(--leading-relaxed);
}

.goodbye-subtext {
  color: var(--text-secondary);
  margin-bottom: var(--space-3xl);
  line-height: var(--leading-relaxed);
}

/* Responsive */
@media (max-width: 480px) {
  .goodbye-view {
    padding: var(--space-lg);
  }

  .goodbye-card {
    padding: var(--space-2xl);
  }

  .goodbye-icon {
    width: 64px;
    height: 64px;
  }

  .goodbye-icon svg {
    width: 32px;
    height: 32px;
  }

  .goodbye-title {
    font-size: var(--text-2xl);
  }

  .goodbye-message {
    font-size: var(--text-base);
  }
}

/* Reduce motion */
@media (prefers-reduced-motion: reduce) {
  .goodbye-card {
    animation: none;
  }
}
</style>
