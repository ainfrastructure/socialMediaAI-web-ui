<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useThemeStore } from '@/stores/theme'
import MaterialIcon from './MaterialIcon.vue'

const { t } = useI18n()
const themeStore = useThemeStore()

const isDark = computed(() => themeStore.theme === 'dark')

const ariaLabel = computed(() =>
  isDark.value ? t('theme.switchToLight') : t('theme.switchToDark')
)
</script>

<template>
  <button
    class="theme-toggle"
    :aria-label="ariaLabel"
    :title="ariaLabel"
    @click="themeStore.toggleTheme()"
  >
    <MaterialIcon :icon="isDark ? 'light_mode' : 'dark_mode'" size="md" />
  </button>
</template>

<style scoped>
.theme-toggle {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  cursor: pointer;
  transition: var(--transition-base);
}

.theme-toggle:hover {
  background: var(--bg-elevated);
  border-color: var(--gold-primary);
  color: var(--gold-primary);
}

@media (max-width: 480px) {
  .theme-toggle {
    width: 36px;
    height: 36px;
  }
}

@media (max-width: 390px) {
  .theme-toggle {
    width: 32px;
    height: 32px;
  }
}
</style>
