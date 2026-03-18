<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import MaterialIcon from '@/components/MaterialIcon.vue'
import PlatformLogo from '@/components/PlatformLogo.vue'
const { t } = useI18n()
</script>

<template>
  <div class="demo-ads" data-demo-ads>
    <!-- Header -->
    <div class="da-header">
      <div class="da-back">
        <MaterialIcon icon="arrow_back" size="xs" />
      </div>
      <span class="da-title">{{ t('appLanding.cinematic.adsCreateTitle') }}</span>
    </div>

    <!-- Post Preview Card -->
    <div class="da-post-preview" data-demo-ads-preview>
      <div class="da-preview-img">
        <img src="/example/vetted-wave-flow.png" alt="" class="da-preview-real-img" />
      </div>
      <div class="da-preview-body">
        <p class="da-preview-caption">{{ t('appLanding.aiCreation.postCaption') }}</p>
      </div>
    </div>

    <!-- Platform selection -->
    <div class="da-form-section" data-demo-ads-platform>
      <span class="da-form-label">{{ t('appLanding.cinematic.adsPlatformLabel') }}</span>
      <div class="da-platform-row">
        <div class="da-platform-circle da-platform-active">
          <PlatformLogo platform="facebook" :size="12" />
        </div>
        <div class="da-platform-circle">
          <PlatformLogo platform="instagram" :size="12" />
        </div>
        <div class="da-platform-circle">
          <PlatformLogo platform="twitter" :size="12" />
        </div>
      </div>
    </div>

    <!-- Objective selection -->
    <div class="da-form-section" data-demo-ads-objective>
      <span class="da-form-label">{{ t('appLanding.cinematic.adsObjectiveLabel') }}</span>
      <div class="da-objective-pills">
        <span class="da-pill da-pill-active">{{ t('appLanding.cinematic.adsObjectiveReach') }}</span>
        <span class="da-pill">{{ t('appLanding.cinematic.adsObjectiveEngagement') }}</span>
        <span class="da-pill">{{ t('appLanding.cinematic.adsObjectiveClicks') }}</span>
      </div>
    </div>

    <!-- Budget row -->
    <div class="da-info-row" data-demo-ads-budget>
      <div class="da-info-icon">
        <MaterialIcon icon="payments" size="xs" />
      </div>
      <span class="da-info-label">{{ t('appLanding.cinematic.adsBudgetLabel') }}</span>
      <span class="da-info-value">{{ t('appLanding.cinematic.adsBudgetValue') }}</span>
    </div>

    <!-- Duration row -->
    <div class="da-info-row" data-demo-ads-duration>
      <div class="da-info-icon">
        <MaterialIcon icon="calendar_today" size="xs" />
      </div>
      <span class="da-info-label">{{ t('appLanding.cinematic.adsDurationLabel') }}</span>
      <span class="da-info-value">{{ t('appLanding.cinematic.adsDurationValue') }}</span>
    </div>

    <!-- Launch button -->
    <div class="da-launch-wrap" data-demo-ads-launch>
      <button class="da-launch-btn">
        {{ t('appLanding.cinematic.adsLaunch') }}
      </button>
    </div>

    <!-- Success overlay with stats -->
    <div class="da-success" data-demo-ads-success>
      <div class="da-success-check">
        <MaterialIcon icon="check_circle" size="lg" />
      </div>
      <span class="da-success-title">{{ t('appLanding.cinematic.adsSuccessTitle') }}</span>

      <div class="da-success-stats" data-demo-ads-stats>
        <div class="da-success-stat">
          <span class="da-success-stat-value">22K</span>
          <span class="da-success-stat-label">{{ t('appLanding.cinematic.adsEstReach') }}</span>
        </div>
        <div class="da-success-stat">
          <span class="da-success-stat-value">1,750 kr</span>
          <span class="da-success-stat-label">{{ t('appLanding.cinematic.adsTotalBudget') }}</span>
        </div>
        <div class="da-success-stat">
          <span class="da-success-stat-value">~2.1%</span>
          <span class="da-success-stat-label">{{ t('appLanding.cinematic.adsEstCtr') }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.demo-ads {
  position: absolute;
  inset: 0;
  z-index: 35;
  background: var(--lp-bg-primary, #09090B);
  display: flex;
  flex-direction: column;
  opacity: 0;
  pointer-events: none;
}

/* Header */
.da-header {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-sm) var(--space-md);
  border-bottom: 1px solid var(--lp-border, rgba(255, 255, 255, 0.08));
  flex-shrink: 0;
}

.da-back {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--lp-text-secondary);
}

