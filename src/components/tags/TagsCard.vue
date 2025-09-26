<template>
  <BaseCard
    :title="'Tags'"
    :icon="'🏷️'"
    :is-loading="isLoading"
    :error="error"
    :main-stat="mainStat"
    :status-stats="statusStats"
    :last-update="formattedLastUpdate"
    loading-text="Lade Tags..."
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
import { useTags, useTagsStats } from '@/composables/useTags'
import BaseCard from '../common/BaseCard.vue'

// Props
defineProps<{
  module: {
    id: string
    title: string
    icon: string
    description: string
  }
}>()

defineEmits<{
  navigate: []
}>()

// Use TanStack Query for data fetching with caching
const { data: tags, isLoading, error, refetch, isFetching, dataUpdatedAt } = useTags()

// Compute stats using the helper function
const stats = computed(() => {
  if (!tags.value) return { total: 0, person: 0, song: 0, group: 0 }
  return useTagsStats(tags.value)
})

const mainStat = computed(() => ({
  value: stats.value.total,
  label: 'Tags gesamt',
}))

const statusStats = computed(() => [
  {
    key: 'person',
    value: stats.value.person,
    label: 'Personen',
    icon: '👤',
    type: 'info' as const,
  },
  {
    key: 'song',
    value: stats.value.song,
    label: 'Lieder',
    icon: '🎵',
    type: 'success' as const,
  },
  {
    key: 'group',
    value: stats.value.group,
    label: 'Gruppen',
    icon: '👥',
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

// Refresh data - now uses TanStack Query's refetch
const refreshData = () => {
  refetch()
}
</script>
