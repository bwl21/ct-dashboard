import { ref, computed, reactive } from 'vue'
import { churchtoolsClient } from '@churchtools/churchtools-client'

// ============================================================================
// TYPES
// ============================================================================

export interface RoomBookingPerson {
  id: number
  name: string
  email?: string
}

export interface RoomBookingConflict {
  bookingId: number
  title: string
  startDate: string
  endDate: string
  statusId: number
}

export interface RoomBooking {
  id: number
  resourceId: number
  resourceName: string
  startDate: string
  endDate: string
  title: string
  description?: string
  statusId: number
  createdBy?: RoomBookingPerson
  onBehalfOf?: RoomBookingPerson
  conflicts?: RoomBookingConflict[]
  // Series fields
  repeatId: number
  repeatFrequency: number | null
  repeatOption: number | null
  repeatUntil: string | null
  isRecurring: boolean
}

export interface RoomBookingsFilter {
  statusIds: number[]
  resourceIds: number[]
  conflictStatus?: 'all' | 'with' | 'without'
  searchQuery?: string
  dateFrom?: string // ISO date string (YYYY-MM-DD)
  dateTo?: string // ISO date string (YYYY-MM-DD)
}

export interface RoomBookingsSort {
  field: string
  direction: 'asc' | 'desc'
}

// Status Constants
export const BOOKING_STATUS = {
  PENDING: 1,
  APPROVED: 2,
  CANCELED: 3,
  DELETED: 99,
} as const

// ============================================================================
// COMPOSABLE
// ============================================================================

