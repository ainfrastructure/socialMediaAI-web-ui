<template>
  <div v-if="mediaUrl" class="generated-content">
    <h4>{{ title }}</h4>

    <!-- Image Display -->
    <img
      v-if="type === 'image'"
      :src="mediaUrl"
      :alt="$t('playground.generatedImage', 'Generated marketing image')"
      class="generated-image"
    />

    <!-- Video Display -->
    <video
      v-else-if="type === 'video'"
      :src="mediaUrl"
      controls
      preload="metadata"
      playsinline
      class="generated-video"
    ></video>

    <div class="content-actions">
      <a :href="mediaUrl" download class="download-btn">
        {{ $t('playground.download', 'Download') }} {{ type === 'image' ? $t('playground.image', 'Image') : $t('playground.video', 'Video') }}
      </a>
      <slot name="actions"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  type: 'image' | 'video'
  mediaUrl: string | null
  title: string
}>()
</script>

<style scoped>
.generated-content {
  margin-top: var(--space-xl);
  padding: var(--space-xl);
  background: rgba(0, 0, 0, 0.2);
  border-radius: var(--radius-lg);
  border: 1px solid rgba(212, 175, 55, 0.2);
}

.generated-content h4 {
  font-family: var(--font-heading);
  font-size: var(--text-lg);
  color: var(--gold-primary);
  margin: 0 0 var(--space-lg) 0;
}

.generated-image {
  width: 100%;
  max-width: 512px;
  height: auto;
  border-radius: var(--radius-md);
  margin: 0 auto var(--space-lg);
  display: block;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

.generated-video {
  width: 100%;
  max-width: 640px;
  height: auto;
  border-radius: var(--radius-md);
  margin: 0 auto var(--space-lg);
  display: block;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

.content-actions {
  display: flex;
  gap: var(--space-md);
  flex-wrap: wrap;
  justify-content: center;
}

.download-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-md) var(--space-xl);
  background: rgba(212, 175, 55, 0.1);
  border: 1px solid var(--gold-primary);
  border-radius: var(--radius-md);
  color: var(--gold-primary);
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  text-decoration: none;
  transition: all var(--transition-base);
}

.download-btn:hover {
  background: rgba(212, 175, 55, 0.2);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(212, 175, 55, 0.3);
}

@media (max-width: 768px) {
  .generated-content {
    padding: var(--space-lg);
  }

  .content-actions {
    flex-direction: column;
  }

  .download-btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
