<template>
  <div class="expiring-appointments-admin">
    <!-- Header Card -->
    <div class="ct-card header-card">
      <div class="ct-card-header">
        <h1 class="ct-card-title">auslaufende Terminserien - Admin Panel</h1>
      </div>
      <div class="ct-card-body">
        <p class="description">Überwachung und Verwaltung aller auslaufenden Terminserien</p>
        <div class="filter-controls">
          <div class="days-in-advance">
            <label>Zeige Terminserien, die in den nächsten:</label>
            <select v-model="daysInAdvance" @change="refreshData" class="ct-select">
              <option value="alle">alle</option>
              <option value="1">1</option>
              <option value="7">7</option>
              <option value="14">14</option>
              <option value="30">30</option>
              <option value="60">60</option>
              <option value="90">90</option>
              <option value="180">180</option>
              <option value="365">365</option>
            </select>
            <span v-if="daysInAdvance !== 'alle'">Tagen enden</span>
            <span v-else>Termine anzeigen</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Controls Card -->
    <div class="ct-card controls-card">
      <div class="ct-card-body">
        <div class="controls-row">
          <div class="search-container">
            <input
              v-model="searchTerm"
              type="text"
              placeholder="Suche nach ID, Titel oder Kalender..."
              class="ct-input search-input"
            />
          </div>
          <div class="filter-container">
            <select v-model="calendarFilter" class="ct-select filter-select">
              <option value="">Alle Kalender</option>
              <option
                v-for="calendar in availableCalendars"
                :key="calendar.id"
                :value="calendar.id"
              >
                {{ calendar.name }}
              </option>
            </select>
          </div>
          <div class="filter-container">
            <select v-model="statusFilter" class="ct-select filter-select">
              <option value="">Alle Status</option>
              <option value="expiring">Läuft bald ab</option>
              <option value="expired">Abgelaufen</option>
              <option value="active">Aktiv</option>
            </select>
          </div>
          <div class="button-group">
            <button
              @click="clearFilters"
              class="ct-btn ct-btn-secondary clear-btn"
              :disabled="!hasActiveFilters"
              title="Alle Filter zurücksetzen"
            >
              Filter löschen
            </button>
            <button
              @click="refreshData"
              class="ct-btn ct-btn-primary refresh-btn"
              :disabled="isLoading"
            >
              {{ isLoading ? 'Lädt...' : 'Aktualisieren' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Appointments Table Card -->
    <div class="ct-card table-card">
      <div class="ct-card-header">
        <h3 class="ct-card-title">auslaufende Terminserien ({{ filteredAppointments.length }})</h3>
      </div>
      <div class="ct-card-body">
        <div v-if="isLoading" class="loading-state">
          <div class="loading-spinner"></div>
          <p>Lade auslaufende Terminserien...</p>
        </div>

        <div v-else-if="error" class="error-state">
          <p class="error-message">❌ {{ error }}</p>
          <div class="error-actions">
            <button @click="refreshData" class="ct-btn ct-btn-secondary">Erneut versuchen</button>
          </div>
          <div v-if="isDevelopment" class="dev-info">
            <p><strong>Entwicklungsmodus:</strong></p>
            <p>Überprüfen Sie die Browser-Konsole für detaillierte Fehlermeldungen.</p>
            <p>Stellen Sie sicher, dass die ChurchTools-Verbindung konfiguriert ist.</p>
          </div>
        </div>

        <div v-else-if="filteredAppointments.length === 0" class="empty-state">
          <p>Keine auslaufenden Termine gefunden.</p>
          <div class="empty-actions">
            <button @click="refreshData" class="ct-btn ct-btn-primary">Erneut laden</button>
          </div>
        </div>

        <div v-else class="table-container">
          <div
            v-if="hasActiveFilters"
            class="active-filters"
            style="
              margin-bottom: 1rem;
              padding: 0.5rem;
              background: #e3f2fd;
              border-radius: 4px;
              font-size: 0.85rem;
            "
          >
            <strong>Aktive Filter:</strong>
            <span v-if="searchTerm">Suche: "{{ searchTerm }}"</span>
            <span v-if="calendarFilter">
              | Kalender: {{ availableCalendars.find((c) => c.id == calendarFilter)?.name }}
            </span>
            <span v-if="statusFilter">| Status: {{ statusFilter }}</span>
            <span v-if="daysInAdvance !== 'alle'">| Tage: {{ daysInAdvance }}</span>
            | Ergebnisse: {{ filteredAppointments.length }}
          </div>
          <table class="appointments-table" ref="tableRef">
            <thead>
              <tr>
                <th
                  @click="sortBy('id')"
                  class="sortable id-header"
                  :style="{ width: columnWidths[0] + 'px' }"
                >
                  ID
                  <span class="sort-indicator" v-if="sortField === 'id'">
                    {{ sortDirection === 'asc' ? '↑' : '↓' }}
                  </span>
                </th>
                <th
                  @click="sortBy('title')"
                  class="sortable resizable"
                  :style="{ width: columnWidths[1] + 'px' }"
                >
                  Titel
                  <span class="sort-indicator" v-if="sortField === 'title'">
                    {{ sortDirection === 'asc' ? '↑' : '↓' }}
                  </span>
                  <div class="resize-handle" @mousedown="startResize($event, 1)"></div>
                </th>
                <th
                  @click="sortBy('calendar')"
                  class="sortable resizable"
                  :style="{ width: columnWidths[2] + 'px' }"
                >
                  Kalender
                  <span class="sort-indicator" v-if="sortField === 'calendar'">
                    {{ sortDirection === 'asc' ? '↑' : '↓' }}
                  </span>
                  <div class="resize-handle" @mousedown="startResize($event, 2)"></div>
                </th>
                <th
                  @click="sortBy('startDate')"
                  class="sortable resizable"
                  :style="{ width: columnWidths[3] + 'px' }"
                >
                  Anfang
                  <span class="sort-indicator" v-if="sortField === 'startDate'">
                    {{ sortDirection === 'asc' ? '↑' : '↓' }}
                  </span>
                  <div class="resize-handle" @mousedown="startResize($event, 3)"></div>
                </th>
                <th
                  @click="sortBy('repeatUntil')"
                  class="sortable resizable"
                  :style="{ width: columnWidths[4] + 'px' }"
                >
                  Ende
                  <span class="sort-indicator" v-if="sortField === 'repeatUntil'">
                    {{ sortDirection === 'asc' ? '↑' : '↓' }}
                  </span>
                  <div class="resize-handle" @mousedown="startResize($event, 4)"></div>
                </th>
                <th :style="{ width: columnWidths[5] + 'px', textAlign: 'right' }">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="appointment in filteredAppointments"
                :key="appointment.id"
                class="appointment-row"
              >
                <td class="id-cell" :style="{ width: columnWidths[0] + 'px' }">
                  {{ appointment.id || appointment.base?.id || 'NO_ID' }}
                </td>
                <td :style="{ width: columnWidths[1] + 'px' }">
                  {{ appointment.base.title }}
                </td>
                <td class="calendar-cell" :style="{ width: columnWidths[2] + 'px' }">
                  <div
                    class="calendar-info"
                    :style="{
                      borderLeft: `3px solid ${appointment.base.calendar?.color || '#cccccc'}`,
                      paddingLeft: '8px',
                    }"
                  >
                    <span class="calendar-name">
                      {{ appointment.base.calendar?.name || 'Unbekannter Kalender' }}
                    </span>
                  </div>
                </td>
                <td class="date-cell" :style="{ width: columnWidths[3] + 'px' }">
                  {{ formatDate(appointment.base.startDate) }}
                </td>
                <td class="date-cell" :style="{ width: columnWidths[4] + 'px' }">
                  {{ getEffectiveEndDate(appointment) }}
                </td>
                <td class="actions" :style="{ width: 'auto' }">
                  <a
                    :href="getAppointmentUrl(appointment)"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="ct-btn ct-btn-sm ct-btn-outline"
                    title="Termin in ChurchTools öffnen"
                  >
                    Öffnen
                  </a>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { churchtoolsClient } from '@churchtools/churchtools-client'
import type { DashboardModule } from '../types/modules'
import {
  fetchCalendars,
  fetchAppointments,
  findExpiringSeries,
  identifyCalendars,
  type Appointment,
  type Calendar,
} from '@/services/churchtools'

defineProps<{
  module: DashboardModule
}>()

interface CalendarMapEntry {
  name: string
  isGroup: boolean
}

// State
const isLoading = ref(true)
const error = ref<string | null>(null)
const searchTerm = ref('')
const calendarFilter = ref('')
const statusFilter = ref('')
const sortField = ref<'id' | 'title' | 'calendar' | 'startDate' | 'repeatUntil'>('id')
const sortDirection = ref<'asc' | 'desc'>('asc')
const isDevelopment = ref(import.meta.env.MODE === 'development')

// Column resizing
const tableRef = ref<HTMLTableElement>()
const columnWidths = ref([55, 225, 200, 180, 180, 120]) // Pixel-Breiten für Drag&Drop
const isResizing = ref(false)
const resizingColumn = ref(-1)
const startX = ref(0)
const startWidth = ref(0)

const startResize = (event: MouseEvent, columnIndex: number) => {
  event.preventDefault()
  event.stopPropagation()

  isResizing.value = true
  resizingColumn.value = columnIndex
  startX.value = event.clientX
  startWidth.value = columnWidths.value[columnIndex]

  document.addEventListener('mousemove', handleResize)
  document.addEventListener('mouseup', stopResize)
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
}

const handleResize = (event: MouseEvent) => {
  if (!isResizing.value || resizingColumn.value === -1) return

  const deltaX = event.clientX - startX.value
  const newWidth = Math.max(80, startWidth.value + deltaX) // Minimum width of 80px

  const newWidths = [...columnWidths.value]
  newWidths[resizingColumn.value] = newWidth
  columnWidths.value = newWidths
}

const stopResize = () => {
  isResizing.value = false
  resizingColumn.value = -1

  document.removeEventListener('mousemove', handleResize)
  document.removeEventListener('mouseup', stopResize)
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
}

const daysInAdvance = ref('alle') // Default to "alle"

// Configuration - same as Card component
const DAYS_TO_SHOW = 90

// Helper function to get appointment status
const getAppointmentStatus = (appointment: Appointment): 'active' | 'expiring' | 'expired' => {
  const now = new Date()
  let effectiveEndDate = null

  if (appointment.base.repeatUntil) {
    effectiveEndDate = new Date(appointment.base.repeatUntil)
  } else if (
    appointment.base.additionals &&
    Array.isArray(appointment.base.additionals) &&
    appointment.base.additionals.length > 0
  ) {
    const latestAdditional = appointment.base.additionals
      .map((additional) => new Date(additional.startDate || additional.date))
      .filter((date) => !isNaN(date.getTime()))
      .sort((a, b) => b.getTime() - a.getTime())[0]

    if (latestAdditional) {
      effectiveEndDate = latestAdditional
    }
  }

  if (!effectiveEndDate) return 'active'

  const daysUntilEnd = Math.ceil(
    (effectiveEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  )

  if (effectiveEndDate < now) return 'expired'
  if (daysUntilEnd <= DAYS_TO_SHOW) return 'expiring' // Same as Card component
  return 'active'
}

// Data
const appointments = ref<Appointment[]>([])
const calendarMap = ref<Map<number, { name: string; isGroup: boolean }>>(new Map())

// Computed properties for filters
const availableCalendars = computed(() => {
  const calendars = new Map()
  appointments.value.forEach((appointment) => {
    const calendar = appointment.base.calendar
    if (calendar && !calendars.has(calendar.id)) {
      calendars.set(calendar.id, {
        id: calendar.id,
        name: calendar.name,
      })
    }
  })
  return Array.from(calendars.values()).sort((a, b) => a.name.localeCompare(b.name))
})

const hasActiveFilters = computed(() => {
  return (
    searchTerm.value !== '' ||
    calendarFilter.value !== '' ||
    statusFilter.value !== '' ||
    daysInAdvance.value !== 'alle'
  )
})

// Computed properties
const filteredAppointments = computed(() => {
  let filtered = appointments.value
  console.log('Filtering appointments, total:', filtered.length)

  // 1. Filter by days in advance (existing logic)
  const now = new Date()

  if (daysInAdvance.value === 'alle') {
    // Show all recurring appointments
    filtered = filtered.filter((appointment) => {
      if (!appointment.base || !appointment.base.repeatId) {
        return false
      }

      let effectiveEndDate = null
      if (appointment.base.repeatUntil) {
        effectiveEndDate = new Date(appointment.base.repeatUntil)
      } else if (
        appointment.base.additionals &&
        Array.isArray(appointment.base.additionals) &&
        appointment.base.additionals.length > 0
      ) {
        const latestAdditional = appointment.base.additionals
          .map((additional) => new Date(additional.startDate || additional.date))
          .filter((date) => !isNaN(date.getTime()))
          .sort((a, b) => b.getTime() - a.getTime())[0]

        if (latestAdditional) {
          effectiveEndDate = latestAdditional
        }
      }

      if (effectiveEndDate && !isNaN(effectiveEndDate.getTime())) {
        return effectiveEndDate >= now
      }

      return true
    })
  } else {
    // Filter by specific days
    const days = parseInt(daysInAdvance.value)
    const maxDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)

    filtered = filtered.filter((appointment) => {
      if (!appointment.base || !appointment.base.repeatId) {
        return false
      }

      let effectiveEndDate = null
      if (appointment.base.repeatUntil) {
        effectiveEndDate = new Date(appointment.base.repeatUntil)
      } else if (
        appointment.base.additionals &&
        Array.isArray(appointment.base.additionals) &&
        appointment.base.additionals.length > 0
      ) {
        const latestAdditional = appointment.base.additionals
          .map((additional) => new Date(additional.startDate || additional.date))
          .filter((date) => !isNaN(date.getTime()))
          .sort((a, b) => b.getTime() - a.getTime())[0]

        if (latestAdditional) {
          effectiveEndDate = latestAdditional
        }
      }

      if (!effectiveEndDate || isNaN(effectiveEndDate.getTime())) {
        return false
      }

      return effectiveEndDate >= now && effectiveEndDate <= maxDate
    })
  }

  // 2. Filter by calendar
  if (calendarFilter.value) {
    const calendarId = parseInt(calendarFilter.value)
    const beforeCount = filtered.length
    filtered = filtered.filter((appointment) => appointment.base.calendar?.id === calendarId)
    console.log(
      `Calendar filter applied: ${calendarId} -> ${beforeCount} to ${filtered.length} results`
    )
  }

  // 3. Filter by status
  if (statusFilter.value) {
    const beforeCount = filtered.length
    filtered = filtered.filter(
      (appointment) => getAppointmentStatus(appointment) === statusFilter.value
    )
    console.log(
      `Status filter applied: ${statusFilter.value} -> ${beforeCount} to ${filtered.length} results`
    )
  }

  // 4. Filter by search term (ID, title, calendar)
  if (searchTerm.value) {
    const term = searchTerm.value.toLowerCase().trim()
    filtered = filtered.filter((appointment) => {
      // Search in ID (convert to string safely)
      const idMatch = (appointment.id?.toString() || '').includes(term)

      // Search in title
      const titleMatch = (appointment.base?.title || '').toLowerCase().includes(term)

      // Search in calendar name
      const calendarMatch = (appointment.base?.calendar?.name || '').toLowerCase().includes(term)

      return idMatch || titleMatch || calendarMatch
    })
    console.log(`Search filter applied: "${term}" -> ${filtered.length} results`)
  }

  // Sort
  filtered.sort((a, b) => {
    let aVal: any
    let bVal: any

    switch (sortField.value) {
      case 'id':
        aVal = parseInt(a.id)
        bVal = parseInt(b.id)
        break
      case 'title':
        aVal = a.base.title
        bVal = b.base.title
        break
      case 'calendar':
        aVal = a.base.calendar?.name || ''
        bVal = b.base.calendar?.name || ''
        break
      case 'startDate':
        aVal = new Date(a.base.startDate)
        bVal = new Date(b.base.startDate)
        break
      case 'repeatUntil':
        aVal = a.base.repeatUntil ? new Date(a.base.repeatUntil) : new Date(0)
        bVal = b.base.repeatUntil ? new Date(b.base.repeatUntil) : new Date(0)
        break
      default:
        aVal = a[sortField.value]
        bVal = b[sortField.value]
    }

    let comparison = 0
    if (aVal < bVal) comparison = -1
    if (aVal > bVal) comparison = 1

    return sortDirection.value === 'asc' ? comparison : -comparison
  })

  console.log('Final filtered appointments:', filtered.length)
  return filtered
})

const sortBy = (field: 'id' | 'title' | 'calendar' | 'startDate' | 'repeatUntil') => {
  if (sortField.value === field) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortField.value = field
    sortDirection.value = 'asc'
  }
}

