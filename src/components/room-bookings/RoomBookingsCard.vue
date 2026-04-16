<template>
  <BaseCard
    :title="module.title"
    :icon="module.icon"
    :is-loading="loading"
    :error="error"
    :main-stat="mainStat"
    :status-stats="statusStats"
    :last-update="formattedLastUpdate"
    loading-text="Lade Raumbuchungen..."
    retry-text="Erneut versuchen"
    refresh-text="Aktualisieren"
    refreshing-text="Lädt..."
    details-text="Verwalten"
    last-update-text="Letzte Aktualisierung"
    @refresh="refreshData"
    @navigate="$emit('navigate')"
  />
</template>

<script setup lang="ts">
import { onMounted, computed, ref } from 'vue'
import type { DashboardModule } from '../../types/modules'
import BaseCard from '../common/BaseCard.vue'
import type { MainStat, StatusStat } from '../common/BaseCard.vue'
import { useRoomBookings } from './useRoomBookings'

defineProps<{
  module: DashboardModule
}>()

defineEmits<{
  navigate: []
}>()

const { bookings, resources, loading, error, filter, bookingStats, fetchResources, fetchBookings } =
  useRoomBookings()

const lastUpdateTime = ref<number | null>(null)

// Initialize data on mount
onMounted(async () => {
  try {
    // Load resources first
    await fetchResources()

    // Then load bookings for all resources
    if (resources.value.length > 0) {
      const resourceIds = resources.value.map((r: any) => r.id)
      await fetchBookings(resourceIds, [1]) // 1 = PENDING
      lastUpdateTime.value = Date.now()
    }
  } catch (err) {
    console.error('Error initializing room bookings:', err)
  }
})

const mainStat = computed(
  (): MainStat => ({
    value: bookingStats.value.total,
    label: 'Offene Anfragen',
  })
)

const statusStats = computed((): StatusStat[] => [
  {
    icon: '📋',
    value: bookingStats.value.total,
    label: 'Gesamt',
    type: 'info',
  },
  {
    icon: '⚠️',
    value: bookingStats.value.withConflicts,
    label: 'Mit Konflikten',
    type: 'warning',
  },
  {
    icon: '✅',
    value: bookingStats.value.withoutConflicts,
    label: 'Ohne Konflikte',
    type: 'success',
  },
])

const formattedLastUpdate = computed(() => {
  if (!lastUpdateTime.value) return null

  try {
    return new Date(lastUpdateTime.value).toLocaleString('de-DE', {
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

const refreshData = async () => {
  try {
    if (resources.value.length > 0) {
      const resourceIds = resources.value.map((r: any) => r.id)
      await fetchBookings(resourceIds, filter.statusIds)
      lastUpdateTime.value = Date.now()
    }
  } catch (err) {
    console.error('Error refreshing bookings:', err)
  }
}
</script>
