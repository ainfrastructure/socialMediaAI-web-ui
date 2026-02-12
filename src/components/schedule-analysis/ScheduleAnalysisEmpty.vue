<script setup lang="ts">
import { useRouter } from 'vue-router'
import MaterialIcon from '@/components/MaterialIcon.vue'

const router = useRouter()
</script>

<template>
  <div class="empty-state">
    <div class="empty-icon">
      <MaterialIcon icon="auto_awesome" size="xl" />
    </div>
    <h3 class="empty-title">No Published Posts to Analyze</h3>
    <p class="empty-description">
      The schedule optimizer needs published posts with engagement data from the last 90 days.
      Start publishing content and sync your social accounts to unlock data-driven scheduling
      recommendations.
    </p>
    <div class="empty-actions">
      <button class="primary-btn" @click="router.push('/posts/create')">
        <MaterialIcon icon="add" size="sm" />
        Create a Post
      </button>
      <button class="secondary-btn" @click="router.push('/connect-accounts')">
        <MaterialIcon icon="share" size="sm" />
        Connect Accounts
      </button>
    </div>
    <div class="empty-tips">
      <h4>Tips for better schedule analysis:</h4>
      <ul>
        <li>Publish at least 20 posts across different days and times</li>
        <li>Connect your social accounts so engagement data syncs automatically</li>
        <li>Post consistently for 2–3 weeks to build a reliable dataset</li>
        <li>Use multiple platforms to compare cross-platform performance</li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-xl);
  padding: var(--space-5xl) var(--space-2xl);
  text-align: center;
  background: var(--bg-secondary);
  border: 1px dashed var(--glass-border);
  border-radius: var(--radius-xl);
}

.empty-icon {
  width: 80px;
  height: 80px;
  border-radius: var(--radius-full);
  background: linear-gradient(135deg, rgba(15, 61, 46, 0.1), rgba(15, 61, 46, 0.04));
  color: var(--gold-primary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-title {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  color: var(--text-primary);
  margin: 0;
}

.empty-description {
  font-size: var(--text-base);
  color: var(--text-secondary);
  margin: 0;
  max-width: 540px;
  line-height: var(--leading-relaxed);
}

.empty-actions {
  display: flex;
  gap: var(--space-md);
}

.primary-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-md) var(--space-xl);
  background: var(--gradient-gold);
  color: var(--text-on-gold);
  border: none;
  border-radius: var(--radius-lg);
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  cursor: pointer;
  transition: var(--transition-base);
}

.primary-btn:hover {
  transform: translateY(-2px);
  box-shadow: var(--glow-gold-md);
}

.secondary-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-md) var(--space-xl);
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  font-size: var(--text-base);
  font-weight: var(--font-medium);
  cursor: pointer;
  transition: var(--transition-base);
}

.secondary-btn:hover {
  border-color: var(--border-hover);
  color: var(--text-primary);
}

.empty-tips {
  max-width: 480px;
  text-align: left;
  padding: var(--space-lg);
  background: var(--bg-tertiary);
  border-radius: var(--radius-lg);
  border: 1px solid var(--glass-border);
}

.empty-tips h4 {
  font-family: var(--font-heading);
  font-size: var(--text-sm);
  color: var(--text-primary);
  margin: 0 0 var(--space-sm);
}

.empty-tips ul {
  margin: 0;
  padding: 0 0 0 var(--space-xl);
}

.empty-tips li {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  line-height: var(--leading-relaxed);
}

@media (max-width: 768px) {
  .empty-state {
    padding: var(--space-2xl) var(--space-lg);
  }

  .empty-actions {
    flex-direction: column;
    width: 100%;
  }

  .primary-btn,
  .secondary-btn {
    justify-content: center;
  }
}

@media (prefers-reduced-motion: reduce) {
  .primary-btn:hover {
    transform: none;
  }
}
</style>
