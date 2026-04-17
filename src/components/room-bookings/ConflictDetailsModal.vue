<template>
  <div v-if="isOpen" class="modal-overlay" @click.self="closeModal">
    <div class="modal-content modal-large">
      <div class="modal-header">
        <h3>⚠️ Konflikt-Details</h3>
        <button type="button" @click="closeModal" class="close-btn">×</button>
      </div>

      <div class="modal-body">
        <!-- Main Booking Info -->
        <div class="section">
          <h4>Anfrage mit Konflikt</h4>
          <div class="booking-card primary">
            <div class="booking-title">{{ mainBooking.title }}</div>
            <div class="booking-meta">
              <div>
                <strong>Raum:</strong>
                {{ mainBooking.resourceName }}
              </div>
              <div>
                <strong>Datum:</strong>
                {{ formatDate(mainBooking.startDate) }}
              </div>
              <div>
                <strong>Uhrzeit:</strong>
                {{ formatTime(mainBooking.startDate) }} - {{ formatTime(mainBooking.endDate) }}
              </div>
              <div>
                <strong>Anfragender:</strong>
                {{ mainBooking.onBehalfOf?.name || mainBooking.createdBy?.name || 'Unbekannt' }}
              </div>
              <div v-if="mainBooking.onBehalfOf && mainBooking.createdBy" class="requester-info">
                <strong>Ersteller:</strong>
                {{ mainBooking.createdBy.name }}
              </div>
            </div>
          </div>
        </div>

        <!-- Conflicting Bookings -->
        <div class="section">
          <h4>Konfligierende Buchungen ({{ mainBooking.conflicts?.length || 0 }})</h4>
          <div class="conflicts-list">
            <div
              v-for="(conflict, index) in mainBooking.conflicts"
              :key="conflict.bookingId"
              class="booking-card conflict"
            >
              <div class="conflict-header">
                <span class="conflict-number">Konflikt {{ index + 1 }}</span>
                <span class="conflict-status" :class="getStatusClass(conflict.statusId)">
                  {{ getStatusLabel(conflict.statusId) }}
                </span>
              </div>

              <div class="booking-title">{{ conflict.title }}</div>

              <div class="booking-meta">
                <div>
                  <strong>Datum:</strong>
                  {{ formatDate(conflict.startDate) }}
                </div>
                <div>
                  <strong>Uhrzeit:</strong>
                  {{ formatTime(conflict.startDate) }} - {{ formatTime(conflict.endDate) }}
                </div>
              </div>

              <!-- Load creator info on demand -->
              <div v-if="loadingCreator === conflict.bookingId" class="loading-creator">
                Lade Ersteller-Info...
              </div>
              <div v-else-if="creatorInfo[conflict.bookingId]" class="creator-info">
                <strong>Ersteller:</strong>
                {{ creatorInfo[conflict.bookingId].name }}
                <span v-if="creatorInfo[conflict.bookingId].email" class="email">
                  ({{ creatorInfo[conflict.bookingId].email }})
                </span>
              </div>
              <div v-else class="creator-info-error">Ersteller-Info nicht verfügbar</div>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="section info-box">
          <p>
            💡
            <strong>Hinweis:</strong>
            Die konfligierenden Buchungen sind oben aufgelistet. Bei Ablehnung dieser Anfrage werden
            die Ersteller der Konflikte benachrichtigt.
          </p>
        </div>
      </div>

      <div class="modal-footer">
        <button type="button" @click="closeModal" class="ct-btn ct-btn-outline">Schließen</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { RoomBooking, RoomBookingPerson } from './useRoomBookings'
import { BOOKING_STATUS, useRoomBookings } from './useRoomBookings'

interface Props {
  isOpen: boolean
  booking: RoomBooking | null
}

const props = withDefaults(defineProps<Props>(), {
  isOpen: false,
  booking: null,
})

const emit = defineEmits<{
  close: []
}>()

const { resolveConflictCreator } = useRoomBookings()

// Creator info cache
const creatorInfo = ref<Record<number, RoomBookingPerson>>({})
const loadingCreator = ref<number | null>(null)

const mainBooking = computed(() => props.booking!)

// Load creator info for conflicts
const loadConflictCreators = async () => {
  if (!mainBooking.value?.conflicts || mainBooking.value.conflicts.length === 0) {
    return
  }

  for (const conflict of mainBooking.value.conflicts) {
    // Skip if already loaded
    if (creatorInfo.value[conflict.bookingId]) {
      continue
    }

    loadingCreator.value = conflict.bookingId
    try {
      const creator = await resolveConflictCreator(conflict.bookingId)
      if (creator) {
        creatorInfo.value[conflict.bookingId] = creator
      }
    } catch (err) {
      console.error(`Error loading creator for conflict ${conflict.bookingId}:`, err)
    } finally {
      loadingCreator.value = null
    }
  }
}

