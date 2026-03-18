<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import MaterialIcon from '@/components/MaterialIcon.vue'

defineProps<{ visible: boolean }>()

const { t } = useI18n()

const messages = [
  { key: 'greeting', isAI: true },
  { key: 'performance', isAI: true },
  { key: 'suggestion', isAI: true },
  { key: 'userReply', isAI: false },
  { key: 'confirmation', isAI: true },
]
</script>

<template>
  <div class="lp-brief-chat">
    <div class="lp-brief-header">
      <div class="lp-brief-avatar">
        <MaterialIcon icon="auto_awesome" size="sm" />
      </div>
      <div>
        <span class="lp-brief-name">SocialChef</span>
        <span class="lp-brief-time">{{ t('appLanding.briefing.time') }}</span>
      </div>
    </div>

    <div class="lp-brief-messages">
      <div
        v-for="msg in messages"
        :key="msg.key"
        class="lp-brief-message"
        :class="{ 'lp-user-msg': !msg.isAI }"
      >
        <div v-if="msg.isAI" class="lp-brief-msg-avatar">SC</div>
        <div class="lp-brief-bubble" :class="{ 'lp-bubble-user': !msg.isAI }">
          {{ t(`appLanding.briefing.${msg.key}`) }}
        </div>
      </div>

      <!-- Typing indicator -->
      <div v-if="visible" class="lp-brief-message">
        <div class="lp-brief-msg-avatar">SC</div>
        <div class="lp-brief-bubble">
          <div class="lp-typing-dots"><span /><span /><span /></div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.lp-brief-chat {
  background: var(--lp-bg-surface);
  border: 1px solid var(--lp-border);
  border-radius: var(--radius-xl);
  overflow: hidden;
}

.lp-brief-header {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-lg) var(--space-xl);
  border-bottom: 1px solid var(--lp-border);
}

.lp-brief-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--lp-gradient-aurora);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.lp-brief-name {
  font-weight: var(--font-semibold);
  color: var(--lp-text-primary);
  font-size: var(--text-sm);
  display: block;
}

.lp-brief-time {
  font-size: var(--text-xs);
  color: var(--lp-text-muted);
}

.lp-brief-messages {
  padding: var(--space-xl);
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.lp-brief-message {
  display: flex;
  gap: var(--space-sm);
  align-items: flex-start;
}

.lp-brief-message.lp-user-msg {
  justify-content: flex-end;
}

.lp-brief-msg-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--lp-bg-elevated);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 9px;
  font-weight: var(--font-bold);
  color: var(--lp-text-muted);
  flex-shrink: 0;
}

.lp-brief-bubble {
  font-size: var(--text-sm);
  line-height: 1.5;
  color: var(--lp-text-primary);
  background: var(--lp-bg-primary);
  padding: var(--space-md) var(--space-lg);
  border-radius: var(--radius-lg);
  border-bottom-left-radius: var(--radius-sm);
  max-width: 80%;
}

.lp-bubble-user {
  background: var(--lp-accent-orange);
  color: #fff;
  border-radius: var(--radius-lg);
  border-bottom-right-radius: var(--radius-sm);
}

.lp-typing-dots {
  display: flex;
  gap: 4px;
  align-items: center;
  padding: var(--space-xs) 0;
}

.lp-typing-dots span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--lp-text-muted);
  animation: typing-bounce 1.4s ease-in-out infinite;
}

.lp-typing-dots span:nth-child(2) { animation-delay: 0.2s; }
.lp-typing-dots span:nth-child(3) { animation-delay: 0.4s; }

@keyframes typing-bounce {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
  30% { transform: translateY(-4px); opacity: 1; }
}

@media (prefers-reduced-motion: reduce) {
  .lp-typing-dots span { animation: none; opacity: 0.6; }
}
</style>
