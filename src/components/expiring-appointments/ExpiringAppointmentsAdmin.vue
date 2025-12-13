<template>
  <!-- Bulk Actions Widget -->
  <BulkActionsWidget
    :selected-ids="selectedAppointments"
    singular-label="Termin"
    plural-label="Termine"
    @clear-selection="clearSelection"
  >
    <template #actions="{ selectedCount }">
      <div class="extend-section">
        <label for="extension-months">Verlängern um:</label>
        <select id="extension-months" v-model="extensionMonths" class="ct-select">
          <option value="3">3 Monate</option>
          <option value="6">6 Monate</option>
          <option value="12">12 Monate</option>
          <option value="18">18 Monate</option>
          <option value="24">24 Monate</option>
        </select>
      </div>
      <button
        @click="handleExtendAppointments"
        :disabled="isProcessing"
        class="bulk-action-btn success"
      >
        <span v-if="isProcessing" class="action-spinner"></span>
        {{ isProcessing ? 'Verlängere...' : `${selectedCount} Termine verlängern` }}
      </button>
    </template>
  </BulkActionsWidget>

  <!-- Appointment Details Modal -->
  <div v-if="selectedAppointment" class="modal-overlay">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>{{ selectedAppointment.base?.title || 'Termin' }}</h3>
        <button class="close-btn" @click="selectedAppointment = null">&times;</button>
      </div>
      <div class="modal-body">
        <div class="appointment-details">
          <!-- Basic Info Card -->
          <div class="detail-card">
            <h4>Termindetails</h4>
            <div class="detail-grid-two-col">
              <div class="detail-item">
                <span class="detail-label">Titel:</span>
                <span>{{ selectedAppointment.base?.title || '-' }}</span>
              </div>
              <div class="detail-item" v-if="selectedAppointment.base?.subtitle">
                <span class="detail-label">Untertitel:</span>
                <span>{{ selectedAppointment.base.subtitle }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Kalender:</span>
                <div class="calendar-badge">
                  <span
                    class="calendar-color"
                    :style="{ backgroundColor: selectedAppointment.base?.calendar?.color }"
                  ></span>
                  <span>{{ selectedAppointment.base?.calendar?.name || '-' }}</span>
                </div>
              </div>
              <div class="detail-item">
                <span class="detail-label">Serienbeginn:</span>
                <span>{{ formatDate(selectedAppointment.base?.startDate) }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Serienende:</span>
                <span>{{ getEffectiveEndDate(selectedAppointment) }}</span>
              </div>
              <div class="detail-item" v-if="selectedAppointment.base?.address">
                <span class="detail-label">Adresse:</span>
                <span>{{ formatAddress(selectedAppointment.base.address) }}</span>
              </div>
              <div class="detail-item" v-if="selectedAppointment.base?.link">
                <span class="detail-label">Link:</span>
                <a :href="selectedAppointment.base.link" target="_blank" class="appointment-link">
                  {{ selectedAppointment.base.link }}
                </a>
              </div>
            </div>
          </div>

          <!-- Series Information Card -->
          <div class="detail-card" v-if="selectedAppointment.base?.repeatId">
            <h4>Serientermin</h4>
            <div class="detail-grid-two-col">
              <div class="detail-item">
                <span class="detail-label">Serie:</span>
                <span>
                  {{ getRepetitionText(selectedAppointment.base) }}
                </span>
              </div>
            </div>

            <!-- Exceptions -->
            <div class="detail-list" v-if="selectedAppointment.base.exceptions?.length">
              <div class="detail-list-header">
                <span class="detail-label">
                  Ausnahmen ({{ selectedAppointment.base.exceptions.length }}):
                </span>
                <button
                  v-if="selectedAppointment.base.exceptions.length > 10"
                  @click="showAllExceptions = !showAllExceptions"
                  class="toggle-btn"
                >
                  {{ showAllExceptions ? 'Weniger anzeigen' : 'Alle anzeigen' }}
                </button>
              </div>
              <div class="date-chips">
                <span
                  v-for="(exception, index) in displayedExceptions"
                  :key="exception.id || index"
                  class="date-chip"
                >
                  {{ formatDate(exception.date) }}
                </span>
              </div>
            </div>

            <!-- Additional Dates -->
            <div class="detail-list" v-if="selectedAppointment.base.additionals?.length">
              <span class="detail-label">Weitere Termine:</span>
              <div class="date-chips">
                <span
                  v-for="additional in selectedAppointment.base.additionals"
                  :key="additional.id"
                  class="date-chip"
                >
                  {{ formatDate(additional.date) }}
                </span>
              </div>
            </div>
          </div>

          <!-- Tags Card -->
          <div class="detail-card" v-if="selectedAppointment.tags?.length">
            <h4>Tags</h4>
            <div class="tags-container">
              <span
                v-for="tag in [...selectedAppointment.tags].sort((a, b) =>
                  a.name.localeCompare(b.name)
                )"
                :key="tag.id"
                class="tag-badge"
                :style="{
                  '--tag-bg': getTagColor(tag.color),
                  '--tag-text': getContrastColor(getTagColor(tag.color)),
                }"
              >
                {{ tag.name }}
              </span>
            </div>
          </div>

          <!-- Description Card -->
          <div class="detail-card" v-if="selectedAppointment.base?.description">
            <h4>Beschreibung</h4>
            <div class="description-content" v-html="selectedAppointment.base.description"></div>
          </div>

          <!-- Image Card -->
          <div class="detail-card" v-if="selectedAppointment.base?.image?.imageUrl">
            <h4>Bild</h4>
            <img
              :src="selectedAppointment.base.image.imageUrl"
              :alt="selectedAppointment.base?.title"
              class="appointment-image"
            />
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
    row-key="seriesId"
    title="auslaufende Terminserien - Admin Panel"
    description="Überwachung und Verwaltung aller auslaufenden Terminserien"
    searchable
    search-placeholder="Suche nach ID, Titel oder Kalender..."
    :search-fields="['seriesId', 'base.title', 'base.calendar.name']"
    default-sort-field="seriesId"
    loading-text="Lade auslaufende Terminserien..."
    empty-text="Keine auslaufenden Termine gefunden."
    selectable
    @retry="refreshData"
    @reload="refreshData"
    @selection-change="handleSelectionChange"
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
      <span class="id-cell">{{ item.seriesId || item.base?.id || 'NO_ID' }}</span>
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
                '--tag-text': getContrastColor(getTagColor(tag.color)),
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
import BulkActionsWidget from '@/components/common/BulkActionsWidget.vue'
import type { TableColumn } from '@/types/table'
import {
  findExpiringSeries,
  getAppointmentUrl,
  fetchAppointmentSeries,
  type Appointment,
} from '@/services/churchtools'
import { useExpiringAppointments } from '@/composables/useExpiringAppointments'
import { useTags } from '@/composables/useTags'
import { useBulkAppointmentActions } from '@/composables/useBulkAppointmentActions'
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

