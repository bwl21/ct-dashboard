# API-Dokumentation

## 📅 auslaufende Terminserien API

### Übersicht

Die auslaufende Terminserien API ermöglicht das Abrufen und Verwalten von Terminserien, die bald ablaufen oder bereits abgelaufen sind.

### Endpoints

#### `findExpiringSeries(days?: number)`

Findet alle Terminserien, die in den nächsten X Tagen ablaufen.

**Parameter:**

- `days` (optional): Anzahl der Tage im Voraus (Standard: 90)

**Rückgabe:**

```typescript
interface Appointment {
  id: number
  base: {
    title: string
    startDate: string
    repeatUntil?: string
    repeatId?: number
    calendar: {
      id: number
      name: string
      color: string
    }
    additionals?: Array<{
      startDate: string
      date: string
    }>
  }
}
```

**Beispiel:**

```typescript
import { findExpiringSeries } from "@/services/churchtools"

// Termine der nächsten 30 Tage
const appointments = await findExpiringSeries(30)

// Alle auslaufenden Termine
const allAppointments = await findExpiringSeries()
```

#### `identifyCalendars()`

Identifiziert alle verfügbaren Kalender und kategorisiert sie.

**Rückgabe:**

```typescript
interface CalendarInfo {
  publicCalendars: Array<{
    id: number
    name: string
    color: string
    isPublic: boolean
  }>
  privateCalendars: Array<{
    id: number
    name: string
    color: string
    isPrivate: boolean
  }>
}
```

**Beispiel:**

```typescript
const { publicCalendars, privateCalendars } = await identifyCalendars()
console.log(`${publicCalendars.length} öffentliche Kalender gefunden`)
```

### Datenstrukturen

#### Appointment (Basis)

```typescript
interface AppointmentBase {
  id: number
  title: string
  startDate: string
  endDate: string
  allDay: boolean
  repeatId?: number
  repeatUntil?: string
  calendar: Calendar
  additionals?: AppointmentAdditionals[]
  exceptions?: AppointmentExceptions[]
}
```

#### Appointment (Berechnet)

```typescript
interface AppointmentCalculated {
  id: number
  base: AppointmentBase
  startDate: string
  endDate: string
}
```

#### Calendar

```typescript
interface Calendar {
  id: number
  name: string
  nameTranslated: string
  color: string
  isPublic: boolean
  isPrivate: boolean
  sortKey: number
}
```

### Filter-Logik

#### Status-Bestimmung

```typescript
type AppointmentStatus = "active" | "expiring" | "expired"

function getAppointmentStatus(appointment: Appointment): AppointmentStatus {
  const now = new Date()
  const endDate = getEffectiveEndDate(appointment)

  if (!endDate) return "active"

  const daysUntilEnd = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  if (endDate < now) return "expired"
  if (daysUntilEnd <= 30) return "expiring"
  return "active"
}
```

#### Effektives Enddatum

```typescript
function getEffectiveEndDate(appointment: Appointment): Date | null {
  // 1. Prüfe repeatUntil
  if (appointment.base.repeatUntil) {
    return new Date(appointment.base.repeatUntil)
  }

  // 2. Prüfe manuelle Wiederholungen (additionals)
  if (appointment.base.additionals?.length > 0) {
    const latestAdditional = appointment.base.additionals
      .map((additional) => new Date(additional.startDate || additional.date))
      .filter((date) => !isNaN(date.getTime()))
      .sort((a, b) => b.getTime() - a.getTime())[0]

    return latestAdditional || null
  }

  return null
}
```

## ⚙️ Automatische Gruppen API

### Übersicht

Die Automatische Gruppen API ermöglicht das Monitoring und Verwalten von automatischen Gruppenmitgliedschaften.

### Endpoints

#### `fetchAutomaticGroups()`

Lädt alle Gruppen mit automatischer Mitgliedschaftsverwaltung.

**Rückgabe:**

```typescript
interface AutomaticGroup {
  id: number
  name: string
  dynamicGroupStatus: DynamicGroupStatus
  lastExecution: string | null
  executionStatus: "success" | "error" | "running" | "pending" | "unknown"
  dynamicGroupUpdateStarted: string | null
  dynamicGroupUpdateFinished: string | null
}
```

**Beispiel:**

```typescript
const groups = await fetchAutomaticGroups()
const activeGroups = groups.filter((g) => g.dynamicGroupStatus === "active")
```

### Datenstrukturen

#### Group (Basis)

```typescript
interface Group {
  id: number
  name: string
  settings?: {
    dynamicGroupStatus?: DynamicGroupStatus
    dynamicGroupUpdateStarted?: string
    dynamicGroupUpdateFinished?: string
  }
}
```

#### DynamicGroupStatus

