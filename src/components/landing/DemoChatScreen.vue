<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import MaterialIcon from '@/components/MaterialIcon.vue'
import PlatformLogo from '@/components/PlatformLogo.vue'
import SocialChefMark from '@/components/SocialChefMark.vue'

const { t } = useI18n()
</script>

<template>
  <div class="demo-chat">
    <!-- App header — brand name -->
    <div class="dc-header">
      <img src="/example/vetted-logo.png" alt="" class="dc-brand-logo" loading="lazy" />
      <span class="dc-header-title">Vetted</span>
    </div>

    <!-- Messages clip wrapper (prevents content spilling over header) -->
    <div class="dc-messages-clip">
    <div class="dc-messages" data-demo-messages>
      <!-- Phase 0: AI greeting -->
      <div class="dc-msg dc-msg-ai" data-demo-ai-greeting>
        <SocialChefMark :size="20" class="dc-avatar" />
        <div class="dc-bubble dc-bubble-ai">
          <div class="dc-typing" data-demo-typing>
            <span /><span /><span />
          </div>
          <div class="dc-text" data-demo-ai-text>
            {{ t('appLanding.aiCreation.promptGreeting') }}
          </div>

          <!-- Suggestion card (image + caption) -->
          <div class="dc-suggestion" data-demo-suggestion>
            <div class="dc-suggestion-img">
              <img src="/example/vetted-wave-flow.png" alt="" loading="lazy" />
            </div>
            <div class="dc-suggestion-body">
              <p class="dc-suggestion-caption">{{ t('appLanding.aiCreation.promptSuggestionCaption') }}</p>
              <span class="dc-suggestion-tone" data-demo-tone>{{ t('appLanding.aiCreation.promptToneBadge') }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- User reply before strategy -->
      <div class="dc-msg dc-msg-user" data-demo-user-reply-1>
        <div class="dc-bubble dc-bubble-user">
          {{ t('appLanding.cinematic.chatUserReply1') }}
        </div>
      </div>

      <!-- Phase 1: AI strategy response with calendar card + platform logos -->
      <div class="dc-msg dc-msg-ai" data-demo-strategy>
        <SocialChefMark :size="20" class="dc-avatar" />
        <div class="dc-bubble dc-bubble-ai">
          <div class="dc-text" data-demo-strategy-text>
            {{ t('appLanding.cinematic.chatAiStrategy') }}
          </div>
          <div class="dc-calendar-card" data-demo-calendar>
            <div class="dc-cal-header">
              <MaterialIcon icon="calendar_month" size="xs" />
              <span>{{ t('appLanding.cinematic.chatCalendarTitle') }}</span>
            </div>
            <div class="dc-plan-list">
              <div class="dc-plan-item">
                <div class="dc-plan-dot dc-dot-blue" />
                <div class="dc-plan-details">
                  <span class="dc-plan-day">{{ t('appLanding.cinematic.planMonDay') }}</span>
                  <span class="dc-plan-desc">{{ t('appLanding.cinematic.planMonDesc') }}</span>
                </div>
                <span class="dc-plan-platform">
                  <PlatformLogo platform="linkedin" :size="12" />
                </span>
              </div>
              <div class="dc-plan-item">
                <div class="dc-plan-dot dc-dot-violet" />
                <div class="dc-plan-details">
                  <span class="dc-plan-day">{{ t('appLanding.cinematic.planWedDay') }}</span>
                  <span class="dc-plan-desc">{{ t('appLanding.cinematic.planWedDesc') }}</span>
                </div>
                <span class="dc-plan-platform">
                  <PlatformLogo platform="instagram" :size="12" />
                </span>
              </div>
              <div class="dc-plan-item">
                <div class="dc-plan-dot dc-dot-dark" />
                <div class="dc-plan-details">
                  <span class="dc-plan-day">{{ t('appLanding.cinematic.planFriDay') }}</span>
                  <span class="dc-plan-desc">{{ t('appLanding.cinematic.planFriDesc') }}</span>
                </div>
                <span class="dc-plan-platform">
                  <PlatformLogo platform="twitter" :size="12" />
                </span>
              </div>
            </div>
            <span class="dc-cal-count">{{ t('appLanding.cinematic.chatCalendarCount') }}</span>
          </div>
        </div>
      </div>

      <!-- User reply before publish -->
      <div class="dc-msg dc-msg-user" data-demo-user-reply-2>
        <div class="dc-bubble dc-bubble-user">
          {{ t('appLanding.cinematic.chatUserReply2') }}
        </div>
      </div>

      <!-- Post Preview Card (inline publish) -->
      <div class="dc-msg dc-msg-ai" data-demo-publish-card>
        <SocialChefMark :size="20" class="dc-avatar" />
        <div class="dc-bubble dc-bubble-ai">
          <div class="dc-text dc-text-visible" data-demo-publish-intro>
            {{ t('appLanding.cinematic.publishCardIntro') }}
          </div>
          <div class="dc-suggestion" data-demo-publish-preview>
            <div class="dc-suggestion-img">
              <img src="/example/vetted-wave-flow.png" alt="" loading="lazy" />
            </div>
            <div class="dc-suggestion-body">
              <p class="dc-suggestion-caption">{{ t('appLanding.aiCreation.postCaption') }}</p>
              <p class="dc-suggestion-caption dc-caption-more">{{ t('appLanding.aiCreation.postCaptionMore') }}</p>
              <div class="dc-publish-tags">
                <span class="dc-pub-tag">#Credibility</span>
                <span class="dc-pub-tag">#Vetted</span>
                <span class="dc-pub-tag">#Insights</span>
              </div>
            </div>
          </div>
          <div class="dc-publish-actions" data-demo-publish-actions>
            <button class="dc-pub-btn dc-pub-btn-primary" data-demo-publish-now>
              {{ t('appLanding.aiCreation.postPublishNow') }}
            </button>
            <button class="dc-pub-btn dc-pub-btn-outline">
              {{ t('appLanding.aiCreation.postSchedule') }}
            </button>
            <button class="dc-pub-btn dc-pub-btn-outline">
              {{ t('appLanding.aiCreation.postEdit') }}
            </button>
          </div>
        </div>
      </div>

      <!-- Published Confirmation -->
      <div class="dc-msg dc-msg-ai" data-demo-published-confirm>
        <SocialChefMark :size="20" class="dc-avatar" />
        <div class="dc-bubble dc-bubble-ai">
          <div class="dc-published-badge" data-demo-published-badge>
            <MaterialIcon icon="check_circle" size="xs" />
            <span>{{ t('appLanding.cinematic.publishedBadge') }}</span>
          </div>
          <div class="dc-published-time" data-demo-published-time>
            <span class="dc-pub-date">{{ t('appLanding.cinematic.publishedDate') }}</span>
            <span class="dc-pub-ago">{{ t('appLanding.cinematic.publishedAgo') }}</span>
          </div>
          <div class="dc-published-platform" data-demo-published-platform>
            <PlatformLogo platform="facebook" :size="14" />
            <span class="dc-pub-account">{{ t('appLanding.cinematic.publishedAccount') }}</span>
            <span class="dc-pub-feed-link">{{ t('appLanding.cinematic.publishedFeedLink') }}</span>
          </div>
          <div class="dc-published-feedback" data-demo-published-feedback>
            <button class="dc-feedback-btn">
              <MaterialIcon icon="thumb_up" size="xs" />
              <span>{{ t('appLanding.cinematic.publishedMoreLikeThis') }}</span>
            </button>
            <button class="dc-feedback-btn">
              <MaterialIcon icon="thumb_down" size="xs" />
              <span>{{ t('appLanding.cinematic.publishedLessLikeThis') }}</span>
            </button>
          </div>
        </div>
      </div>

    </div>
    </div>

    <!-- Attach menu popup (above input bar) -->
    <div class="dc-attach-menu" data-demo-attach-menu>
      <div class="dc-attach-option" data-demo-attach-photo>
        <MaterialIcon icon="photo_camera" size="xs" />
        <span>{{ t('appLanding.cinematic.attachTakePhoto') }}</span>
      </div>
      <div class="dc-attach-option" data-demo-attach-assets>
        <MaterialIcon icon="image" size="xs" />
        <span>{{ t('appLanding.cinematic.attachChooseAssets') }}</span>
      </div>
      <div class="dc-attach-option dc-attach-highlight" data-demo-attach-studio>
        <MaterialIcon icon="brush" size="xs" />
        <span>{{ t('appLanding.cinematic.attachDesignStudio') }}</span>
      </div>
    </div>

    <!-- Input bar -->
    <div class="dc-input-bar" data-demo-input-bar>
      <div class="dc-clip" data-demo-clip>
        <MaterialIcon icon="attach_file" size="xs" />
      </div>
      <div class="dc-input-field">
        <span class="dc-input-placeholder">{{ t('appLanding.cinematic.chatInputPlaceholder') }}</span>
      </div>
      <div class="dc-send" data-demo-send>
        <MaterialIcon icon="send" size="xs" />
      </div>
    </div>

  </div>
</template>

<style scoped>
.demo-chat {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--lp-bg-primary, #09090B);
  position: relative;
}

/* Header */
.dc-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  border-bottom: 1px solid var(--lp-border, rgba(255, 255, 255, 0.08));
  background: var(--lp-bg-surface, rgba(255, 255, 255, 0.03));
  flex-shrink: 0;
  position: relative;
  z-index: 2;
}

