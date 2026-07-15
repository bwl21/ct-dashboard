import { churchtoolsClient } from '@churchtools/churchtools-client'

/**
 * Get the base URL for ChurchTools
 * Uses VITE_BASE_URL in development, window.location.origin in production
 */
export function getChurchtoolsBaseUrl(): string {
  return import.meta.env.DEV ? import.meta.env.VITE_BASE_URL : window.location.origin
}

/**
 * Tab reference storage for detail views
 * Keeps track of open detail tabs by name
 */
const detailTabs = new Map<string, Window | null>()

/**
 * Open a URL in a reusable browser tab
 *
 * If a tab with the given name already exists and is open:
 * - Loads the new URL in that tab
 * - Brings the tab to focus
 *
 * If the tab doesn't exist or has been closed:
 * - Opens a new tab with the given name
 *
 * @param url - The URL to open
 * @param tabName - The name of the tab (e.g., "detail-view", "calendar-editor")
 * @returns The opened/reused window reference, or null if popup was blocked
 *
 * @example
 * // Open calendar editor - reuses existing "calendar" tab
 * openDetailInTab('/calendar?id=123', 'calendar')
 *
 * // Open another event - same "calendar" tab is updated
 * openDetailInTab('/calendar?id=456', 'calendar')
 */
export function openDetailInTab(url: string, tabName: string): Window | null {
  // Get existing tab reference
  let tab = detailTabs.get(tabName)

  // Check if tab exists and is still open
  if (tab && !tab.closed) {
    // Tab exists - reuse it
    console.log(`[DetailTab] Reusing existing tab "${tabName}"`)
    tab.location.href = url
    tab.focus() // Bring tab to foreground
    return tab
  }

  // Tab doesn't exist or was closed - open new one
  console.log(`[DetailTab] Opening new tab "${tabName}" with URL: ${url}`)
  const newTab = window.open(url, tabName)

  if (newTab) {
    // Store reference for future reuse
    detailTabs.set(tabName, newTab)
    console.log(`[DetailTab] Tab "${tabName}" stored for reuse`)
    return newTab
  } else {
    // Popup was blocked
    console.warn(`[DetailTab] Failed to open tab "${tabName}" - popup may be blocked`)
    detailTabs.set(tabName, null)
    return null
  }
}

/**
 * Close and forget a detail tab
 * Useful for cleanup
 *
 * @param tabName - The name of the tab to close
 */
export function closeDetailTab(tabName: string): void {
  const tab = detailTabs.get(tabName)
  if (tab && !tab.closed) {
    tab.close()
    console.log(`[DetailTab] Closed tab "${tabName}"`)
  }
  detailTabs.delete(tabName)
}

export interface Calendar {
  id: number
  name: string
  nameTranslated: string
  sortKey: number
  color: string
  isPublic: boolean
  isPrivate: boolean
  randomUrl: string
  icalUrl: string
  meta: {
    createdBy: string
    createdAt: string
    modifiedBy: string
    modifiedAt: string
  }
}

import type { AppointmentBase, AppointmentCalculated } from '../ct-types'

export type Appointment = AppointmentBase | AppointmentCalculated

/**
 * Fetches all calendars from ChurchTools
 */
export async function fetchCalendars(): Promise<Calendar[]> {
  const response = await churchtoolsClient.get<Calendar[]>('/calendars')
  return response || []
}

/**
 * Fetches a single appointment series with all details
 */
export async function fetchAppointmentSeries(
  appointmentId: number,
  startDate: string
): Promise<any> {
  const response = await churchtoolsClient.get(
    `/calendars/appointments/${appointmentId}/${startDate}`
  )
  return response
}

/**
 * Fetches appointments for a specific calendar within a date range
 */
export async function fetchAppointments(
  calendarIds: number[],
  startDate: Date,
  endDate: Date,
  tagIds: number[] = []
): Promise<Appointment[]> {
  const start = startDate.toISOString().split('T')[0]
  const end = endDate.toISOString().split('T')[0]

  const params: Record<string, any> = {
    from: start,
    to: end,
    'calendar_ids[]': calendarIds,
    include: ['tags'],
  }

  // Add tag filter if tags are provided
  if (tagIds.length > 0) {
    params['tag_ids[]'] = tagIds
  }

  const response = await churchtoolsClient.get<Appointment[]>('/calendars/appointments', params)

  // Ensure we always return an array of Appointment objects
  return Array.isArray(response) ? response : []
}

/**
 * Identifies church and group calendars
 */
