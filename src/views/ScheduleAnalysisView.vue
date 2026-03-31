<script setup lang="ts">
import { onMounted, watch } from 'vue'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import DashboardLayout from '@/components/DashboardLayout.vue'
import MaterialIcon from '@/components/MaterialIcon.vue'
import ScheduleAnalysisHeader from '@/components/schedule-analysis/ScheduleAnalysisHeader.vue'
import ScheduleAnalysisSummary from '@/components/schedule-analysis/ScheduleAnalysisSummary.vue'
import ScheduleAnalysisHeatmap from '@/components/schedule-analysis/ScheduleAnalysisHeatmap.vue'
import ScheduleAnalysisWeekly from '@/components/schedule-analysis/ScheduleAnalysisWeekly.vue'
import ScheduleAnalysisBreakdown from '@/components/schedule-analysis/ScheduleAnalysisBreakdown.vue'
import ScheduleAnalysisEmpty from '@/components/schedule-analysis/ScheduleAnalysisEmpty.vue'
import ScheduleAnalysisSkeleton from '@/components/schedule-analysis/ScheduleAnalysisSkeleton.vue'
import { useScheduleAnalysis } from '@/composables/useScheduleAnalysis'

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Title, Tooltip, Legend, Filler
)

const analysis = useScheduleAnalysis()

watch(() => analysis.selectedBrandId.value, () => {
  analysis.fetchAndAnalyze()
})

onMounted(async () => {
  await analysis.fetchAndAnalyze()
})
</script>

<template>
  <DashboardLayout>
    <div class="schedule-analysis-view">
      <!-- Header -->
      <ScheduleAnalysisHeader
        :selected-brand-id="analysis.selectedBrandId.value"
        :brands="analysis.brandsStore.brands"
        :selected-brand="analysis.selectedBrand.value"
        :loading="analysis.loading.value"
        @update:selected-brand-id="analysis.selectedBrandId.value = $event"
        @refresh="analysis.fetchAndAnalyze"
      />

      <!-- Skeleton Loading -->
      <ScheduleAnalysisSkeleton v-if="analysis.loading.value" />

      <!-- Error State -->
      <div v-else-if="analysis.error.value" class="error-state">
        <div class="error-icon">
          <MaterialIcon icon="error_outline" size="lg" />
        </div>
        <h3>Analysis Error</h3>
        <p>{{ analysis.error.value }}</p>
        <button class="retry-btn" @click="analysis.fetchAndAnalyze">
          <MaterialIcon icon="refresh" size="sm" />
          Retry Analysis
        </button>
      </div>

      <!-- Empty State -->
      <ScheduleAnalysisEmpty
        v-else-if="analysis.postsWithEngagement.value.length === 0"
      />

      <!-- Analysis Results -->
      <template v-else>
        <!-- Warnings -->
        <div
          v-for="(warning, index) in analysis.weeklySchedule.value.warnings"
          :key="index"
          class="analysis-warning"
        >
          <MaterialIcon icon="info" size="sm" />
          <span>{{ warning }}</span>
        </div>

        <!-- Summary KPIs -->
        <ScheduleAnalysisSummary :summary="analysis.summary.value" />

        <!-- Section: Heatmap -->
        <div class="section-divider" />
        <div class="section-label">
          <div class="section-label-icon">
            <MaterialIcon icon="grid_on" size="sm" />
          </div>
          <div>
            <h3 class="section-label-title">Engagement Heatmap</h3>
            <p class="section-label-subtitle">
              Performance by day of week and hour — darker cells indicate higher engagement
            </p>
          </div>
        </div>
        <ScheduleAnalysisHeatmap :data="analysis.heatmapData.value" />

        <!-- Section: Weekly Schedule -->
        <div class="section-divider" />
        <div class="section-label">
          <div class="section-label-icon">
            <MaterialIcon icon="event_note" size="sm" />
          </div>
          <div>
            <h3 class="section-label-title">Recommended Weekly Schedule</h3>
            <p class="section-label-subtitle">
              Optimal posting times based on {{ analysis.weeklySchedule.value.totalPostsAnalyzed }} posts
              · Data quality: {{ analysis.weeklySchedule.value.dataQualityScore }}/100
            </p>
          </div>
        </div>
        <ScheduleAnalysisWeekly :schedule="analysis.weeklySchedule.value" />

        <!-- Section: Detailed Breakdown -->
        <div class="section-divider" />
        <div class="section-label">
          <div class="section-label-icon">
            <MaterialIcon icon="bar_chart" size="sm" />
          </div>
          <div>
            <h3 class="section-label-title">Detailed Breakdown</h3>
            <p class="section-label-subtitle">
              Performance correlations by day, hour, platform, and content length
            </p>
          </div>
        </div>
        <ScheduleAnalysisBreakdown
          :day-performance="analysis.dayPerformance.value"
          :hour-performance="analysis.hourPerformance.value"
          :content-type-performance="analysis.contentTypePerformance.value"
          :content-length-performance="analysis.contentLengthPerformance.value"
        />
      </template>
    </div>
  </DashboardLayout>
</template>

<style scoped>
.schedule-analysis-view {
  padding: var(--space-xl) var(--space-lg);
  max-width: 1600px;
  margin: 0 auto;
}

/* Section Dividers — match analytics view */
.section-divider {
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    var(--glass-border) 20%,
    var(--glass-border) 80%,
    transparent 100%
  );
  margin: var(--space-2xl) 0;
  position: relative;
}

.section-divider::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 6px;
  height: 6px;
  border-radius: var(--radius-full);
  background: #b08a5a;
  opacity: 0.5;
}

/* Section Labels — match analytics view */
.section-label {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  margin-bottom: var(--space-xl);
}

.section-label-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-lg);
  background: linear-gradient(135deg, rgba(15, 61, 46, 0.1), rgba(15, 61, 46, 0.04));
  color: var(--gold-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.section-label-title {
  font-family: var(--font-heading);
  font-size: var(--text-lg);
  color: var(--text-primary);
  margin: 0;
}

.section-label-subtitle {
  font-size: var(--text-sm);
  color: var(--text-muted);
  margin: 2px 0 0 0;
}

/* Warnings */
.analysis-warning {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-md) var(--space-lg);
  margin-bottom: var(--space-md);
  background: rgba(245, 158, 11, 0.08);
  border-left: 3px solid rgba(245, 158, 11, 0.5);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

/* Error State */
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-lg);
  padding: var(--space-5xl) var(--space-2xl);
  text-align: center;
}

.error-icon {
  width: 64px;
  height: 64px;
  border-radius: var(--radius-full);
  background: var(--error-bg);
  color: var(--error-text);
  display: flex;
  align-items: center;
  justify-content: center;
}

.error-state h3 {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  color: var(--text-primary);
  margin: 0;
}

.error-state p {
  font-size: var(--text-base);
  color: var(--text-secondary);
  margin: 0;
}

.retry-btn {
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

.retry-btn:hover {
  transform: translateY(-2px);
  box-shadow: var(--glow-gold-md);
}

/* Responsive */
@media (max-width: 768px) {
  .schedule-analysis-view {
    padding: var(--space-md);
  }

  .section-divider {
    margin: var(--space-lg) 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .retry-btn:hover {
    transform: none;
  }
}
</style>