.dc-brand-logo {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.dc-header-title {
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  color: var(--lp-text-primary);
}

/* Messages clip wrapper — prevents translated messages from overlapping header */
.dc-messages-clip {
  flex: 1;
  overflow: hidden;
  position: relative;
  min-height: 0;
}

/* Messages */
.dc-messages {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  padding: var(--space-md);
  position: relative;
}

.dc-msg {
  display: flex;
  gap: var(--space-xs);
  opacity: 0;
  flex-shrink: 0;
}

.dc-msg-user {
  justify-content: flex-end;
}

.dc-avatar {
  width: 20px;
  height: 25px;
  flex-shrink: 0;
}

.dc-bubble {
  max-width: 85%;
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-lg);
  font-size: 10px;
  line-height: 1.5;
}

.dc-bubble-ai {
  background: var(--lp-bg-surface, rgba(255, 255, 255, 0.06));
  color: var(--lp-text-primary);
  border-bottom-left-radius: var(--radius-sm);
}

.dc-bubble-user {
  background: var(--lp-accent-orange);
  color: #fff;
  border-bottom-right-radius: var(--radius-sm);
  font-size: 9px;
}

/* Typing dots */
.dc-typing {
  display: flex;
  gap: 3px;
  align-items: center;
  padding: 2px 0;
}

