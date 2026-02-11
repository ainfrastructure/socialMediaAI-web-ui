<script setup lang="ts">
interface Props {
  size?: 'sm' | 'md' | 'lg'
  showButtons?: boolean
  float?: boolean
}

withDefaults(defineProps<Props>(), {
  size: 'md',
  showButtons: false,
  float: false
})
</script>

<template>
  <div class="phone-mockup" :class="[`phone-${size}`, { 'phone-float': float }]">
    <!-- Physical side buttons (hidden on mobile) -->
    <template v-if="showButtons">
      <div class="phone-btn phone-btn-silent"></div>
      <div class="phone-btn phone-btn-vol-up"></div>
      <div class="phone-btn phone-btn-vol-down"></div>
      <div class="phone-btn phone-btn-power"></div>
    </template>

    <!-- Titanium bezel frame -->
    <div class="phone-bezel">
      <!-- Edge highlights -->
      <div class="phone-edge-top"></div>
      <div class="phone-edge-bottom"></div>

      <!-- Screen area -->
      <div class="phone-screen">
        <!-- Dynamic Island -->
        <div class="phone-dynamic-island">
          <div class="phone-island-camera"></div>
        </div>

        <!-- Status bar -->
        <div class="phone-status-bar">
          <span class="phone-time">9:41</span>
          <div class="phone-status-icons">
            <!-- Signal bars -->
            <svg class="phone-signal" viewBox="0 0 18 12" fill="currentColor">
              <rect x="0" y="9" width="3" height="3" rx="0.5" opacity="1" />
              <rect x="4" y="6" width="3" height="6" rx="0.5" opacity="1" />
              <rect x="8" y="3" width="3" height="9" rx="0.5" opacity="1" />
              <rect x="12" y="0" width="3" height="12" rx="0.5" opacity="1" />
            </svg>
            <!-- WiFi -->
            <svg class="phone-wifi" viewBox="0 0 16 12" fill="currentColor">
              <path d="M8 9.6a1.4 1.4 0 110 2.8 1.4 1.4 0 010-2.8zM8 6c2.1 0 4 .86 5.37 2.24a.7.7 0 01-1 1A6.08 6.08 0 008 7.4a6.08 6.08 0 00-4.37 1.84.7.7 0 01-1-1A7.48 7.48 0 018 6zm0-3.6c3.15 0 6 1.28 8.07 3.36a.7.7 0 01-1 1A9.88 9.88 0 008 3.8a9.88 9.88 0 00-7.07 2.96.7.7 0 01-1-1A11.28 11.28 0 018 2.4z" />
            </svg>
            <!-- Battery -->
            <svg class="phone-battery" viewBox="0 0 28 13" fill="currentColor">
              <rect x="0" y="0.5" width="23" height="12" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.2" opacity="0.4" />
              <rect x="24.5" y="4" width="2.5" height="5" rx="1" opacity="0.4" />
              <rect x="1.5" y="2" width="19" height="9" rx="1.5" />
            </svg>
          </div>
        </div>

        <!-- Screen content slot -->
        <div class="phone-content">
          <slot />
        </div>

        <!-- Home indicator -->
        <div class="phone-home-indicator">
          <div class="phone-home-bar"></div>
        </div>
      </div>

      <!-- Glass reflection overlay -->
      <div class="phone-reflection"></div>
    </div>

    <!-- Floating badges slot -->
    <slot name="badges" />
  </div>
</template>

<style scoped>
/* ===== Phone Mockup — iPhone 15 Pro ===== */

/* Sizing variables per size prop */
.phone-mockup {
  --phone-w: 280px;
  --phone-h: 580px;
  --phone-bezel: 4px;
  --phone-radius: 48px;
  --phone-inner-radius: 44px;
  --island-w: 100px;
  --island-h: 30px;
  --island-top: 12px;
  --btn-offset: 6px;
  position: relative;
  width: var(--phone-w);
  flex-shrink: 0;
}

.phone-sm {
  --phone-w: 220px;
  --phone-h: 440px;
  --phone-bezel: 3px;
  --phone-radius: 38px;
  --phone-inner-radius: 35px;
  --island-w: 76px;
  --island-h: 22px;
  --island-top: 10px;
}

.phone-md {
  --phone-w: 280px;
  --phone-h: 580px;
}

.phone-lg {
  --phone-w: 300px;
  --phone-h: 620px;
  --phone-bezel: 5px;
  --phone-radius: 52px;
  --phone-inner-radius: 47px;
  --island-w: 110px;
  --island-h: 32px;
  --island-top: 14px;
}

/* Float animation */
.phone-float .phone-bezel {
  animation: phone-float-anim 8s ease-in-out infinite;
}

@keyframes phone-float-anim {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-16px); }
}

