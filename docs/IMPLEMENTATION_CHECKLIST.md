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

## ❌ Noch zu implementieren

### 1. Detailansicht (HIGH)

**Anforderung 3.1**: Detailansicht für jede Anfrage

- Modal/Panel mit vollständigen Buchungsdetails
- Konflikt-Liste mit Details
- Bemerkungen-Feld anzeigen
- Trigger: Click auf Zeile oder dedizierter "Details" Button

### 2. Zusätzliche Filter (MEDIUM)

**Anforderung 1.2**: Filterung nach Datum & Raum

- Filter nach Raum/Ressource (Dropdown)
- Filter nach Datum (Von/Bis oder "Diese Woche", "Nächste Woche")
- Beide in den `<template #filters>` Slot integrieren

### 3. Delete-Operation (MEDIUM)

**Anforderung 3.3**: Bulk Delete + Single Delete

- Delete Button in Actions
- Konfirmations-Modal
- API: DELETE `/bookings/{bookingId}` (oder Status 99)
- Nur für Status: REJECTED/CANCELED (nicht PENDING)

### 4. Konflikt-Details Modal (MEDIUM)

**Anforderung 2**: Zeige Konflikt-Details in eigenem Modal

- Klick auf Konflikt-Badge → Modal mit:
  - Liste der konfligierenden Buchungen
  - Verantwortliche Personen
  - Zeiten/Daten
- Ggfs. auch Auflösung angeboten (z.B. "Verschieben" Link)

### 5. Erweiterte E-Mail-Templates (LOW)

**Anforderung 4**: Bessere E-Mail-Formatierung

- Separate Template-Funktionen für:
  - Approval-Email (bei Genehmigung)
  - Standard Reject Email
  - Reject with Conflicts Email
- HTML-Templates mit Links zur Buchung
- Alternativ-Zeiten Vorschlag (optional)

### 6. Ressourcen-Filter in Card (LOW)

**Anforderung 1.2**: "Nur Räume/Ressourcen anzeigen, für die offene Anfragen existieren"

- In RoomBookingsCard: Filter nach verfügbaren Ressourcen
- Oder: Automatisch nur Ressourcen laden, die Pending Bookings haben

---

## Priorität nach Anforderungsdokument

### Phase 1 (CRITICAL)

1. ✅ Konflikte-Anzeige
2. ✅ Bulk-Operationen
3. ❌ Detailansicht
4. ❌ Filter (Datum, Raum)

### Phase 2 (IMPORTANT)

5. ❌ Konflikt-Details Modal
6. ❌ Delete-Operation
7. ❌ E-Mail-Templates

### Phase 3 (NICE-TO-HAVE)

8. ❌ Ressourcen-Filter
9. ❌ Alternativ-Zeiten
10. ❌ Kalender-Integration

---

## Implementation Order

1. **Detailansicht** ← Verhindert weitere Feature-Bugs (Modal-Template)
2. **Zusätzliche Filter** ← Einfach zu implementieren, hochwertige UX
3. **Delete-Operation** ← Bulk-Action ergänzen
4. **Konflikt-Details Modal** ← Für Conflict Resolution
5. **E-Mail-Templates** ← Nice-to-have für User Experience