```typescript
type DynamicGroupStatus = "active" | "inactive" | "manual" | "none"
```

#### Ausführungsstatus-Bestimmung

```typescript
function determineExecutionStatus(group: Group): AutomaticGroup["executionStatus"] {
  const started = group.settings?.dynamicGroupUpdateStarted
  const finished = group.settings?.dynamicGroupUpdateFinished

  if (!started && !finished) return "pending"
  if (started && !finished) return "running"
  if (started && finished) {
    const startedDate = new Date(started)
    const finishedDate = new Date(finished)
    if (startedDate > finishedDate) return "running"
    return "success"
  }

  return "unknown"
}
```

## 🔧 ChurchTools Client Integration

### Basis-Konfiguration

```typescript
import { churchtoolsClient } from "@churchtools/churchtools-client"

// Client ist automatisch konfiguriert für ChurchTools-Umgebung
// Authentifizierung erfolgt über ChurchTools-Session
```

### Error Handling

```typescript
interface ApiError {
  response?: {
    status: number
    statusText: string
    data?: any
  }
  message: string
}

function handleApiError(error: ApiError): string {
  if (error.response) {
    switch (error.response.status) {
      case 401:
        return "Nicht authentifiziert. Bitte melden Sie sich an."
      case 403:
        return "Keine Berechtigung für diese Aktion."
      case 404:
        return "Ressource nicht gefunden."
      case 429:
        return "Zu viele Anfragen. Bitte warten Sie einen Moment."
      case 500:
        return "Serverfehler. Bitte versuchen Sie es später erneut."
      default:
        return `HTTP ${error.response.status}: ${error.response.statusText}`
    }
  }

  return error.message || "Ein unbekannter Fehler ist aufgetreten."
}
```

### Pagination

```typescript
async function fetchAllGroups(): Promise<Group[]> {
  let allGroups: Group[] = []
  let page = 1
  const limit = 100
  let hasMore = true

  while (hasMore) {
    const response = await churchtoolsClient.get(`/groups?limit=${limit}&page=${page}`)

    let pageGroups: Group[] = []
    if (Array.isArray(response)) {
      pageGroups = response
    } else if (response?.data && Array.isArray(response.data)) {
      pageGroups = response.data
    }

    if (pageGroups.length === 0) {
      hasMore = false
    } else {
      allGroups = allGroups.concat(pageGroups)
      if (pageGroups.length < limit) {
        hasMore = false
      } else {
        page++
        if (page > 100) break // Safety limit
      }
    }
  }

  return allGroups
}
```

## 🎯 BaseCard API

### Props Interface

```typescript
interface BaseCardProps {
  // Basis-Informationen
  title: string
  icon: string

  // Status
  isLoading?: boolean
  error?: string | null

  // Daten
  mainStat: MainStat
  statusStats: StatusStat[]
  lastUpdate?: string

  // Texte (optional)
  loadingText?: string
  retryText?: string
  refreshText?: string
  refreshingText?: string
  detailsText?: string
  lastUpdateText?: string
}
```

### Events Interface

```typescript
interface BaseCardEvents {
  navigate: [] // Navigation zu Detail-Ansicht
  refresh: [] // Daten neu laden
  retry: [] // Erneut versuchen (bei Fehlern)
}
```

### Slots

```typescript
interface BaseCardSlots {
  actions?: () => any // Zusätzliche Action-Buttons
  "error-actions"?: () => any // Buttons im Fehlerfall
}
```

### Verwendung

```vue
<template>
  <BaseCard
    :title="'Mein Modul'"
    :icon="'🎯'"
    :is-loading="loading"
    :error="error"
    :main-stat="{ value: 42, label: 'Gesamt' }"
    :status-stats="[
      { key: 'active', value: 30, label: 'Aktiv', icon: '✅', type: 'success' },
      { key: 'inactive', value: 12, label: 'Inaktiv', icon: '⏸️', type: 'warning' },
    ]"
    :last-update="'20.09.2025, 14:30'"
    loading-text="Lade Daten..."
    retry-text="Erneut versuchen"
    refresh-text="Aktualisieren"
    details-text="Details anzeigen"
    @refresh="loadData"
    @navigate="goToAdmin"
    @retry="loadData"
  >
    <!-- Zusätzliche Buttons -->
    <template #actions>
      <button class="ct-btn ct-btn-outline">Export</button>
    </template>
  </BaseCard>
</template>
```

## 📊 Filter & Sortierung API

### Filter-Interface

```typescript
interface FilterState {
  searchTerm: string
  calendarFilter: string
  statusFilter: string
  dateFilter: string
}

interface FilterOptions {
  calendars: Array<{ id: number; name: string }>
  statuses: Array<{ value: string; label: string }>
  dateRanges: Array<{ value: string; label: string }>
}
```