/* ===== Physical Side Buttons ===== */
.phone-btn {
  position: absolute;
  background: linear-gradient(180deg, #a8a8a8 0%, #8a8a8a 50%, #a0a0a0 100%);
  border-radius: 2px;
  z-index: 2;
}

/* Silent switch — left side, near top */
.phone-btn-silent {
  width: 3px;
  height: 22px;
  left: calc(var(--btn-offset) * -1 - 3px);
  top: calc(var(--phone-h) * 0.16);
  border-radius: 2px 0 0 2px;
}

/* Volume up */
.phone-btn-vol-up {
  width: 3px;
  height: 36px;
  left: calc(var(--btn-offset) * -1 - 3px);
  top: calc(var(--phone-h) * 0.24);
  border-radius: 2px 0 0 2px;
}

/* Volume down */
.phone-btn-vol-down {
  width: 3px;
  height: 36px;
  left: calc(var(--btn-offset) * -1 - 3px);
  top: calc(var(--phone-h) * 0.33);
  border-radius: 2px 0 0 2px;
}

/* Power button — right side */
.phone-btn-power {
  width: 3px;
  height: 48px;
  right: calc(var(--btn-offset) * -1 - 3px);
  top: calc(var(--phone-h) * 0.26);
  border-radius: 0 2px 2px 0;
}

@media (max-width: 768px) {
  .phone-btn { display: none; }
}

/* ===== Titanium Bezel ===== */
.phone-bezel {
  width: var(--phone-w);
  height: var(--phone-h);
  border-radius: var(--phone-radius);
  position: relative;
  overflow: hidden;
  /* Titanium gradient */
  background: linear-gradient(
    160deg,
    #d4d4d4 0%,
    #e8e8e8 15%,
    #b0b0b0 30%,
    #c8c8c8 50%,
    #a0a0a0 70%,
    #d0d0d0 85%,
    #b8b8b8 100%
  );
  padding: var(--phone-bezel);
  /* Multi-layered shadows */
  box-shadow:
    /* Ambient shadow */
    0 8px 32px rgba(15, 61, 46, 0.12),
    /* Directional shadow */
    0 24px 48px -8px rgba(0, 0, 0, 0.18),
    /* Distant shadow */
    0 48px 80px -16px rgba(0, 0, 0, 0.1),
    /* Inner bezel highlight */
    inset 0 1px 2px rgba(255, 255, 255, 0.6),
    inset 0 -1px 2px rgba(0, 0, 0, 0.15);
}

/* Top edge highlight */
.phone-edge-top {
  position: absolute;
  top: 0;
  left: 10%;
  right: 10%;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.8), transparent);
  z-index: 5;
}

/* Bottom edge shadow */
.phone-edge-bottom {
  position: absolute;
  bottom: 0;
  left: 10%;
  right: 10%;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(0, 0, 0, 0.15), transparent);
  z-index: 5;
}

/* ===== Screen ===== */
.phone-screen {
  width: 100%;
  height: 100%;
  border-radius: var(--phone-inner-radius);
  background: var(--bg-secondary, #faf7f0);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  position: relative;
}

/* ===== Dynamic Island ===== */
.phone-dynamic-island {
  position: absolute;
  top: var(--island-top);
  left: 50%;
  transform: translateX(-50%);
  width: var(--island-w);
  height: var(--island-h);
  background: #1a1a1a;
  border-radius: 100px;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 10px;
}

.phone-island-camera {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 35%, #2a2a4a, #0a0a1a);
  box-shadow: inset 0 0 2px rgba(80, 80, 160, 0.3);
}

.phone-sm .phone-island-camera {
  width: 6px;
  height: 6px;
}

.phone-sm .phone-dynamic-island {
  padding-right: 8px;
}

/* ===== Status Bar ===== */
.phone-status-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 24px 2px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-primary, #2d2d2d);
  z-index: 3;
  min-height: 48px;
}

.phone-sm .phone-status-bar {
  padding: 10px 18px 2px;
  font-size: 10px;
  min-height: 38px;
}

.phone-time {
  min-width: 32px;
}

.phone-status-icons {
  display: flex;
  align-items: center;
  gap: 5px;
}

.phone-signal {
  width: 16px;
  height: 12px;
}

.phone-wifi {
  width: 14px;
  height: 12px;
}

.phone-battery {
  width: 24px;
  height: 12px;
}

.phone-sm .phone-signal { width: 13px; height: 10px; }
.phone-sm .phone-wifi { width: 12px; height: 10px; }
.phone-sm .phone-battery { width: 20px; height: 10px; }

/* ===== Screen Content ===== */
.phone-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* ===== Home Indicator ===== */
.phone-home-indicator {
  display: flex;
  justify-content: center;
  padding: 8px 0 6px;
}

.phone-home-bar {
  width: 36%;
  height: 4px;
  background: var(--text-muted, #888);
  border-radius: 100px;
  opacity: 0.3;
}

.phone-sm .phone-home-bar {
  height: 3px;
}

/* ===== Glass Reflection ===== */
.phone-reflection {
  position: absolute;
  inset: var(--phone-bezel);
  border-radius: var(--phone-inner-radius);
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.12) 0%,
    rgba(255, 255, 255, 0.04) 30%,
    transparent 50%,
    transparent 70%,
    rgba(255, 255, 255, 0.02) 100%
  );
  pointer-events: none;
  z-index: 8;
}

/* ===== Reduced Motion ===== */
@media (prefers-reduced-motion: reduce) {
  .phone-float .phone-bezel {
    animation: none;
  }
}

/* ===== Mobile responsive ===== */
@media (max-width: 768px) {
  .phone-lg {
    --phone-w: 250px;
    --phone-h: 520px;
    --phone-radius: 44px;
    --phone-inner-radius: 40px;
    --island-w: 90px;
    --island-h: 26px;
    --island-top: 11px;
  }
}
</style>
