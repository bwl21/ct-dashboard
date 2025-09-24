# ChurchTools Dashboard

Eine moderne ChurchTools-Erweiterung für Systemüberwachung und Verwaltung.

## 🎯 Überblick

Das **ChurchTools Dashboard** ist eine Vue 3 + TypeScript basierte Erweiterung, die eine zentrale Übersicht über wichtige ChurchTools-Systemdaten bietet. Die Extension nutzt eine moderne BaseCard-Architektur für konsistente und wiederverwendbare UI-Komponenten.

**Plugin-Kürzel:** `ctdashboard`

## ✨ Hauptfeatures

### 📅 Auslaufende Terminserien
- Übersicht aller auslaufenden Terminserien
- Admin-Panel mit erweiterten Filtermöglichkeiten
- Direkte Links zu ChurchTools-Kalenderansicht

### ⚙️ Automatische Gruppen
- Status-Übersicht aller automatischen Gruppen
- Monitoring von Ausführungsstatus und Fehlern
- Statistiken über Gruppenaktualisierungen

### 🏷️ Tags-Verwaltung
- Übersicht aller ChurchTools-Tags
- Bulk-Operationen (Farbe ändern, löschen)
- ColorPicker mit ChurchTools-Design
- Toast-Benachrichtigungen

### 📋 Logger System
- Kategorisierte Log-Übersicht
- Admin-Panel mit Filterung und Suche
- Modal-Details für Log-Einträge
- Kategorie-basierte Klassifizierung

### 🎯 BaseCard-System
- Einheitliche Karten-Layouts
- Große Icon-Header
- Vorberechnete Kartenhöhen
- Responsive Design

## 🚀 Quick Start

### Voraussetzungen
- Node.js 18+
- ChurchTools-Installation
- Git

### Installation

```bash
# Repository klonen
git clone <repository-url>
cd ct-dashboard

# Abhängigkeiten installieren
npm install

# Entwicklungsserver starten
npm run dev
```

### Deployment

```bash
# Build und Package erstellen
npm run deploy

# ZIP-Datei in ChurchTools hochladen
# releases/churchtools-dashboard-v*.zip
```

## 🔧 Technologie-Stack

| Komponente | Technologie | Version |
|------------|-------------|---------|
| Frontend | Vue 3 | ^3.4.0 |
| Language | TypeScript | ^5.0.0 |
| Build Tool | Vite | ^5.0.0 |
| API Client | ChurchTools Client | ^1.0.0 |
| Styling | CSS3 + ChurchTools Design | - |

## 📚 Dokumentation

### Für Entwickler
- **[DEVELOPMENT.md](docs/DEVELOPMENT.md)** - Entwickler-Handbuch und Architektur
- **[API.md](docs/API.md)** - API-Dokumentation und Interfaces
- **[DEPLOYMENT.md](docs/DEPLOYMENT.md)** - Build- und Deployment-Prozess

### Session-Dokumentation
- **[Logger UI Improvements](docs/DEVELOPMENT_SESSION_2025-09-24_Logger_UI_Improvements.md)** - Aktuelle UI-Verbesserungen
- **[Tags & ColorPicker](docs/FEATURES_TAGS_COLORPICKER_TOAST.md)** - Tags-Verwaltung Features
- **[AdminTable Configuration](docs/AdminTable_Column_Width_Configuration.md)** - Tabellen-Konfiguration

### Vollständige Übersicht
- **[docs/README.md](docs/README.md)** - Komplette Dokumentations-Übersicht

## 🎨 Design-Prinzipien

- **Konsistenz:** Einheitliche BaseCard-Architektur
- **ChurchTools-konform:** Natives Design-System
- **Responsive:** Mobile-first Ansatz
- **Performance:** Optimierte Bundle-Größe
- **Accessibility:** WCAG-konforme Implementierung

## 📊 Status

| Feature | Status | Dokumentation |
|---------|--------|---------------|
| Auslaufende Terminserien | ✅ Stabil | [API.md](docs/API.md) |
| Automatische Gruppen | ✅ Stabil | [API.md](docs/API.md) |
| Tags-Verwaltung | ✅ Stabil | [Features](docs/FEATURES_TAGS_COLORPICKER_TOAST.md) |
| Logger System | ✅ Stabil | [Session](docs/DEVELOPMENT_SESSION_2025-09-24_Logger_UI_Improvements.md) |
| BaseCard-System | ✅ Stabil | [Development](docs/DEVELOPMENT.md) |

## 🤝 Beitragen

1. Fork des Repositories erstellen
2. Feature-Branch erstellen (`git checkout -b feature/amazing-feature`)
3. Änderungen committen (`git commit -m 'Add amazing feature'`)
4. Branch pushen (`git push origin feature/amazing-feature`)
5. Pull Request erstellen

## 🤖 Entwickelt mit KI-Unterstützung

Dieses Projekt wurde mit Unterstützung von **Ona** entwickelt - einem KI-Assistenten für Softwareentwicklung. Ona half bei:

- **Architektur-Design** - BaseCard-System und Komponenten-Struktur
- **Code-Implementierung** - Vue 3 + TypeScript Best Practices
- **UI/UX-Verbesserungen** - Responsive Design und Benutzerfreundlichkeit
- **Dokumentation** - Umfassende technische Dokumentation
- **Code-Qualität** - Refactoring und Performance-Optimierungen

Die Kombination aus menschlicher Kreativität und KI-Effizienz ermöglichte eine schnelle und qualitativ hochwertige Entwicklung.

## 📄 Lizenz

