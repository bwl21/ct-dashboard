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
          <BookingDetails
            :booking="mainBooking"
            variant="primary"
            :show-status="true"
            :show-action-buttons="true"
            @navigate-calendar="$emit('navigate-calendar', mainBooking.id)"
            @navigate-details="$emit('navigate-details', mainBooking.id)"
          />
        </div>

        <!-- Conflicting Bookings -->
        <div class="section">
          <h4>Konfligierende Buchungen ({{ mainBooking.conflicts?.length || 0 }})</h4>
          <div class="conflicts-list">
            <BookingDetails
              v-for="(conflict, index) in mainBooking.conflicts"
              :key="conflict.bookingId"
              :booking="conflict"
              variant="conflict"
              :show-status="true"
              :show-index="true"
              :index="`Konflikt ${index + 1}`"
              :show-action-buttons="true"
              :load-creator-info="true"
              @navigate-calendar="handleNavigateCalendar(conflict)"
              @navigate-details="handleNavigateDetails(conflict.bookingId)"
            />
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
import type { RoomBooking, RoomBookingPerson, RoomBookingConflict } from './useRoomBookings'
import { BOOKING_STATUS, useRoomBookings } from './useRoomBookings'
import BookingDetails from './BookingDetails.vue'

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
  'navigate-calendar': [bookingId: number]
  'navigate-details': [bookingId: number]
}>()

const mainBooking = computed(() => props.booking!)
const { navigateToEditBooking } = useRoomBookings()

const closeModal = () => {
  emit('close')
}

const handleNavigateCalendar = (conflict: RoomBookingConflict) => {
  console.log('ConflictDetailsModal: navigate-calendar clicked, conflict=', conflict)
  // Pass resourceId from mainBooking to navigateToEditBooking
  navigateToEditBooking(conflict, mainBooking.value.resourceId)
}

const handleNavigateDetails = (bookingId: number) => {
  console.log('ConflictDetailsModal: navigate-details clicked, bookingId=', bookingId)
  emit('navigate-details', bookingId)
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
  overflow-x: visible;
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

.conflicts-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
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
}
</style>
