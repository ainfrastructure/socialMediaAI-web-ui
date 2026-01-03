<template>
  <!-- Hide pagination if only 1 page -->
  <div v-if="totalPages > 1" class="pagination-container">
    <div class="pagination">
      <button
        class="pagination-btn"
        :disabled="currentPage === 1"
        @click="$emit('update:currentPage', currentPage - 1)"
      >
        {{ $t('common.pagination.previous') }}
      </button>

      <div class="pagination-pages">
        <!-- First page -->
        <button
          v-if="showFirstPage"
          class="pagination-page"
          :class="{ active: currentPage === 1 }"
          @click="$emit('update:currentPage', 1)"
        >
          1
        </button>

        <!-- First ellipsis -->
        <span v-if="showFirstEllipsis" class="pagination-ellipsis">...</span>

        <!-- Page numbers around current page -->
        <button
          v-for="page in visiblePages"
          :key="page"
          class="pagination-page"
          :class="{ active: currentPage === page }"
          @click="$emit('update:currentPage', page)"
        >
          {{ page }}
        </button>

        <!-- Last ellipsis -->
        <span v-if="showLastEllipsis" class="pagination-ellipsis">...</span>

        <!-- Last page -->
        <button
          v-if="showLastPage"
          class="pagination-page"
          :class="{ active: currentPage === totalPages }"
          @click="$emit('update:currentPage', totalPages)"
        >
          {{ totalPages }}
        </button>
      </div>

      <button
        class="pagination-btn"
        :disabled="currentPage === totalPages"
        @click="$emit('update:currentPage', currentPage + 1)"
      >
        {{ $t('common.pagination.next') }}
      </button>
    </div>

    <div class="pagination-info">
      {{ $t('common.pagination.pageInfo', { current: currentPage, total: totalPages, count: totalItems }) }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  currentPage: number
  totalPages: number
  totalItems: number
  maxVisible?: number
}

const props = withDefaults(defineProps<Props>(), {
  maxVisible: 5
})

defineEmits<{
  (e: 'update:currentPage', page: number): void
}>()

// Calculate which pages to show
const visiblePages = computed(() => {
  const { currentPage, totalPages, maxVisible } = props
  const pages: number[] = []

  if (totalPages <= maxVisible) {
    // Show all pages if total is less than max
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i)
    }
  } else {
    // Calculate range around current page
    const half = Math.floor(maxVisible / 2)
    let start = Math.max(2, currentPage - half)
    let end = Math.min(totalPages - 1, currentPage + half)

    // Adjust if we're near the beginning or end
    if (currentPage <= half + 1) {
      end = Math.min(totalPages - 1, maxVisible - 1)
      start = 2
    } else if (currentPage >= totalPages - half) {
      start = Math.max(2, totalPages - maxVisible + 2)
      end = totalPages - 1
    }

    for (let i = start; i <= end; i++) {
      pages.push(i)
    }
  }

  return pages
})

const showFirstPage = computed(() => {
  return props.totalPages > 1 && !visiblePages.value.includes(1)
})

const showLastPage = computed(() => {
  return props.totalPages > 1 && !visiblePages.value.includes(props.totalPages)
})

const showFirstEllipsis = computed(() => {
  return visiblePages.value.length > 0 && visiblePages.value[0] > 2
})

const showLastEllipsis = computed(() => {
  return visiblePages.value.length > 0 && visiblePages.value[visiblePages.value.length - 1] < props.totalPages - 1
})
</script>

<style scoped>
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: var(--space-md);
  padding-top: var(--space-xl);
  border-top: 1px solid var(--accent-alpha-05);
}

.pagination-btn {
  padding: var(--space-md) var(--space-xl);
  background: var(--accent-alpha-05);
  border: 1px solid var(--accent-alpha-15);
  border-radius: var(--radius-md);
  color: var(--gold-primary);
  font-size: var(--text-sm);
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition-base);
  font-family: var(--font-body);
}

.pagination-btn:hover:not(:disabled) {
  background: var(--accent-alpha-10);
  border-color: var(--accent-alpha-25);
  transform: translateY(-2px);
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-pages {
  display: flex;
  gap: var(--space-sm);
  align-items: center;
}

.pagination-page {
  min-width: 36px;
  height: 36px;
  padding: var(--space-xs) var(--space-sm);
  background: var(--surface-alpha-80);
  border: 1px solid var(--accent-alpha-10);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  font-size: var(--text-sm);
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition-base);
  font-family: var(--font-body);
}

.pagination-page:hover {
  background: var(--accent-alpha-05);
  border-color: var(--accent-alpha-20);
  color: var(--gold-primary);
}

.pagination-page.active {
  background: var(--accent-alpha-10);
  border-color: var(--gold-primary);
  color: var(--gold-primary);
  font-weight: 700;
}

.pagination-ellipsis {
  color: var(--text-secondary);
  font-size: var(--text-sm);
  padding: 0 var(--space-xs);
}

.pagination-info {
  text-align: center;
  margin-top: var(--space-md);
  font-size: var(--text-sm);
  color: var(--text-secondary);
  font-weight: 500;
}

/* Responsive */
@media (max-width: 768px) {
  .pagination {
    gap: var(--space-sm);
  }

  .pagination-btn {
    padding: var(--space-sm) var(--space-md);
    font-size: var(--text-xs);
    min-height: var(--touch-target-min);
  }

  .pagination-page {
    min-width: 36px;
    height: 36px;
    font-size: var(--text-xs);
  }

  .pagination-pages {
    gap: var(--space-xs);
  }
}

@media (max-width: 480px) {
  .pagination-container {
    width: 100%;
  }

  .pagination {
    flex-wrap: wrap;
    gap: var(--space-sm);
    justify-content: center;
  }

  .pagination-btn {
    padding: var(--space-md) var(--space-lg);
    min-height: var(--touch-target-min);
    flex: 1;
    max-width: 120px;
  }

  .pagination-pages {
    order: -1;
    width: 100%;
    justify-content: center;
    gap: var(--space-xs);
    margin-bottom: var(--space-sm);
  }

  .pagination-page {
    min-width: var(--touch-target-min);
    height: var(--touch-target-min);
  }

  .pagination-info {
    width: 100%;
    text-align: center;
  }
}

@media (max-width: 390px) {
  .pagination-btn {
    font-size: var(--text-xs);
    padding: var(--space-sm) var(--space-md);
  }

  .pagination-page {
    min-width: 40px;
    height: 40px;
  }

  .pagination-pages {
    gap: 2px;
  }
}
</style>
