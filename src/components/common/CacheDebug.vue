<template>
  <div class="cache-debug" v-if="isDevelopment">
    <div class="cache-status">
      <h4>🚀 Cache Status</h4>
      <div class="cache-stats">
        <div class="stat">
          <span class="label">Tags:</span>
          <span :class="getStatusClass(tagsStatus)">{{ tagsStatus }}</span>
          <span class="age">{{ formatAge(tagsAge) }}</span>
          <span class="count">{{ tagsCount }}</span>
        </div>
        <div class="stat">
          <span class="label">Termine:</span>
          <span :class="getStatusClass(appointmentsStatus)">{{ appointmentsStatus }}</span>
          <span class="age">{{ formatAge(appointmentsAge) }}</span>
          <span class="count">{{ appointmentsCount }}</span>
        </div>
        <div class="stat">
          <span class="label">Gruppen:</span>
          <span :class="getStatusClass(groupsStatus)">{{ groupsStatus }}</span>
          <span class="age">{{ formatAge(groupsAge) }}</span>
          <span class="count">{{ groupsCount }}</span>
        </div>
        <div class="stat">
          <span class="label">Logs:</span>
          <span :class="getStatusClass(logsStatus)">{{ logsStatus }}</span>
          <span class="age">{{ formatAge(logsAge) }}</span>
        </div>
      </div>
      <div class="cache-actions">
        <button @click="clearAllCache" class="ct-btn ct-btn-sm">Cache leeren</button>
        <button @click="invalidateAll" class="ct-btn ct-btn-sm">Neu laden</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useQueryClient } from '@tanstack/vue-query'

const isDevelopment = import.meta.env.MODE === 'development'
const queryClient = useQueryClient()

// Get cache status for each query
const tagsQuery = computed(() => queryClient.getQueryState(['tags']))
const appointmentsQuery = computed(() =>
  queryClient.getQueryState(['expiring-appointments', 300000])
)
const groupsQuery = computed(() => queryClient.getQueryState(['automatic-groups']))
const logsQuery = computed(() => queryClient.getQueryState(['logger-summary', 3]))

const tagsStatus = computed(() => {
  const query = tagsQuery.value
  if (!query) return 'Nicht geladen'
  if (query.isFetching) return 'Lädt...'
  if (query.status === 'error') return 'Fehler'
  if (query.status === 'success' && query.data) {
    return query.isStale ? 'Veraltet' : 'Frisch'
  }
  return 'Nicht geladen'
})

const appointmentsStatus = computed(() => {
  const query = appointmentsQuery.value
  if (!query) return 'Nicht geladen'
  if (query.isFetching) return 'Lädt...'
  if (query.status === 'error') return 'Fehler'
  if (query.status === 'success' && query.data) {
    return query.isStale ? 'Veraltet' : 'Frisch'
  }
  return 'Nicht geladen'
})

const groupsStatus = computed(() => {
  const query = groupsQuery.value
  if (!query) return 'Nicht geladen'
  if (query.isFetching) return 'Lädt...'
  if (query.status === 'error') return 'Fehler'
  if (query.status === 'success' && query.data) {
    return query.isStale ? 'Veraltet' : 'Frisch'
  }
  return 'Nicht geladen'
})

const tagsAge = computed(() => tagsQuery.value?.dataUpdatedAt || 0)
const appointmentsAge = computed(() => appointmentsQuery.value?.dataUpdatedAt || 0)
const groupsAge = computed(() => groupsQuery.value?.dataUpdatedAt || 0)
const logsAge = computed(() => logsQuery.value?.dataUpdatedAt || 0)

// Get data counts
const tagsCount = computed(() => {
  const data = queryClient.getQueryData(['tags'])
  return Array.isArray(data) ? `(${data.length})` : ''
})

const appointmentsCount = computed(() => {
  const data = queryClient.getQueryData(['expiring-appointments', 300000])
  return Array.isArray(data) ? `(${data.length})` : ''
})

const groupsCount = computed(() => {
  const data = queryClient.getQueryData(['automatic-groups'])
  return Array.isArray(data) ? `(${data.length})` : ''
})

const logsStatus = computed(() => {
  const query = logsQuery.value
  if (!query) return 'Nicht geladen'
  if (query.isFetching) return 'Lädt...'
  if (query.status === 'error') return 'Fehler'
  if (query.status === 'success' && query.data) {
    return query.isStale ? 'Veraltet' : 'Frisch'
  }
  return 'Nicht geladen'
})

const getStatusClass = (status: string) => {
  switch (status) {
    case 'Frisch':
      return 'status-fresh'
    case 'Veraltet':
      return 'status-stale'
    case 'Lädt...':
      return 'status-loading'
    default:
      return 'status-none'
  }
}

const formatAge = (timestamp: number) => {
  if (!timestamp) return ''
  const age = Date.now() - timestamp
  const seconds = Math.floor(age / 1000)
  const minutes = Math.floor(seconds / 60)

  if (minutes > 0) return `${minutes}m`
  return `${seconds}s`
}

const clearAllCache = () => {
  queryClient.clear()
  console.log('🗑️ Cache geleert')
}

const invalidateAll = () => {
  queryClient.invalidateQueries({ queryKey: ['tags'] })
  queryClient.invalidateQueries({ queryKey: ['expiring-appointments'] })
  queryClient.invalidateQueries({ queryKey: ['automatic-groups'] })
  queryClient.invalidateQueries({ queryKey: ['logger-summary'] })
  queryClient.invalidateQueries({ queryKey: ['user-statistics'] })
  console.log('🔄 Alle Queries werden neu geladen')
}
</script>

<style scoped>
.cache-debug {
  position: fixed;
  top: 10px;
  right: 10px;
  background: rgba(0, 0, 0, 0.9);
  color: white;
  padding: 12px;
  border-radius: 8px;
  font-size: 12px;
  z-index: 1000;
  min-width: 250px;
}

.cache-status h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
}

.cache-stats {
  margin-bottom: 8px;
}

.stat {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}

.label {
  font-weight: bold;
  min-width: 60px;
}

.status-fresh {
  color: #4ade80;
}
.status-stale {
  color: #fbbf24;
}
.status-loading {
  color: #60a5fa;
}
.status-none {
  color: #9ca3af;
}

.age {
  color: #9ca3af;
  font-size: 10px;
}

.cache-actions {
  display: flex;
  gap: 8px;
}

.ct-btn-sm {
  padding: 4px 8px;
  font-size: 10px;
}
</style>
