<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import MaterialIcon from '@/components/MaterialIcon.vue'

const props = defineProps<{ visible: boolean }>()
const { t } = useI18n()

const activeDesign = ref(0)
let rotationInterval: ReturnType<typeof setInterval> | null = null

interface DesignPreview {
  key: string
  image: string
  type: 'image' | 'video' | 'carousel'
  typeIcon: string
  headlineKey: string
  sublineKey: string
  brandKey: string
}

const designs: DesignPreview[] = [
  {
    key: 'cafe',
    image: '/example/cal-thumb-1.png',
    type: 'image',
    typeIcon: 'image',
    headlineKey: 'appLanding.designBuilder.designCafeHeadline',
    sublineKey: 'appLanding.designBuilder.designCafeSubline',
    brandKey: 'appLanding.designBuilder.designCafeBrand',
  },
  {
    key: 'salon',
    image: '/example/cal-thumb-4.png',
    type: 'video',
    typeIcon: 'videocam',
    headlineKey: 'appLanding.designBuilder.designSalonHeadline',
    sublineKey: 'appLanding.designBuilder.designSalonSubline',
    brandKey: 'appLanding.designBuilder.designSalonBrand',
  },
  {
    key: 'retail',
    image: '/example/cal-thumb-3.png',
    type: 'carousel',
    typeIcon: 'view_carousel',
    headlineKey: 'appLanding.designBuilder.designRetailHeadline',
    sublineKey: 'appLanding.designBuilder.designRetailSubline',
    brandKey: 'appLanding.designBuilder.designRetailBrand',
  },
]

const layers = [
  { icon: 'image', labelKey: 'appLanding.designBuilder.image' },
  { icon: 'title', labelKey: 'appLanding.designBuilder.text' },
  { icon: 'palette', labelKey: 'appLanding.designBuilder.branding' },
]

function startRotation() {
  stopRotation()
  rotationInterval = setInterval(() => {
    activeDesign.value = (activeDesign.value + 1) % designs.length
  }, 5000)
}

function stopRotation() {
  if (rotationInterval) {
    clearInterval(rotationInterval)
    rotationInterval = null
  }
}

function setDesign(index: number) {
  activeDesign.value = index
  if (props.visible) startRotation()
}

watch(() => props.visible, (v) => {
  if (v) {
    activeDesign.value = 0
    startRotation()
  } else {
    stopRotation()
  }
}, { immediate: true })

onUnmounted(() => stopRotation())
</script>

<template>
  <div class="lp-design-container">
    <div class="lp-design-showcase">
      <!-- Main canvas -->
      <div class="lp-design-stage">
        <Transition name="design-fade" mode="out-in">
          <div :key="designs[activeDesign].key" class="lp-design-card">
            <img
              :src="designs[activeDesign].image"
              alt=""
              class="lp-design-img"
              loading="lazy"
            />
            <div class="lp-design-gradient" />

            <!-- Type badge -->
            <div class="lp-design-type-badge">
              <MaterialIcon :icon="designs[activeDesign].typeIcon" size="sm" />
              <span>{{ t(`appLanding.designBuilder.format${designs[activeDesign].type}`) }}</span>
            </div>

            <!-- Video play button -->
            <div v-if="designs[activeDesign].type === 'video'" class="lp-design-play">
              <MaterialIcon icon="play_arrow" size="lg" />
            </div>

            <!-- Text overlay -->
            <div class="lp-design-overlay">
              <span class="lp-design-brand">{{ t(designs[activeDesign].brandKey) }}</span>
              <span class="lp-design-headline">{{ t(designs[activeDesign].headlineKey) }}</span>
              <span class="lp-design-subline">{{ t(designs[activeDesign].sublineKey) }}</span>
            </div>
          </div>
        </Transition>
      </div>

      <!-- Layer chips -->
      <div class="lp-design-layers">
        <div v-for="layer in layers" :key="layer.icon" class="lp-layer-chip">
          <MaterialIcon :icon="layer.icon" size="sm" />
          <span>{{ t(layer.labelKey) }}</span>
        </div>
      </div>

      <!-- Navigation dots -->
      <div class="lp-design-nav">
        <button
          v-for="(design, i) in designs"
          :key="design.key"
          class="lp-nav-dot"
          :class="{ active: i === activeDesign }"
          @click="setDesign(i)"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.lp-design-container {
  display: flex;
  justify-content: center;
}

