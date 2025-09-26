import { useQuery } from '@tanstack/vue-query'
import { computed, ref, isRef, type Ref, type ComputedRef } from 'vue'
import { churchtoolsClient } from '@churchtools/churchtools-client'

// Re-export types from the original composable
export {
  LogCategory,
  getCategoryDisplayName,
  getCategoryIcon,
  getCategoryCssClass,
  getAllCategories,
  type ProcessedLogEntry,
  type LogStatistics,
  type ChurchToolsLogEntry,
} from '../components/loggerSummary/useLoggerSummary'

import type {
  ChurchToolsLogEntry,
  ProcessedLogEntry,
  LogStatistics,
  LogCategory,
} from '../components/loggerSummary/useLoggerSummary'

import { LogCategory as LogCategoryEnum } from '../components/loggerSummary/useLoggerSummary'

/**
 * Fetch ALL logs for a given time period (bulk approach)
 * This loads everything once and caches it, then we do client-side pagination
 * Automatically limits to 5000 entries and adjusts time period if needed
 */
async function fetchAllLogs(requestedDays: number = 3): Promise<{
  logs: ChurchToolsLogEntry[]
  processedLogs: ProcessedLogEntry[]
  statistics: LogStatistics
  actualDays: number
  wasLimited: boolean
  limitReason?: string
}> {
  console.log(`📋 Fetching ALL logs for last ${requestedDays} days...`)

  const MAX_LOGS = 5000 // Hard limit for performance
  const maxLogsPerRequest = 100

  let actualDays = requestedDays
  let wasLimited = false
  let limitReason = ''

  const allLogs: ChurchToolsLogEntry[] = []
  let currentPage = 1
  let hasMorePages = true

  // Fetch ALL pages in one go, but stop at MAX_LOGS
  while (hasMorePages && allLogs.length < MAX_LOGS) {
    const after = new Date()
    after.setDate(after.getDate() - actualDays)

    const params = new URLSearchParams()
    params.append('after', after.toISOString())
    params.append('page', currentPage.toString())
    params.append('limit', maxLogsPerRequest.toString())

    const url = `/logs?${params.toString()}`
    const response = await churchtoolsClient.get<ChurchToolsLogEntry[]>(url)

    if (!Array.isArray(response)) {
      throw new Error('Expected array response from logs API')
    }

    allLogs.push(...response)
    hasMorePages = response.length === maxLogsPerRequest
    currentPage++

    // Check if we're approaching the limit
    if (allLogs.length >= MAX_LOGS) {
      wasLimited = true
      limitReason = `Zu viele Log-Einträge für ${requestedDays} Tage. Zeige die neuesten ${MAX_LOGS} Einträge.`
      break
    }

    if (currentPage > 100) break // Safety limit

    // Small delay to avoid overwhelming the API
    if (hasMorePages) {
      await new Promise((resolve) => setTimeout(resolve, 50))
    }
  }

  // If we hit the limit, try to find a better time period
  if (wasLimited && requestedDays > 1) {
    // Calculate how many days we actually got data for
    if (allLogs.length > 0) {
      const oldestLog = allLogs[allLogs.length - 1]
      const oldestDate = new Date(oldestLog.date)
      const now = new Date()
      actualDays = Math.ceil((now.getTime() - oldestDate.getTime()) / (1000 * 60 * 60 * 24))

      if (actualDays < requestedDays) {
        limitReason = `Zeitraum auf ${actualDays} Tage reduziert (${allLogs.length} von max. ${MAX_LOGS} Einträgen).`
      }
    }
  }

  console.log(
    `📋 Loaded ${allLogs.length} logs in ${currentPage - 1} API calls${wasLimited ? ' (LIMITED)' : ''}`
  )

  // Process logs with proper categorization
  const processedLogs: ProcessedLogEntry[] = allLogs.map((log) => {
    const category = categorizeLog(log)

    return {
      id: `ct-log-${log.id}`,
      level: mapLogLevelByCategory(log.level, category),
      category: category,
      message: log.message,
      source: log.domainType || 'System',
      timestamp: log.date,
      originalLevel: log.level,
      domainType: log.domainType,
      domainId: log.domainId,
      personId: log.personId,
      simulatePersonId: log.simulatePersonId,
      details: generateLogDetails(log),
    }
  })

  // Calculate statistics using processed logs
  const statistics: LogStatistics = {
    total: processedLogs.length,
    systemErrors: processedLogs.filter((log) => log.originalLevel === 1).length,
    failedLogins: processedLogs.filter((log) =>
      log.message.toLowerCase().includes('username or password')
    ).length,
    emailsSent: processedLogs.filter((log) => log.message.toLowerCase().includes('mail')).length,
    successfulLogins: processedLogs.filter((log) =>
      log.message.toLowerCase().includes('erfolgreich angemeldet')
    ).length,
    personViewed: processedLogs.filter((log) =>
      log.message.toLowerCase().includes('getpersondetails')
    ).length,
  }

  return {
    logs: allLogs,
    processedLogs,
    statistics,
    actualDays,
    wasLimited,
    limitReason,
  }
}

