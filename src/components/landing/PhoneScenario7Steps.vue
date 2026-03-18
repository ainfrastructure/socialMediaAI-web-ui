<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import MaterialIcon from '@/components/MaterialIcon.vue'
import PlatformLogo from '@/components/PlatformLogo.vue'

const { t } = useI18n()

const layers = ['wallpaper', 'image', 'text_fields', 'branding_watermark']
const scheduleDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
</script>

<template>
  <div class="ps-root">
    <!-- ===== Step 1: AI Chat ===== -->
    <div class="ps-step ps-step-chat">
      <div class="ps-app-header">
        <img src="@/assets/socialchef_logo.svg" alt="" class="ps-logo" />
        <span>SocialChef</span>
      </div>
      <div class="ps-chat-messages">
        <div class="ps-chat-ai">
          <div class="ps-avatar">SC</div>
          <div class="ps-chat-ai-wrap">
            <div class="ps-typing-dots"><span /><span /><span /></div>
            <div class="ps-chat-ai-text">{{ t('appLanding.cinematic.stepChatGreeting') }}</div>
          </div>
        </div>
        <div class="ps-chat-user">
          <span class="ps-chat-user-text">{{ t('appLanding.cinematic.stepChatUserMessage') }}</span>
        </div>
        <div class="ps-chat-send">
          <MaterialIcon icon="send" size="xs" />
        </div>
      </div>
    </div>

    <!-- ===== Step 2: Content Strategy ===== -->
    <div class="ps-step ps-step-strategy">
      <div class="ps-app-header">
        <img src="@/assets/socialchef_logo.svg" alt="" class="ps-logo" />
        <span>SocialChef</span>
      </div>
      <div class="ps-strategy-body">
        <div class="ps-strategy-avatar-row">
          <div class="ps-avatar">SC</div>
          <span class="ps-strategy-label">AI Strategy</span>
        </div>
        <p class="ps-strategy-response">{{ t('appLanding.cinematic.stepStrategyResponse') }}</p>
        <div v-for="n in 3" :key="n" class="ps-strategy-card">
          <span class="ps-strategy-dot" :class="`ps-sdot-${n}`" />
          <span class="ps-strategy-card-text">{{ t(`appLanding.cinematic.stepStrategyCard${n}`) }}</span>
          <span class="ps-strategy-day">{{ t(`appLanding.cinematic.stepStrategyDay${n}`) }}</span>
        </div>
        <button class="ps-strategy-cta">{{ t('appLanding.cinematic.stepStrategyGenerate') }}</button>
      </div>
    </div>

    <!-- ===== Step 3: Design Builder ===== -->
    <div class="ps-step ps-step-design">
      <div class="ps-app-header ps-header-accent" style="--h-accent: var(--lp-accent-cyan)">
        <MaterialIcon icon="palette" size="xs" />
        <span>{{ t('appLanding.cinematic.stepDesignChoose') }}</span>
      </div>
      <div class="ps-design-body">
        <div class="ps-design-cards">
          <div class="ps-design-card ps-dcard-1">
            <div class="ps-design-pattern ps-pat-topo" />
            <span>Oceanic</span>
          </div>
          <div class="ps-design-card ps-dcard-2 ps-design-selected">
            <div class="ps-design-pattern ps-pat-coastal" />
            <span>Coastal</span>
          </div>
          <div class="ps-design-card ps-dcard-3">
            <div class="ps-design-pattern ps-pat-halftone" />
            <span>Premium</span>
            <span class="ps-premium-tag">{{ t('appLanding.cinematic.stepDesignPremium') }}</span>
          </div>
        </div>
        <div class="ps-design-layers">
          <div v-for="(icon, idx) in layers" :key="icon" class="ps-design-layer">
            <MaterialIcon :icon="icon" size="xs" />
            <span>{{ t(`appLanding.cinematic.stepDesignLayer${idx + 1}`) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- ===== Step 4: Content Created ===== -->
    <div class="ps-step ps-step-create">
      <div class="ps-app-header ps-header-accent" style="--h-accent: var(--lp-accent-violet)">
        <MaterialIcon icon="auto_awesome" size="xs" />
        <span>Creating...</span>
      </div>
      <div class="ps-create-body">
        <div class="ps-shimmer" />
        <div class="ps-shimmer ps-shimmer-md" />
        <div class="ps-shimmer ps-shimmer-sm" />
        <svg class="ps-ring" viewBox="0 0 40 40">
          <circle cx="20" cy="20" r="16" fill="none" stroke="var(--lp-border-light)" stroke-width="2" />
          <circle class="ps-ring-arc" cx="20" cy="20" r="16" fill="none" stroke="var(--lp-accent-violet)" stroke-width="2" stroke-linecap="round" stroke-dasharray="100" stroke-dashoffset="100" transform="rotate(-90 20 20)" />
        </svg>
        <div class="ps-create-post">
          <div class="ps-create-accent-bar" />
          <div class="ps-create-post-inner">
            <span class="ps-create-tag">{{ t('appLanding.cinematic.stepCreateTag') }}</span>
            <p class="ps-create-headline">{{ t('appLanding.cinematic.stepCreateHeadline') }}</p>
          </div>
          <div class="ps-create-post-foot">
            <span class="ps-create-brand">{{ t('appLanding.cinematic.stepCreateBrand') }}</span>
          </div>
        </div>
        <div class="ps-create-hashtags">
          <span v-for="n in 3" :key="n" class="ps-hashtag">{{ t(`appLanding.cinematic.stepCreateHashtag${n}`) }}</span>
        </div>
        <div class="ps-sparkle-badge">{{ t('appLanding.cinematic.stepCreateSparkle') }}</div>
        <div class="ps-sparkle-dots">
          <span v-for="n in 5" :key="n" class="ps-sparkle-dot" />
        </div>
      </div>
    </div>

    <!-- ===== Step 5: Multi-Platform ===== -->
    <div class="ps-step ps-step-adapt">
      <div class="ps-app-header ps-header-accent" style="--h-accent: var(--lp-accent-blue)">
        <MaterialIcon icon="devices" size="xs" />
        <span>Multi-Platform</span>
      </div>
      <div class="ps-adapt-body">
        <div class="ps-adapt-fan">
          <div class="ps-adapt-card ps-acard-1">
            <PlatformLogo platform="instagram" :size="20" />
            <span class="ps-adapt-name">Instagram</span>
            <div class="ps-adapt-preview" />
            <MaterialIcon icon="check_circle" size="xs" class="ps-adapt-check" />
          </div>
          <div class="ps-adapt-card ps-acard-2">
            <PlatformLogo platform="linkedin" :size="20" />
            <span class="ps-adapt-name">LinkedIn</span>
            <div class="ps-adapt-preview" />
            <span class="ps-adapt-charcount" data-charcount>0 / 3,000</span>
            <MaterialIcon icon="check_circle" size="xs" class="ps-adapt-check" />
          </div>
          <div class="ps-adapt-card ps-acard-3">
            <PlatformLogo platform="facebook" :size="20" />
            <span class="ps-adapt-name">Facebook</span>
            <div class="ps-adapt-preview" />
            <MaterialIcon icon="check_circle" size="xs" class="ps-adapt-check" />
          </div>
        </div>
        <div class="ps-confetti">
          <span v-for="n in 10" :key="n" class="ps-confetti-dot" />
        </div>
      </div>
    </div>

    <!-- ===== Step 6: Schedule ===== -->
    <div class="ps-step ps-step-schedule">
      <div class="ps-app-header ps-header-accent" style="--h-accent: var(--lp-accent-orange)">
        <MaterialIcon icon="calendar_month" size="xs" />
        <span>Schedule</span>
      </div>
      <div class="ps-schedule-body">
        <div class="ps-schedule-grid">
          <div v-for="(day, idx) in scheduleDays" :key="day" class="ps-schedule-col">
            <span class="ps-schedule-day-label">{{ t(`appLanding.cinematic.stepSchedule${day}`) }}</span>
            <span class="ps-schedule-day-num">{{ 16 + idx }}</span>
            <span class="ps-schedule-dot" :class="idx < 2 ? 'ps-dot-green' : 'ps-dot-orange'" />
          </div>
        </div>
        <div class="ps-schedule-highlight">
          <div class="ps-schedule-hl-bar" />
          <div class="ps-schedule-hl-content">
            <span class="ps-schedule-hl-title">{{ t('appLanding.cinematic.stepCreateTag') }}</span>
            <span class="ps-schedule-hl-time">{{ t('appLanding.cinematic.stepScheduleBestTime') }}</span>
          </div>
        </div>
        <div class="ps-badge-carousel">
          <div class="ps-badge ps-badge-scheduled">
            <MaterialIcon icon="schedule" size="xs" />
            <span>Scheduled</span>
          </div>
          <div class="ps-badge ps-badge-published">
            <MaterialIcon icon="check_circle" size="xs" />
            <span>Published</span>
          </div>
          <div class="ps-badge ps-badge-cta-pill">
            <MaterialIcon icon="arrow_forward" size="xs" />
            <span>{{ t('appLanding.cinematic.stepAnalyticsCta') }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- ===== Step 7: Track Results ===== -->
    <div class="ps-step ps-step-analytics">
      <div class="ps-app-header ps-header-accent" style="--h-accent: #22c55e">
        <MaterialIcon icon="insights" size="xs" />
        <span>Analytics</span>
      </div>
      <div class="ps-analytics-body">
        <div class="ps-kpi-grid">
          <div class="ps-kpi">
            <span class="ps-kpi-label">{{ t('appLanding.cinematic.stepAnalyticsLikes') }}</span>
            <span class="ps-kpi-value" data-kpi="likes">0</span>
            <span class="ps-kpi-pct">↑18%</span>
          </div>
          <div class="ps-kpi">
            <span class="ps-kpi-label">{{ t('appLanding.cinematic.stepAnalyticsComments') }}</span>
            <span class="ps-kpi-value" data-kpi="comments">0</span>
            <span class="ps-kpi-pct">↑32%</span>
          </div>
          <div class="ps-kpi">
            <span class="ps-kpi-label">{{ t('appLanding.cinematic.stepAnalyticsReach') }}</span>
            <span class="ps-kpi-value" data-kpi="reach">0</span>
            <span class="ps-kpi-pct">↑24%</span>
          </div>
          <div class="ps-kpi">
            <span class="ps-kpi-label">{{ t('appLanding.cinematic.stepAnalyticsShares') }}</span>
            <span class="ps-kpi-value" data-kpi="shares">0</span>
            <span class="ps-kpi-pct">↑45%</span>
          </div>
        </div>
        <div class="ps-sparkline-wrap">
          <svg viewBox="0 0 240 60" class="ps-sparkline-svg" preserveAspectRatio="none">
            <defs>
              <linearGradient id="psSparkGrad7" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#22c55e" stop-opacity="0.25" />
                <stop offset="100%" stop-color="#22c55e" stop-opacity="0" />
              </linearGradient>
            </defs>
            <path d="M0,48 Q24,44 48,36 T96,24 T144,28 T192,12 T240,16 V60 H0 Z" fill="url(#psSparkGrad7)" />
            <path class="ps-spark-line" d="M0,48 Q24,44 48,36 T96,24 T144,28 T192,12 T240,16" fill="none" stroke="#22c55e" stroke-width="2" stroke-linecap="round" />
          </svg>
        </div>
        <div class="ps-top-post">
          <MaterialIcon icon="emoji_events" size="xs" />
          <span>{{ t('appLanding.cinematic.stepAnalyticsTopPost') }}</span>
        </div>
        <button class="ps-analytics-cta">{{ t('appLanding.cinematic.stepAnalyticsCta') }}</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ps-root {
  width: 100%;
  height: 100%;
  position: relative;
  background: var(--lp-bg-primary, #09090B);
}

.ps-step {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  visibility: hidden;
  opacity: 0;
}

.ps-step-chat {
  visibility: visible;
  opacity: 1;
}

/* ===== Shared: App Header ===== */
.ps-app-header {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  border-bottom: 1px solid var(--lp-border, rgba(255,255,255,0.08));
  font-weight: var(--font-semibold);
  font-size: var(--text-xs);
  color: var(--lp-text-primary);
  background: var(--lp-bg-surface, rgba(255,255,255,0.03));
  flex-shrink: 0;
}

.ps-header-accent {
  color: var(--h-accent);
}

.ps-logo {
  width: 18px;
  height: 18px;
  border-radius: 4px;
}

/* ===== Shared: Avatar ===== */
.ps-avatar {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--lp-gradient-aurora);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 7px;
  font-weight: var(--font-bold);
  color: #fff;
  flex-shrink: 0;
}

/* ===== Step 1: Chat ===== */
.ps-chat-messages {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  padding: var(--space-md);
  overflow: hidden;
  position: relative;
}

.ps-chat-ai {
  display: flex;
  gap: var(--space-xs);
  align-self: flex-start;
  background: var(--lp-bg-surface, rgba(255,255,255,0.06));
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-lg);
  border-bottom-left-radius: var(--radius-sm);
  max-width: 90%;
  opacity: 0;
}

.ps-chat-ai-wrap {
  min-width: 0;
}

.ps-typing-dots {
  display: flex;
  gap: 3px;
  align-items: center;
  padding: 2px 0;
}

.ps-typing-dots span {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--lp-text-muted);
  animation: ps-bounce 1.4s ease-in-out infinite;
}

.ps-typing-dots span:nth-child(2) { animation-delay: 0.15s; }
.ps-typing-dots span:nth-child(3) { animation-delay: 0.3s; }

@keyframes ps-bounce {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
  30% { transform: translateY(-3px); opacity: 1; }
}

.ps-chat-ai-text {
  font-size: 10px;
  line-height: 1.5;
  color: var(--lp-text-primary);
  opacity: 0;
  max-height: 0;
  overflow: hidden;
}

.ps-chat-user {
  align-self: flex-end;
  background: var(--lp-accent-orange);
  color: #fff;
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-lg);
  border-bottom-right-radius: var(--radius-sm);
  max-width: 90%;
  font-size: 11px;
  line-height: 1.5;
  opacity: 0;
}