const clearFilters = () => {
  searchTerm.value = ''
  calendarFilter.value = ''
  statusFilter.value = ''
  daysInAdvance.value = 'alle'
}

const refreshData = async () => {
  isLoading.value = true
  error.value = null

  try {
    console.log('Fetching appointments from ChurchTools API...')

    // First, identify all calendars
    const { publicCalendars } = await identifyCalendars()

    // Create calendar map for quick lookups
    publicCalendars.forEach((cal) => {
      const isGroup = cal.name.includes('Gruppe') || cal.name.includes('Team')
      calendarMap.value.set(cal.id, { name: cal.name, isGroup })
    })

    let allAppointments: Appointment[]

    if (daysInAdvance.value === 'alle') {
      // For "alle", use findExpiringSeries with a very large timeframe
      allAppointments = await findExpiringSeries(36500) // 100 years
    } else {
      // For specific days, use the existing function
      const days = parseInt(daysInAdvance.value)
      console.log(days)

      allAppointments = await findExpiringSeries(days)
    }

    // Clean up the data to ensure all required fields are present
    appointments.value = allAppointments.map((appointment) => {
      if (!appointment.base) {
        appointment.base = {
          ...appointment,
          calendar: appointment.calendar || { id: 0, name: 'Unbekannt', color: '#cccccc' },
          repeatUntil: appointment.series?.repeatUntil,
        }
      }
      return appointment
    })

    console.log('Appointments found:', appointments.value.length)

    // Check recurring appointments
    const withRepeatId = appointments.value.filter((a) => a.base?.repeatId).length
    const withRepeatUntil = appointments.value.filter((a) => a.base?.repeatUntil).length
    const withBoth = appointments.value.filter(
      (a) => a.base?.repeatId && a.base?.repeatUntil
    ).length
    const manualRepeat = appointments.value.filter(
      (a) => a.base?.repeatId && !a.base?.repeatUntil
    ).length
    console.log(
      'With repeatId:',
      withRepeatId,
      'With repeatUntil:',
      withRepeatUntil,
      'With both:',
      withBoth,
      'Manual repeat (no repeatUntil):',
      manualRepeat
    )
  } catch (err: any) {
    console.error('Fehler beim Laden der Termine:', err)

    let errorMessage = 'Fehler beim Laden der Termine.'

    if (err.response) {
      errorMessage += ` HTTP ${err.response.status}: ${err.response.statusText}`
      if (err.response.status === 401) {
        errorMessage += ' (Nicht authentifiziert)'
      } else if (err.response.status === 403) {
        errorMessage += ' (Keine Berechtigung)'
      }
    } else if (err.message) {
      errorMessage += ` ${err.message}`
    }

    error.value = errorMessage
  } finally {
    isLoading.value = false
  }
}

