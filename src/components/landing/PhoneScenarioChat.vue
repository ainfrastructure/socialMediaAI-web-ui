<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import MaterialIcon from '@/components/MaterialIcon.vue'

const { t } = useI18n()
</script>

<template>
  <div class="scenario-chat">
    <!-- App header -->
    <div class="sc-header">
      <img src="@/assets/socialchef_logo.svg" alt="" class="sc-logo" />
      <span>SocialChef</span>
    </div>

    <div class="sc-messages">
      <!-- User message -->
      <div class="sc-bubble sc-user">
        {{ t('appLanding.cinematic.chatUserMsg') }}
      </div>

      <!-- AI typing dots -->
      <div class="sc-bubble sc-ai">
        <div class="sc-ai-avatar">SC</div>
        <div class="sc-ai-body">
          <div class="sc-typing-dots"><span /><span /><span /></div>
          <div class="sc-ai-text">{{ t('appLanding.cinematic.chatAiResponse') }}</div>
        </div>
      </div>

      <!-- Post card -->
      <div class="sc-post-card">
        <div class="sc-post-image">
          <img src="/example/example5-enhanced.jpg" alt="" />
        </div>
        <div class="sc-post-caption">{{ t('appLanding.cinematic.chatPostCaption') }}</div>
        <div class="sc-post-tags">
          <span class="sc-tag">#SummerCollection</span>
          <span class="sc-tag">#NewArrivals</span>
        </div>
        <div class="sc-post-actions">
          <button class="sc-btn-publish">
            <MaterialIcon icon="send" size="xs" />
            {{ t('appLanding.cinematic.chatPublish') }}
          </button>
          <button class="sc-btn-secondary">{{ t('appLanding.cinematic.chatSchedule') }}</button>
        </div>
      </div>

      <!-- Confetti container -->
      <div class="sc-confetti">
        <span v-for="i in 10" :key="i" class="sc-confetti-dot" />
      </div>

      <!-- Success badge -->
      <div class="sc-success-badge">
        <MaterialIcon icon="check_circle" size="xs" />
        {{ t('appLanding.cinematic.chatPublished') }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.scenario-chat {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--lp-bg-primary, #0d0d12);
}

.sc-header {
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

.sc-logo {
  width: 18px;
  height: 18px;
  border-radius: 4px;
}

.sc-messages {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  padding: var(--space-md);
  overflow: hidden;
  position: relative;
}

/* Bubbles */
.sc-bubble {
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-lg);
  font-size: 11px;
  line-height: 1.5;
  max-width: 90%;
}

.sc-user {
  background: var(--lp-accent-orange);
  color: #fff;
  align-self: flex-end;
  border-bottom-right-radius: var(--radius-sm);
  opacity: 0;
}

.sc-ai {
  display: flex;
  gap: var(--space-xs);
  align-self: flex-start;
  background: var(--lp-bg-surface, rgba(255,255,255,0.06));
  color: var(--lp-text-primary);
  border-bottom-left-radius: var(--radius-sm);
  opacity: 0;
}

.sc-ai-avatar {
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

.sc-ai-body {
  min-width: 0;
}

.sc-typing-dots {
  display: flex;
  gap: 3px;
  align-items: center;
  padding: 2px 0;
}

.sc-typing-dots span {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--lp-text-muted);
  animation: sc-bounce 1.4s ease-in-out infinite;
}

.sc-typing-dots span:nth-child(2) { animation-delay: 0.2s; }
.sc-typing-dots span:nth-child(3) { animation-delay: 0.4s; }

@keyframes sc-bounce {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
  30% { transform: translateY(-3px); opacity: 1; }
}

.sc-ai-text {
  font-size: 10px;
  line-height: 1.5;
  opacity: 0;
  max-height: 0;
  overflow: hidden;
}

/* Post card */
.sc-post-card {
  background: var(--lp-bg-surface, rgba(255,255,255,0.06));
  border: 1px solid var(--lp-border-light, rgba(255,255,255,0.1));
  border-radius: var(--radius-md);
  overflow: hidden;
  opacity: 0;
  transform: scale(0.9);
}

.sc-post-image {
  height: 80px;
  overflow: hidden;
}

.sc-post-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.sc-post-caption {
  font-size: 10px;
  color: var(--lp-text-primary);
  padding: var(--space-xs) var(--space-sm);
  line-height: 1.4;
}

.sc-post-tags {
  display: flex;
  gap: 4px;
  padding: 0 var(--space-sm) var(--space-xs);
  flex-wrap: wrap;
}

.sc-tag {
  font-size: 9px;
  padding: 2px 6px;
  border-radius: var(--radius-full);
  background: color-mix(in srgb, var(--lp-accent-violet) 15%, transparent);
  color: var(--lp-accent-violet);
  font-weight: var(--font-medium);
}

.sc-post-actions {
  display: flex;
  gap: var(--space-xs);
  padding: var(--space-xs) var(--space-sm) var(--space-sm);
}

.sc-btn-publish {
  display: flex;
  align-items: center;
  gap: 3px;
  background: var(--lp-accent-orange);
  color: #fff;
  border: none;
  font-size: 9px;
  font-weight: var(--font-semibold);
  padding: 4px 10px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-family: var(--font-body);
}

.sc-btn-secondary {
  background: transparent;
  border: 1px solid var(--lp-border-light, rgba(255,255,255,0.15));
  color: var(--lp-text-secondary);
  font-size: 9px;
  padding: 4px 10px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-family: var(--font-body);
}

/* Confetti */
.sc-confetti {
  position: absolute;
  top: 50%;
  left: 50%;
  pointer-events: none;
}

.sc-confetti-dot {
  position: absolute;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  opacity: 0;
}

.sc-confetti-dot:nth-child(1) { background: var(--lp-accent-orange); }
.sc-confetti-dot:nth-child(2) { background: var(--lp-accent-violet); }
.sc-confetti-dot:nth-child(3) { background: var(--lp-accent-cyan); }
.sc-confetti-dot:nth-child(4) { background: var(--lp-accent-blue); }
.sc-confetti-dot:nth-child(5) { background: #22c55e; }
.sc-confetti-dot:nth-child(6) { background: var(--lp-accent-orange); }
.sc-confetti-dot:nth-child(7) { background: var(--lp-accent-violet); }
.sc-confetti-dot:nth-child(8) { background: var(--lp-accent-cyan); }
.sc-confetti-dot:nth-child(9) { background: #22c55e; }
.sc-confetti-dot:nth-child(10) { background: var(--lp-accent-blue); }

/* Success badge */
.sc-success-badge {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  align-self: center;
  background: rgba(34, 197, 94, 0.15);
  border: 1px solid rgba(34, 197, 94, 0.3);
  color: #22c55e;
  font-size: 10px;
  font-weight: var(--font-semibold);
  padding: 4px 12px;
  border-radius: var(--radius-full);
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .sc-typing-dots span { animation: none; opacity: 0.6; }
}
</style>
