<template>
  <div v-if="booking" class="modal-overlay" @click.self="closeModal">
    <div class="modal-content modal-large">
      <div class="modal-header">
        <h3>Raumbuchungs-Details</h3>
        <button type="button" @click="closeModal" class="close-btn">×</button>
      </div>

      <div class="modal-body">
        <!-- Main Booking -->
        <div class="detail-section">
          <BookingDetails
            :booking="booking"
            variant="primary"
            :show-status="true"
            :show-action-buttons="true"
            @navigate-calendar="$emit('navigate-calendar', booking.id)"
            @navigate-details="() => {}"
          />
        </div>

        <!-- Conflicts -->
        <div
          v-if="booking.conflicts && booking.conflicts.length > 0"
          class="detail-section conflict-section"
        >
          <h4>⚠️ Konflikte ({{ booking.conflicts.length }})</h4>
          <div class="conflicts-list">
            <BookingDetails
              v-for="(conflict, index) in booking.conflicts"
              :key="conflict.bookingId"
              :booking="conflict"
              variant="conflict"
              :show-status="true"
              :show-index="true"
              :index="`Konflikt ${index + 1}`"
              :show-action-buttons="true"
              :load-creator-info="true"
              @navigate-calendar="$emit('navigate-calendar', conflict.bookingId)"
              @navigate-details="handleNavigateDetails(conflict.bookingId)"
            />
          </div>
        </div>

        <div v-else class="detail-section">
          <p class="no-conflicts">✅ Keine Konflikte erkannt</p>
        </div>
      </div>

      <div class="modal-footer">
        <button type="button" @click="closeModal" class="ct-btn ct-btn-outline">Schließen</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { RoomBooking } from './useRoomBookings'
import { BOOKING_STATUS } from './useRoomBookings'
import BookingDetails from './BookingDetails.vue'

interface Props {
  booking: RoomBooking | null
}

const props = withDefaults(defineProps<Props>(), {
  booking: null,
})

const emit = defineEmits<{
  close: []
  'navigate-calendar': [bookingId: number]
  'navigate-details': [bookingId: number]
}>()

const closeModal = () => {
  emit('close')
}

const handleNavigateDetails = (bookingId: number) => {
  console.log('RoomBookingDetailsModal: navigate-details clicked, bookingId=', bookingId)
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
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  overflow: auto;
  display: flex;
  flex-direction: column;
}

.modal-large {
  max-width: 700px;
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

.detail-section {
  margin-bottom: 24px;
}

.conflict-section {
  background: #fff3cd;
  padding: 16px;
  border-radius: 6px;
  border-left: 4px solid #ffc107;
}

.conflict-section h4 {
  margin: 0 0 12px 0;
  color: #856404;
  font-size: 1rem;
}

.conflicts-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.no-conflicts {
  color: #155724;
  margin: 0;
  padding: 12px;
  background: #d4edda;
  border-radius: 4px;
  text-align: center;
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