const getAppointmentUrl = (appointment: Appointment) => {
  // Construct URL to ChurchTools instance appointment page
  //https://bgkorntal.church.tools/?q=churchcal&startdate=2025-09-17#CalView/
  const churchtoolsBaseUrl = import.meta.env.DEV
    ? import.meta.env.VITE_BASE_URL
    : window.location.origin
  return `${churchtoolsBaseUrl}?q=churchcal&startdate=${appointment.base.startDate}#CalView/`
}

const formatDate = (dateString: string | null) => {
  if (!dateString) return 'Nie'

  try {
    const date = new Date(dateString)
    return date.toLocaleString('de-DE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return 'Ungültiges Datum'
  }
}

const getEffectiveEndDate = (appointment: Appointment) => {
  if (appointment.base.repeatUntil) {
    return formatDate(appointment.base.repeatUntil)
  }

  if (
    appointment.base.additionals &&
    Array.isArray(appointment.base.additionals) &&
    appointment.base.additionals.length > 0
  ) {
    const latestAdditional = appointment.base.additionals
      .map((additional) => new Date(additional.startDate || additional.date))
      .filter((date) => !isNaN(date.getTime()))
      .sort((a, b) => b.getTime() - a.getTime())[0]

    if (latestAdditional) {
      return formatDate(latestAdditional.toISOString()) + ' manuell'
    }
  }

  return 'Kein Enddatum'
}

onMounted(() => {
  refreshData()
})
</script>

<style scoped>
.expiring-appointments-admin {
  padding: 0;
  width: 100%;
  margin: 0;
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  color: var(--ct-text-primary, #2c3e50);
  line-height: 1.5;
  
  /* Ensure consistent light theme variables */
  --ct-bg-primary: #ffffff;
  --ct-bg-secondary: #f8f9fa;
  --ct-bg-tertiary: #e9ecef;
  --ct-text-primary: #2c3e50;
  --ct-text-secondary: #6c757d;
  --ct-border-color: #e0e0e0;
  --ct-bg-hover: #f1f3f5;
  --ct-primary: #3498db;
  --ct-primary-dark: #2980b9;
  --ct-secondary: #6c757d;
  --ct-secondary-dark: #5a6268;
  --ct-success: #28a745;
  --ct-danger: #dc3545;
}

/* Header Card */
.header-card {
  background: var(--ct-bg-primary, #ffffff);
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
  transition: all 0.3s ease;
}

.header-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.ct-card-header {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--ct-border-color, #e0e0e0);
  background: var(--ct-bg-secondary, #f8f9fa);
}

.ct-card-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--ct-text-primary, #2c3e50);
}

.ct-card-body {
  padding: 1.5rem;
}

.description {
  margin: 0 0 1rem 0;
  color: var(--ct-text-secondary, #6c757d);
  font-size: 0.95rem;
}

.filter-controls {
  margin-top: 1rem;
}

.days-in-advance {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: var(--ct-bg-secondary, #f8f9fa);
  padding: 0.75rem 1rem;
  border-radius: 6px;
  max-width: fit-content;
}

.days-in-advance label {
  font-size: 0.9rem;
  color: var(--ct-text-secondary, #6c757d);
  margin: 0;
}

.days-in-advance select,
.days-in-advance input {
  width: 80px;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--ct-border-color, #e0e0e0);
  border-radius: 4px;
  background: var(--ct-bg-primary, #ffffff);
  color: var(--ct-text-primary, #2c3e50);
  text-align: center;
}

.days-in-advance select:focus,
.days-in-advance input:focus {
  outline: none;
  border-color: var(--ct-primary, #3498db);
  box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.1);
}

/* Controls Card */
.controls-card {
  background: var(--ct-bg-primary, #ffffff);
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
  transition: all 0.3s ease;
}

.controls-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.controls-row {
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;
}

.search-container {
  flex: 2;
  min-width: 280px;
}

.filter-container {
  min-width: 180px;
}

.filter-select {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid var(--ct-border-color, #e0e0e0);
  border-radius: 6px;
  font-size: 0.95rem;
  background: var(--ct-bg-primary, #ffffff);
  color: var(--ct-text-primary, #2c3e50);
  transition: all 0.2s;
}

.filter-select:focus {
  outline: none;
  border-color: var(--ct-primary, #3498db);
  box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.1);
}

.search-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid var(--ct-border-color, #e0e0e0);
  border-radius: 6px;
  font-size: 0.95rem;
  background: var(--ct-bg-primary, #ffffff);
  color: var(--ct-text-primary, #2c3e50);
  transition: all 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: var(--ct-primary, #3498db);
  box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.1);
}

.button-group {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

/* Buttons */
.ct-btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  text-decoration: none;
}

.ct-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.ct-btn-primary {
  background-color: var(--ct-primary, #3498db);
  color: white;
}

.ct-btn-primary:hover:not(:disabled) {
  background-color: var(--ct-primary-dark, #2980b9);
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.ct-btn-secondary {
  background-color: var(--ct-secondary, #6c757d);
  color: white;
}

.ct-btn-secondary:hover:not(:disabled) {
  background-color: var(--ct-secondary-dark, #5a6268);
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.ct-btn-outline {
  background: transparent;
  border: 1px solid var(--ct-primary, #3498db);
  color: var(--ct-primary, #3498db);
}

.ct-btn-outline:hover:not(:disabled) {
  background-color: rgba(52, 152, 219, 0.1);
}

.ct-btn-sm {
  padding: 0.5rem 1rem;
  font-size: 0.85rem;
}

/* Table Card */
.table-card {
  background: var(--ct-bg-primary, #ffffff);
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  min-height: 500px;
}

.table-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

/* Loading, Error, and Empty States */
.loading-state,
.error-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  text-align: center;
  background: var(--ct-bg-secondary, #f8f9fa);
  border-radius: 8px;
  min-height: 200px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(52, 152, 219, 0.2);
  border-radius: 50%;
  border-top-color: var(--ct-primary, #3498db);
  animation: spin 1s ease-in-out infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error-message {
  color: #dc3545;
  margin-bottom: 1rem;
}

.error-actions,
.empty-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.dev-info {
  margin-top: 1.5rem;
  padding: 1rem;
  background: rgba(52, 152, 219, 0.1);
  border-radius: 6px;
  border-left: 4px solid var(--ct-primary, #3498db);
  text-align: left;
  max-width: 500px;
}

.dev-info p {
  margin: 0.5rem 0;
  font-size: 0.9rem;
}

/* Table Container */
.table-container {
  width: 100%;
  max-width: 100%;
  overflow-x: auto;
  border-radius: 8px;
  background: var(--ct-bg-primary, #ffffff);
  margin-bottom: 0;
  -webkit-overflow-scrolling: touch;
  display: block;
  flex: 1;
  min-height: 400px;
}

.table-container table {
  width: 100%;
  min-width: 1150px; /* Mindestbreite für alle Spalten */
}

/* Table */
.appointments-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  margin: 0;
  padding: 0;
}

.appointments-table th {
  text-align: left;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--ct-text-secondary, #6c757d);
  background-color: var(--ct-bg-secondary, #f8f9fa);
  white-space: nowrap;
  position: relative;
  letter-spacing: 0.02em;
  overflow: visible;
  box-sizing: border-box;
}

.appointments-table td {
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid var(--ct-border-color, #f0f2f5);
}

.appointments-table th.sortable {
  cursor: pointer;
  user-select: none;
  position: relative;
}

.appointments-table th.sortable:hover {
  background-color: var(--ct-bg-tertiary, #e9ecef);
}

.sort-indicator {
  margin-left: 0.5rem;
  font-weight: bold;
  display: inline-block;
  color: var(--ct-primary, #3498db);
}

.resize-handle {
  position: absolute;
  top: 0;
  right: 0;
  width: 5px;
  height: 100%;
  background: transparent;
  cursor: col-resize;
  z-index: 1;
}

.resize-handle:hover,
.resize-handle:active {
  background-color: var(--ct-primary, #3498db);
  opacity: 0.5;
}

th {
  position: relative;
  user-select: none;
}

th.sortable {
  cursor: pointer;
  transition: background-color 0.2s;
}

th.sortable:hover {
  background-color: var(--ct-bg-tertiary, #f1f3f5);
}

.appointments-table .id-cell {
  font-family: 'Courier New', monospace;
  font-size: 0.85rem;
  color: #000000 !important;
  text-align: right;
  font-weight: bold;
}

.appointments-table .id-header {
  text-align: right;
}

th.active {
  color: var(--ct-primary, #3498db);
  font-weight: 600;
}

/* Table layout */
table {
  table-layout: fixed;
  min-width: 100%;
}

th,
td {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  vertical-align: middle;
}

/* Calendar info cell */
.calendar-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
}

.calendar-name {
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Status badges */
.status-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: capitalize;
  white-space: nowrap;
}

/* Action buttons */
.actions {
  display: flex !important;
  gap: 0.5rem;
  justify-content: flex-end !important;
  padding: 0.5rem 0.75rem;
  min-width: 100px !important;
  white-space: nowrap;
}

/* Empty state */
.empty-state {
  padding: 2rem;
  text-align: center;
  color: var(--ct-text-secondary, #6c757d);
}

/* Responsive table */
@media (max-width: 1200px) {
  .table-container {
    overflow-x: auto;
  }
}

/* Table container */
.table-container {
  width: 100%;
  max-width: 100%;
  overflow-x: auto;
  border-radius: 8px;
  background: var(--ct-bg-primary, #ffffff);
  margin-bottom: 0;
  -webkit-overflow-scrolling: touch;
  display: block;
  flex: 1;
  min-height: 400px;
}

.table-card {
  background: var(--ct-bg-primary, #ffffff);
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  margin: 2rem 0;
  width: 100%;
  max-width: 100%;
  min-height: 500px;
  overflow: auto;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
}

.table-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.ct-card-header {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--ct-border-color, #e0e0e0);
  background: var(--ct-bg-secondary, #f8f9fa);
  background: var(--ct-bg-secondary, #f8f9fa);
}

.ct-card-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--ct-text-primary, #2c3e50);
}

.ct-card-body {
  padding: 2rem;
  flex: 1;
  display: flex;
  flex-direction: column;
}

table {
  width: 100%;
  min-width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  margin: 0;
  padding: 0;
}

table th {
  text-align: left;
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--ct-text-secondary, #6c757d);
  background-color: var(--ct-bg-secondary, #f8f9fa);
  white-space: nowrap;
  position: relative;
  letter-spacing: 0.02em;
  overflow: visible;
  box-sizing: border-box;
}

th.sortable {
  cursor: pointer;
  user-select: none;
  position: relative;
}

th.sortable:hover {
  background-color: var(--ct-bg-tertiary, #e9ecef);
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.sort-indicator {
  margin-left: 0.5rem;
  font-weight: bold;
  display: inline-block;
  color: var(--ct-primary, #3498db);
}

.resize-handle {
  position: absolute;
  top: 0;
  right: 0;
  width: 4px;
  height: 100%;
  background: transparent;
  cursor: col-resize;
  z-index: 10;
}

.resize-handle:hover {
  background: var(--ct-primary, #3498db);
  opacity: 0.5;
}

.resize-handle:active {
  background: var(--ct-primary, #3498db);
  opacity: 0.8;
}

/* Make sure the header content doesn't overlap with the resize handle */
.header-content {
  padding-right: 8px;
  position: relative;
  z-index: 1;
}

tr:not(:last-child) {
  border-bottom: 1px solid var(--ct-border-color, #e0e0e0);
}

tr:hover {
  background-color: var(--ct-bg-secondary, #f8f9fa);
}

/* Status Badges */
.status-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: capitalize;
}

.status-active {
  background-color: rgba(40, 167, 69, 0.1);
  color: #28a745;
}

.status-expired {
  background-color: rgba(220, 53, 69, 0.1);
  color: #dc3545;
}

.status-upcoming {
  background-color: rgba(23, 162, 184, 0.1);
  color: #17a2b8;
}

/* Action Buttons */
.actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}

.btn-icon {
  width: 32px;
  height: 32px;
  border-radius: 4px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border: none;
  transition: all 0.2s ease;
  color: white;
  font-size: 14px;
  opacity: 0.8;
}

.btn-icon:hover {
  opacity: 1;
  transform: translateY(-1px);
}

.btn-icon:active {
  transform: translateY(0);
}

.btn-icon.view {
  background-color: var(--ct-success, #28a745);
}

.btn-icon.extend {
  background-color: var(--ct-danger, #dc3545);
}

/* Calendar Color Dot */
.calendar-info {
  display: flex;
  align-items: center;
  height: 100%;
}

/* Buttons */
.ct-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.ct-btn-primary {
  background-color: var(--ct-primary, #3498db);
  color: white;
}

.ct-btn-primary:hover {
  background-color: var(--ct-primary-dark, #2980b9);
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.ct-btn-outline {
  background: transparent;
  border: 1px solid var(--ct-primary, #3498db);
  color: var(--ct-primary, #3498db);
}

.ct-btn-outline:hover {
  background-color: rgba(52, 152, 219, 0.1);
}

/* Loading and error states */
.loading,
.error,
.no-results {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  text-align: center;
  background: var(--ct-bg-secondary, #f8f9fa);
  border-radius: 8px;
  min-height: 200px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(52, 152, 219, 0.2);
  border-radius: 50%;
  border-top-color: var(--ct-primary, #3498db);
  animation: spin 1s ease-in-out infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

error {
  color: #dc3545;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .filters {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-group {
    width: 100%;
  }

  .search-box {
    width: 100%;
  }

  table {
    display: block;
    overflow-x: auto;
    white-space: nowrap;
  }
}

/* Removed duplicate CSS variables - now defined in main component selector */
.expiring-appointments-admin {
  padding: 0;
  width: 100%;
  margin: 0;
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  color: var(--ct-text-primary, #2c3e50);
  line-height: 1.5;
  
  /* Ensure consistent light theme variables */
  --ct-bg-primary: #ffffff;
  --ct-bg-secondary: #f8f9fa;
  --ct-bg-tertiary: #e9ecef;
  --ct-text-primary: #2c3e50;
  --ct-text-secondary: #6c757d;
  --ct-border-color: #e0e0e0;
  --ct-bg-hover: #f1f3f5;
  --ct-primary: #3498db;
  --ct-primary-dark: #2980b9;
  --ct-secondary: #6c757d;
  --ct-secondary-dark: #5a6268;
  --ct-success: #28a745;
  --ct-danger: #dc3545;
}

.content-container {
  padding: 1.5rem;
  max-width: 1600px;
  margin: 0 auto;
  width: 100%;
}

/* Old header styles - can be removed if not needed */
.header {
  margin-bottom: 2.5rem;
  background: var(--card-bg);
  padding: 1.5rem;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.header h1 {
  margin: 0;
  color: var(--primary-color);
  font-size: 1.8rem;
  font-weight: 600;
}

.subtitle {
  margin: 0.5rem 0 1.5rem;
  color: var(--text-secondary);
  font-size: 1rem;
}

.days-in-advance {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: var(--bg-secondary);
  padding: 0.75rem 1rem;
  border-radius: 6px;
  margin-top: 1.25rem;
  max-width: fit-content;
}

.days-in-advance label {
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.days-in-advance input {
  width: 80px;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background: var(--bg-color);
  color: var(--text-primary);
  text-align: center;
}

.days-in-advance input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(var(--primary-rgb), 0.1);
}

/* Stats Summary */
.stats-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.25rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: var(--card-bg);
  border-radius: 8px;
  padding: 1.5rem;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition:
    transform 0.2s,
    box-shadow 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stat-value {
  font-size: 2.2rem;
  font-weight: 700;
  color: var(--primary-color);
  line-height: 1.2;
  margin-bottom: 0.5rem;
}

.stat-label {
  font-size: 0.95rem;
  color: var(--text-secondary);
  font-weight: 500;
}

/* Filters */
.filters {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.75rem;
  flex-wrap: wrap;
  align-items: flex-end;
  background: var(--card-bg);
  padding: 1.25rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.search-box {
  position: relative;
  flex: 1;
  min-width: 280px;
}

.search-box input {
  width: 100%;
  padding: 0.65rem 1rem 0.65rem 2.75rem;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 0.95rem;
  background: var(--bg-color);
  color: var(--text-primary);
  transition: all 0.2s;
}

.search-box input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(var(--primary-rgb), 0.1);
}

.search-icon {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-tertiary);
  pointer-events: none;
}

.filter-group {
  display: flex;
  flex-direction: column;
  min-width: 180px;
}

.filter-group label {
  font-size: 0.85rem;
  margin-bottom: 0.4rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.filter-group select {
  padding: 0.65rem 1rem;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 0.95rem;
  background: var(--bg-color);
  color: var(--text-primary);
  cursor: pointer;
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  background-image: url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%236B7280%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E');
  background-repeat: no-repeat;
  background-position: right 0.7rem top 50%;
  background-size: 0.65rem auto;
}

.filter-group select:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(var(--primary-rgb), 0.1);
}

/* Appointments Table */
.appointments-table {
  background: var(--card-bg);
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  margin-bottom: 2rem;
  border: 1px solid var(--border-color);
}

table {
  width: 100%;
  min-width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  margin: 0;
  padding: 0;
}

th,
td {
  padding: 1.25rem 1.5rem;
  text-align: left;
  border-bottom: 1px solid var(--border-color);
  vertical-align: middle;
}

td.actions {
  width: auto;
}

th {
  background-color: var(--bg-secondary);
  font-weight: 600;
  color: var(--text-primary);
  cursor: pointer;
  user-select: none;
  position: relative;
  font-size: 0.85rem;
  letter-spacing: 0.5px;
  white-space: nowrap;
}

th:last-child {
  text-align: right;
  cursor: default;
}

th:hover {
  background-color: var(--bg-hover);
}

th .sort-icon {
  margin-left: 0.5rem;
  opacity: 0.6;
  transition: opacity 0.2s;
}

th:hover .sort-icon {
  opacity: 1;
}

.sort-icon.asc::before {
  content: '↑';
}

.sort-icon.desc::before {
  content: '↓';
}

tbody tr:last-child td {
  border-bottom: none;
}

tbody tr:hover {
  background-color: var(--bg-hover);
}

/* Appointment row styles */
.appointment-title {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.appointment-title strong {
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1.4;
}

.appointment-time {
  font-size: 0.85rem;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.appointment-note {
  margin-top: 0.5rem;
  font-size: 0.85rem;
  color: var(--text-tertiary);
  display: flex;
  align-items: flex-start;
  gap: 0.4rem;
  line-height: 1.4;
}

.appointment-note i {
  color: var(--primary-color);
  margin-top: 0.2rem;
  flex-shrink: 0;
}

/* Calendar info */
.calendar-info {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.calendar-color {
  width: 12px;
  height: 12px;
  border-radius: 2px;
  display: inline-block;
  flex-shrink: 0;
}

/* Status badges */
.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.4rem 0.9rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.3px;
  white-space: nowrap;
  text-transform: capitalize;
}

.status-active {
  background-color: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.status-expiring {
  background-color: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
}

.status-expired {
  background-color: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

/* Actions */
.actions {
  display: flex;
  gap: 0.4rem;
  justify-content: flex-end;
  padding-right: 0.5rem;
}

.btn-icon {
  background: none;
  border: none;
  color: var(--text-tertiary);
  cursor: pointer;
  width: 36px;
  height: 36px;
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  font-size: 1rem;
}

.btn-icon:hover {
  background-color: var(--bg-hover);
  color: var(--primary-color);
  transform: translateY(-1px);
}

.btn-icon:active {
  transform: translateY(0);
}

/* No results */
.no-results {
  padding: 3rem 2rem;
  text-align: center;
  color: var(--text-tertiary);
  font-style: italic;
  background: var(--bg-secondary);
  border-radius: 0 0 8px 8px;
}

/* Loading and Error States */
.loading,
.error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
  background: var(--card-bg);
  border-radius: 10px;
  min-height: 300px;
  margin: 1rem 0;
}

.spinner {
  width: 3.5rem;
  height: 3.5rem;
  border: 0.35rem solid rgba(var(--primary-rgb), 0.1);
  border-top-color: var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1.5rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error .btn {
  margin-top: 1.5rem;
  padding: 0.6rem 1.5rem;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition:
    background-color 0.2s,
    transform 0.2s;
}

.error .btn:hover {
  background: var(--primary-dark);
  transform: translateY(-1px);
}

/* Responsive */
@media (max-width: 1200px) {
  .expiring-appointments-admin {
    padding: 1.25rem;
  }

  .stats-summary {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  }

  th,
  td {
    padding: 1rem 1.25rem;
  }
}

@media (max-width: 992px) {
  .filters {
    gap: 0.75rem;
  }

  .filter-group {
    min-width: 160px;
  }

  .search-box {
    min-width: 240px;
  }

  table {
    display: block;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  th,
  td {
    white-space: nowrap;
  }
}

@media (max-width: 768px) {
  .header {
    padding: 1.25rem;
  }

  .header h1 {
    font-size: 1.5rem;
  }

  .stats-summary {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .filters {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }

  .filter-group,
  .search-box {
    width: 100%;
    min-width: 100%;
  }

  .days-in-advance {
    max-width: 100%;
  }

  th,
  td {
    padding: 0.9rem 1rem;
    font-size: 0.9rem;
  }

  .status-badge {
    padding: 0.3rem 0.7rem;
    font-size: 0.75rem;
  }

  .btn-icon {
    width: 32px;
    height: 32px;
    font-size: 0.9rem;
  }
}

/* Removed dark mode media query - using consistent light theme */

.expiring-appointments-admin {
  margin: 0 auto;
  padding: 1rem;
}

.admin-header {
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #eee;
}

.admin-header h1 {
  margin: 0 0 0.5rem;
  color: #333;
}

.module-description {
  color: #666;
  margin: 0;
}

.filters {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  align-items: flex-end;
}

.filter-group {
  display: flex;
  flex-direction: column;
  min-width: 200px;
  flex: 1;
}

.filter-group label {
  font-size: 0.9rem;
  margin-bottom: 0.25rem;
  color: #555;
}

.ct-select,
.ct-input {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.ct-btn {
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s;
  border: 1px solid transparent;
  height: 38px; /* Match input height */
}

.ct-btn-primary {
  background-color: #4a6cf7;
  color: white;
  border-color: #4a6cf7;
}

.ct-btn-primary:hover {
  background-color: #3a5ce4;
  border-color: #3a5ce4;
}

.ct-btn-primary:disabled {
  background-color: #a0a0a0;
  border-color: #a0a0a0;
  cursor: not-allowed;
}

.ct-btn-outline {
  background-color: white;
  border-color: #4a6cf7;
  color: #4a6cf7;
}

.ct-btn-outline:hover {
  background-color: #f0f4ff;
}

.ct-btn-sm {
  padding: 0.25rem 0.75rem;
  font-size: 0.9rem;
}

.loading-container,
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  text-align: center;
  color: #666;
}

.error-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  color: #e74c3c;
  font-weight: 500;
}

.error-detail {
  font-size: 0.9rem;
  color: #999;
  margin-top: 0.25rem;
}

.loading-spinner {
  border: 3px solid #f3f3f3;
  border-top: 3px solid #4a6cf7;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.appointments-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.no-results {
  padding: 2rem;
  text-align: center;
  color: #666;
}

.appointments-list {
  display: grid;
  gap: 1rem;
  padding: 1rem;
}

.appointment-card {
  background: white;
  border: 1px solid #eee;
  border-radius: 6px;
  padding: 1rem;
  transition:
    transform 0.2s,
    box-shadow 0.2s;
}

.appointment-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.appointment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #f5f5f5;
}

.appointment-header h3 {
  margin: 0;
  font-size: 1.1rem;
  color: #333;
}

.days-left {
  font-size: 0.9rem;
  font-weight: 600;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  background-color: #f0f0f0;
}

.days-left.warning {
  background-color: #fff3e0;
  color: #e67e22;
}

.days-left.notice {
  background-color: #e3f2fd;
  color: #1976d2;
}

.days-left.expired {
  background-color: #ffebee;
  color: #d32f2f;
}

.appointment-details {
  margin-bottom: 1rem;
}

.detail-row {
  display: flex;
  margin-bottom: 0.5rem;
  font-size: 0.95rem;
}

.detail-label {
  font-weight: 500;
  color: #555;
  min-width: 120px;
}

.detail-value {
  color: #333;
}

.appointment-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  padding-top: 0.75rem;
  border-top: 1px solid #f5f5f5;
}

@media (max-width: 768px) {
  .filters {
    flex-direction: column;
    gap: 0.75rem;
  }

  .filter-group {
    width: 100%;
  }

  .appointment-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .days-left {
    align-self: flex-start;
  }

  .detail-row {
    flex-direction: column;
    gap: 0.25rem;
  }

  .detail-label {
    min-width: auto;
  }
}
</style>
