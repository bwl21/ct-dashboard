# Entwickler-Dokumentation

## 📋 Inhaltsverzeichnis

- [🏗️ BaseCard-Architektur](#basecard-architektur)
- [🎨 ColorPicker-Komponente](#colorpicker-komponente)
- [🔔 Toast-System](#toast-system)
- [🏷️ Tags-Verwaltung](#tags-verwaltung)
- [🎯 Styling-Guidelines](#styling-guidelines)

## 🏗️ BaseCard-Architektur

### Übersicht

Die BaseCard-Architektur standardisiert das Design und Verhalten aller Dashboard-Karten. Sie reduziert Code-Duplikation und sorgt für konsistente Benutzerführung.

### BaseCard-Komponente

#### TypeScript-Interfaces

```typescript
interface MainStat {
  value: number | string
  label: string
}

interface StatusStat {
  key: string
  value: number | string
  label: string
  icon: string
  type?: "success" | "error" | "warning" | "info"
}
```

#### Props

```typescript
interface BaseCardProps {
  title: string // Titel der Karte
  icon: string // Emoji-Icon
  isLoading?: boolean // Loading-Status
  error?: string | null // Fehlermeldung
  mainStat: MainStat // Hauptstatistik
  statusStats: StatusStat[] // Status-Statistiken
  lastUpdate?: string // Letzte Aktualisierung
  loadingText?: string // Loading-Text
  retryText?: string // Retry-Button-Text
  refreshText?: string // Refresh-Button-Text
  refreshingText?: string // Refreshing-Text
  detailsText?: string // Details-Button-Text
  lastUpdateText?: string // Last-Update-Label
}
```

#### Events

```typescript
interface BaseCardEvents {
  navigate: [] // Navigation zu Details
  refresh: [] // Daten aktualisieren
  retry: [] // Erneut versuchen
}
```

### Neue Karte erstellen

#### 1. Komponente erstellen

```vue
<template>
  <BaseCard
    :title="'Mein Neues Modul'"
    :icon="'🚀'"
    :is-loading="loading"
    :error="error"
    :main-stat="mainStat"
    :status-stats="statusStats"
    :last-update="formattedLastUpdate"
    loading-text="Lade Daten..."
    retry-text="Erneut versuchen"
    refresh-text="Aktualisieren"
    refreshing-text="Lädt..."
    details-text="Details anzeigen"
    last-update-text="Letzte Aktualisierung"
    @refresh="refreshData"
    @navigate="$emit('navigate')"
    @retry="refreshData"
  />
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue"
import BaseCard from "./BaseCard.vue"
import type { MainStat, StatusStat } from "./BaseCard.vue"

// Props
defineProps<{
  module: {
    id: string
    title: string
    icon: string
    description: string
  }
}>()

// Events
defineEmits<{
  navigate: []
}>()

// State
const loading = ref(false)
const error = ref<string | null>(null)
const data = ref({
  total: 0,
  active: 0,
  inactive: 0,
})

// Computed Properties
const mainStat = computed(
  (): MainStat => ({
    value: data.value.total,
    label: "Gesamt",
  })
)

const statusStats = computed((): StatusStat[] => [
  {
    key: "active",
    value: data.value.active,
    label: "Aktiv",
    icon: "✅",
    type: "success",
  },
  {
    key: "inactive",
    value: data.value.inactive,
    label: "Inaktiv",
    icon: "⏸️",
    type: "warning",
  },
])

const formattedLastUpdate = computed(() => {
  return new Date().toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
})

// Methods
const refreshData = async () => {
  loading.value = true
  error.value = null

  try {
    // API-Aufruf hier
    const response = await fetch("/api/my-data")
    data.value = await response.json()
  } catch (err) {
    error.value = "Fehler beim Laden der Daten"
  } finally {
    loading.value = false
  }
}

// Lifecycle
onMounted(() => {
  refreshData()
})
</script>
```

#### 2. Modul registrieren

```typescript
// src/App.vue
import MyNewCard from "./components/MyNewCard.vue"
import MyNewAdmin from "./components/MyNewAdmin.vue"

const modules: DashboardModule[] = [
  // ... existing modules
  {
    id: "my-new-module",
    title: "Mein Neues Modul",
    icon: "🚀",
    description: "Beschreibung des neuen Moduls",
    cardComponent: MyNewCard,
    adminComponent: MyNewAdmin,
  },
]
```

## 🔧 Admin-Panel-Entwicklung

### Filter-System implementieren

#### 1. Filter-State definieren

```typescript
// Filter-Variablen
const searchTerm = ref("")
const categoryFilter = ref("")
const statusFilter = ref("")

// Verfügbare Optionen
const availableCategories = computed(() => {
  // Aus Daten generieren
  const categories = new Set()
  data.value.forEach((item) => {
    if (item.category) categories.add(item.category)
  })
  return Array.from(categories).sort()
})
```

#### 2. Filter-UI erstellen

```vue
<template>
  <div class="controls-row">
    <!-- Suchfeld -->
    <div class="search-container">
      <input
        v-model="searchTerm"
        type="text"
        placeholder="Suchen..."
        class="ct-input search-input"
      />
    </div>

    <!-- Kategorie-Filter -->
    <div class="filter-container">
      <select v-model="categoryFilter" class="ct-select filter-select">
        <option value="">Alle Kategorien</option>
        <option v-for="category in availableCategories" :key="category" :value="category">
          {{ category }}
        </option>
      </select>
    </div>

    <!-- Status-Filter -->
    <div class="filter-container">
      <select v-model="statusFilter" class="ct-select filter-select">
        <option value="">Alle Status</option>
        <option value="active">Aktiv</option>
        <option value="inactive">Inaktiv</option>
      </select>
    </div>

    <!-- Clear-Button -->
    <div class="button-group">
      <button @click="clearFilters" class="ct-btn ct-btn-secondary" :disabled="!hasActiveFilters">
        Filter löschen
      </button>
    </div>
  </div>
</template>
```

#### 3. Filter-Logik implementieren

```typescript
const filteredData = computed(() => {
  let filtered = data.value

  // Suchfilter
  if (searchTerm.value) {
    const term = searchTerm.value.toLowerCase().trim()
    filtered = filtered.filter(
      (item) => item.name.toLowerCase().includes(term) || item.id.toString().includes(term)
    )
  }

  // Kategorie-Filter
  if (categoryFilter.value) {
    filtered = filtered.filter((item) => item.category === categoryFilter.value)
  }

  // Status-Filter
  if (statusFilter.value) {
    filtered = filtered.filter((item) => item.status === statusFilter.value)
  }

  return filtered
})

const hasActiveFilters = computed(() => {
  return searchTerm.value !== "" || categoryFilter.value !== "" || statusFilter.value !== ""
})

const clearFilters = () => {
  searchTerm.value = ""
  categoryFilter.value = ""
  statusFilter.value = ""
}
```

### Sortierbare Tabelle

#### 1. Sortier-State

```typescript
const sortField = ref<string>("id")
const sortDirection = ref<"asc" | "desc">("asc")

const sortBy = (field: string) => {
  if (sortField.value === field) {
    sortDirection.value = sortDirection.value === "asc" ? "desc" : "asc"
  } else {
    sortField.value = field
    sortDirection.value = "asc"
  }
}
```

#### 2. Sortier-Logik

```typescript
const sortedData = computed(() => {
  const sorted = [...filteredData.value]

  sorted.sort((a, b) => {
    let aVal = a[sortField.value]
    let bVal = b[sortField.value]

    // Spezielle Behandlung für verschiedene Datentypen
    if (sortField.value === "date") {
      aVal = new Date(aVal)
      bVal = new Date(bVal)
    }

    let comparison = 0
    if (aVal < bVal) comparison = -1
    if (aVal > bVal) comparison = 1

    return sortDirection.value === "asc" ? comparison : -comparison
  })

  return sorted
})
```

#### 3. Tabellen-Header

```vue
<template>
  <thead>
    <tr>
      <th @click="sortBy('id')" class="sortable">
        ID
        <span class="sort-indicator" v-if="sortField === 'id'">
          {{ sortDirection === "asc" ? "↑" : "↓" }}
        </span>
      </th>
      <th @click="sortBy('name')" class="sortable">
        Name
        <span class="sort-indicator" v-if="sortField === 'name'">
          {{ sortDirection === "asc" ? "↑" : "↓" }}
        </span>
      </th>
    </tr>
  </thead>
</template>
```

## 🎨 Styling-Guidelines

### CSS-Klassen

```css
/* Container */
.ct-card                    /* Basis-Karte */
.ct-card-header            /* Karten-Header */
.ct-card-body              /* Karten-Inhalt */

/* Buttons */
.ct-btn                    /* Basis-Button */
.ct-btn-primary           /* Primär-Button */
.ct-btn-secondary         /* Sekundär-Button */
.ct-btn-outline           /* Outline-Button */
.ct-btn-sm                /* Kleiner Button */

/* Inputs */
.ct-input                 /* Text-Input */
.ct-select                /* Select-Dropdown */

/* Layout */
.controls-row             /* Filter-Zeile */
.search-container         /* Such-Container */
.filter-container         /* Filter-Container */
.button-group             /* Button-Gruppe */
```

### Responsive Breakpoints

```css
/* Mobile */
@media (max-width: 768px) {
  .controls-row {
    flex-direction: column;
    gap: 1rem;
  }
}

/* Desktop */
@media (min-width: 769px) {
  .controls-row {
    display: flex;
    gap: 1rem;
    align-items: center;
  }
}
```

## 🔌 ChurchTools API Integration

### Service-Pattern

```typescript
// services/churchtools.ts
import { churchtoolsClient } from "@churchtools/churchtools-client"

export interface MyDataItem {
  id: number
  name: string
  status: string
  createdAt: string
}

export async function fetchMyData(): Promise<MyDataItem[]> {
  try {
    const response = await churchtoolsClient.get<MyDataItem[]>("/my-endpoint")
    return response || []
  } catch (error) {
    console.error("Error fetching data:", error)
    throw new Error("Fehler beim Laden der Daten")
  }
}

export async function updateMyData(id: number, data: Partial<MyDataItem>): Promise<MyDataItem> {
  try {
    const response = await churchtoolsClient.put<MyDataItem>(`/my-endpoint/${id}`, data)
    return response
  } catch (error) {
    console.error("Error updating data:", error)
    throw new Error("Fehler beim Aktualisieren der Daten")
  }
}
```

### Error Handling

```typescript
const handleApiError = (error: any): string => {
  if (error.response) {
    switch (error.response.status) {
      case 401:
        return "Nicht authentifiziert. Bitte melden Sie sich an."
      case 403:
        return "Keine Berechtigung für diese Aktion."
      case 404:
        return "Daten nicht gefunden."
      case 500:
        return "Serverfehler. Bitte versuchen Sie es später erneut."
      default:
        return `HTTP ${error.response.status}: ${error.response.statusText}`
    }
  }

  if (error.message) {
    return error.message
  }

  return "Ein unbekannter Fehler ist aufgetreten."
}
```

## 🧪 Testing

### Komponenten-Tests

```typescript
// tests/components/MyCard.test.ts
import { mount } from "@vue/test-utils"
import MyCard from "@/components/MyCard.vue"

describe("MyCard", () => {
  it("renders correctly", () => {
    const wrapper = mount(MyCard, {
      props: {
        module: {
          id: "test",
          title: "Test Module",
          icon: "🧪",
          description: "Test Description",
        },
      },
    })

    expect(wrapper.text()).toContain("Test Module")
  })

  it("emits navigate event on button click", async () => {
    const wrapper = mount(MyCard, {
      props: {
        /* ... */
      },
    })

    await wrapper.find(".details-button").trigger("click")
    expect(wrapper.emitted("navigate")).toBeTruthy()
  })
})
```

### API-Tests

```typescript
// tests/services/churchtools.test.ts
import { fetchMyData } from "@/services/churchtools"

// Mock ChurchTools Client
jest.mock("@churchtools/churchtools-client", () => ({
  churchtoolsClient: {
    get: jest.fn(),
  },
}))

describe("ChurchTools Service", () => {
  it("fetches data successfully", async () => {
    const mockData = [{ id: 1, name: "Test" }]
    ;(churchtoolsClient.get as jest.Mock).mockResolvedValue(mockData)

    const result = await fetchMyData()
    expect(result).toEqual(mockData)
  })
})
```

## 📦 Build & Deployment

### Vite-Konfiguration

```typescript
// vite.config.ts
export default defineConfig({
  plugins: [vue()],
  base: "/ccm/ctdashboard/",
  build: {
    outDir: "dist",
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["vue", "@churchtools/churchtools-client"],
        },
      },
    },
  },
})
```

### Package-Script

```javascript
// scripts/package.js
const fs = require("fs")
const path = require("path")
const archiver = require("archiver")

// Build-Verzeichnis komprimieren
const createPackage = () => {
  const output = fs.createWriteStream("releases/package.zip")
  const archive = archiver("zip", { zlib: { level: 9 } })

  archive.pipe(output)
  archive.directory("dist/", false)
  archive.finalize()
}
```

## 🔍 Debugging

### Development Tools

```typescript
// main.ts
if (import.meta.env.DEV) {
  // Vue DevTools
  app.config.performance = true

  // Global Error Handler
  app.config.errorHandler = (err, vm, info) => {
    console.error("Vue Error:", err, info)
  }
}
```

### Console Logging

```typescript
// Strukturiertes Logging
const logger = {
  info: (message: string, data?: any) => {
    console.log(`[INFO] ${message}`, data)
  },
  error: (message: string, error?: any) => {
    console.error(`[ERROR] ${message}`, error)
  },
  debug: (message: string, data?: any) => {
    if (import.meta.env.DEV) {
      console.debug(`[DEBUG] ${message}`, data)
    }
  },
}
```

## 🚀 Performance-Optimierung

### Lazy Loading

```typescript
// Router-basiertes Lazy Loading
const routes = [
  {
    path: "/admin",
    component: () => import("@/components/AdminPanel.vue"),
  },
]
```

### Computed Caching

```typescript
// Teure Berechnungen cachen
const expensiveComputation = computed(() => {
  return data.value.reduce((acc, item) => {
    // Komplexe Berechnung
    return acc + item.value
  }, 0)
})
```

### Virtual Scrolling

```vue
<!-- Für große Listen -->
<template>
  <virtual-list :data-sources="largeDataSet" :data-component="ItemComponent" :estimate-size="50" />
</template>
```

## 🎨 ColorPicker-Komponente

### Übersicht

Die ColorPicker-Komponente wurde exakt nach dem ct-labelmanager Design implementiert und bietet eine benutzerfreundliche Farbauswahl mit vollständiger ChurchTools-Integration.

### Architektur

```typescript
interface ColorOption {
  value: string    // Eindeutige ID der Farbe
  name: string     // Anzeigename
  hex: string      // Hex-Farbcode
  tailwind?: string // Optional: Tailwind-Klasse
}

interface ColorPickerProps {
  modelValue?: string | null
  placeholder?: string
  colors?: ColorOption[]
}
```

### Verwendung

```vue
<template>
  <ColorPicker 
    v-model="selectedColor"
    :colors="customColors"
    placeholder="Farbe auswählen"
    @update:modelValue="handleColorChange"
  />
</template>

<script setup lang="ts">
import ColorPicker from '@/components/common/ColorPicker.vue'

const selectedColor = ref<string | null>(null)

const customColors: ColorOption[] = [
  { value: 'red', name: 'Rot', hex: '#dc2626' },
  { value: 'blue', name: 'Blau', hex: '#3b82f6' }
]

const handleColorChange = (color: string | null) => {
  console.log('Neue Farbe:', color)
}
</script>
```

### Design-Features

- **Horizontales Layout**: Farbkreis links, Name und Hex-Code rechts
- **4-spaltige Grid-Anordnung** für optimale Übersicht
- **Runde Farbkreise** (24px) mit weißen Rahmen und Schatten
- **Separater "No Color" Bereich** mit X-Symbol
- **Hover-Effekte** mit sanften Animationen
- **Responsive Design** für mobile Geräte

### Standard-Farbpalette

```typescript
const churchToolsColors: ColorOption[] = [
  // System Colors
  { value: 'parent', name: 'Parent', hex: '#6b7280', tailwind: 'gray-500' },
  { value: 'default', name: 'Default', hex: '#6b7280', tailwind: 'gray-500' },
  { value: 'accent', name: 'Accent', hex: '#007cba', tailwind: 'custom' },
  
  // Standard Colors
  { value: 'red', name: 'Red', hex: '#dc2626', tailwind: 'red-600' },
  { value: 'blue', name: 'Blue', hex: '#3b82f6', tailwind: 'blue-500' },
  { value: 'green', name: 'Green', hex: '#16a34a', tailwind: 'green-600' },
  // ... weitere 30+ Farben
]
```

### CSS-Struktur

```scss
.color-picker-modal {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
}

.color-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  max-width: 600px;
}

.color-item {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
  background: #ffffff;
  min-height: 48px;
}

.color-circle {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid #ffffff;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
}
```

## 🔔 Toast-System

### Übersicht

Das Toast-Benachrichtigungssystem bietet benutzerfreundliches Feedback für alle Anwendungsaktionen mit einem modernen, ct-labelmanager-konformen Design.

### Architektur

```typescript
interface Toast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title?: string
  message: string
  duration?: number
  dismissible?: boolean
  persistent?: boolean
}

interface ToastOptions {
  title?: string
  duration?: number
  dismissible?: boolean
  persistent?: boolean
}
```

### useToast Composable

```typescript
import { useToast } from '@/composables/useToast'

const {
  // State
  toasts,
  
  // Core methods
  addToast,
  removeToast,
  clearAllToasts,
  
  // Convenience methods
  showSuccess,
  showError,
  showWarning,
  showInfo,
  
  // API helpers
  showApiSuccess,
  showApiError,
  showValidationError,
  showNetworkError
} = useToast()
```

### Toast-Typen

#### Success Toast
```typescript
showSuccess('Operation erfolgreich', { 
  title: 'Erfolgreich',
  duration: 5000 
})

// API-spezifisch
showApiSuccess('create', 'Neuer Tag')
```

#### Error Toast
```typescript
showError('Ein Fehler ist aufgetreten', { 
  title: 'Fehler',
  duration: 8000 
})

// API-spezifisch
showApiError('delete', 'Verbindung fehlgeschlagen')
```

#### Validation Toast
```typescript
showValidationError('Bitte füllen Sie alle Pflichtfelder aus')
```

### Toast-Komponente

```vue
<template>
  <Teleport to="body">
    <div class="toast-container">
      <TransitionGroup name="toast" tag="div">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="toast"
          :class="[`toast-${toast.type}`, { 'toast-dismissible': toast.dismissible }]"
          @click="toast.dismissible && removeToast(toast.id)"
        >
          <div class="toast-icon">{{ getIcon(toast.type) }}</div>
          <div class="toast-content">
            <div class="toast-title" v-if="toast.title">{{ toast.title }}</div>
            <div class="toast-message">{{ toast.message }}</div>
          </div>
          <button
            v-if="toast.dismissible"
            class="toast-close"
            @click.stop="removeToast(toast.id)"
          >×</button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>
```

### Design-Features

- **Große, prominente Toasts** (min-width: 420px)
- **Farbige Hintergründe** je nach Toast-Typ
- **Smooth Animationen** beim Ein-/Ausblenden
- **Auto-Dismiss** nach konfigurierbarer Zeit
- **Manual Dismiss** durch Klick
- **Responsive Design** für mobile Geräte

### CSS-Struktur

```scss
.toast-container {
  position: fixed;
  top: 24px;
  right: 24px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 500px;
  pointer-events: none;
}

.toast {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 20px 24px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  border-left: 5px solid;
  pointer-events: auto;
  min-width: 420px;
  transition: all 0.3s ease;
}

.toast-success {
  border-left-color: #16a34a;
  background: #f0fdf4;
}

.toast-error {
  border-left-color: #dc2626;
  background: #fef2f2;
}

.toast-warning {
  border-left-color: #f59e0b;
  background: #fffbeb;
}

.toast-info {
  border-left-color: #3b82f6;
  background: #eff6ff;
}
```

### Globale Verfügbarkeit

Für Debugging und Tests sind Toast-Funktionen global verfügbar:

```javascript
// Browser-Konsole
window.toast.success('Test erfolgreich!')
window.toast.error('Test-Fehler')
window.toast.warning('Test-Warnung')
window.toast.info('Test-Info')

// API-Toasts
window.toast.apiSuccess('create', 'Test-Element')
window.toast.apiError('delete', 'Verbindungsfehler')
window.toast.validationError('Pflichtfeld fehlt')
```

## 🏷️ Tags-Verwaltung

### Übersicht

Die Tags-Verwaltung bietet vollständige CRUD-Operationen für ChurchTools-Tags mit erweiterten Features wie Bulk-Operationen, Filterung und Sortierung.

### Komponenten-Architektur

```typescript
interface Tag {
  id: number
  name: string
  description?: string
  color?: string
  domainType: 'person' | 'song' | 'group'
}

interface TagForm {
  name: string
  description: string
  color: string | null
  domainType: string
}
```

### TagsCard.vue

```vue
<template>
  <BaseCard
    title="Tags"
    icon="🏷️"
    :is-loading="isLoading"
    :error="error"
    :main-stat="{ value: tags.length, label: 'Tags gesamt' }"
    :status-stats="domainStats"
    @refresh="loadData"
    @details="navigateToAdmin"
  />
</template>

<script setup lang="ts">
const domainStats = computed(() => [
  {
    key: 'person',
    value: personTagsCount.value,
    label: 'Personen-Tags',
    icon: '👤',
    type: 'info'
  },
  {
    key: 'song',
    value: songTagsCount.value,
    label: 'Song-Tags',
    icon: '🎵',
    type: 'success'
  },
  {
    key: 'group',
    value: groupTagsCount.value,
    label: 'Gruppen-Tags',
    icon: '👥',
    type: 'warning'
  }
])
</script>
```

### TagsAdmin.vue Features

#### 1. CRUD-Operationen

```typescript
// Tag erstellen
const createTag = async (tagData: TagForm) => {
  try {
    await churchtoolsClient.post(`/tags/${tagData.domainType}`, {
      name: tagData.name,
      description: tagData.description,
      color: tagData.color
    })
    showApiSuccess('create', tagData.name)
    await refreshData()
  } catch (err) {
    showApiError('create', err.message)
  }
}

// Tag aktualisieren
const updateTag = async (tagId: number, tagData: TagForm) => {
  try {
    await churchtoolsClient.put(`/tags/${tagId}`, tagData)
    showApiSuccess('update', tagData.name)
    await refreshData()
  } catch (err) {
    showApiError('update', err.message)
  }
}

// Tag löschen
const deleteTag = async (tagId: number) => {
  try {
    await churchtoolsClient.delete(`/tags/${tagId}`)
    showApiSuccess('delete')
    await refreshData()
  } catch (err) {
    showApiError('delete', err.message)
  }
}
```

#### 2. Bulk-Operationen

```typescript
// Bulk-Farb-Update
const applyBulkColor = async () => {
  if (!bulkColor.value) {
    showValidationError('Bitte wählen Sie zuerst eine Farbe aus')
    return
  }
  
  if (selectedTags.value.length === 0) {
    showValidationError('Bitte wählen Sie zuerst Tags aus')
    return
  }
  
  let successCount = 0
  let errorCount = 0
  
  for (const tagId of selectedTags.value) {
    try {
      const tag = tags.value.find(t => t.id === tagId)
      await churchtoolsClient.put(`/tags/${tagId}`, {
        name: tag.name,
        description: tag.description || '',
        color: bulkColor.value
      })
      successCount++
    } catch (err) {
      errorCount++
    }
  }
  
  if (successCount > 0) {
    showApiSuccess('bulkUpdate', `${successCount} Tags`)
  }
  if (errorCount > 0) {
    showApiError('bulkUpdate', `${errorCount} Tags konnten nicht aktualisiert werden`)
  }
}

// Bulk-Löschung
const confirmBulkDelete = async () => {
  let successCount = 0
  let errorCount = 0
  
  for (const tagId of selectedTags.value) {
    try {
      await churchtoolsClient.delete(`/tags/${tagId}`)
      successCount++
    } catch (err) {
      errorCount++
    }
  }
  
  if (successCount > 0) {
    showApiSuccess('bulkDelete', `${successCount} Tags`)
  }
  if (errorCount > 0) {
    showApiError('bulkDelete', `${errorCount} Tags konnten nicht gelöscht werden`)
  }
}
```

#### 3. Erweiterte Filterung

```typescript
// Regex-Filter
const regexFilter = ref('')
const regexError = ref<string | null>(null)

const filteredTags = computed(() => {
  let result = tags.value
  
  // Regex-Filter anwenden
  if (regexFilter.value.trim()) {
    try {
      const regex = new RegExp(regexFilter.value, 'i')
      regexError.value = null
      result = result.filter(tag => 
        regex.test(tag.name) || 
        regex.test(tag.description || '') ||
        regex.test(tag.domainType)
      )
    } catch (err) {
      regexError.value = err.message
    }
  }
  
  return result
})
```

#### 4. Similarity-basierte Sortierung

```typescript
// Farb-Sortierung wie in ct-labelmanager
const sortBy = (field: string) => {
  if (field === 'color') {
    // Spezielle Farbsortierung
    return filteredTags.value.sort((a, b) => {
      const categoryA = getColorCategory(a.color)
      const categoryB = getColorCategory(b.color)
      
      if (categoryA !== categoryB) {
        return categoryA - categoryB
      }
      
      // Innerhalb der Kategorie nach Farbton sortieren
      const hslA = hexToHsl(getColorHex(a.color))
      const hslB = hexToHsl(getColorHex(b.color))
      
      return hslA.h - hslB.h
    })
  }
  
  // Standard-Sortierung für andere Felder
  return filteredTags.value.sort((a, b) => {
    const aValue = String(a[field]).toLowerCase()
    const bValue = String(b[field]).toLowerCase()
    return aValue.localeCompare(bValue)
  })
}
```

### Integration mit ColorPicker und Toast

```vue
<template>
  <div class="tags-admin">
    <!-- Bulk-Operationen -->
    <div class="bulk-controls">
      <ColorPicker 
        v-model="bulkColor" 
        placeholder="Farbe für ausgewählte Tags"
        class="bulk-color-picker"
      />
      <button 
        @click="applyBulkColor"
        :disabled="selectedTags.length === 0 || !bulkColor"
        class="ct-btn ct-btn-primary"
      >
        Farbe anwenden ({{ selectedTags.length }})
      </button>
    </div>
    
    <!-- Tag-Formular -->
    <div class="tag-form">
      <ColorPicker v-model="tagForm.color" />
      <button @click="saveTag" class="ct-btn ct-btn-success">
        {{ editingTag ? 'Aktualisieren' : 'Erstellen' }}
      </button>
    </div>
  </div>
</template>
```

### Performance-Optimierungen

```typescript
// Debounced Search
import { debounce } from 'lodash-es'

const debouncedSearch = debounce((searchTerm: string) => {
  // Filterung durchführen
}, 300)

// Virtualisierung für große Listen
const visibleTags = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredTags.value.slice(start, end)
})

// Memoization für teure Berechnungen
const memoizedColorSort = useMemoize((tags: Tag[]) => {
  return tags.sort(colorSortFunction)
})
```
