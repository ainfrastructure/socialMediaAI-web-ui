<template>
  <div class="video-options">
    <div class="option-group">
      <label>{{ $t('playground.duration', 'Duration') }}</label>
      <select :value="duration" @change="$emit('update:duration', Number(($event.target as HTMLSelectElement).value))" class="option-select">
        <option :value="4">4 {{ $t('playground.seconds', 'seconds') }}</option>
        <option :value="6">6 {{ $t('playground.seconds', 'seconds') }}</option>
        <option :value="8">8 {{ $t('playground.seconds', 'seconds') }}</option>
      </select>
    </div>

    <div class="option-group">
      <label>{{ $t('playground.aspectRatio', 'Aspect Ratio') }}</label>
      <select :value="aspectRatio" @change="$emit('update:aspectRatio', ($event.target as HTMLSelectElement).value)" class="option-select">
        <option value="16:9">16:9 ({{ $t('playground.landscape', 'Landscape') }})</option>
        <option value="9:16">9:16 ({{ $t('playground.portrait', 'Portrait') }})</option>
      </select>
    </div>

    <div class="option-group">
      <label>{{ $t('playground.resolution', 'Resolution') }}</label>
      <select :value="resolution" @change="$emit('update:resolution', ($event.target as HTMLSelectElement).value)" class="option-select">
        <option value="720p">720p</option>
      </select>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  duration: number
  aspectRatio: string
  resolution: string
}>()

defineEmits<{
  (e: 'update:duration', value: number): void
  (e: 'update:aspectRatio', value: string): void
  (e: 'update:resolution', value: string): void
}>()
</script>

<style scoped>
.video-options {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-lg);
  margin-bottom: var(--space-xl);
  padding: var(--space-lg);
  background: rgba(255, 255, 255, 0.8);
  border-radius: var(--radius-md);
  border: 1px solid rgba(15, 61, 46, 0.1);
}

.option-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.option-group label {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--text-secondary);
}

.option-select {
  padding: var(--space-sm) var(--space-md);
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(15, 61, 46, 0.15);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: var(--text-sm);
  cursor: pointer;
  transition: all var(--transition-base);
}

.option-select:hover {
  border-color: rgba(15, 61, 46, 0.25);
}

.option-select:focus {
  outline: none;
  border-color: var(--gold-primary);
}

.option-select option {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

@media (max-width: 768px) {
  .video-options {
    grid-template-columns: 1fr;
  }
}
</style>
