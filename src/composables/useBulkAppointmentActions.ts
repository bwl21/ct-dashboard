import { ref } from 'vue'
import { churchtoolsClient } from '@churchtools/churchtools-client'
import { useToast } from './useToast'

export function useBulkAppointmentActions() {
  const { showSuccess, showError, showWarning } = useToast()
  const isProcessing = ref(false)
  const processedCount = ref(0)
  const errorCount = ref(0)

  /**
   * Extend the repeat-until date for multiple appointments
   * Sets absolute end date: today + extensionMonths
   * Skips appointments that would be shortened
   */
  const extendAppointments = async (
    appointments: Array<{ seriesId: number; startDate: string }>,
    extensionMonths: number
  ): Promise<{ success: number; failed: number; skipped: number }> => {
    isProcessing.value = true
    processedCount.value = 0
    errorCount.value = 0

    const results = {
      success: 0,
      failed: 0,
      skipped: 0,
    }

    // Calculate new absolute end date: today + X months
    const today = new Date()
    const newEndDate = new Date(today)
    newEndDate.setMonth(today.getMonth() + extensionMonths)
    const newRepeatUntil = newEndDate.toISOString().split('T')[0]

    for (const appointment of appointments) {
      try {
        // Fetch current appointment data using seriesId and startDate
        const response: any = await churchtoolsClient.get(
          `/calendars/appointments/${appointment.seriesId}/${appointment.startDate}`
        )
        const appointmentData = response.appointment || response

        if (!appointmentData || !appointmentData.base) {
          console.error(`Appointment series ${appointment.seriesId} not found or has no base data`)
          results.failed++
          errorCount.value++
          continue
        }

        const base = appointmentData.base
        const seriesId = base.id

        // Check if series would be shortened
        if (base.repeatUntil) {
          const currentEndDate = new Date(base.repeatUntil)
          if (newEndDate < currentEndDate) {
            console.warn(
              `Skipping appointment ${seriesId} (${base.title}): would be shortened from ${base.repeatUntil} to ${newRepeatUntil}`
            )
            results.skipped++
            continue
          }
        }

        // Update appointment with absolute end date
        await churchtoolsClient.patch(`/appointments/${seriesId}`, {
          repeatUntil: newRepeatUntil,
        })

        results.success++
        processedCount.value++
      } catch (error) {
        console.error(`Failed to extend appointment ${appointment.seriesId}:`, error)
        results.failed++
        errorCount.value++
      }
    }

    isProcessing.value = false

    // Show result toast
    if (results.success > 0 && results.failed === 0 && results.skipped === 0) {
      // All successful
      showSuccess(
        `${results.success} ${results.success === 1 ? 'Termin' : 'Termine'} erfolgreich verlängert`
      )
    } else if (results.success > 0 && results.skipped > 0) {
      // Some successful, some skipped
      showWarning(
        `${results.success} ${results.success === 1 ? 'Termin' : 'Termine'} verlängert, ${results.skipped} übersprungen (würden verkürzt)`
      )
    } else if (results.skipped > 0 && results.success === 0) {
      // All skipped
      showWarning(
        `Keine Termine verlängert. ${results.skipped} ${results.skipped === 1 ? 'Termin würde' : 'Termine würden'} verkürzt werden.`
      )
    } else if (results.failed > 0) {
      // Some or all failed
      showError(
        `${results.failed} ${results.failed === 1 ? 'Termin' : 'Termine'} konnten nicht verlängert werden`
      )
    }

    return results
  }

  return {
    isProcessing,
    processedCount,
    errorCount,
    extendAppointments,
  }
}
