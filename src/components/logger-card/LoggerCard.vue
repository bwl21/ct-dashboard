<template>
  <BaseCard
    :title="'Logger System'"
    :icon="'📋'"
    :is-loading="isLoading"
    :error="error"
    :main-stat="mainStat"
    :status-stats="statusStats"
    :last-update="formattedLastUpdate"
    loading-text="Lade Logger-Daten..."
    retry-text="Mock-Daten laden"
    refresh-text="Aktualisieren"
    refreshing-text="Lädt..."
    details-text="Details anzeigen"
    last-update-text="Letzte Aktualisierung"
    @navigate="$emit('navigate')"
    @refresh="refreshData"
    @retry="loadMockData"
  />
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
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

// State
const isLoading = ref(false)
const error = ref<string | null>(null)
const data = ref({
  total: 0,
  info: 0,
  warning: 0,
  error: 0,
  debug: 0,
})
const lastUpdate = ref<string | null>(null)

// Computed properties
const mainStat = computed(() => ({
  value: data.value.total,
  label: 'Log Einträge',
}))

const statusStats = computed(() => [
  {
    key: 'info',
    value: data.value.info,
    label: 'Info',
    icon: 'ℹ️',
    type: 'info' as const,
  },
  {
    key: 'warning',
    value: data.value.warning,
    label: 'Warnungen',
    icon: '⚠️',
    type: 'warning' as const,
  },
  {
    key: 'error',
    value: data.value.error,
    label: 'Fehler',
    icon: '❌',
    type: 'error' as const,
  },
  {
    key: 'debug',
    value: data.value.debug,
    label: 'Debug',
    icon: '🔍',
    type: 'success' as const,
  },
])

const formattedLastUpdate = computed(() => {
  if (!lastUpdate.value) return ''
  return new Date(lastUpdate.value).toLocaleString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
})

// Simulate API call
const fetchData = async () => {
  isLoading.value = true
  error.value = null

  try {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1200))

    // Simulate random log data
    const total = Math.floor(Math.random() * 500) + 200
    const error = Math.floor(total * 0.05) // 5% errors
    const warning = Math.floor(total * 0.15) // 15% warnings
    const debug = Math.floor(total * 0.25) // 25% debug
    const info = total - error - warning - debug

    data.value = {
      total,
      info,
      warning,
      error,
      debug,
    }

    lastUpdate.value = new Date().toISOString()

    console.log('Logger-Daten geladen:', data.value)
  } catch (err) {
    console.error('Fehler beim Laden der Logger-Daten:', err)
    error.value = 'Fehler beim Laden der Logger-Daten'
  } finally {
    isLoading.value = false
  }
}

const loadMockData = () => {
  console.log('Lade Mock-Daten für Logger...')
  data.value = {
    total: 342,
    info: 205,
    warning: 85,
    error: 17,
    debug: 35,
  }
  lastUpdate.value = new Date().toISOString()
  error.value = null
}

const refreshData = () => {
  fetchData()
}

// Initialize component
onMounted(() => {
  // Start with mock data, then load real data
  loadMockData()
  setTimeout(() => {
    fetchData()
  }, 500)
})
</script>