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

## 🏷️ Tags API

### Übersicht

Die Tags API ermöglicht vollständige CRUD-Operationen für ChurchTools-Tags mit Unterstützung für verschiedene Domains (Person, Song, Group).

### Endpoints

#### `GET /tags/{domain}`

Lädt alle Tags für eine spezifische Domain.

**Parameter:**

- `domain`: `'person' | 'song' | 'group'`

**Rückgabe:**

```typescript
interface Tag {
  id: number
  name: string
  description?: string
  color?: string
  domainType: "person" | "song" | "group"
}

type TagsResponse = Tag[]
```

**Beispiel:**

```typescript
// Alle Personen-Tags laden
const personTags = await churchtoolsClient.get<Tag[]>("/tags/person")

// Alle Song-Tags laden
const songTags = await churchtoolsClient.get<Tag[]>("/tags/song")

// Alle Gruppen-Tags laden
const groupTags = await churchtoolsClient.get<Tag[]>("/tags/group")
```

#### `POST /tags/{domain}`

Erstellt einen neuen Tag in der angegebenen Domain.

**Parameter:**

- `domain`: `'person' | 'song' | 'group'`

**Request Body:**

```typescript
interface CreateTagRequest {
  name: string
  description?: string
  color?: string
}
```

**Beispiel:**

```typescript
const newTag = await churchtoolsClient.post("/tags/person", {
  name: "Neuer Tag",
  description: "Beschreibung des Tags",
  color: "blue",
})
```

#### `PUT /tags/{id}`

Aktualisiert einen existierenden Tag.

**Parameter:**

- `id`: Tag-ID (number)

**Request Body:**

```typescript
interface UpdateTagRequest {
  name: string
  description: string
  color: string
}
```

**Beispiel:**

```typescript
await churchtoolsClient.put("/tags/123", {
  name: "Aktualisierter Name",
  description: "Neue Beschreibung",
  color: "red",
})
```

#### `DELETE /tags/{id}`

Löscht einen Tag.

**Parameter:**

- `id`: Tag-ID (number)

**Beispiel:**

```typescript
await churchtoolsClient.delete("/tags/123")
```

### Service-Implementierung

```typescript
// services/tagsService.ts
import { churchtoolsClient } from "@churchtools/churchtools-client"

export class TagsService {
  // Alle Tags laden
  static async fetchAllTags(): Promise<Tag[]> {
    const domains = ["person", "song", "group"] as const

    const tagPromises = domains.map(async (domain) => {
      try {
        const response = await churchtoolsClient.get<Tag[]>(`/tags/${domain}`)
        return response.map((tag) => ({ ...tag, domainType: domain }))
      } catch (err) {
        console.warn(`Failed to fetch ${domain} tags:`, err)
        return []
      }
    })

    const results = await Promise.all(tagPromises)
    return results.flat()
  }

  // Tag erstellen
  static async createTag(domain: TagDomain, tagData: CreateTagRequest): Promise<Tag> {
    return await churchtoolsClient.post(`/tags/${domain}`, tagData)
  }

  // Tag aktualisieren
  static async updateTag(tagId: number, tagData: UpdateTagRequest): Promise<Tag> {
    return await churchtoolsClient.put(`/tags/${tagId}`, tagData)
  }

  // Tag löschen
  static async deleteTag(tagId: number): Promise<void> {
    await churchtoolsClient.delete(`/tags/${tagId}`)
  }

  // Bulk-Update
  static async bulkUpdateTags(
    tagIds: number[],
    updates: Partial<UpdateTagRequest>
  ): Promise<{
    successCount: number
    errorCount: number
    errors: Array<{ tagId: number; error: string }>
  }> {
    let successCount = 0
    let errorCount = 0
    const errors: Array<{ tagId: number; error: string }> = []

    for (const tagId of tagIds) {
      try {
        await this.updateTag(tagId, updates as UpdateTagRequest)
        successCount++
      } catch (err) {
        errorCount++
        errors.push({ tagId, error: err.message })
      }
    }

    return { successCount, errorCount, errors }
  }

  // Bulk-Delete
  static async bulkDeleteTags(tagIds: number[]): Promise<{
    successCount: number
    errorCount: number
    errors: Array<{ tagId: number; error: string }>
  }> {
    let successCount = 0
    let errorCount = 0
    const errors: Array<{ tagId: number; error: string }> = []

    for (const tagId of tagIds) {
      try {
        await this.deleteTag(tagId)
        successCount++
      } catch (err) {
        errorCount++
        errors.push({ tagId, error: err.message })
      }
    }

    return { successCount, errorCount, errors }
  }
}
```

