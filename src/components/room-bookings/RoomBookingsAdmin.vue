<template>
  <div class="room-bookings-admin">
    <!-- AdminTable -->
    <AdminTable
      ref="adminTableRef"
      :data="filteredBookings"
      :loading="loading"
      :error="error"
      :columns="tableColumns"
      row-key="id"
      :selectable="true"
      :selected-items="selectedBookingIds"
      @selection-change="selectedBookingIds = $event"
      title="Raumbuchungsanfragen"
      description="Verwalte alle offenen Raumbuchungsanfragen"
      searchable
      search-placeholder="Raum, Person, Titel durchsuchen..."
      :search-fields="['title', 'resourceName', 'description', 'createdBy.name', 'onBehalfOf.name']"
      default-sort-field="startDate"
      loading-text="Lade Raumbuchungen..."
      empty-text="Keine Raumbuchungsanfragen gefunden."
      @retry="refreshData"
      @reload="refreshData"
    >
      <!-- Bulk Operations in Header -->
      <template #header-controls>
        <div class="bulk-operations">
          <div class="bulk-operations-header">
            <div class="bulk-title">
              <span class="bulk-icon">🔧</span>
              <span>Bulk Operationen</span>
            </div>
            <div class="selection-count">
              {{ selectedBookingIds.size }} ausgewählt
              <span v-if="filteredBookings.length < bookings.length" class="filter-info">
                (von {{ filteredBookings.length }} gefilterten)
              </span>
            </div>
          </div>

          <div class="bulk-controls-row">
            <button type="button" @click="toggleSelectAll" class="bulk-btn bulk-btn-outline">
              Alle auswählen
            </button>

            <button type="button" @click="clearSelection" class="bulk-btn bulk-btn-outline">
              Auswahl löschen
            </button>

            <button
              type="button"
              @click="bulkApproveConfirm"
              class="bulk-btn bulk-btn-success"
              :disabled="selectedBookingIds.size === 0 || isBulkProcessing"
            >
              {{ isBulkProcessing ? 'Verarbeite...' : '✅ Genehmigen' }}
            </button>

            <button
              type="button"
              @click="showBulkRejectDialog"
              class="bulk-btn bulk-btn-danger"
              :disabled="selectedBookingIds.size === 0 || isBulkProcessing"
            >
              ❌ Ablehnen
            </button>
          </div>
        </div>
      </template>

      <!-- Filters -->
      <template #filters>
        <div class="filter-container">
          <!-- Room Filter -->
          <label for="roomFilter" class="filter-label">Raum:</label>
          <select
            id="roomFilter"
            v-model.number="selectedRoomId"
            @change="updateRoomFilter"
            class="ct-select filter-select"
          >
            <option :value="0">Alle Räume</option>
            <option v-for="room in resourcesWithBookings" :key="room.id" :value="room.id">
              {{ room.name }}
            </option>
          </select>

          <!-- Date From Filter -->
          <label for="dateFromFilter" class="filter-label">Datum von:</label>
          <input
            id="dateFromFilter"
            v-model="filter.dateFrom"
            type="date"
            class="ct-input filter-select"
            @change="refreshData"
          />

          <!-- Date To Filter -->
          <label for="dateToFilter" class="filter-label">Datum bis:</label>
          <input
            id="dateToFilter"
            v-model="filter.dateTo"
            type="date"
            class="ct-input filter-select"
            @change="refreshData"
          />

          <!-- Conflict Filter -->
          <label for="conflictFilter" class="filter-label">Konflikte:</label>
          <select
            id="conflictFilter"
            v-model="filter.conflictStatus"
            @change="refreshData"
            class="ct-select filter-select"
          >
            <option value="all">Alle</option>
            <option value="with">Mit Konflikten</option>
            <option value="without">Ohne Konflikte</option>
          </select>

          <!-- Status Filter -->
          <label for="statusFilter" class="filter-label">Status:</label>
          <select
            id="statusFilter"
            v-model.number="selectedStatus"
            @change="updateStatusFilter"
            class="ct-select filter-select"
          >
            <option :value="0">Alle</option>
            <option :value="BOOKING_STATUS.PENDING">Ausstehend</option>
            <option :value="BOOKING_STATUS.APPROVED">Genehmigt</option>
            <option :value="BOOKING_STATUS.CANCELED">Abgelehnt</option>
          </select>
        </div>
      </template>

      <!-- Row Actions Column -->
      <template #actions="{ item: row }">
        <BookingActionBar
          :bookings="[row]"
          scope="row"
          density="compact"
          :show="['details', 'approve', 'reject', 'reset', 'delete']"
          @action="handleRowAction"
        />
      </template>

      <!-- Conflict Indicator Cell -->
      <template #conflicts="{ item: row }">
        <div v-if="row.conflicts && row.conflicts.length > 0" class="conflict-indicator">
          <button
            type="button"
            @click="showConflictDetails(row)"
            class="conflict-badge"
            :title="`${row.conflicts.length} Konflikt(e) - Klick für Details`"
          >
            ⚠️ {{ row.conflicts.length }}
          </button>
        </div>
        <div v-else class="no-conflict">-</div>
      </template>

      <!-- Person Column (created by / on behalf of) -->
      <template #person="{ item: row }">
        <div class="person-info">
          <div>{{ row.createdBy?.name || 'Unbekannt' }}</div>
          <div v-if="row.onBehalfOf" class="secondary-person">
            (i.A. von {{ row.onBehalfOf?.name }})
          </div>
        </div>
      </template>

      <!-- Date/Time Column -->
      <template #startDate="{ item: row }">
        <div class="datetime-info">
          <div>
            {{ formatDate(row.startDate) }}
            <span
              v-if="row.isRecurring"
              class="series-badge"
              :title="`Serie bis ${row.repeatUntil || 'unbegrenzt'}`"
            >
              🔄
            </span>
          </div>
          <div class="time">{{ formatTime(row.startDate) }} - {{ formatTime(row.endDate) }}</div>
        </div>
      </template>

      <!-- Status Column -->
      <template #status="{ item: row }">
        <span class="status-badge" :class="statusBadgeClass(row.statusId)">
          {{ statusLabel(row.statusId) }}
        </span>
      </template>

      <!-- Created Date Column -->
      <template #createdDate="{ item: row }">
        <div v-if="row.createdDate" class="datetime-info">
          <div>{{ formatDate(row.createdDate) }}</div>
          <div class="time">{{ formatTime(row.createdDate) }}</div>
        </div>
        <div v-else class="no-conflict">-</div>
      </template>

      <!-- Modified Date Column -->
      <template #modifiedDate="{ item: row }">
        <div v-if="row.modifiedDate" class="datetime-info">
          <div>{{ formatDate(row.modifiedDate) }}</div>
          <div class="time">{{ formatTime(row.modifiedDate) }}</div>
        </div>
        <div v-else class="no-conflict">-</div>
      </template>
    </AdminTable>

    <!-- Reject Dialog -->
    <div
      v-if="showRejectDialogFlag"
      class="modal-overlay reject-dialog-overlay"
      @click.self="closeRejectDialog"
    >
      <div class="modal-content">
        <h3>Raumbuchung ablehnen</h3>
        <p class="booking-title">{{ rejectingBooking?.title }}</p>

        <div
          v-if="rejectingBooking?.conflicts && rejectingBooking.conflicts.length > 0"
          class="conflict-info"
        >
          <h4>Konflikte:</h4>
          <ul>
            <li v-for="conflict in rejectingBooking.conflicts" :key="conflict.bookingId">
              {{ conflict.title }} ({{ formatDate(conflict.startDate) }})
            </li>
          </ul>
        </div>

        <label for="rejectReason" class="form-label">Begründung:</label>
        <textarea
          id="rejectReason"
          v-model="rejectReason"
          class="ct-textarea"
          placeholder="Grund für Ablehnung eingeben..."
          rows="4"
        ></textarea>

        <div class="modal-actions">
          <button type="button" @click="closeRejectDialog" class="ct-btn ct-btn-outline">
            Abbrechen
          </button>
          <button
            type="button"
            @click="confirmReject"
            class="ct-btn ct-btn-danger"
            :disabled="!rejectReason.trim()"
          >
            Ablehnen
          </button>
        </div>
      </div>
    </div>

    <!-- Bulk Reject Dialog -->
    <div v-if="showBulkRejectDialogFlag" class="modal-overlay" @click.self="closeBulkRejectDialog">
      <div class="modal-content">
        <h3>{{ selectedBookingIds.size }} Raumbuchungen ablehnen</h3>

        <label for="bulkRejectReason" class="form-label">Begründung:</label>
        <textarea
          id="bulkRejectReason"
          v-model="bulkRejectReason"
          class="ct-textarea"
          placeholder="Grund für Ablehnung eingeben..."
          rows="4"
        ></textarea>

        <div class="modal-actions">
          <button type="button" @click="closeBulkRejectDialog" class="ct-btn ct-btn-outline">
            Abbrechen
          </button>
          <button
            type="button"
            @click="confirmBulkReject"
            class="ct-btn ct-btn-danger"
            :disabled="!bulkRejectReason.trim()"
          >
            {{ selectedBookingIds.size }} Ablehnen
          </button>
        </div>
      </div>
    </div>

    <!-- Bulk Approve Confirmation Dialog -->
    <div
      v-if="showBulkApproveConfirmFlag"
      class="modal-overlay"
      @click.self="closeBulkApproveConfirm"
    >
      <div class="modal-content modal-small">
        <h3>{{ selectedBookingIds.size }} Raumbuchungen genehmigen?</h3>
        <p>Diese Aktion kann nicht rückgängig gemacht werden.</p>

        <div class="modal-actions">
          <button type="button" @click="closeBulkApproveConfirm" class="ct-btn ct-btn-outline">
            Abbrechen
          </button>
          <button type="button" @click="confirmBulkApprove" class="ct-btn ct-btn-success">
            Genehmigen
          </button>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Dialog -->
    <div
      v-if="showDeleteDialogFlag"
      class="modal-overlay delete-dialog-overlay"
      @click.self="closeDeleteDialog"
    >
      <div class="modal-content modal-small">
        <h3>Raumbuchung löschen?</h3>
        <p class="booking-title">{{ deletingBooking?.title }}</p>
        <p>Diese Aktion kann nicht rückgängig gemacht werden.</p>

        <div class="modal-actions">
          <button type="button" @click="closeDeleteDialog" class="ct-btn ct-btn-outline">
            Abbrechen
          </button>
          <button type="button" @click="confirmDelete" class="ct-btn ct-btn-danger">Löschen</button>
        </div>
      </div>
    </div>

    <!-- Details Modal -->
    <RoomBookingDetailsModal
      :booking="selectedBookingForDetails"
      @close="closeDetailsModal"
      @navigate-calendar="handleNavigateToCalendar"
      @navigate-details="handleNavigateToDetails"
      @approve-booking="handleApproveFromModal"
      @reject-booking="handleRejectFromModal"
      @reset-booking="handleResetFromModal"
      @delete-booking="handleDeleteFromModal"
    />

    <!-- Conflict Details Modal -->
    <ConflictDetailsModal
      :is-open="showConflictDetailsFlag"
      :booking="conflictBooking"
      @close="showConflictDetailsFlag = false"
      @navigate-calendar="handleNavigateToCalendar"
      @navigate-details="handleNavigateToDetails"
      @approve-booking="handleApproveFromModal"
      @reject-booking="handleRejectFromModal"
      @reset-booking="handleResetFromModal"
      @delete-booking="handleDeleteFromModal"
      @open-conflict-mail="handleOpenConflictMail"
    />

    <!-- Conflict Mail Modal -->
    <ConflictMailModal
      :is-open="showConflictMailFlag"
      :booking="conflictMailBooking"
      :recipients="conflictMailRecipients"
      :parties="conflictMailParties"
      :is-loading="conflictMailLoading"
      @close="handleCloseConflictMail"
      @send="handleSendConflictMail"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import AdminTable from '../common/AdminTable.vue'
