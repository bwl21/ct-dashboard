# ChurchTools Dashboard

Eine moderne ChurchTools-Erweiterung für Terminverwaltung und Systemüberwachung.

## 📋 Projektbeschreibung

Das **ChurchTools Dashboard** ist eine Vue 3 + TypeScript basierte Erweiterung für ChurchTools, die eine zentrale Übersicht über wichtige Systemdaten bietet. Die Extension nutzt eine moderne BaseCard-Architektur für konsistente und wiederverwendbare UI-Komponenten.

**Kürzel:** `ctdashboard`

## ✨ Hauptfeatures

### 📅 auslaufende Terminserien

- **Übersicht:** Zentrale Anzeige aller auslaufenden Terminserien
- **Admin-Panel:** Detaillierte Verwaltung mit erweiterten Filtermöglichkeiten
- **Multi-Filter:** Suche nach ID, Titel, Kalender + Status- und Kalender-Filter
- **Sortierung:** Alle Spalten sortierbar (ID, Titel, Kalender, Datum)
- **Export:** Direkte Links zu ChurchTools-Kalenderansicht

### ⚙️ Automatische Gruppen

- **Status-Übersicht:** Anzeige aller automatischen Gruppen mit Ausführungsstatus
- **Statistiken:** Erfolgreiche, fehlerhafte und ausstehende Gruppenaktualisierungen
- **Monitoring:** Letzte Aktualisierungszeiten und Ausführungsstatus

### 🎯 BaseCard-Architektur

- **Konsistentes Design:** Einheitliche Karten-Layouts für alle Module
- **Wiederverwendbar:** Standardisierte Komponenten für schnelle Entwicklung
- **Flexibel:** Unterstützung für Props und Slots für maximale Anpassbarkeit

## 🎨 Design System

Die Extension nutzt das ChurchTools Design System mit folgenden CSS-Klassen:

### Farben

- **Primary:** `#007bff` (ChurchTools Blau)
- **Secondary:** `#2c3e50` (Dunkelgrau)
- **Success:** `#28a745` (Grün)
- **Warning:** `#ffc107` (Gelb)
- **Danger:** `#dc3545` (Rot)

### CSS-Klassen

- `.cts` - Haupt-Container-Klasse
- `.ct-main` - Hauptinhalt-Container
- `.ct-card` - Karten-Layout
- `.ct-card-header` / `.ct-card-body` - Karten-Bereiche
- `.ct-btn` / `.ct-btn-primary` - Button-Styling
- `.ct-navbar` - Navigationsleiste (Development)

## 🚀 Entwicklung

### Voraussetzungen

- Node.js (Version 18 oder höher)
- npm oder yarn
- Git

### Installation

```bash
# Repository klonen
git clone <repository-url>
cd churchtools-dashboard

# Abhängigkeiten installieren
npm install

# Umgebungsvariablen konfigurieren
cp .env-example .env
# .env Datei mit ChurchTools-Zugangsdaten bearbeiten
```

### Entwicklungsserver starten

```bash
npm run dev
```

Der Development Server läuft auf `http://localhost:5173`

### Production Build erstellen

```bash
npm run build
```

## 📦 Deployment

### Automatisches Packaging für ChurchTools

```bash
# 1. Entwicklung abschließen
git add .
git commit -m "feat: neue Funktionalität hinzugefügt"

# 2. Version taggen (optional)
git tag v1.0.0

# 3. Build und Package erstellen
npm run deploy
```

**Ergebnis:** `releases/churchtools-dashboard-v0.0.0-a1b2c3d.zip`

### Manuelle Schritte

1. **Build erstellen:**

   ```bash
   npm run build
   ```

2. **Package erstellen:**

   ```bash
   npm run deploy
   ```

3. **ZIP-Datei in ChurchTools hochladen:**
   - ChurchTools Admin-Bereich öffnen
   - Zu "Erweiterungen" → "Erweiterung hochladen" navigieren
   - ZIP-Datei aus dem `releases/` Ordner auswählen
   - Installation bestätigen

### ZIP-Datei Format

- **Namenskonvention:** `{projektname}-v{version}-{git-hash}.zip`
- **Inhalt:** Nur `dist/` Verzeichnis (ohne Source Maps)
- **Speicherort:** `releases/` Verzeichnis (automatisch erstellt)

## 🔧 ChurchTools Integration

### Konfiguration

- **Plugin-Kürzel:** `ctdashboard`
- **Base URL:** `/ccm/ctdashboard/`
- **API-Client:** `@churchtools/churchtools-client`

### Umgebungsvariablen (.env)

```env
# Plugin-Kürzel für ChurchTools
VITE_KEY=ctdashboard

# Entwicklungsserver-Konfiguration
VITE_BASE_URL=https://ihre-domain.church.tools
VITE_USERNAME=ihr-username
VITE_PASSWORD=ihr-passwort
```

## 🛠️ Technische Details

### Tech Stack

- **Frontend:** Vue 3 + TypeScript
- **Build Tool:** Vite
- **Styling:** CSS3 + ChurchTools Design System
- **API Client:** ChurchTools Client Library

### Projektstruktur

```
ct-dashboard/
├── src/
│   ├── components/
│   │   ├── Start.vue                      # Haupt-Dashboard
│   │   ├── BaseCard.vue                   # Basis-Karten-Komponente
│   │   ├── BeispielCard.vue               # Beispiel-Implementierung
│   │   ├── ExpiringAppointmentsCard.vue   # auslaufende Terminserien (Übersicht)
│   │   ├── ExpiringAppointmentsAdmin.vue  # auslaufende Terminserien (Admin)
│   │   ├── AutomaticGroupsCard.vue        # Automatische Gruppen (Übersicht)
│   │   └── AutomaticGroupsAdmin.vue       # Automatische Gruppen (Admin)
│   ├── services/
│   │   └── churchtools.ts                 # ChurchTools API Service
│   ├── types/
│   │   └── modules.ts                     # Modul-Definitionen
│   ├── App.vue                            # Root-Komponente
│   ├── main.ts                            # Entry Point
│   ├── style.css                          # Globale Styles
│   └── ct-types.d.ts                      # ChurchTools TypeScript-Definitionen
├── scripts/
│   └── package.js                         # Deployment-Script
├── releases/                              # Generierte ZIP-Pakete
├── dist/                                  # Build-Output
├── package.json                           # Projekt-Konfiguration
├── vite.config.ts                         # Vite-Konfiguration
└── README.md                              # Diese Dokumentation
```

### Responsive Design

- **Mobile:** 1-spaltige Grid-Ansicht
- **Desktop:** 2x2 Grid-Layout für Features
- **Breakpoint:** 768px

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
- **[GitHub Issues](https://github.com/ihr-username/ct-dashboard/issues)** - Bug-Reports

### Entwickler-Support

- **[API-Referenz](./docs/API.md)** - Technische Details
- **[Entwickler-Guide](./docs/DEVELOPMENT.md)** - Architektur-Dokumentation
- **[Deployment-Anleitung](./docs/DEPLOYMENT.md)** - Installation und Updates

## 📄 Lizenz

Dieses Projekt steht unter der MIT-Lizenz. Siehe LICENSE-Datei für Details.

---

**Entwickelt für ChurchTools** - Die moderne Gemeindeverwaltung  
**Version:** 1.0.0 | **Dokumentation:** [docs/](./docs/) | **Support:** [GitHub Issues](https://github.com/ihr-username/ct-dashboard/issues)