### Farb-Management

#### Verfügbare Farben

```typescript
interface ColorOption {
  value: string
  name: string
  hex: string
  tailwind?: string
}

const churchToolsColors: ColorOption[] = [
  // System Colors
  { value: "parent", name: "Parent", hex: "#6b7280", tailwind: "gray-500" },
  { value: "default", name: "Default", hex: "#6b7280", tailwind: "gray-500" },
  { value: "accent", name: "Accent", hex: "#007cba", tailwind: "custom" },
  { value: "basic", name: "Basic", hex: "#6b7280", tailwind: "gray-500" },

  // Standard Colors
  { value: "red", name: "Red", hex: "#dc2626", tailwind: "red-600" },
  { value: "blue", name: "Blue", hex: "#3b82f6", tailwind: "blue-500" },
  { value: "green", name: "Green", hex: "#16a34a", tailwind: "green-600" },
  { value: "yellow", name: "Yellow", hex: "#eab308", tailwind: "yellow-500" },
  { value: "purple", name: "Purple", hex: "#a855f7", tailwind: "purple-500" },
  { value: "pink", name: "Pink", hex: "#ec4899", tailwind: "pink-500" },
  { value: "orange", name: "Orange", hex: "#f97316", tailwind: "orange-500" },
  { value: "cyan", name: "Cyan", hex: "#06b6d4", tailwind: "cyan-500" },
  { value: "emerald", name: "Emerald", hex: "#10b981", tailwind: "emerald-500" },
  { value: "lime", name: "Lime", hex: "#84cc16", tailwind: "lime-500" },
  { value: "amber", name: "Amber", hex: "#f59e0b", tailwind: "amber-500" },
  { value: "teal", name: "Teal", hex: "#14b8a6", tailwind: "teal-500" },
  { value: "indigo", name: "Indigo", hex: "#6366f1", tailwind: "indigo-500" },
  { value: "violet", name: "Violet", hex: "#8b5cf6", tailwind: "violet-500" },
  { value: "fuchsia", name: "Fuchsia", hex: "#d946ef", tailwind: "fuchsia-500" },
  { value: "rose", name: "Rose", hex: "#f43f5e", tailwind: "rose-500" },
  { value: "sky", name: "Sky", hex: "#0ea5e9", tailwind: "sky-500" },
  { value: "gray", name: "Gray", hex: "#6b7280", tailwind: "gray-500" },
  { value: "black", name: "Black", hex: "#000000", tailwind: "black" },
  { value: "white", name: "White", hex: "#ffffff", tailwind: "white" },

  // Semantic Colors
  { value: "success", name: "Success", hex: "#16a34a", tailwind: "green-600" },
  { value: "warning", name: "Warning", hex: "#f59e0b", tailwind: "amber-500" },
  { value: "error", name: "Error", hex: "#dc2626", tailwind: "red-600" },
  { value: "info", name: "Info", hex: "#3b82f6", tailwind: "blue-500" },
  { value: "critical", name: "Critical", hex: "#dc2626", tailwind: "red-600" },
  { value: "constructive", name: "Constructive", hex: "#16a34a", tailwind: "green-600" },
  { value: "destructive", name: "Destructive", hex: "#dc2626", tailwind: "red-600" },
  { value: "danger", name: "Danger", hex: "#dc2626", tailwind: "red-600" },
  { value: "magic", name: "Magic", hex: "#8b5cf6", tailwind: "violet-500" },
]
```

#### Farb-Sortierung

