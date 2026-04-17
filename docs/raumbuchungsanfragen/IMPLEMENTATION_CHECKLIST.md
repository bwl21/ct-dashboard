# Implementation Checklist - Raumbuchungsanfragen

## ✅ Umgesetzt

- [x] Dashboard Card mit Statistiken
- [x] Admin Panel mit AdminTable
- [x] Zeilen-Auswahl (Checkboxes)
- [x] Bulk Approve / Bulk Reject
- [x] Einzelne Approval/Rejection mit Modal
- [x] Konflikt-Anzeige (Badge ⚠️)
- [x] Freitext-Suche
- [x] Sortierbare Spalten
- [x] Filterung nach Konflikt-Status (mit/ohne)
- [x] Filterung nach Booking-Status (PENDING/APPROVED/CANCELED)
- [x] Konflikte laden & anzeigen
- [x] E-Mail-Versand bei Ablehnung (mit Konflikt-Infos)
- [x] Detailansicht (RoomBookingDetailsModal)

## ❌ Noch zu implementieren (Optional / Low Priority)

### 1. ~~Detailansicht~~ (HIGH PRIORITY) ✅

**Anforderung 3.1**: Detailansicht für jede Anfrage

- [x] Modal/Panel mit vollständigen Buchungsdetails
- [x] Konflikt-Liste mit Details in Modal
- [x] Bemerkungen-Feld anzeigen
- [x] Trigger: Click auf Zeile oder dedizierter "Details" Button (ℹ️ Button)
- [x] Größe: Responsive Modal (max 700px)

**Komponenten:**

- [x] RoomBookingDetailsModal.vue Component
- [x] "Info" Button (ℹ️) in Actions Spalte
- [x] Status Badge, Detail Grid, Conflict Section

### 2. ~~Zusätzliche Filter~~ (MEDIUM PRIORITY) ✅

**Anforderung 1.2**: Filterung nach Datum & Raum

- [x] Filter nach Raum/Ressource (Dropdown mit verfügbaren Resources)
- [x] Filter nach Datum (Von/Bis Datepicker mit HTML5 date input)
- [x] Beide in den `<template #filters>` Slot integriert
- [ ] Ggfs. Speichern von Filter-Präferenzen (localStorage)

**Komponenten:**

- [x] Room-Select Filter in `<template #filters>` (mit resourcesWithBookings)
- [x] Date Range Picker (Von/Bis) mit HTML5 date input
- [x] Filter-Logik in useRoomBookings.ts (dateFrom, dateTo, resourceIds)

### 3. ~~Delete-Operation~~ (MEDIUM PRIORITY) ✅

**Anforderung 3.3**: Bulk Delete + Single Delete

- [x] Delete Button in Actions (nur für Status REJECTED/CANCELED)
- [x] Single Delete mit Konfirmations-Modal
- [x] Bulk Delete für mehrere Bookings (über RoomBookingsAdmin UI)
- [x] API: PUT `/bookings/{bookingId}` mit statusId 99 (soft delete)
- [x] Nur aktiviert für Status: REJECTED/CANCELED (nicht PENDING)
- [x] Soft-Delete (statusId 99) statt physischem Delete

**Komponenten:**

- [x] Delete Konfirmations-Modal in RoomBookingsAdmin.vue
- [x] `deleteBooking(id)` und `bulkDelete(ids)` Methoden in useRoomBookings.ts
- [x] Delete Button (🗑️) in Actions, nur für non-PENDING Status enabled

### 4. ~~Konflikt-Details Modal~~ (MEDIUM PRIORITY) ✅

**Anforderung 2**: Zeige Konflikt-Details in eigenem Modal

- [x] Klick auf Konflikt-Badge (⚠️) → Modal mit:
  - [x] Liste der konfligierenden Buchungen
  - [x] Verantwortliche Personen (werden asynchron geladen)
  - [x] Zeiten/Daten der Konflikte
- [x] Optional: Auflösungs-Hinweise (Info-Box mit Hinweis)

**Komponenten:**

- [x] ConflictDetailsModal.vue Component
- [x] Klick-Handler in RoomBookingsAdmin.vue
- [x] Details-Daten aus Booking.conflicts Array
- [x] Asynchrones Laden der Creator-Informationen

### 5. Erweiterte E-Mail-Templates (LOW PRIORITY)

**Anforderung 4**: Bessere E-Mail-Formatierung

