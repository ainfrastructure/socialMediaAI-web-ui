<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import MaterialIcon from './MaterialIcon.vue'

interface Props {
  postTypeSettings?: Record<string, 'feed' | 'story' | 'reel' | 'carousel'> | null
  platforms?: string[]
  size?: 'small' | 'medium'
  showIcon?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  postTypeSettings: null,
  platforms: () => [],
  size: 'small',
  showIcon: false,
})

const { t } = useI18n()

// Get unique post types from the settings
const postTypes = computed(() => {
  // If no post_type_settings provided, check if we have platforms
  // For legacy posts (created before post_type feature), default to 'feed'
  if (!props.postTypeSettings || Object.keys(props.postTypeSettings).length === 0) {
    // If we have platforms specified, default to 'feed' for each
    if (props.platforms && props.platforms.length > 0) {
      return ['feed']
    }
    return []
  }

  // Extract post types for the platforms we care about
  const types = new Set<string>()

  if (props.platforms.length > 0) {
    // Filter by provided platforms
    props.platforms.forEach((platform) => {
      const type = props.postTypeSettings?.[platform]
      // Default to 'feed' if platform doesn't have a specific type
      types.add(type || 'feed')
    })
  } else {
    // Use all post types if no platforms specified
    Object.values(props.postTypeSettings).forEach((type) => types.add(type))
  }

  return Array.from(types)
})

// Icon mapping
const getIcon = (type: string): string => {
  const icons: Record<string, string> = {
    feed: 'article',
    story: 'auto_stories',
    reel: 'play_circle',
    carousel: 'view_carousel',
  }
  return icons[type] || 'help'
}

// Get CSS class for badge variant
const getBadgeClass = (type: string): string => {
  return `badge-${type}`
}
</script>

<template>
  <div :class="['post-type-badges', `size-${size}`]">
    <!-- Not Set State -->
    <div v-if="postTypes.length === 0" class="badge badge-not-set">
      <MaterialIcon v-if="showIcon" icon="help_outline" size="sm" />
      <span>{{ t('postType.notSet') }}</span>
    </div>

    <!-- Single or Multiple Types -->
    <template v-else>
      <div v-for="type in postTypes" :key="type" :class="['badge', getBadgeClass(type)]">
        <MaterialIcon v-if="showIcon" :icon="getIcon(type)" size="sm" />
        <span>{{ t(`postType.${type}`) }}</span>
      </div>
    </template>
  </div>
</template>

<style scoped>
.post-type-badges {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  flex-wrap: wrap;
}

.badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2xs);
  border-radius: var(--radius-full);
  font-weight: 500;
  white-space: nowrap;
  transition: all var(--transition-fast);
}

/* Size Variants */
.size-small .badge {
  padding: 2px 8px;
  font-size: var(--text-xs);
}

.size-medium .badge {
  padding: 4px 12px;
  font-size: var(--text-sm);
}

/* Feed Post - Green */
.badge-feed {
  background: rgba(15, 61, 46, 0.1);
  color: var(--gold-primary);
  border: 1px solid rgba(15, 61, 46, 0.2);
}

/* Story - Orange */
.badge-story {
  background: rgba(245, 158, 11, 0.1);
  color: #d97706;
  border: 1px solid rgba(245, 158, 11, 0.2);
}

/* Reel - Purple */
.badge-reel {
  background: rgba(147, 51, 234, 0.1);
  color: #9333ea;
  border: 1px solid rgba(147, 51, 234, 0.2);
}

/* Carousel - Blue */
.badge-carousel {
  background: rgba(59, 130, 246, 0.1);
  color: #2563eb;
  border: 1px solid rgba(59, 130, 246, 0.2);
}

/* Not Set - Gray */
.badge-not-set {
  background: rgba(136, 136, 136, 0.1);
  color: var(--text-muted);
  border: 1px solid rgba(136, 136, 136, 0.2);
}

/* Hover Effects (for interactive contexts) */
.badge:hover {
  transform: translateY(-1px);
}

@media (prefers-reduced-motion: reduce) {
  .badge {
    transition: none;
  }

  .badge:hover {
    transform: none;
  }
}
</style>
