import type { RoomBooking, ConflictPartyEntry } from './useRoomBookings'
import { BOOKING_STATUS } from './useRoomBookings'

export type ConflictMailTemplateId = 'clarify-priority' | 'blank'

export interface ConflictMailRecipient {
  personId: number
  name: string
  email?: string
  role: 'requester' | 'conflictCreator' | 'onBehalfOf'
  selected: boolean
}

/**
 * Templates produce **Markdown** (subset: paragraphs + **bold**).
 * Conversion to HTML happens centrally in `markdown.ts` before sending.
 */
export interface ConflictMailTemplate {
  id: ConflictMailTemplateId
  label: string
  buildSubject: (booking: RoomBooking) => string
  buildBody: (
    booking: RoomBooking,
    recipients: ConflictMailRecipient[],
    parties: ConflictPartyEntry[]
  ) => string
}

const rankIcon = (rank: number): string => {
  if (rank === 1) return '🥇'
  if (rank === 2) return '🥈'
  if (rank === 3) return '🥉'
  return `#${rank}`
}

const statusLabel = (statusId: number): string => {
  switch (statusId) {
    case BOOKING_STATUS.APPROVED:
      return '✅ genehmigt'
    case BOOKING_STATUS.PENDING:
      return '🟡 wartet auf Bestätigung'
    case BOOKING_STATUS.CANCELED:
      return '❌ abgelehnt'
    case BOOKING_STATUS.DELETED:
      return '🗑️ gelöscht'
    default:
      return `Status ${statusId}`
  }
}

const formatDate = (dateString: string): string => {
  try {
    return new Date(dateString).toLocaleDateString('de-DE', {
      weekday: 'short',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } catch {
    return dateString
  }
}

const formatTime = (dateString: string): string => {
  try {
    return new Date(dateString).toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return dateString
  }
}

export const CONFLICT_MAIL_TEMPLATES: ConflictMailTemplate[] = [
  {
    id: 'clarify-priority',
    label: 'Klärung mit Priorität (Default)',
    buildSubject: (booking) => {
      return `Raumkonflikt: ${booking.resourceName} am ${formatDate(booking.startDate)}`
    },
    buildBody: (booking, _recipients, parties) => {
      const sortedParties = [...parties].sort((a, b) => a.priorityRank - b.priorityRank)

      const date = formatDate(booking.startDate)
      const time = `${formatTime(booking.startDate)}–${formatTime(booking.endDate)}`

      const formatPartyLine = (p: ConflictPartyEntry, marker: string): string => {
        const termin =
          `${formatDate(p.startDate)}, ` + `${formatTime(p.startDate)}–${formatTime(p.endDate)}`
        const created = p.createdDate ? formatDate(p.createdDate) : null

        const lines = [
          `${marker} **"${p.title}"** – ${p.creatorName}`,
          `Status: ${statusLabel(p.statusId)}`,
          `Termin: ${termin}`,
        ]
        if (created) lines.push(`Erstellt: ${created}`)
        //if (p.editUrl) lines.push(`[➜ Termin bearbeiten](${p.editUrl})`)

        // First line is the list item; subsequent lines become <br>
        // continuations within the same <li> (see markdown.ts).
        return `- ${lines[0]}\n  ${lines.slice(1).join('\n  ')}`
      }

      const partyList = sortedParties
        .map((p) => formatPartyLine(p, rankIcon(p.priorityRank)))
        .join('\n')

      return `
Hallo zusammen,

für den Raum **${booking.resourceName}** am ${date} (${time}) gibt es einen Buchungskonflikt zwischen mehreren Buchungen. Die zuerst eingegangene bzw. bereits genehmigte Buchung hat Vorrang.

**Kollidierende Buchungen (sortiert nach Priorität):**

${partyList}

Wir bitten um Rückmeldung und Abstimmung eines Ausweichtermins bzw. Ausweichraumes.

Falls eine der Buchungen den Termin freiwillig freigeben kann, meldet euch bitte.

Bei Rückfragen einfach auf diese E-Mail antworten.
Vielen Dank!
`.trim()
    },
  },
  {
    id: 'blank',
    label: 'Frei (leer)',
    buildSubject: () => '',
    buildBody: () => '',
  },
]

export function getTemplateById(id: ConflictMailTemplateId): ConflictMailTemplate {
  return CONFLICT_MAIL_TEMPLATES.find((t) => t.id === id) ?? CONFLICT_MAIL_TEMPLATES[1]
}
