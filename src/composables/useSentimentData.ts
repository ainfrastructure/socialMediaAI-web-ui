import { computed, watch } from 'vue'
import { useSentimentStore } from '@/stores/sentiment'

/**
 * Composable for the Sentiment Dashboard view.
 * Manages data fetching, auto-refresh, and computed chart data.
 */
export function useSentimentData() {
  const store = useSentimentStore()

  // ─── Chart Data (computed from store) ──────────────────────────────────────

  const sentimentChartData = computed(() => {
    const buckets = store.timeSeries
    return {
      labels: buckets.map(b => {
        const d = new Date(b.timestamp)
        if (store.timeRange === '1h' || store.timeRange === '6h') {
          return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
        if (store.timeRange === '24h') {
          return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
        return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
      }),
      datasets: [
        {
          label: 'Positive',
          data: buckets.map(b => b.positive),
          borderColor: '#22c55e',
          backgroundColor: 'rgba(34, 197, 94, 0.12)',
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 4,
          borderWidth: 2,
        },
        {
          label: 'Neutral',
          data: buckets.map(b => b.neutral),
          borderColor: '#a78bfa',
          backgroundColor: 'rgba(167, 139, 250, 0.08)',
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 4,
          borderWidth: 2,
        },
        {
          label: 'Negative',
          data: buckets.map(b => b.negative),
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239, 68, 68, 0.12)',
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 4,
          borderWidth: 2,
        },
      ],
    }
  })

  const sentimentChartOptions = computed(() => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 16,
          font: { size: 12 },
          color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim() || '#6b6b6b',
        },
      },
      tooltip: {
        backgroundColor: 'rgba(20, 20, 20, 0.9)',
        titleColor: '#f5f5f5',
        bodyColor: '#a0a0a0',
        borderColor: 'rgba(194, 163, 107, 0.2)',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: getComputedStyle(document.documentElement).getPropertyValue('--text-muted').trim() || '#707070',
          font: { size: 11 },
          maxTicksLimit: 12,
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: getComputedStyle(document.documentElement).getPropertyValue('--border-color').trim() || 'rgba(0,0,0,0.1)',
        },
        ticks: {
          color: getComputedStyle(document.documentElement).getPropertyValue('--text-muted').trim() || '#707070',
          font: { size: 11 },
        },
      },
    },
  }))

  const volumeChartData = computed(() => {
    const buckets = store.timeSeries
    return {
      labels: buckets.map(b => {
        const d = new Date(b.timestamp)
        if (store.timeRange === '1h' || store.timeRange === '6h' || store.timeRange === '24h') {
          return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
        return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
      }),
      datasets: [
        {
          label: 'Total Mentions',
          data: buckets.map(b => b.total),
          backgroundColor: 'rgba(194, 163, 107, 0.25)',
          borderColor: 'rgba(194, 163, 107, 0.6)',
          borderWidth: 1,
          borderRadius: 4,
          barPercentage: 0.7,
        },
      ],
    }
  })

  const volumeChartOptions = computed(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(20, 20, 20, 0.9)',
        titleColor: '#f5f5f5',
        bodyColor: '#a0a0a0',
        borderColor: 'rgba(194, 163, 107, 0.2)',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          color: getComputedStyle(document.documentElement).getPropertyValue('--text-muted').trim() || '#707070',
          font: { size: 11 },
          maxTicksLimit: 12,
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: getComputedStyle(document.documentElement).getPropertyValue('--border-color').trim() || 'rgba(0,0,0,0.1)',
        },
        ticks: {
          color: getComputedStyle(document.documentElement).getPropertyValue('--text-muted').trim() || '#707070',
          font: { size: 11 },
        },
      },
    },
  }))

  const sentimentDonutData = computed(() => {
    if (!store.summary) return null
    return {
      labels: ['Positive', 'Neutral', 'Negative'],
      datasets: [
        {
          data: [
            store.summary.positivePercent,
            store.summary.neutralPercent,
            store.summary.negativePercent,
          ],
          backgroundColor: [
            'rgba(34, 197, 94, 0.8)',
            'rgba(167, 139, 250, 0.8)',
            'rgba(239, 68, 68, 0.8)',
          ],
          borderColor: [
            'rgba(34, 197, 94, 1)',
            'rgba(167, 139, 250, 1)',
            'rgba(239, 68, 68, 1)',
          ],
          borderWidth: 2,
          hoverOffset: 6,
        },
      ],
    }
  })

  const sentimentDonutOptions = computed(() => ({
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
      legend: {
        display: true,
        position: 'bottom' as const,
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 16,
          font: { size: 12 },
          color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim() || '#6b6b6b',
        },
      },
      tooltip: {
        backgroundColor: 'rgba(20, 20, 20, 0.9)',
        titleColor: '#f5f5f5',
        bodyColor: '#a0a0a0',
        borderColor: 'rgba(194, 163, 107, 0.2)',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: (ctx: { label: string; raw: number }) => `${ctx.label}: ${ctx.raw}%`,
        },
      },
    },
  }))

  // ─── Helpers ────────────────────────────────────────────────────────────────

  function formatTimeAgo(isoDate: string): string {
    const seconds = Math.floor((Date.now() - new Date(isoDate).getTime()) / 1000)
    if (seconds < 60) return 'just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    return `${Math.floor(seconds / 86400)}d ago`
  }

  function getSentimentColor(sentiment: string): string {
    switch (sentiment) {
      case 'positive': return '#22c55e'
      case 'negative': return '#ef4444'
      default: return '#a78bfa'
    }
  }

  function getSentimentIcon(sentiment: string): string {
    switch (sentiment) {
      case 'positive': return 'sentiment_satisfied'
      case 'negative': return 'sentiment_dissatisfied'
      default: return 'sentiment_neutral'
    }
  }

  function getSourceIcon(source: string): string {
    return source === 'x' ? 'tag' : 'forum'
  }

  function getSeverityColor(severity: string): string {
    switch (severity) {
      case 'critical': return '#ef4444'
      case 'warning': return '#f59e0b'
      default: return '#3b82f6'
    }
  }

  // ─── Lifecycle ──────────────────────────────────────────────────────────────

  async function initialize() {
    await store.loadConfig()
    await store.fetchAll()
    store.startAutoRefresh(store.config?.autoRefreshInterval ?? 30)
  }

  function cleanup() {
    store.stopAutoRefresh()
  }

  // Watch filter changes → refetch
  watch(
    () => [store.timeRange, store.sourceFilter, store.sentimentFilter],
    () => {
      store.fetchAll()
    },
  )

  return {
    // Store references
    store,

    // Chart data
    sentimentChartData,
    sentimentChartOptions,
    volumeChartData,
    volumeChartOptions,
    sentimentDonutData,
    sentimentDonutOptions,

    // Helpers
    formatTimeAgo,
    getSentimentColor,
    getSentimentIcon,
    getSourceIcon,
    getSeverityColor,

    // Lifecycle
    initialize,
    cleanup,
  }
}
