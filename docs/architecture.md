# ChurchTools Dashboard - Architektur-Dokumentation

## Überblick
Das ChurchTools Dashboard ist eine moderne, modulare Webanwendung, die mit Vue 3 und TypeScript entwickelt wurde. Es bietet eine Benutzeroberfläche zur Überwachung und Verwaltung verschiedener Aspekte einer ChurchTools-Instanz.

## Technologie-Stack

### Kern-Technologien
- **Vue 3** - Progressives JavaScript-Framework
- **TypeScript** - Typisiertes JavaScript-Superset
- **Vite** - Schnelles Build-Tool und Entwicklungsserver
- **ChurchTools Client** - Offizielle Client-Bibliothek für die ChurchTools-API

### Entwicklungswerkzeuge
- **Node.js** - JavaScript-Laufzeitumgebung
- **npm** - Paketmanager
- **ESLint** - Code-Linting
- **Prettier** - Code-Formatierung

## Projektstruktur

```
src/
├── components/                      # Wiederverwendbare UI-Komponenten
│   ├── AutomaticGroupsAdmin.vue     # Admin-Oberfläche für automatische Gruppen
│   ├── AutomaticGroupsCard.vue      # Karte für die Übersicht der automatischen Gruppen
│   ├── ExpiringAppointmentsAdmin.vue # Admin-Oberfläche für auslaufende Serientermine
│   ├── ExpiringAppointmentsCard.vue  # Karte für die Übersicht der auslaufenden Serientermine
│   ├── UserStatisticsAdmin.vue      # Admin-Oberfläche für Benutzerstatistiken
│   ├── UserStatisticsCard.vue       # Karte für Benutzerstatistiken
│   └── Start.vue                   # Haupt-Dashboard-Ansicht
├── types/
│   └── modules.ts                  # TypeScript-Typdefinitionen für Dashboard-Module
├── App.vue                         # Hauptkomponente
├── main.ts                         # Einstiegspunkt der Anwendung
└── style.css                       # Globale Stile
```

## Wichtige Komponenten

### 1. Hauptanwendung (App.vue)
- Verwaltet Routing und Layout
- Verwaltet den Anwendungszustand
- Rendert die Hauptnavigation und den Inhaltsbereich

### 2. Start-Komponente (Start.vue)
- Hauptansicht des Dashboards
- Zeigt Feature-Karten in einem responsiven Grid an
- Verarbeitet die Navigation zu Admin-Ansichten
- Verwaltet das Layout und die Anpassungsfähigkeit der Karten

### 3. Dashboard-Karten
- **AutomaticGroupsCard**: Zeigt Statistiken und Aktualisierungsstatus der automatischen Gruppen an
- **ExpiringAppointmentsCard**: Zeigt anstehende auslaufende Serientermine an
- **UserStatisticsCard**: Zeigt wichtige Benutzerkennzahlen und Statistiken an

### 4. Admin-Komponenten
- **AutomaticGroupsAdmin**: Detaillierte Verwaltungsoberfläche für automatische Gruppen
- **ExpiringAppointmentsAdmin**: Verwaltungsoberfläche für auslaufende Serientermine
- **UserStatisticsAdmin**: Detaillierte Benutzerstatistiken und -analysen

## Datenfluss

1. **Initialisierung**
   - Die App wird geladen und initialisiert den ChurchTools-Client
   - Die Authentifizierung erfolgt im Entwicklungsmodus automatisch
   - Dashboard-Module werden registriert und konfiguriert

2. **Datenabruf**
   - Komponenten rufen bei der Initialisierung Daten ab
   - Daten werden bei Bedarf zwischengespeichert
   - Automatische Aktualisierung kann manuell ausgelöst werden
   - Umfassende Fehlerbehandlung mit Fallback auf Testdaten

3. **Zustandsverwaltung**
   - Lokaler Komponentenstatus mit `ref` und `reactive`
   - Wiederverwendbare Funktionen für gemeinsame Logik
   - Props und Events für die Kommunikation zwischen Komponenten

## Authentifizierung

- Nutzt die ChurchTools-Authentifizierung
- Entwicklungsmodus unterstützt automatische Anmeldung mit Umgebungsvariablen
- Sitzungsverwaltung wird vom ChurchTools-Client übernommen

## Fehlerbehandlung

- Globale Fehlerbehandlung für API-Aufrufe
- Benutzerfreundliche Fehlermeldungen
- Fallback auf Testdaten, wenn die API nicht verfügbar ist

## Entwicklungsworkflow

1. **Einrichtung**
   ```bash
   npm install
   cp .env-example .env
   # Konfigurieren Sie die Umgebungsvariablen in .env
   ```

2. **Entwicklungsserver**
   ```bash
   npm run dev
   ```

3. **Produktionsbuild**
   ```bash
   npm run build
   ```

## Umgebungsvariablen

Erforderliche Umgebungsvariablen (in `.env` gespeichert):
- `VITE_BASE_URL` - Basis-URL der ChurchTools-Instanz
- `VITE_USERNAME` - Benutzername für die automatische Anmeldung im Entwicklungsmodus
- `VITE_PASSWORD` - Passwort für die automatische Anmeldung im Entwicklungsmodus

## Best Practices

1. **Komponentendesign**
   - Single-Responsibility-Prinzip
   - Wiederverwendbare, kombinierbare Komponenten
   - Klare Props- und Events-Schnittstellen

2. **Zustandsverwaltung**
   - Zustand möglichst lokal halten
   - Composition API für komplexe Logik verwenden
   - Direkte Mutationen vermeiden, Methoden verwenden

3. **Styling**
   - Komponentenbezogene Stile
   - CSS-Variablen für das Theming
   - Responsive Design-Patterns

## Zukünftige Verbesserungen

1. **Tests**
   - Unit-Tests für Komponenten mit Vitest
   - Integrationstests für den Datenfluss
   - E2E-Tests für kritische Pfade mit Cypress

2. **Funktionen**
   - Weitere Dashboard-Widgets (z.B. Veranstaltungsstatistiken, Finanzübersicht)
   - Anpassbares Dashboard-Layout mit Drag-and-Drop
   - Echtzeitaktualisierungen mit WebSockets
   - Exportfunktion für Berichte
   - Benutzereinstellungen und Anpassung des Designs

3. **Leistung**
   - Code-Splitting für Admin-Ansichten
   - Lazy Loading von Komponenten und Routen
   - Optimiertes Laden und Caching von Assets
   - Virtuelles Scrollen für große Datensätze

4. **Barrierefreiheit**
   - ARIA-Attribute und -Rollen
   - Tastaturnavigation
   - Hoher Kontrastmodus

## Abhängigkeiten

### Kern-Abhängigkeiten
- `@churchtools/churchtools-client` - Offizieller ChurchTools-API-Client
- `vue` - Kernframework (v3.x)
- `vite` - Build-Tool und Entwicklungsserver
- `typescript` - Typenprüfung und bessere Entwicklererfahrung

### Entwicklungsabhängigkeiten
- `@vitejs/plugin-vue` - Vue 3-Unterstützung für Vite
- `@vue/compiler-sfc` - Single-File-Component-Compiler
- `eslint` - Code-Linting
- `prettier` - Code-Formatierung
- `sass` - CSS-Präprozessor (optional)

## Browser-Unterstützung

- Moderne Browser (Chrome, Firefox, Safari, Edge)
- IE11 wird nicht unterstützt (verwendet moderne JavaScript-Features)

## Lizenz

[Geben Sie hier Ihre Lizenz an]
