# Deployment-Dokumentation

## 🚀 Übersicht

Das ChurchTools Dashboard wird als ZIP-Paket für die ChurchTools-Erweiterungsschnittstelle bereitgestellt. Diese Dokumentation beschreibt den kompletten Deployment-Prozess.

## 📦 Build-Prozess

### 1. Entwicklung abschließen

```bash
# Alle Änderungen committen
git add .
git commit -m "feat: neue Funktionalität implementiert"

# Optional: Version taggen
git tag v1.2.0
git push origin v1.2.0
```

### 2. Production Build erstellen

```bash
# Dependencies installieren
npm install

# Production Build
npm run build
```

**Build-Konfiguration (vite.config.ts):**
```typescript
export default defineConfig({
  plugins: [vue()],
  base: '/ccm/ctdashboard/',
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['vue'],
          churchtools: ['@churchtools/churchtools-client']
        }
      }
    }
  }
});
```

### 3. Package erstellen

```bash
# Automatisches Packaging
npm run deploy
```

**Oder manuell:**
```bash
# Package-Script ausführen
node scripts/package.js
```

## 📋 Package-Struktur

### Generierte ZIP-Datei
```
churchtools-dashboard-v1.2.0-a1b2c3d.zip
├── index.html
├── assets/
│   ├── index-[hash].js
│   ├── index-[hash].css
│   └── vendor-[hash].js
└── manifest.json (optional)
```

### Namenskonvention
- **Format:** `{projektname}-v{version}-{git-hash}.zip`
- **Beispiel:** `ct-dashboard-v1.2.0-a1b2c3d.zip`
- **Speicherort:** `releases/` Verzeichnis

### Package-Script Details
```javascript
// scripts/package.js
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const { execSync } = require('child_process');

function createPackage() {
  // Git-Informationen abrufen
  const gitHash = execSync('git rev-parse --short HEAD').toString().trim();
  const version = require('../package.json').version;
  const projectName = require('../package.json').name;
  
  // Dateiname generieren
  const filename = `${projectName}-v${version}-${gitHash}.zip`;
  const outputPath = path.join('releases', filename);
  
  // Releases-Verzeichnis erstellen
  if (!fs.existsSync('releases')) {
    fs.mkdirSync('releases');
  }
  
  // ZIP erstellen
  const output = fs.createWriteStream(outputPath);
  const archive = archiver('zip', { zlib: { level: 9 } });
  
  archive.pipe(output);
  archive.directory('dist/', false);
  archive.finalize();
  
  console.log(`Package erstellt: ${outputPath}`);
}
```

## 🔧 ChurchTools Installation

### 1. Admin-Bereich öffnen
1. ChurchTools-Installation öffnen
2. Als Administrator anmelden
3. Zu **Einstellungen** → **Erweiterungen** navigieren

### 2. Erweiterung hochladen
1. **"Erweiterung hochladen"** klicken
2. ZIP-Datei aus `releases/` Verzeichnis auswählen
3. Upload bestätigen

### 3. Installation bestätigen
1. Erweiterungsdetails prüfen
2. **"Installieren"** klicken
3. Installation abwarten

### 4. Aktivierung
1. Erweiterung in der Liste finden
2. **"Aktivieren"** klicken
3. Berechtigungen konfigurieren (falls erforderlich)

## 🌐 URL-Struktur

### Production URLs
```
https://ihre-domain.church.tools/ccm/ctdashboard/
├── /                          # Dashboard-Hauptseite
├── /expiring-appointments     # Auslaufende Termine Admin
└── /automatic-groups          # Automatische Gruppen Admin
```

### Development URLs
```
http://localhost:5173/
├── /                          # Dashboard-Hauptseite
├── /expiring-appointments     # Auslaufende Termine Admin
└── /automatic-groups          # Automatische Gruppen Admin
```

## ⚙️ Umgebungskonfiguration

### Production Environment
```env
# Automatisch von ChurchTools gesetzt
VITE_KEY=ctdashboard
VITE_BASE_URL=https://ihre-domain.church.tools
```

### Development Environment
```env
# .env Datei
VITE_KEY=ctdashboard
VITE_BASE_URL=https://ihre-domain.church.tools
VITE_USERNAME=ihr-username
VITE_PASSWORD=ihr-passwort
```

### Environment-spezifische Builds
```bash
# Development Build
npm run build:dev

# Staging Build
npm run build:staging

# Production Build
npm run build
```

## 🔐 Sicherheit & Berechtigungen

### ChurchTools-Berechtigungen
Die Erweiterung benötigt folgende Berechtigungen:

```json
{
  "permissions": {
    "churchcal": {
      "view": true,
      "edit": false
    },
    "churchdb": {
      "view groups": true,
      "edit groups": false
    }
  }
}
```

### API-Zugriff
```typescript
// Automatische Authentifizierung über ChurchTools-Session
import { churchtoolsClient } from '@churchtools/churchtools-client';

// Client ist bereits konfiguriert und authentifiziert
const data = await churchtoolsClient.get('/calendars');
```