.dc-typing span {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--lp-text-muted);
  animation: dc-bounce 1.4s ease-in-out infinite;
}

.dc-typing span:nth-child(2) { animation-delay: 0.15s; }
.dc-typing span:nth-child(3) { animation-delay: 0.3s; }

@keyframes dc-bounce {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
  30% { transform: translateY(-3px); opacity: 1; }
}

.dc-text {
  opacity: 0;
  max-height: 0;
  overflow: hidden;
}

/* Suggestion card */
.dc-suggestion {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--lp-border, rgba(255, 255, 255, 0.08));
  border-radius: var(--radius-md);
  overflow: hidden;
  margin-top: var(--space-xs);
  opacity: 0;
}

.dc-suggestion-img {
  width: 100%;
  height: 80px;
  overflow: hidden;
}

.dc-suggestion-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.dc-suggestion-body {
  padding: var(--space-xs) var(--space-sm);
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.dc-suggestion-caption {
  font-size: 8px;
  color: var(--lp-text-primary);
  line-height: 1.4;
  margin: 0;
}

.dc-suggestion-tone {
  display: inline-block;
  font-size: 7px;
  font-weight: var(--font-semibold);
  padding: 1px 6px;
  border-radius: var(--radius-full);
  background: color-mix(in srgb, var(--lp-accent-violet) 15%, transparent);
  color: var(--lp-accent-violet);
  align-self: flex-start;
  opacity: 0;
}

/* Calendar card — inside AI bubble */
.dc-calendar-card {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--lp-border, rgba(255, 255, 255, 0.08));
  border-radius: var(--radius-md);
  padding: var(--space-sm) var(--space-md);
  margin-top: var(--space-xs);
  opacity: 0;
}

.dc-cal-header {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  font-size: 9px;
  font-weight: var(--font-semibold);
  color: var(--lp-text-primary);
  margin-bottom: var(--space-xs);
}

.dc-plan-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.dc-plan-item {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: 3px 0;
  opacity: 0;
}

