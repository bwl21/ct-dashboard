# Deployment Guide

## 🚀 Quick Deployment

### Automatisches Deployment

```bash
# Build und Package in einem Schritt
npm run deploy
```

Erstellt automatisch: `releases/ct-dashboard-v{version}-{git-hash}.zip`

### Manuelle Schritte

```bash
# 1. Build erstellen
npm run build

# 2. Package erstellen
node scripts/package.js
```

## 📦 ChurchTools Installation

### Upload in ChurchTools

1. **Admin-Bereich** → **Einstellungen** → **Erweiterungen**
2. **"Erweiterung hochladen"** klicken
3. ZIP-Datei aus `releases/` Verzeichnis auswählen
4. **"Installieren"** und **"Aktivieren"**

### URL-Zugriff

Nach der Installation verfügbar unter:
```
https://ihre-domain.church.tools/ccm/ctdashboard/
```

## 🔧 Konfiguration

### Build-Einstellungen

**vite.config.ts:**
```typescript
export default defineConfig({
  base: "/ccm/ctdashboard/",
  build: {
    outDir: "dist",
    sourcemap: false,
    minify: "terser"
  }
})
```

### Package-Struktur

```
ct-dashboard-v1.0.0-abc123.zip
├── index.html
└── assets/
    ├── index-[hash].js
    ├── index-[hash].css
    └── vendor-[hash].js
```

## 🔧 Troubleshooting

### Häufige Probleme

**Build-Fehler:**
```bash
# Dependencies neu installieren
rm -rf node_modules package-lock.json
npm install
```

**Upload-Fehler:**
- ZIP-Datei unter 10MB halten
- Nur `dist/` Inhalt ohne Source Maps

**Berechtigungen:**
- ChurchTools-Admin-Rechte erforderlich
- API-Zugriff automatisch über Session

### Content Security Policy

```html
<!-- Automatisch von ChurchTools gesetzt -->
<meta
  http-equiv="Content-Security-Policy"
  content="default-src 'self'; script-src 'self' 'unsafe-inline';"
/>
```

## 📊 Monitoring & Logging

### Error Tracking

```typescript
// Globaler Error Handler
window.addEventListener("error", (event) => {
  console.error("Global Error:", {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    error: event.error,
  })
})

// Vue Error Handler
app.config.errorHandler = (err, vm, info) => {
  console.error("Vue Error:", {
    error: err,
    component: vm?.$options.name,
    info: info,
  })
}
```

### Performance Monitoring

```typescript
// Performance-Metriken sammeln
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    console.log("Performance:", {
      name: entry.name,
      duration: entry.duration,
      startTime: entry.startTime,
    })
  }
})

observer.observe({ entryTypes: ["navigation", "resource"] })
```

### Health Check

```typescript
// Einfacher Health Check
export async function healthCheck(): Promise<boolean> {
  try {
    await churchtoolsClient.get("/whoami")
    return true
  } catch (error) {
    console.error("Health check failed:", error)
    return false
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
console.log("ChurchTools Client:", churchtoolsClient)
console.log("Environment:", import.meta.env)
```

#### API-Probleme

```typescript
// Verbindung testen
try {
  const response = await churchtoolsClient.get("/whoami")
  console.log("API Connection OK:", response)
} catch (error) {
  console.error("API Connection Failed:", error)
}
```

### Debug-Modus aktivieren

```typescript
// In main.ts
if (import.meta.env.DEV) {
  window.DEBUG = true
  console.log("Debug mode enabled")
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
