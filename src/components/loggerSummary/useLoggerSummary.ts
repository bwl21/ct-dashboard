import { ref, computed } from 'vue'
import { churchtoolsClient } from '@churchtools/churchtools-client'

// ChurchTools Log API Types (raw from API)
export interface ChurchToolsLogEntry {
  id: number
  date: string // ISO timestamp
  level: number // 1 = Warning, 2 = Notice, 3 = Info
  message: string
  domainType: string
  domainId: number
  personId: number // -1 = system
  simulatePersonId?: number | null // NOTE: OpenAPI spec has typo "simultePersonId" but API actually returns "simulatePersonId"
}

// LogsApiResponse not needed - ChurchTools returns array directly

// Log Categories
export const LogCategory = {
  SYSTEM_ERROR: 'system_error',
  FAILED_LOGIN: 'failed_login',
  EMAIL_SENT: 'email_sent',
  SUCCESSFUL_LOGIN: 'successful_login',
  PERSON_VIEWED: 'person_viewed',
  OTHER: 'other',
} as const

export type LogCategory = (typeof LogCategory)[keyof typeof LogCategory]

// Category Rule Interface
export interface CategoryRule {
  category: LogCategory
  priority: number
  condition: (log: ChurchToolsLogEntry) => boolean
  description: string
  ui: {
    displayName: string
    icon: string
    cssClass: string
  }
}

// Processed Log Entry for Dashboard (using correct naming internally)
export interface ProcessedLogEntry {
  id: string
  level: 'info' | 'warning' | 'error' | 'success'
  category: LogCategory
  message: string
  details?: string
  source: string
  timestamp: string
  userId?: string
  personId: number
  simulatePersonId?: number | null // Correct spelling used internally
  originalLevel: number
  domainType: string
  domainId: number
}

// Statistics for Dashboard Card
export interface LogStatistics {
  total: number
  systemErrors: number
  failedLogins: number
  emailsSent: number
  successfulLogins: number
  personViewed: number
}

// Filter Options
export interface LogFilter {
  message?: string
  levels?: string[]
  before?: string
  after?: string
  personId?: number
  category?: string
  days?: number
}

// Helper functions for categorization conditions
const messageIncludes =
  (...keywords: string[]) =>
  (log: ChurchToolsLogEntry) => {
    const message = log.message.toLowerCase()
    return keywords.some((keyword) => message.includes(keyword.toLowerCase()))
  }

const domainTypeIs =
  (...types: string[]) =>
  (log: ChurchToolsLogEntry) => {
    const domainType = log.domainType?.toLowerCase() || ''
    return types.some((type) => domainType.includes(type.toLowerCase()))
  }

const levelIs = (level: number) => (log: ChurchToolsLogEntry) => log.level === level

const and =
  (...conditions: ((log: ChurchToolsLogEntry) => boolean)[]) =>
  (log: ChurchToolsLogEntry) =>
    conditions.every((condition) => condition(log))

const or =
  (...conditions: ((log: ChurchToolsLogEntry) => boolean)[]) =>
  (log: ChurchToolsLogEntry) =>
    conditions.some((condition) => condition(log))

// Categorization Rules (sorted by priority)
const CATEGORIZATION_RULES: CategoryRule[] = [
  {
    category: LogCategory.FAILED_LOGIN,
    priority: 100,
    condition: and(messageIncludes('Username or password'), domainTypeIs('login')),
    description: 'Fehlgeschlagene Login-Versuche',
    ui: {
      displayName: 'Login-Fehler',
      icon: '🔒',
      cssClass: 'category-warning',
    },
  },

  {
    category: LogCategory.SUCCESSFUL_LOGIN,
    priority: 90,
    condition: and(messageIncludes('Erfolgreich angemeldet'), domainTypeIs('login')),
    description: 'Erfolgreiche Anmeldungen',
    ui: {
      displayName: 'Anmeldungen',
      icon: '✅',
      cssClass: 'category-success',
    },
  },

  {
    category: LogCategory.SYSTEM_ERROR,
    priority: 80,
    condition: and(
      levelIs(1), // Warning-Level,
      domainTypeIs('system')
    ),
    description: 'Systemfehler und Exceptions',
    ui: {
      displayName: 'Systemfehler',
      icon: '🚨',
      cssClass: 'category-error',
    },
  },

  {
    category: LogCategory.EMAIL_SENT,
    priority: 70,
    condition: and(
      or(domainTypeIs('mail', 'email'), messageIncludes('mail', 'email')),
      messageIncludes('Speichere Mail an')
    ),
    description: 'Versendete E-Mails',
    ui: {
      displayName: 'E-Mails',
      icon: '📧',
      cssClass: 'category-info',
    },
  },

  {
    category: LogCategory.PERSON_VIEWED,
    priority: 60,
    condition: and(levelIs(3), messageIncludes('getpersondetails')),
    description: 'Angesehene Personen',
    ui: {
      displayName: 'Personen angesehen',
      icon: '👤',
      cssClass: 'category-info',
    },
  },

  {
    category: LogCategory.OTHER,
    priority: 10,
    condition: () => false, // Fallback - always matches
    description: 'Sonstige Log-Einträge',
    ui: {
      displayName: 'Sonstige',
      icon: 'ℹ️',
      cssClass: 'category-neutral',
    },
  },
]