.ps-chat-user-text {
  display: inline-block;
  overflow: hidden;
  white-space: nowrap;
  max-width: 0;
}

.ps-chat-send {
  position: absolute;
  bottom: var(--space-md);
  right: var(--space-md);
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--lp-accent-orange);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transform: scale(0.8);
}

/* ===== Step 2: Strategy ===== */
.ps-strategy-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  padding: var(--space-md);
  overflow: hidden;
}

.ps-strategy-avatar-row {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

.ps-strategy-label {
  font-size: 9px;
  font-weight: var(--font-semibold);
  color: var(--lp-accent-violet);
}

.ps-strategy-response {
  font-size: 10px;
  line-height: 1.5;
  color: var(--lp-text-primary);
  margin: 0;
  opacity: 0;
  clip-path: inset(0 100% 0 0);
}

.ps-strategy-card {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  background: var(--lp-bg-surface, rgba(255,255,255,0.06));
  border: 1px solid var(--lp-border, rgba(255,255,255,0.08));
  border-radius: var(--radius-md);
  padding: var(--space-sm) var(--space-md);
  opacity: 0;
}

.ps-strategy-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.ps-sdot-1 { background: var(--lp-accent-orange); }
.ps-sdot-2 { background: var(--lp-accent-violet); }
.ps-sdot-3 { background: var(--lp-accent-cyan); }

.ps-strategy-card-text {
  flex: 1;
  font-size: 10px;
  color: var(--lp-text-primary);
  font-weight: var(--font-medium);
}

.ps-strategy-day {
  font-size: 8px;
  color: var(--lp-text-muted);
  font-weight: var(--font-semibold);
}

.ps-strategy-cta {
  background: var(--lp-accent-violet);
  color: #fff;
  border: none;
  font-family: var(--font-body);
  font-size: 10px;
  font-weight: var(--font-semibold);
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-md);
  cursor: pointer;
  opacity: 0;
  margin-top: var(--space-xs);
}

