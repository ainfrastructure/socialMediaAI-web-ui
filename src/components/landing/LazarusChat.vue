<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import LazarusLogoNeural from '../icons/LazarusLogoNeural.vue'

const { t } = useI18n()
</script>

<template>
  <div class="lazarus-chat">
    <!-- App header bar -->
    <div class="chat-header">
      <div class="chat-header-left">
        <LazarusLogoNeural :size="22" />
        <span class="chat-header-title">Lazarus</span>
      </div>
      <span class="chat-header-status">{{ t('landing.lazarusChat.online') }}</span>
    </div>

    <!-- Chat messages -->
    <div class="chat-messages">
      <!-- Lazarus message -->
      <div class="chat-bubble lazarus">
        <div class="bubble-avatar">
          <LazarusLogoNeural :size="18" />
        </div>
        <div class="bubble-content">
          <p class="bubble-text">{{ t('landing.lazarusChat.suggestion') }}</p>
          <div class="bubble-preview">
            <div class="preview-placeholder">
              <span class="preview-icon">🖼</span>
            </div>
            <div class="preview-text">
              <span class="preview-caption">{{ t('landing.lazarusChat.caption') }}</span>
              <span class="preview-platforms">Facebook · Instagram · LinkedIn</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Time label -->
      <div class="chat-time">{{ t('landing.lazarusChat.scheduled') }}</div>

      <!-- User response -->
      <div class="chat-bubble user">
        <div class="bubble-content user-content">
          <p class="bubble-text">{{ t('landing.lazarusChat.userResponse') }}</p>
        </div>
      </div>

      <!-- Lazarus confirmation -->
      <div class="chat-bubble lazarus">
        <div class="bubble-avatar">
          <LazarusLogoNeural :size="18" />
        </div>
        <div class="bubble-content">
          <p class="bubble-text">{{ t('landing.lazarusChat.confirmation') }}</p>
        </div>
      </div>
    </div>

    <!-- Approve button -->
    <div class="chat-actions">
      <button class="approve-btn">
        <span>✓</span>
        {{ t('landing.lazarusChat.approve') }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.lazarus-chat {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg-secondary);
  padding-top: 28px;
}

.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-md) var(--space-md) var(--space-sm);
  border-bottom: 1px solid var(--glass-border);
  background: var(--bg-primary);
}

.chat-header-left {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

.chat-header-title {
  font-family: var(--font-heading);
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
}

.chat-header-status {
  font-size: 10px;
  color: var(--gold-primary);
  font-weight: var(--font-medium);
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-md) var(--space-sm);
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.chat-bubble {
  display: flex;
  gap: var(--space-xs);
  max-width: 92%;
}

.chat-bubble.lazarus {
  align-self: flex-start;
}

.chat-bubble.user {
  align-self: flex-end;
}

.bubble-avatar {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  border-radius: var(--radius-full);
  background: var(--bg-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--glass-border);
}

.bubble-content {
  background: var(--bg-primary);
  border-radius: var(--radius-lg);
  border-top-left-radius: var(--radius-sm);
  padding: var(--space-sm);
  border: 1px solid var(--glass-border);
}

.user-content {
  background: var(--gold-primary);
  border-color: var(--gold-primary);
  border-top-left-radius: var(--radius-lg);
  border-top-right-radius: var(--radius-sm);
}

.user-content .bubble-text {
  color: #ffffff;
}

.bubble-text {
  font-size: 11px;
  line-height: 1.4;
  color: var(--text-primary);
  margin: 0;
}

.bubble-preview {
  margin-top: var(--space-xs);
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  overflow: hidden;
  border: 1px solid var(--glass-border);
}

.preview-placeholder {
  height: 70px;
  background: linear-gradient(135deg, var(--bg-tertiary), var(--bg-elevated));
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-icon {
  font-size: 24px;
  opacity: 0.6;
}

.preview-text {
  padding: var(--space-xs);
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.preview-caption {
  font-size: 10px;
  color: var(--text-primary);
  font-weight: var(--font-medium);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.preview-platforms {
  font-size: 9px;
  color: var(--text-muted);
}

.chat-time {
  text-align: center;
  font-size: 9px;
  color: var(--text-muted);
  padding: var(--space-xs) 0;
}

.chat-actions {
  padding: var(--space-sm) var(--space-md);
  border-top: 1px solid var(--glass-border);
  background: var(--bg-primary);
}

.approve-btn {
  width: 100%;
  padding: var(--space-sm) var(--space-md);
  background: var(--gold-primary);
  color: #ffffff;
  border: none;
  border-radius: var(--radius-lg);
  font-family: var(--font-body);
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-xs);
  transition: var(--transition-base);
}

.approve-btn:hover {
  background: var(--gold-light);
}

@media (prefers-reduced-motion: reduce) {
  .approve-btn {
    transition: none;
  }
}
</style>
