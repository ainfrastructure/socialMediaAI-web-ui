<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import BaseCard from './BaseCard.vue'
import BaseButton from './BaseButton.vue'
import MaterialIcon from './MaterialIcon.vue'

interface Props {
  code: string
  referralLink: string
  isActive?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isActive: true,
})

const { t } = useI18n()

const codeCopied = ref(false)
const linkCopied = ref(false)

// Copy code to clipboard
async function copyCode() {
  try {
    await navigator.clipboard.writeText(props.code)
    codeCopied.value = true
    setTimeout(() => {
      codeCopied.value = false
    }, 2000)
  } catch (err) {
    console.error('Failed to copy code:', err)
  }
}

// Copy link to clipboard
async function copyLink() {
  try {
    await navigator.clipboard.writeText(props.referralLink)
    linkCopied.value = true
    setTimeout(() => {
      linkCopied.value = false
    }, 2000)
  } catch (err) {
    console.error('Failed to copy link:', err)
  }
}

// Share via native share API or fallback
async function shareLink() {
  if (navigator.share) {
    try {
      await navigator.share({
        title: t('referral.shareTitle'),
        text: t('referral.shareText'),
        url: props.referralLink,
      })
    } catch (err) {
      // User cancelled or error
      console.log('Share cancelled or failed:', err)
    }
  } else {
    // Fallback to copy link
    copyLink()
  }
}

// Social share URLs
const twitterShareUrl = computed(() => {
  const text = encodeURIComponent(t('referral.shareText'))
  const url = encodeURIComponent(props.referralLink)
  return `https://twitter.com/intent/tweet?text=${text}&url=${url}`
})

const whatsappShareUrl = computed(() => {
  const text = encodeURIComponent(`${t('referral.shareText')} ${props.referralLink}`)
  return `https://wa.me/?text=${text}`
})

const emailShareUrl = computed(() => {
  const subject = encodeURIComponent(t('referral.shareEmailSubject'))
  const body = encodeURIComponent(`${t('referral.shareText')}\n\n${props.referralLink}`)
  return `mailto:?subject=${subject}&body=${body}`
})
</script>

<template>
  <BaseCard variant="glass" class="referral-code-card">
    <div class="card-header">
      <MaterialIcon icon="card_giftcard" size="md" color="var(--gold-primary)" />
      <h3>{{ $t('referral.yourCode') }}</h3>
    </div>

    <!-- Code Display -->
    <div class="code-section">
      <div class="code-display">
        <span class="code-text">{{ code }}</span>
        <button class="copy-btn" @click="copyCode" :title="$t('referral.copyCode')">
          <MaterialIcon :icon="codeCopied ? 'check' : 'content_copy'" size="sm" />
        </button>
      </div>
      <p v-if="codeCopied" class="copied-feedback">{{ $t('referral.codeCopied') }}</p>
    </div>

    <!-- Link Section -->
    <div class="link-section">
      <label class="link-label">{{ $t('referral.shareLink') }}</label>
      <div class="link-display">
        <input
          type="text"
          :value="referralLink"
          readonly
          class="link-input"
          @click="($event.target as HTMLInputElement)?.select()"
        />
        <button class="copy-btn" @click="copyLink" :title="$t('referral.copyLink')">
          <MaterialIcon :icon="linkCopied ? 'check' : 'content_copy'" size="sm" />
        </button>
      </div>
      <p v-if="linkCopied" class="copied-feedback">{{ $t('referral.linkCopied') }}</p>
    </div>

    <!-- Share Buttons -->
    <div class="share-section">
      <label class="share-label">{{ $t('referral.shareVia') }}</label>
      <div class="share-buttons">
        <BaseButton variant="secondary" size="small" @click="shareLink" class="share-btn">
          <MaterialIcon icon="share" size="sm" />
          {{ $t('referral.share') }}
        </BaseButton>
        <a :href="twitterShareUrl" target="_blank" rel="noopener" class="social-btn twitter">
          <MaterialIcon icon="tag" size="sm" />
        </a>
        <a :href="whatsappShareUrl" target="_blank" rel="noopener" class="social-btn whatsapp">
          <MaterialIcon icon="chat" size="sm" />
        </a>
        <a :href="emailShareUrl" class="social-btn email">
          <MaterialIcon icon="email" size="sm" />
        </a>
      </div>
    </div>

    <!-- Inactive Badge -->
    <div v-if="!isActive" class="inactive-badge">
      <MaterialIcon icon="warning" size="sm" />
      <span>{{ $t('referral.codeInactive') }}</span>
    </div>
  </BaseCard>
</template>

<style scoped>
.referral-code-card {
  padding: var(--space-xl);
}

.card-header {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  margin-bottom: var(--space-xl);
}

.card-header h3 {
  font-family: var(--font-heading);
  font-size: var(--text-lg);
  color: var(--text-primary);
  margin: 0;
}

/* Code Section */
.code-section {
  margin-bottom: var(--space-xl);
}

.code-display {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
  padding: var(--space-md) var(--space-lg);
}

.code-text {
  font-family: monospace;
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
  color: var(--gold-primary);
  letter-spacing: 0.15em;
  text-transform: uppercase;
  flex: 1;
}

/* Link Section */
.link-section {
  margin-bottom: var(--space-xl);
}

.link-label,
.share-label {
  display: block;
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin-bottom: var(--space-sm);
}

.link-display {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.link-input {
  flex: 1;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: var(--space-sm) var(--space-md);
  font-size: var(--text-sm);
  color: var(--text-primary);
  cursor: text;
}

.link-input:focus {
  outline: none;
  border-color: var(--gold-primary);
}

/* Copy Button */
.copy-btn {
  background: var(--gold-subtle);
  border: none;
  border-radius: var(--radius-md);
  padding: var(--space-sm);
  cursor: pointer;
  color: var(--gold-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: var(--transition-fast);
}

.copy-btn:hover {
  background: var(--gold-primary);
  color: var(--text-on-gold);
}

.copied-feedback {
  font-size: var(--text-xs);
  color: var(--success-text);
  margin-top: var(--space-xs);
}

/* Share Section */
.share-section {
  margin-bottom: var(--space-md);
}

.share-buttons {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  flex-wrap: wrap;
}

.share-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
}

.social-btn {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  transition: var(--transition-fast);
}

.social-btn.twitter {
  background: #1da1f2;
  color: white;
}

.social-btn.twitter:hover {
  background: #1a8cd8;
}

.social-btn.whatsapp {
  background: #25d366;
  color: white;
}

.social-btn.whatsapp:hover {
  background: #20bd5a;
}

.social-btn.email {
  background: var(--gold-primary);
  color: var(--text-on-gold);
}

.social-btn.email:hover {
  background: var(--gold-dark);
}

/* Inactive Badge */
.inactive-badge {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  background: var(--warning-bg);
  color: var(--warning-text);
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  margin-top: var(--space-md);
}

/* Responsive */
@media (max-width: 480px) {
  .code-text {
    font-size: var(--text-xl);
  }

  .share-buttons {
    flex-direction: column;
    align-items: stretch;
  }

  .share-btn {
    width: 100%;
    justify-content: center;
  }

  .social-btn {
    width: 100%;
    padding: var(--space-sm);
  }
}
</style>