import RoomBookingDetailsModal from './RoomBookingDetailsModal.vue'
import ConflictDetailsModal from './ConflictDetailsModal.vue'
import ConflictMailModal from './ConflictMailModal.vue'
import BookingActionBar from './BookingActionBar.vue'
import type { BookingActionId } from './useRoomBookingActions'
import {
  useRoomBookings,
  BOOKING_STATUS,
  type RoomBooking,
  type ConflictMailRecipient,
  type ConflictParty,
} from './useRoomBookings'
import { useToast } from '@/composables/useToast'

const { showSuccess, showError } = useToast()

const {
  bookings,
  resources,
  filteredBookings,
  resourcesWithBookings,
  loading,
  error,
  filter,
  fetchResources,
  fetchBookings,
  approveBooking: approveBookingApi,
  rejectBooking: rejectBookingApi,
  deleteBooking: deleteBookingApi,
  resetBookingToPending: resetBookingToPendingApi,
  sendRejectionEmail,
  resolveConflictCreator,
  collectConflictRecipients,
  sendConflictMail,
  navigateToEditBooking,
  updateFilter,
  setSort,
  bulkApprove,
  bulkReject,
  bulkDelete,
} = useRoomBookings()

// Selection state
const selectedBookingIds = ref(new Set<number>())

