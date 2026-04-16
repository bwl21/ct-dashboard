# Anforderungsdokument: Raumbuchungsanfragen Management

## 📋 Übersicht

Neue Dashboard-Sektion zur Verwaltung von Raumbuchungsanfragen mit Konflikt-Erkennung und Genehmigungsworkflow.

## 🎯 Funktionale Anforderungen

### 1. Raumbuchungsanfragen Übersicht (Dashboard Card)

- **Anzeige**: Alle offenen Raumbuchungsanfragen
- **Spalten**:
  - Raum / Ressource
  - Datum / Uhrzeit
  - Ersteller / Person (im Auftrag von)
  - Status (offen / wartend)
  - Konflikte (falls vorhanden)
  - Aktionen

- **Filterung**:
  - Nach Status
  - Nach Raum/Ressource
  - Nach Datum
  - Nach Konflikten (nur mit Konflikten / ohne Konflikte / alle)
  - Freitext-Suche (durchsucht: Raum, Ersteller, Person, Bemerkungen)

- **Sortierung**:
  - Spalten sind sortierbar (Klick auf Spalten-Header)
  - Standardsortierung: Datum aufsteigend

### 2. Konflikterkennung

- **Konflikt-Definition**: Überschneidende Buchungen zum gleichen Raum/gleicher Ressource im gleichen Zeitfenster
- **Visuelles Highlighting**: 
  - Zeile mit Konflikt-Indikator (z.B. rotes Icon/Badge)
  - Liste der konfliktierenden Buchungen anzeigen
  - Verantwortliche Person aus konfligierenden Buchungen identifizieren

- **Konflikt-Details**:
  - Welche andere Buchung(en) konfligieren
  - Wer ist die verantwortliche Person (Ersteller/im Auftrag von) der Konflikt-Buchung(en)

### 3. Admin-Panel (Verwaltungsbereich)

- **Detailansicht** für jede Anfrage mit:
  - Vollständige Buchungsdetails
  - Konflikt-Informationen (falls vorhanden)
  - Bemerkungen-Feld

- **Zeilen-Auswahl**:
  - Checkbox in jeder Zeile zur Markierung
  - "Select All" Checkbox im Header (mit Status-Anzeige: "3 von 10 ausgewählt")
  - Toggle Select All auch für gefilterte Liste

- **Individuelle Aktionen** (pro Zeile):
  - ✅ **Bestätigen**: Anfrage akzeptieren, Status → genehmigt
  - ❌ **Ablehnen**: 
    - Bemerkungsfeld (erforderlich)
    - Bestätigungs-Dialog
    - E-Mail-Versand triggern

- **Bulk-Operationen** (für markierte Zeilen):
  - ✅ **Mehrere Anfragen bestätigen**: Alle markierten genehmigen
  - ❌ **Mehrere Anfragen ablehnen**: Dialog mit gemeinsamer Bemerkung oder individuelle Bemerkungen
  - 🗑️ **Löschen**: Markierte Anfragen löschen (nur in bestimmtem Status)
  - Bulk-Aktion wird deaktiviert, wenn keine Zeile markiert ist
  - Erfolgs-Feedback nach Bulk-Operation (z.B. "3 Anfragen genehmigt")

### 4. E-Mail-Benachrichtigungen (bei Ablehnung)

#### Standard-Ablehnung:
- **Empfänger**: 
  - Ersteller der Anfrage
  - Oder: Person "im Auftrag von" (falls angegeben)
  
- **Inhalt**:
  - Raum/Ressource, Datum, Uhrzeit
  - Begründung/Bemerkung vom Admin
  - Optional: Alternativ-Zeiten vorschlagen

#### Ablehnung mit Konflikt:
- **Empfänger**: 
  - Ersteller/Person der abgelehnten Anfrage
  - **PLUS**: Verantwortliche Person(en) aus konfligierenden Buchung(en)
  
- **Inhalt**:
  - Begründung: "Konflikt mit Buchung von [Name]"
  - Details der konfliktierenden Buchung(en)
  - Bemerkung vom Admin

## 🏗️ Technische Struktur

Folgt dem Muster bestehender Module:

