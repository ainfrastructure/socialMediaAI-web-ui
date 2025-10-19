<template>
  <div class="gradient-background">
    <div class="gradient-layer gradient-layer-1"></div>
    <div class="gradient-layer gradient-layer-2"></div>
    <div class="gradient-layer gradient-layer-3"></div>
    <div class="noise-overlay"></div>
  </div>
</template>

<script setup lang="ts">
// No props needed - pure decorative background
</script>

<style scoped>
.gradient-background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
  background: var(--bg-primary);
  overflow: hidden;
}

/* Subtle animated gradient layers */
.gradient-layer {
  position: absolute;
  width: 100%;
  height: 100%;
  opacity: 0.15;
  filter: blur(80px);
  animation-timing-function: ease-in-out;
  animation-iteration-count: infinite;
  animation-direction: alternate;
}

.gradient-layer-1 {
  background: radial-gradient(
    circle at 20% 30%,
    rgba(212, 175, 55, 0.2) 0%,
    transparent 50%
  );
  animation: float1 20s infinite;
}

.gradient-layer-2 {
  background: radial-gradient(
    circle at 80% 60%,
    rgba(212, 175, 55, 0.15) 0%,
    transparent 50%
  );
  animation: float2 25s infinite;
}

.gradient-layer-3 {
  background: radial-gradient(
    circle at 50% 80%,
    rgba(212, 175, 55, 0.1) 0%,
    transparent 50%
  );
  animation: float3 30s infinite;
}

/* Subtle noise texture for depth */
.noise-overlay {
  position: absolute;
  width: 100%;
  height: 100%;
  opacity: 0.03;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
  background-repeat: repeat;
  pointer-events: none;
}

/* Smooth floating animations */
@keyframes float1 {
  0% {
    transform: translate(0, 0) scale(1);
  }
  100% {
    transform: translate(-30px, 40px) scale(1.1);
  }
}

@keyframes float2 {
  0% {
    transform: translate(0, 0) scale(1);
  }
  100% {
    transform: translate(40px, -30px) scale(1.15);
  }
}

@keyframes float3 {
  0% {
    transform: translate(0, 0) scale(1);
  }
  100% {
    transform: translate(-20px, -35px) scale(1.05);
  }
}

/* Reduce motion for accessibility */
@media (prefers-reduced-motion: reduce) {
  .gradient-layer {
    animation: none;
  }
}
</style>