// Details modal
const showDetailsModalFlag = ref(false)
const selectedBookingForDetails = ref<RoomBooking | null>(null)

// Reject dialog
const showRejectDialogFlag = ref(false)
const rejectingBooking = ref<RoomBooking | null>(null)
const rejectReason = ref('')

// Bulk reject dialog
const showBulkRejectDialogFlag = ref(false)
const bulkRejectReason = ref('')

// Bulk approve confirmation
const showBulkApproveConfirmFlag = ref(false)

// Status filter
const selectedStatus = ref(0)

// Room filter
const selectedRoomId = ref(0)

// Delete dialog
const showDeleteDialogFlag = ref(false)
const deletingBooking = ref<RoomBooking | null>(null)

// Conflict details modal
const showConflictDetailsFlag = ref(false)
const conflictBooking = ref<RoomBooking | null>(null)

// Conflict mail modal
const showConflictMailFlag = ref(false)
const conflictMailBooking = ref<RoomBooking | null>(null)
const conflictMailRecipients = ref<ConflictMailRecipient[]>([])
const conflictMailParties = ref<ConflictParty[]>([])
const conflictMailLoading = ref(false)

// Processing flag
const isBulkProcessing = ref(false)

// Table columns
const tableColumns = [
  {
    key: 'conflicts',
    label: '⚠️',
    width: 30,
    sortable: true,
    resizable: false,
    cellSlot: 'conflicts',
  },
  { key: 'resourceName', label: 'Raum', width: 150, sortable: true, resizable: true },
  {
    key: 'startDate',
    label: 'Termin',
    width: 200,
    sortable: true,
    resizable: true,
    cellSlot: 'startDate',
  },
  {
    key: 'person',
    label: 'Erstelller',
    width: 200,
    sortable: true,
    resizable: true,
    cellSlot: 'person',
    sortKey: 'onBehalfOf.name',
  },
  { key: 'title', label: 'Titel', width: 200, sortable: true, resizable: true },
  {
    key: 'statusId',
    label: 'Status',
    width: 110,
    sortable: true,
    resizable: true,
    cellSlot: 'status',
  },
  {
    key: 'createdDate',
    label: 'Erstellt',
    width: 130,
    sortable: true,
    resizable: true,
    cellSlot: 'createdDate',
  },
  {
    key: 'modifiedDate',
    label: 'Geändert',
    width: 130,
    sortable: true,
    resizable: true,
    cellSlot: 'modifiedDate',
  },
  {
    key: 'actions',
    label: 'Aktionen',
    width: 120,
    sortable: false,
    resizable: false,
    cellSlot: 'actions',
  },
]

