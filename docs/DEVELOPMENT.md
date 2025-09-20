# Entwickler-Dokumentation

## 🏗️ BaseCard-Architektur

### Übersicht
Die BaseCard-Architektur standardisiert das Design und Verhalten aller Dashboard-Karten. Sie reduziert Code-Duplikation und sorgt für konsistente Benutzerführung.

### BaseCard-Komponente

#### TypeScript-Interfaces
```typescript
interface MainStat {
  value: number | string;
  label: string;
}

interface StatusStat {
  key: string;
  value: number | string;
  label: string;
  icon: string;
  type?: 'success' | 'error' | 'warning' | 'info';
}
```

#### Props
```typescript
interface BaseCardProps {
  title: string;                    // Titel der Karte
  icon: string;                     // Emoji-Icon
  isLoading?: boolean;              // Loading-Status
  error?: string | null;            // Fehlermeldung
  mainStat: MainStat;               // Hauptstatistik
  statusStats: StatusStat[];        // Status-Statistiken
  lastUpdate?: string;              // Letzte Aktualisierung
  loadingText?: string;             // Loading-Text
  retryText?: string;               // Retry-Button-Text
  refreshText?: string;             // Refresh-Button-Text
  refreshingText?: string;          // Refreshing-Text
  detailsText?: string;             // Details-Button-Text
  lastUpdateText?: string;          // Last-Update-Label
}
```

#### Events
```typescript
interface BaseCardEvents {
  navigate: [];                     // Navigation zu Details
  refresh: [];                      // Daten aktualisieren
  retry: [];                        // Erneut versuchen
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
import { ref, computed, onMounted } from 'vue';
import BaseCard from './BaseCard.vue';
import type { MainStat, StatusStat } from './BaseCard.vue';

// Props
defineProps<{
  module: {
    id: string;
    title: string;
    icon: string;
    description: string;
  };
}>();

// Events
defineEmits<{
  navigate: [];
}>();

// State
const loading = ref(false);
const error = ref<string | null>(null);
const data = ref({
  total: 0,
  active: 0,
  inactive: 0
});

// Computed Properties
const mainStat = computed((): MainStat => ({
  value: data.value.total,
  label: 'Gesamt'
}));

const statusStats = computed((): StatusStat[] => [
  {
    key: 'active',
    value: data.value.active,
    label: 'Aktiv',
    icon: '✅',
    type: 'success'
  },
  {
    key: 'inactive',
    value: data.value.inactive,
    label: 'Inaktiv',
    icon: '⏸️',
    type: 'warning'
  }
]);

const formattedLastUpdate = computed(() => {
  return new Date().toLocaleString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
});

// Methods
const refreshData = async () => {
  loading.value = true;
  error.value = null;
  
  try {
    // API-Aufruf hier
    const response = await fetch('/api/my-data');
    data.value = await response.json();
  } catch (err) {
    error.value = 'Fehler beim Laden der Daten';
  } finally {
    loading.value = false;
  }
};

// Lifecycle
onMounted(() => {
  refreshData();
});
</script>
```

#### 2. Modul registrieren
```typescript
// src/App.vue
import MyNewCard from './components/MyNewCard.vue';
import MyNewAdmin from './components/MyNewAdmin.vue';

const modules: DashboardModule[] = [
  // ... existing modules
  {
    id: 'my-new-module',
    title: 'Mein Neues Modul',
    icon: '🚀',
    description: 'Beschreibung des neuen Moduls',
    cardComponent: MyNewCard,
    adminComponent: MyNewAdmin
  }
];
```

## 🔧 Admin-Panel-Entwicklung

### Filter-System implementieren

