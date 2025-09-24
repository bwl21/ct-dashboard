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
import { ref, onMounted, computed } from 'vue'
import { churchtoolsClient } from '@churchtools/churchtools-client'
import BaseCard from '../common/BaseCard.vue'

// Tag interface based on ChurchTools API
interface Tag {
  id: number
  name: string
  description?: string
  color?: string
  domainType: 'person' | 'song' | 'group'
}

// API Response is directly an array of tags
type TagsApiResponse = Tag[]

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
    // Fetch tags from different domains using modern API endpoints
    const [personTags, songTags, groupTags] = await Promise.allSettled([
      churchtoolsClient.get<TagsApiResponse>('/tags/person').catch(() => []),
      churchtoolsClient.get<TagsApiResponse>('/tags/song').catch(() => []),
      churchtoolsClient.get<TagsApiResponse>('/tags/group').catch(() => []),
    ])

    const allTags: Tag[] = []

    // Process person tags
    if (personTags.status === 'fulfilled' && personTags.value) {
      const personTagsData = Array.isArray(personTags.value) ? personTags.value : []
      allTags.push(...personTagsData.map((tag: any) => ({ ...tag, domainType: 'person' as const })))
    }

    // Process song tags
    if (songTags.status === 'fulfilled' && songTags.value) {
      const songTagsData = Array.isArray(songTags.value) ? songTags.value : []
      allTags.push(...songTagsData.map((tag: any) => ({ ...tag, domainType: 'song' as const })))
    }

    // Process group tags
    if (groupTags.status === 'fulfilled' && groupTags.value) {
      const groupTagsData = Array.isArray(groupTags.value) ? groupTags.value : []
      allTags.push(...groupTagsData.map((tag: any) => ({ ...tag, domainType: 'group' as const })))
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