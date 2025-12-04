<template>
  <!-- Appointment Details Modal -->
  <div v-if="selectedAppointment" class="modal-overlay">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>{{ selectedAppointment.base?.title || 'Termin' }}</h3>
        <button class="close-btn" @click="selectedAppointment = null">&times;</button>
      </div>
      <div class="modal-body">
        <div class="appointment-details">
          <!-- Basic Info Section -->
          <div class="detail-section">
            <h4>Termindetails</h4>
            <div class="detail-grid">
              <div class="detail-row">
                <span class="detail-label">Titel:</span>
                <span>{{ selectedAppointment.base?.title || '-' }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Beginn:</span>
                <span>{{ formatDateTime(selectedAppointment.calculated?.startDate) }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Ende:</span>
                <span>{{ formatDateTime(selectedAppointment.calculated?.endDate) }}</span>
              </div>
              
              <!-- Series Information -->
              <template v-if="selectedAppointment.base?.repeatId">
                <div class="detail-row">
                  <span class="detail-label">Serie:</span>
                  <span>
                    <template v-if="selectedAppointment.base.repeatFrequency === 0 || selectedAppointment.base.repeatOption">
                      Manuell
                    </template>
                    <template v-else>
                      {{ getRepetitionType(selectedAppointment.base.repeatFrequency) }}
                      <template v-if="selectedAppointment.base.repeatFrequency > 1">
                        , alle {{ selectedAppointment.base.repeatFrequency }}
                        {{ getIntervalUnit(selectedAppointment.base.repeatFrequency) }}
                      </template>
                    </template>
                    <template v-if="selectedAppointment.base.repeatUntil">
                      , bis {{ formatDate(selectedAppointment.base.repeatUntil) }}
                    </template>
                    <template v-else-if="!selectedAppointment.base.repeatOption">
                      , ohne Enddatum
                    </template>
                  </span>
                </div>
                
                <!-- Exceptions -->
                <div class="detail-row" v-if="selectedAppointment.base.exceptions?.length">
                  <span class="detail-label">Ausnahmen:</span>
                  <span>
                    <template v-for="(exception, index) in selectedAppointment.base.exceptions" :key="exception.id || index">
                      {{ formatDate(exception.date) }}<template v-if="index < selectedAppointment.base.exceptions.length - 1">, </template>
                    </template>
                  </span>
                </div>
                
                <!-- Additional Dates -->
                <div class="detail-row" v-if="selectedAppointment.base.additionals?.length">
                  <span class="detail-label">Zusätzliche Termine:</span>
                  <span>
                    <template v-for="(date, index) in selectedAppointment.base.additionals" :key="index">
                      {{ formatDate(date) }}<template v-if="index < selectedAppointment.base.additionals.length - 1">, </template>
                    </template>
                  </span>
                </div>
              </template>
              
              <!-- Tags -->
              <div class="detail-row" v-if="selectedAppointment.tags?.length">
                <span class="detail-label">Tags:</span>
                <span class="tags-container">
                  <template v-for="(tag, index) in [...selectedAppointment.tags].sort((a, b) => a.name.localeCompare(b.name))" :key="tag.id">
                    <span 
                      class="tag-badge"
                      :style="{
                        backgroundColor: tag.color,
                        color: getContrastColor(tag.color)
                      }"
                    >
                      {{ tag.name }}
                    </span>
                    <template v-if="index < selectedAppointment.tags.length - 1">, </template>
                  </template>
                </span>
              </div>
              <div class="detail-row" v-else>
                <span class="detail-label">Tags:</span>
                <span>-</span>
              </div>
              
              <!-- Notes -->
              <div class="detail-row" v-if="selectedAppointment.base?.note">
                <span class="detail-label">Notizen:</span>
                <span class="note">{{ selectedAppointment.base.note }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <a
          :href="getAppointmentUrl(selectedAppointment)"
          target="_blank"
          rel="noopener noreferrer"
          class="ct-btn ct-btn-primary"
        >
          In ChurchTools öffnen
        </a>
        <button class="ct-btn ct-btn-outline" @click="selectedAppointment = null">Schließen</button>
      </div>
    </div>
  </div>

  <AdminTable
    ref="adminTableRef"
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
            <option value="14">14 Tage</option>
            <option value="60">60 Tage</option>
            <option value="180">6 Monate</option>
            <option value="365">12 Monate</option>
            <option value="450">15 Monate</option>
            <option value="550">18 Monate</option>
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
          <option v-for="calendar in availableCalendars" :key="calendar.id" :value="calendar.id">
            {{ calendar.name }}
          </option>
        </select>
      </div>

      <div class="filter-container">
        <TagMultiSelect
          v-model="selectedTagIds"
          :tags="appointmentTags"
          @update:modelValue="refreshData"
        />
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
      <button @click="refreshData" class="ct-btn ct-btn-primary refresh-btn" :disabled="isLoading">
        <span v-if="isLoading" class="btn-spinner"></span>
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

    <template #cell-tags="{ item }">
      <div class="appointment-tags">
        <template v-if="item.tags && item.tags.length > 0">
          <div class="tags-container">
            <div
              v-for="tag in [...item.tags].sort((a, b) => a.name.localeCompare(b.name))"
              :key="tag.id"
              class="tag-badge"
              :style="{
                '--tag-bg': getTagColor(tag.color),
                '--tag-text': getContrastColor(getTagColor(tag.color))
              }"
              :title="tag.description"
            >
              {{ tag.name }}
            </div>
          </div>
        </template>
        <span v-else class="no-tags">-</span>
      </div>
    </template>

    <template #header-checkbox>
      <input
        type="checkbox"
        :checked="areAllAppointmentsSelected"
        @change="toggleSelectAll"
        class="ct-checkbox"
      />
    </template>

    <template #cell-checkbox="{ item }">
      <div @click.stop>
        <input
          type="checkbox"
          :checked="isAppointmentSelected(item.id)"
          @click="toggleAppointmentSelection(item.id)"
          class="ct-checkbox"
        />
      </div>
    </template>

    <template #cell-actions="{ item }">
      <div class="action-buttons">
        <button
          @click="showAppointmentDetails(item)"
          class="ct-btn ct-btn-sm ct-btn-outline"
          title="Details anzeigen"
        >
          Details
        </button>
      </div>
    </template>
  </AdminTable>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import type { DashboardModule } from '@/types/modules'
import TagMultiSelect from '@/components/common/TagMultiSelect.vue'
import type { TableColumn } from '@/types/table'
import { findExpiringSeries, getAppointmentUrl, type Appointment } from '@/services/churchtools'
import { useExpiringAppointments } from '@/composables/useExpiringAppointments'
import { useTags } from '@/composables/useTags'
import AdminTable from '@/components/common/AdminTable.vue'
import { useToast } from '@/composables/useToast'

defineProps<{
  module: DashboardModule
}>()

// Configuration
const DAYS_TO_SHOW = 90

// Local state
const localLoading = ref(false)
const localError = ref<string | null>(null)
const calendarFilter = ref('')
const statusFilter = ref('')
const daysInAdvance = ref('alle') // Default to "alle"
const selectedTagIds = ref<number[]>([])

// Selection state
const selectedAppointments = ref<number[]>([])
const adminTableRef = ref()

// Modal state
const selectedAppointment = ref<any>(null)

// Show appointment details in modal
const showAppointmentDetails = (appointment: any) => {
  console.log('Selected appointment data:', JSON.parse(JSON.stringify(appointment)))
  selectedAppointment.value = appointment
}

// Format date for display (date only)
const formatDate = (dateInput: string | Date | null | undefined | { date: string }) => {
  if (!dateInput) return 'Nicht angegeben'
  
  try {
    let date: Date
    let dateString: string | Date = dateInput
    
    // Handle Proxy objects by converting to plain object
    if (dateInput && typeof dateInput === 'object' && 'date' in dateInput) {
      dateString = (dateInput as { date: string }).date
    }
    
    if (dateString instanceof Date) {
      date = dateString
    } else {
      // Handle YYYY-MM-DD format (which is what we get from the API)
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateString as string)) {
        date = new Date(dateString + 'T00:00:00')
      } else {
        date = new Date(dateString as string)
      }
    }
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.error('Invalid date:', dateInput)
      return 'Ungültiges Datum'
    }
    
    return date.toLocaleDateString('de-DE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
  } catch (e) {
    console.error('Error formatting date:', e, 'Input was:', dateInput)
    return 'Ungültiges Datum'
  }
}