// Bulk actions
const { isProcessing, extendAppointments } = useBulkAppointmentActions()
const extensionMonths = ref(12)

// Handle selection changes from AdminTable
const handleSelectionChange = (selectedIds: number[]) => {
  selectedAppointments.value = selectedIds
}

// Modal state
const selectedAppointment = ref<any>(null)
const showAllExceptions = ref(false)

// Show appointment details in modal
const showAppointmentDetails = async (appointment: any) => {
  const startTime = performance.now()
  console.log('🔍 Opening appointment details...')

  // Show modal immediately with preview data
  selectedAppointment.value = appointment
  showAllExceptions.value = false

  try {
    // Fetch full appointment series data
    const appointmentId = appointment.base?.id || appointment.seriesId
    const startDate = appointment.base?.startDate?.split('T')[0] || appointment.base?.startDate

    console.log(`📡 Fetching series ${appointmentId} with startDate ${startDate}`)
    const fetchStart = performance.now()

    if (appointmentId && startDate) {
      const fullData = await fetchAppointmentSeries(appointmentId, startDate)
      const fetchEnd = performance.now()
      console.log(`✅ API call took ${(fetchEnd - fetchStart).toFixed(0)}ms`)
      console.log('📦 Full data structure:', fullData)
      console.log('📦 Has base?', !!fullData.base)
      console.log('📦 Has calculated?', !!fullData.calculated)
      console.log('📦 Has tags?', !!fullData.tags)

      // Update with full data
      const updateStart = performance.now()

      // The API returns { appointment: { base, calculated } }
      const appointmentData = fullData.appointment || fullData
      selectedAppointment.value = {
        base: appointmentData.base,
        calculated: appointmentData.calculated,
        tags: appointmentData.base?.tags || appointment.tags,
        seriesId: appointmentData.base?.id,
      }

      const updateEnd = performance.now()
      console.log(`✅ Data update took ${(updateEnd - updateStart).toFixed(0)}ms`)
      console.log('📦 Updated appointment:', selectedAppointment.value)
    }

    const totalTime = performance.now() - startTime
    console.log(`✅ Total time: ${totalTime.toFixed(0)}ms`)
  } catch (error) {
    console.error('❌ Error loading appointment details:', error)
    // Keep showing preview data if loading fails
  }
}