/* ===== Step 3: Design ===== */
.ps-design-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  padding: var(--space-md);
  overflow: hidden;
}

.ps-design-cards {
  display: flex;
  gap: var(--space-sm);
  justify-content: center;
}

.ps-design-card {
  width: 76px;
  border-radius: var(--radius-md);
  background: var(--lp-bg-surface, rgba(255,255,255,0.06));
  border: 1px solid var(--lp-border, rgba(255,255,255,0.08));
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding-bottom: var(--space-xs);
  opacity: 0;
  position: relative;
}

.ps-design-pattern {
  width: 100%;
  height: 80px;
}

.ps-pat-topo {
  background: radial-gradient(circle at 50% 50%, transparent 20px, var(--lp-accent-cyan) 20px, var(--lp-accent-cyan) 22px, transparent 22px),
              radial-gradient(circle at 50% 50%, transparent 35px, var(--lp-accent-cyan) 35px, var(--lp-accent-cyan) 37px, transparent 37px);
  opacity: 0.3;
  background-color: color-mix(in srgb, var(--lp-accent-cyan) 10%, var(--lp-bg-surface));
}

.ps-pat-coastal {
  background: repeating-linear-gradient(
    0deg,
    color-mix(in srgb, var(--lp-accent-blue) 15%, transparent) 0px,
    color-mix(in srgb, var(--lp-accent-blue) 5%, transparent) 8px,
    transparent 8px,
    transparent 16px
  );
  background-color: color-mix(in srgb, var(--lp-accent-blue) 8%, var(--lp-bg-surface));
}