#### 1. Filter-State definieren
```typescript
// Filter-Variablen
const searchTerm = ref('');
const categoryFilter = ref('');
const statusFilter = ref('');

// Verfügbare Optionen
const availableCategories = computed(() => {
  // Aus Daten generieren
  const categories = new Set();
  data.value.forEach(item => {
    if (item.category) categories.add(item.category);
  });
  return Array.from(categories).sort();
});
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
      <button
        @click="clearFilters"
        class="ct-btn ct-btn-secondary"
        :disabled="!hasActiveFilters"
      >
        Filter löschen
      </button>
    </div>
  </div>
</template>
```

#### 3. Filter-Logik implementieren
```typescript
const filteredData = computed(() => {
  let filtered = data.value;
  
  // Suchfilter
  if (searchTerm.value) {
    const term = searchTerm.value.toLowerCase().trim();
    filtered = filtered.filter(item =>
      item.name.toLowerCase().includes(term) ||
      item.id.toString().includes(term)
    );
  }
  
  // Kategorie-Filter
  if (categoryFilter.value) {
    filtered = filtered.filter(item => 
      item.category === categoryFilter.value
    );
  }
  
  // Status-Filter
  if (statusFilter.value) {
    filtered = filtered.filter(item => 
      item.status === statusFilter.value
    );
  }
  
  return filtered;
});

const hasActiveFilters = computed(() => {
  return searchTerm.value !== '' || 
         categoryFilter.value !== '' || 
         statusFilter.value !== '';
});

const clearFilters = () => {
  searchTerm.value = '';
  categoryFilter.value = '';
  statusFilter.value = '';
};
```

### Sortierbare Tabelle

#### 1. Sortier-State
```typescript
const sortField = ref<string>('id');
const sortDirection = ref<'asc' | 'desc'>('asc');

const sortBy = (field: string) => {
  if (sortField.value === field) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortField.value = field;
    sortDirection.value = 'asc';
  }
};
```

#### 2. Sortier-Logik
```typescript
const sortedData = computed(() => {
  const sorted = [...filteredData.value];
  
  sorted.sort((a, b) => {
    let aVal = a[sortField.value];
    let bVal = b[sortField.value];
    
    // Spezielle Behandlung für verschiedene Datentypen
    if (sortField.value === 'date') {
      aVal = new Date(aVal);
      bVal = new Date(bVal);
    }
    
    let comparison = 0;
    if (aVal < bVal) comparison = -1;
    if (aVal > bVal) comparison = 1;
    
    return sortDirection.value === 'asc' ? comparison : -comparison;
  });
  
  return sorted;
});
```

#### 3. Tabellen-Header
```vue
<template>
  <thead>
    <tr>
      <th @click="sortBy('id')" class="sortable">
        ID
        <span class="sort-indicator" v-if="sortField === 'id'">
          {{ sortDirection === 'asc' ? '↑' : '↓' }}
        </span>
      </th>
      <th @click="sortBy('name')" class="sortable">
        Name
        <span class="sort-indicator" v-if="sortField === 'name'">
          {{ sortDirection === 'asc' ? '↑' : '↓' }}
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
import { churchtoolsClient } from '@churchtools/churchtools-client';

export interface MyDataItem {
  id: number;
  name: string;
  status: string;
  createdAt: string;
}

export async function fetchMyData(): Promise<MyDataItem[]> {
  try {
    const response = await churchtoolsClient.get<MyDataItem[]>('/my-endpoint');
    return response || [];
  } catch (error) {
    console.error('Error fetching data:', error);
    throw new Error('Fehler beim Laden der Daten');
  }
}

export async function updateMyData(id: number, data: Partial<MyDataItem>): Promise<MyDataItem> {
  try {
    const response = await churchtoolsClient.put<MyDataItem>(`/my-endpoint/${id}`, data);
    return response;
  } catch (error) {
    console.error('Error updating data:', error);
    throw new Error('Fehler beim Aktualisieren der Daten');
  }
}
```