// Initialize
onMounted(async () => {
  try {
    await fetchResources()
    if (resources.value.length > 0) {
      const resourceIds = resources.value.map((r: any) => r.id)
      await fetchBookings(resourceIds, filter.statusIds, filter.dateFrom, filter.dateTo)
    }
  } catch (err) {
    console.error('Error initializing:', err)
    showError('Fehler beim Laden der Raumbuchungen')
  }
})

// Helper functions
const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('de-DE')
}

const formatTime = (dateStr: string): string => {
  const date = new Date(dateStr)
  return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
}

const statusLabel = (statusId: number): string => {
  switch (statusId) {
    case BOOKING_STATUS.PENDING:
      return 'Ausstehend'
    case BOOKING_STATUS.APPROVED:
      return 'Genehmigt'
    case BOOKING_STATUS.CANCELED:
      return 'Abgelehnt'
    case BOOKING_STATUS.DELETED:
      return 'Gelöscht'
    default:
      return 'Unbekannt'
  }
}

const statusBadgeClass = (statusId: number): string => {
  switch (statusId) {
    case BOOKING_STATUS.PENDING:
      return 'status-pending'
    case BOOKING_STATUS.APPROVED:
      return 'status-approved'
    case BOOKING_STATUS.CANCELED:
      return 'status-canceled'
    case BOOKING_STATUS.DELETED:
      return 'status-deleted'
    default:
      return 'status-unknown'
  }
}