.ps-pat-halftone {
  background-image: radial-gradient(circle, var(--lp-accent-violet) 1.5px, transparent 1.5px);
  background-size: 8px 8px;
  opacity: 0.3;
  background-color: color-mix(in srgb, var(--lp-accent-violet) 8%, var(--lp-bg-surface));
}

.ps-design-card span {
  font-size: 8px;
  font-weight: var(--font-semibold);
  color: var(--lp-text-secondary);
}

.ps-design-selected {
  border-color: var(--lp-accent-cyan);
  box-shadow: 0 0 12px color-mix(in srgb, var(--lp-accent-cyan) 30%, transparent);
}

.ps-premium-tag {
  position: absolute;
  top: 4px;
  right: 4px;
  font-size: 7px !important;
  font-weight: var(--font-bold) !important;
  color: var(--lp-accent-violet) !important;
  background: color-mix(in srgb, var(--lp-accent-violet) 20%, transparent);
  padding: 1px 5px;
  border-radius: var(--radius-full);
  opacity: 0;
}

.ps-design-layers {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.ps-design-layer {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  background: var(--lp-bg-surface, rgba(255,255,255,0.04));
  border: 1px solid var(--lp-border, rgba(255,255,255,0.06));
  border-radius: var(--radius-sm);
  padding: 6px var(--space-sm);
  font-size: 9px;
  color: var(--lp-text-secondary);
  opacity: 0;
}

.ps-design-layer .material-icon {
  color: var(--lp-accent-cyan);
}

/* ===== Step 4: Create ===== */
.ps-create-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-md);
  overflow: hidden;
  position: relative;
}