### Error Handling
```typescript
const handleApiError = (error: any): string => {
  if (error.response) {
    switch (error.response.status) {
      case 401:
        return 'Nicht authentifiziert. Bitte melden Sie sich an.';
      case 403:
        return 'Keine Berechtigung für diese Aktion.';
      case 404:
        return 'Daten nicht gefunden.';
      case 500:
        return 'Serverfehler. Bitte versuchen Sie es später erneut.';
      default:
        return `HTTP ${error.response.status}: ${error.response.statusText}`;
    }
  }
  
  if (error.message) {
    return error.message;
  }
  
  return 'Ein unbekannter Fehler ist aufgetreten.';
};
```

## 🧪 Testing

### Komponenten-Tests
```typescript
// tests/components/MyCard.test.ts
import { mount } from '@vue/test-utils';
import MyCard from '@/components/MyCard.vue';

describe('MyCard', () => {
  it('renders correctly', () => {
    const wrapper = mount(MyCard, {
      props: {
        module: {
          id: 'test',
          title: 'Test Module',
          icon: '🧪',
          description: 'Test Description'
        }
      }
    });
    
    expect(wrapper.text()).toContain('Test Module');
  });
  
  it('emits navigate event on button click', async () => {
    const wrapper = mount(MyCard, {
      props: { /* ... */ }
    });
    
    await wrapper.find('.details-button').trigger('click');
    expect(wrapper.emitted('navigate')).toBeTruthy();
  });
});
```

### API-Tests
```typescript
// tests/services/churchtools.test.ts
import { fetchMyData } from '@/services/churchtools';

// Mock ChurchTools Client
jest.mock('@churchtools/churchtools-client', () => ({
  churchtoolsClient: {
    get: jest.fn()
  }
}));

describe('ChurchTools Service', () => {
  it('fetches data successfully', async () => {
    const mockData = [{ id: 1, name: 'Test' }];
    (churchtoolsClient.get as jest.Mock).mockResolvedValue(mockData);
    
    const result = await fetchMyData();
    expect(result).toEqual(mockData);
  });
});
```

## 📦 Build & Deployment

### Vite-Konfiguration
```typescript
// vite.config.ts
export default defineConfig({
  plugins: [vue()],
  base: '/ccm/ctdashboard/',
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['vue', '@churchtools/churchtools-client']
        }
      }
    }
  }
});
```

### Package-Script
```javascript
// scripts/package.js
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

// Build-Verzeichnis komprimieren
const createPackage = () => {
  const output = fs.createWriteStream('releases/package.zip');
  const archive = archiver('zip', { zlib: { level: 9 } });
  
  archive.pipe(output);
  archive.directory('dist/', false);
  archive.finalize();
};
```

## 🔍 Debugging

### Development Tools
```typescript
// main.ts
if (import.meta.env.DEV) {
  // Vue DevTools
  app.config.performance = true;
  
  // Global Error Handler
  app.config.errorHandler = (err, vm, info) => {
    console.error('Vue Error:', err, info);
  };
}
```

### Console Logging
```typescript
// Strukturiertes Logging
const logger = {
  info: (message: string, data?: any) => {
    console.log(`[INFO] ${message}`, data);
  },
  error: (message: string, error?: any) => {
    console.error(`[ERROR] ${message}`, error);
  },
  debug: (message: string, data?: any) => {
    if (import.meta.env.DEV) {
      console.debug(`[DEBUG] ${message}`, data);
    }
  }
};
```

## 🚀 Performance-Optimierung

### Lazy Loading
```typescript
// Router-basiertes Lazy Loading
const routes = [
  {
    path: '/admin',
    component: () => import('@/components/AdminPanel.vue')
  }
];
```

### Computed Caching
```typescript
// Teure Berechnungen cachen
const expensiveComputation = computed(() => {
  return data.value.reduce((acc, item) => {
    // Komplexe Berechnung
    return acc + item.value;
  }, 0);
});
```

### Virtual Scrolling
```vue
<!-- Für große Listen -->
<template>
  <virtual-list
    :data-sources="largeDataSet"
    :data-component="ItemComponent"
    :estimate-size="50"
  />
</template>
```