const refreshData = async () => {
  try {
    if (resources.value.length > 0) {
      const resourceIds = resources.value.map((r: any) => r.id)
      await fetchBookings(resourceIds, filter.statusIds, filter.dateFrom, filter.dateTo)
    }
  } catch (err) {
    showError('Fehler beim Laden der Raumbuchungen')
  }
}

const updateStatusFilter = () => {
  // selectedStatus = 0 => "Alle" => empty array => no status filter applied to API
  filter.statusIds = selectedStatus.value === 0 ? [] : [selectedStatus.value]
  refreshData()
}

const updateRoomFilter = () => {
  if (selectedRoomId.value === 0) {
    filter.resourceIds = []
  } else {
    filter.resourceIds = [selectedRoomId.value]
  }
}

// Navigation handlers
const handleNavigateToCalendar = (bookingId: number) => {
  console.log('RoomBookingsAdmin: Navigating to calendar for booking', bookingId)
  const booking = bookings.value.find((b) => b.id === bookingId)
  if (booking) {
    console.log('Booking:', booking.title, booking.startDate, booking.resourceName)
    // Call navigateToEditBooking with the booking and resourceId
    navigateToEditBooking(booking, booking.resourceId)
  }
}

const handleNavigateToDetails = (bookingId: number) => {
  console.log('RoomBookingsAdmin: Navigating to details for booking', bookingId)
  // Find and show the booking details
  const booking = bookings.value.find((b) => b.id === bookingId)
  if (booking) {
    console.log('Showing details for booking:', booking.id, booking.title)
    selectedBookingForDetails.value = booking
  }
}

// Selection handlers
const toggleSelectAll = () => {
  if (selectedBookingIds.value.size === filteredBookings.value.length) {
    clearSelection()
  } else {
    filteredBookings.value.forEach((booking) => {
      selectedBookingIds.value.add(booking.id)
    })
  }
}

const clearSelection = () => {
  selectedBookingIds.value.clear()
}

// Details modal
const showDetailsModal = (booking: RoomBooking) => {
  selectedBookingForDetails.value = booking
  showDetailsModalFlag.value = true
}

const closeDetailsModal = () => {
  showDetailsModalFlag.value = false
  selectedBookingForDetails.value = null
}

const handleApproveFromModal = async (bookingId: number) => {
  try {
    await approveBookingApi(bookingId)
    showSuccess('Raumbuchung genehmigt')
    await refreshData()
    const updated = bookings.value.find((b) => b.id === bookingId)
    if (updated) selectedBookingForDetails.value = updated
  } catch (err: any) {
    showError(`Fehler: ${err.message}`)
  }
}

const handleRejectFromModal = (booking: RoomBooking) => {
  showRejectDialog(booking)
}

const handleResetFromModal = async (bookingId: number) => {
  try {
    await resetBookingToPendingApi(bookingId)
    showSuccess('Raumbuchung auf "Angefragt" zurückgesetzt')
    await refreshData()
    const updated = bookings.value.find((b) => b.id === bookingId)
    if (updated) selectedBookingForDetails.value = updated
  } catch (err: any) {
    showError(`Fehler: ${err.message}`)
  }
}

const handleDeleteFromModal = async (bookingId: number) => {
  closeDetailsModal()
  const booking = bookings.value.find((b) => b.id === bookingId)
  if (!booking) return
  showDeleteConfirm(booking)
}

// Single approve
const approveSingleBooking = async (bookingId: number) => {
  try {
    await approveBookingApi(bookingId)
    showSuccess('Raumbuchung genehmigt')
    await refreshData()
  } catch (err: any) {
    showError(`Fehler: ${err.message}`)
  }
}

// Reset to pending
const resetSingleBookingToPending = async (bookingId: number) => {
  try {
    await resetBookingToPendingApi(bookingId)
    showSuccess('Raumbuchung auf "Angefragt" zurückgesetzt')
    await refreshData()
  } catch (err: any) {
    showError(`Fehler: ${err.message}`)
  }
}

// Dispatcher for row-level <BookingActionBar> events
const handleRowAction = (id: BookingActionId, payload: { bookings: RoomBooking[] }) => {
  const row = payload.bookings[0]
  if (!row) return
  switch (id) {
    case 'details':
      showDetailsModal(row)
      break
    case 'approve':
      approveSingleBooking(row.id)
      break
    case 'reject':
      showRejectDialog(row)
      break
    case 'reset':
      resetSingleBookingToPending(row.id)
      break
    case 'delete':
      showDeleteConfirm(row)
      break
    case 'edit-calendar':
      // Not used in row scope, but kept for completeness
      break
  }
}