// Watch for modal open/close
watch(
  () => props.isOpen,
  (newIsOpen) => {
    if (newIsOpen) {
      // Reset creator info when opening modal
      creatorInfo.value = {}
      loadConflictCreators()
    }
  }
)

const closeModal = () => {
  emit('close')
}

const formatDate = (dateString: string): string => {
  try {
    return new Date(dateString).toLocaleDateString('de-DE', {
      weekday: 'short',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } catch {
    return dateString
  }
}

const formatTime = (dateString: string): string => {
  try {
    return new Date(dateString).toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return dateString
  }
}

const getStatusLabel = (statusId: number): string => {
  switch (statusId) {
    case BOOKING_STATUS.PENDING:
      return 'Ausstehend'
    case BOOKING_STATUS.APPROVED:
      return 'Genehmigt'
    case BOOKING_STATUS.CANCELED:
      return 'Abgelehnt'
    default:
      return 'Unbekannt'
  }
}

const getStatusClass = (statusId: number): string => {
  switch (statusId) {
    case BOOKING_STATUS.PENDING:
      return 'status-pending'
    case BOOKING_STATUS.APPROVED:
      return 'status-approved'
    case BOOKING_STATUS.CANCELED:
      return 'status-canceled'
    default:
      return 'status-unknown'
  }
}
</script>

<style scoped>
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
  z-index: 1001;
}

.modal-content {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  max-width: 700px;
  width: 90%;
  max-height: 90vh;
  overflow: auto;
  display: flex;
  flex-direction: column;
}

.modal-large {
  max-width: 750px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid #e0e0e0;
  flex-shrink: 0;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #999;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #f5f5f5;
  color: #333;
}

.modal-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid #e0e0e0;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  flex-shrink: 0;
}

.section {
  margin-bottom: 24px;
}

.section h4 {
  margin: 0 0 16px 0;
  font-size: 1rem;
  font-weight: 600;
  color: #333;
}

.booking-card {
  padding: 16px;
  border-radius: 6px;
  border-left: 4px solid #2196f3;
  background: #f5f9ff;
}

.booking-card.primary {
  border-left-color: #2196f3;
  background: #f5f9ff;
}

.booking-card.conflict {
  border-left-color: #ff9800;
  background: #fff8f0;
}

.conflict-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.conflict-number {
  font-weight: 500;
  color: #666;
  font-size: 0.9rem;
}

.conflict-status {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
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

.status-unknown {
  background: #e2e3e5;
  color: #383d41;
}

.booking-title {
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
  font-size: 1rem;
}

.booking-meta {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 0.9rem;
  color: #666;
}

.booking-meta div {
  display: flex;
  gap: 8px;
}

.booking-meta strong {
  color: #333;
  min-width: 80px;
}

.conflicts-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.loading-creator {
  margin-top: 8px;
  padding: 8px;
  background: #f0f0f0;
  border-radius: 4px;
  font-size: 0.85rem;
  color: #666;
}

.creator-info {
  margin-top: 8px;
  padding: 8px;
  background: #f9f9f9;
  border-radius: 4px;
  font-size: 0.9rem;
  color: #333;
}

.creator-info strong {
  color: #333;
}

.email {
  color: #666;
  font-size: 0.85rem;
  margin-left: 4px;
}

.creator-info-error {
  margin-top: 8px;
  padding: 8px;
  background: #ffe0e0;
  border-radius: 4px;
  font-size: 0.85rem;
  color: #666;
}

.info-box {
  padding: 12px;
  background: #e3f2fd;
  border-radius: 6px;
  border-left: 4px solid #2196f3;
  font-size: 0.9rem;
  color: #1976d2;
}

.info-box p {
  margin: 0;
}

.requester-info {
  margin-top: 6px;
  padding-top: 6px;
  border-top: 1px solid #e0e0e0;
  font-size: 0.9rem;
  color: #666;
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

.ct-btn-outline:hover {
  background: #f5f5f5;
  border-color: #999;
}

@media (max-width: 600px) {
  .modal-content {
    max-width: 95vw;
    max-height: 95vh;
  }

  .modal-header {
    padding: 16px;
  }

  .modal-body {
    padding: 16px;
  }

  .modal-footer {
    padding: 12px 16px;
  }

  .booking-meta {
    flex-direction: column;
  }

  .conflict-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}
</style>
