/**
 * Centralized action descriptors for RoomBooking entities.
 *
 * A single source of truth for icon, label, color and visibility logic
 * of every action that can be performed on a booking. The same descriptor
 * set is rendered by `<BookingActionBar>` in three contexts:
 *   - row    (table row, icon-only)
 *   - bulk   (bulk-operations toolbar, icon + label)
 *   - detail (detail card / modal, icon + label)
 */

import type { UiButtonVariant } from '../common/uiButtonTypes'
import { BOOKING_STATUS, type RoomBooking, type RoomBookingConflict } from './useRoomBookings'

export type BookingActionId =
  | 'details'
  | 'approve'
  | 'reject'
  | 'reset'
  | 'delete'
  | 'edit-calendar'

export type BookingActionScope = 'row' | 'bulk' | 'detail'

export interface BookingActionShape {
  id: number
  statusId: number
  createdDate?: string
}

export function toBookingActionShape(b: RoomBooking | RoomBookingConflict): BookingActionShape {
  return {
    id: 'id' in b ? b.id : b.bookingId,
    statusId: b.statusId,
    createdDate: b.createdDate,
  }
}

export type ActionBooking = RoomBooking | RoomBookingConflict

export interface ActionContext {
  bookings: ActionBooking[]
  scope: BookingActionScope
}

export interface BookingActionDescriptor {
  id: BookingActionId
  icon: string
  label: string
  /** Tooltip; receives the context so it can mention selection counts etc. */
  tooltip: (ctx: ActionContext) => string
  variant: UiButtonVariant
  /** Whether the action button should be rendered at all. */
  isVisible: (ctx: ActionContext) => boolean
  /** Whether the action button should be rendered but disabled. */
  isDisabled?: (ctx: ActionContext) => boolean
}

const isPending = (b: ActionBooking | undefined | null): boolean =>
  Boolean(b) && b!.statusId === BOOKING_STATUS.PENDING
const someNotPending = (bookings: ActionBooking[]): boolean =>
  bookings.length > 0 && bookings.some((b) => Boolean(b) && !isPending(b))

export const BOOKING_ACTIONS: BookingActionDescriptor[] = [
  {
    id: 'details',
    icon: 'ℹ️',
    label: 'Details',
    tooltip: () => 'Details anzeigen',
    variant: 'info',
    // Details only make sense for a single booking
    isVisible: ({ bookings, scope }) => scope !== 'bulk' && bookings.length === 1,
  },
  {
    id: 'approve',
    icon: '✅',
    label: 'Genehmigen',
    tooltip: ({ bookings, scope }) =>
      scope === 'bulk' ? `${bookings.length} Buchung(en) genehmigen` : 'Genehmigen',
    variant: 'success',
    isVisible: ({ bookings }) => bookings.length > 0,
    // Disable if all selected bookings are already approved
    isDisabled: ({ bookings }) =>
      bookings.length > 0 && bookings.every((b) => b.statusId === BOOKING_STATUS.APPROVED),
  },
  {
    id: 'reject',
    icon: '❌',
    label: 'Ablehnen',
    tooltip: ({ bookings, scope }) =>
      scope === 'bulk' ? `${bookings.length} Buchung(en) ablehnen` : 'Ablehnen',
    variant: 'danger',
    isVisible: ({ bookings }) => bookings.length > 0,
    isDisabled: ({ bookings }) =>
      bookings.length > 0 && bookings.every((b) => b.statusId === BOOKING_STATUS.CANCELED),
  },
  {
    id: 'reset',
    icon: '↩️',
    label: 'Auf Angefragt',
    tooltip: () => 'Auf Angefragt zurücksetzen',
    variant: 'warning',
    // Only meaningful if at least one selected booking is not already pending
    isVisible: ({ bookings }) => bookings.length > 0 && someNotPending(bookings),
  },
  {
    id: 'delete',
    icon: '🗑️',
    label: 'Löschen',
    tooltip: () => 'Löschen',
    variant: 'delete',
    // Only allow deleting non-pending bookings
    isVisible: ({ bookings }) => bookings.length > 0 && someNotPending(bookings),
  },
  {
    id: 'edit-calendar',
    icon: '📅',
    label: 'Bearbeiten',
    tooltip: () => 'Termin im Kalender / in der Ressource bearbeiten',
    variant: 'outline',
    // Calendar editing is per-event only
    isVisible: ({ bookings }) => bookings.length === 1,
  },
]

export const BOOKING_ACTION_BY_ID: Record<BookingActionId, BookingActionDescriptor> =
  BOOKING_ACTIONS.reduce(
    (acc, a) => {
      acc[a.id] = a
      return acc
    },
    {} as Record<BookingActionId, BookingActionDescriptor>
  )

/**
 * Resolve the list of action descriptors that should be rendered for the
 * given context, optionally restricted to a whitelist (and preserving the
 * order of the whitelist).
 */
export function resolveActions(
  ctx: ActionContext,
  allowed?: BookingActionId[]
): BookingActionDescriptor[] {
  const ids = allowed ?? BOOKING_ACTIONS.map((a) => a.id)
  return ids
    .map((id) => BOOKING_ACTION_BY_ID[id])
    .filter((a): a is BookingActionDescriptor => Boolean(a) && a.isVisible(ctx))
}
