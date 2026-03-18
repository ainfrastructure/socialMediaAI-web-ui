<script setup lang="ts">
import { useI18n } from 'vue-i18n'

defineProps<{ visible: boolean }>()

const { t } = useI18n()

const messages = [
  { key: 'userPrompt', isAI: false },
  { key: 'aiResponse', isAI: true },
  { key: 'aiGenerated', isAI: true },
  { key: 'userReply', isAI: false },
  { key: 'aiConfirm', isAI: true },
]
</script>

<template>
  <div class="lp-ai-chat">
    <div class="lp-ai-header">
      <img src="@/assets/socialchef_logo.svg" alt="SocialChef" class="lp-ai-avatar" />
      <div>
        <span class="lp-ai-name">SocialChef</span>
        <span class="lp-ai-status">Online</span>
      </div>
    </div>

    <div class="lp-ai-messages">
      <div
        v-for="msg in messages"
        :key="msg.key"
        class="lp-ai-message"
        :class="{ 'lp-user-msg': !msg.isAI }"
      >
        <img v-if="msg.isAI" src="@/assets/socialchef_logo.svg" alt="" class="lp-ai-msg-avatar" />
        <div class="lp-ai-bubble" :class="{ 'lp-bubble-user': !msg.isAI }">
          {{ t(`appLanding.aiAssistant.${msg.key}`) }}
        </div>
      </div>

      <!-- Typing indicator -->
      <div v-if="visible" class="lp-ai-message">
        <img src="@/assets/socialchef_logo.svg" alt="" class="lp-ai-msg-avatar" />
        <div class="lp-ai-bubble">
          <div class="lp-typing-dots"><span /><span /><span /></div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.lp-ai-chat {
  background: var(--lp-bg-surface);
  border: 1px solid var(--lp-border);
  border-radius: var(--radius-xl);
  overflow: hidden;
}

.lp-ai-header {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-lg) var(--space-xl);
  border-bottom: 1px solid var(--lp-border);
}

.lp-ai-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--lp-gradient-aurora);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.lp-ai-name {
  font-weight: var(--font-semibold);
  color: var(--lp-text-primary);
  font-size: var(--text-sm);
  display: block;
}

.lp-ai-status {
  font-size: var(--text-xs);
  color: #22c55e;
}

.lp-ai-messages {
  padding: var(--space-xl);
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.lp-ai-message {
  display: flex;
  gap: var(--space-sm);
  align-items: flex-start;
}

.lp-ai-message.lp-user-msg {
  justify-content: flex-end;
}

.lp-ai-msg-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--lp-bg-elevated);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--lp-accent-orange);
  flex-shrink: 0;
}

.lp-ai-bubble {
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