```typescript
// Similarity-basierte Sortierung wie in ct-labelmanager
const getColorCategory = (colorValue: string): number => {
  // System colors (highest priority)
  if (["parent", "default", "basic"].includes(colorValue)) return 0
  // Grayscale colors
  if (["black", "gray", "white"].includes(colorValue)) return 1
  // Accent color
  if (colorValue === "accent") return 2
  // Regular colors
  return 3
}

const hexToHsl = (hex: string) => {
  // HSL conversion for color similarity
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0,
    s = 0,
    l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0)
        break
      case g:
        h = (b - r) / d + 2
        break
      case b:
        h = (r - g) / d + 4
        break
    }
    h /= 6
  }

  return { h: h * 360, s: s * 100, l: l * 100 }
}

const sortTagsByColor = (tags: Tag[]): Tag[] => {
  return tags.sort((a, b) => {
    const categoryA = getColorCategory(a.color || "")
    const categoryB = getColorCategory(b.color || "")

    // First sort by category
    if (categoryA !== categoryB) {
      return categoryA - categoryB
    }

    // Within same category, sort by hue
    const hslA = hexToHsl(getColorHex(a.color || ""))
    const hslB = hexToHsl(getColorHex(b.color || ""))

    return hslA.h - hslB.h
  })
}
```

### Filter & Sortierung

#### Regex-Filter

```typescript
const applyRegexFilter = (tags: Tag[], regexPattern: string): Tag[] => {
  if (!regexPattern.trim()) return tags

  try {
    const regex = new RegExp(regexPattern, "i")
    return tags.filter(
      (tag) =>
        regex.test(tag.name) || regex.test(tag.description || "") || regex.test(tag.domainType)
    )
  } catch (err) {
    console.error("Invalid regex pattern:", err)
    return tags
  }
}
```

#### Multi-Field Sortierung

```typescript
type SortField = "id" | "name" | "domainType" | "color" | "description"
type SortDirection = "asc" | "desc"

const sortTags = (tags: Tag[], field: SortField, direction: SortDirection = "asc"): Tag[] => {
  return [...tags].sort((a, b) => {
    let aValue: any = a[field]
    let bValue: any = b[field]

    // Handle null/undefined values
    if (aValue == null) aValue = ""
    if (bValue == null) bValue = ""

    // Special handling for color sorting
    if (field === "color") {
      return sortTagsByColor([a, b])[0] === a ? -1 : 1
    }

    // String comparison for other fields
    aValue = String(aValue).toLowerCase()
    bValue = String(bValue).toLowerCase()

    const comparison = aValue.localeCompare(bValue)
    return direction === "asc" ? comparison : -comparison
  })
}
```

### Error Handling

```typescript
// API Error Types
interface TagsApiError {
  code: string
  message: string
  details?: any
}

// Error Handler
const handleTagsApiError = (error: any): TagsApiError => {
  if (error.response?.status === 404) {
    return {
      code: "TAG_NOT_FOUND",
      message: "Tag wurde nicht gefunden",
    }
  }

  if (error.response?.status === 400) {
    return {
      code: "VALIDATION_ERROR",
      message: "Ungültige Tag-Daten",
    }
  }

  if (error.response?.status === 403) {
    return {
      code: "PERMISSION_DENIED",
      message: "Keine Berechtigung für diese Aktion",
    }
  }

  return {
    code: "UNKNOWN_ERROR",
    message: "Ein unbekannter Fehler ist aufgetreten",
  }
}
```

### Performance-Optimierungen

```typescript
// Memoization für teure Operationen
import { useMemoize } from "@vueuse/core"

const memoizedColorSort = useMemoize((tags: Tag[]) => {
  return sortTagsByColor(tags)
})

// Debounced Search
import { debounce } from "lodash-es"

const debouncedFilter = debounce((searchTerm: string) => {
  filteredTags.value = applyRegexFilter(tags.value, searchTerm)
}, 300)

// Virtual Scrolling für große Tag-Listen
const virtualizedTags = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredTags.value.slice(start, end)
})
```
