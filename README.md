# ChurchTools Dashboard

A modern Vue 3 + TypeScript dashboard extension for ChurchTools providing system monitoring and administration capabilities.

## 🎯 What is this?

This ChurchTools plugin provides a centralized dashboard for monitoring and managing key system data:

- **Expiring appointment series** - Overview and management
- **Automatic groups** - Status monitoring and execution tracking
- **Tags management** - Bulk operations with color picker
- **Logger system** - Categorized log analysis with filtering

**Plugin Key:** `ctdashboard`

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- ChurchTools installation with admin access
- Git

### Development Setup

```bash
# Clone repository
git clone https://github.com/bwl21/ct-dashboard.git
cd ct-dashboard

# Install dependencies
npm install

# Start development server
npm run dev
```

### Common Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run lint         # Type check and format validation
npm run format       # Auto-format code with Prettier
npm run type-check   # TypeScript type checking only
npm run clean        # Clean build artifacts
npm run deploy       # Build and package for ChurchTools
npm run test         # Run Playwright tests
npm run test:ui      # Run tests with UI mode
npm run test:headed  # Run tests in headed mode
npm run test:report  # Serve test report on port 9323
npm run test:smoke   # Run smoke tests only
npm run test:layout  # Run layout tests (Issue #7)
npm run test:mobile  # Run mobile-specific tests
```

### Basic Development Workflow

1. **Create feature branch**: `git checkout -b feature/your-feature`
2. **Follow patterns**: See `src/components/` for examples
3. **Use BaseCard + AdminTable**: For consistent UI
4. **Test changes**: `npm run lint` and `npm run test` before committing
5. **Deploy**: `npm run deploy` creates ChurchTools plugin package

### Testing

```bash
# Run all tests
npm run test

# Run specific test categories
npm run test:smoke     # Basic functionality tests
npm run test:layout    # UI layout tests (Issue #7)
npm run test:mobile    # Mobile-specific tests

# Test with specific browsers
npm run test -- --project chromium
npm run test -- --project "Mobile Safari"

# Run tests with tags
npm run test -- --grep "@smoke"
npm run test -- --grep "@issue7"

