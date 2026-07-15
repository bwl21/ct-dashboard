import { ref, computed, reactive } from 'vue'
import { churchtoolsClient } from '@churchtools/churchtools-client'
import { getChurchtoolsBaseUrl, openDetailInTab } from '../../services/churchtools'
import { renderMarkdown } from './markdown'

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
  // Series fields (optional, may not always be provided by API)
  repeatId?: number
  repeatFrequency?: number | null
  repeatOption?: number | null
  repeatUntil?: string | null
  isRecurring?: boolean
  // Audit fields (optional, depending on API response)
  createdDate?: string
  modifiedDate?: string
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
  // Audit fields
  createdDate?: string
  modifiedDate?: string
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

// ============================================================================
// CONFLICT MAIL TYPES
// ============================================================================

export type ConflictMailRole = 'requester' | 'conflictCreator' | 'onBehalfOf'

export interface ConflictParty {
  bookingId: number
  title: string
  startDate: string
  endDate: string
  statusId: number
  createdDate?: string
  /** 1 = highest priority (first come, first served) */
  priorityRank: number
  kind: 'existing' | 'request'
}

export interface ConflictMailRecipient {
  personId: number
  name: string
  email?: string
  role: ConflictMailRole
  party: ConflictParty
  selected: boolean
}

export interface ConflictPartyEntry {
  bookingId: number
  title: string
  startDate: string
  endDate: string
  statusId: number
  createdDate?: string
  creatorName: string
  priorityRank: number
  kind: 'existing' | 'request'
  /** Absolute ChurchTools URL to edit this booking/event */
  editUrl?: string
}

