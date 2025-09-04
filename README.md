# Churchtools Dashboard

Eine moderne ChurchTools-Erweiterung zur Systemüberwachung und -verwaltung.

## 📋 Projektbeschreibung

Das **Churchtools Dashboard** ist eine Vue 3 + TypeScript basierte Erweiterung für ChurchTools, die dabei hilft, das ChurchTools System zu überwachen. Die Extension bietet eine benutzerfreundliche Oberfläche zur Anzeige wichtiger Systemmetriken und -aktivitäten.

**Kürzel:** `ctdashboard`

## ✨ Hauptfeatures

- **👥 Anzahl User** - Überwachung der registrierten Benutzer im System
- **📊 Hauptaktivitäten** - Monitoring der wichtigsten Systemaktivitäten  
- **⚠️ Fehler** - Überwachung von Systemfehlern und Problemen
- **🟢 System Status** - Allgemeiner Gesundheitsstatus des Systems

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
churchtools-dashboard/
├── src/
│   ├── components/
│   │   └── Start.vue          # Haupt-Dashboard-Komponente
│   ├── App.vue                # Root-Komponente
│   ├── main.ts                # Entry Point
│   ├── style.css              # Globale Styles
│   └── ct-types.d.ts          # TypeScript-Definitionen
├── scripts/
│   └── package.js             # Deployment-Script
├── releases/                  # Generierte ZIP-Pakete
├── dist/                      # Build-Output
├── package.json               # Projekt-Konfiguration
├── vite.config.ts             # Vite-Konfiguration
└── README.md                  # Diese Dokumentation
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

## 🧩 UI-Komponenten Übersicht

### Header Card
- Gradient-Hintergrund mit Projekt-Titel
- Zentrale Beschreibung des Moduls

### Feature Grid
- 4 Feature-Karten in responsivem Grid
- Hover-Effekte mit Animation
- Icon, Beschreibung und Wert pro Feature

### Interactive Test Section
- Test-Button mit Zähler-Funktionalität
- Erfolgs-Feedback nach Ausführung
- Demonstration der Interaktivität

### Development Navbar
- Nur im Development-Modus sichtbar
- Zeigt aktuellen Benutzer an
- ChurchTools-konformes Styling

## 📞 Support

Bei Fragen zur ChurchTools-API wenden Sie sich an das [ChurchTools Forum](https://forum.church.tools).

## 📄 Lizenz

Dieses Projekt steht unter der MIT-Lizenz. Siehe LICENSE-Datei für Details.

---

**Entwickelt für ChurchTools** - Die moderne Gemeindeverwaltung