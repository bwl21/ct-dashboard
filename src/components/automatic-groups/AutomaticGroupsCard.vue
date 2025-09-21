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
    details-text="Details anzeigen"
    last-update-text="Letzte Aktualisierung"
    @refresh="refreshData"
    @navigate="$emit('navigate')"
    @retry="loadMockData"
  />
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { churchtoolsClient } from '@churchtools/churchtools-client'
import type { Group, DynamicGroupStatus } from '../ct-types'
import type { DashboardModule } from '../types/modules'
import BaseCard from '../common/BaseCard.vue'
import type { MainStat, StatusStat } from '../common/BaseCard.vue'

defineProps<{
  module: DashboardModule
}>()

// Emit für Navigation
defineEmits<{
  navigate: []
}>()

interface AutomaticGroup {
  id: number
  name: string
  dynamicGroupStatus: DynamicGroupStatus
  lastExecution: string | null
  executionStatus: 'success' | 'error' | 'running' | 'pending' | 'unknown'
  dynamicGroupUpdateStarted: string | null
  dynamicGroupUpdateFinished: string | null
}

const groups = ref<AutomaticGroup[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const lastUpdate = ref<string | null>(null)

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
  if (!lastUpdate.value) return null

  try {
    const date = new Date(lastUpdate.value)
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

const determineExecutionStatus = (group: Group): AutomaticGroup['executionStatus'] => {
  const started = group.settings?.dynamicGroupUpdateStarted
  const finished = group.settings?.dynamicGroupUpdateFinished

  if (!started && !finished) return 'pending'
  if (started && !finished) return 'running'
  if (started && finished) {
    const startedDate = new Date(started)
    const finishedDate = new Date(finished)
    if (startedDate > finishedDate) return 'running'
    return 'success'
  }

  return 'unknown'
}

const refreshData = async () => {
  loading.value = true
  error.value = null

  try {
    console.log('Fetching automatic groups for card...')

    let allGroups: Group[] = []
    let page = 1
    const limit = 100
    let hasMore = true

    while (hasMore) {
      const response = await churchtoolsClient.get(
        `/groups?include=settings&limit=${limit}&page=${page}`
      )

      let pageGroups: Group[] = []
      if (Array.isArray(response)) {
        pageGroups = response
      } else if (response && response.data && Array.isArray(response.data)) {
        pageGroups = response.data
      } else if (response && Array.isArray(response.groups)) {
        pageGroups = response.groups
      }

      if (pageGroups.length === 0) {
        hasMore = false
      } else {
        allGroups = allGroups.concat(pageGroups)
        if (pageGroups.length < limit) {
          hasMore = false
        } else {
          page++
          if (page > 100) break // Safety limit
        }
      }
    }

    // Filter for automatic groups
    const automaticGroups = allGroups
      .filter(
        (group) =>
          group.settings?.dynamicGroupStatus &&
          group.settings.dynamicGroupStatus !== 'none' &&
          group.settings.dynamicGroupStatus !== null
      )
      .map((group) => ({
        id: group.id,
        name: group.name || `Gruppe ${group.id}`,
        dynamicGroupStatus: group.settings?.dynamicGroupStatus || 'none',
        lastExecution: group.settings?.dynamicGroupUpdateFinished || null,
        executionStatus: determineExecutionStatus(group),
        dynamicGroupUpdateStarted: group.settings?.dynamicGroupUpdateStarted || null,
        dynamicGroupUpdateFinished: group.settings?.dynamicGroupUpdateFinished || null,
      }))

    groups.value = automaticGroups
    lastUpdate.value = new Date().toISOString()
    console.log(`Found ${automaticGroups.length} automatic groups`)
  } catch (err: any) {
    console.error('Error loading automatic groups:', err)
    error.value = 'Fehler beim Laden der automatischen Gruppen.'
  } finally {
    loading.value = false
  }
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
  refreshData()
})
</script>