// Helper functions for UI mappings
export const getCategoryRule = (category: LogCategory) =>
  CATEGORIZATION_RULES.find((rule) => rule.category === category)

export const getAllCategories = () => CATEGORIZATION_RULES.map((rule) => rule.category)

export const getCategoryDisplayName = (category: LogCategory) =>
  getCategoryRule(category)?.ui.displayName || category

export const getCategoryIcon = (category: LogCategory) => getCategoryRule(category)?.ui.icon || 'ℹ️'

export const getCategoryCssClass = (category: LogCategory) =>
  getCategoryRule(category)?.ui.cssClass || 'category-neutral'

// Helper function is no longer needed since API uses correct spelling

export function useLoggerSummary() {
  // State
  const loading = ref(false)
  const error = ref<string | null>(null)
  const logs = ref<ProcessedLogEntry[]>([])
  const statistics = ref<LogStatistics>({
    total: 0,
    systemErrors: 0,
    failedLogins: 0,
    emailsSent: 0,
    successfulLogins: 0,
    personViewed: 0,
  })
  const lastUpdate = ref<string | null>(null)
  const loadingProgress = ref<{ current: number; total: number } | null>(null)

  // Test API call removed

  /**
   * Fetch logs from ChurchTools API with pagination
   */
  async function fetchLogsFromAPI(filter: LogFilter = {}): Promise<ChurchToolsLogEntry[]> {
    const allLogs: ChurchToolsLogEntry[] = []
    let currentPage = 1
    let hasMorePages = true
    const maxLogsPerRequest = 100 // ChurchTools API limit
    const maxTotalLogs = 1000 // Safety limit

    while (hasMorePages && allLogs.length < maxTotalLogs) {
      try {
        const params = new URLSearchParams()

        // Add filter parameters
        if (filter.message) params.append('message', filter.message)
        if (filter.levels?.length) {
          filter.levels.forEach((level) => params.append('levels[]', level))
        }
        if (filter.before) params.append('before', filter.before)
        if (filter.after) params.append('after', filter.after)
        if (filter.personId) params.append('person_id', filter.personId.toString())

        // Pagination parameters
        params.append('page', currentPage.toString())
        params.append('limit', maxLogsPerRequest.toString())

        const url = `/logs?${params.toString()}`
        const response = await churchtoolsClient.get<ChurchToolsLogEntry[]>(url)

        // ChurchTools client returns the logs array directly
        if (!Array.isArray(response)) {
          console.error('Expected array response, got:', typeof response, response)
          throw new Error('Expected array response from logs API')
        }

        allLogs.push(...response)

        // Since we get direct array, we can't know total pages
        // We continue until we get less than maxLogsPerRequest
        hasMorePages = response.length === maxLogsPerRequest

        currentPage++

        // Safety break
        if (currentPage > 50) {
          break
        }

        // Small delay to avoid overwhelming the API
        if (hasMorePages) {
          await new Promise((resolve) => setTimeout(resolve, 100))
        }
      } catch (err) {
        console.error(`Error fetching page ${currentPage}:`, err)
        if (currentPage === 1) {
          throw err // Throw error for first page
        }
        break // Stop pagination for subsequent pages
      }
    }

    loadingProgress.value = null // Clear progress
    return allLogs
  }

  /**
   * Get logs for the last N days
   */
  async function getLogsLastDays(days: number = 3): Promise<ChurchToolsLogEntry[]> {
    const after = new Date()
    after.setDate(after.getDate() - days)

    return fetchLogsFromAPI({
      after: after.toISOString(),
      days,
    })
  }

  /**
   * Process ChurchTools logs into dashboard format
   */
  function processLogs(rawLogs: ChurchToolsLogEntry[]): ProcessedLogEntry[] {
    return rawLogs.map((log) => {
      const category = categorizeLog(log)

      const processed: ProcessedLogEntry = {
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
        simulatePersonId: log.simulatePersonId, // API correctly uses simulatePersonId
      }

      // Add user information
      if (log.personId && log.personId !== -1) {
        processed.userId = log.personId.toString()
      }

      // Add details
      processed.details = generateLogDetails(log)

      return processed
    })
  }

  /**
   * Map ChurchTools log levels to our levels
   */
  function mapLogLevel(level: number): ProcessedLogEntry['level'] {
    switch (level) {
      case 1:
        return 'error' // Warning -> Error (for system errors)
      case 2:
        return 'info' // Notice
      case 3:
        return 'info' // Info
      default:
        return 'info'
    }
  }

  /**
   * Map log level based on category for better visual representation
   * Note: Level is only used for categorization support, not for display
   */
  function mapLogLevelByCategory(
    originalLevel: number,
    category: LogCategory
  ): ProcessedLogEntry['level'] {
    switch (category) {
      case LogCategory.SYSTEM_ERROR:
        return 'error'
      case LogCategory.FAILED_LOGIN:
        return 'warning'
      case LogCategory.EMAIL_SENT:
        return 'info'
      case LogCategory.SUCCESSFUL_LOGIN:
        return 'success'
      case LogCategory.PERSON_VIEWED:
        return 'info'
      case LogCategory.OTHER:
      default:
        return mapLogLevel(originalLevel)
    }
  }

  /**
   * Categorize logs based on priority-ordered rules
   */
  function categorizeLog(log: ChurchToolsLogEntry): LogCategory {
    // Find all matching rules and sort by priority
    const matchingRules = CATEGORIZATION_RULES.filter((rule) => rule.condition(log)).sort(
      (a, b) => b.priority - a.priority
    )

    // Optional: Logging for debugging
    if (process.env.NODE_ENV === 'development' && matchingRules.length > 1) {
      console.log(
        `Log "${log.message}" matches multiple rules:`,
        matchingRules.map((r) => `${r.category} (${r.priority})`)
      )
    }

    return matchingRules.length > 0 ? matchingRules[0].category : LogCategory.OTHER
  }

  /**
   * Generate additional details for log entries
   */
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
   * Calculate statistics from processed logs
   */
  function calculateStatistics(processedLogs: ProcessedLogEntry[]): LogStatistics {
    const stats: LogStatistics = {
      total: processedLogs.length,
      systemErrors: 0,
      failedLogins: 0,
      emailsSent: 0,
      successfulLogins: 0,
      personViewed: 0,
    }

    processedLogs.forEach((log) => {
      switch (log.category) {
        case LogCategory.SYSTEM_ERROR:
          stats.systemErrors++
          break
        case LogCategory.FAILED_LOGIN:
          stats.failedLogins++
          break
        case LogCategory.EMAIL_SENT:
          stats.emailsSent++
          break
        case LogCategory.SUCCESSFUL_LOGIN:
          stats.successfulLogins++
          break
        case LogCategory.PERSON_VIEWED:
          stats.personViewed++
          break
      }
    })

    return stats
  }

  /**
   * Load logs and statistics for dashboard card
   */
  async function loadLogStatistics(days: number = 3): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const rawLogs = await getLogsLastDays(days)
      const processedLogs = processLogs(rawLogs)

      statistics.value = calculateStatistics(processedLogs)
      lastUpdate.value = new Date().toISOString()
    } catch (err) {
      console.error('Error loading log statistics:', err)
      error.value = 'Fehler beim Laden der Log-Statistiken von ChurchTools'

      // Reset statistics to empty state
      statistics.value = {
        total: 0,
        systemErrors: 0,
        failedLogins: 0,
        emailsSent: 0,
        successfulLogins: 0,
        personViewed: 0,
      }
    } finally {
      loading.value = false
    }
  }

  /**
   * Filter logs by category
   */
  function filterLogsByCategory(logs: ProcessedLogEntry[], category: string): ProcessedLogEntry[] {
    if (!category || category === '') return logs
    return logs.filter((log) => log.category === category)
  }

  /**
   * Filter logs by search term
   */
  function filterLogsBySearch(logs: ProcessedLogEntry[], searchTerm: string): ProcessedLogEntry[] {
    if (!searchTerm || searchTerm.trim() === '') return logs

    const term = searchTerm.toLowerCase().trim()
    return logs.filter(
      (log) =>
        log.message.toLowerCase().includes(term) ||
        log.source.toLowerCase().includes(term) ||
        log.details?.toLowerCase().includes(term) ||
        log.userId?.includes(term)
    )
  }

  /**
   * Load detailed logs for admin interface
   */
  async function loadDetailedLogs(days: number = 3, filter: LogFilter = {}): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const rawLogs = await getLogsLastDays(days)
      const processedLogs = processLogs(rawLogs)

      // Apply additional filters
      let filteredLogs = processedLogs

      if (filter.category) {
        filteredLogs = filterLogsByCategory(filteredLogs, filter.category)
      }

      if (filter.message) {
        filteredLogs = filterLogsBySearch(filteredLogs, filter.message)
      }

      logs.value = filteredLogs
      statistics.value = calculateStatistics(processedLogs) // Stats from all logs
      lastUpdate.value = new Date().toISOString()
    } catch (err) {
      console.error('Error loading detailed logs:', err)
      error.value = 'Fehler beim Laden der detaillierten Logs von ChurchTools'

      // Reset to empty state
      logs.value = []
      statistics.value = {
        total: 0,
        systemErrors: 0,
        failedLogins: 0,
        emailsSent: 0,
        successfulLogins: 0,
        personViewed: 0,
      }
    } finally {
      loading.value = false
    }
  }

  // Computed properties
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

  return {
    // State
    loading,
    error,
    logs,
    statistics,
    lastUpdate,
    loadingProgress,

    // Computed
    formattedLastUpdate,

    // Methods
    loadLogStatistics,
    loadDetailedLogs,
    processLogs,
    calculateStatistics,
    filterLogsByCategory,
    filterLogsBySearch,
  }
}
