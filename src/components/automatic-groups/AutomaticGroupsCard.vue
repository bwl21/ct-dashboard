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
import { computed, onMounted } from 'vue'
import type { DashboardModule } from '../types/modules'
import BaseCard from '../common/BaseCard.vue'
import type { MainStat, StatusStat } from '../common/BaseCard.vue'
import { useAutomaticGroups } from './useAutomaticGroups'

defineProps<{
  module: DashboardModule
}>()

// Emit für Navigation
defineEmits<{
  navigate: []
}>()

const { groups, loading, error, fetchAutomaticGroups } = useAutomaticGroups()

const totalGroups = computed(() => groups.value.length)

const successfulGroups = computed(
  () => groups.value.filter((group) => group.executionStatus === 'success').length
)

const errorGroups = computed(
  () => groups.value.filter((group) => group.executionStatus === 'error').length
)

const pendingGroups = computed(
  () =>
    groups.value.filter(
      (group) =>
        group.executionStatus === 'pending' ||
        group.executionStatus === 'running' ||
        group.executionStatus === 'unknown'
    ).length
)

// BaseCard computed properties
const mainStat = computed(
  (): MainStat => ({
    value: totalGroups.value,
    label: 'Automatische Gruppen',
  })
)

const formattedLastUpdate = computed(() => {
  if (groups.value.length === 0) return null

  try {
    const date = new Date()
    return date.toLocaleString('de-DE', {
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
    value: successfulGroups.value,
    label: 'Erfolgreich',
    type: 'success',
  },
  {
    icon: '❌',
    value: errorGroups.value,
    label: 'Fehler',
    type: 'error',
  },
  {
    icon: '⏳',
    value: pendingGroups.value,
    label: 'Ausstehend',
    type: 'warning',
  },
])

const refreshData = () => {
  fetchAutomaticGroups()
}



const loadMockData = () => {
  groups.value = [
    {
      id: 1,
      name: 'Jugendgruppe Automatisch',
      dynamicGroupStatus: 'active',
      lastExecution: '2025-09-07T10:30:00Z',
      executionStatus: 'success',
      dynamicGroupUpdateStarted: '2025-09-07T10:25:00Z',
      dynamicGroupUpdateFinished: '2025-09-07T10:30:00Z',
    },
    {
      id: 2,
      name: 'Neue Mitglieder',
      dynamicGroupStatus: 'active',
      lastExecution: '2025-09-07T08:15:00Z',
      executionStatus: 'success',
      dynamicGroupUpdateStarted: '2025-09-07T08:10:00Z',
      dynamicGroupUpdateFinished: '2025-09-07T08:15:00Z',
    },
    {
      id: 3,
      name: 'Inaktive Mitglieder',
      dynamicGroupStatus: 'inactive',
      lastExecution: '2025-09-06T22:00:00Z',
      executionStatus: 'error',
      dynamicGroupUpdateStarted: '2025-09-06T21:55:00Z',
      dynamicGroupUpdateFinished: '2025-09-06T22:00:00Z',
    },
    {
      id: 4,
      name: 'Geburtstage diese Woche',
      dynamicGroupStatus: 'active',
      lastExecution: null,
      executionStatus: 'pending',
      dynamicGroupUpdateStarted: null,
      dynamicGroupUpdateFinished: null,
    },
    {
      id: 5,
      name: 'Mitarbeiter Gottesdienst',
      dynamicGroupStatus: 'manual',
      lastExecution: '2025-09-07T11:45:00Z',
      executionStatus: 'running',
      dynamicGroupUpdateStarted: '2025-09-07T11:45:00Z',
      dynamicGroupUpdateFinished: null,
    },
  ]
  lastUpdate.value = new Date().toISOString()
  error.value = null
}

onMounted(() => {
  fetchAutomaticGroups()
})
</script>
