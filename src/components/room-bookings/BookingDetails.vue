<template>
  <div :class="['booking-details', variant]">
    <!-- Header with title and status -->
    <div class="card-header">
      <div class="header-left">
        <div class="booking-title">{{ booking.title }}</div>
        <div v-if="showStatus" class="status-badge" :class="statusClass">
          {{ statusLabel }}
        </div>
      </div>
      <div v-if="showIndex" class="header-right">
        <span class="booking-index">{{ index }}</span>
      </div>
    </div>

    <!-- Booking Details -->
    <div class="booking-meta">
      <div class="meta-row">
        <strong>Raum:</strong>
        <span>{{ booking.resourceName }}</span>
      </div>

      <div class="meta-row">
        <strong>Datum:</strong>
        <span>{{ formatDate(booking.startDate) }}</span>
      </div>

      <div class="meta-row">
        <strong>Uhrzeit:</strong>
        <span>{{ formatTime(booking.startDate) }} - {{ formatTime(booking.endDate) }}</span>
      </div>

      <div class="meta-row creator-row">
        <strong>Ersteller:</strong>
        <span>
          <span v-if="isLoadingCreator" class="loading">Lade...</span>
          <span v-else-if="creatorInfo">
            {{ creatorInfo.createdBy?.name || 'Unbekannt' }}
            <span v-if="creatorInfo.createdBy?.email" class="email">
              ({{ creatorInfo.createdBy.email }})
            </span>
            <span v-if="creatorInfo.onBehalfOf" class="secondary">
              (i.A. von {{ creatorInfo.onBehalfOf?.name }})
            </span>
          </span>
          <span v-else>
            {{ booking.createdBy?.name || 'Unbekannt' }}
            <span v-if="booking.onBehalfOf" class="secondary">
              (i.A. von {{ booking.onBehalfOf?.name }})
            </span>
          </span>
        </span>
      </div>

      <div v-if="booking.description" class="meta-row">
        <strong>Beschreibung:</strong>
        <span class="description">{{ booking.description }}</span>
      </div>

      <!-- Series Info -->
      <div v-if="booking.isRecurring" class="meta-row series-row">
        <strong>🔄 Serie:</strong>
        <span>
          <span v-if="booking.repeatUntil">bis {{ formatDate(booking.repeatUntil) }}</span>
          <span v-else>unbegrenzt</span>
        </span>
      </div>
    </div>

    <!-- Action Buttons -->
    <div v-if="showActionButtons" class="card-actions">
      <button
        type="button"
        @click="handleNavigateCalendar"
        class="action-btn action-btn-small"
        title="Termin im Kalender bearbeiten"
      >
        📅 Bearbeiten
      </button>
      <button
        type="button"
        @click="handleNavigateDetails"
        class="action-btn action-btn-small"
        title="Buchungsdetails anzeigen"
      >
        ℹ️ Details
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue'
import type { RoomBooking, RoomBookingPerson, RoomBookingConflict } from './useRoomBookings'
import { BOOKING_STATUS, useRoomBookings } from './useRoomBookings'

interface Props {
  booking: RoomBooking | RoomBookingConflict
  variant?: 'primary' | 'conflict'
  showStatus?: boolean
  showIndex?: boolean
  index?: string
  showActionButtons?: boolean
  loadCreatorInfo?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  showStatus: false,
  showIndex: false,
  showActionButtons: false,
  loadCreatorInfo: false,
})

const emit = defineEmits<{
  'navigate-calendar': []
  'navigate-details': []
}>()

const { resolveConflictCreator, navigateToEditBooking } = useRoomBookings()

// Creator info (async loading)
const creatorInfo = ref<{
  createdBy: RoomBookingPerson | null
  onBehalfOf: RoomBookingPerson | null
} | null>(null)
const isLoadingCreator = ref(false)

// Get booking ID - handle both RoomBooking (id) and RoomBookingConflict (bookingId)
const bookingId = computed(() => {
  const booking = props.booking as any
  return booking.id || booking.bookingId
})

// Load creator info if needed
onMounted(async () => {
  if (props.loadCreatorInfo && bookingId.value) {
    isLoadingCreator.value = true
    try {
      const info = await resolveConflictCreator(bookingId.value)
      if (info) {
        creatorInfo.value = info
      }
    } catch (err) {
      console.error(`Error loading creator for booking ${bookingId.value}:`, err)
    } finally {
      isLoadingCreator.value = false
    }
  }
})

const statusClass = computed(() => {
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

const handleNavigateCalendar = () => {
  console.log('BookingDetails: navigate-calendar clicked', bookingId.value)
  navigateToEditBooking(props.booking)
  emit('navigate-calendar')
}

const handleNavigateDetails = () => {
  console.log('BookingDetails: navigate-details clicked', bookingId.value)
  emit('navigate-details')
}
</script>

<style scoped>
.booking-details {
  padding: 16px;
  border-radius: 6px;
  border-left: 4px solid;
}

.booking-details.primary {
  border-left-color: #2196f3;
  background: #f5f9ff;
}

.booking-details.conflict {
  border-left-color: #ff9800;
  background: #fff8f0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}

.header-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  flex-shrink: 0;
}

.booking-title {
  font-weight: 600;
  color: #333;
  font-size: 1rem;
}

.status-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
  width: fit-content;
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

.booking-index {
  font-weight: 500;
  color: #666;
  font-size: 0.85rem;
}

.booking-meta {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 12px;
}

.meta-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: flex-start;
}

.meta-row strong {
  color: #333;
  min-width: 100px;
  flex-shrink: 0;
}

.meta-row span {
  flex: 1;
  word-break: break-word;
}

.creator-row {
  padding-top: 6px;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  margin-top: 6px;
}

.series-row {
  padding: 8px;
  background: rgba(76, 175, 80, 0.1);
  border-radius: 4px;
  border-left: 2px solid #4caf50;
  color: #2e7d32;
}

.loading {
  color: #999;
  font-style: italic;
}

.secondary {
  display: inline;
  font-size: 0.85rem;
  color: #999;
  margin-top: 2px;
}

.description {
  white-space: pre-wrap;
  word-break: break-word;
  background: rgba(0, 0, 0, 0.05);
  padding: 6px 8px;
  border-radius: 4px;
  font-style: italic;
}

.email {
  color: #666;
  font-size: 0.85rem;
  margin-left: 4px;
}

.card-actions {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.action-btn {
  padding: 4px 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8em;
  font-weight: 500;
  transition: all 0.2s;
  background: white;
  color: #333;
  pointer-events: auto;
  position: relative;
  z-index: 10;
}

.action-btn-small {
  padding: 4px 8px;
}

.action-btn:hover {
  background: #f5f5f5;
  border-color: #999;
}

@media (max-width: 600px) {
  .card-header {
    flex-direction: column;
  }

  .header-right {
    align-items: flex-start;
  }

  .meta-row {
    flex-direction: column;
    gap: 2px;
  }

  .meta-row strong {
    min-width: auto;
  }

  .card-actions {
    flex-direction: column;
  }

  .action-btn {
    width: 100%;
    text-align: center;
  }
}
</style>
