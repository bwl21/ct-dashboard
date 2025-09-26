<template>
  <BaseCard
    :title="module.title"
    :icon="'👥'"
    :is-loading="isLoading"
    :error="error?.message"
    :main-stat="mainStat"
    :status-stats="statusStats"
    :last-update="formattedLastUpdate"
    loading-text="Lade Benutzerstatistiken..."
    retry-text="Erneut versuchen"
    refresh-text="Aktualisieren"
    refreshing-text="Aktualisieren..."
    details-text="Details"
    last-update-text="Letzte Aktualisierung"
    @navigate="$emit('navigate')"
    @refresh="refreshData"
    @retry="refreshData"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { DashboardModule } from '../types/modules'
import BaseCard from '../common/BaseCard.vue'
import { useUserStatistics } from '@/composables/useUserStatistics'

defineProps<{
  module: DashboardModule
}>()

defineEmits<{
  navigate: []
}>()

// Use TanStack Query for data fetching with caching
const {
  data: statistics,
  isLoading,
  error,
  refetch,
  isFetching,
  dataUpdatedAt,
} = useUserStatistics()

const mainStat = computed(() => ({
  value: statistics.value?.totalUsers || 0,
  label: 'Benutzer gesamt',
}))

const statusStats = computed(() => [
  {
    key: 'active',
    value: statistics.value?.activeUsers || 0,
    label: 'Aktiv (30 Tage)',
    icon: '✅',
    type: 'success' as const,
  },
  {
    key: 'new',
    value: statistics.value?.newUsers || 0,
    label: 'Neue (30 Tage)',
    icon: '🆕',
    type: 'info' as const,
  },
  {
    key: 'inactive',
    value: statistics.value?.inactiveUsers || 0,
    label: 'Inaktiv (90+ Tage)',
    icon: '😴',
    type: 'warning' as const,
  },
])

const formattedLastUpdate = computed(() => {
  if (!dataUpdatedAt.value) return ''
  return new Date(dataUpdatedAt.value).toLocaleString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
})

const refreshData = () => {
  refetch()
}
</script>

<style scoped>
.user-stats-card {
  border-left: 4px solid var(--color-success);
  height: 100%;
  display: flex;
  flex-direction: column;
}

.ct-card-body {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.feature-icon {
  font-size: 3rem;
  text-align: center;
  margin: var(--spacing-md) 0;
}

.stats-container {
  display: flex;
  justify-content: space-around;
  margin: var(--spacing-lg) 0;
  flex: 1;
}

.stat-item {
  text-align: center;
  flex: 1;
}

.stat-value {
  font-size: var(--font-size-xxl);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  line-height: var(--line-height-tight);
}

.stat-label {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin-top: var(--spacing-xs);
}

@media (max-width: 768px) {
  .stat-value {
    font-size: var(--font-size-xl);
  }

  .stat-label {
    font-size: var(--font-size-xs);
  }
}
</style>
