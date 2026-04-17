# Changelog

Alle wichtigen Änderungen an diesem Projekt werden in dieser Datei dokumentiert.

Das Format basiert auf [Keep a Changelog](https://keepachangelog.com/de/1.0.0/),
und dieses Projekt folgt [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.1.0] - 2026-04-17

### ✨ Added

- **Room Booking Requests Module** - Complete management interface for ChurchTools room bookings
  - Dashboard card with booking statistics
  - Admin panel with full CRUD operations
  - Booking detail view modal
  - Conflict details modal with creator information
  - Advanced filtering (date range, room, conflict status, booking status)
  - Full-text search across booking fields
  - Sortable columns
  - Bulk operations (approve, reject, delete)
  - Automatic email notifications on rejection
  - Soft-delete support (statusId 99)
  - Recurring series handling with deduplication
  - Conflict detection with time-overlap validation
  - Type-safe TypeScript composable (`useRoomBookings.ts`)
  - Permission integration (`churchresource.administer bookings`)

### 📚 Documentation

- `docs/raumbuchungsanfragen/ANFORDERUNG.md` - Requirements specification
- `docs/raumbuchungsanfragen/API_ANALYSE.md` - API analysis and integration patterns
- `docs/raumbuchungsanfragen/IMPLEMENTATION_CHECKLIST.md` - Feature checklist
- `docs/raumbuchungsanfragen/COMPLETION_SUMMARY.md` - Implementation summary

## [1.0.5] - 2025-09-26

### 🐛 Fixed

- **Issue #7: Card Button Layout Shifts** - Buttons no longer jump from left to right during loading states
- **Stable Loading States** - Added placeholder text to prevent footer layout shifts
- **Cross-Browser Compatibility** - Fixed button positioning across all supported browsers

### ✨ Added

- **Comprehensive Testing Suite** - Playwright tests with tag-based organization
- **Visual Regression Testing** - Pixel-accurate button position verification
- **Test Categories** - `@smoke`, `@layout`, `@issue7`, `@responsive`, `@interaction` tags
- **Test Scripts** - Easy test execution with `npm run test:smoke`, `test:layout`, etc.
- **Test Report Server** - `npm run test:report` for viewing test results

### 🔄 Changed

- **Button Positioning** - Simplified CSS approach using `margin-left: auto`
- **Loading Text** - Consistent placeholder text across all card states
- **Test Organization** - Tag-based system for better test management
- **Documentation** - Updated with Issue #7 fix and testing information

### 📚 Documentation

- **Session Documentation** - Comprehensive Issue #7 development session
- **Testing Guide** - Complete testing strategy and commands
- **Lessons Learned** - Key insights from Issue #7 resolution

## [1.0.4] - 2025-09-24

### ✨ Added

- **Priority-basierte Log-Kategorisierung** mit intelligenter Konfliktauflösung
- **Funktionale Filter-Bedingungen** (messageIncludes, domainTypeIs, and, or)
- **Zentrale UI-Konfiguration** für Log-Kategorien (Icons, Labels, CSS-Klassen)
- **Akteur-Informationen** in Log-Details Modal
- **Simulation-Support** für simulatePersonId Anzeige
- **Automatische Filter-Generierung** aus Kategorisierungs-Regeln

### 🔄 Changed

- **Log-Kategorisierung** von if-else Kette zu rule-basiertem System
- **UI-Mappings** zentralisiert statt verteilt in Komponenten
- **Button-Terminologie** standardisiert: "Details" statt "Details anzeigen"
- **Login-Fehler Terminologie** konsolidiert: "Login-Fehler" statt "Falsche Passwörter"
- **Modal z-index** erhöht für bessere Overlay-Darstellung

### 🐛 Fixed

- **Modal-Overlay** deckt jetzt vollständig das Admin Panel ab
- **Überlappende Log-Kategorien** durch Priority-System gelöst
- **String-Duplikation** eliminiert durch LogCategory-Konstanten
- **ChurchTools API Kompatibilität** für simulatePersonId (OpenAPI-Spec Typo dokumentiert)

### 🔧 Technical Improvements

- **TypeScript-Typsicherheit** durch LogCategory-Konstanten
- **Testbarkeit** durch isolierte Kategorisierungs-Regeln
- **Erweiterbarkeit** durch einfaches Hinzufügen neuer Regeln
- **Debugging-Support** für Entwicklungsumgebung
- **Code-Wartbarkeit** durch zentrale Konfiguration

## [1.0.3] - 2025-09-24

### ✨ Added

- **Logger System** mit kategorie-basierter Klassifizierung
- **Neue Kategorie** "Personen angesehen" für getPersonDetails Logs
- **BaseCard System** mit großen Icon-Headern (60x60px)
- **Vorberechnete Kartenhöhen** für konsistentes Layout ohne Layout-Sprünge
- **AdminTable Scrolling** mit 60vh Container und sticky Headers
- **Umfassende Dokumentation** für UI-Verbesserungen
- **Ona KI-Assistent** Erwähnung in README.md

### 🔄 Changed

- **BaseCard Design** komplett überarbeitet mit großen Icons und vertikalem Layout
- **AdminTable Scrolling** - nur Tabelle scrollt, Filter bleiben sichtbar
- **Logger Action Buttons** standardisiert mit ct-btn Klassen
- **README.md** strukturiert und gekürzt für bessere Übersichtlichkeit
- **DEPLOYMENT.md** deutlich kompakter und fokussierter
- **Konsistente Button-Styling** über alle Komponenten

### 🐛 Fixed

- **Sticky Table Headers** funktionieren jetzt für alle Spalten (nicht nur "Aktionen")
- **Layout-Sprünge** beim Laden von Karten durch vorberechnete Höhen eliminiert
- **Kategorie-basierte Icons** im Logger statt Level-basiert
- **Table Layout** von 'fixed' zu 'auto' für bessere Sticky-Kompatibilität
- **Console.log Cleanup** projekt-weit bereinigt
- **Titel und Count Spacing** in BaseCard optimiert

### 🔒 Security

- **Vertrauliche Informationen** vollständig aus Repository entfernt
- **Dokumentation** bereinigt und sicher neu erstellt
- **Remote Repository** von sensiblen Daten bereinigt

## [1.0.0] - 2025-09-20

### 🎉 Erste stabile Version

#### ✨ Neue Features

**📅 auslaufende Terminserien**

- Zentrale Übersicht aller auslaufenden Terminserien
- Detailliertes Admin-Panel mit erweiterten Filtermöglichkeiten
- Multi-Filter-System (Suche, Kalender, Status, Zeitraum)
- Sortierbare Tabelle mit allen relevanten Spalten
- Direkte Links zu ChurchTools-Kalenderansicht
- Unterstützung für manuelle Wiederholungen (additionals)

**⚙️ Automatische Gruppen**

- Status-Übersicht aller automatischen Gruppen
- Monitoring von Ausführungsstatus (Erfolg, Fehler, Ausstehend)
- Anzeige der letzten Aktualisierungszeiten
- Statistiken über Gruppenverwaltung

**🎯 BaseCard-Architektur**

- Einheitliche Karten-Komponente für konsistentes Design
- Wiederverwendbare UI-Patterns
- Unterstützung für Props und Slots
- Standardisierte Loading-, Error- und Success-States

#### 🔧 Technische Verbesserungen

**Frontend-Architektur**

- Vue 3 + TypeScript für moderne Entwicklung
- Vite als Build-Tool für schnelle Entwicklung
- ChurchTools Client Integration
- Responsive Design für Desktop und Mobile

**Filter & Sortierung**

- Echtzeit-Filterung ohne Server-Roundtrips
- Kombinierbare Filter für präzise Suchen
- Sortierung aller Tabellenspalten
- Intelligente Datentyp-Erkennung für Sortierung

**Performance**

- Client-seitige Datenverarbeitung
- Optimierte Bundle-Größe
- Lazy Loading für große Datensätze
- Effiziente State-Management

#### 🎨 Design System

**UI/UX**

- ChurchTools-konformes Design
- Konsistente Farbpalette und Typografie
- Intuitive Benutzerführung
- Accessibility-Features

**Responsive Layout**

- Mobile-first Ansatz
- Flexible Grid-Layouts
- Touch-optimierte Bedienelemente
- Adaptive Spaltenbreiten

#### 📊 Datenmanagement

**API-Integration**

- Vollständige ChurchTools API-Anbindung
- Automatische Authentifizierung
- Error-Handling und Retry-Logik
- Typisierte API-Responses

**Datenverarbeitung**

- Intelligente Kalender-Erkennung
- Automatische Status-Bestimmung
- Effektive Enddatum-Berechnung
- Robuste Fehlerbehandlung

### 🔧 Entwickler-Features

#### Architektur

- Modulare Komponenten-Struktur
- TypeScript für Type-Safety
- Comprehensive Error Handling
- Extensive Documentation

#### Build & Deployment

- Automatisches Packaging für ChurchTools
- Versionierte Releases
- Development und Production Builds
- ZIP-basierte Distribution

#### Testing & Quality

- ESLint für Code-Qualität
- TypeScript Strict Mode
- Comprehensive Error Boundaries
- Performance Monitoring

### 📚 Dokumentation

#### Benutzer-Dokumentation

- Vollständige README mit Setup-Anleitung
- Feature-Übersicht und Screenshots
- Deployment-Anleitung für ChurchTools

#### Entwickler-Dokumentation

- API-Dokumentation mit TypeScript-Interfaces
- Komponenten-Architektur-Guide
- Entwicklungsrichtlinien
- Deployment-Prozess

#### Beispiele

- BaseCard-Implementierungsbeispiele
- Filter-System-Patterns
- API-Integration-Beispiele

### 🚀 Deployment

#### ChurchTools-Integration

- Plugin-Kürzel: `ctdashboard`
- Base URL: `/ccm/ctdashboard/`
- Automatische Session-Authentifizierung

#### Build-Optimierung

- Minimierte Bundle-Größe
- Tree-Shaking für ungenutzten Code
- Optimierte Asset-Komprimierung
- Source-Map-freie Production-Builds

---

## Geplante Features (Roadmap)

### 🔮 Version 1.1.0

- **Export-Funktionen**: CSV/Excel-Export für Tabellendaten
- **Erweiterte Filter**: Datum-Range-Picker, Multi-Select-Filter
- **Benachrichtigungen**: E-Mail-Alerts für kritische Termine
- **Dashboard-Widgets**: Konfigurierbare Übersichts-Widgets

### 🔮 Version 1.2.0

- **Benutzer-Management**: User-spezifische Dashboards
- **Reporting**: Automatische Reports und Statistiken
- **API-Erweiterungen**: Zusätzliche ChurchTools-Endpunkte
- **Performance**: Virtual Scrolling für große Datensätze

### 🔮 Version 2.0.0

- **Real-time Updates**: WebSocket-basierte Live-Updates
- **Mobile App**: Progressive Web App (PWA)
- **Erweiterte Analytics**: Detaillierte Nutzungsstatistiken
- **Plugin-System**: Erweiterbare Architektur für Custom-Module

---

## Support & Feedback

- **GitHub Issues**: [Repository Issues](https://github.com/ihr-username/ct-dashboard/issues)
- **ChurchTools Forum**: [Community Support](https://forum.church.tools)
- **Dokumentation**: [Vollständige Docs](./docs/)

---

**Entwickelt für ChurchTools** - Die moderne Gemeindeverwaltung