.ps-shimmer {
  width: 100%;
  height: 10px;
  border-radius: 5px;
  background: linear-gradient(90deg, var(--lp-bg-elevated) 25%, var(--lp-bg-card) 50%, var(--lp-bg-elevated) 75%);
  background-size: 200% 100%;
  animation: ps-shimmer-anim 1.5s ease-in-out infinite;
}

.ps-shimmer-md { width: 75%; align-self: flex-start; }
.ps-shimmer-sm { width: 50%; align-self: flex-start; }

@keyframes ps-shimmer-anim {
  from { background-position: 200% 0; }
  to { background-position: -200% 0; }
}

.ps-ring {
  width: 40px;
  height: 40px;
  opacity: 0;
}

.ps-create-post {
  width: 100%;
  background: var(--lp-bg-surface, rgba(255,255,255,0.06));
  border: 1px solid var(--lp-border-light, rgba(255,255,255,0.1));
  border-radius: var(--radius-md);
  overflow: hidden;
  opacity: 0;
}

.ps-create-accent-bar {
  height: 3px;
  background: var(--lp-accent-orange);
  transform-origin: left;
  transform: scaleX(0);
}

.ps-create-post-inner {
  padding: var(--space-sm) var(--space-md);
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.ps-create-tag {
  display: inline-block;
  width: fit-content;
  font-size: 8px;
  padding: 2px 8px;
  border-radius: var(--radius-full);
  background: color-mix(in srgb, var(--lp-accent-orange) 15%, transparent);
  color: var(--lp-accent-orange);
  font-weight: var(--font-semibold);
  opacity: 0;
}

.ps-create-headline {
  font-size: 10px;
  font-weight: var(--font-medium);
  color: var(--lp-text-primary);
  line-height: 1.5;
  margin: 0;
  opacity: 0;
}

.ps-create-post-foot {
  padding: var(--space-xs) var(--space-md) var(--space-sm);
}

.ps-create-brand {
  font-size: 8px;
  font-weight: var(--font-bold);
  letter-spacing: 0.15em;
  color: var(--lp-text-muted);
}

.ps-create-hashtags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  width: 100%;
}

