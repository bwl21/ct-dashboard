import { ref, computed } from 'vue'
import { churchtoolsClient } from '@churchtools/churchtools-client'

// ChurchTools Log API Types
export interface ChurchToolsLogEntry {
  id: number
  date: string // ISO timestamp
  level: number // 1 = Warning, 2 = Notice, 3 = Info
  message: string
  domainType: string
  domainId: number
  personId: number // -1 = system
  simultePersonId?: number | null
}

// LogsApiResponse not needed - ChurchTools returns array directly

// Processed Log Entry for Dashboard
export interface ProcessedLogEntry {
  id: string
  level: 'info' | 'warning' | 'error' | 'success'
  category: 'system_error' | 'failed_login' | 'email_sent' | 'successful_login' | 'other'
  message: string
  details?: string
  source: string
  timestamp: string
  userId?: string
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

export function useLoggerCard() {
  // State
  const loading = ref(false)
  const error = ref<string | null>(null)
  const logs = ref<ProcessedLogEntry[]>([])
  const statistics = ref<LogStatistics>({
    total: 0,
    systemErrors: 0,
    failedLogins: 0,
    emailsSent: 0,
    successfulLogins: 0
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

    console.log('Fetching logs from ChurchTools API with pagination...')

    while (hasMorePages && allLogs.length < maxTotalLogs) {
      try {
        const params = new URLSearchParams()
        
        // Add filter parameters
        if (filter.message) params.append('message', filter.message)
        if (filter.levels?.length) {
          filter.levels.forEach(level => params.append('levels[]', level))
        }
        if (filter.before) params.append('before', filter.before)
        if (filter.after) params.append('after', filter.after)
        if (filter.personId) params.append('person_id', filter.personId.toString())
        
        // Pagination parameters
        params.append('page', currentPage.toString())
        params.append('limit', maxLogsPerRequest.toString())

        const url = `/logs?${params.toString()}`
        console.log(`Fetching page ${currentPage} from: ${url}`)

        const response = await churchtoolsClient.get<ChurchToolsLogEntry[]>(url)
        
        console.log(`API Response for page ${currentPage}:`, response)
        
        // ChurchTools client returns the logs array directly
        if (!Array.isArray(response)) {
          console.error('Expected array response, got:', typeof response, response)
          throw new Error('Expected array response from logs API')
        }
        
        console.log(`Page ${currentPage}: ${response.length} logs fetched`)
        allLogs.push(...response)

        // Since we get direct array, we can't know total pages
        // We continue until we get less than maxLogsPerRequest
        hasMorePages = response.length === maxLogsPerRequest

        currentPage++

        // Safety break
        if (currentPage > 50) {
          console.warn('Reached maximum page limit (50), stopping pagination')
          break
        }

        // Small delay to avoid overwhelming the API
        if (hasMorePages) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }

      } catch (err) {
        console.error(`Error fetching page ${currentPage}:`, err)
        if (currentPage === 1) {
          throw err // Throw error for first page
        }
        break // Stop pagination for subsequent pages
      }
    }

    console.log(`Total logs fetched: ${allLogs.length}`)
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
      days
    })
  }

  /**
   * Process ChurchTools logs into dashboard format
   */
  function processLogs(rawLogs: ChurchToolsLogEntry[]): ProcessedLogEntry[] {
    return rawLogs.map(log => {
      const processed: ProcessedLogEntry = {
        id: `ct-log-${log.id}`,
        level: mapLogLevel(log.level),
        category: categorizeLog(log),
        message: log.message,
        source: log.domainType || 'System',
        timestamp: log.date,
        originalLevel: log.level,
        domainType: log.domainType,
        domainId: log.domainId
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
      case 1: return 'warning' // Warning
      case 2: return 'info'    // Notice  
      case 3: return 'info'    // Info
      default: return 'info'
    }
  }

  /**
   * Categorize logs based on content and domain type
   */
  function categorizeLog(log: ChurchToolsLogEntry): ProcessedLogEntry['category'] {
    const message = log.message.toLowerCase()
    const domainType = log.domainType?.toLowerCase() || ''

    // System errors
    if (log.level === 1 || message.includes('error') || message.includes('fehler') || 
        message.includes('exception') || message.includes('failed') || 
        message.includes('timeout') || message.includes('connection')) {
      return 'system_error'
    }

    // Login related
    if (domainType === 'login' || message.includes('login') || message.includes('anmeld') ||
        message.includes('password') || message.includes('passwort') || 
        message.includes('authentication') || message.includes('session')) {
      
      if (message.includes('successful') || message.includes('erfolgreich') || 
          message.includes('logged in') || log.level === 3) {
        return 'successful_login'
      } else {
        return 'failed_login'
      }
    }

    // Email related
    if (domainType === 'mail' || domainType === 'email' || 
        message.includes('mail') || message.includes('email') ||
        message.includes('sent') || message.includes('versendet')) {
      return 'email_sent'
    }

    return 'other'
  }

  /**
   * Generate additional details for log entries
   */
  function generateLogDetails(log: ChurchToolsLogEntry): string | undefined {
    const details: string[] = []

    if (log.domainType && log.domainId) {
      details.push(`${log.domainType} ID: ${log.domainId}`)
    }

    if (log.simultePersonId) {
      details.push(`Simuliert von Person ID: ${log.simultePersonId}`)
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
      successfulLogins: 0
    }

    processedLogs.forEach(log => {
      switch (log.category) {
        case 'system_error':
          stats.systemErrors++
          break
        case 'failed_login':
          stats.failedLogins++
          break
        case 'email_sent':
          stats.emailsSent++
          break
        case 'successful_login':
          stats.successfulLogins++
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
      console.log(`Loading log statistics for last ${days} days...`)
      
      const rawLogs = await getLogsLastDays(days)
      const processedLogs = processLogs(rawLogs)
      
      statistics.value = calculateStatistics(processedLogs)
      lastUpdate.value = new Date().toISOString()
      
      console.log('Log statistics loaded:', statistics.value)
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
    return logs.filter(log => log.category === category)
  }

  /**
   * Filter logs by search term
   */
  function filterLogsBySearch(logs: ProcessedLogEntry[], searchTerm: string): ProcessedLogEntry[] {
    if (!searchTerm || searchTerm.trim() === '') return logs
    
    const term = searchTerm.toLowerCase().trim()
    return logs.filter(log => 
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
      console.log(`Loading detailed logs for last ${days} days...`)
      
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
      
      console.log(`Detailed logs loaded: ${filteredLogs.length} entries`)
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
    filterLogsBySearch
  }
}