export function useRoomBookings() {
  // State
  const bookings = ref<RoomBooking[]>([])
  const resources = ref<any[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Filter & Sort State
  const filter = reactive<RoomBookingsFilter>({
    statusIds: [BOOKING_STATUS.PENDING],
    resourceIds: [],
    conflictStatus: 'all',
    searchQuery: '',
  })

  const sort = reactive<RoomBookingsSort>({
    field: 'startDate',
    direction: 'asc',
  })

  // ========================================================================
  // API CALLS
  // ========================================================================

  /**
   * Fetch all resources
   */
  const fetchResources = async () => {
    try {
      const response = (await churchtoolsClient.get('/resources')) as any[]
      resources.value = Array.isArray(response) ? response : []
      return resources.value
    } catch (err: any) {
      console.error('Error fetching resources:', err)
      throw new Error('Fehler beim Laden der Räume')
    }
  }

  /**
   * Fetch bookings for given resource IDs
   */
  const fetchBookings = async (
    resourceIds: number[],
    statusIds: number[] = [BOOKING_STATUS.PENDING]
  ) => {
    if (resourceIds.length === 0) {
      console.warn('No resource IDs provided for booking fetch')
      return []
    }

    loading.value = true
    error.value = null

    try {
      const response = (await churchtoolsClient.get('/bookings', {
        'resource_ids[]': resourceIds,
        'status_ids[]': statusIds,
        'include[]': ['conflicts', 'involvedPersonsDomainObjects'],
      })) as any[]

      const data = Array.isArray(response) ? response : []

      // Helper function to check if conflicts actually overlap in time
      const isActualConflict = (booking: any, conflict: any): boolean => {
        const bookingStart = new Date(booking.startDate).getTime()
        const bookingEnd = new Date(booking.endDate).getTime()
        const conflictStart = new Date(conflict.startDate).getTime()
        const conflictEnd = new Date(conflict.endDate).getTime()

        // Check if time ranges overlap
        return bookingStart < conflictEnd && bookingEnd > conflictStart
      }

      // Transform API response to RoomBooking format
      const transformed = data.map((item: any) => {
        const booking = item.booking || item
        const base = booking.base || booking

        // For recurring bookings: don't filter conflicts because API returns conflicts for all occurrences
        // For single bookings: filter to only actual time overlaps
        let validConflicts = item.conflicts || []
        if (!base.repeatId || base.repeatId === 0) {
          validConflicts = validConflicts.filter((conflict: any) =>
            isActualConflict(base, conflict)
          )
        }

        return {
          id: base.id,
          resourceId: base.resourceId,
          resourceName: base.resource?.name || 'Unbekannter Raum',
          startDate: base.startDate,
          endDate: base.endDate,
          title: base.title || '',
          description: base.description || base.subtitle || '',
          statusId: base.statusId,
          createdBy: base.involvedPersonsDomainObjects?.createdBy
            ? {
                id: base.involvedPersonsDomainObjects.createdBy.id,
                name: base.involvedPersonsDomainObjects.createdBy.name,
                email: base.involvedPersonsDomainObjects.createdBy.email,
              }
            : undefined,
          onBehalfOf: base.involvedPersonsDomainObjects?.onBehalfOf
            ? {
                id: base.involvedPersonsDomainObjects.onBehalfOf.id,
                name: base.involvedPersonsDomainObjects.onBehalfOf.name,
                email: base.involvedPersonsDomainObjects.onBehalfOf.email,
              }
            : undefined,
          conflicts: validConflicts,
          // Series information
          repeatId: base.repeatId || 0,
          repeatFrequency: base.repeatFrequency || null,
          repeatOption: base.repeatOption || null,
          repeatUntil: base.repeatUntil || null,
          isRecurring: (base.repeatId || 0) > 0,
        }
      })

      bookings.value = transformed
      return transformed
    } catch (err: any) {
      const msg = err.message || 'Fehler beim Laden der Raumbuchungen'
      error.value = msg
      console.error('Error fetching bookings:', err)
      throw new Error(msg)
    } finally {
      loading.value = false
    }
  }

  /**
   * Fetch single booking with details
   */
  const fetchBookingDetails = async (bookingId: number) => {
    try {
      const response = await churchtoolsClient.get(`/bookings/${bookingId}`)
      return response
    } catch (err: any) {
      console.error(`Error fetching booking ${bookingId}:`, err)
      throw new Error('Fehler beim Laden der Buchungsdetails')
    }
  }

  /**
   * Approve booking(s)
   */
  const approveBooking = async (bookingId: number) => {
    try {
      const response = await churchtoolsClient.put(`/bookings/${bookingId}`, {
        statusId: BOOKING_STATUS.APPROVED,
      })
      // Refresh list
      if (filter.resourceIds.length > 0) {
        await fetchBookings(filter.resourceIds, filter.statusIds)
      }
      return response
    } catch (err: any) {
      console.error(`Error approving booking ${bookingId}:`, err)
      throw new Error('Fehler beim Genehmigen der Buchung')
    }
  }

  /**
   * Reject booking with remarks
   */
  const rejectBooking = async (bookingId: number, remarks: string) => {
    try {
      const response = await churchtoolsClient.put(`/bookings/${bookingId}`, {
        statusId: BOOKING_STATUS.CANCELED,
        description: remarks,
      })
      // Refresh list
      if (filter.resourceIds.length > 0) {
        await fetchBookings(filter.resourceIds, filter.statusIds)
      }
      return response
    } catch (err: any) {
      console.error(`Error rejecting booking ${bookingId}:`, err)
      throw new Error('Fehler beim Ablehnen der Buchung')
    }
  }

  /**
   * Send rejection email to person(s)
   * Uses legacy AJAX endpoint: /index.php?q=churchdb/ajax
   */
  const sendRejectionEmail = async (
    personIds: number[],
    subject: string,
    htmlContent: string,
    templateId: number = 11
  ) => {
    if (personIds.length === 0) {
      console.warn('No person IDs provided for email')
      return
    }

    try {
      // Use raw fetch for legacy AJAX endpoint
      const params = new URLSearchParams({
        ids: personIds.join(','),
        betreff: subject,
        inhalt: htmlContent,
        template_id: templateId.toString(),
        func: 'sendEMailToPersonIds',
      })

      const response = await fetch('/index.php?q=churchdb/ajax', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'include', // Send cookies
        body: params.toString(),
      })

      if (!response.ok) {
        throw new Error(`Email send failed: ${response.statusText}`)
      }

      return response
    } catch (err: any) {
      console.error('Error sending rejection email:', err)
      throw new Error('Fehler beim Versenden der Ablehnungs-E-Mail')
    }
  }

  /**
   * Delete booking (soft delete: set status to DELETED)
   */
  const deleteBooking = async (bookingId: number) => {
    try {
      const response = await churchtoolsClient.put(`/bookings/${bookingId}`, {
        statusId: BOOKING_STATUS.DELETED,
      })
      // Refresh list
      if (filter.resourceIds.length > 0) {
        await fetchBookings(filter.resourceIds, filter.statusIds)
      }
      return response
    } catch (err: any) {
      console.error(`Error deleting booking ${bookingId}:`, err)
      throw new Error('Fehler beim Löschen der Buchung')
    }
  }

  /**
   * Resolve conflict creator details
   * Fetches the creator of a conflicting booking
   */
  const resolveConflictCreator = async (
    conflictBookingId: number
  ): Promise<RoomBookingPerson | null> => {
    try {
      const response = (await churchtoolsClient.get(`/bookings/${conflictBookingId}`, {
        'include[]': ['involvedPersonsDomainObjects'],
      })) as any

      const booking = response?.booking || response
      const createdBy = booking?.involvedPersonsDomainObjects?.createdBy

      if (!createdBy) {
        console.warn(`No creator found for conflict booking ${conflictBookingId}`)
        return null
      }

      return {
        id: createdBy.id,
        name: createdBy.name,
        email: createdBy.email,
      }
    } catch (err: any) {
      console.warn(`Error resolving conflict creator ${conflictBookingId}:`, err)
      return null
    }
  }

  // ========================================================================
  // COMPUTED PROPERTIES & FILTERING
  // ========================================================================

  /**
   * Filter bookings based on current filter state
   */
  const filteredBookings = computed(() => {
    let result = [...bookings.value]

    // Filter by conflict status
    if (filter.conflictStatus === 'with') {
      result = result.filter((b) => b.conflicts && b.conflicts.length > 0)
    } else if (filter.conflictStatus === 'without') {
      result = result.filter((b) => !b.conflicts || b.conflicts.length === 0)
    }

    // Filter by search query
    if (filter.searchQuery) {
      const query = filter.searchQuery.toLowerCase()
      result = result.filter(
        (b) =>
          b.title.toLowerCase().includes(query) ||
          b.resourceName.toLowerCase().includes(query) ||
          b.createdBy?.name.toLowerCase().includes(query) ||
          b.onBehalfOf?.name.toLowerCase().includes(query) ||
          b.description?.toLowerCase().includes(query)
      )
    }

    // Filter by date range
    if (filter.dateFrom || filter.dateTo) {
      result = result.filter((b) => {
        const bookingDate = new Date(b.startDate).toISOString().split('T')[0]
        if (filter.dateFrom && bookingDate < filter.dateFrom) return false
        if (filter.dateTo && bookingDate > filter.dateTo) return false
        return true
      })
    }

    // Filter by resource IDs
    if (filter.resourceIds.length > 0) {
      result = result.filter((b) => filter.resourceIds.includes(b.resourceId))
    }

    // Group recurring bookings: only show first occurrence per series
    const seenSeriesIds = new Set<number>()
    result = result.filter((b) => {
      if (b.isRecurring) {
        if (seenSeriesIds.has(b.repeatId)) {
          return false // Skip subsequent occurrences
        }
        seenSeriesIds.add(b.repeatId)
      }
      return true
    })

    // Sort
    result.sort((a, b) => {
      let aVal: any = a[sort.field as keyof RoomBooking]
      let bVal: any = b[sort.field as keyof RoomBooking]

      if (aVal === undefined || aVal === null) return 1
      if (bVal === undefined || bVal === null) return -1

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase()
        bVal = (bVal as string).toLowerCase()
      }

      const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0
      return sort.direction === 'asc' ? comparison : -comparison
    })

    return result
  })

  /**
   * Count bookings by conflict status
   */
  const bookingStats = computed(() => ({
    total: bookings.value.length,
    withConflicts: bookings.value.filter((b) => b.conflicts && b.conflicts.length > 0).length,
    withoutConflicts: bookings.value.filter((b) => !b.conflicts || b.conflicts.length === 0).length,
  }))

  /**
   * Get unique resources with open bookings
   */
  const resourcesWithBookings = computed(() => {
    const resourceIds = new Set(filteredBookings.value.map((b) => b.resourceId))
    return resources.value.filter((r) => resourceIds.has(r.id))
  })

  // ========================================================================
  // HELPERS
  // ========================================================================

  const setSort = (field: string, direction?: 'asc' | 'desc') => {
    if (sort.field === field && !direction) {
      sort.direction = sort.direction === 'asc' ? 'desc' : 'asc'
    } else {
      sort.field = field
      sort.direction = direction || 'asc'
    }
  }

  const updateFilter = (updates: Partial<RoomBookingsFilter>) => {
    Object.assign(filter, updates)
  }

  // ========================================================================
  // BULK OPERATIONS
  // ========================================================================

  const bulkApprove = async (bookingIds: number[]) => {
    let successCount = 0
    let errorCount = 0
    const errors: string[] = []

    for (const bookingId of bookingIds) {
      try {
        await approveBooking(bookingId)
        successCount++
      } catch (err: any) {
        errorCount++
        errors.push(`Booking ${bookingId}: ${err.message}`)
      }
    }

    if (errorCount > 0) {
      const message = `${successCount} genehmigt, ${errorCount} Fehler: ${errors.join('; ')}`
      throw new Error(message)
    }

    return { successCount, errorCount }
  }

  const bulkReject = async (bookingIds: number[], remarks: string) => {
    let successCount = 0
    let errorCount = 0
    const errors: string[] = []

    for (const bookingId of bookingIds) {
      try {
        await rejectBooking(bookingId, remarks)
        successCount++
      } catch (err: any) {
        errorCount++
        errors.push(`Booking ${bookingId}: ${err.message}`)
      }
    }

    if (errorCount > 0) {
      const message = `${successCount} abgelehnt, ${errorCount} Fehler: ${errors.join('; ')}`
      throw new Error(message)
    }

    return { successCount, errorCount }
  }

  const bulkDelete = async (bookingIds: number[]) => {
    let successCount = 0
    let errorCount = 0
    const errors: string[] = []

    for (const bookingId of bookingIds) {
      try {
        await deleteBooking(bookingId)
        successCount++
      } catch (err: any) {
        errorCount++
        errors.push(`Booking ${bookingId}: ${err.message}`)
      }
    }

    if (errorCount > 0) {
      const message = `${successCount} gelöscht, ${errorCount} Fehler: ${errors.join('; ')}`
      throw new Error(message)
    }

    return { successCount, errorCount }
  }

  // ========================================================================
  // RETURN
  // ========================================================================

  return {
    // State
    bookings,
    resources,
    loading,
    error,
    filter,
    sort,

    // Computed
    filteredBookings,
    bookingStats,
    resourcesWithBookings,

    // API Methods
    fetchResources,
    fetchBookings,
    fetchBookingDetails,
    approveBooking,
    rejectBooking,
    deleteBooking,
    sendRejectionEmail,
    resolveConflictCreator,

    // Helper Methods
    setSort,
    updateFilter,
    bulkApprove,
    bulkReject,
    bulkDelete,
  }
}