# View test report
npm run test:report    # Serves report on http://localhost:9323
```

**Available Test Tags:**

- `@smoke` - Basic functionality
- `@layout` - UI/Layout tests
- `@issue7` - Issue #7 specific tests
- `@responsive` - Mobile/responsive tests
- `@interaction` - User interaction tests

### Project Structure

```
src/components/[module]/
├── [Module]Card.vue      # Dashboard card
├── [Module]Admin.vue     # Admin interface
└── use[Module].ts        # Data logic
```

## 📦 Installation in ChurchTools

1. **Build plugin**: `npm run deploy`
2. **Upload**: Install `releases/churchtools-dashboard-v*.zip` in ChurchTools
3. **Activate**: Enable plugin in ChurchTools admin panel
4. **Access**: Navigate to `/ccm/ct-dashboard/` in your ChurchTools instance

## 🔧 Tech Stack

- **Vue 3** + **TypeScript** - Modern reactive framework
- **Vite** - Fast build tool and dev server
- **ChurchTools Client** - Official API integration
- **ChurchTools Design System** - Native styling
- **Playwright** - End-to-end testing framework
- **Prettier** - Code formatting

## 📚 Documentation

### For Developers

- **[AGENTS.md](AGENTS.md)** - Development patterns and API usage
- **[docs/](docs/)** - Technical documentation and session notes
- **Working Examples**: See `src/components/` for real implementations

### For Contributors

- **[CONTRIBUTING.md](CONTRIBUTING.md)** - How to contribute (if exists)
- **[CHANGELOG.md](CHANGELOG.md)** - Version history and changes

## 🎨 Design-Prinzipien

- **Konsistenz:** Einheitliche BaseCard-Architektur
- **ChurchTools-konform:** Natives Design-System
- **Responsive:** Mobile-first Ansatz
- **Performance:** Optimierte Bundle-Größe
- **Accessibility:** WCAG-konforme Implementierung
- **Stable Layouts:** No layout shifts during loading (Issue #7 ✅)

## 🐛 Recent Fixes

### Issue #7: Card Button Layout Shifts ✅

**Problem:** Dashboard card buttons jumped from left to right during loading states, causing poor user experience.

**Solution:**

- Implemented stable CSS layout with `margin-left: auto`
- Added loading placeholder text to prevent footer layout shifts
- Comprehensive Playwright tests to prevent regression

**Testing:** `npm run test:layout` or `npm run test -- --grep "@issue7"`

## 🤝 Contributing

1. **Fork** this repository
2. **Create feature branch**: `git checkout -b feature/amazing-feature`
3. **Follow patterns**: Use existing components as examples
4. **Test thoroughly**: `npm run lint` and manual testing
5. **Create Pull Request**: With clear description of changes

See [AGENTS.md](AGENTS.md) for development patterns and [docs/](docs/) for technical details.

## 🤖 Working with Ona (AI Assistant)

### Useful Prompts

**Start Development Session:**

```
"Start a new development session for [feature description]"
```

**Show Progress:**

```
"Show me what we've accomplished so far"
"What are the next steps?"
```

**End Session:**

```
"This session is complete, please finalize documentation"
```

**Create Commit Message:**

```
"Please create a commit message for these changes"
```

**Commit Changes:**

```
"Please commit these changes"
```

**Push Changes:**

```
"Please push the changes to remote"
```

**Deploy:**

```
"Build and prepare for deployment"
```

**Review Code:**

```
"Review the changes and run lint checks"
```

**Create Pull Request:**

```
"Please create a pull request for this feature"
```

**Discussion Mode:**

```
"Let's discuss this first - don't make any changes yet"
```

## 🤖 Entwickelt mit KI-Unterstützung

Dieses Projekt wurde mit Unterstützung von **Ona** entwickelt - einem KI-Assistenten für Softwareentwicklung. Ona half bei:

- **Architektur-Design** - BaseCard-System und Komponenten-Struktur
- **Code-Implementierung** - Vue 3 + TypeScript Best Practices
- **UI/UX-Verbesserungen** - Responsive Design und Benutzerfreundlichkeit
- **Dokumentation** - Umfassende technische Dokumentation
- **Code-Qualität** - Refactoring und Performance-Optimierungen

Die Kombination aus menschlicher Kreativität und KI-Effizienz ermöglichte eine schnelle und qualitativ hochwertige Entwicklung.

### AI Agent Development

Für AI Agents, die an diesem Projekt arbeiten, siehe **[AGENTS.md](AGENTS.md)** für kompakte Entwicklungsrichtlinien.

## 📄 Lizenz

Dieses Projekt steht unter der MIT-Lizenz. Siehe [LICENSE](LICENSE) für Details.

## 🔗 Links

- **ChurchTools:** [churchtools.de](https://churchtools.de)
- **Vue 3:** [vuejs.org](https://vuejs.org)
- **TypeScript:** [typescriptlang.org](https://typescriptlang.org)
- **Vite:** [vitejs.dev](https://vitejs.dev)
- **Ona:** [ona.com](https://ona.com) - KI-Assistent für Softwareentwicklung

## 🔄 Development

### Branching-Strategie

- **main** - Produktionsreifer Code
- **feature/** - Feature-Branches

## 🧩 Architektur

### BaseCard-System

Einheitliche Basis für alle Dashboard-Karten.
**Beispiele:** `src/components/*/Card.vue`

### Admin-Panels

Verwaltungsoberflächen mit Filtern und Tabellen.
**Beispiele:** `src/components/*/Admin.vue`

### Composables

Vue 3 Composables für Datenlogik.
**Beispiele:** `src/components/*/use*.ts`

## 📚 Dokumentation

### Vollständige Dokumentation

- **[📋 Dokumentations-Übersicht](./docs/README.md)** - Alle Dokumentationen im Überblick
- **[👨‍💻 Entwickler-Handbuch](./docs/DEVELOPMENT.md)** - Architektur und Entwicklung
- **[🔌 API-Dokumentation](./docs/API.md)** - Interfaces und Datenstrukturen
- **[🚀 Deployment-Guide](./docs/DEPLOYMENT.md)** - Build und Installation
- **[📝 Changelog](./CHANGELOG.md)** - Versionshistorie

### Quick Links

- **Component Examples**: `src/components/` directory
- **API Integration**: See working composables in `src/components/*/use*.ts`
- **ChurchTools Integration**: [DEPLOYMENT.md](./docs/DEPLOYMENT.md)

## 📞 Support

### Dokumentation & Hilfe

- **[📚 Vollständige Dokumentation](./docs/)** - Umfassende Anleitungen
- **[ChurchTools Forum](https://forum.church.tools)** - Community-Support
- **[GitHub Issues](https://github.com/bwl21/ct-dashboard/issues)** - Bug-Reports

### Entwickler-Support

- **[AGENTS.md](./AGENTS.md)** - Development patterns and examples
- **[docs/](./docs/)** - Technical documentation
- **Working Code**: `src/components/` for real implementations

## 📄 Lizenz

Dieses Projekt steht unter der MIT-Lizenz. Siehe LICENSE-Datei für Details.

---

**Entwickelt für ChurchTools** - Die moderne Gemeindeverwaltung  
**Version:** 1.0.4 | **Dokumentation:** [docs/](./docs/) | **Support:** [GitHub Issues](https://github.com/bwl21/ct-dashboard/issues)