export async function identifyCalendars(): Promise<{
  publicCalendars: Calendar[]
}> {
  const calendars = await fetchCalendars()
  // Filter out private calendars and sort by name
  const publicCalendars = calendars
    .filter((cal) => !cal.isPrivate)
    .sort((a, b) => a.name.localeCompare(b.name))

  return { publicCalendars }
}

/**
 * Finds all recurring appointment series that are about to end
 */
export async function findExpiringSeries(
  daysInAdvance: number = 60,
  tagIds: number[] = []
): Promise<Appointment[]> {
  const now = new Date()
  const endDate = new Date()
  endDate.setDate(now.getDate() + daysInAdvance)

  // Get all relevant calendars
  const { publicCalendars } = await identifyCalendars()

  // Ensure we have calendar IDs
  if (!publicCalendars.length) {
    console.warn('No calendars found')
    return []
  }

  // Get all calendar IDs including the default (0) calendar
  const allCalendarIds = [...publicCalendars.map((c) => c.id)].filter(
    (v, i, a) => a.indexOf(v) === i
  ) // Remove duplicates

  // Fetching appointments for calendar IDs with optional tag filtering and include tags
  const appointments = await fetchAppointments(allCalendarIds, now, endDate, tagIds)

  // Log the first appointment to debug tags
  if (appointments.length > 0) {
    console.log('First appointment with tags:', JSON.parse(JSON.stringify(appointments[0])))
  }

  // Process appointments to ensure consistent structure with tags
  const processedAppointments = appointments.map((appointment) => {
    // Get tags from the root level if they exist
    const tags = 'tags' in appointment ? appointment.tags : []

    // Return the appointment with tags properly set in base.tags
    // Handle both AppointmentBase and AppointmentCalculated
    if ('base' in appointment) {
      return {
        ...appointment,
        base: {
          ...(appointment as any).base,
          tags: Array.isArray(tags) ? tags : [],
        },
      }
    } else {
      // For AppointmentBase, add tags directly
      return {
        ...appointment,
        tags: Array.isArray(tags) ? tags : [],
      }
    }
  })

  // Find recurring appointments that are ending soon
  const expiringSeries = processedAppointments.filter((appointment) => {
    // Handle both AppointmentBase and AppointmentCalculated types
    const base = 'base' in appointment ? (appointment as any).base : appointment

    // Only consider recurring appointments (must have repeatId)
    if (!base.repeatId) return false

    // Determine the effective end date
    let effectiveEndDate = null

    if (base.repeatUntil) {
      effectiveEndDate = new Date(base.repeatUntil)
    } else if (base.additionals && Array.isArray(base.additionals) && base.additionals.length > 0) {
      // Find the latest date in additionals
      const latestAdditional = base.additionals
        .map((additional: any) => new Date(additional.date || additional.startDate))
        .filter((date: Date) => !isNaN(date.getTime()))
        .sort((a: Date, b: Date) => b.getTime() - a.getTime())[0]

      if (latestAdditional) {
        effectiveEndDate = latestAdditional
      }
    }

    // If we have an effective end date, check if it's within our time frame
    if (effectiveEndDate) {
      return effectiveEndDate >= now
    }

    // If no end date can be determined, include it (ongoing series)
    return true
  })

  // Remove duplicates (multiple instances of the same series)
  const uniqueSeries = Array.from(
    new Map(
      expiringSeries.map((item) => {
        const base = 'base' in item ? item.base : item
        return [base.id, item] // Using base.id as the unique identifier
      })
    ).values()
  )
  return uniqueSeries
}

/**
 * Generates a URL to open a group's dynamic settings in ChurchTools
 */
export function getGroupUrl(groupId: number): string {
  const churchtoolsBaseUrl = import.meta.env.DEV
    ? import.meta.env.VITE_BASE_URL
    : window.location.origin
  return `${churchtoolsBaseUrl}/groups/${groupId}`
}

/**
 * Generates a URL to open an appointment in ChurchTools
 */
export function getAppointmentUrl(appointment: Appointment): string {
  const base = 'base' in appointment ? appointment.base : appointment
  const url = new URL(getChurchtoolsBaseUrl())

  url.searchParams.set('q', 'churchcal')
  url.searchParams.set('editScope', 'series')
  url.searchParams.set('startdate', base.startDate.split('T')[0])
  url.searchParams.set('category_id', base.calendar.id.toString())
  url.searchParams.set('id', base.id.toString())
  url.hash = 'CalView'

  return url.toString()
}
