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
  systemErrors: 0,
  failedLogins: 0,
  emailsSent: 0,
  successfulLogins: 0,
})
const lastUpdate = ref<string | null>(null)

// Computed properties
const mainStat = computed(() => ({
  value: data.value.total,
  label: 'Log Einträge',
}))

const statusStats = computed(() => [
  {
    key: 'systemErrors',
    value: data.value.systemErrors,
    label: 'Systemfehler',
    icon: '🚨',
    type: 'error' as const,
  },
  {
    key: 'failedLogins',
    value: data.value.failedLogins,
    label: 'Login-Fehler',
    icon: '🔒',
    type: 'warning' as const,
  },
  {
    key: 'emailsSent',
    value: data.value.emailsSent,
    label: 'E-Mails',
    icon: '📧',
    type: 'info' as const,
  },
  {
    key: 'successfulLogins',
    value: data.value.successfulLogins,
    label: 'Anmeldungen',
    icon: '✅',
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

    // Simulate realistic log data for the last 24 hours
    const systemErrors = Math.floor(Math.random() * 5) + 1 // 1-5 system errors
    const failedLogins = Math.floor(Math.random() * 25) + 10 // 10-35 failed login attempts
    const emailsSent = Math.floor(Math.random() * 150) + 50 // 50-200 emails sent
    const successfulLogins = Math.floor(Math.random() * 200) + 100 // 100-300 successful logins
    const total = systemErrors + failedLogins + emailsSent + successfulLogins

    data.value = {
      total,
      systemErrors,
      failedLogins,
      emailsSent,
      successfulLogins,
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
    total: 287,
    systemErrors: 3,
    failedLogins: 18,
    emailsSent: 124,
    successfulLogins: 142,
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