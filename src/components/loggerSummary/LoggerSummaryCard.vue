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
    details-text="Details"
    last-update-text="Letzte Aktualisierung"
    @navigate="handleNavigate"
    @refresh="refreshData"
    @retry="handleRetry"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import BaseCard from '../common/BaseCard.vue'
import {
  useLoggerSummary,
  LogCategory,
  getCategoryDisplayName,
  getCategoryIcon,
} from '@/composables/useLoggerSummaryQuery'

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

// Use TanStack Query for data fetching with caching
const {
  data: statistics,
  isLoading,
  error,
  refetch,
  isFetching,
  dataUpdatedAt,
} = useLoggerSummary(3) // Load last 3 days

// Computed properties
const mainStat = computed(() => ({
  value: statistics.value?.total || 0,
  label: 'Einträge',
}))

const statusStats = computed(() => {
  if (!statistics.value) {
    return [
      {
        key: 'systemErrors',
        value: 0,
        label: getCategoryDisplayName(LogCategory.SYSTEM_ERROR),
        icon: getCategoryIcon(LogCategory.SYSTEM_ERROR),
        type: 'error' as const,
      },
      {
        key: 'failedLogins',
        value: 0,
        label: getCategoryDisplayName(LogCategory.FAILED_LOGIN),
        icon: getCategoryIcon(LogCategory.FAILED_LOGIN),
        type: 'warning' as const,
      },
      {
        key: 'emailsSent',
        value: 0,
        label: getCategoryDisplayName(LogCategory.EMAIL_SENT),
        icon: getCategoryIcon(LogCategory.EMAIL_SENT),
        type: 'info' as const,
      },
      {
        key: 'successfulLogins',
        value: 0,
        label: getCategoryDisplayName(LogCategory.SUCCESSFUL_LOGIN),
        icon: getCategoryIcon(LogCategory.SUCCESSFUL_LOGIN),
        type: 'success' as const,
      },
      {
        key: 'personViewed',
        value: 0,
        label: getCategoryDisplayName(LogCategory.PERSON_VIEWED),
        icon: getCategoryIcon(LogCategory.PERSON_VIEWED),
        type: 'info' as const,
      },
    ]
  }

  return [
    {
      key: 'systemErrors',
      value: statistics.value.systemErrors,
      label: getCategoryDisplayName(LogCategory.SYSTEM_ERROR),
      icon: getCategoryIcon(LogCategory.SYSTEM_ERROR),
      type: 'error' as const,
    },
    {
      key: 'failedLogins',
      value: statistics.value.failedLogins,
      label: getCategoryDisplayName(LogCategory.FAILED_LOGIN),
      icon: getCategoryIcon(LogCategory.FAILED_LOGIN),
      type: 'warning' as const,
    },
    {
      key: 'emailsSent',
      value: statistics.value.emailsSent,
      label: getCategoryDisplayName(LogCategory.EMAIL_SENT),
      icon: getCategoryIcon(LogCategory.EMAIL_SENT),
      type: 'info' as const,
    },
    {
      key: 'successfulLogins',
      value: statistics.value.successfulLogins,
      label: getCategoryDisplayName(LogCategory.SUCCESSFUL_LOGIN),
      icon: getCategoryIcon(LogCategory.SUCCESSFUL_LOGIN),
      type: 'success' as const,
    },
    {
      key: 'personViewed',
      value: statistics.value.personViewed,
      label: getCategoryDisplayName(LogCategory.PERSON_VIEWED),
      icon: getCategoryIcon(LogCategory.PERSON_VIEWED),
      type: 'info' as const,
    },
  ]
})

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

// Methods
const refreshData = () => {
  refetch()
}

const handleNavigate = () => {
  emit('navigate')
}

const handleRetry = () => {
  refetch()
}
</script>
