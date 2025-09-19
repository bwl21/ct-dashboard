import { churchtoolsClient } from '@churchtools/churchtools-client';

export interface Calendar {
  id: number;
  name: string;
  nameTranslated: string;
  sortKey: number;
  color: string;
  isPublic: boolean;
  isPrivate: boolean;
  randomUrl: string;
  icalUrl: string;
  meta: {
    createdBy: string;
    createdAt: string;
    modifiedBy: string;
    modifiedAt: string;
  };
}

export interface Appointment {
  id: number;
  title: string;
  startDate: string;
  endDate: string;
  allDay: boolean;
  note: string;
  appointmentType: {
    id: number;
    name: string;
    nameTranslated: string;
  };
  baseAppointmentId: number | null;
  series: {
    id: number;
    repeatId: number;
    repeatFrequency: string;
    repeatUntil: string | null;
    repeatOption: any;
  } | null;
  calendar: {
    id: number;
    name: string;
    nameTranslated: string;
  };
}

/**
 * Fetches all calendars from ChurchTools
 */
export async function fetchCalendars(): Promise<Calendar[]> {
  const response = await churchtoolsClient.get('/calendars');
  return response.data || [];
}

/**
 * Fetches appointments for a specific calendar within a date range
 */
export async function fetchAppointments(
  calendarIds: number[],
  startDate: Date,
  endDate: Date
): Promise<Appointment[]> {
  const start = startDate.toISOString().split('T')[0];
  const end = endDate.toISOString().split('T')[0];
  
  const response = await churchtoolsClient.get('/calendars/appointments', {
    params: {
      from: start,
      to: end,
      calendar_ids: calendarIds.join(',')
    }
  });
  
  return response.data || [];
}

/**
 * Identifies church and group calendars
 */
export async function identifyCalendars(): Promise<{
  churchCalendars: Calendar[];
  groupCalendars: Calendar[];
}> {
  const calendars = await fetchCalendars();
  
  // Filter out private calendars and sort by name
  const publicCalendars = calendars
    .filter(cal => !cal.isPrivate)
    .sort((a, b) => a.name.localeCompare(b.name));
  
  // This is a simple heuristic - adjust based on your ChurchTools setup
  const churchCalendars = publicCalendars.filter(cal => 
    !cal.name.toLowerCase().includes('gruppe') && 
    !cal.name.toLowerCase().includes('team')
  );
  
  const groupCalendars = publicCalendars.filter(cal => 
    cal.name.toLowerCase().includes('gruppe') || 
    cal.name.toLowerCase().includes('team')
  );
  
  return { churchCalendars, groupCalendars };
}

/**
 * Finds all recurring appointment series that are about to end
 */
export async function findExpiringSeries(daysInAdvance: number = 60): Promise<Appointment[]> {
  const now = new Date();
  const endDate = new Date();
  endDate.setDate(now.getDate() + daysInAdvance);
  
  // Get all relevant calendars
  const { churchCalendars, groupCalendars } = await identifyCalendars();
  const allCalendarIds = [
    ...churchCalendars.map(c => c.id),
    ...groupCalendars.map(c => c.id)
  ];
  
  // Fetch appointments
  const appointments = await fetchAppointments(allCalendarIds, now, endDate);
  
  // Find recurring appointments that are ending soon
  const expiringSeries = appointments.filter(appointment => {
    // Only consider recurring appointments
    if (!appointment.series) return false;
    
    // Check if the series has an end date that's within our time frame
    if (appointment.series.repeatUntil) {
      const repeatUntil = new Date(appointment.series.repeatUntil);
      return repeatUntil >= now && repeatUntil <= endDate;
    }
    
    return false;
  });
  
  // Remove duplicates (multiple instances of the same series)
  const uniqueSeries = Array.from(new Map(
    expiringSeries.map(item => [item.series?.id, item])
  ).values());
  
  return uniqueSeries;
}
