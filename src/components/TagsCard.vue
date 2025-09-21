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
    details-text="Details anzeigen"
    last-update-text="Letzte Aktualisierung"
    @navigate="$emit('navigate')"
    @refresh="refreshData"
    @retry="refreshData"
  />
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { churchtoolsClient } from '@churchtools/churchtools-client'
import BaseCard from './BaseCard.vue'

// Tag interface based on ct-labelmanager structure
interface Tag {
  id: number
  name: string
  description?: string
  color?: string
  domainType: 'person' | 'song' | 'group' | 'appointment'
}

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
const isLoading = ref(true)
const error = ref<string | null>(null)
const lastUpdate = ref<Date | null>(null)

// Data
const tags = ref<Tag[]>([])

// Computed properties
const personTagsCount = computed(() => {
  return tags.value.filter((tag) => tag.domainType === 'person').length
})

const songTagsCount = computed(() => {
  return tags.value.filter((tag) => tag.domainType === 'song').length
})

const groupTagsCount = computed(() => {
  return tags.value.filter((tag) => tag.domainType === 'group').length
})

const appointmentTagsCount = computed(() => {
  return tags.value.filter((tag) => tag.domainType === 'appointment').length
})

const mainStat = computed(() => ({
  value: tags.value.length,
  label: 'Tags gesamt',
}))

const statusStats = computed(() => [
  {
    key: 'person',
    value: personTagsCount.value,
    label: 'Personen',
    icon: '👤',
    type: 'info' as const,
  },
  {
    key: 'song',
    value: songTagsCount.value,
    label: 'Lieder',
    icon: '🎵',
    type: 'success' as const,
  },
  {
    key: 'group',
    value: groupTagsCount.value,
    label: 'Gruppen',
    icon: '👥',
    type: 'warning' as const,
  },
  {
    key: 'appointment',
    value: appointmentTagsCount.value,
    label: 'Termine',
    icon: '📅',
    type: 'error' as const,
  },
])

const formattedLastUpdate = computed(() => {
  if (!lastUpdate.value) return ''
  return lastUpdate.value.toLocaleString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
})

// Fetch data from ChurchTools API
const fetchData = async () => {
  isLoading.value = true
  error.value = null

  try {
    // Fetch tags from different domains
    const [personTags, songTags, groupTags, appointmentTags] = await Promise.allSettled([
      churchtoolsClient.get('/api/tags', { params: { domain_type: 'person' } }).catch(() => ({ data: [] })),
      churchtoolsClient.get('/api/tags', { params: { domain_type: 'song' } }).catch(() => ({ data: [] })),
      churchtoolsClient.get('/api/tags', { params: { domain_type: 'group' } }).catch(() => ({ data: [] })),
      churchtoolsClient.get('/api/tags', { params: { domain_type: 'appointment' } }).catch(() => ({ data: [] })),
    ])

    const allTags: Tag[] = []

    // Process person tags
    if (personTags.status === 'fulfilled' && personTags.value?.data) {
      const personTagsData = Array.isArray(personTags.value.data) ? personTags.value.data : personTags.value.data.data || []
      allTags.push(...personTagsData.map((tag: any) => ({ ...tag, domainType: 'person' as const })))
    }

    // Process song tags
    if (songTags.status === 'fulfilled' && songTags.value?.data) {
      const songTagsData = Array.isArray(songTags.value.data) ? songTags.value.data : songTags.value.data.data || []
      allTags.push(...songTagsData.map((tag: any) => ({ ...tag, domainType: 'song' as const })))
    }

    // Process group tags
    if (groupTags.status === 'fulfilled' && groupTags.value?.data) {
      const groupTagsData = Array.isArray(groupTags.value.data) ? groupTags.value.data : groupTags.value.data.data || []
      allTags.push(...groupTagsData.map((tag: any) => ({ ...tag, domainType: 'group' as const })))
    }

    // Process appointment tags
    if (appointmentTags.status === 'fulfilled' && appointmentTags.value?.data) {
      const appointmentTagsData = Array.isArray(appointmentTags.value.data) ? appointmentTags.value.data : appointmentTags.value.data.data || []
      allTags.push(...appointmentTagsData.map((tag: any) => ({ ...tag, domainType: 'appointment' as const })))
    }

    tags.value = allTags
    lastUpdate.value = new Date()
  } catch (err) {
    console.error('Error fetching tags:', err)
    error.value = 'Fehler beim Laden der Tags. Bitte versuchen Sie es erneut.'
  } finally {
    isLoading.value = false
  }
}

// Refresh data
const refreshData = () => {
  fetchData()
}

// Initialize component
onMounted(() => {
  fetchData()
})
</script>