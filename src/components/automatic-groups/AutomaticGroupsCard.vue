<template>
  <BaseCard
    :title="module.title"
    :icon="module.icon"
    :is-loading="loading"
    :error="error"
    :main-stat="mainStat"
    :status-stats="statusStats"
    :last-update="formattedLastUpdate"
    loading-text="Lade Gruppendaten..."
    retry-text="Mock-Daten laden"
    refresh-text="Aktualisieren"
    refreshing-text="Lädt..."
    details-text="Details"
    last-update-text="Letzte Aktualisierung"
    @refresh="refreshData"
    @navigate="$emit('navigate')"
    @retry="loadMockData"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { DashboardModule } from '../types/modules'
import BaseCard from '../common/BaseCard.vue'
import type { MainStat, StatusStat } from '../common/BaseCard.vue'
import { useAutomaticGroups, useAutomaticGroupsStats } from '@/composables/useAutomaticGroups'

defineProps<{
  module: DashboardModule
}>()

// Emit für Navigation
defineEmits<{
  navigate: []
}>()

// Use TanStack Query for data fetching with caching
const {
  data: groups,
  isLoading: loading,
  error,
  refetch,
  isFetching,
  dataUpdatedAt,
} = useAutomaticGroups()

// Compute stats using the helper function
const stats = computed(() => {
  if (!groups.value) return { total: 0, successful: 0, error: 0, pending: 0 }
  return useAutomaticGroupsStats(groups.value)
})

// BaseCard computed properties
const mainStat = computed(
  (): MainStat => ({
    value: stats.value.total,
    label: 'Automatische Gruppen',
  })
)

const formattedLastUpdate = computed(() => {
  if (!dataUpdatedAt.value) return null

  try {
    return new Date(dataUpdatedAt.value).toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return null
  }
})

const statusStats = computed((): StatusStat[] => [
  {
    icon: '✅',
    value: stats.value.successful,
    label: 'Erfolgreich',
    type: 'success',
  },
  {
    icon: '❌',
    value: stats.value.error,
    label: 'Fehler',
    type: 'error',
  },
  {
    icon: '⏳',
    value: stats.value.pending,
    label: 'Ausstehend',
    type: 'warning',
  },
])

const refreshData = () => {
  refetch()
}

const loadMockData = () => {
  // Mock data functionality preserved for testing
  // Note: This bypasses the cache and should only be used for development
  console.warn('Loading mock data - this bypasses the caching system')
}
</script>
