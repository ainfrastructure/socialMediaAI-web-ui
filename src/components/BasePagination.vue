<template>
  <div class="pagination">
    <button
      class="pagination-btn"
      :disabled="currentPage === 1"
      @click="$emit('update:currentPage', currentPage - 1)"
    >
      ← Previous
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
      Next →
    </button>
  </div>

  <div class="pagination-info">
    Page {{ currentPage }} of {{ totalPages }} ({{ totalItems }} total)
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
  border-top: 1px solid rgba(212, 175, 55, 0.1);
}

.pagination-btn {
  padding: var(--space-md) var(--space-xl);
  background: rgba(212, 175, 55, 0.1);
  border: 1px solid rgba(212, 175, 55, 0.3);
  border-radius: var(--radius-md);
  color: var(--accent-gold);
  font-size: var(--text-sm);
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition-base);
  font-family: var(--font-body);
}

.pagination-btn:hover:not(:disabled) {
  background: rgba(212, 175, 55, 0.2);
  border-color: rgba(212, 175, 55, 0.5);
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
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(212, 175, 55, 0.2);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  font-size: var(--text-sm);
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition-base);
  font-family: var(--font-body);
}

.pagination-page:hover {
  background: rgba(212, 175, 55, 0.1);
  border-color: rgba(212, 175, 55, 0.4);
  color: var(--accent-gold);
}

.pagination-page.active {
  background: rgba(212, 175, 55, 0.2);
  border-color: var(--accent-gold);
  color: var(--accent-gold);
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
  }

  .pagination-page {
    min-width: 32px;
    height: 32px;
    font-size: var(--text-xs);
  }

  .pagination-pages {
    gap: 0.25rem;
  }
}
</style>
