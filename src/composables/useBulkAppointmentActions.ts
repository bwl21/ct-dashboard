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
   */
  const extendAppointments = async (
    appointmentIds: number[],
    extensionMonths: number
  ): Promise<{ success: number; failed: number }> => {
    isProcessing.value = true
    processedCount.value = 0
    errorCount.value = 0

    const results = {
      success: 0,
      failed: 0,
    }

    for (const appointmentId of appointmentIds) {
      try {
        // Fetch current appointment data
        const response: any = await churchtoolsClient.get(`/appointments/${appointmentId}`)
        const appointment = response.appointment || response

        if (!appointment || !appointment.base) {
          console.error(`Appointment ${appointmentId} not found or has no base data`)
          results.failed++
          errorCount.value++
          continue
        }

        const base = appointment.base

        // Calculate new repeat-until date
        let newRepeatUntil: string

        if (base.repeatUntil) {
          // Extend existing repeatUntil
          const currentDate = new Date(base.repeatUntil)
          currentDate.setMonth(currentDate.getMonth() + extensionMonths)
          newRepeatUntil = currentDate.toISOString().split('T')[0]
        } else {
          // No repeatUntil set, extend from start date
          const startDate = new Date(base.startDate)
          startDate.setMonth(startDate.getMonth() + extensionMonths)
          newRepeatUntil = startDate.toISOString().split('T')[0]
        }

        // Update appointment
        await churchtoolsClient.patch(`/appointments/${appointmentId}`, {
          repeatUntil: newRepeatUntil,
        })

        results.success++
        processedCount.value++
      } catch (error) {
        console.error(`Failed to extend appointment ${appointmentId}:`, error)
        results.failed++
        errorCount.value++
      }
    }

    isProcessing.value = false

    // Show result toast
    if (results.success > 0 && results.failed === 0) {
      showSuccess(
        `${results.success} ${results.success === 1 ? 'Termin' : 'Termine'} erfolgreich verlängert`
      )
    } else if (results.success > 0 && results.failed > 0) {
      showWarning(
        `${results.success} ${results.success === 1 ? 'Termin' : 'Termine'} verlängert, ${results.failed} fehlgeschlagen`
      )
    } else {
      showError(`Fehler beim Verlängern der Termine`)
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
