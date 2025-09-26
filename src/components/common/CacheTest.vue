<template>
  <div class="cache-test" v-if="isDevelopment">
    <h3>🧪 Cache Test</h3>

    <div class="test-section">
      <h4>Tags Query</h4>
      <p>Loading: {{ tagsLoading }}</p>
      <p>Data: {{ tagsData ? `${tagsData.length} tags` : 'No data' }}</p>
      <p>Updated: {{ formatTime(tagsUpdatedAt) }}</p>
      <button @click="refetchTags" class="ct-btn ct-btn-sm">Refetch</button>
    </div>

    <div class="test-section">
      <h4>Appointments Query</h4>
      <p>Loading: {{ appointmentsLoading }}</p>
      <p>Data: {{ appointmentsData ? `${appointmentsData.length} appointments` : 'No data' }}</p>
      <p>Updated: {{ formatTime(appointmentsUpdatedAt) }}</p>
      <button @click="refetchAppointments" class="ct-btn ct-btn-sm">Refetch</button>
    </div>

    <div class="test-section">
      <h4>Groups Query</h4>
      <p>Loading: {{ groupsLoading }}</p>
      <p>Data: {{ groupsData ? `${groupsData.length} groups` : 'No data' }}</p>
      <p>Updated: {{ formatTime(groupsUpdatedAt) }}</p>
      <button @click="refetchGroups" class="ct-btn ct-btn-sm">Refetch</button>
    </div>

    <div class="test-section">
      <h4>Logs Query (Summary)</h4>
      <p>Loading: {{ logsLoading }}</p>
      <p>Data: {{ logsData ? `${logsData.total} total logs` : 'No data' }}</p>
      <p>Updated: {{ formatTime(logsUpdatedAt) }}</p>
      <button @click="refetchLogs" class="ct-btn ct-btn-sm">Refetch</button>
    </div>

    <div class="test-section">
      <h4>Logs Bulk Cache</h4>
      <p>Loading: {{ bulkLogsLoading }}</p>
      <p>
        Data: {{ bulkLogsData ? `${bulkLogsData.processedLogs.length} detailed logs` : 'No data' }}
      </p>
      <p>Updated: {{ formatTime(bulkLogsUpdatedAt) }}</p>
      <p v-if="bulkLogsData?.wasLimited" class="limited">
        ⚠️ Limited to {{ bulkLogsData.actualDays }} days
      </p>
      <button @click="refetchBulkLogs" class="ct-btn ct-btn-sm">Refetch</button>
    </div>

    <div class="test-section">
      <h4>Manual Cache Check</h4>
      <button @click="checkCache" class="ct-btn ct-btn-sm">Check Cache</button>
      <pre>{{ cacheInfo }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useTags } from '@/composables/useTags'
import { useExpiringAppointments } from '@/composables/useExpiringAppointments'
import { useAutomaticGroups } from '@/composables/useAutomaticGroups'
import { useLoggerSummary } from '@/composables/useLoggerSummaryQuery'
import { useLoggerBulkCache } from '@/composables/useLoggerBulkCache'
import { useQueryClient } from '@tanstack/vue-query'

const isDevelopment = import.meta.env.MODE === 'development'

// Use all cached queries
const {
  data: tagsData,
  isLoading: tagsLoading,
  error: tagsError,
  refetch: refetchTags,
  dataUpdatedAt: tagsUpdatedAt,
} = useTags()

const {
  data: appointmentsData,
  isLoading: appointmentsLoading,
  refetch: refetchAppointments,
  dataUpdatedAt: appointmentsUpdatedAt,
} = useExpiringAppointments()

const {
  data: groupsData,
  isLoading: groupsLoading,
  refetch: refetchGroups,
  dataUpdatedAt: groupsUpdatedAt,
} = useAutomaticGroups()

const {
  data: logsData,
  isLoading: logsLoading,
  refetch: refetchLogs,
  dataUpdatedAt: logsUpdatedAt,
} = useLoggerSummary(3)

// Bulk logs cache test - call directly in setup
const {
  data: bulkLogsData,
  isLoading: bulkLogsLoading,
  refetch: refetchBulkLogs,
  dataUpdatedAt: bulkLogsUpdatedAt,
} = useLoggerBulkCache(3)

const queryClient = useQueryClient()
const cacheInfo = ref('')

const formatTime = (timestamp: number | undefined) => {
  if (!timestamp) return 'Never'
  return new Date(timestamp).toLocaleTimeString()
}

const checkCache = () => {
  const allQueries = queryClient.getQueryCache().getAll()
  const tagsQuery = queryClient.getQueryState(['tags'])
  const appointmentsQuery = queryClient.getQueryState(['expiring-appointments', 300000])
  const groupsQuery = queryClient.getQueryState(['automatic-groups'])
  const logsQuery = queryClient.getQueryState(['logger-summary', 3])

  cacheInfo.value = JSON.stringify(
    {
      totalQueries: allQueries.length,
      queries: {
        tags: tagsQuery
          ? {
              status: tagsQuery.status,
              hasData: !!tagsQuery.data,
              dataCount: Array.isArray(tagsQuery.data) ? tagsQuery.data.length : 0,
            }
          : 'Not found',
        appointments: appointmentsQuery
          ? {
              status: appointmentsQuery.status,
              hasData: !!appointmentsQuery.data,
              dataCount: Array.isArray(appointmentsQuery.data) ? appointmentsQuery.data.length : 0,
            }
          : 'Not found',
        groups: groupsQuery
          ? {
              status: groupsQuery.status,
              hasData: !!groupsQuery.data,
              dataCount: Array.isArray(groupsQuery.data) ? groupsQuery.data.length : 0,
            }
          : 'Not found',
        logs: logsQuery
          ? {
              status: logsQuery.status,
              hasData: !!logsQuery.data,
              dataTotal: logsQuery.data?.total || 0,
            }
          : 'Not found',
        bulkLogs: queryClient.getQueryState(['logs-bulk', 3])
          ? {
              status: queryClient.getQueryState(['logs-bulk', 3])?.status,
              hasData: !!queryClient.getQueryState(['logs-bulk', 3])?.data,
              dataCount:
                queryClient.getQueryState(['logs-bulk', 3])?.data?.processedLogs?.length || 0,
            }
          : 'Not found',
      },
    },
    null,
    2
  )

  console.log('Cache check:', {
    allQueries: allQueries.map((q) => ({ queryKey: q.queryKey, status: q.state.status })),
    individual: { tagsQuery, appointmentsQuery, groupsQuery, logsQuery },
  })
}

// Auto-check cache on mount
setTimeout(checkCache, 1000)
</script>

<style scoped>
.cache-test {
  position: fixed;
  bottom: 10px;
  right: 10px;
  background: rgba(0, 0, 0, 0.9);
  color: white;
  padding: 12px;
  border-radius: 8px;
  font-size: 11px;
  z-index: 999;
  max-width: 300px;
  max-height: 400px;
  overflow-y: auto;
}

.test-section {
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #333;
}

.test-section h4 {
  margin: 0 0 4px 0;
  font-size: 12px;
  color: #60a5fa;
}

.test-section p {
  margin: 2px 0;
}

pre {
  font-size: 9px;
  background: #111;
  padding: 4px;
  border-radius: 4px;
  overflow-x: auto;
  max-height: 100px;
}

.ct-btn-sm {
  padding: 2px 6px;
  font-size: 10px;
  margin: 2px;
}

.limited {
  color: #fbbf24;
  font-size: 10px;
  font-weight: bold;
}
</style>
