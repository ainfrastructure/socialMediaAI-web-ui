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
    behindTheScenes: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">${goldGradient}<path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" fill="url(#goldGrad-${styleId})"/></svg>`,
    cleanStrict: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">${goldGradient}<circle cx="12" cy="12" r="3.2" fill="url(#goldGrad-${styleId})"/><path d="M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z" fill="url(#goldGrad-${styleId})"/></svg>`,
    zoomIn: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">${goldGradient}<path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" fill="url(#goldGrad-${styleId})"/><path d="M12 10h-2v2H8v-2H6V8h2V6h2v2h2v2z" fill="url(#goldGrad-${styleId})"/></svg>`,
    oneBite: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">${goldGradient}<path d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z" fill="url(#goldGrad-${styleId})"/></svg>`,
    studioShot: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">${goldGradient}<path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7zm2.85 11.1l-.85.6V16h-4v-2.3l-.85-.6C7.8 12.16 7 10.63 7 9c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.63-.8 3.16-2.15 4.1z" fill="url(#goldGrad-${styleId})"/></svg>`,
    infographic: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">${goldGradient}<path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" fill="url(#goldGrad-${styleId})"/></svg>`,
    custom: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">${goldGradient}<path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="url(#goldGrad-${styleId})"/></svg>`
  }

  return icons[styleId] || icons.behindTheScenes
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
