import { useQuery } from '@tanstack/vue-query'
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
  simulatePersonId?: number | null
}

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

// Statistics for Dashboard Card
export interface LogStatistics {
  total: number
  systemErrors: number
  failedLogins: number
  emailsSent: number
  successfulLogins: number
  personViewed: number
}

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
    condition: and(levelIs(1), domainTypeIs('system')),
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

export const getCategoryDisplayName = (category: LogCategory) =>
  getCategoryRule(category)?.ui.displayName || category

export const getCategoryIcon = (category: LogCategory) => getCategoryRule(category)?.ui.icon || 'ℹ️'

/**
 * Categorize logs based on priority-ordered rules
 */
function categorizeLog(log: ChurchToolsLogEntry): LogCategory {
  const matchingRules = CATEGORIZATION_RULES.filter((rule) => rule.condition(log)).sort(
    (a, b) => b.priority - a.priority
  )

  return matchingRules.length > 0 ? matchingRules[0].category : LogCategory.OTHER
}

/**
 * Calculate statistics from logs
 */
function calculateStatistics(logs: ChurchToolsLogEntry[]): LogStatistics {
  const stats: LogStatistics = {
    total: logs.length,
    systemErrors: 0,
    failedLogins: 0,
    emailsSent: 0,
    successfulLogins: 0,
    personViewed: 0,
  }

  logs.forEach((log) => {
    const category = categorizeLog(log)
    switch (category) {
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
 * Fetch logs from ChurchTools API for the last N days
 */
async function fetchLogStatistics(
  days: number = 3
): Promise<LogStatistics & { wasLimited: boolean }> {
  const after = new Date()
  after.setDate(after.getDate() - days)

  const allLogs: ChurchToolsLogEntry[] = []
  let currentPage = 1
  let hasMorePages = true
  const maxLogsPerRequest = 100
  const maxTotalLogs = 1500 // Safety limit increased to 1500

  while (hasMorePages && allLogs.length < maxTotalLogs) {
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

    if (currentPage > 50) break // Safety break

    if (hasMorePages) {
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
  }

  const stats = calculateStatistics(allLogs)
  return {
    ...stats,
    wasLimited: allLogs.length >= maxTotalLogs && hasMorePages,
  }
}

export function useLoggerSummary(days: number = 3) {
  return useQuery({
    queryKey: ['logger-summary', days],
    queryFn: () => fetchLogStatistics(days),
    staleTime: 20 * 1000, // 20 seconds - for page reload cache
    gcTime: 5 * 60 * 1000, // 5 minutes cache time
    refetchInterval: 60 * 1000, // Background update every minute
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })
}
