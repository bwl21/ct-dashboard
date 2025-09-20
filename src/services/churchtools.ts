import { churchtoolsClient } from '@churchtools/churchtools-client'

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

type Appointment = AppointmentBase | AppointmentCalculated

/**
 * Fetches all calendars from ChurchTools
 */
export async function fetchCalendars(): Promise<Calendar[]> {
  const response = await churchtoolsClient.get<Calendar[]>('/calendars')
  return response || []
}

/**
 * Fetches appointments for a specific calendar within a date range
 */
export async function fetchAppointments(
  calendarIds: number[],
  startDate: Date,
  endDate: Date
): Promise<Appointment[]> {
  const start = startDate.toISOString().split('T')[0]
  const end = endDate.toISOString().split('T')[0]

  const response = await churchtoolsClient.get<Appointment[]>('/calendars/appointments', {
    from: start,
    to: end,
    'calendar_ids[]': calendarIds,
  })

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
export async function findExpiringSeries(daysInAdvance: number = 60): Promise<Appointment[]> {
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

  console.log('Fetching appointments for calendar IDs:', allCalendarIds)
  // Fetch appointments
  const appointments = await fetchAppointments(allCalendarIds, now, endDate)

  // Find recurring appointments that are ending soon
  const expiringSeries = appointments.filter((appointment) => {
    // Handle both AppointmentBase and AppointmentCalculated types
    const base = 'base' in appointment ? appointment.base : appointment

    // Only consider recurring appointments (must have repeatId)
    if (!base.repeatId) return false

    // Determine the effective end date
    let effectiveEndDate = null

    if (base.repeatUntil) {
      effectiveEndDate = new Date(base.repeatUntil)
    } else if (base.additionals && Array.isArray(base.additionals) && base.additionals.length > 0) {
      // Find the latest date in additionals
      const latestAdditional = base.additionals
        .map((additional) => new Date(additional.date || additional.date))
        .filter((date) => !isNaN(date.getTime()))
        .sort((a, b) => b.getTime() - a.getTime())[0]

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