// Log categorization rules (simplified version)
const CATEGORIZATION_RULES = [
  {
    category: LogCategoryEnum.FAILED_LOGIN,
    priority: 100,
    condition: (log: ChurchToolsLogEntry) =>
      log.message.toLowerCase().includes('username or password') &&
      log.domainType?.toLowerCase().includes('login'),
  },
  {
    category: LogCategoryEnum.SUCCESSFUL_LOGIN,
    priority: 90,
    condition: (log: ChurchToolsLogEntry) =>
      log.message.toLowerCase().includes('erfolgreich angemeldet') &&
      log.domainType?.toLowerCase().includes('login'),
  },
  {
    category: LogCategoryEnum.SYSTEM_ERROR,
    priority: 80,
    condition: (log: ChurchToolsLogEntry) =>
      log.level === 1 && log.domainType?.toLowerCase().includes('system'),
  },
  {
    category: LogCategoryEnum.EMAIL_SENT,
    priority: 70,
    condition: (log: ChurchToolsLogEntry) =>
      (log.domainType?.toLowerCase().includes('mail') ||
        log.message.toLowerCase().includes('mail')) &&
      log.message.toLowerCase().includes('speichere mail an'),
  },
  {
    category: LogCategoryEnum.PERSON_VIEWED,
    priority: 60,
    condition: (log: ChurchToolsLogEntry) =>
      log.level === 3 && log.message.toLowerCase().includes('getpersondetails'),
  },
]

function categorizeLog(log: ChurchToolsLogEntry): LogCategory {
  const matchingRules = CATEGORIZATION_RULES.filter((rule) => rule.condition(log)).sort(
    (a, b) => b.priority - a.priority
  )

  return matchingRules.length > 0 ? matchingRules[0].category : LogCategoryEnum.OTHER
}

function mapLogLevel(level: number): 'info' | 'warning' | 'error' | 'success' {
  switch (level) {
    case 1:
      return 'error'
    case 2:
      return 'info'
    case 3:
      return 'info'
    default:
      return 'info'
  }
}

function mapLogLevelByCategory(
  originalLevel: number,
  category: LogCategory
): 'info' | 'warning' | 'error' | 'success' {
  switch (category) {
    case LogCategoryEnum.SYSTEM_ERROR:
      return 'error'
    case LogCategoryEnum.FAILED_LOGIN:
      return 'warning'
    case LogCategoryEnum.EMAIL_SENT:
      return 'info'
    case LogCategoryEnum.SUCCESSFUL_LOGIN:
      return 'success'
    case LogCategoryEnum.PERSON_VIEWED:
      return 'info'
    default:
      return mapLogLevel(originalLevel)
  }
}

function generateLogDetails(log: ChurchToolsLogEntry): string | undefined {
  const details: string[] = []

  if (log.domainType && log.domainId) {
    details.push(`${log.domainType} ID: ${log.domainId}`)
  }

  if (log.simulatePersonId) {
    details.push(`Simuliert von Person ID: ${log.simulatePersonId}`)
  }

  if (log.personId === -1) {
    details.push('System-generiert')
  }

  return details.length > 0 ? details.join(' | ') : undefined
}

/**
 * Bulk cache approach: Load all logs once, paginate client-side
 * Automatically limits to 5000 entries and shows toast if limited
 */
export function useLoggerBulkCache(days: Ref<number> | number = 3) {
  // Handle both reactive and static days parameter
  const daysRef = isRef(days) ? days : ref(days)

  const query = useQuery({
    queryKey: computed(() => ['logs-bulk', daysRef.value]),
    queryFn: () => fetchAllLogs(daysRef.value),
    staleTime: 20 * 1000, // 20 seconds - for page reload cache
    gcTime: 15 * 60 * 1000, // 15 minutes cache time
    refetchInterval: 2 * 60 * 1000, // Background update every 2 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })

  return {
    // Raw query data
    ...query,

    // Convenience accessors
    allLogs: computed(() => query.data.value?.logs || []),
    processedLogs: computed(() => query.data.value?.processedLogs || []),
    statistics: computed(
      () =>
        query.data.value?.statistics || {
          total: 0,
          systemErrors: 0,
          failedLogins: 0,
          emailsSent: 0,
          successfulLogins: 0,
          personViewed: 0,
        }
    ),

    // Limitation info
    actualDays: computed(() => query.data.value?.actualDays || daysRef.value),
    wasLimited: computed(() => query.data.value?.wasLimited || false),
    limitReason: computed(() => query.data.value?.limitReason || ''),
  }
}

/**
 * Client-side pagination helper
 */
export function usePaginatedLogs(
  allLogs: Ref<ProcessedLogEntry[]> | ComputedRef<ProcessedLogEntry[]>,
  pageSize: number = 50
) {
  const currentPage = ref(1)

  const totalPages = computed(() => Math.ceil(allLogs.value.length / pageSize))

  const paginatedLogs = computed(() => {
    const start = (currentPage.value - 1) * pageSize
    const end = start + pageSize
    return allLogs.value.slice(start, end)
  })

  const hasNextPage = computed(() => currentPage.value < totalPages.value)
  const hasPrevPage = computed(() => currentPage.value > 1)

  const nextPage = () => {
    if (hasNextPage.value) currentPage.value++
  }

  const prevPage = () => {
    if (hasPrevPage.value) currentPage.value--
  }

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages.value) {
      currentPage.value = page
    }
  }

  return {
    currentPage,
    totalPages,
    paginatedLogs,
    hasNextPage,
    hasPrevPage,
    nextPage,
    prevPage,
    goToPage,
    pageSize,
  }
}
