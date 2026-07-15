# Konzept: E-Mail-Kommunikation bei Raumbuchungs-Konflikten

**Status**: Entwurf
**Erstellt**: 2026-04-30
**Kontext**: Erweiterung des Konflikt-Workflows in `src/components/room-bookings/`
**Bezug**: `docs/raumbuchungsanfragen/ANFORDERUNG.md` (Problem 1 & 4: Kommunikation bei Ablehnung / Konflikt)

---

## 1. Motivation

Heute kann ein Admin im `ConflictDetailsModal` einen Konflikt zwischen einer ausstehenden Anfrage und einer oder mehreren bereits bestehenden Buchungen einsehen. Eine Auflösung erfordert jedoch in vielen Fällen eine Abstimmung **zwischen** den Beteiligten – nicht nur eine Ablehnungsmail.

Aktuell:

- `sendRejectionEmail()` (in [useRoomBookings.ts](file:///Users/beweiche/beweiche_noTimeMachine/ct-dashboard/src/components/room-bookings/useRoomBookings.ts#L279-L319)) wird **nur** beim Ablehnen genutzt.
- Es gibt keine Möglichkeit, alle Konfliktbeteiligten gemeinsam zu informieren bzw. eine Klärung anzustoßen, ohne sofort abzulehnen.

Ziel: Der Admin soll aus dem Konflikt-Kontext heraus eine **Klärungs-/Abstimmungsmail** an alle involvierten Personen senden können.

---

## 2. Konfliktauflösungs-Prinzip: "First come, first served"

Für die Auflösung gilt eine klare Priorität:

> **Die zeitlich frühere (zuerst angelegte bzw. bereits genehmigte) Buchung hat Vorrang.
> Eine spätere, kollidierende Anfrage muss weichen oder einen Ausweichtermin finden.**

Konsequenzen für die Mail-Kommunikation:

- Die Empfänger werden im Anschreiben **nach Priorität sortiert dargestellt**:
  1. Bestehende Buchung(en) – mit dem Hinweis "hat Vorrang".
  2. Neue Anfrage – mit dem Hinweis "muss ggf. ausweichen".
- Die Mail formuliert **keine offene Verhandlung auf Augenhöhe**, sondern:
  - bestätigt der bestehenden Buchung den Vorrang,
  - bittet den Anfragesteller um Vorschlag eines Ausweichtermins,
  - lädt die bestehenden Bucher ein, **freiwillig** Platz zu machen, falls für sie unkritisch.
- Ein Sortier-/Vergleichskriterium liefert das Composable
  (`createdAt` der Buchung, alternativ `statusId === APPROVED` vor `PENDING`,
  bei Gleichstand niedrigere `bookingId`).

### Bestimmung der Priorität

```diagram
╭──────────────────────────────────╮
│ Konflikt-Set (Anfrage + N×Konfl.)│
╰────────────┬─────────────────────╯
             │
             ▼
   Sortiere nach:
     1. statusId  (APPROVED < PENDING)
     2. createdAt (älter zuerst)        ← Hauptkriterium
     3. bookingId (kleinste zuerst)     ← Tie-Breaker
             │
             ▼
   ╭────────────────────────╮
   │ priorityRank: 1..N     │  → Rang 1 = Vorrang
   ╰────────────────────────╯
```

Damit hat der Composable-Layer eine eindeutige Wahrheit, welche Buchung
als "die frühere" gilt – die UI und der Mail-Text greifen auf diesen
`priorityRank` zurück.

---

## 3. Use-Cases

| #    | Szenario                       | Empfänger                                                       | Trigger                                                      |
| ---- | ------------------------------ | --------------------------------------------------------------- | ------------------------------------------------------------ |
| UC-1 | Klärung anfordern              | Anfragesteller + alle Konflikt-Ersteller (+ jeweils "i.A. von") | Button "📧 Beteiligte informieren" im `ConflictDetailsModal` |
| UC-2 | Ablehnung mit Konflikt-Hinweis | Anfragesteller (primär), optional Konflikt-Ersteller in CC      | Erweiterung des bestehenden Reject-Dialogs                   |
| UC-3 | Einzelne Person anschreiben    | Eine Person aus der Beteiligtenliste                            | Button "✉️" pro `BookingDetails`-Eintrag                     |

Dieses Konzept fokussiert UC-1 (Klärung) und beschreibt UC-2/UC-3 als optionale Folgeerweiterungen.

---

## 4. UI-Konzept

### 4.1 Einstiegspunkt

Im [ConflictDetailsModal.vue](file:///Users/beweiche/beweiche_noTimeMachine/ct-dashboard/src/components/room-bookings/ConflictDetailsModal.vue) wird der Footer um einen primären Action-Button ergänzt:

```diagram
╭───────────────────────────────────────────────────────────────╮
│  ⚠️ Konflikt-Details                                       ×  │
├───────────────────────────────────────────────────────────────┤
│  Anfrage mit Konflikt                                         │
│  ╭─────────────────────────────────────────────────────────╮  │
│  │ Gemeindesaal · Mo 04.05.2026 · 19:00 – 21:00            │  │
│  │ Ersteller: Max Mustermann (max@…)                       │  │
│  ╰─────────────────────────────────────────────────────────╯  │
│                                                               │
│  Konfligierende Buchungen (2)                                 │
│  ╭─────────────────────────────────────────────────────────╮  │
│  │ Konflikt 1 · Chorprobe · Erika Beispiel                 │  │
│  ╰─────────────────────────────────────────────────────────╯  │
│  ╭─────────────────────────────────────────────────────────╮  │
│  │ Konflikt 2 · Jugendkreis · Tom Tester                   │  │
│  ╰─────────────────────────────────────────────────────────╯  │
├───────────────────────────────────────────────────────────────┤
│              [📧 Beteiligte informieren]   [Schließen]        │
╰───────────────────────────────────────────────────────────────╯
```

Klick auf **"📧 Beteiligte informieren"** öffnet das neue `ConflictMailModal`.

### 4.2 ConflictMailModal

Neue Komponente: `src/components/room-bookings/ConflictMailModal.vue`

```diagram
╭───────────────────────────────────────────────────────────────╮
│  📧 E-Mail an Konflikt-Beteiligte                          ×  │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│  Empfänger (sortiert nach Priorität)                          │
│  ╭─────────────────────────────────────────────────────────╮  │
│  │ ☑  Erika Beispiel  🥇 Vorrang  (Bestand)   erika@…      │  │
│  │ ☑  Tom Tester      🥈          (Bestand)   tom@…        │  │
│  │ ☑  Max Mustermann  ⚠️ Anfrage  (neu)       max@…        │  │
│  │ ☐  Pastor i.A.                 (i.A. Tom)  pastor@…     │  │
│  ╰─────────────────────────────────────────────────────────╯  │
│  ⓘ Priorität nach „first come, first served" – ältere /       │
│    bereits genehmigte Buchungen haben Vorrang.                │
│                                                               │
│  Vorlage: [ Klärung mit Priorität (Default) ▾ ]               │
│                                                               │
│  Betreff:                                                     │
│  [ Raumkonflikt: Gemeindesaal am 04.05.2026                ]  │
│                                                               │
│  Nachricht:                                                   │
│  ╭─────────────────────────────────────────────────────────╮  │
│  │ Hallo zusammen,                                         │  │
│  │                                                         │  │
│  │ für den Raum **Gemeindesaal** am 04.05.2026             │  │
│  │ (19:00–21:00) gibt es einen Buchungskonflikt.           │  │
│  │                                                         │  │
│  │ Vorrang (bereits gebucht – first come, first served):   │  │
│  │  🥇 Chorprobe – Erika Beispiel (genehmigt 01.04.)       │  │
│  │  🥈 Jugendkreis – Tom Tester  (genehmigt 10.04.)        │  │
│  │                                                         │  │
│  │ Spätere Anfrage (muss ggf. ausweichen):                 │  │
│  │  ⚠️ "Gemeindefest" – Max Mustermann (28.04.)            │  │
│  │                                                         │  │
│  │ Bitte um Rückmeldung von Max …                          │  │
│  ╰─────────────────────────────────────────────────────────╯  │
│  ☐ Mich (Admin) in BCC setzen                                 │
│                                                               │
├───────────────────────────────────────────────────────────────┤
│                       [Abbrechen]   [📨 E-Mail senden]        │
╰───────────────────────────────────────────────────────────────╯
```

### 4.3 Interaktionen

- **Empfängerliste**:
  - Sortiert nach `priorityRank` (Vorrang zuerst, neue Anfrage zuletzt).
  - Visuelle Marker: 🥇 = Rang 1 (Vorrang), 🥈/🥉 weitere bestehende, ⚠️ = neue Anfrage.
  - Eine Spalte zeigt die Begründung der Reihenfolge ("genehmigt 01.04." vs. "Anfrage 28.04.").
  - Personen ohne E-Mail werden disabled.
- **Vorlagen-Dropdown**:
  - _Klärung mit Priorität_ (Default) – formuliert First-come-first-served explizit.
  - _Anfrage ablehnen wegen Konflikt_ – informiert primär den Anfragesteller.
  - _Vorrang-Bucher um freiwilliges Weichen bitten_ – fragt höflich, ob die bestehenden Bucher Platz machen können.
  - _Frei (leer)_
- **Betreff & Nachricht**: vorausgefüllt aus Vorlage + Buchungsdaten, vollständig editierbar.
- **Live-Preview** (gerendertes HTML) optional als Tab ("Bearbeiten | Vorschau").
- **Senden**: Button disabled wenn 0 Empfänger oder leerer Betreff. Loading-State während des Sendens. Erfolgs-Toast / Fehler-Banner.
- **Abbrechen**: Schließt Modal ohne API-Call.

### 4.4 Optional: Einzelversand pro `BookingDetails`

In [BookingDetails.vue](file:///Users/beweiche/beweiche_noTimeMachine/ct-dashboard/src/components/room-bookings/BookingDetails.vue#L70-L88) kann neben den Buttons "📅 Bearbeiten" / "ℹ️ Details" ein "✉️" ergänzt werden, das direkt mit einer einzelnen vorausgewählten Person ins selbe `ConflictMailModal` springt.

---

## 5. Datenmodell

### 5.1 Neue Typen (in `useRoomBookings.ts`)

```typescript
export type ConflictMailRole = "requester" | "conflictCreator" | "onBehalfOf"

export interface ConflictParty {
  bookingId: number
  title: string
  startDate: string
  endDate: string
  statusId: number // APPROVED, PENDING, …
  createdAt?: string // ISO – wenn von API geliefert
  /** 1 = höchste Priorität (Vorrang) */
  priorityRank: number
  /** Klassifikation: bestehende Buchung oder neue Anfrage */
  kind: "existing" | "request"
}

export interface ConflictMailRecipient {
  personId: number
  name: string
  email?: string
  role: ConflictMailRole
  /** Verknüpfung zur Buchung – liefert priorityRank für Sortierung & Text */
  party: ConflictParty
  /** Pre-selected in Modal */
  selected: boolean
}

export interface ConflictMailDraft {
  bookingId: number
  recipients: ConflictMailRecipient[] // bereits sortiert nach priorityRank
  parties: ConflictParty[] // sortiert, für Body-Rendering
  subject: string
  bodyHtml: string
  bccSelf: boolean
  templateId?: number
}
```

### 5.2 Prioritäts-Funktion

```typescript
/**
 * Bestimmt die Priorität ("first come, first served").
 * Niedrigerer Rank = höhere Priorität.
 */
const computePriorityRank = (parties: ConflictParty[]): ConflictParty[] => {
  return [...parties]
    .sort((a, b) => {
      // 1. Genehmigte vor ausstehenden Buchungen
      if (a.statusId !== b.statusId) {
        if (a.statusId === BOOKING_STATUS.APPROVED) return -1
        if (b.statusId === BOOKING_STATUS.APPROVED) return 1
      }
      // 2. Älteres createdAt zuerst (Hauptkriterium)
      if (a.createdAt && b.createdAt && a.createdAt !== b.createdAt) {
        return a.createdAt < b.createdAt ? -1 : 1
      }
      // 3. Tie-Breaker: kleinere bookingId
      return a.bookingId - b.bookingId
    })
    .map((p, idx) => ({ ...p, priorityRank: idx + 1 }))
}
```

### 5.3 Empfänger-Auflösung

```diagram
╭──────────────────────────────────────╮
│ RoomBooking (Anfrage)                │
│  · createdBy        → role=requester │
│  · onBehalfOf       → role=onBehalfOf│
╰──────────────────────────────────────╯
                │
                ▼
╭──────────────────────────────────────╮
│ booking.conflicts[]                  │
│  · resolveConflictCreator(bookingId) │
│      → createdBy   → role=conflict…  │
│      → onBehalfOf  → role=onBehalfOf │
╰──────────────────────────────────────╯
                │
                ▼
       Dedup nach personId
                │
                ▼
       ConflictMailRecipient[]
```

`resolveConflictCreator()` existiert bereits in [useRoomBookings.ts](file:///Users/beweiche/beweiche_noTimeMachine/ct-dashboard/src/components/room-bookings/useRoomBookings.ts#L344-L391) und wird wiederverwendet.

---

## 6. Vorlagen

Vorlagen werden als Funktionen geliefert, die den `RoomBooking` + Empfängerliste +
sortierte `parties` in Subject/Body rendern. Alle Default-Vorlagen drücken die
First-come-first-served-Priorität explizit aus.

```typescript
interface MailTemplate {
  id: "clarify-priority" | "reject-request" | "ask-priority-yield" | "blank"
  label: string
  buildSubject: (b: RoomBooking) => string
  buildBody: (
    b: RoomBooking,
    recipients: ConflictMailRecipient[],
    parties: ConflictParty[] // sortiert, [0] = Vorrang
  ) => string // HTML
}
```

### 6.1 Default-Template `clarify-priority`

```text
Betreff: Raumkonflikt: {{resourceName}} am {{date}}

Hallo zusammen,

für den Raum "{{resourceName}}" am {{date}} ({{startTime}}–{{endTime}})
gibt es einen Buchungskonflikt. Wir gehen nach dem Prinzip
„first come, first served" vor – die zuerst eingegangene bzw.
bereits genehmigte Buchung hat Vorrang.

Mit Vorrang (bestehende Buchungen):
{{#each parties where kind == 'existing'}}
  {{rankIcon}} "{{title}}" – {{creator.name}}
      (genehmigt am {{createdAt|date}})
{{/each}}

Spätere Anfrage (muss ggf. ausweichen):
  ⚠️ "{{request.title}}" – {{request.creator.name}}
      (eingegangen am {{request.createdAt|date}})

Liebe(r) {{request.creator.firstName}}, wir bitten dich, einen
Ausweichtermin zu prüfen oder die Anfrage zurückzuziehen.

Liebe Vorrang-Bucher: Falls der Termin für euch unkritisch
verschiebbar ist, gebt bitte kurz Bescheid – das ist aber
ausdrücklich freiwillig.

Bei Rückfragen einfach auf diese E-Mail antworten.

Vielen Dank!
{{adminName}}
```

### 6.2 Template `reject-request`

Wird verwendet, wenn der Admin direkt ablehnen möchte. Empfänger primär
der Anfragesteller, Vorrang-Bucher optional in CC.

```text
Betreff: Anfrage abgelehnt: {{resourceName}} am {{date}}

Hallo {{request.creator.firstName}},

leider können wir deine Buchungsanfrage für den Raum
"{{resourceName}}" am {{date}} nicht bestätigen.

Begründung: Konflikt mit einer bereits genehmigten Buchung
("first come, first served"):

  🥇 "{{topPriority.title}}" – {{topPriority.creator.name}}
      (genehmigt am {{topPriority.createdAt|date}})

{{#if adminRemarks}}
Bemerkung: {{adminRemarks}}
{{/if}}

Bitte versuche einen Ausweichtermin in ChurchTools zu buchen.

Viele Grüße
{{adminName}}
```

### 6.3 Template `ask-priority-yield`

Adressiert nur die Vorrang-Bucher und fragt aktiv nach Verschiebung.

```text
Betreff: Frage: Raum {{resourceName}} am {{date}} freigeben?

Hallo zusammen,

ihr habt für den {{date}} ({{startTime}}–{{endTime}}) den Raum
"{{resourceName}}" gebucht (und damit Vorrang).

Es ist eine weitere Anfrage eingegangen:
  ⚠️ "{{request.title}}" – {{request.creator.name}}

Wäre es für euch möglich und unkritisch, den Raum oder den Termin
freiwillig freizugeben? Falls nein – kein Problem, dann bleibt
eure Buchung bestehen.

Kurze Rückmeldung wäre super.

Danke!
{{adminName}}
```

Speicherung der Standard-Vorlagen: hartkodiert in
`src/components/room-bookings/conflictMailTemplates.ts`. Späterer Ausbau
zu konfigurierbaren Vorlagen (über ChurchTools custom_modules) möglich.

---

## 7. Technische Umsetzung

### 7.1 Dateien

```
src/components/room-bookings/
├── ConflictDetailsModal.vue         # ← Button "Beteiligte informieren" ergänzen
├── ConflictMailModal.vue            # NEU – inkl. Priority-Sortierung
├── conflictMailTemplates.ts         # NEU – Vorlagen mit Priority-Logik
└── useRoomBookings.ts               # Erweiterung: computePriorityRank(),
                                     #   buildConflictParties(),
                                     #   collectConflictRecipients(),
                                     #   sendConflictMail()
```

### 7.2 Neue Composable-Methoden

```typescript
/**
 * Build prioritized parties (request + conflicts) using
 * computePriorityRank().
 */
const buildConflictParties = async (
  booking: RoomBooking
): Promise<ConflictParty[]> => { … }

/**
 * Collect all involved persons for a booking + its conflicts.
 * Loads conflict creators via resolveConflictCreator() and assigns
 * priorityRank/kind from buildConflictParties().
 */
const collectConflictRecipients = async (
  booking: RoomBooking
): Promise<{
  recipients: ConflictMailRecipient[]   // sortiert nach priorityRank
  parties: ConflictParty[]              // sortiert nach priorityRank
}> => { … }

/**
 * Send conflict notification email to selected recipients.
 * Wraps sendRejectionEmail() with a separate template_id for "info" mails.
 */
const sendConflictMail = async (draft: ConflictMailDraft) => {
  const personIds = draft.recipients
    .filter(r => r.selected && r.email)
    .map(r => r.personId)

  return sendRejectionEmail(
    personIds,
    draft.subject,
    draft.bodyHtml,
    draft.templateId ?? 11   // ggf. anderes Template ID für "Info"
  )
}
```

`sendRejectionEmail` ist generisch genug (POST an `/index.php?q=churchdb/ajax`,
`func=sendEMailToPersonIds`) und wird einfach unter passenderem Namen
re-exportiert (oder umbenannt zu `sendBookingMail`).

> ⚠️ **Hinweis zur API-Wahl**
> Die offizielle ChurchTools-REST-API bietet **keinen** generischen Endpoint
> "Mail an Person-IDs senden". Existierende Mail-Endpoints sind alle
> kontextgebunden:
>
> - `POST /agendas/send` – nur mit `eventIds`
> - `POST /events/send` – nur Event-Einladungen
> - `POST /groups/{id}/emails` – nur Konfiguration automatischer Gruppen-Mails
> - `POST /publicgroups/{id}/mailToLeaders` – nur an Gruppenleiter
>
> Daher nutzen wir – wie schon bei der Ablehnungsmail – den
> **Legacy-AJAX-Endpoint** `/index.php?q=churchdb/ajax` mit
> `func=sendEMailToPersonIds`. Dieser ist nicht in der OpenAPI-Spec
> dokumentiert, funktioniert aber zuverlässig (bestätigt durch
> bestehende `sendRejectionEmail()`-Implementierung).
>
> **Risiko**: Bei einem Major-Release von ChurchTools könnte dieser
> Endpoint entfernt oder geändert werden. Mittelfristig sollte mit
> ChurchTools geklärt werden, ob ein offizieller `POST /messages`
> oder `POST /persons/email` geplant ist.

### 7.3 Ablauf (Sequenz)

```diagram
 Admin           ConflictDetailsModal     ConflictMailModal     useRoomBookings        CT-API
   │                     │                        │                    │                  │
   │  Klick "📧"         │                        │                    │                  │
   │────────────────────▶│                        │                    │                  │
   │                     │  open(booking)         │                    │                  │
   │                     │───────────────────────▶│                    │                  │
   │                     │                        │ collectConflict-   │                  │
   │                     │                        │  Recipients()      │                  │
   │                     │                        │───────────────────▶│                  │
   │                     │                        │                    │ resolveConflict- │
   │                     │                        │                    │  Creator(id) ×N  │
   │                     │                        │                    │─────────────────▶│
   │                     │                        │                    │◀─────────────────│
   │                     │                        │◀───────────────────│                  │
   │                     │                        │ render template    │                  │
   │  bearbeitet,        │                        │                    │                  │
   │  Klick "📨 Senden"  │                        │                    │                  │
   │────────────────────────────────────────────▶│                    │                  │
   │                     │                        │ sendConflictMail() │                  │
   │                     │                        │───────────────────▶│                  │
   │                     │                        │                    │ POST .../ajax    │
   │                     │                        │                    │─────────────────▶│
   │                     │                        │                    │◀─────────────────│
   │                     │                        │◀───────────────────│                  │
   │                     │                        │ toast + close      │                  │
```

### 7.4 Validierung & UX-Details

- Mindestens **1 Empfänger mit E-Mail** muss ausgewählt sein.
- Betreff darf nicht leer sein (max. 200 Zeichen, an CT-Limits anlehnen).
- Body wird als HTML gesendet. Plaintext-Newlines → `<br>` beim Übergang
  an `sendRejectionEmail`.
- Bei `bccSelf=true`: aktuelle User-ID via `churchtoolsClient.get('/whoami')`
  einmalig laden und der `personIds`-Liste hinzufügen.
- Loading-State sperrt Senden-Button + Footer.
- Fehler-Handling: API-Fehler werden im Modal als Banner angezeigt,
  Modal bleibt offen (Eingaben gehen nicht verloren).

### 7.5 Tracking / Audit (optional, Phase 2)

- Bei Versand wird in `booking.description` (oder über einen
  separaten Notiz-Endpoint, falls verfügbar) ein Log-Eintrag ergänzt:
  `2026-04-30 14:22 – Konflikt-Mail versendet an: Max M., Erika B.`
- So bleibt nachvollziehbar, wann welche Beteiligten kontaktiert wurden.

---

## 8. Akzeptanzkriterien

- [ ] Im Konflikt-Modal existiert Button "📧 Beteiligte informieren".
- [ ] Klick öffnet `ConflictMailModal` mit vorgefüllter Empfängerliste:
  - [ ] Anfragesteller (+ ggf. i.A.)
  - [ ] Alle Konflikt-Ersteller (+ ggf. i.A.)
  - [ ] Personen ohne E-Mail sind disabled.
  - [ ] Duplikate (gleiche personId) werden zusammengefasst.
- [ ] **Priorität nach "first come, first served"** ist sichtbar:
  - [ ] Empfängerliste ist nach `priorityRank` sortiert (Vorrang oben).
  - [ ] Vorrang-Bucher sind mit 🥇/🥈/🥉 markiert, Anfragesteller mit ⚠️.
  - [ ] Begründung der Reihenfolge (Status / Datum) wird angezeigt.
- [ ] Mindestens eine Vorlage ("Klärung mit Priorität") ist verfügbar.
- [ ] Default-Mail-Body benennt Vorrang-Buchung(en) und neue Anfrage
      explizit getrennt und nennt das Prinzip "first come, first served".
- [ ] Betreff & Body können editiert werden.
- [ ] Versand schlägt fehl bei 0 Empfängern oder leerem Betreff.
- [ ] Erfolgreicher Versand zeigt Toast und schließt Modal.
- [ ] Fehler beim Versand bleiben sichtbar, Eingaben bleiben erhalten.
- [ ] BCC-an-Admin-Option funktioniert.
- [ ] `npm run lint` ist clean.

---

## 9. Offene Fragen

1. **Template-ID 11**: Welche `template_id` ist im CT-Backend für "Info-Mail"
   geeignet (vs. Ablehnungsmail)? → mit Stakeholder klären.
2. **Reply-Behavior**: Sollen alle Empfänger per "Allen antworten"
   gemeinsam diskutieren können (To: vs. Cc)?
3. **i.A.-Personen**: Standardmäßig mit eingeschlossen oder erst auf
   Wunsch (Checkbox unchecked)?
4. **Direktlinks** in der Mail: Welche URL ist für den Endnutzer am
   sinnvollsten – Kalender-Editor, Resource-Booking-Übersicht, oder
   reine Detailseite?
5. **Audit-Trail**: Reicht ein Vermerk im `description`-Feld, oder
   benötigen wir einen eigenen `bookingNotes`-Endpoint?
6. **`createdAt`-Verfügbarkeit**: Liefert die `/bookings`-API ein
   verlässliches Erstellungsdatum? Falls nein → Fallback auf
   `statusId` + `bookingId` als Tie-Breaker.

---

## 10. Nächste Schritte

1. [ ] Konzept reviewen, offene Fragen klären (insb. `createdAt`)
2. [ ] `computePriorityRank()` + `buildConflictParties()` in
       `useRoomBookings.ts` implementieren
3. [ ] `conflictMailTemplates.ts` mit Default-Vorlagen anlegen
4. [ ] `collectConflictRecipients()` in `useRoomBookings.ts` ergänzen
5. [ ] `ConflictMailModal.vue` implementieren (mit Priority-Sortierung)
6. [ ] Integration im `ConflictDetailsModal` (Button + Event)
7. [ ] Manuelle Tests mit echten Konfliktbuchungen
8. [ ] Optional: Einzelversand-Button in `BookingDetails.vue`