// Reject dialog
// Cache resolved conflict-creators per booking id to avoid resolving twice
// (once when opening the dialog to pre-fill the reason, once when sending the email).
const conflictCreatorsCache = new Map<
  number,
  {
    createdBy: { id: number; name: string; email?: string } | null
    onBehalfOf: { id: number; name: string; email?: string } | null
  } | null
>()

const formatPersonsSuffix = (
  persons: {
    createdBy: { name: string } | null
    onBehalfOf: { name: string } | null
  } | null
): string => {
  if (!persons) return ''
  const parts: string[] = []
  if (persons.onBehalfOf?.name) parts.push(persons.onBehalfOf.name)
  if (persons.createdBy?.name && persons.createdBy.name !== persons.onBehalfOf?.name) {
    parts.push(`erfasst von ${persons.createdBy.name}`)
  }
  return parts.length > 0 ? ` (${parts.join(', ')})` : ''
}

const showRejectDialog = async (booking: RoomBooking) => {
  rejectingBooking.value = booking
  rejectReason.value = ''
  showRejectDialogFlag.value = true

  // Pre-fill the reason with a description of conflicting bookings, including involved persons
  if (booking.conflicts && booking.conflicts.length > 0) {
    const lines: string[] = ['Es bestehen folgende Konflikte:', '']
    for (const conflict of booking.conflicts) {
      const persons = await resolveConflictCreator(conflict.bookingId)
      conflictCreatorsCache.set(conflict.bookingId, persons)
      const dateRange = `${formatDate(conflict.startDate)} ${formatTime(conflict.startDate)}–${formatTime(conflict.endDate)}`
      lines.push(`- "${conflict.title}" am ${dateRange}${formatPersonsSuffix(persons)}`)
    }
    lines.push('')
    lines.push('Bitte stimme dich ggf. mit den genannten Personen ab.')
    rejectReason.value = lines.join('\n')
  }
}

const closeRejectDialog = () => {
  showRejectDialogFlag.value = false
  rejectingBooking.value = null
  rejectReason.value = ''
  conflictCreatorsCache.clear()
}

const confirmReject = async () => {
  if (!rejectingBooking.value) return

  try {
    await rejectBookingApi(rejectingBooking.value.id, rejectReason.value)

    // Send rejection email
    const emailIds: number[] = []
    if (rejectingBooking.value.onBehalfOf?.id) emailIds.push(rejectingBooking.value.onBehalfOf.id)
    if (
      rejectingBooking.value.createdBy?.id &&
      rejectingBooking.value.createdBy.id !== rejectingBooking.value.onBehalfOf?.id
    ) {
      emailIds.push(rejectingBooking.value.createdBy.id)
    }

    // Add conflict creators (use cache populated when opening the dialog)
    if (rejectingBooking.value.conflicts && rejectingBooking.value.conflicts.length > 0) {
      for (const conflict of rejectingBooking.value.conflicts) {
        const persons =
          conflictCreatorsCache.get(conflict.bookingId) ??
          (await resolveConflictCreator(conflict.bookingId))
        if (persons?.onBehalfOf?.id && !emailIds.includes(persons.onBehalfOf.id)) {
          emailIds.push(persons.onBehalfOf.id)
        }
        if (persons?.createdBy?.id && !emailIds.includes(persons.createdBy.id)) {
          emailIds.push(persons.createdBy.id)
        }
      }
    }

    // Send email if there are recipients
    if (emailIds.length > 0) {
      const subject = `[Raumbuchung] Ablehnung: ${rejectingBooking.value.title}`
      // Convert plain-text newlines from the textarea to <br> for HTML rendering
      const reasonHtml = rejectReason.value.replace(/\n/g, '<br>')
      const htmlContent = `
        <p>Ihre Raumbuchung wurde leider abgelehnt:</p>
        <p><strong>${rejectingBooking.value.title}</strong><br>
        ${formatDate(rejectingBooking.value.startDate)} ${formatTime(rejectingBooking.value.startDate)} - ${formatTime(rejectingBooking.value.endDate)}</p>
        <p><strong>Begründung:</strong><br>${reasonHtml}</p>
        <p>Für weitere Informationen kontaktieren Sie bitte die Administation.</p>
      `
      await sendRejectionEmail(emailIds, subject, htmlContent)
    }

    const rejectedBookingId = rejectingBooking.value?.id
    showSuccess('Raumbuchung abgelehnt und E-Mail versendet')
    closeRejectDialog()
    await refreshData()
    const updated = bookings.value.find((b) => b.id === rejectedBookingId)
    if (updated && showDetailsModalFlag.value) {
      selectedBookingForDetails.value = updated
    }
  } catch (err: any) {
    showError(`Fehler: ${err.message}`)
  }
}