// Computed property for displayed exceptions
const displayedExceptions = computed(() => {
  if (!selectedAppointment.value?.base?.exceptions) return []
  const exceptions = selectedAppointment.value.base.exceptions
  if (showAllExceptions.value || exceptions.length <= 10) {
    return exceptions
  }
  return exceptions.slice(0, 10)
})

// Format address
const formatAddress = (address: any) => {
  if (!address) return '-'
  if (typeof address === 'string') return address

  const parts = []
  if (address.street) parts.push(address.street)
  if (address.addition) parts.push(address.addition)
  if (address.zip || address.city) {
    const cityPart = [address.zip, address.city].filter(Boolean).join(' ')
    parts.push(cityPart)
  }

  return parts.join(', ') || '-'
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

// Get full repetition text based on repeatId and repeatFrequency
const getRepetitionText = (base: any) => {
  if (!base.repeatId || base.repeatId === 0) {
    return 'Keine Wiederholung'
  }

  if (base.repeatId === 999) {
    return 'Manuell'
  }

  const frequency = base.repeatFrequency || 1
  let typeText = ''
  let intervalText = ''

  // Determine type based on repeatId
  switch (base.repeatId) {
    case 1: // DAILY
      typeText = frequency === 1 ? 'Täglich' : 'Alle ' + frequency + ' Tage'
      break
    case 7: // WEEKLY
      typeText = frequency === 1 ? 'Wöchentlich' : 'Alle ' + frequency + ' Wochen'
      break
    case 31: // MONTHLY_BY_DATE
      typeText =
        frequency === 1
          ? 'Monatlich (am gleichen Tag)'
          : 'Alle ' + frequency + ' Monate (am gleichen Tag)'
      break
    case 32: // MONTHLY_BY_WEEKDAY
      typeText =
        frequency === 1
          ? 'Monatlich (am gleichen Wochentag)'
          : 'Alle ' + frequency + ' Monate (am gleichen Wochentag)'
      break
    case 365: // YEARLY
      typeText = frequency === 1 ? 'Jährlich' : 'Alle ' + frequency + ' Jahre'
      break
    default:
      typeText = 'Benutzerdefiniert'
  }

  // Add end date info
  if (base.repeatUntil) {
    return typeText + ', bis ' + formatDate(base.repeatUntil)
  } else {
    return typeText + ', ohne Enddatum'
  }
}

// Format repetition type for display (kept for backward compatibility)
const formatRepetitionType = (type: string | undefined) => {
  if (!type) return 'Keine'

  const types: Record<string, string> = {
    daily: 'Täglich',
    weekly: 'Wöchentlich',
    monthly: 'Monatlich',
    yearly: 'Jährlich',
    workday: 'Jeden Werktag',
    custom: 'Benutzerdefiniert',
  }

  return types[type] || type
}

const clearSelection = () => {
  if (adminTableRef.value?.clearSelection) {
    adminTableRef.value.clearSelection()
  }
}

// Bulk action handlers
const handleExtendAppointments = async () => {
  if (selectedAppointments.value.length === 0) return

  // Get the actual appointment objects for the selected series IDs
  const selectedAppointmentObjects = appointments.value.filter((apt) =>
    selectedAppointments.value.includes(apt.seriesId)
  )

  // Prepare data with seriesId and startDate for API call
  const appointmentsData = selectedAppointmentObjects.map((apt) => ({
    seriesId: apt.base?.id,
    startDate: apt.base?.startDate?.split('T')[0] || apt.base?.startDate,
  }))

  const result = await extendAppointments(appointmentsData, extensionMonths.value)

  if (result.success > 0) {
    // Clear selection and refresh data
    clearSelection()
    await refreshData()
  }
}

const clearAppointmentSelections = () => {
  selectedAppointments.value = []
}

// Fetch tags for filtering
const { data: allTags } = useTags()

// Filter tags to only show appointment tags
const appointmentTags = computed(() => {
  return allTags.value?.filter((tag) => tag.domainType === 'appointment') || []
})

// Use cached appointments data from TanStack Query
// Load all appointments - tag filtering happens client-side in applyFilters()
const {
  data: cachedAppointments,
  isLoading: cacheLoading,
  error: cacheError,
  refetch,
} = useExpiringAppointments(9999) // Load all appointments

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
      // Apply filters when new data arrives
      applyFilters()
    }
  },
  { immediate: true }
)

