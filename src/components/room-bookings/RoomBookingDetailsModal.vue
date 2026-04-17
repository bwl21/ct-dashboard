<template>
  <div v-if="booking" class="modal-overlay" @click.self="closeModal">
    <div class="modal-content modal-large">
      <div class="modal-header">
        <h3>Raumbuchungs-Details</h3>
        <button type="button" @click="closeModal" class="close-btn">×</button>
      </div>

      <div class="modal-body">
        <!-- Title & Status -->
        <div class="detail-section">
          <div class="section-title">{{ booking.title }}</div>
          <div class="status-badge" :class="statusClass">
            {{ statusLabel }}
          </div>
        </div>

        <!-- Basic Info -->
        <div class="detail-grid">
          <div class="detail-item">
            <label>Raum/Ressource</label>
            <div class="detail-value">{{ booking.resourceName }}</div>
          </div>

          <div class="detail-item">
            <label>Datum</label>
            <div class="detail-value">{{ formatDate(booking.startDate) }}</div>
          </div>

          <div class="detail-item">
            <label>Uhrzeit</label>
            <div class="detail-value">
              {{ formatTime(booking.startDate) }} - {{ formatTime(booking.endDate) }}
            </div>
          </div>

          <div class="detail-item">
            <label>Anfragender</label>
            <div class="detail-value">
              {{ booking.onBehalfOf?.name || booking.createdBy?.name || 'Unbekannt' }}
              <span v-if="booking.onBehalfOf" class="secondary">
                (i.A. von {{ booking.createdBy?.name }})
              </span>
            </div>
          </div>
        </div>

        <!-- Description -->
        <div v-if="booking.description" class="detail-section">
          <label>Beschreibung</label>
          <div class="detail-value description-box">{{ booking.description }}</div>
        </div>

        <!-- Conflicts -->
        <div
          v-if="booking.conflicts && booking.conflicts.length > 0"
          class="detail-section conflict-section"
        >
          <h4>⚠️ Konflikte ({{ booking.conflicts.length }})</h4>
          <div class="conflicts-list">
            <div
              v-for="conflict in booking.conflicts"
              :key="conflict.bookingId"
              class="conflict-item"
            >
              <div class="conflict-title">{{ conflict.title }}</div>
              <div class="conflict-details">
                <span>{{ formatDate(conflict.startDate) }}</span>
                <span>
                  {{ formatTime(conflict.startDate) }} - {{ formatTime(conflict.endDate) }}
                </span>
              </div>
              <div class="conflict-status">
                Status:
                <strong>{{ getConflictStatusLabel(conflict.statusId) }}</strong>
              </div>
            </div>
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

interface Props {
  booking: RoomBooking | null
}

const props = withDefaults(defineProps<Props>(), {
  booking: null,
})

const emit = defineEmits<{
  close: []
}>()

const closeModal = () => {
  emit('close')
}

const statusClass = computed(() => {
  if (!props.booking) return ''
  switch (props.booking.statusId) {
    case BOOKING_STATUS.PENDING:
      return 'status-pending'
    case BOOKING_STATUS.APPROVED:
      return 'status-approved'
    case BOOKING_STATUS.CANCELED:
      return 'status-canceled'
    default:
      return 'status-unknown'
  }
})

const statusLabel = computed(() => {
  if (!props.booking) return ''
  switch (props.booking.statusId) {
    case BOOKING_STATUS.PENDING:
      return 'Ausstehend'
    case BOOKING_STATUS.APPROVED:
      return 'Genehmigt'
    case BOOKING_STATUS.CANCELED:
      return 'Abgelehnt'
    default:
      return 'Unbekannt'
  }
})

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

const getConflictStatusLabel = (statusId: number): string => {
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

.section-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.85rem;
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

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}

.detail-item {
  display: flex;
  flex-direction: column;
}

.detail-item label {
  font-weight: 500;
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 6px;
}

.detail-value {
  color: #333;
  font-size: 0.95rem;
  line-height: 1.4;
}

.detail-value.description-box {
  background: #f5f5f5;
  padding: 12px;
  border-radius: 4px;
  border-left: 3px solid #2196f3;
  white-space: pre-wrap;
  word-break: break-word;
}

.secondary {
  display: block;
  font-size: 0.85rem;
  color: #999;
  margin-top: 4px;
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

.conflict-item {
  background: white;
  padding: 12px;
  border-radius: 4px;
  border-left: 3px solid #ff9800;
}

.conflict-title {
  font-weight: 500;
  color: #333;
  margin-bottom: 6px;
}

.conflict-details {
  font-size: 0.9rem;
  color: #666;
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 6px;
}

.conflict-status {
  font-size: 0.85rem;
  color: #666;
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

  .detail-grid {
    grid-template-columns: 1fr;
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
