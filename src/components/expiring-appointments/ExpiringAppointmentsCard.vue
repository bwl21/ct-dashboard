<template>
  <BaseCard
    :title="'Auslaufende Terminserien'"
    :icon="'📅'"
    :is-loading="isLoading"
    :error="error"
    :main-stat="mainStat"
    :status-stats="statusStats"
    :last-update="formattedLastUpdate"
    loading-text="Lade Termine..."
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
import {
  useExpiringAppointments,
  useExpiringAppointmentsStats,
} from '@/composables/useExpiringAppointments'
import BaseCard from '../common/BaseCard.vue'

// Configuration
const DAYS_TO_SHOW = 90

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
const {
  data: appointments,
  isLoading,
  error,
  refetch,
  isFetching,
  dataUpdatedAt,
} = useExpiringAppointments()

// Compute stats using the helper function
const stats = computed(() => {
  if (!appointments.value) return { total: 0, expiring: 0, expired: 0 }
  return useExpiringAppointmentsStats(appointments.value, DAYS_TO_SHOW)
})

const mainStat = computed(() => ({
  value: stats.value.total,
  label: 'auslaufende Terminserien',
}))

const statusStats = computed(() => [
  {
    key: 'total',
    value: stats.value.total,
    label: 'Gesamt',
    icon: '📊',
    type: 'info' as const,
  },
  {
    key: 'expiring',
    value: stats.value.expiring,
    label: 'Läuft ab',
    icon: '⏰',
    type: 'warning' as const,
  },
  {
    key: 'expired',
    value: stats.value.expired,
    label: 'Abgelaufen',
    icon: '❌',
    type: 'error' as const,
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
