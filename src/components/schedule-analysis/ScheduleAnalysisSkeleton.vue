<template>
  <div class="skeleton-container">
    <!-- Summary cards skeleton -->
    <div class="skeleton-grid">
      <div v-for="i in 6" :key="i" class="skeleton-card">
        <div class="skeleton-line skeleton-icon" />
        <div class="skeleton-line skeleton-value" />
        <div class="skeleton-line skeleton-label" />
      </div>
    </div>

    <!-- Heatmap skeleton -->
    <div class="skeleton-section">
      <div class="skeleton-line skeleton-title" />
      <div class="skeleton-heatmap">
        <div v-for="i in 42" :key="`hm-${i}`" class="skeleton-cell" />
      </div>
    </div>

    <!-- Schedule skeleton -->
    <div class="skeleton-section">
      <div class="skeleton-line skeleton-title" />
      <div v-for="i in 7" :key="`s-${i}`" class="skeleton-row">
        <div class="skeleton-line skeleton-day" />
        <div class="skeleton-line skeleton-time" />
        <div class="skeleton-line skeleton-rate" />
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.skeleton-line {
  background: linear-gradient(
    90deg,
    var(--bg-tertiary) 25%,
    var(--bg-elevated) 50%,
    var(--bg-tertiary) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: var(--radius-md);
}

.skeleton-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-2xl);
}

.skeleton-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--space-lg);
}

.skeleton-card {
  background: var(--bg-secondary);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
  padding: var(--space-xl);
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.skeleton-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-lg);
}

.skeleton-value {
  width: 80px;
  height: 32px;
}

.skeleton-label {
  width: 120px;
  height: 14px;
}

.skeleton-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.skeleton-title {
  width: 200px;
  height: 20px;
}

.skeleton-heatmap {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}

.skeleton-cell {
  aspect-ratio: 1;
  min-height: 32px;
  border-radius: var(--radius-sm);
  background: linear-gradient(
    90deg,
    var(--bg-tertiary) 25%,
    var(--bg-elevated) 50%,
    var(--bg-tertiary) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

.skeleton-row {
  display: flex;
  gap: var(--space-lg);
  align-items: center;
  padding: var(--space-md) var(--space-lg);
  background: var(--bg-secondary);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
}

.skeleton-day {
  width: 80px;
  height: 20px;
}

.skeleton-time {
  width: 60px;
  height: 28px;
  border-radius: var(--radius-full);
}

.skeleton-rate {
  width: 100px;
  height: 16px;
}

@media (prefers-reduced-motion: reduce) {
  .skeleton-line,
  .skeleton-cell {
    animation: none;
  }
}
</style>
