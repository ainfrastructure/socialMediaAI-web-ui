<script setup lang="ts">
</script>

<template>
  <div class="skeleton-page">
    <!-- Hero banner skeleton -->
    <div class="skeleton-hero">
      <div class="hero-left">
        <div class="skeleton-circle lg" />
        <div class="hero-text">
          <div class="skeleton-bar w200 h28" />
          <div class="skeleton-bar w300 h14" />
        </div>
      </div>
      <div class="skeleton-bar w160 h40 rounded-full" />
    </div>

    <!-- Controls bar skeleton -->
    <div class="skeleton-controls">
      <div class="skeleton-bar w280 h40 rounded-lg" />
      <div class="skeleton-bar w140 h36 rounded-md" />
    </div>

    <!-- KPI Grid skeleton -->
    <div class="skeleton-kpi-grid">
      <div v-for="i in 8" :key="i" class="skeleton-kpi">
        <div class="kpi-top-skel">
          <div class="skeleton-circle sm" />
          <div class="skeleton-bar w60 h20 rounded-full" />
        </div>
        <div class="skeleton-bar w100 h36" />
        <div class="skeleton-bar w80 h12" />
        <div class="skeleton-bar full h32 mt-auto" />
      </div>
    </div>

    <!-- Top posts skeleton -->
    <div class="skeleton-section-header">
      <div class="skel-title-group">
        <div class="skeleton-circle md" />
        <div>
          <div class="skeleton-bar w180 h22" />
          <div class="skeleton-bar w240 h12" />
        </div>
      </div>
      <div class="skeleton-bar w200 h36 rounded-full" />
    </div>
    <div class="skeleton-top-posts">
      <div v-for="i in 3" :key="i" class="skeleton-top-post">
        <div class="skeleton-bar skel-img" />
        <div class="skel-post-content">
          <div class="skeleton-bar full h14" />
          <div class="skeleton-bar w120 h12" />
          <div class="skel-stats">
            <div class="skeleton-bar w60 h20" />
            <div class="skeleton-bar w60 h20" />
            <div class="skeleton-bar w80 h24 rounded-full" />
          </div>
        </div>
      </div>
    </div>

    <!-- Charts skeleton -->
    <div class="skeleton-charts-row">
      <div class="skeleton-chart large">
        <div class="skel-chart-header">
          <div class="skeleton-circle sm" />
          <div>
            <div class="skeleton-bar w140 h18" />
            <div class="skeleton-bar w200 h12" />
          </div>
        </div>
        <div class="skeleton-bar full h240 rounded-lg" />
      </div>
      <div class="skeleton-chart small">
        <div class="skel-chart-header">
          <div class="skeleton-circle sm" />
          <div>
            <div class="skeleton-bar w120 h18" />
            <div class="skeleton-bar w160 h12" />
          </div>
        </div>
        <div class="skeleton-bar full h240 rounded-lg" />
      </div>
    </div>

    <!-- Recent activity skeleton -->
    <div class="skeleton-section-header">
      <div class="skel-title-group">
        <div class="skeleton-circle md" />
        <div>
          <div class="skeleton-bar w160 h22" />
          <div class="skeleton-bar w200 h12" />
        </div>
      </div>
      <div class="skel-pills">
        <div v-for="i in 4" :key="i" class="skeleton-bar w70 h28 rounded-full" />
      </div>
    </div>
    <div class="skeleton-cards-grid">
      <div v-for="i in 6" :key="i" class="skeleton-post-card">
        <div class="skeleton-bar full h160" />
        <div class="skel-card-body">
          <div class="skeleton-bar full h14" />
          <div class="skeleton-bar w140 h12" />
          <div class="skeleton-bar full h48 rounded-md" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.skeleton-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-2xl);
}

/* Shimmer animation */
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