### Sortierung-Interface

```typescript
interface SortState {
  field: string
  direction: "asc" | "desc"
}

type SortableField = "id" | "title" | "calendar" | "startDate" | "repeatUntil"
```

### Filter-Implementierung

```typescript
const filteredData = computed(() => {
  let result = rawData.value

  // Textsuche
  if (filters.searchTerm) {
    const term = filters.searchTerm.toLowerCase().trim()
    result = result.filter(
      (item) =>
        item.id.toString().includes(term) ||
        item.title.toLowerCase().includes(term) ||
        item.calendar?.name?.toLowerCase().includes(term)
    )
  }

  // Kalender-Filter
  if (filters.calendarFilter) {
    const calendarId = parseInt(filters.calendarFilter)
    result = result.filter((item) => item.calendar?.id === calendarId)
  }

  // Status-Filter
  if (filters.statusFilter) {
    result = result.filter((item) => getItemStatus(item) === filters.statusFilter)
  }

  return result
})
```

### Sortier-Implementierung

```typescript
const sortedData = computed(() => {
  const sorted = [...filteredData.value]

  sorted.sort((a, b) => {
    let aVal: any
    let bVal: any

    switch (sortState.field) {
      case "id":
        aVal = parseInt(a.id)
        bVal = parseInt(b.id)
        break
      case "title":
        aVal = a.title
        bVal = b.title
        break
      case "startDate":
        aVal = new Date(a.startDate)
        bVal = new Date(b.startDate)
        break
      default:
        aVal = a[sortState.field]
        bVal = b[sortState.field]
    }

    let comparison = 0
    if (aVal < bVal) comparison = -1
    if (aVal > bVal) comparison = 1

    return sortState.direction === "asc" ? comparison : -comparison
  })

  return sorted
})
```

## 🔗 URL-Generierung

### ChurchTools-Links

```typescript
function getAppointmentUrl(appointment: Appointment): string {
  const baseUrl = import.meta.env.VITE_BASE_URL || window.location.origin
  const startDate = appointment.base.startDate.split("T")[0]
  return `${baseUrl}?q=churchcal&startdate=${startDate}#CalView/`
}

function getGroupUrl(groupId: number): string {
  const baseUrl = import.meta.env.VITE_BASE_URL || window.location.origin
  return `${baseUrl}?q=churchdb&id=${groupId}#GroupView/`
}

function getPersonUrl(personId: number): string {
  const baseUrl = import.meta.env.VITE_BASE_URL || window.location.origin
  return `${baseUrl}?q=churchdb&id=${personId}#PersonView/`
}
```

## 🚨 Error Codes

### API Error Codes

| Code | Bedeutung             | Behandlung                |
| ---- | --------------------- | ------------------------- |
| 400  | Bad Request           | Eingabe validieren        |
| 401  | Unauthorized          | Neu anmelden              |
| 403  | Forbidden             | Berechtigung prüfen       |
| 404  | Not Found             | Ressource existiert nicht |
| 429  | Too Many Requests     | Rate Limiting, warten     |
| 500  | Internal Server Error | Später erneut versuchen   |
| 502  | Bad Gateway           | Server-Problem            |
| 503  | Service Unavailable   | Wartung                   |

### Custom Error Types

```typescript
enum DashboardErrorType {
  NETWORK_ERROR = "NETWORK_ERROR",
  AUTHENTICATION_ERROR = "AUTHENTICATION_ERROR",
  PERMISSION_ERROR = "PERMISSION_ERROR",
  DATA_ERROR = "DATA_ERROR",
  VALIDATION_ERROR = "VALIDATION_ERROR",
}

interface DashboardError {
  type: DashboardErrorType
  message: string
  details?: any
  timestamp: Date
}
```

## 📈 Performance-Metriken

### Monitoring

```typescript
interface PerformanceMetrics {
  apiResponseTime: number
  renderTime: number
  dataSize: number
  filterTime: number
  sortTime: number
}

function measurePerformance<T>(fn: () => T, label: string): T {
  const start = performance.now()
  const result = fn()
  const end = performance.now()

  console.log(`${label}: ${end - start}ms`)
  return result
}
```

### Optimierung

```typescript
// Debounced Search
const debouncedSearch = debounce((term: string) => {
  searchTerm.value = term
}, 300)

// Memoized Computations
const memoizedFilter = useMemoize((data, filters) => {
  return applyFilters(data, filters)
})

// Virtual Scrolling für große Listen
const virtualizedData = computed(() => {
  const start = scrollTop.value / itemHeight
  const end = start + visibleCount.value
  return sortedData.value.slice(start, end)
})
```
