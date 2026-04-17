# 🛏️ Raumbuchungsanfragen - Dokumentation

Zentrale Dokumentation für die Raumbuchungsanfragen-Verwaltung im ChurchTools Dashboard.

## 📚 Dokumente

### [ANFORDERUNG.md](./ANFORDERUNG.md)

**Anforderungsdokument** - Vollständige Spezifikation aller Features

- Motivation & Probleme
- Funktionale Anforderungen
- Akzeptanzkriterien
- Datenmodelle

### [API_ANALYSE.md](./API_ANALYSE.md)

**Technische Analyse** - ChurchTools API Integration

- Verifizierte API-Endpoints
- Datenfluss-Diagramme
- E-Mail API (Legacy AJAX)
- Status-IDs und Mapping

### [IMPLEMENTATION_CHECKLIST.md](./IMPLEMENTATION_CHECKLIST.md)

**Umsetzungs-Status** - Was ist implementiert, was fehlt noch

- ✅ Umgesetzte Features
- ❌ Zu implementierende Features
- Prioritätisierung
- Implementation Order

## 🚀 Quick Start

### Modul finden

Im Dashboard: **🛏️ Raumbuchungsanfragen** Card

### Admin-Panel öffnen

Card klicken → Admin Panel mit vollständiger Verwaltung

### Verfügbare Funktionen

**✅ Implementiert:**

- Dashboard Card mit Statistiken
- Konflikt-Anzeige (⚠️ Badge)
- Zeilen-Auswahl (Checkboxes)
- Bulk-Operationen (Genehmigen/Ablehnen)
- Einzelne Ablehnung mit Modal
- Freitext-Suche
- Sortierbare Spalten
- Filterung (Status, Konflikte)
- E-Mail-Versand bei Ablehnung

**❌ In Entwicklung:**

- Detailansicht für Buchungen
- Filter nach Datum & Raum
- Delete-Operation
- Konflikt-Details Modal

## 📊 Komponenten-Struktur

```
src/components/room-bookings/
├── RoomBookingsCard.vue      # Dashboard Overview
├── RoomBookingsAdmin.vue     # Admin Management
└── useRoomBookings.ts        # Business Logic
```

## 🔗 API-Endpoints

**Wichtigste Endpoints:**

- `GET /bookings` - Abrufen mit Filter
- `PUT /bookings/{id}` - Status ändern
- `POST /index.php?q=churchdb/ajax` - E-Mail versenden

Details siehe [API_ANALYSE.md](./API_ANALYSE.md)

## 🎯 Nächste Schritte

Siehe [IMPLEMENTATION_CHECKLIST.md](./IMPLEMENTATION_CHECKLIST.md) für:

- Priorisierte Feature-Liste
- Implementation Order
- Detaillierte Task-Beschreibungen

---

**Branch:** `feature/room-bookings`  
**Status:** Entwicklung in Fortschritt  
**Letzte Aktualisierung:** 2026-04-16