.ps-hashtag {
  font-size: 9px;
  padding: 3px 8px;
  border-radius: var(--radius-full);
  background: color-mix(in srgb, var(--lp-accent-violet) 15%, transparent);
  color: var(--lp-accent-violet);
  font-weight: var(--font-medium);
  opacity: 0;
}

.ps-sparkle-badge {
  font-size: 9px;
  font-weight: var(--font-semibold);
  color: var(--lp-accent-violet);
  background: color-mix(in srgb, var(--lp-accent-violet) 12%, transparent);
  border: 1px solid color-mix(in srgb, var(--lp-accent-violet) 25%, transparent);
  padding: 3px 10px;
  border-radius: var(--radius-full);
  opacity: 0;
  transform: scale(0);
}

.ps-sparkle-dots {
  position: absolute;
  top: 50%;
  left: 50%;
  pointer-events: none;
}

.ps-sparkle-dot {
  position: absolute;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  opacity: 0;
}

.ps-sparkle-dot:nth-child(1) { background: var(--lp-accent-orange); }
.ps-sparkle-dot:nth-child(2) { background: var(--lp-accent-violet); }
.ps-sparkle-dot:nth-child(3) { background: var(--lp-accent-cyan); }
.ps-sparkle-dot:nth-child(4) { background: var(--lp-accent-blue); }
.ps-sparkle-dot:nth-child(5) { background: #22c55e; }

/* ===== Step 5: Adapt ===== */
.ps-adapt-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-md);
  overflow: hidden;
  position: relative;
}

.ps-adapt-fan {
  position: relative;
  width: 100%;
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ps-adapt-card {
  position: absolute;
  width: 90px;
  border-radius: var(--radius-md);
  background: var(--lp-bg-surface, rgba(255,255,255,0.06));
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--lp-border-light, rgba(255,255,255,0.1));
  padding: var(--space-sm);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.3);
  opacity: 0;
}