.da-title {
  flex: 1;
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  color: var(--lp-text-primary);
}

/* Post preview card */
.da-post-preview {
  margin: var(--space-sm) var(--space-md);
  background: var(--lp-bg-surface, rgba(255, 255, 255, 0.06));
  border: 1px solid var(--lp-border, rgba(255, 255, 255, 0.08));
  border-radius: var(--radius-md);
  overflow: hidden;
  opacity: 0;
}

.da-preview-img {
  width: 100%;
  height: 70px;
  overflow: hidden;
}

.da-preview-real-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.da-preview-body {
  padding: var(--space-xs) var(--space-sm);
}

.da-preview-caption {
  font-size: 8px;
  color: var(--lp-text-primary);
  line-height: 1.4;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Form section */
.da-form-section {
  padding: var(--space-xs) var(--space-md);
  opacity: 0;
}

.da-form-label {
  display: block;
  font-size: 8px;
  font-weight: var(--font-semibold);
  color: var(--lp-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: var(--space-xs);
}

/* Platform circles */
.da-platform-row {
  display: flex;
  gap: var(--space-sm);
}

.da-platform-circle {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--lp-border, rgba(255, 255, 255, 0.15));
  background: var(--lp-bg-surface, rgba(255, 255, 255, 0.06));
}

.da-platform-active {
  border-color: var(--lp-accent-orange);
  background: color-mix(in srgb, var(--lp-accent-orange) 15%, transparent);
  box-shadow: 0 0 8px color-mix(in srgb, var(--lp-accent-orange) 30%, transparent);
}

/* Objective pills */
.da-objective-pills {
  display: flex;
  gap: 4px;
}

.da-pill {
  font-size: 8px;
  padding: 4px 8px;
  border-radius: var(--radius-full);
  background: var(--lp-bg-surface, rgba(255, 255, 255, 0.06));
  border: 1px solid var(--lp-border, rgba(255, 255, 255, 0.08));
  color: var(--lp-text-secondary);
  font-weight: var(--font-medium);
}

.da-pill-active {
  background: color-mix(in srgb, var(--lp-accent-orange) 15%, transparent);
  border-color: var(--lp-accent-orange);
  color: var(--lp-accent-orange);
}

/* Info rows */
.da-info-row {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-sm) var(--space-md);
  margin: 0 var(--space-md);
  background: var(--lp-bg-surface, rgba(255, 255, 255, 0.04));
  border: 1px solid var(--lp-border, rgba(255, 255, 255, 0.06));
  border-radius: var(--radius-md);
  margin-bottom: var(--space-xs);
  opacity: 0;
}

.da-info-icon {
  color: var(--lp-accent-orange);
  display: flex;
  align-items: center;
}

.da-info-label {
  flex: 1;
  font-size: 9px;
  font-weight: var(--font-medium);
  color: var(--lp-text-secondary);
}

.da-info-value {
  font-size: 9px;
  font-weight: var(--font-bold);
  color: var(--lp-text-primary);
}

/* Launch button */
.da-launch-wrap {
  padding: var(--space-sm) var(--space-md);
  margin-top: auto;
  opacity: 0;
}

.da-launch-btn {
  width: 100%;
  border: none;
  font-family: var(--font-body);
  font-size: 10px;
  font-weight: var(--font-bold);
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-md);
  background: var(--lp-accent-orange);
  color: #fff;
  cursor: pointer;
  text-align: center;
}

/* Success overlay */
.da-success {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  background: var(--lp-bg-primary, rgba(9, 9, 11, 0.95));
  opacity: 0;
  pointer-events: none;
  z-index: 5;
}

.da-success-check {
  color: #22c55e;
  opacity: 0;
  transform: scale(0);
}

.da-success-title {
  font-size: 11px;
  font-weight: var(--font-bold);
  color: #22c55e;
}

.da-success-stats {
  display: flex;
  gap: var(--space-md);
  margin-top: var(--space-sm);
  opacity: 0;
}

.da-success-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.da-success-stat-value {
  font-size: 13px;
  font-weight: var(--font-bold);
  color: var(--lp-text-primary);
}

.da-success-stat-label {
  font-size: 7px;
  color: var(--lp-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-weight: var(--font-semibold);
}
</style>
