<script setup lang="ts">
interface Props {
  visible: boolean
  title: string
  subtitle?: string
}

const props = withDefaults(defineProps<Props>(), {
  subtitle: ''
})
</script>

<template>
  <Transition name="fade">
    <div v-if="visible" class="loading-overlay">
      <div class="loading-content">
        <img src="/socialchef_logo.svg" alt="Social Chef" class="loading-logo" />
        <p class="loading-title">{{ title }}</p>
        <p v-if="subtitle" class="loading-subtitle">{{ subtitle }}</p>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.loading-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(10, 10, 10, 0.95);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  max-width: 500px;
  padding: var(--space-2xl);
}

.loading-logo {
  width: 120px;
  height: auto;
  margin-bottom: var(--space-2xl);
  animation: bounce 1s ease-in-out infinite;
  filter: drop-shadow(0 0 20px rgba(212, 175, 55, 0.5));
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-20px);
  }
}

.loading-title {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  color: var(--gold-primary);
  margin: 0 0 var(--space-sm) 0;
  font-weight: var(--font-semibold);
}

.loading-subtitle {
  font-size: var(--text-base);
  color: var(--text-muted);
  margin: 0;
}

/* Transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Responsive */
@media (max-width: 768px) {
  .loading-logo {
    width: 100px;
  }

  .loading-title {
    font-size: var(--text-xl);
  }

  .loading-subtitle {
    font-size: var(--text-sm);
  }
}
</style>
