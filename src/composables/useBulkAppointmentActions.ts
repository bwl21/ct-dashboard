import { ref } from 'vue'
import { churchtoolsClient } from '@churchtools/churchtools-client'
import { useToast } from './useToast'

export function useBulkAppointmentActions() {
  const { showToast } = useToast()
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
        const appointment = await churchtoolsClient.get(`/appointments/${appointmentId}`)

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
      showToast(
        `${results.success} ${results.success === 1 ? 'Termin' : 'Termine'} erfolgreich verlängert`,
        'success'
      )
    } else if (results.success > 0 && results.failed > 0) {
      showToast(
        `${results.success} ${results.success === 1 ? 'Termin' : 'Termine'} verlängert, ${results.failed} fehlgeschlagen`,
        'warning'
      )
    } else {
      showToast(`Fehler beim Verlängern der Termine`, 'error')
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
