import type { RoomBooking, ConflictPartyEntry } from './useRoomBookings'

export type ConflictMailTemplateId = 'clarify-priority' | 'blank'

export interface ConflictMailRecipient {
  personId: number
  name: string
  email?: string
  role: 'requester' | 'conflictCreator' | 'onBehalfOf'
  selected: boolean
}

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
      const requestParty = parties.find((p) => p.kind === 'request')
      const conflictingParties = parties.filter((p) => p.kind === 'existing')

      const date = formatDate(booking.startDate)
      const time = `${formatTime(booking.startDate)}–${formatTime(booking.endDate)}`

      const requestLine = requestParty
        ? `- ⚠️ "${requestParty.title}" – ${requestParty.creatorName}` +
          (requestParty.createdDate ? ` (${formatDate(requestParty.createdDate)})` : '')
        : ''

      const conflictingList = conflictingParties
        .map(
          (p) =>
            `${rankIcon(p.priorityRank)} "${p.title}" – ${p.creatorName}` +
            (p.createdDate ? ` (${formatDate(p.createdDate)})` : '')
        )
        .map((line) => `- ${line}`)
        .join('\n')

      return `
Hallo zusammen,

für den Raum **${booking.resourceName}** am ${date}
(${time}) gibt es einen Buchungskonflikt. Die zuerst eingegangene bzw.
bereits genehmigte Buchung hat Vorrang.

### Deine Buchungsanfrage:

${requestLine}

### Kollidierende Buchungen:

${conflictingList}

Wir bitten um Rückmeldung und Abstimmung eines Ausweichtermins bzw. Ausweichraumes.

Falls eine bestehende Buchung den Termin freiwillig freigeben kann,
meldet euch bitte ebenfalls.

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
