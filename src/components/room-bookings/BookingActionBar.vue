<template>
  <div v-if="safeBookings.length > 0" class="booking-action-bar" :class="`density-${density}`">
    <UiButton
      v-for="action in visibleActions"
      :key="action.id"
      :variant="action.variant"
      :size="buttonSize"
      :icon="action.icon"
      :label="action.label"
      :icon-only="density === 'compact'"
      :disabled="action.isDisabled?.({ bookings: safeBookings, scope }) ?? false"
      :title="action.tooltip({ bookings: safeBookings, scope })"
      @click="$emit('action', action.id, { bookings: safeBookings, scope })"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import UiButton from '../common/UiButton.vue'
import {
  resolveActions,
  type BookingActionId,
  type BookingActionScope,
} from './useRoomBookingActions'
import type { RoomBooking } from './useRoomBookings'

interface Props {
  bookings: RoomBooking[]
  scope: BookingActionScope
  /** Whitelist of action IDs to render (and their order). Defaults to all. */
  show?: BookingActionId[]
  /** compact = icon-only (table); normal = icon + label (bulk/detail). */
  density?: 'compact' | 'normal'
  size?: 'sm' | 'md' | 'lg'
}

const props = withDefaults(defineProps<Props>(), {
  show: undefined,
  density: 'normal',
  size: undefined,
})

defineEmits<{
  /**
   * Emitted whenever any action button is clicked. The parent decides
   * what to do (open dialog, run API call, etc.). Payload contains the
   * relevant bookings and the originating scope.
   */
  action: [id: BookingActionId, payload: { bookings: RoomBooking[]; scope: BookingActionScope }]
}>()

// Defensive: AdminTable may pass undefined row entries during render passes
// (e.g. group headers, empty placeholders), so filter them out.
const safeBookings = computed(() =>
  (props.bookings || []).filter(
    (b): b is RoomBooking => Boolean(b) && typeof (b as any).statusId === 'number'
  )
)

const visibleActions = computed(() =>
  resolveActions({ bookings: safeBookings.value, scope: props.scope }, props.show)
)

const buttonSize = computed(() => {
  if (props.size) return props.size
  return props.density === 'compact' ? 'sm' : 'md'
})
</script>

<style scoped>
.booking-action-bar {
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
}

.booking-action-bar.density-compact {
  gap: 4px;
}

.booking-action-bar.density-normal {
  gap: 8px;
}
</style>