// Format date and time for display
const formatDateTime = (dateString: string | null | undefined) => {
  if (!dateString) return 'Nicht angegeben'
  
  try {
    const date = new Date(dateString)
    return date.toLocaleString('de-DE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch (e) {
    console.error('Error formatting date:', e)
    return 'Ungültiges Datum/Zeit'
  }
}

// Get repetition type based on frequency
const getRepetitionType = (frequency: number) => {
  if (frequency === 1) return 'Täglich'
  if (frequency % 7 === 0) return 'Wöchentlich'
  if (frequency % 30 === 0) return 'Monatlich'
  if (frequency % 365 === 0) return 'Jährlich'
  return 'Benutzerdefiniert'
}

// Get interval unit based on frequency
const getIntervalUnit = (frequency: number) => {
  if (frequency === 1) return 'Tag'
  if (frequency % 365 === 0) return ' Jahre'
  if (frequency % 30 === 0) return ' Monate'
  if (frequency % 7 === 0) return ' Wochen'
  return ' Tage'
}

// Format repetition type for display (kept for backward compatibility)
const formatRepetitionType = (type: string | undefined) => {
  if (!type) return 'Keine'
  
  const types: Record<string, string> = {
    'daily': 'Täglich',
    'weekly': 'Wöchentlich',
    'monthly': 'Monatlich',
    'yearly': 'Jährlich',
    'workday': 'Jeden Werktag',
    'custom': 'Benutzerdefiniert'
  }
  
  return types[type] || type
}

// Selection methods
const toggleAppointmentSelection = (appointmentId: number) => (e: Event) => {
  // Prevent the default behavior and stop propagation
  e.preventDefault()
  e.stopPropagation()
  
  // Create a new array to ensure reactivity
  const newSelection = [...selectedAppointments.value]
  const index = newSelection.indexOf(appointmentId)
  
  if (index > -1) {
    newSelection.splice(index, 1)
  } else {
    newSelection.push(appointmentId)
  }
  
  // Update the selection
  selectedAppointments.value = newSelection
}

const isAppointmentSelected = (appointmentId: number) => {
  return selectedAppointments.value.includes(appointmentId)
}

// Computed property to check if all appointments are selected
const areAllAppointmentsSelected = computed(() => {
  const availableAppointments = filteredAppointments.value
  if (availableAppointments.length === 0) return false
  return availableAppointments.every(appointment => 
    selectedAppointments.value.includes(appointment.id)
  )
})

const toggleSelectAll = () => {
  const availableAppointments = filteredAppointments.value
  const availableIds = availableAppointments.map(a => a.id)
  
  if (areAllAppointmentsSelected.value) {
    // If all are selected, deselect all
    selectedAppointments.value = selectedAppointments.value.filter(
      id => !availableIds.includes(id)
    )
  } else {
    // If not all are selected, select all
    const newSelections = availableIds.filter(id => !selectedAppointments.value.includes(id))
    selectedAppointments.value = [...selectedAppointments.value, ...newSelections]
  }
}

const clearSelection = () => {
  selectedAppointments.value = []
}

// Computed property for filtered appointments (for select all functionality)
const filteredAppointments = computed(() => {
  // This should match your existing filtering logic
  return appointments.value.filter(appointment => {
    const matchesCalendar = !calendarFilter.value || 
      (appointment.base?.calendar?.id?.toString() === calendarFilter.value)
    // Add other filters as needed
    return matchesCalendar
  })
})

const clearAppointmentSelections = () => {
  selectedAppointments.value = []
}

// Fetch tags for filtering
const { data: allTags } = useTags()

// Filter tags to only show appointment tags
const appointmentTags = computed(() => {
  return allTags.value?.filter(tag => tag.domainType === 'appointment') || []
})

// Use cached appointments data from TanStack Query with tag filtering
const {
  data: cachedAppointments,
  isLoading: cacheLoading,
  error: cacheError,
  refetch,
} = useExpiringAppointments(
  daysInAdvance.value === 'alle' ? 9999 : parseInt(daysInAdvance.value, 10),
  selectedTagIds.value
)

// AdminTable reference is already declared in the selection state

// Data - prefer cached data
const appointments = ref<Appointment[]>([])
const isLoading = computed(() => cacheLoading.value || localLoading.value)
const error = computed(() => cacheError.value?.message || localError.value)

// Use cached appointments if available
watch(
  cachedAppointments,
  (newCachedAppointments) => {
    if (newCachedAppointments && newCachedAppointments.length > 0) {
      appointments.value = newCachedAppointments
    }
  },
  { immediate: true }
)

// Table configuration
const tableColumns: TableColumn[] = [
  {
    key: 'checkbox',
    label: '',
    sortable: false,
    resizable: false,
    width: 30,
    cellSlot: 'cell-checkbox',
    headerSlot: 'header-checkbox',
    headerClass: 'select-column',
    cellClass: 'select-cell'
  },
  { 
    key: 'id', 
    label: 'ID', 
    sortable: true, 
    resizable: true, 
    width: 55, 
    cellSlot: 'cell-id' 
  },
  {
    key: 'base.title',
    label: 'Titel',
    sortable: true,
    resizable: true,
    width: 225,
    cellSlot: 'cell-title',
  },
  {
    key: 'base.calendar.name',
    label: 'Kalender',
    sortable: true,
    resizable: true,
    width: 200,
    cellSlot: 'cell-calendar',
  },
  {
    key: 'base.startDate',
    label: 'Anfang',
    sortable: true,
    resizable: true,
    width: 180,
    cellSlot: 'cell-startDate',
  },
  {
    key: 'base.repeatUntil',
    label: 'Ende',
    sortable: true,
    resizable: true,
    width: 180,
    cellSlot: 'cell-endDate',
  },
  {
    key: 'base.tags',
    label: 'Tags',
    sortable: true,
    resizable: true,
    width: 200,
    cellSlot: 'cell-tags',
    // Custom sort function to sort by tag names
    sortFn: (a: any, b: any) => {
      const tagsA = (a.base.tags || []).map((t: any) => t.name).join(', ')
      const tagsB = (b.base.tags || []).map((t: any) => t.name).join(', ')
      return tagsA.localeCompare(tagsB)
    },
  },
  { key: 'actions', label: 'Aktionen', resizable: false, width: 120, cellSlot: 'cell-actions' },
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
  return calendarFilter.value !== '' || statusFilter.value !== '' || daysInAdvance.value !== 'alle'
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

// Helper function to map color names to hex values
const getTagColor = (colorName: string): string => {
  const colorMap: Record<string, string> = {
    'basic': '#e0e0e0',
    'blue': '#2196F3',
    'green': '#4CAF50',
    'yellow': '#FFC107',
    'red': '#F44336',
    'purple': '#9C27B0',
    'orange': '#FF9800',
    'teal': '#009688',
    'pink': '#E91E63',
    'brown': '#795548',
    'gray': '#9E9E9E',
    'black': '#000000'
  }
  return colorMap[colorName] || '#e0e0e0'
}

// Helper function to get contrasting text color based on background color
const getContrastColor = (hexColor: string) => {
  // If the color is light, return dark text color, otherwise return light text
  const r = parseInt(hexColor.slice(1, 3), 16)
  const g = parseInt(hexColor.slice(3, 5), 16)
  const b = parseInt(hexColor.slice(5, 7), 16)
  const brightness = (r * 299 + g * 587 + b * 114) / 1000
  return brightness > 128 ? '#000000' : '#ffffff'
}

// Helper functions - formatDate is defined above

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
  selectedTagIds.value = []

  // Reset AdminTable search
  if (adminTableRef.value?.clearSearch) {
    adminTableRef.value.clearSearch()
  }
}

// Filter functions
const applyFilters = () => {
  localLoading.value = true
  localError.value = null

  try {
    if (!cachedAppointments.value) return

    // Apply filters
    let filtered = [...cachedAppointments.value]

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

    // Filter by tags
    if (selectedTagIds.value.length > 0) {
      filtered = filtered.filter((appointment) => {
        const appointmentTags = appointment.base.tags || []
        return selectedTagIds.value.some((tagId) =>
          appointmentTags.some((tag: any) => tag.id === tagId)
        )
      })
    }

    appointments.value = filtered
  } catch (err) {
    console.error('Error filtering appointments:', err)
    localError.value = 'Fehler beim Filtern der Termine.'
  } finally {
    localLoading.value = false
  }
}

// Fetch data using the composable
const fetchData = async () => {
  localLoading.value = true
  try {
    await refetch()
    applyFilters()
  } catch (err) {
    console.error('Error fetching appointments:', err)
    localError.value = 'Fehler beim Laden der Termine. Bitte versuchen Sie es erneut.'
  } finally {
    localLoading.value = false
  }
}

// Refresh data function
const refreshData = () => {
  refetch()
}

// Watch for changes to filters and apply them
watch([daysInAdvance, calendarFilter, statusFilter, selectedTagIds], () => {
  applyFilters()
}, { immediate: true })

// Initialize component
onMounted(() => {
  if (!cachedAppointments.value || cachedAppointments.value.length === 0) {
    fetchData()
  } else {
    applyFilters()
  }
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
  margin-bottom: 0.5rem;
}

/* Style for multi-select dropdown */
select[multiple] {
  min-height: 38px;
  padding: 0.25rem;
}

select[multiple] option {
  padding: 0.25rem 0.5rem;
  margin: 0.125rem 0;
  border-radius: 3px;
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

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  padding: 20px;
  box-sizing: border-box;
  overflow-y: auto;
}

.modal-content {
  background: white;
  border-radius: 8px;
  width: 100%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
  color: #333; /* Set default text color */
}

.modal-header {
  padding: 20px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f9fafb;
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
}

.modal-header h3 {
  margin: 0;
  color: #1f2937;
  font-size: 1.25rem;
}

.modal-body {
  padding: 20px;
  background: white;
}

.detail-section {
  margin-bottom: 1.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.detail-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

div.detail-section > h4 {
  margin-top: 0;
  margin-bottom: 1rem;
  color: #1f2937;
  font-size: 1.1rem;
  font-weight: 600;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 0.75rem;
}

.detail-row {
  display: flex;
  margin-bottom: 0.5rem;
  line-height: 1.5;
  font-size: 0.95rem;
}

.detail-label {
  font-weight: 600;
  color: #4b5563;
  min-width: 120px;
  flex-shrink: 0;
}

/* Lists styling */
.exception-list,
.additional-dates {
  list-style: none;
  padding: 0;
  margin: 0.5rem 0 0 0;
}

.exception-list li,
.additional-dates li {
  padding: 0.5rem 0;
  border-bottom: 1px solid #f3f4f6;
}

.exception-list li:last-child,
.additional-dates li:last-child {
  border-bottom: none;
}

/* Tags styling */
.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.tag-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.85rem;
  font-weight: 500;
  line-height: 1.5;
  white-space: nowrap;
}

/* Notes styling */
.note {
  margin: 0.5rem 0 0 0;
  padding: 0.75rem;
  background-color: #f9fafb;
  border-radius: 0.375rem;
  white-space: pre-wrap;
  font-size: 0.95rem;
  line-height: 1.5;
  color: #4b5563;
}

.modal-footer {
  padding: 16px 20px;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  border-bottom-left-radius: 8px;
  border-bottom-right-radius: 8px;
}

/* Tag styles */
.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 0.25rem 0;
}

.tag-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 24px;
  padding: 0 10px;
  border-radius: 3px;
  font-size: 12px;
  font-weight: 500;
  line-height: 1;
  white-space: nowrap;
  background-color: var(--tag-bg, #e0e0e0);
  color: var(--tag-text, #333);
  border: 1px solid rgba(0, 0, 0, 0.1);
  position: relative;
  cursor: help;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.tag-badge:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}

.tag-badge[title]:hover::after {
  content: attr(title);
  position: absolute;
  bottom: 100%;
  left: 50%;
  max-width: 300px;
  width: max-content;
  transform: translateX(-50%) translateY(-8px);
  background-color: #2d3748;
  color: #fff;
  padding: 0.5rem 0.75rem;
  border-radius: 4px;
  font-size: 0.8rem;
  line-height: 1.4;
  white-space: normal;
  z-index: 1000;
  opacity: 0;
  visibility: hidden;
  transition: all 0.15s ease-out;
  pointer-events: none;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
  word-wrap: break-word;
  font-weight: 400;
  text-align: left;
}

.tag-badge[title]:hover::before {
  content: '';
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%) translateY(-3px);
  border-width: 5px 5px 0 5px;
  border-style: solid;
  border-color: #2d3748 transparent transparent transparent;
  z-index: 1001;
  opacity: 0;
  visibility: hidden;
  transition: all 0.15s ease-out;
}

.tag-badge[title]:hover::after,
.tag-badge[title]:hover::before {
  opacity: 1;
  visibility: visible;
  transform: translateX(-50%) translateY(0);
}

/* Selection styles */
.select-column {
  width: 40px;
  text-align: center;
  vertical-align: middle;
  padding: 0 !important;
  position: relative;
  background-color: var(--ct-bg-secondary, #f8f9fa);
  border-bottom: 2px solid var(--ct-border-color, #e0e0e0);
}

.select-cell {
  text-align: center;
  vertical-align: middle;
  padding: 0.5rem 0.5rem !important;
}

.checkbox-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  cursor: pointer;
  height: 100%;
  width: 100%;
  user-select: none;
}

.checkbox-wrapper input {
  position: absolute;
  opacity: 0;
  cursor: pointer;
  height: 0;
  width: 0;
}

.checkmark {
  position: relative;
  height: 16px;
  width: 16px;
  background-color: #fff;
  border: 1px solid #ccc;
  border-radius: 3px;
  transition: all 0.2s;
}

.checkbox-wrapper:hover input ~ .checkmark {
  border-color: #999;
}

.checkbox-wrapper input:checked ~ .checkmark {
  background-color: var(--ct-primary, #3498db);
  border-color: var(--ct-primary, #3498db);
}

.checkmark:after {
  content: "";
  position: absolute;
  display: none;
  left: 5px;
  top: 2px;
  width: 4px;
  height: 8px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.checkbox-wrapper input:checked ~ .checkmark:after {
  display: block;
}

.data-row {
  transition: background-color 0.2s ease;
}

.data-row:hover {
  background-color: rgba(0, 0, 0, 0.02);
}

.data-row.row-selected {
  background-color: rgba(52, 152, 219, 0.1);
}

.data-row.row-selected:hover {
  background-color: rgba(52, 152, 219, 0.15);
}

/* Selection styles */
.select-column {
  width: 40px;
  text-align: center;
  vertical-align: middle;
  padding: 0 !important;
  position: relative;
  background-color: var(--ct-bg-secondary, #f8f9fa);
  border-bottom: 2px solid var(--ct-border-color, #e0e0e0);
}

.select-cell {
  text-align: center;
  vertical-align: middle;
  padding: 0.5rem 0.5rem !important;
}

.row-checkbox {
  width: 16px;
  height: 16px;
  cursor: pointer;
  margin: 0;
  vertical-align: middle;
}

.data-row {
  transition: background-color 0.2s ease;
}

.data-row:hover {
  background-color: rgba(0, 0, 0, 0.02);
}

.data-row.row-selected {
  background-color: rgba(52, 152, 219, 0.1);
}

.data-row.row-selected:hover {
  background-color: rgba(52, 152, 219, 0.15);
}

.no-tags {
  color: #9e9e9e;
  font-style: italic;
  font-size: 0.875rem;
  padding: 0.5rem 0;
  display: inline-block;
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

.btn-spinner {
  display: inline-block;
  width: 12px;
  height: 12px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  margin-right: 0.5rem;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