.lp-design-showcase {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-lg);
}

.lp-design-stage {
  width: 380px;
  height: 380px;
  position: relative;
}

/* Transition */
.design-fade-enter-active,
.design-fade-leave-active {
  transition: opacity 0.5s ease, transform 0.5s ease;
}

.design-fade-enter-from {
  opacity: 0;
  transform: scale(0.95) translateY(8px);
}

.design-fade-leave-to {
  opacity: 0;
  transform: scale(1.03) translateY(-6px);
}

/* Design card */
.lp-design-card {
  position: absolute;
  inset: 0;
  border-radius: var(--radius-xl);
  overflow: hidden;
  border: 1px solid var(--lp-border);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.3),
    0 2px 8px rgba(0, 0, 0, 0.2);
}

.lp-design-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.lp-design-gradient {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to top,
    rgba(0, 0, 0, 0.75) 0%,
    rgba(0, 0, 0, 0.2) 50%,
    transparent 100%
  );
}

/* Type badge */
.lp-design-type-badge {
  position: absolute;
  top: var(--space-md);
  right: var(--space-md);
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: var(--radius-full);
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  z-index: 3;
}

.lp-design-type-badge span {
  font-size: 10px;
  font-weight: var(--font-semibold);
  color: #fff;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.lp-design-type-badge .material-icon {
  color: #fff;
  font-size: 14px;
}

/* Video play button */
.lp-design-play {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(8px);
  border: 1.5px solid rgba(255, 255, 255, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  z-index: 3;
}

/* Text overlay */
.lp-design-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: var(--space-2xl) var(--space-xl);
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  z-index: 2;
}

.lp-design-brand {
  font-size: 9px;
  font-weight: var(--font-bold);
  color: var(--lp-accent-orange);
  text-transform: uppercase;
  letter-spacing: 0.2em;
}

.lp-design-headline {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
  color: #fff;
  line-height: 1.15;
  letter-spacing: -0.01em;
}

.lp-design-subline {
  font-size: var(--text-sm);
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.5;
  max-width: 260px;
}

/* Layer chips */
.lp-design-layers {
  display: flex;
  gap: var(--space-sm);
}

.lp-layer-chip {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: var(--radius-full);
  background: var(--lp-bg-surface);
  border: 1px solid var(--lp-border);
  font-size: 11px;
  font-weight: var(--font-medium);
  color: var(--lp-text-secondary);
}

.lp-layer-chip .material-icon {
  font-size: 14px;
  color: var(--lp-text-muted);
}

/* Navigation dots */
.lp-design-nav {
  display: flex;
  gap: var(--space-sm);
  align-items: center;
}

.lp-nav-dot {
  width: 28px;
  height: 6px;
  padding: 0;
  border: none;
  background: var(--lp-bg-elevated);
  border-radius: var(--radius-full);
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: background 0.3s ease;
}

.lp-nav-dot:hover {
  background: var(--lp-border-light);
}

.lp-nav-dot::after {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--lp-accent-orange);
  border-radius: inherit;
  transform: scaleX(0);
  transform-origin: left;
}

.lp-nav-dot.active::after {
  transform: scaleX(1);
  animation: dot-progress 5s linear;
}

@keyframes dot-progress {
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
}

@media (max-width: 768px) {
  .lp-design-stage {
    width: 300px;
    height: 300px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .design-fade-enter-active,
  .design-fade-leave-active {
    transition-duration: 0.01ms !important;
  }

  .lp-nav-dot.active::after {
    animation: none;
    transform: scaleX(1);
  }
}
</style>