.dc-plan-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.dc-dot-blue { background: #0A66C2; }
.dc-dot-violet { background: var(--lp-accent-violet); }
.dc-dot-dark { background: #71767b; }

.dc-plan-details {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.dc-plan-day {
  font-size: 7px;
  font-weight: var(--font-bold);
  color: var(--lp-text-primary);
  text-transform: uppercase;
}

.dc-plan-desc {
  font-size: 7px;
  color: var(--lp-text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dc-plan-platform {
  flex-shrink: 0;
  display: flex;
  align-items: center;
}

.dc-cal-count {
  font-size: 7px;
  color: var(--lp-accent-orange);
  display: block;
  margin-top: 4px;
  font-weight: var(--font-semibold);
}

/* Input bar */
.dc-input-bar {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-sm) var(--space-md);
  border-top: 1px solid var(--lp-border, rgba(255, 255, 255, 0.08));
  background: var(--lp-bg-surface, rgba(255, 255, 255, 0.03));
  flex-shrink: 0;
}

.dc-clip {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--lp-text-muted);
  flex-shrink: 0;
}

.dc-input-field {
  flex: 1;
  background: var(--lp-bg-primary, rgba(0, 0, 0, 0.2));
  border: 1px solid var(--lp-border, rgba(255, 255, 255, 0.06));
  border-radius: var(--radius-md);
  padding: 5px var(--space-sm);
  min-height: 24px;
  display: flex;
  align-items: center;
}

.dc-input-placeholder {
  font-size: 9px;
  color: var(--lp-text-muted);
}

.dc-send {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--lp-accent-orange);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  opacity: 0.5;
}

/* Attach menu popup */
.dc-attach-menu {
  position: absolute;
  bottom: 44px;
  left: var(--space-md);
  background: var(--lp-bg-surface, rgba(30, 30, 35, 0.95));
  border: 1px solid var(--lp-border, rgba(255, 255, 255, 0.1));
  border-radius: var(--radius-md);
  padding: var(--space-xs) 0;
  min-width: 140px;
  z-index: 5;
  opacity: 0;
  transform: translateY(8px);
  pointer-events: none;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.dc-attach-option {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: 5px var(--space-md);
  font-size: 9px;
  color: var(--lp-text-secondary);
  cursor: pointer;
}

.dc-attach-highlight {
  color: var(--lp-accent-orange);
}

/* Inline publish — text visible override */
.dc-text-visible {
  opacity: 1;
  max-height: none;
  overflow: visible;
}

/* Caption secondary line */
.dc-caption-more {
  color: var(--lp-text-secondary);
  font-size: 7px;
  margin-top: 1px;
}

/* Publish inline tags */
.dc-publish-tags {
  display: flex;
  gap: 3px;
  margin-top: 4px;
}

.dc-pub-tag {
  font-size: 7px;
  padding: 1px 5px;
  border-radius: var(--radius-full);
  background: color-mix(in srgb, var(--lp-accent-violet) 15%, transparent);
  color: var(--lp-accent-violet);
  font-weight: var(--font-medium);
}

/* Publish action buttons */
.dc-publish-actions {
  display: flex;
  gap: 4px;
  margin-top: var(--space-xs);
  opacity: 0;
}

.dc-pub-btn {
  flex: 1;
  border: none;
  font-family: var(--font-body);
  font-size: 8px;
  font-weight: var(--font-semibold);
  padding: 5px 2px;
  border-radius: var(--radius-md);
  cursor: pointer;
}

.dc-pub-btn-primary {
  background: var(--lp-accent-orange);
  color: #fff;
}

.dc-pub-btn-outline {
  background: transparent;
  border: 1px solid var(--lp-border-light, rgba(255, 255, 255, 0.15));
  color: var(--lp-text-secondary);
}

/* Published confirmation card */
.dc-published-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #22c55e;
  font-size: 10px;
  font-weight: var(--font-bold);
  opacity: 0;
  transform: scale(0.7);
}

.dc-published-badge .material-icon {
  font-size: 14px;
}

.dc-published-time {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  margin-top: 4px;
  opacity: 0;
}

.dc-pub-date {
  font-size: 8px;
  color: var(--lp-text-secondary);
}

.dc-pub-ago {
  font-size: 7px;
  color: var(--lp-text-muted);
  padding: 1px 5px;
  border-radius: var(--radius-full);
  background: rgba(255, 255, 255, 0.06);
}

.dc-published-platform {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  margin-top: 6px;
  opacity: 0;
}

.dc-pub-account {
  font-size: 8px;
  font-weight: var(--font-semibold);
  color: var(--lp-text-primary);
}

.dc-pub-feed-link {
  font-size: 7px;
  color: var(--lp-accent-orange);
  font-weight: var(--font-medium);
  margin-left: auto;
}

.dc-published-feedback {
  display: flex;
  gap: 6px;
  margin-top: 6px;
  opacity: 0;
}

.dc-feedback-btn {
  display: flex;
  align-items: center;
  gap: 3px;
  font-family: var(--font-body);
  font-size: 7px;
  font-weight: var(--font-medium);
  color: var(--lp-text-muted);
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--lp-border, rgba(255, 255, 255, 0.08));
  border-radius: var(--radius-full);
  padding: 3px 8px;
  cursor: pointer;
}

.dc-feedback-btn .material-icon {
  font-size: 10px;
}

@media (prefers-reduced-motion: reduce) {
  .dc-typing span { animation: none; opacity: 0.6; }
}
</style>