.ps-adapt-name {
  font-size: 8px;
  font-weight: var(--font-bold);
  color: var(--lp-text-primary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.ps-adapt-preview {
  width: 100%;
  height: 40px;
  border-radius: var(--radius-sm);
  background: var(--lp-bg-elevated, rgba(255,255,255,0.04));
  border: 1px solid var(--lp-border, rgba(255,255,255,0.06));
}

.ps-adapt-check {
  color: #22c55e;
  opacity: 0;
}

.ps-adapt-charcount {
  font-size: 7px;
  color: var(--lp-text-muted);
  font-weight: var(--font-medium);
}

.ps-confetti {
  position: absolute;
  top: 50%;
  left: 50%;
  pointer-events: none;
}

.ps-confetti-dot {
  position: absolute;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  opacity: 0;
}

.ps-confetti-dot:nth-child(1) { background: var(--lp-accent-orange); }
.ps-confetti-dot:nth-child(2) { background: var(--lp-accent-violet); }
.ps-confetti-dot:nth-child(3) { background: var(--lp-accent-cyan); }
.ps-confetti-dot:nth-child(4) { background: var(--lp-accent-blue); }
.ps-confetti-dot:nth-child(5) { background: #22c55e; }
.ps-confetti-dot:nth-child(6) { background: var(--lp-accent-orange); }
.ps-confetti-dot:nth-child(7) { background: var(--lp-accent-violet); }
.ps-confetti-dot:nth-child(8) { background: var(--lp-accent-cyan); }
.ps-confetti-dot:nth-child(9) { background: #22c55e; }
.ps-confetti-dot:nth-child(10) { background: var(--lp-accent-blue); }

/* ===== Step 6: Schedule ===== */
.ps-schedule-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  padding: var(--space-md);
  overflow: hidden;
}

.ps-schedule-grid {
  display: flex;
  gap: 2px;
  opacity: 0;
}

.ps-schedule-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: var(--space-xs);
  border-radius: var(--radius-sm);
  background: var(--lp-bg-surface, rgba(255,255,255,0.03));
}

.ps-schedule-day-label {
  font-size: 7px;
  font-weight: var(--font-semibold);
  color: var(--lp-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.ps-schedule-day-num {
  font-size: 12px;
  font-weight: var(--font-bold);
  color: var(--lp-text-primary);
}

.ps-schedule-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  opacity: 0;
}

.ps-dot-green { background: #22c55e; }
.ps-dot-orange { background: var(--lp-accent-orange); }

.ps-schedule-highlight {
  display: flex;
  background: var(--lp-bg-surface, rgba(255,255,255,0.06));
  border: 1px solid var(--lp-border-light, rgba(255,255,255,0.1));
  border-radius: var(--radius-md);
  overflow: hidden;
  opacity: 0;
}

.ps-schedule-hl-bar {
  width: 3px;
  background: var(--lp-accent-orange);
  flex-shrink: 0;
}

.ps-schedule-hl-content {
  padding: var(--space-sm) var(--space-md);
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.ps-schedule-hl-title {
  font-size: 10px;
  font-weight: var(--font-semibold);
  color: var(--lp-text-primary);
}

.ps-schedule-hl-time {
  font-size: 8px;
  color: var(--lp-text-muted);
  opacity: 0;
}

.ps-badge-carousel {
  position: relative;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}

.ps-badge {
  position: absolute;
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-xs) var(--space-md);
  border-radius: var(--radius-full);
  font-size: 9px;
  font-weight: var(--font-semibold);
  white-space: nowrap;
  opacity: 0;
}

.ps-badge-scheduled {
  background: rgba(255,255,255,0.06);
  border: 1px solid color-mix(in srgb, var(--lp-accent-orange) 30%, transparent);
  color: var(--lp-accent-orange);
}

.ps-badge-published {
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(34, 197, 94, 0.3);
  color: #22c55e;
}

.ps-badge-cta-pill {
  background: var(--lp-accent-orange);
  color: #fff;
  border: 1px solid var(--lp-accent-orange);
}

/* ===== Step 7: Analytics ===== */
.ps-analytics-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  padding: var(--space-md);
  overflow: hidden;
}

.ps-kpi-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-xs);
}

.ps-kpi {
  background: var(--lp-bg-surface, rgba(255,255,255,0.06));
  border: 1px solid var(--lp-border, rgba(255,255,255,0.06));
  border-radius: var(--radius-md);
  padding: var(--space-sm);
  display: flex;
  flex-direction: column;
  gap: 2px;
  opacity: 0;
}

.ps-kpi-label {
  font-size: 7px;
  font-weight: var(--font-semibold);
  color: var(--lp-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.ps-kpi-value {
  font-size: 14px;
  font-weight: var(--font-bold);
  color: var(--lp-text-primary);
}

.ps-kpi-pct {
  font-size: 8px;
  font-weight: var(--font-semibold);
  color: #22c55e;
  opacity: 0;
}

.ps-sparkline-wrap {
  height: 50px;
  width: 100%;
}

.ps-sparkline-svg {
  width: 100%;
  height: 100%;
}

.ps-spark-line {
  stroke-dasharray: 400;
  stroke-dashoffset: 400;
}

.ps-top-post {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  align-self: center;
  background: rgba(34, 197, 94, 0.12);
  border: 1px solid rgba(34, 197, 94, 0.25);
  color: #22c55e;
  font-size: 9px;
  font-weight: var(--font-semibold);
  padding: 3px 10px;
  border-radius: var(--radius-full);
  opacity: 0;
}

.ps-analytics-cta {
  background: var(--lp-accent-orange);
  color: #fff;
  border: none;
  font-family: var(--font-body);
  font-size: 10px;
  font-weight: var(--font-semibold);
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-md);
  cursor: pointer;
  opacity: 0;
  animation: none;
}

@keyframes ps-cta-glow {
  0%, 100% { box-shadow: 0 0 8px var(--lp-accent-orange-glow); }
  50% { box-shadow: 0 0 20px var(--lp-accent-orange-glow); }
}

/* ===== Mobile ===== */
@media (max-width: 768px) {
  .ps-adapt-card { width: 76px; padding: 6px; }
  .ps-adapt-preview { height: 30px; }
  .ps-design-card { width: 66px; }
  .ps-design-pattern { height: 60px; }
  .ps-schedule-col:nth-child(4),
  .ps-schedule-col:nth-child(5) { display: none; }
}

/* ===== Reduced Motion ===== */
@media (prefers-reduced-motion: reduce) {
  .ps-typing-dots span { animation: none; opacity: 0.6; }
  .ps-shimmer { animation: none; }
  .ps-analytics-cta { animation: none; }
}
</style>
