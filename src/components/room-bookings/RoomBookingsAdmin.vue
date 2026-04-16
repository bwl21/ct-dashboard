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
      title="Raumbuchungsanfragen"
      description="Verwalte alle offenen Raumbuchungsanfragen"
      searchable
      search-placeholder="Raum, Person, Titel durchsuchen..."
      :search-fields="['title', 'resourceName', 'description']"
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
            <option :value="BOOKING_STATUS.PENDING">Ausstehend</option>
            <option :value="BOOKING_STATUS.APPROVED">Genehmigt</option>
            <option :value="BOOKING_STATUS.CANCELED">Abgelehnt</option>
          </select>
        </div>
      </template>

      <!-- Row Actions Column -->
      <template #cell-actions="{ row }">
        <div class="row-actions">
          <button
            type="button"
            @click="approveBooking(row.id)"
            class="ct-btn ct-btn-sm ct-btn-success"
            title="Genehmigen"
          >
            ✅
          </button>
          <button
            type="button"
            @click="showRejectDialog(row)"
            class="ct-btn ct-btn-sm ct-btn-danger"
            title="Ablehnen"
          >
            ❌
          </button>
        </div>
      </template>

      <!-- Conflict Indicator Cell -->
      <template #cell-conflicts="{ row }">
        <div v-if="row.conflicts && row.conflicts.length > 0" class="conflict-indicator">
          <span class="conflict-badge" :title="`${row.conflicts.length} Konflikt(e)`">
            ⚠️ {{ row.conflicts.length }}
          </span>
        </div>
        <div v-else class="no-conflict">-</div>
      </template>

      <!-- Person Column (created by / on behalf of) -->
      <template #cell-person="{ row }">
        <div class="person-info">
          <div>{{ row.onBehalfOf?.name || row.createdBy?.name || 'Unbekannt' }}</div>
          <div v-if="row.onBehalfOf" class="secondary-person">
            (i.A. von {{ row.createdBy?.name }})
          </div>
        </div>
      </template>

      <!-- Date/Time Column -->
      <template #cell-startDate="{ row }">
        <div class="datetime-info">
          <div>{{ formatDate(row.startDate) }}</div>
          <div class="time">{{ formatTime(row.startDate) }} - {{ formatTime(row.endDate) }}</div>
        </div>
      </template>
    </AdminTable>

    <!-- Reject Dialog -->
    <div v-if="showRejectDialogFlag" class="modal-overlay" @click.self="closeRejectDialog">
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import AdminTable from '../common/AdminTable.vue'
import { useRoomBookings, BOOKING_STATUS, type RoomBooking } from './useRoomBookings'
import { useToast } from '@/composables/useToast'

const { showToast } = useToast()

const {
  bookings,
  resources,
  filteredBookings,
  loading,
  error,
  filter,
  fetchResources,
  fetchBookings,
  approveBooking,
  rejectBooking,
  sendRejectionEmail,
  resolveConflictCreator,
  updateFilter,
  setSort,
  bulkApprove,
  bulkReject,
} = useRoomBookings()

// Selection state
const selectedBookingIds = ref(new Set<number>())

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
const selectedStatus = ref(BOOKING_STATUS.PENDING)

// Processing flag
const isBulkProcessing = ref(false)

// Table columns
const tableColumns = [
  { key: 'conflicts', label: '⚠️', width: '60px', sortable: false },
  { key: 'resourceName', label: 'Raum', width: '150px', sortable: true },
  { key: 'startDate', label: 'Termin', width: '200px', sortable: true },
  { key: 'person', label: 'Person', width: '200px', sortable: false },
  { key: 'title', label: 'Titel', width: '200px', sortable: true },
  { key: 'actions', label: 'Aktionen', width: '120px', sortable: false },
]

