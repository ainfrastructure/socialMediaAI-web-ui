<script setup lang="ts">
interface Props {
  /** Scale factor for the phone size */
  scale?: number
}

withDefaults(defineProps<Props>(), {
  scale: 1
})
</script>

<template>
  <div class="phone-mockup" :style="{ transform: `scale(${scale})` }">
    <!-- Notch -->
    <div class="phone-notch"></div>
    <!-- Screen content area -->
    <div class="phone-screen">
      <slot />
    </div>
    <!-- Home indicator -->
    <div class="phone-home-indicator"></div>
  </div>
</template>

<style scoped>
.phone-mockup {
  position: relative;
  width: 280px;
  height: 580px;
  background: var(--bg-primary);
  border-radius: 40px;
  border: 3px solid var(--bg-elevated);
  box-shadow:
    0 25px 50px rgba(15, 61, 46, 0.15),
    0 0 0 1px rgba(15, 61, 46, 0.08),
    inset 0 0 0 1px rgba(255, 255, 255, 0.3);
  overflow: hidden;
  transform-origin: center center;
}

.phone-notch {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 120px;
  height: 28px;
  background: var(--bg-elevated);
  border-radius: 0 0 18px 18px;
  z-index: 2;
}

.phone-screen {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  border-radius: 37px;
}

.phone-home-indicator {
  position: absolute;
  bottom: 8px;
  left: 50%;
  transform: translateX(-50%);
  width: 100px;
  height: 4px;
  background: var(--text-muted);
  border-radius: var(--radius-full);
  opacity: 0.4;
  z-index: 2;
}

@media (prefers-reduced-motion: reduce) {
  .phone-mockup {
    transition: none;
  }
}
</style>