- [ ] Separate Template-Funktionen für:
  - [ ] Approval-Email (bei Genehmigung)
  - [ ] Standard Reject Email
  - [ ] Reject with Conflicts Email
- [ ] HTML-Templates mit Links zur Buchung
- [ ] Alternativ-Zeiten Vorschlag (optional)
- [ ] Design: Corporate-Identity Logo/Farben

**Komponenten:**

- Email-Template Funktionen in useRoomBookings.ts
- Separate EmailTemplates.ts mit HTML-Vorlagen
- Dynamic Link zum Kalender-Eintrag (wenn möglich)

### 6. Ressourcen-Filter in Card (LOW PRIORITY)

**Anforderung 1.2**: "Nur Räume/Ressourcen anzeigen, für die offene Anfragen existieren"

- [ ] In RoomBookingsCard: Filter nach verfügbaren Ressourcen
- [ ] Oder: Automatisch nur Ressourcen laden, die Pending Bookings haben
- [ ] Card-Statistik: "4 Räume mit offenen Anfragen"

---

## 📊 Priorität nach Anforderungsdokument

### Phase 1 (CRITICAL - MVP) ✅ COMPLETED

1. ✅ Konflikte-Anzeige
2. ✅ Bulk-Operationen
3. ✅ Detailansicht
4. ✅ Filter (Datum, Raum)

### Phase 2 (IMPORTANT) ✅ COMPLETED

5. ✅ Konflikt-Details Modal
6. ✅ Delete-Operation
7. ✅ E-Mail-Templates (Basic)

### Phase 3 (NICE-TO-HAVE) - Low Priority

8. ⬜ Ressourcen-Filter (localStorage)
9. ⬜ Erweiterte E-Mail-Templates
10. ⬜ Kalender-Integration

---

## 🚀 Implementation Order

1. **Detailansicht** (HIGH)
   - Time: ~2-3 Stunden
   - Blockt: Weitere Features
   - Komponenten: RoomBookingDetailsModal.vue

2. **Zusätzliche Filter** (MEDIUM)
   - Time: ~1-2 Stunden
   - Dependencies: Detailansicht (optional)
   - Komponenten: Filter UI + Filter-Logik

3. **Delete-Operation** (MEDIUM)
   - Time: ~1 Stunde
   - Dependencies: Keine
   - Komponenten: Delete-Modal + API-Call

4. **Konflikt-Details Modal** (MEDIUM)
   - Time: ~1-2 Stunden
   - Dependencies: Keine
   - Komponenten: ConflictDetailsModal.vue

5. **E-Mail-Templates** (LOW)
   - Time: ~1-2 Stunden
   - Dependencies: Keine (nur UX-Verbesserung)
   - Komponenten: EmailTemplates.ts

---

## 📋 Test-Checkliste (für jede Phase)

### Phase 1 - Detailansicht

- [ ] Modal öffnet sich beim Klick auf Zeile / Info-Button
- [ ] Alle Buchungs-Detials werden angezeigt
- [ ] Konflikte werden in der Detailansicht angezeigt
- [ ] Modal ist responsive (Mobile/Tablet)
- [ ] Schließen-Button funktioniert

### Phase 2 - Filter

- [ ] Raum-Filter funktioniert
- [ ] Datum-Filter funktioniert
- [ ] Filter können kombiniert werden
- [ ] Select All mit Filtern funktioniert korrekt

### Phase 3 - Delete

- [ ] Delete nur für rejected/canceled Status aktiv
- [ ] Konfirmations-Modal erscheint
- [ ] Single Delete funktioniert
- [ ] Bulk Delete funktioniert
- [ ] Feedback-Toast nach erfolgreichem Delete

### Phase 4 - Konflikt-Details

- [ ] Klick auf Badge öffnet Modal
- [ ] Konflikt-Details sind vollständig
- [ ] Modal ist korrekt formatiert

### Phase 5 - E-Mail-Templates

- [ ] Approval-Mail wird korrekt formatiert
- [ ] Reject-Mail mit Grund
- [ ] Reject-Mail mit Konflikt-Info
- [ ] Links funktionieren

---

## 🔗 Related Issues & PRs

- Branch: `feature/room-bookings`
- API: See [API_ANALYSE.md](./API_ANALYSE.md)
- Requirements: See [ANFORDERUNG.md](./ANFORDERUNG.md)

---

**Status**: ✅ MVP COMPLETE - All Critical & Important Features Implemented  
**Last Updated**: 2026-04-17  
**Remaining**: Optional/Nice-to-have features (localStorage, templates, calendar integration)