// Initialize
onMounted(async () => {
  try {
    await fetchResources()
    if (resources.value.length > 0) {
      const resourceIds = resources.value.map((r: any) => r.id)
      await fetchBookings(resourceIds, [selectedStatus.value])
    }
  } catch (err) {
    console.error('Error initializing:', err)
    showToast('Fehler beim Laden der Raumbuchungen', 'error')
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

const refreshData = async () => {
  try {
    if (resources.value.length > 0) {
      const resourceIds = resources.value.map((r: any) => r.id)
      await fetchBookings(resourceIds, filter.statusIds)
    }
  } catch (err) {
    showToast('Fehler beim Laden der Raumbuchungen', 'error')
  }
}

const updateStatusFilter = () => {
  filter.statusIds = [selectedStatus.value]
  refreshData()
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

// Single approve
const approveBooking = async (bookingId: number) => {
  try {
    await approveBooking(bookingId)
    showToast('Raumbuchung genehmigt', 'success')
    await refreshData()
  } catch (err: any) {
    showToast(`Fehler: ${err.message}`, 'error')
  }
}

// Reject dialog
const showRejectDialog = (booking: RoomBooking) => {
  rejectingBooking.value = booking
  rejectReason.value = ''
  showRejectDialogFlag.value = true
}

const closeRejectDialog = () => {
  showRejectDialogFlag.value = false
  rejectingBooking.value = null
  rejectReason.value = ''
}

const confirmReject = async () => {
  if (!rejectingBooking.value) return

  try {
    await rejectBooking(rejectingBooking.value.id, rejectReason.value)

    // Send rejection email
    const emailIds: number[] = []
    if (rejectingBooking.value.onBehalfOf?.id) emailIds.push(rejectingBooking.value.onBehalfOf.id)
    if (
      rejectingBooking.value.createdBy?.id &&
      rejectingBooking.value.createdBy.id !== rejectingBooking.value.onBehalfOf?.id
    ) {
      emailIds.push(rejectingBooking.value.createdBy.id)
    }

    // Add conflict creators
    if (rejectingBooking.value.conflicts && rejectingBooking.value.conflicts.length > 0) {
      for (const conflict of rejectingBooking.value.conflicts) {
        const creator = await resolveConflictCreator(conflict.bookingId)
        if (creator?.id && !emailIds.includes(creator.id)) {
          emailIds.push(creator.id)
        }
      }
    }

    // Send email if there are recipients
    if (emailIds.length > 0) {
      const subject = `[Raumbuchung] Ablehnung: ${rejectingBooking.value.title}`
      const htmlContent = `
        <p>Ihre Raumbuchung wurde leider abgelehnt:</p>
        <p><strong>${rejectingBooking.value.title}</strong><br>
        ${formatDate(rejectingBooking.value.startDate)} ${formatTime(rejectingBooking.value.startDate)} - ${formatTime(rejectingBooking.value.endDate)}</p>
        <p><strong>Begründung:</strong><br>${rejectReason.value}</p>
        <p>Für weitere Informationen kontaktieren Sie bitte die Administation.</p>
      `
      await sendRejectionEmail(emailIds, subject, htmlContent)
    }

    showToast('Raumbuchung abgelehnt und E-Mail versendet', 'success')
    closeRejectDialog()
    await refreshData()
  } catch (err: any) {
    showToast(`Fehler: ${err.message}`, 'error')
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
    showToast(`${ids.length} Raumbuchungen genehmigt`, 'success')
    clearSelection()
    await refreshData()
  } catch (err: any) {
    showToast(`Fehler: ${err.message}`, 'error')
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
    showToast(`${ids.length} Raumbuchungen abgelehnt`, 'success')
    clearSelection()
    await refreshData()
  } catch (err: any) {
    showToast(`Fehler: ${err.message}`, 'error')
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
  align-items: center;
  margin-bottom: 16px;
}

.filter-label {
  font-weight: 500;
  font-size: 0.9em;
}

.filter-select {
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
}

.no-conflict {
  color: #ccc;
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

.ct-btn-danger {
  background: #f44336;
  color: white;
  border-color: #f44336;
}

.ct-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