export interface ConflictMailDraft {
  bookingId: number
  recipients: ConflictMailRecipient[]
  parties: ConflictParty[]
  subject: string
  /** Markdown body (subset: paragraphs + **bold**); converted to HTML before sending. */
  bodyMarkdown: string
  bccSelf: boolean
  templateId?: number
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
    statusIds: [],
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
   *
   * @param resourceIds Resource IDs to fetch bookings for
   * @param statusIds   Status IDs to filter (empty array = all statuses)
   * @param from        Optional ISO date (YYYY-MM-DD) - lower bound for booking dates
   * @param to          Optional ISO date (YYYY-MM-DD) - upper bound for booking dates
   */
  const fetchBookings = async (
    resourceIds: number[],
    statusIds: number[] = [BOOKING_STATUS.PENDING],
    from?: string,
    to?: string
  ) => {
    if (resourceIds.length === 0) {
      console.warn('No resource IDs provided for booking fetch')
      return []
    }

    loading.value = true
    error.value = null

    try {
      const params: Record<string, any> = {
        'resource_ids[]': resourceIds,
        'include[]': ['conflicts', 'involvedPersonsDomainObjects'],
      }
      // Empty statusIds = "Alle" => explicitly send all visible status IDs
      // so that rejected (CANCELED) bookings are included in the response.
      if (statusIds.length > 0) {
        params['status_ids[]'] = statusIds
      } else {
        params['status_ids[]'] = [
          BOOKING_STATUS.PENDING,
          BOOKING_STATUS.APPROVED,
          BOOKING_STATUS.CANCELED,
        ]
      }
      if (from) params.from = from
      if (to) params.to = to

      const response = (await churchtoolsClient.get('/bookings', params)) as any[]
      const data = Array.isArray(response) ? response : []

      // DEBUG: inspect raw API shape (incl. potential new alpha-backend schema)
      const firstWithConflicts = data.find(
        (it: any) =>
          (it.conflicts && it.conflicts.length) ||
          (it.booking?.conflicts && it.booking.conflicts.length)
      )
      console.groupCollapsed(`[fetchBookings] /bookings → ${data.length} items`)
      console.log('First item with conflicts (full):', firstWithConflicts)
      console.log(' └─ item.booking keys:', Object.keys(firstWithConflicts?.booking ?? {}))
      console.log(' └─ item.base keys:', Object.keys(firstWithConflicts?.base ?? {}))
      console.log(' └─ item.calculated keys:', Object.keys(firstWithConflicts?.calculated ?? {}))
      console.log(' └─ item.conflicts[0]:', firstWithConflicts?.conflicts?.[0])
      console.log(
        ' └─ item.conflicts[0] keys:',
        Object.keys(firstWithConflicts?.conflicts?.[0] ?? {})
      )
      console.log(' └─ item["@deprecated"] keys:', Object.keys(firstWithConflicts?.['@deprecated'] ?? {}))
      // Date format check (opencode hypothesis: date-only strings instead of full ISO)
      const dbase = firstWithConflicts?.base ?? firstWithConflicts?.booking?.base ?? firstWithConflicts?.booking ?? {}
      const dconf = firstWithConflicts?.conflicts?.[0] ?? {}
      console.log(' └─ DATE base.startDate:', dbase.startDate, '| base.endDate:', dbase.endDate)
      console.log(' └─ DATE conflict.startDate:', dconf.startDate, '| conflict.endDate:', dconf.endDate)
      console.groupEnd()

      // Transform API response to RoomBooking format
      const transformed = data.map((item: any) => {
        const booking = item.booking || item
        const base = booking.base || booking
        // involvedPersonsDomainObjects is at item level, not base level
        const involvedPersons =
          item.involvedPersonsDomainObjects || base.involvedPersonsDomainObjects

        // Trust the API: if it reports conflicts, they are valid
        const validConflicts = (item.conflicts || []).map((conflict: any) => ({
          bookingId: conflict.bookingId,
          title: conflict.title || '',
          startDate: conflict.startDate,
          endDate: conflict.endDate,
          statusId: conflict.statusId,
          // Include series info if available
          repeatId: conflict.repeatId,
          repeatFrequency: conflict.repeatFrequency,
          repeatOption: conflict.repeatOption,
          repeatUntil: conflict.repeatUntil,
          isRecurring: (conflict.repeatId || 0) > 0,
          // Audit fields
          createdDate:
            conflict.meta?.createdDate ||
            conflict.meta?.createdAt ||
            conflict.createdDate ||
            conflict.createdAt,
          modifiedDate:
            conflict.meta?.modifiedDate ||
            conflict.meta?.modifiedAt ||
            conflict.modifiedDate ||
            conflict.modifiedAt,
        }))

        return {
          id: base.id,
          resourceId: base.resourceId,
          resourceName: base.resource?.name || 'Unbekannter Raum',
          startDate: base.startDate,
          endDate: base.endDate,
          title: base.title || '',
          description: base.description || base.subtitle || '',
          statusId: base.statusId,
          createdBy: involvedPersons?.createdBy
            ? {
                id: parseInt(involvedPersons.createdBy.domainIdentifier),
                name: involvedPersons.createdBy.title,
                email: involvedPersons.createdBy.email,
              }
            : undefined,
          onBehalfOf: involvedPersons?.onBehalfOf
            ? {
                id: parseInt(involvedPersons.onBehalfOf.domainIdentifier),
                name: involvedPersons.onBehalfOf.title,
                email: involvedPersons.onBehalfOf.email,
              }
            : undefined,
          conflicts: validConflicts,
          // Series information
          repeatId: base.repeatId || 0,
          repeatFrequency: base.repeatFrequency || null,
          repeatOption: base.repeatOption || null,
          repeatUntil: base.repeatUntil || null,
          isRecurring: (base.repeatId || 0) > 0,
          // Audit fields (try various locations in API response)
          createdDate:
            base.meta?.createdDate ||
            base.meta?.createdAt ||
            booking.meta?.createdDate ||
            booking.meta?.createdAt ||
            item.meta?.createdDate ||
            item.meta?.createdAt ||
            base.createdDate ||
            base.createdAt,
          modifiedDate:
            base.meta?.modifiedDate ||
            base.meta?.modifiedAt ||
            booking.meta?.modifiedDate ||
            booking.meta?.modifiedAt ||
            item.meta?.modifiedDate ||
            item.meta?.modifiedAt ||
            base.modifiedDate ||
            base.modifiedAt,
        }
      })

      bookings.value = transformed
      return transformed
    } catch (err: any) {
      // Extract backend error details if available
      let msg = 'Fehler beim Laden der Raumbuchungen'
      const responseData = err?.response?.data
      if (responseData) {
        // ChurchTools REST API error format
        if (responseData.message) msg = responseData.message
        else if (responseData.errors && Array.isArray(responseData.errors)) {
          msg = responseData.errors.map((e: any) => e.message || String(e)).join('\n')
        } else if (typeof responseData === 'string') msg = responseData
      }
      if (err?.message && !msg.includes(err.message)) {
        msg = `${err.message}\n${msg}`
      }
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
   * Uses dedicated answer endpoint: PUT /bookings/{bookingId}/approve
   */
  const approveBooking = async (bookingId: number) => {
    try {
      const response = await churchtoolsClient.put(`/bookings/${bookingId}/approve`, {})
      // Refresh list
      if (filter.resourceIds.length > 0) {
        await fetchBookings(filter.resourceIds, filter.statusIds, filter.dateFrom, filter.dateTo)
      }
      return response
    } catch (err: any) {
      console.error(`Error approving booking ${bookingId}:`, err)
      throw new Error('Fehler beim Genehmigen der Buchung')
    }
  }

  /**
   * Reject booking with remarks
   * Uses dedicated answer endpoint: PUT /bookings/{bookingId}/reject
   * Note: The remarks are conveyed via the rejection email (sendRejectionEmail);
   * the answer endpoint itself does not accept a body.
   */
  const rejectBooking = async (bookingId: number, _remarks: string) => {
    try {
      const response = await churchtoolsClient.put(`/bookings/${bookingId}/reject`, {})
      // Refresh list
      if (filter.resourceIds.length > 0) {
        await fetchBookings(filter.resourceIds, filter.statusIds, filter.dateFrom, filter.dateTo)
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
    templateId: number = -1
  ) => {
    if (personIds.length === 0) {
      console.warn('No person IDs provided for email')
      return
    }

    try {
      // Use old API (handles CSRF token automatically)
      const response = await churchtoolsClient.oldApi('churchhome/ajax', 'sendEMailToPersonIds', {
        ids: personIds.join(','),
        betreff: subject,
        inhalt: htmlContent,
        attachments: null,
        domain_id: null,
        group_id: null,
        template_id: templateId == -1 ? null : templateId,
      })

      return response
    } catch (err: any) {
      // Old API returns {"status":"success","data":null} on success
      console.log('Response data raw:', err?.response?.data)
      console.log('Response data type:', typeof err?.response?.data)

      // Check if response has success status
      const responseData =
        typeof err?.response?.data === 'string'
          ? JSON.parse(err?.response?.data)
          : err?.response?.data

      if (err?.response?.status === 200 && responseData?.status === 'success') {
        console.log('Email sent successfully')
        return { success: true }
      }

      console.error('Error sending rejection email:', err)
      const errorMessage =
        err?.message || responseData?.message || 'Fehler beim Versenden der Ablehnungs-E-Mail'
      throw new Error(errorMessage)
    }
  }

  // ========================================================================
  // CONFLICT MAIL HELPERS
  // ========================================================================

  /**
   * Compute priority ranks for a set of conflict parties.
   * Lower rank = higher priority (first come, first served).
   * Sort criteria: 1. statusId (APPROVED before PENDING)
   *                2. createdDate (older first)
   *                3. bookingId (smaller first, tie-breaker)
   */
  const computePriorityRank = (parties: Omit<ConflictParty, 'priorityRank'>[]): ConflictParty[] => {
    return [...parties]
      .sort((a, b) => {
        if (a.statusId !== b.statusId) {
          if (a.statusId === BOOKING_STATUS.APPROVED) return -1
          if (b.statusId === BOOKING_STATUS.APPROVED) return 1
        }
        if (a.createdDate && b.createdDate && a.createdDate !== b.createdDate) {
          return a.createdDate < b.createdDate ? -1 : 1
        }
        return a.bookingId - b.bookingId
      })
      .map((p, idx) => ({ ...p, priorityRank: idx + 1 }))
  }

  /**
   * Build prioritized party entries with creator names from bookings.
   * Uses inline createdBy/onBehalfOf for the main booking and resolves
   * conflict creators via API.
   */
  const buildConflictPartiesWithCreators = async (
    booking: RoomBooking
  ): Promise<ConflictPartyEntry[]> => {
    const creatorName = (
      b: RoomBooking | RoomBookingConflict,
      info?: { createdBy?: RoomBookingPerson | null; onBehalfOf?: RoomBookingPerson | null } | null
    ): string => {
      const onBehalfOf = info?.onBehalfOf ?? (b as any).onBehalfOf
      const createdBy = info?.createdBy ?? (b as any).createdBy
      if (onBehalfOf?.name) return `${onBehalfOf.name} (i.A. von ${createdBy?.name ?? '?'})`
      return createdBy?.name ?? 'Unbekannt'
    }

    const requestInfo = await resolveConflictCreator(booking.id)
    const requestEntry: Omit<ConflictPartyEntry, 'priorityRank'> = {
      bookingId: booking.id,
      title: booking.title,
      startDate: booking.startDate,
      endDate: booking.endDate,
      statusId: booking.statusId,
      createdDate: booking.createdDate,
      creatorName: creatorName(booking, requestInfo),
      kind: 'request',
      editUrl: buildEditBookingUrl(booking, booking.resourceId),
    }

    const conflictEntries: Omit<ConflictPartyEntry, 'priorityRank'>[] = []
    if (booking.conflicts) {
      for (const c of booking.conflicts) {
        const info = await resolveConflictCreator(c.bookingId)
        conflictEntries.push({
          bookingId: c.bookingId,
          title: c.title,
          startDate: c.startDate,
          endDate: c.endDate,
          statusId: c.statusId,
          createdDate: info?.createdDate,
          creatorName: creatorName(c, info),
          kind: 'existing',
          // Conflicts inherit resourceId from the main booking (same room)
          editUrl: buildEditBookingUrl(c, booking.resourceId),
        })
      }
    }

    const ranked = computePriorityRank([requestEntry, ...conflictEntries])
    return ranked.map((p) => {
      const source = [requestEntry, ...conflictEntries].find((e) => e.bookingId === p.bookingId)!
      return { ...p, creatorName: source.creatorName, editUrl: source.editUrl }
    })
  }

  /**
   * Collect all involved persons for a booking + its conflicts.
   * Uses buildConflictPartiesWithCreators() for parties and builds
   * recipients from the same resolved creator info.
   */
  const collectConflictRecipients = async (
    booking: RoomBooking
  ): Promise<{
    recipients: ConflictMailRecipient[]
    parties: ConflictPartyEntry[]
  }> => {
    const parties = await buildConflictPartiesWithCreators(booking)
    const partyByBookingId = new Map<number, ConflictPartyEntry>()
    parties.forEach((p) => partyByBookingId.set(p.bookingId, p))

    const recipientMap = new Map<number, ConflictMailRecipient>()

    const addPerson = (
      person: RoomBookingPerson | null | undefined,
      partyBookingId: number,
      role: ConflictMailRole
    ) => {
      if (!person) return
      if (recipientMap.has(person.id)) return
      const party = partyByBookingId.get(partyBookingId)
      if (!party) return
      recipientMap.set(person.id, {
        personId: person.id,
        name: person.name,
        email: person.email,
        role,
        party: {
          bookingId: party.bookingId,
          title: party.title,
          startDate: party.startDate,
          endDate: party.endDate,
          statusId: party.statusId,
          createdDate: party.createdDate,
          priorityRank: party.priorityRank,
          kind: party.kind,
        },
        selected: true,
      })
    }

    // Requester - resolve creator info
    const requesterInfo = await resolveConflictCreator(booking.id)
    if (requesterInfo) {
      addPerson(requesterInfo.createdBy, booking.id, 'requester')
      addPerson(requesterInfo.onBehalfOf, booking.id, 'onBehalfOf')
    } else {
      addPerson(booking.createdBy, booking.id, 'requester')
      addPerson(booking.onBehalfOf, booking.id, 'onBehalfOf')
    }

    // Conflict creators
    if (booking.conflicts) {
      for (const conflict of booking.conflicts) {
        const info = await resolveConflictCreator(conflict.bookingId)
        if (info) {
          addPerson(info.createdBy, conflict.bookingId, 'conflictCreator')
          addPerson(info.onBehalfOf, conflict.bookingId, 'onBehalfOf')
        }
      }
    }

    // Sort recipients by party priorityRank
    const recipients = [...recipientMap.values()].sort(
      (a, b) => a.party.priorityRank - b.party.priorityRank
    )

    return { recipients, parties }
  }

  /**
   * Send conflict notification email to selected recipients.
   * All recipients are placed in To: so they can reply-all.
   */
  const sendConflictMail = async (draft: ConflictMailDraft) => {
    const personIds = draft.recipients.filter((r) => r.selected && r.email).map((r) => r.personId)

    if (draft.bccSelf) {
      try {
        const whoami = await churchtoolsClient.get('/whoami')
        const currentUserId = (whoami as any)?.id
        if (currentUserId && !personIds.includes(currentUserId)) {
          personIds.push(currentUserId)
        }
      } catch (err) {
        console.warn('Could not determine current user for BCC:', err)
      }
    }

    if (personIds.length === 0) {
      throw new Error('Keine Empfänger mit E-Mail-Adresse ausgewählt')
    }

    return sendRejectionEmail(
      personIds,
      draft.subject,
      renderMarkdown(draft.bodyMarkdown),
      draft.templateId ?? 11
    )
  }

  /**
   * Reset booking status back to PENDING (Angefragt)
   */
  const resetBookingToPending = async (bookingId: number) => {
    try {
      const response = await churchtoolsClient.put(`/bookings/${bookingId}/reset`, {})
      // Refresh list
      if (filter.resourceIds.length > 0) {
        await fetchBookings(filter.resourceIds, filter.statusIds, filter.dateFrom, filter.dateTo)
      }
      return response
    } catch (err: any) {
      console.error(`Error resetting booking ${bookingId} to pending:`, err)
      throw new Error('Fehler beim Zurücksetzen der Buchung auf "Angefragt"')
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
        await fetchBookings(filter.resourceIds, filter.statusIds, filter.dateFrom, filter.dateTo)
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
  // Fetch person email from persons API
  const getPersonEmail = async (personId: number): Promise<string | undefined> => {
    try {
      const response = (await churchtoolsClient.get(`/persons/${personId}`)) as any

      const person = response?.person || response
      const email = person?.email

      return email || undefined
    } catch (err: any) {
      console.warn(`Error fetching email for person ${personId}:`, err)
      return undefined
    }
  }

  const resolveConflictCreator = async (
    conflictBookingId: number
  ): Promise<{
    createdBy: RoomBookingPerson | null
    onBehalfOf: RoomBookingPerson | null
    createdDate?: string
    modifiedDate?: string
  } | null> => {
    try {
      const response = (await churchtoolsClient.get(`/bookings/${conflictBookingId}`, {
        'include[]': ['involvedPersonsDomainObjects'],
      })) as any

      // Try different response structures
      const booking = response?.booking || response
      const base = booking?.base || booking

      // Try to find persons at different levels
      const involvedPersons =
        booking?.involvedPersonsDomainObjects ||
        base?.involvedPersonsDomainObjects ||
        response?.involvedPersonsDomainObjects

      const createdBy = involvedPersons?.createdBy
      const onBehalfOf = involvedPersons?.onBehalfOf

      // Audit fields (try various locations in API response)
      const createdDate =
        base?.meta?.createdDate ||
        base?.meta?.createdAt ||
        booking?.meta?.createdDate ||
        booking?.meta?.createdAt ||
        response?.meta?.createdDate ||
        response?.meta?.createdAt ||
        base?.createdDate ||
        base?.createdAt
      const modifiedDate =
        base?.meta?.modifiedDate ||
        base?.meta?.modifiedAt ||
        booking?.meta?.modifiedDate ||
        booking?.meta?.modifiedAt ||
        response?.meta?.modifiedDate ||
        response?.meta?.modifiedAt ||
        base?.modifiedDate ||
        base?.modifiedAt

      if (!createdBy) {
        console.warn(`No creator found for conflict booking ${conflictBookingId}`)
        return {
          createdBy: null,
          onBehalfOf: null,
          createdDate,
          modifiedDate,
        }
      }

      // Fetch emails from contacts API
      const createdByEmail = await getPersonEmail(parseInt(createdBy.domainIdentifier))
      const onBehalfOfEmail = onBehalfOf
        ? await getPersonEmail(parseInt(onBehalfOf.domainIdentifier))
        : undefined

      return {
        createdBy: {
          id: parseInt(createdBy.domainIdentifier),
          name: createdBy.title,
          email: createdByEmail,
        },
        onBehalfOf: onBehalfOf
          ? {
              id: parseInt(onBehalfOf.domainIdentifier),
              name: onBehalfOf.title,
              email: onBehalfOfEmail,
            }
          : null,
        createdDate,
        modifiedDate,
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

    // Filter by date range — DELEGATED TO API
    // The ChurchTools /bookings REST API handles from/to filtering server-side.
    // Removing the client-side filter avoids false negatives where a booking
    // starts before the selected range but extends into it.

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
   * Count bookings by conflict status (grouped by series)
   */
  const bookingStats = computed(() => ({
    total: filteredBookings.value.length,
    withConflicts: filteredBookings.value.filter((b) => b.conflicts && b.conflicts.length > 0).length,
    withoutConflicts: filteredBookings.value.filter((b) => !b.conflicts || b.conflicts.length === 0).length,
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

  /**
   * Build the calendar event editor URL in ChurchTools
   * Pattern: ?q=churchcal&view=week&id=EVENT_ID&editScope=series&startdate=YYYY-MM-DD#CalView/
   */
  const buildEditEventUrl = (booking: RoomBooking | RoomBookingConflict): string => {
    const bookingId = (booking as any).id || (booking as any).bookingId
    const isRecurring = (booking as any).isRecurring || false
    const repeatId = (booking as any).repeatId || bookingId
    const startDate = (booking as any).startDate

    // Parse start date to get YYYY-MM-DD format
    let dateStr = ''
    try {
      const date = new Date(startDate)
      dateStr = date.toISOString().split('T')[0]
    } catch {
      dateStr = startDate.split('T')[0]
    }

    // Get base URL and build calendar editor URL
    const baseUrl = getChurchtoolsBaseUrl()
    const url = new URL(baseUrl)
    url.searchParams.set('q', 'churchcal')
    url.searchParams.set('view', 'week')
    url.searchParams.set('id', isRecurring ? repeatId.toString() : bookingId.toString())
    url.searchParams.set('editScope', isRecurring ? 'series' : 'event')
    url.searchParams.set('startdate', dateStr)
    url.hash = 'CalView/'

    return url.toString()
  }

  /**
   * Build the resource booking view URL in ChurchTools
   * Pattern: ?q=churchresource&curdate=YYYY-MM-DD&filterIds=RESOURCE_ID#WeekView/
   */
  const buildResourceViewUrl = (
    booking: RoomBooking | RoomBookingConflict,
    resourceId: number
  ): string => {
    const startDate = (booking as any).startDate

    let dateStr = ''
    try {
      const date = new Date(startDate)
      dateStr = date.toISOString().split('T')[0]
    } catch {
      dateStr = startDate.split('T')[0]
    }

    const baseUrl = getChurchtoolsBaseUrl()
    const url = new URL(baseUrl)
    url.searchParams.set('q', 'churchresource')
    url.searchParams.set('curdate', dateStr)
    url.searchParams.set('filterIds', resourceId.toString())
    url.hash = 'WeekView/'
    return url.toString()
  }

  /**
   * Build the appropriate edit URL for a booking:
   * - calendar event editor if linked to a calendar event (repeatId > 0)
   * - resource view (week) otherwise
   * Returns undefined if no URL can be built (e.g. missing resourceId).
   */
  const buildEditBookingUrl = (
    booking: RoomBooking | RoomBookingConflict,
    resourceId?: number
  ): string | undefined => {
    const repeatId = (booking as any).repeatId || 0
    if (repeatId > 0) {
      return buildEditEventUrl(booking)
    }
    const bookingResourceId = resourceId ?? (booking as any).resourceId
    if (!bookingResourceId) return undefined
    return buildResourceViewUrl(booking, bookingResourceId)
  }

  /**
   * Navigate to calendar event editor in ChurchTools
   * Opens the booking in a reusable calendar editor tab
   * Clicking multiple times updates the same tab instead of opening new ones
   */
  const navigateToEditEvent = (booking: RoomBooking | RoomBookingConflict) => {
    const url = buildEditEventUrl(booking)
    // Open in reusable tab - "ct-calendar-editor" tab is reused for all calendar edits
    openDetailInTab(url, 'ct-calendar-editor')
  }

  /**
   * Navigate to calendar event editor in a new tab
   */
  const navigateToEditEventNewTab = (booking: RoomBooking | RoomBookingConflict) => {
    // Same as navigateToEditEvent
    navigateToEditEvent(booking)
  }

  /**
   * Navigate to edit a booking based on calendar integration
   * - If booking references a calendar event (repeatId > 0): open calendar editor
   *   (Works for both single events and recurring series)
   * - If booking has no calendar reference (repeatId = 0): open booking resource page
   *
   * The `repeatId` field indicates if a booking is linked to a calendar event:
   * - repeatId > 0: References calendar event (single or series)
   * - repeatId = 0: Resource-only booking (no calendar integration)
   *
   * @param booking - The booking to navigate to (can be RoomBooking or RoomBookingConflict)
   * @param resourceId - Optional resource ID, needed for conflicts that don't have resourceId
   */
  const navigateToEditBooking = (
    booking: RoomBooking | RoomBookingConflict,
    resourceId?: number
  ) => {
    const bookingId = (booking as any).id || (booking as any).bookingId
    const rawRepeatId = (booking as any).repeatId
    const repeatId = rawRepeatId || 0

    console.log('navigateToEditBooking called:', {
      booking,
      rawRepeatId,
      repeatId,
      bookingId,
      'typeof rawRepeatId': typeof rawRepeatId,
      'rawRepeatId === null': rawRepeatId === null,
      'rawRepeatId === undefined': rawRepeatId === undefined,
      'hasCalendarEvent (repeatId > 0)': repeatId > 0,
    })

    // Check if booking references a calendar event
    if (repeatId > 0) {
      // Open calendar event editor
      console.log('→ Opening calendar editor for booking', bookingId)
      navigateToEditEvent(booking)
    } else {
      // Open resource booking view
      console.log('→ Opening resource booking view for booking', bookingId)
      const url = buildEditBookingUrl(booking, resourceId)
      if (!url) {
        console.error(
          '→ ERROR: Cannot navigate to resource booking - no resourceId provided or found in booking',
          { bookingId, resourceId }
        )
        return
      }
      console.log('→ Navigation URL:', url)
      openDetailInTab(url, 'ct-resource-view')
    }
  }

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
    resetBookingToPending,
    sendRejectionEmail,
    resolveConflictCreator,
    computePriorityRank,
    buildConflictPartiesWithCreators,
    collectConflictRecipients,
    sendConflictMail,

    // Helper Methods
    setSort,
    updateFilter,
    buildEditEventUrl,
    buildEditBookingUrl,
    navigateToEditEvent,
    navigateToEditEventNewTab,
    navigateToEditBooking,
    bulkApprove,
    bulkReject,
    bulkDelete,
  }
}