```
src/components/room-bookings/
├── RoomBookingsCard.vue          # Dashboard Card
├── RoomBookingsAdmin.vue         # Admin Panel
└── useRoomBookings.ts            # Composable mit API-Logik
```

## 📊 Datenmodelle

### RoomBooking
```typescript
{
  id: string
  room: string
  date: string          // ISO-Date
  startTime: string
  endTime: string
  createdBy: string     // Person-ID
  createdByName: string
  onBehalfOf?: string   // Person-ID (optional)
  onBehalfOfName?: string
  status: 'open' | 'approved' | 'rejected'
  remarks?: string
  conflicts?: ConflictInfo[]
}
```

### ConflictInfo
```typescript
{
  conflictingBookingId: string
  room: string
  date: string
  startTime: string
  endTime: string
  conflictingPerson: string    // Ersteller oder "im Auftrag von"
  conflictingPersonId: string
  conflictingPersonEmail: string
}
```

## 🔌 API-Integration (ChurchTools)

- [TBD] Endpoint für Raumbuchungsanfragen abrufen
- [TBD] Endpoint für Raumbuchung akzeptieren
- [TBD] Endpoint für Raumbuchung ablehnen
- [TBD] E-Mail-Service Integration (bestehend oder neu)

## 🎨 UI/UX

- Nutze **BaseCard** für Dashboard-Ansicht
- Nutze **AdminTable** für Admin-Panel (nach Muster Tags/AutomaticGroups)
- ChurchTools Design Classes (ct-btn, ct-card, ct-select, ct-modal)
- Konflikt-Highlighting: Rot/Orange Badge oder Icon

## ✅ Akzeptanzkriterien

### Grundfunktionalität
- [ ] Dashboard zeigt alle offenen Raumbuchungsanfragen
- [ ] Konflikte werden erkannt und angezeigt

### Filterung & Sortierung
- [ ] Filterung nach Status funktioniert
- [ ] Filterung nach Raum/Ressource funktioniert
- [ ] Filterung nach Datum funktioniert
- [ ] Filterung nach Konflikten (mit/ohne) funktioniert
- [ ] Freitext-Suche durchsucht alle relevanten Felder
- [ ] Spalten sind sortierbar
- [ ] Sortierindikatoren sichtbar (Pfeil im Header)

### Zeilen-Auswahl & Bulk-Operationen
- [ ] Checkboxes in jeder Zeile funktionieren
- [ ] Select All Checkbox wählt/deselektiert alle Zeilen
- [ ] Select All Checkbox arbeitet mit gefilterten Daten
- [ ] Anzeige: "X von Y ausgewählt" ist korrekt
- [ ] Bulk-Buttons nur aktiv, wenn Zeilen markiert sind
- [ ] Bulk Bestätigung funktioniert
- [ ] Bulk Ablehnung funktioniert
- [ ] Erfolgs-Feedback nach Bulk-Operation angezeigt

### Individuelle Aktionen
- [ ] Admin kann einzelne Anfrage bestätigen
- [ ] Admin kann einzelne Anfrage mit Bemerkung ablehnen
- [ ] Bestätigungs-Dialog vor kritischen Aktionen

### E-Mail-Versand
- [ ] E-Mail wird an korrekten Empfänger versandt
- [ ] E-Mail enthält vollständige Informationen
- [ ] Konflikt-Info ist in E-Mail enthalten (falls zutreffend)

### Code-Qualität
- [ ] Komponenten folgen bestehendem Design-Pattern (BaseCard, AdminTable)
- [ ] TypeScript korrekt typisiert
- [ ] Code lässt sich mit `npm run lint` prüfen
- [ ] Keine Warnings/Errors beim Build

## 📝 Nächste Schritte

1. [x] Anforderungsdokument erstellen
2. [ ] Verfeinern & Clarification mit Stakeholder
3. [ ] ChurchTools API-Endpoints identifizieren
4. [ ] E-Mail-Template definieren
5. [ ] Module implementieren
6. [ ] Testen

---

**Status**: Entwurf  
**Erstellt**: 2026-04-16  
**Letzte Änderung**: 2026-04-16
