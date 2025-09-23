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
    @navigate="handleNavigate"
    @refresh="refreshData"
    @retry="handleRetry"
  />
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import BaseCard from '../common/BaseCard.vue'
import { useLoggerSummary } from './useLoggerSummary'

// Props
defineProps<{
  module: {
    id: string
    title: string
    icon: string
    description: string
  }
}>()

const emit = defineEmits<{
  navigate: []
}>()

// Use composable
const { 
  loading: isLoading, 
  error, 
  statistics, 
  formattedLastUpdate,
  loadLogStatistics 
} = useLoggerSummary()

// Computed properties
const mainStat = computed(() => ({
  value: statistics.value.total,
  label: 'Log Einträge',
}))

const statusStats = computed(() => [
  {
    key: 'systemErrors',
    value: statistics.value.systemErrors,
    label: 'Systemfehler',
    icon: '🚨',
    type: 'error' as const,
  },
  {
    key: 'failedLogins',
    value: statistics.value.failedLogins,
    label: 'Login-Fehler',
    icon: '🔒',
    type: 'warning' as const,
  },
  {
    key: 'emailsSent',
    value: statistics.value.emailsSent,
    label: 'E-Mails',
    icon: '📧',
    type: 'info' as const,
  },
  {
    key: 'successfulLogins',
    value: statistics.value.successfulLogins,
    label: 'Anmeldungen',
    icon: '✅',
    type: 'success' as const,
  },
])

// formattedLastUpdate is provided by the composable

// Methods
const refreshData = () => {
  loadLogStatistics(3) // Load last 3 days
}

const handleNavigate = () => {
  emit('navigate')
}

const handleRetry = () => {
  loadLogStatistics(3)
}

// Initialize component
onMounted(() => {
  loadLogStatistics(3) // Load statistics for last 3 days
})
</script>