// Conflict details modal
const showConflictDetails = (booking: RoomBooking) => {
  conflictBooking.value = booking
  showConflictDetailsFlag.value = true
}

// Conflict mail
const handleOpenConflictMail = async (booking: RoomBooking) => {
  console.log('RoomBookingsAdmin: handleOpenConflictMail called', booking)
  if (!booking) {
    showError('Keine Buchung vorhanden')
    return
  }
  conflictMailBooking.value = booking
  conflictMailLoading.value = true
  try {
    const result = await collectConflictRecipients(booking)
    console.log('Collected recipients:', result.recipients.length, result.parties.length)
    conflictMailRecipients.value = result.recipients
    conflictMailParties.value = result.parties
    showConflictMailFlag.value = true
    console.log('ConflictMailModal opened')
  } catch (err: any) {
    console.error('collectConflictRecipients error:', err)
    showError(`Fehler beim Laden der Empfänger: ${err.message}`)
  } finally {
    conflictMailLoading.value = false
  }
}

const handleCloseConflictMail = () => {
  showConflictMailFlag.value = false
  conflictMailBooking.value = null
  conflictMailRecipients.value = []
  conflictMailParties.value = []
}

const handleSendConflictMail = async (draft: {
  recipients: ConflictMailRecipient[]
  subject: string
  bodyHtml: string
  bccSelf: boolean
}) => {
  try {
    await sendConflictMail({
      bookingId: conflictMailBooking.value!.id,
      recipients: draft.recipients,
      parties: conflictMailParties.value,
      subject: draft.subject,
      bodyHtml: draft.bodyHtml,
      bccSelf: draft.bccSelf,
    })
    showSuccess('E-Mail an Konflikt-Beteiligte gesendet')
    handleCloseConflictMail()
  } catch (err: any) {
    showError(`Fehler: ${err.message}`)
  }
}

// Delete dialog
const showDeleteConfirm = (booking: RoomBooking) => {
  deletingBooking.value = booking
  showDeleteDialogFlag.value = true
}

const closeDeleteDialog = () => {
  showDeleteDialogFlag.value = false
  deletingBooking.value = null
}

const confirmDelete = async () => {
  if (!deletingBooking.value) return

  try {
    await deleteBookingApi(deletingBooking.value.id)
    showSuccess('Raumbuchung gelöscht')
    closeDeleteDialog()
    await refreshData()
  } catch (err: any) {
    showError(`Fehler: ${err.message}`)
  }
}

// Bulk approve
const bulkApproveConfirm = () => {
  showBulkApproveConfirmFlag.value = true
}

const closeBulkApproveConfirm = () => {
  showBulkApproveConfirmFlag.value = false
}

const confirmBulkApprove = async () => {
  isBulkProcessing.value = true
  closeBulkApproveConfirm()

  try {
    const ids = Array.from(selectedBookingIds.value)
    await bulkApprove(ids)
    showSuccess(`${ids.length} Raumbuchungen genehmigt`)
    clearSelection()
    await refreshData()
  } catch (err: any) {
    showError(`Fehler: ${err.message}`)
  } finally {
    isBulkProcessing.value = false
  }
}

// Bulk reject
const showBulkRejectDialog = () => {
  bulkRejectReason.value = ''
  showBulkRejectDialogFlag.value = true
}

const closeBulkRejectDialog = () => {
  showBulkRejectDialogFlag.value = false
  bulkRejectReason.value = ''
}

const confirmBulkReject = async () => {
  isBulkProcessing.value = true
  closeBulkRejectDialog()

  try {
    const ids = Array.from(selectedBookingIds.value)
    await bulkReject(ids, bulkRejectReason.value)
    showSuccess(`${ids.length} Raumbuchungen abgelehnt`)
    clearSelection()
    await refreshData()
  } catch (err: any) {
    showError(`Fehler: ${err.message}`)
  } finally {
    isBulkProcessing.value = false
  }
}
</script>

<style scoped>
.room-bookings-admin {
  width: 100%;
}

