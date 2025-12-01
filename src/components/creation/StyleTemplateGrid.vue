<script setup lang="ts">
/**
 * StyleTemplateGrid - Reusable style template selector
 * Used for selecting visual styles in creation wizards
 */
import MaterialIcon from '../MaterialIcon.vue'

export interface StyleTemplate {
  id: string
  name: string
  description: string
  icon?: string
  preview?: string
}

interface Props {
  templates: StyleTemplate[]
  modelValue: string
  showBadge?: boolean
}

withDefaults(defineProps<Props>(), {
  showBadge: true
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

// Gold SVG icons for style templates
function getStyleIcon(styleId: string): string {
  const goldGradient = `<defs><linearGradient id="goldGrad-${styleId}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#E5C775"/><stop offset="50%" style="stop-color:#D4AF37"/><stop offset="100%" style="stop-color:#B8943D"/></linearGradient></defs>`

  const icons: Record<string, string> = {
    vibrant: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">${goldGradient}<circle cx="12" cy="12" r="5" fill="url(#goldGrad-${styleId})"/><path d="M12 2V6M12 18V22M2 12H6M18 12H22M4.93 4.93L7.76 7.76M16.24 16.24L19.07 19.07M4.93 19.07L7.76 16.24M16.24 7.76L19.07 4.93" stroke="url(#goldGrad-${styleId})" stroke-width="2" stroke-linecap="round"/></svg>`,
    elegant: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">${goldGradient}<path d="M12 2L19 12L12 22L5 12L12 2Z" fill="url(#goldGrad-${styleId})"/><path d="M12 6L16 12L12 18L8 12L12 6Z" fill="url(#goldGrad-${styleId})" opacity="0.5"/></svg>`,
    rustic: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">${goldGradient}<path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22L6.66 19.97C7.14 19.11 8.32 17.76 10.66 17.11C10.66 17.11 11.47 19.63 12.5 22H14.5C13.46 19.63 12.66 17.11 12.66 17.11C14.92 17.11 16.14 17.63 17.66 19.11L18.66 22H20.66L18.66 13C19.86 12.33 21.55 11.5 21.55 9.38C21.55 8.38 20.66 7.5 19.66 7.5C19.39 7.5 19.14 7.57 18.91 7.68C18.58 6.09 17.5 5 16 5C14.5 5 13.42 6.09 13.09 7.68C12.86 7.57 12.61 7.5 12.34 7.5C11.34 7.5 10.45 8.38 10.45 9.38C10.45 11.5 12.14 12.33 13.34 13L13 14C12.5 14 11.5 14.5 11 15C10.5 15.5 10 16.5 10 17L10.5 18C10.5 18 10.32 17.13 10.66 17.11" fill="url(#goldGrad-${styleId})"/></svg>`,
    modern: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">${goldGradient}<rect x="3" y="3" width="7" height="7" rx="1" fill="url(#goldGrad-${styleId})"/><rect x="14" y="3" width="7" height="7" rx="1" fill="url(#goldGrad-${styleId})" opacity="0.7"/><rect x="3" y="14" width="7" height="7" rx="1" fill="url(#goldGrad-${styleId})" opacity="0.7"/><rect x="14" y="14" width="7" height="7" rx="1" fill="url(#goldGrad-${styleId})"/></svg>`,
    playful: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">${goldGradient}<circle cx="12" cy="12" r="10" fill="url(#goldGrad-${styleId})"/><circle cx="8.5" cy="10" r="1.5" fill="#0a0a0a"/><circle cx="15.5" cy="10" r="1.5" fill="#0a0a0a"/><path d="M8 14C8 14 9.5 17 12 17C14.5 17 16 14 16 14" stroke="#0a0a0a" stroke-width="2" stroke-linecap="round"/></svg>`
  }

  return icons[styleId] || icons.vibrant
}

function selectTemplate(templateId: string) {
  emit('update:modelValue', templateId)
}
</script>

<template>
  <div class="style-templates-grid">
    <div
      v-for="template in templates"
      :key="template.id"
      :class="['style-template-card', { 'selected': modelValue === template.id }]"
      @click="selectTemplate(template.id)"
    >
      <div class="template-icon" v-html="getStyleIcon(template.id)"></div>
      <h4 class="template-name">{{ template.name }}</h4>
      <p class="template-description">{{ template.description }}</p>
      <div v-if="showBadge && modelValue === template.id" class="template-selected-badge">
        <MaterialIcon icon="check_circle" size="md" :color="'var(--text-on-gold)'" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.style-templates-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: var(--space-lg);
}

.style-template-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--space-xl);
  border-radius: var(--radius-lg);
  background: var(--bg-tertiary);
  border: 2px solid var(--border-color);
  cursor: pointer;
  transition: var(--transition-base);
  text-align: center;
}

.style-template-card:hover {
  border-color: var(--gold-primary);
  transform: translateY(-2px);
}

.style-template-card.selected {
  border-color: var(--gold-primary);
  background: var(--gold-subtle);
  box-shadow: var(--glow-gold-sm);
}

.template-icon {
  margin-bottom: var(--space-md);
}

.template-name {
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin-bottom: var(--space-xs);
}

.template-description {
  font-size: var(--text-sm);
  color: var(--text-muted);
  line-height: var(--leading-normal);
}

.template-selected-badge {
  position: absolute;
  top: var(--space-sm);
  right: var(--space-sm);
  width: 28px;
  height: 28px;
  border-radius: var(--radius-full);
  background: var(--gradient-gold);
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Responsive */
@media (max-width: 768px) {
  .style-templates-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .style-template-card {
    padding: var(--space-lg);
  }
}
</style>