Dieses Projekt steht unter der MIT-Lizenz. Siehe [LICENSE](LICENSE) für Details.

## 🔗 Links

- **ChurchTools:** [churchtools.de](https://churchtools.de)
- **Vue 3:** [vuejs.org](https://vuejs.org)
- **TypeScript:** [typescriptlang.org](https://typescriptlang.org)
- **Vite:** [vitejs.dev](https://vitejs.dev)
- **Ona:** [ona.com](https://ona.com) - KI-Assistent für Softwareentwicklung

## 🔄 GitHub Setup

### Repository initialisieren

```bash
# Git Repository initialisieren (falls noch nicht vorhanden)
git init

# Remote Repository hinzufügen
git remote add origin https://github.com/ihr-username/churchtools-dashboard.git

# Erste Commits
git add .
git commit -m "Initial commit: ChurchTools Extension 'Churchtools Dashboard'"
git push -u origin main
```

### Branching-Strategie

- **main** - Produktionsreifer Code
- **develop** - Entwicklungsbranch
- **feature/** - Feature-Branches

## 🧩 Komponenten-Architektur

### BaseCard-System

Die BaseCard-Architektur bietet eine einheitliche Basis für alle Dashboard-Karten:

```vue
<BaseCard
  :title="'Mein Modul'"
  :icon="'🎯'"
  :is-loading="loading"
  :error="error"
  :main-stat="{ value: 42, label: 'Hauptstatistik' }"
  :status-stats="statusStats"
  :last-update="lastUpdate"
  @refresh="refreshData"
  @navigate="navigateToAdmin"
/>
```

**Props:**

- `title` - Titel der Karte
- `icon` - Emoji-Icon für die Karte
- `is-loading` - Loading-Status
- `error` - Fehlermeldung (optional)
- `main-stat` - Hauptstatistik (Wert + Label)
- `status-stats` - Array von Status-Statistiken
- `last-update` - Zeitstempel der letzten Aktualisierung

**Events:**

- `@refresh` - Daten neu laden
- `@navigate` - Navigation zur Detail-Ansicht
- `@retry` - Erneuter Versuch bei Fehlern

### Admin-Panels

#### ExpiringAppointmentsAdmin

**Features:**

- **Multi-Filter-System:** Suche, Kalender-Filter, Status-Filter, Tage-Filter
- **Sortierbare Tabelle:** Alle Spalten (ID, Titel, Kalender, Datum) sortierbar
- **Responsive Design:** Spaltenbreiten per Drag&Drop anpassbar
- **Export-Funktionen:** Direkte Links zu ChurchTools-Kalender

**Filter-Optionen:**

- **Suchfeld:** ID, Titel, Kalender-Name
- **Kalender-Dropdown:** Automatisch aus Daten generiert
- **Status-Filter:** Aktiv, Läuft ab, Abgelaufen
- **Tage-Filter:** 1, 7, 14, 30, 60, 90, 180, 365 Tage oder "alle"

#### AutomaticGroupsAdmin

**Features:**

- **Gruppen-Übersicht:** Alle automatischen Gruppen mit Status
- **Ausführungs-Monitoring:** Erfolg, Fehler, Ausstehend
- **Zeitstempel-Tracking:** Letzte Ausführungszeiten

### Dashboard-Layout

- **Header Card:** Projekt-Titel mit Versionsnummer
- **Module Grid:** Responsive 2x2 Grid für Desktop, 1-spaltig für Mobile
- **Navigation:** Klickbare Karten führen zu Detail-Ansichten

## 📚 Dokumentation

### Vollständige Dokumentation

- **[📋 Dokumentations-Übersicht](./docs/README.md)** - Alle Dokumentationen im Überblick
- **[👨‍💻 Entwickler-Handbuch](./docs/DEVELOPMENT.md)** - Architektur und Entwicklung
- **[🔌 API-Dokumentation](./docs/API.md)** - Interfaces und Datenstrukturen
- **[🚀 Deployment-Guide](./docs/DEPLOYMENT.md)** - Build und Installation
- **[📝 Changelog](./CHANGELOG.md)** - Versionshistorie

### Quick Links

- **BaseCard-Architektur**: [DEVELOPMENT.md#basecard-architektur](./docs/DEVELOPMENT.md#basecard-architektur)
- **Filter-System**: [API.md#filter--sortierung-api](./docs/API.md#filter--sortierung-api)
- **ChurchTools-Integration**: [DEPLOYMENT.md#churchtools-installation](./docs/DEPLOYMENT.md#churchtools-installation)

## 📞 Support

### Dokumentation & Hilfe

- **[📚 Vollständige Dokumentation](./docs/)** - Umfassende Anleitungen
- **[ChurchTools Forum](https://forum.church.tools)** - Community-Support
- **[GitHub Issues](https://github.com/bwl21/ct-dashboard/issues)** - Bug-Reports

### Entwickler-Support

- **[API-Referenz](./docs/API.md)** - Technische Details
- **[Entwickler-Guide](./docs/DEVELOPMENT.md)** - Architektur-Dokumentation
- **[Deployment-Anleitung](./docs/DEPLOYMENT.md)** - Installation und Updates

## 📄 Lizenz

Dieses Projekt steht unter der MIT-Lizenz. Siehe LICENSE-Datei für Details.

---

**Entwickelt für ChurchTools** - Die moderne Gemeindeverwaltung  
**Version:** 1.0.0 | **Dokumentation:** [docs/](./docs/) | **Support:** [GitHub Issues](https://github.com/ihr-username/ct-dashboard/issues)
