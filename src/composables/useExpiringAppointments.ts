import { useQuery } from '@tanstack/vue-query'
import { findExpiringSeries, type Appointment } from '@/services/churchtools'

export function useExpiringAppointments(daysInAdvance: number = 300000, tagIds: number[] = []) {
  // Only log once per unique query setup
  if (import.meta.env.DEV) {
    console.log('📅 Setting up expiring appointments query for', daysInAdvance, 'days with tags:', tagIds)
  }
  return useQuery({
    queryKey: ['expiring-appointments', daysInAdvance, ...tagIds],
    queryFn: () => findExpiringSeries(daysInAdvance, tagIds),
    staleTime: 30 * 60 * 1000, // 30 minutes - appointments don't change often
    gcTime: 60 * 60 * 1000, // 1 hour cache time
    refetchInterval: 15 * 60 * 1000, // Background update every 15 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })
}

export function useExpiringAppointmentsStats(appointments: Appointment[], daysToShow: number = 90) {
  const getAppointmentStatus = (appointment: Appointment): string => {
    // Handle both AppointmentBase and AppointmentCalculated types
    const base = 'base' in appointment ? appointment.base : appointment

    if (!base.repeatUntil) return 'active'

    const endDate = new Date(base.repeatUntil)
    const today = new Date()
    const daysUntilEnd = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    if (endDate < today) return 'expired'
    if (daysUntilEnd <= daysToShow) return 'expiring'
    return 'active'
  }

  const expiringCount = appointments.filter((a) => getAppointmentStatus(a) === 'expiring').length
  const expiredCount = appointments.filter((a) => getAppointmentStatus(a) === 'expired').length

  return {
    total: appointments.length,
    expiring: expiringCount,
    expired: expiredCount,
    getAppointmentStatus,
  }
}