.bulk-operations {
  margin-bottom: 20px;
  padding: 15px;
  background-color: #f5f5f5;
  border-radius: 4px;
}

.bulk-operations-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  font-weight: 500;
}

.bulk-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.bulk-icon {
  font-size: 1.2em;
}

.selection-count {
  font-size: 0.9em;
  color: #666;
}

.filter-info {
  margin-left: 4px;
  color: #999;
}

.bulk-controls-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
}

.bulk-btn {
  padding: 6px 12px;
  font-size: 0.9em;
  border: 1px solid #ccc;
  border-radius: 4px;
  cursor: pointer;
  white-space: nowrap;
}

.bulk-btn-outline {
  background: white;
  color: #333;
}

.bulk-btn-success {
  background: #4caf50;
  color: white;
  border-color: #4caf50;
}

.bulk-btn-danger {
  background: #f44336;
  color: white;
  border-color: #f44336;
}

.bulk-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.filter-container {
  display: flex;
  gap: 16px;
  align-items: flex-end;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.filter-label {
  font-weight: 500;
  font-size: 0.9em;
  display: block;
  margin-bottom: 4px;
}

.filter-select {
  padding: 6px 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 0.9em;
}

.ct-input {
  padding: 6px 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 0.9em;
}

.row-actions {
  display: flex;
  gap: 4px;
}

.conflict-indicator {
  display: inline-block;
  padding: 2px 8px;
  background-color: #fff3cd;
  border-radius: 4px;
}

.conflict-badge {
  color: #856404;
  font-weight: 500;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
  font-size: inherit;
  text-decoration: underline;
  text-decoration-color: transparent;
  transition: text-decoration-color 0.2s;
}

.conflict-badge:hover {
  text-decoration-color: #856404;
}

.no-conflict {
  color: #ccc;
}

.status-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
  white-space: nowrap;
}

.status-pending {
  background: #fff3cd;
  color: #856404;
}

.status-approved {
  background: #d4edda;
  color: #155724;
}

.status-canceled {
  background: #f8d7da;
  color: #721c24;
}

.status-deleted {
  background: #e2e3e5;
  color: #6c757d;
  text-decoration: line-through;
}

.status-unknown {
  background: #e2e3e5;
  color: #383d41;
}

.person-info {
  font-size: 0.9em;
}

.secondary-person {
  font-size: 0.8em;
  color: #666;
  margin-top: 2px;
}

.datetime-info {
  font-size: 0.9em;
}

.time {
  font-size: 0.85em;
  color: #666;
  margin-top: 2px;
}

.series-badge {
  display: inline-block;
  margin-left: 6px;
  font-size: 0.9em;
  cursor: help;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.reject-dialog-overlay {
  z-index: 1002;
}

.delete-dialog-overlay {
  z-index: 1002;
}

.modal-content {
  background: white;
  padding: 24px;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  max-width: 500px;
  width: 90%;
}

.modal-small {
  max-width: 400px;
}

.modal-content h3 {
  margin-top: 0;
  margin-bottom: 12px;
  color: #333;
}

.booking-title {
  margin: 8px 0 16px;
  padding: 8px;
  background: #f5f5f5;
  border-left: 3px solid #2196f3;
  color: #333;
}

.conflict-info {
  margin: 16px 0;
  padding: 12px;
  background: #fff3cd;
  border-radius: 4px;
}

.conflict-info h4 {
  margin: 0 0 8px 0;
  color: #856404;
}

.conflict-info ul {
  margin: 0;
  padding-left: 20px;
  color: #666;
}

.conflict-info li {
  margin: 4px 0;
}

.form-label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
}

.ct-textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-family: inherit;
  font-size: 0.9em;
  resize: vertical;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 20px;
}

.ct-btn {
  padding: 8px 16px;
  border: 1px solid #ccc;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9em;
  font-weight: 500;
  transition: all 0.2s;
}

.ct-btn-outline {
  background: white;
  color: #333;
}

.ct-btn-success {
  background: #4caf50;
  color: white;
  border-color: #4caf50;
}

.ct-btn-danger {
  background: #f44336;
  color: white;
  border-color: #f44336;
}

.ct-btn-info {
  background: #2196f3;
  color: white;
  border-color: #2196f3;
}

.ct-btn-delete {
  background: #9c27b0;
  color: white;
  border-color: #9c27b0;
}

.ct-btn-warning {
  background: #ff9800;
  color: white;
  border-color: #ff9800;
}

.ct-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
