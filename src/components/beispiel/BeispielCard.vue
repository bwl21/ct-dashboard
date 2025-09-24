<template>
  <BaseCard
    :title="'Beispiel Modul'"
    :icon="'🎯'"
    :is-loading="isLoading"
    :error="error"
    :main-stat="mainStat"
    :status-stats="statusStats"
    :last-update="formattedLastUpdate"
    loading-text="Lade Beispieldaten..."
    retry-text="Mock-Daten laden"
    refresh-text="Aktualisieren"
    refreshing-text="Lädt..."
    details-text="Details"
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
  active: 0,
  pending: 0,
  completed: 0,
  errors: 0,
})
const lastUpdate = ref<string | null>(null)

// Computed properties
const mainStat = computed(() => ({
  value: data.value.total,
  label: 'Beispiel Einträge',
}))

const statusStats = computed(() => [
  {
    key: 'active',
    value: data.value.active,
    label: 'Aktiv',
    icon: '🟢',
    type: 'success' as const,
  },
  {
    key: 'pending',
    value: data.value.pending,
    label: 'Wartend',
    icon: '🟡',
    type: 'warning' as const,
  },
  {
    key: 'completed',
    value: data.value.completed,
    label: 'Erledigt',
    icon: '✅',
    type: 'info' as const,
  },
  {
    key: 'errors',
    value: data.value.errors,
    label: 'Fehler',
    icon: '🔴',
    type: 'error' as const,
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
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // Simulate random data
    const total = Math.floor(Math.random() * 100) + 50
    const active = Math.floor(total * 0.6)
    const pending = Math.floor(total * 0.2)
    const completed = Math.floor(total * 0.15)
    const errors = total - active - pending - completed

    data.value = {
      total,
      active,
      pending,
      completed,
      errors,
    }

    lastUpdate.value = new Date().toISOString()

    // Beispieldaten geladen
  } catch (err) {
    console.error('Fehler beim Laden der Beispieldaten:', err)
    error.value = 'Fehler beim Laden der Beispieldaten'
  } finally {
    isLoading.value = false
  }
}

const loadMockData = () => {
  // Lade Mock-Daten für Beispiel
  data.value = {
    total: 75,
    active: 45,
    pending: 15,
    completed: 12,
    errors: 3,
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
