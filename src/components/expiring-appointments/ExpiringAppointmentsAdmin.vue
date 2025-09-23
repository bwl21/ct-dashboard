<template>
  <AdminTable
    :data="appointments"
    :loading="isLoading"
    :error="error"
    :columns="tableColumns"
    row-key="id"
    title="auslaufende Terminserien - Admin Panel"
    description="Überwachung und Verwaltung aller auslaufenden Terminserien"
    searchable
    search-placeholder="Suche nach ID, Titel oder Kalender..."
    :search-fields="['id', 'base.title', 'base.calendar.name']"
    default-sort-field="id"
    loading-text="Lade auslaufende Terminserien..."
    empty-text="Keine auslaufenden Termine gefunden."
    @retry="refreshData"
    @reload="refreshData"
  >
    <!-- Header Controls -->
    <template #header-controls>
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
    </template>

    <!-- Filters -->
    <template #filters>
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
    </template>

    <!-- Custom Actions -->
    <template #actions>
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
    </template>

    <!-- Custom Cell Rendering -->
    <template #cell-id="{ item }">
      <span class="id-cell">{{ item.id || item.base?.id || 'NO_ID' }}</span>
    </template>

    <template #cell-title="{ item }">
      {{ item.base?.title || 'Kein Titel' }}
    </template>

    <template #cell-calendar="{ item }">
      <div
        class="calendar-info"
        :style="{
          borderLeft: `3px solid ${item.base.calendar?.color || '#cccccc'}`,
          paddingLeft: '8px',
        }"
      >
        <span class="calendar-name">
          {{ item.base.calendar?.name || 'Unbekannter Kalender' }}
        </span>
      </div>
    </template>

    <template #cell-startDate="{ item }">
      {{ formatDate(item.base.startDate) }}
    </template>

    <template #cell-endDate="{ item }">
      {{ getEffectiveEndDate(item) }}
    </template>

    <template #cell-actions="{ item }">
      <a
        :href="getAppointmentUrl(item)"
        target="_blank"
        rel="noopener noreferrer"
        class="ct-btn ct-btn-sm ct-btn-outline"
        title="Termin in ChurchTools öffnen"
      >
        Öffnen
      </a>
    </template>
  </AdminTable>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { DashboardModule } from '@/types/modules'
import type { TableColumn } from '@/types/table'
import {
  findExpiringSeries,
  getAppointmentUrl,
  type Appointment,
} from '@/services/churchtools'
import AdminTable from '@/components/common/AdminTable.vue'

defineProps<{
  module: DashboardModule
}>()

// Configuration
const DAYS_TO_SHOW = 90

// State
const isLoading = ref(true)
const error = ref<string | null>(null)
const calendarFilter = ref('')
const statusFilter = ref('')
const daysInAdvance = ref('alle') // Default to "alle"

// Data
const appointments = ref<Appointment[]>([])

// Table configuration
const tableColumns: TableColumn[] = [
  { key: 'id', label: 'ID', sortable: true, resizable: true, width: 55, cellSlot: 'cell-id' },
  { key: 'base.title', label: 'Titel', sortable: true, resizable: true, width: 225, cellSlot: 'cell-title' },
  { key: 'base.calendar.name', label: 'Kalender', sortable: true, resizable: true, width: 200, cellSlot: 'cell-calendar' },
  { key: 'base.startDate', label: 'Anfang', sortable: true, resizable: true, width: 180, cellSlot: 'cell-startDate' },
  { key: 'base.repeatUntil', label: 'Ende', sortable: true, resizable: true, width: 180, cellSlot: 'cell-endDate' },
  { key: 'actions', label: 'Aktionen', resizable: false, width: 120, cellSlot: 'cell-actions' }
]

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
    calendarFilter.value !== '' ||
    statusFilter.value !== '' ||
    daysInAdvance.value !== 'alle'
  )
})

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
  if (daysUntilEnd <= DAYS_TO_SHOW) return 'expiring'
  return 'active'
}

// Helper functions
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

// URL generation is now handled by the churchtools service

// Filter functions
const clearFilters = () => {
  calendarFilter.value = ''
  statusFilter.value = ''
  daysInAdvance.value = 'alle'
}

// Data loading
const fetchData = async () => {
  isLoading.value = true
  error.value = null

  try {
    const expiringSeries = await findExpiringSeries(300000)
    console.log('Fetched appointments:', expiringSeries)
    if (expiringSeries.length > 0) {
      console.log('First appointment structure:', JSON.parse(JSON.stringify(expiringSeries[0])))
    }

    // Apply filters
    let filtered = expiringSeries

    // Filter by days in advance
    const now = new Date()
    if (daysInAdvance.value !== 'alle') {
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

    // Filter by calendar
    if (calendarFilter.value) {
      const calendarId = parseInt(calendarFilter.value)
      filtered = filtered.filter((appointment) => appointment.base.calendar?.id === calendarId)
    }

    // Filter by status
    if (statusFilter.value) {
      filtered = filtered.filter(
        (appointment) => getAppointmentStatus(appointment) === statusFilter.value
      )
    }

    appointments.value = filtered
  } catch (err) {
    console.error('Error fetching appointments:', err)
    error.value = 'Fehler beim Laden der Termine. Bitte versuchen Sie es erneut.'
  } finally {
    isLoading.value = false
  }
}

const refreshData = () => {
  fetchData()
}

// Initialize component
onMounted(() => {
  fetchData()
})
</script>

<style scoped>
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

.days-in-advance select {
  width: 80px;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--ct-border-color, #e0e0e0);
  border-radius: 4px;
  background: var(--ct-bg-primary, #ffffff);
  color: var(--ct-text-primary, #2c3e50);
  text-align: center;
}

.days-in-advance select:focus {
  outline: none;
  border-color: var(--ct-primary, #3498db);
  box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.1);
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

.id-cell {
  font-family: 'Courier New', monospace;
  font-size: 0.85rem;
  color: #000000 !important;
  font-weight: bold;
}

.calendar-info {
  display: flex;
  align-items: center;
  height: 100%;
}

.calendar-name {
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Button styles */
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

.ct-select {
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--ct-border-color, #e0e0e0);
  border-radius: 4px;
  background: var(--ct-bg-primary, #ffffff);
  color: var(--ct-text-primary, #2c3e50);
}

.ct-select:focus {
  outline: none;
  border-color: var(--ct-primary, #3498db);
  box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.1);
}
</style>