/* Base shimmer classes */
.skeleton-bar,
.skeleton-circle {
  background: linear-gradient(
    90deg,
    var(--bg-tertiary) 25%,
    var(--bg-elevated) 50%,
    var(--bg-tertiary) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
  border-radius: var(--radius-sm);
}

.skeleton-circle {
  border-radius: var(--radius-full);
  flex-shrink: 0;
}

.skeleton-circle.sm { width: 36px; height: 36px; }
.skeleton-circle.md { width: 44px; height: 44px; }
.skeleton-circle.lg { width: 56px; height: 56px; }

/* Width helpers */
.w60 { width: 60px; }
.w70 { width: 70px; }
.w80 { width: 80px; }
.w100 { width: 100px; }
.w120 { width: 120px; }
.w140 { width: 140px; }
.w160 { width: 160px; }
.w180 { width: 180px; }
.w200 { width: 200px; }
.w240 { width: 240px; }
.w280 { width: 280px; }
.w300 { width: 300px; }
.full { width: 100%; }

/* Height helpers */
.h12 { height: 12px; }
.h14 { height: 14px; }
.h18 { height: 18px; }
.h20 { height: 20px; }
.h22 { height: 22px; }
.h24 { height: 24px; }
.h28 { height: 28px; }
.h32 { height: 32px; }
.h36 { height: 36px; }
.h40 { height: 40px; }
.h48 { height: 48px; }
.h160 { height: 160px; }
.h240 { height: 240px; }

/* Radius helpers */
.rounded-full { border-radius: var(--radius-full); }
.rounded-lg { border-radius: var(--radius-lg); }
.rounded-md { border-radius: var(--radius-md); }

.mt-auto { margin-top: auto; }

/* Hero skeleton */
.skeleton-hero {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-2xl) var(--space-xl);
  background: var(--bg-secondary);
  border-radius: var(--radius-xl);
}

.hero-left {
  display: flex;
  align-items: center;
  gap: var(--space-lg);
}

.hero-text {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

/* Controls */
.skeleton-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* KPI Grid */
.skeleton-kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-lg);
}

.skeleton-kpi {
  background: var(--bg-secondary);
  border-radius: var(--radius-xl);
  padding: var(--space-xl) var(--space-lg) var(--space-md);
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  min-height: 160px;
}

.kpi-top-skel {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* Section header */
.skeleton-section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-md);
}

.skel-title-group {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.skel-title-group > div {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.skel-pills {
  display: flex;
  gap: var(--space-xs);
}

/* Top posts */
.skeleton-top-posts {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.skeleton-top-post {
  display: flex;
  background: var(--bg-secondary);
  border-radius: var(--radius-xl);
  overflow: hidden;
  min-height: 120px;
}

.skel-img {
  width: 140px;
  height: 120px;
  border-radius: 0;
  flex-shrink: 0;
}

.skel-post-content {
  flex: 1;
  padding: var(--space-md) var(--space-lg);
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.skel-stats {
  display: flex;
  gap: var(--space-md);
  margin-top: auto;
}

/* Charts */
.skeleton-charts-row {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: var(--space-lg);
}

.skeleton-chart {
  background: var(--bg-secondary);
  border-radius: var(--radius-xl);
  padding: var(--space-xl);
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
}

.skel-chart-header {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.skel-chart-header > div {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

/* Post cards grid */
.skeleton-cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: var(--space-lg);
}

.skeleton-post-card {
  background: var(--bg-secondary);
  border-radius: var(--radius-xl);
  overflow: hidden;
}

.skeleton-post-card .h160 {
  border-radius: 0;
}

.skel-card-body {
  padding: var(--space-lg);
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

/* Responsive */
@media (max-width: 1200px) {
  .skeleton-kpi-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .skeleton-charts-row {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .skeleton-hero {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-lg);
  }

  .skeleton-controls {
    flex-direction: column;
    gap: var(--space-md);
  }

  .skeleton-section-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .skeleton-cards-grid {
    grid-template-columns: 1fr;
  }

  .skeleton-top-post {
    flex-direction: column;
  }

  .skel-img {
    width: 100%;
    height: 140px;
  }
}

@media (max-width: 480px) {
  .skeleton-kpi-grid {
    grid-template-columns: 1fr;
  }
}

@media (prefers-reduced-motion: reduce) {
  .skeleton-bar,
  .skeleton-circle {
    animation: none;
  }
}
</style>
