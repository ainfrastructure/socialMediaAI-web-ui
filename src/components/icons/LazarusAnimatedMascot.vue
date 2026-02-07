<script setup lang="ts">
interface Props {
  size?: number | string
}

const props = withDefaults(defineProps<Props>(), {
  size: 200
})

const sizeValue = typeof props.size === 'number' ? `${props.size}px` : props.size
</script>

<template>
  <div class="lazarus-mascot-wrapper" :style="{ width: sizeValue, height: sizeValue }">
    <!-- Pulsing glow behind -->
    <div class="mascot-glow"></div>
    <div class="mascot-glow mascot-glow-2"></div>

    <!-- Main floating SVG -->
    <svg class="mascot-svg" :width="sizeValue" :height="sizeValue" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="lazarus-mascot-body" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#0f3d2e" />
          <stop offset="50%" style="stop-color:#1a5a45" />
          <stop offset="100%" style="stop-color:#0f3d2e" />
        </linearGradient>
        <linearGradient id="lazarus-mascot-accent" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#b08a5a" />
          <stop offset="100%" style="stop-color:#d4a964" />
        </linearGradient>
        <linearGradient id="lazarus-mascot-inner" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#1a5a45" />
          <stop offset="100%" style="stop-color:#2a7a65" />
        </linearGradient>
        <filter id="mascot-inner-glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="mascot-soft-shadow">
          <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#0f3d2e" flood-opacity="0.3" />
        </filter>
      </defs>

      <!-- Outer rotating ring -->
      <circle
        class="ring-outer"
        cx="100" cy="100" r="90"
        stroke="url(#lazarus-mascot-accent)"
        stroke-width="1"
        fill="none"
        opacity="0.2"
        stroke-dasharray="8 12"
      />

      <!-- Middle ring -->
      <circle
        class="ring-middle"
        cx="100" cy="100" r="80"
        stroke="url(#lazarus-mascot-body)"
        stroke-width="1.5"
        fill="none"
        opacity="0.3"
        stroke-dasharray="4 8"
      />

      <!-- Main hexagonal body -->
      <path
        d="M100 25L162 62.5V137.5L100 175L38 137.5V62.5Z"
        fill="url(#lazarus-mascot-body)"
        stroke="url(#lazarus-mascot-accent)"
        stroke-width="1.5"
        filter="url(#mascot-soft-shadow)"
      />

      <!-- Inner hexagon glow -->
      <path
        d="M100 40L150 72V128L100 160L50 128V72Z"
        fill="url(#lazarus-mascot-inner)"
        opacity="0.5"
      />

      <!-- Bold "L" lettermark -->
      <path
        d="M72 60V140H128"
        stroke="url(#lazarus-mascot-accent)"
        stroke-width="8"
        stroke-linecap="round"
        stroke-linejoin="round"
        filter="url(#mascot-inner-glow)"
      />

      <!-- Eyes -->
      <circle class="eye eye-left" cx="82" cy="88" r="5" fill="#b08a5a" />
      <circle class="eye eye-right" cx="110" cy="88" r="5" fill="#b08a5a" />
      <!-- Eye shine -->
      <circle cx="84" cy="86" r="2" fill="#d4a964" opacity="0.8" />
      <circle cx="112" cy="86" r="2" fill="#d4a964" opacity="0.8" />

      <!-- Signal wave 1 (right side) -->
      <path
        class="signal signal-1"
        d="M140 60C152 60 162 70 162 85"
        stroke="url(#lazarus-mascot-accent)"
        stroke-width="2.5"
        stroke-linecap="round"
        fill="none"
      />
      <!-- Signal wave 2 -->
      <path
        class="signal signal-2"
        d="M148 48C164 48 178 62 178 82"
        stroke="url(#lazarus-mascot-accent)"
        stroke-width="2"
        stroke-linecap="round"
        fill="none"
      />
      <!-- Signal wave 3 -->
      <path
        class="signal signal-3"
        d="M154 38C174 38 190 54 190 78"
        stroke="url(#lazarus-mascot-accent)"
        stroke-width="1.5"
        stroke-linecap="round"
        fill="none"
      />

      <!-- Status dot (online indicator) -->
      <circle class="status-dot" cx="145" cy="55" r="6" fill="#b08a5a" />
      <circle class="status-dot-inner" cx="145" cy="55" r="3" fill="#d4a964" />
    </svg>
  </div>
</template>

<style scoped>
.lazarus-mascot-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Pulsing glow */
.mascot-glow {
  position: absolute;
  width: 60%;
  height: 60%;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(15, 61, 46, 0.3) 0%, transparent 70%);
  animation: mascot-pulse 3s ease-in-out infinite;
}

.mascot-glow-2 {
  width: 80%;
  height: 80%;
  background: radial-gradient(circle, rgba(176, 138, 90, 0.15) 0%, transparent 70%);
  animation: mascot-pulse 3s ease-in-out infinite 1.5s;
}

@keyframes mascot-pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 0.6;
  }
  50% {
    transform: scale(1.2);
    opacity: 1;
  }
}

/* Floating animation on the SVG */
.mascot-svg {
  position: relative;
  z-index: 1;
  animation: mascot-float 4s ease-in-out infinite;
}

@keyframes mascot-float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

/* Rotating rings */
.ring-outer {
  transform-origin: center;
  animation: ring-spin 20s linear infinite;
}

.ring-middle {
  transform-origin: center;
  animation: ring-spin 15s linear infinite reverse;
}

@keyframes ring-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Blinking eyes */
.eye {
  animation: blink 4s ease-in-out infinite;
}

.eye-right {
  animation-delay: 0.1s;
}

@keyframes blink {
  0%, 42%, 46%, 100% {
    transform: scaleY(1);
  }
  44% {
    transform: scaleY(0.1);
  }
}

/* Signal wave pulsing */
.signal {
  animation: signal-pulse 2s ease-in-out infinite;
}

.signal-1 {
  animation-delay: 0s;
}

.signal-2 {
  animation-delay: 0.3s;
}

.signal-3 {
  animation-delay: 0.6s;
}

@keyframes signal-pulse {
  0%, 100% {
    opacity: 0.3;
  }
  50% {
    opacity: 0.9;
  }
}

/* Status dot pulse */
.status-dot {
  animation: status-glow 2s ease-in-out infinite;
}

.status-dot-inner {
  animation: status-glow 2s ease-in-out infinite 0.5s;
}

@keyframes status-glow {
  0%, 100% {
    opacity: 0.6;
  }
  50% {
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .mascot-svg,
  .mascot-glow,
  .mascot-glow-2,
  .ring-outer,
  .ring-middle,
  .eye,
  .signal,
  .status-dot,
  .status-dot-inner {
    animation: none !important;
  }
}
</style>
