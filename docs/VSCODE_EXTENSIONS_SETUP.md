# VS Code Extensions Setup für ChurchTools Dashboard

## Automatische Installation via Dev Container

Die folgenden Extensions werden automatisch in neuen Dev Container Umgebungen installiert:

### Konfiguriert in `.devcontainer/devcontainer.json`:

```json
{
  "customizations": {
    "vscode": {
      "extensions": [
        "Vue.volar",                           // Vue 3 Language Support
        "Vue.vscode-typescript-vue-plugin",   // Vue TypeScript Integration
        "bradlc.vscode-tailwindcss",          // Tailwind CSS IntelliSense
        "esbenp.prettier-vscode",             // Code Formatter
        "ms-vscode.vscode-typescript-next",   // TypeScript Support
        "mhutchie.git-graph"                  // Git Graph Visualization
      ]
    }
  }
}
```

## Git Graph Extension

### Was ist Git Graph?
Git Graph ist eine VS Code Extension, die eine visuelle Darstellung der Git-Historie bietet:

- **Graphische Branch-Darstellung**
- **Commit-Historie Visualisierung**
- **Interactive Git Operations**
- **Branch Management**
- **Merge/Rebase Operationen**

### Features:
- 📊 **Visual Git History** - Graphische Darstellung aller Commits und Branches
- 🌿 **Branch Management** - Einfaches Erstellen, Wechseln und Löschen von Branches
- 🔀 **Merge Operations** - Visuelle Merge- und Rebase-Operationen
- 🏷️ **Tag Management** - Erstellen und Verwalten von Git Tags
- 🔍 **Commit Details** - Detaillierte Commit-Informationen und Diffs
- 📋 **Copy Operations** - Commit-Hashes und Nachrichten kopieren

### Verwendung:

1. **Git Graph öffnen:**
   - Command Palette (`Ctrl+Shift+P`)
   - Suche nach "Git Graph: View Git Graph"
   - Oder klicke auf "Git Graph" in der Source Control Sidebar

2. **Branch Operations:**
   - Rechtsklick auf Branch → "Checkout Branch"
   - Rechtsklick auf Commit → "Create Branch from this Commit"
   - Drag & Drop für Merge-Operationen

3. **Commit Operations:**
   - Klick auf Commit für Details
   - Rechtsklick für Kontext-Menü
   - Copy Commit Hash/Message

## Manuelle Installation (falls nötig)

Falls Git Graph nicht automatisch installiert wird:

### In Gitpod:
1. Öffne Extensions Panel (`Ctrl+Shift+X`)
2. Suche nach "Git Graph"
3. Installiere "Git Graph" von mhutchie
4. Reload VS Code

### In lokaler VS Code Installation:
```bash
code --install-extension mhutchie.git-graph
```

## Weitere empfohlene Extensions

### Für Vue.js Development:
- **Vue Language Features (Volar)** - Vue 3 Support
- **TypeScript Vue Plugin (Volar)** - Vue TypeScript Integration
- **Vue VSCode Snippets** - Vue Code Snippets

### Für Git Workflow:
- **GitLens** - Enhanced Git capabilities
- **Git History** - Git log and file history
- **Git Graph** - Visual git repository

### Für Code Quality:
- **ESLint** - JavaScript/TypeScript Linting
- **Prettier** - Code Formatting
- **Auto Rename Tag** - HTML/Vue Tag Renaming

### Für Productivity:
- **Auto Import - ES6, TS, JSX, TSX** - Automatic imports
- **Path Intellisense** - File path autocompletion
- **Bracket Pair Colorizer** - Colored brackets

## Troubleshooting

### Git Graph nicht sichtbar?
1. Prüfe ob Extension installiert ist: `Extensions` → Suche "Git Graph"
2. Reload VS Code: `Ctrl+Shift+P` → "Developer: Reload Window"
3. Prüfe Git Repository: Git Graph funktioniert nur in Git Repositories

### Extension nicht automatisch installiert?
1. Prüfe `.devcontainer/devcontainer.json` Konfiguration
2. Rebuild Dev Container: `Ctrl+Shift+P` → "Dev Containers: Rebuild Container"
3. Manuelle Installation über Extensions Panel

### Performance Issues?
1. Git Graph kann bei sehr großen Repositories langsam sein
2. Limitiere die Anzahl der angezeigten Commits in den Einstellungen
3. Verwende Filters für spezifische Branches

## Konfiguration

### Git Graph Settings:
```json
{
  "git-graph.repository.fetchAndPrune": true,
  "git-graph.repository.fetchAndPruneTags": true,
  "git-graph.graph.colours": [
    "#0085d1",
    "#d73027",
    "#ff6600",
    "#ff0066",
    "#4daf4a",
    "#984ea3",
    "#00d4aa",
    "#ff0000"
  ],
  "git-graph.graph.style": "rounded",
  "git-graph.graph.uncommittedChanges": true
}
```

## Integration mit ChurchTools Dashboard

### Typische Git Graph Workflows:

1. **Feature Development:**
   - Erstelle Feature Branch von main
   - Entwickle Feature mit regelmäßigen Commits
   - Merge zurück zu main via Pull Request

2. **Release Management:**
   - Erstelle Release Branch
   - Cherry-pick wichtige Commits
   - Tag Release-Versionen

3. **Hotfix Workflow:**
   - Erstelle Hotfix Branch von main
   - Schnelle Fixes implementieren
   - Merge zu main und develop

### Branch Naming Convention:
- `feature/feature-name` - Neue Features
- `bugfix/issue-description` - Bug Fixes
- `hotfix/critical-fix` - Kritische Fixes
- `release/version-number` - Release Branches

---

**Hinweis:** Git Graph wird automatisch in allen neuen Dev Container Umgebungen installiert. Bei Problemen siehe Troubleshooting-Sektion oder erstelle ein Issue im Repository.