// Table configuration
const tableColumns: TableColumn[] = [
  {
    key: 'seriesId',
    label: 'Serien-ID',
    sortable: true,
    resizable: true,
    width: 80,
    cellSlot: 'cell-id',
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
    basic: '#e0e0e0',
    blue: '#2196F3',
    green: '#4CAF50',
    yellow: '#FFC107',
    red: '#F44336',
    purple: '#9C27B0',
    orange: '#FF9800',
    teal: '#009688',
    pink: '#E91E63',
    brown: '#795548',
    gray: '#9E9E9E',
    black: '#000000',
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
  console.log('🔍 applyFilters called with:', {
    daysInAdvance: daysInAdvance.value,
    calendarFilter: calendarFilter.value,
    statusFilter: statusFilter.value,
    selectedTagIds: selectedTagIds.value,
    cachedAppointmentsCount: cachedAppointments.value?.length || 0,
  })

  localLoading.value = true
  localError.value = null

  try {
    if (!cachedAppointments.value) {
      console.log('⚠️ No cached appointments available')
      return
    }

    // Apply filters
    let filtered = [...cachedAppointments.value]
    console.log('📊 Starting with', filtered.length, 'appointments')

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
      console.log('🏷️ Filtering by tags:', selectedTagIds.value)
      console.log('📊 Before tag filter:', filtered.length, 'appointments')
      filtered = filtered.filter((appointment) => {
        const appointmentTags = appointment.base.tags || []
        const hasMatchingTag = selectedTagIds.value.some((tagId) =>
          appointmentTags.some((tag: any) => tag.id === tagId)
        )
        return hasMatchingTag
      })
      console.log('📊 After tag filter:', filtered.length, 'appointments')
    }

    // Normalize appointments to ensure seriesId exists for row-key
    appointments.value = filtered.map((appointment) => ({
      ...appointment,
      seriesId: appointment.base?.id,
    }))
    console.log('✅ Applied filters, result:', appointments.value.length, 'appointments')
  } catch (err) {
    console.error('❌ Error filtering appointments:', err)
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
})

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
  padding: 1.5rem;
  background: #f9fafb;
  max-height: 70vh;
  overflow-y: auto;
}

.appointment-details {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* Detail Cards */
.detail-card {
  background: white;
  border-radius: 8px;
  padding: 1.25rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.detail-card h4 {
  margin: 0 0 1rem 0;
  color: #1f2937;
  font-size: 1rem;
  font-weight: 600;
  border-bottom: 2px solid #e5e7eb;
  padding-bottom: 0.5rem;
}

/* Two-column grid for details */
.detail-grid-two-col {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

@media (max-width: 768px) {
  .detail-grid-two-col {
    grid-template-columns: 1fr;
  }
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.detail-label {
  font-weight: 600;
  color: #6b7280;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.detail-item > span:not(.detail-label) {
  color: #1f2937;
  font-size: 0.95rem;
}

/* List items */
.detail-list {
  margin-top: 1rem;
}

.detail-list .detail-label {
  display: block;
  margin-bottom: 0.5rem;
}

/* Date chips */
.date-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.date-chip {
  display: inline-block;
  padding: 0.375rem 0.75rem;
  background: #f3f4f6;
  border-radius: 6px;
  font-size: 0.875rem;
  color: #374151;
  border: 1px solid #e5e7eb;
}

/* Detail list header */
.detail-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.toggle-btn {
  padding: 0.25rem 0.75rem;
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 0.875rem;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s;
}

.toggle-btn:hover {
  background: #e5e7eb;
  border-color: #9ca3af;
}

/* Calendar badge */
.calendar-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.calendar-color {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
}

/* Appointment link */
.appointment-link {
  color: var(--ct-primary, #3498db);
  text-decoration: none;
  word-break: break-all;
}

.appointment-link:hover {
  text-decoration: underline;
}

/* Tags styling */
.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tag-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.375rem 0.875rem;
  background-color: var(--tag-bg) !important;
  border-radius: 1rem;
  font-size: 0.85rem;
  font-weight: 500;
  line-height: 1.5;
  white-space: nowrap;
}

/* Description styling */
.description-content {
  color: #374151;
  font-size: 0.95rem;
  line-height: 1.6;
  white-space: pre-wrap;
}

.description-content :deep(p) {
  margin: 0 0 0.75rem 0;
}

.description-content :deep(p:last-child) {
  margin-bottom: 0;
}

/* Image styling */
.appointment-image {
  width: 100%;
  max-width: 600px;
  height: auto;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
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
  background-color: var(--tag-bg) !important;
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

/* Bulk actions widget customization */
.extend-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.extend-section label {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--ct-text-primary, #2c3e50);
}

.ct-select {
  padding: 0.5rem;
  border: 1px solid var(--ct-border-color, #e0e0e0);
  border-radius: 4px;
  font-size: 0.9rem;
  background: white;
  cursor: pointer;
}

.ct-select:focus {
  outline: none;
  border-color: var(--ct-primary, #3498db);
  box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.1);
}
</style>