### Content Security Policy
```html
<!-- Automatisch von ChurchTools gesetzt -->
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; script-src 'self' 'unsafe-inline';">
```

## 📊 Monitoring & Logging

### Error Tracking
```typescript
// Globaler Error Handler
window.addEventListener('error', (event) => {
  console.error('Global Error:', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    error: event.error
  });
});

// Vue Error Handler
app.config.errorHandler = (err, vm, info) => {
  console.error('Vue Error:', {
    error: err,
    component: vm?.$options.name,
    info: info
  });
};
```

### Performance Monitoring
```typescript
// Performance-Metriken sammeln
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    console.log('Performance:', {
      name: entry.name,
      duration: entry.duration,
      startTime: entry.startTime
    });
  }
});

observer.observe({ entryTypes: ['navigation', 'resource'] });
```

### Health Check
```typescript
// Einfacher Health Check
export async function healthCheck(): Promise<boolean> {
  try {
    await churchtoolsClient.get('/whoami');
    return true;
  } catch (error) {
    console.error('Health check failed:', error);
    return false;
  }
}
```

## 🔄 Update-Prozess

### 1. Neue Version vorbereiten
```bash
# Version in package.json erhöhen
npm version patch  # oder minor/major

# Changelog aktualisieren
echo "## v1.2.1\n- Bugfix: ..." >> CHANGELOG.md
```

### 2. Build und Package
```bash
# Build erstellen
npm run build

# Package erstellen
npm run deploy
```

### 3. ChurchTools Update
1. Neue ZIP-Datei hochladen
2. **"Update"** statt "Installieren" wählen
3. Update bestätigen
4. Cache leeren (falls erforderlich)

### 4. Rollback (falls erforderlich)
1. Vorherige Version aus `releases/` verwenden
2. Downgrade über ChurchTools-Interface
3. Oder: Erweiterung deaktivieren/reaktivieren

## 🧪 Testing vor Deployment

### 1. Lokale Tests
```bash
# Unit Tests
npm run test

# E2E Tests
npm run test:e2e

# Linting
npm run lint

# Type Checking
npm run type-check
```

### 2. Build-Validierung
```bash
# Build erstellen
npm run build

# Build lokal testen
npm run preview
```

### 3. Package-Validierung
```bash
# Package erstellen
npm run deploy

# ZIP-Inhalt prüfen
unzip -l releases/ct-dashboard-v1.2.0-*.zip
```

## 📋 Deployment-Checkliste

### Pre-Deployment
- [ ] Alle Tests bestanden
- [ ] Code-Review abgeschlossen
- [ ] Version in package.json aktualisiert
- [ ] Changelog aktualisiert
- [ ] Git-Tag erstellt

### Build-Prozess
- [ ] `npm install` erfolgreich
- [ ] `npm run build` erfolgreich
- [ ] `npm run deploy` erfolgreich
- [ ] ZIP-Datei erstellt

### ChurchTools-Installation
- [ ] Als Administrator angemeldet
- [ ] ZIP-Datei hochgeladen
- [ ] Installation erfolgreich
- [ ] Erweiterung aktiviert
- [ ] Funktionalität getestet

### Post-Deployment
- [ ] Dashboard erreichbar
- [ ] Alle Module funktionsfähig
- [ ] API-Verbindungen funktionieren
- [ ] Keine JavaScript-Fehler
- [ ] Performance akzeptabel

## 🚨 Troubleshooting

### Häufige Probleme

#### Build-Fehler
```bash
# Node Modules neu installieren
rm -rf node_modules package-lock.json
npm install

# Cache leeren
npm run clean
```

#### Upload-Fehler
- **Datei zu groß:** Build optimieren, Source Maps entfernen
- **Ungültiges Format:** ZIP-Struktur prüfen
- **Berechtigungen:** Admin-Rechte prüfen

#### Runtime-Fehler
```javascript
// Browser-Konsole prüfen
console.log('ChurchTools Client:', churchtoolsClient);
console.log('Environment:', import.meta.env);
```

#### API-Probleme
```typescript
// Verbindung testen
try {
  const response = await churchtoolsClient.get('/whoami');
  console.log('API Connection OK:', response);
} catch (error) {
  console.error('API Connection Failed:', error);
}
```

### Debug-Modus aktivieren
```typescript
// In main.ts
if (import.meta.env.DEV) {
  window.DEBUG = true;
  console.log('Debug mode enabled');
}
```

### Log-Analyse
```bash
# Browser-Konsole
# Netzwerk-Tab
# ChurchTools-Logs (falls verfügbar)
```

## 📞 Support

### Dokumentation
- [ChurchTools API Dokumentation](https://api.church.tools)
- [ChurchTools Forum](https://forum.church.tools)
- [Vue.js Dokumentation](https://vuejs.org)

### Kontakt
- **GitHub Issues:** Für Bugs und Feature-Requests
- **ChurchTools Forum:** Für allgemeine Fragen
- **E-Mail:** Für kritische Probleme

---

**Hinweis:** Diese Dokumentation bezieht sich auf ChurchTools Version 3.x. Für ältere Versionen können Anpassungen erforderlich sein.