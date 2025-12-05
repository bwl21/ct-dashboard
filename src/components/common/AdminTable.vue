<template>
  <div class="admin-table">
    <!-- Header Card -->
    <div class="ct-card header-card">
      <slot name="header-controls"></slot>
    </div>

    <!-- Controls Card -->
    <div class="ct-card controls-card">
      <div class="ct-card-body">
        <div class="controls-row">
          <!-- Search -->
          <div v-if="searchable" class="search-container">
            <input
              v-model="searchTerm"
              type="text"
              :placeholder="searchPlaceholder || 'Suchen...'"
              class="ct-input search-input"
            />
          </div>

          <!-- Custom Filter Slots -->
          <slot name="filters"></slot>

          <!-- Action Buttons -->
          <div class="button-group">
            <slot name="actions"></slot>
          </div>
        </div>
      </div>
    </div>

    <!-- Table Card -->
    <div class="ct-card table-card">
      <div class="ct-card-body">
        <!-- Loading State -->
        <div v-if="loading" class="loading-state">
          <div class="loading-spinner"></div>
          <p>{{ loadingText || 'Lädt...' }}</p>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="error-state">
          <p class="error-message">❌ {{ error }}</p>
          <div class="error-actions">
            <button @click="$emit('retry')" class="ct-btn ct-btn-secondary">
              {{ retryText || 'Erneut versuchen' }}
            </button>
          </div>
          <div v-if="isDevelopment" class="dev-info">
            <p><strong>Entwicklungsmodus:</strong></p>
            <p>Überprüfen Sie die Browser-Konsole für detaillierte Fehlermeldungen.</p>
            <p>Stellen Sie sicher, dass die ChurchTools-Verbindung konfiguriert ist.</p>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else-if="filteredData.length === 0" class="empty-state">
          <p>{{ emptyText || 'Keine Daten gefunden.' }}</p>
          <div class="empty-actions">
            <button @click="$emit('reload')" class="ct-btn ct-btn-primary">
              {{ reloadText || 'Erneut laden' }}
            </button>
            <slot name="empty-actions"></slot>
          </div>
        </div>

        <!-- Table -->
        <div v-else class="table-container">
          <div class="table-header-sticky">
            <h3 class="table-title">{{ title }} ({{ filteredData.length }})</h3>
            <div v-if="hasActiveFilters" class="active-filters">
              <strong>Aktive Filter:</strong>
              <span v-if="searchTerm">Suche: "{{ searchTerm }}"</span>
              | Ergebnisse: {{ filteredData.length }}
            </div>
          </div>

          <table class="admin-data-table" ref="tableRef">
            <thead>
              <tr>
                <th v-if="selectable" class="checkbox-column">
                  <input
                    type="checkbox"
                    :checked="isAllSelected"
                    @change="toggleSelectAll"
                    class="ct-checkbox"
                  />
                </th>
                <th
                  v-for="(column, index) in columns"
                  :key="column.key"
                  :class="{
                    sortable: column.sortable,
                    resizable: column.resizable,
                    active: sortField === column.key,
                  }"
                  :style="{ width: columnWidths[index] + 'px' }"
                  @click="column.sortable && sortBy(column.key)"
                >
                  <!-- Custom Header Slot -->
                  <slot v-if="column.headerSlot" :name="column.headerSlot" :column="column">
                    {{ column.label }}
                  </slot>
                  <!-- Default Header Content -->
                  <template v-else>
                    {{ column.label }}
                    <span v-if="column.sortable && sortField === column.key" class="sort-indicator">
                      {{ sortDirection === 'asc' ? '↑' : '↓' }}
                    </span>
                  </template>

                  <div
                    v-if="column.resizable"
                    class="resize-handle"
                    @mousedown="startResize($event, index)"
                  ></div>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in filteredData" :key="item[rowKey]" class="data-row">
                <td v-if="selectable" class="checkbox-column">
                  <input
                    type="checkbox"
                    :checked="selectedItems.has(item[rowKey])"
                    @change="toggleSelectItem(item[rowKey])"
                    class="ct-checkbox"
                  />
                </td>
                <td v-for="column in columns" :key="column.key">
                  <!-- Custom Cell Rendering via Slots -->
                  <slot
                    v-if="column.cellSlot"
                    :name="column.cellSlot"
                    :item="item"
                    :value="item[column.key]"
                    :column="column"
                  ></slot>
                  <!-- Default Cell Rendering -->
                  <span v-else>{{ item[column.key] }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, readonly } from 'vue'
import type { TableColumn, SortDirection } from '@/types/table'
import { useTableSorting } from '@/composables/useTableSorting'
import { useTableResize } from '@/composables/useTableResize'
import { useTableSearch } from '@/composables/useTableSearch'

interface Props {
  // Data
  data: any[]
  loading: boolean
  error: string | null

  // Table Configuration
  columns: TableColumn[]
  rowKey: string

  // Header
  title: string
  description?: string

  // Search & Filtering
  searchable?: boolean
  searchPlaceholder?: string
  searchFields?: string[]

  // Sorting
  defaultSortField?: string
  defaultSortDirection?: SortDirection

  // Selection
  selectable?: boolean

  // Text customization
  loadingText?: string
  retryText?: string
  reloadText?: string
  emptyText?: string
}

const props = withDefaults(defineProps<Props>(), {
  searchable: true,
  searchPlaceholder: 'Suchen...',
  searchFields: () => [],
  defaultSortDirection: 'asc',
  selectable: false,
  loadingText: 'Lädt...',
  retryText: 'Erneut versuchen',
  reloadText: 'Erneut laden',
  emptyText: 'Keine Daten gefunden.',
})

const emit = defineEmits<{
  retry: []
  reload: []
  'selection-change': [selectedIds: any[]]
}>()

// Development mode detection
const isDevelopment = ref(import.meta.env.MODE === 'development')

// Table reference
const tableRef = ref<HTMLTableElement>()

// Use composables
const dataRef = computed(() => props.data)
const { sortField, sortDirection, sortBy, sortedData } = useTableSorting(
  dataRef,
  props.defaultSortField,
  props.defaultSortDirection
)

const initialWidths = computed(() => props.columns.map((col) => col.width || 150))
const { columnWidths, startResize } = useTableResize(initialWidths.value)

const searchFieldsComputed = computed(() =>
  props.searchFields.length > 0 ? props.searchFields : props.columns.map((col) => col.key)
)
const { searchTerm, filteredData: searchFilteredData } = useTableSearch(
  sortedData,
  searchFieldsComputed.value
)

// Final filtered data (after search and sort)
const filteredData = computed(() => searchFilteredData.value)

// Check if any filters are active
const hasActiveFilters = computed(() => {
  return searchTerm.value !== ''
})

// Selection management
const selectedItems = ref<Set<any>>(new Set())

const isAllSelected = computed(() => {
  return filteredData.value.length > 0 && selectedItems.value.size === filteredData.value.length
})

const toggleSelectAll = () => {
  if (isAllSelected.value) {
    selectedItems.value = new Set()
  } else {
    selectedItems.value = new Set(filteredData.value.map((item) => item[props.rowKey]))
  }
  emit('selection-change', Array.from(selectedItems.value))
}

const toggleSelectItem = (itemId: any) => {
  const newSet = new Set(selectedItems.value)
  if (newSet.has(itemId)) {
    newSet.delete(itemId)
  } else {
    newSet.add(itemId)
  }
  selectedItems.value = newSet
  emit('selection-change', Array.from(selectedItems.value))
}

const clearSelection = () => {
  selectedItems.value = new Set()
  emit('selection-change', [])
}

// Clear search function for parent components
const clearSearch = () => {
  searchTerm.value = ''
}

// Expose search term and clear function for parent components
defineExpose({
  searchTerm: readonly(searchTerm),
  filteredData: readonly(filteredData),
  selectedItems: readonly(selectedItems),
  clearSearch,
  clearSelection,
})
</script>

<style scoped>
.admin-table {
  padding: 0;
  width: 100%;
  margin: 0;
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  color: var(--ct-text-primary, #2c3e50);
  line-height: 1.5;

  /* Ensure consistent light theme variables */
  --ct-bg-primary: #ffffff;
  --ct-bg-secondary: #f8f9fa;
  --ct-bg-tertiary: #e9ecef;
  --ct-text-primary: #2c3e50;
  --ct-text-secondary: #6c757d;
  --ct-border-color: #e0e0e0;
  --ct-bg-hover: #f1f3f5;
  --ct-primary: #3498db;
  --ct-primary-dark: #2980b9;
  --ct-secondary: #6c757d;
  --ct-secondary-dark: #5a6268;
  --ct-success: #28a745;
  --ct-danger: #dc3545;
}

/* Header Card */
.header-card {
  background: var(--ct-bg-primary, #ffffff);
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
  transition: all 0.3s ease;
}

.header-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.ct-card-header {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--ct-border-color, #e0e0e0);
  background: var(--ct-bg-secondary, #f8f9fa);
}

.ct-card-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--ct-text-primary, #2c3e50);
}

.ct-card-body {
  padding: 1.5rem;
}

.description {
  margin: 0 0 1rem 0;
  color: var(--ct-text-secondary, #6c757d);
  font-size: 0.95rem;
}

/* Controls Card */
.controls-card {
  background: var(--ct-bg-primary, #ffffff);
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
  transition: all 0.3s ease;
}

.controls-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.controls-row {
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;
}

.search-container {
  flex: 2;
  min-width: 280px;
}

.search-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid var(--ct-border-color, #e0e0e0);
  border-radius: 6px;
  font-size: 0.95rem;
  background: var(--ct-bg-primary, #ffffff);
  color: var(--ct-text-primary, #2c3e50);
  transition: all 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: var(--ct-primary, #3498db);
  box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.1);
}

.button-group {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

/* Table Card */
.table-card {
  background: var(--ct-bg-primary, #ffffff);
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  min-height: 500px;
  position: relative;
}

.table-header-sticky {
  position: sticky;
  top: 0;
  z-index: 20;
  background: var(--ct-bg-primary, #ffffff);
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--ct-border-color, #e0e0e0);
  margin: 0 -1.5rem 0 -1.5rem;
  height: 80px;
  box-sizing: border-box;
}

.table-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--ct-text-primary, #2c3e50);
}

.table-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

/* Loading, Error, and Empty States */
.loading-state,
.error-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  text-align: center;
  background: var(--ct-bg-secondary, #f8f9fa);
  border-radius: 8px;
  min-height: 200px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(52, 152, 219, 0.2);
  border-radius: 50%;
  border-top-color: var(--ct-primary, #3498db);
  animation: spin 1s ease-in-out infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error-message {
  color: #dc3545;
  margin-bottom: 1rem;
}

.error-actions,
.empty-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
  flex-wrap: wrap;
  justify-content: center;
}

.dev-info {
  margin-top: 1.5rem;
  padding: 1rem;
  background: rgba(52, 152, 219, 0.1);
  border-radius: 6px;
  border-left: 4px solid var(--ct-primary, #3498db);
  text-align: left;
  max-width: 500px;
}

.dev-info p {
  margin: 0.5rem 0;
  font-size: 0.9rem;
}

/* Table Container */
.table-container {
  width: 100%;
  max-width: 100%;
  overflow-x: auto;
  overflow-y: auto;
  border-radius: 8px;
  background: var(--ct-bg-primary, #ffffff);
  margin-bottom: 0;
  -webkit-overflow-scrolling: touch;
  display: block;
  flex: 1;
  height: 60vh;
  max-height: 600px;
  min-height: 400px;
}

.active-filters {
  margin-top: 0.5rem;
  padding: 0.5rem;
  background: #e3f2fd;
  border-radius: 4px;
  font-size: 0.85rem;
}

/* Table */
.admin-data-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: auto;
  margin: 0;
  padding: 0;
}

.admin-data-table th {
  text-align: left;
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--ct-text-secondary, #6c757d);
  background-color: var(--ct-bg-secondary, #f8f9fa);
  white-space: nowrap;
  position: sticky;
  top: 80px;
  z-index: 15;
  letter-spacing: 0.02em;
  box-sizing: border-box;
  border-bottom: 2px solid var(--ct-border-color, #e0e0e0);
}

.admin-data-table td {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--ct-border-color, #f0f2f5);
  vertical-align: middle;
  word-wrap: break-word;
  overflow-wrap: break-word;
  white-space: normal;
  max-width: 300px; /* Default max-width for all cells */
}

/* Specific style for description cells */
.admin-data-table td.description-cell {
  white-space: normal;
  min-width: 200px;
  max-width: 400px;
  word-break: break-word;
}

.admin-data-table th.sortable {
  cursor: pointer;
  user-select: none;
}

.admin-data-table th.sortable:hover {
  background-color: var(--ct-bg-tertiary, #e9ecef);
}

.admin-data-table th.active {
  color: var(--ct-primary, #3498db);
  font-weight: 600;
  position: sticky;
  top: 80px;
  z-index: 15;
}

.sort-indicator {
  margin-left: 0.5rem;
  font-weight: bold;
  display: inline-block;
  color: var(--ct-primary, #3498db);
}

.resize-handle {
  position: absolute;
  top: 0;
  right: 0;
  width: 5px;
  height: 100%;
  background: transparent;
  cursor: col-resize;
  z-index: 1;
}

.resize-handle:hover,
.resize-handle:active {
  background-color: var(--ct-primary, #3498db);
  opacity: 0.5;
}

.data-row:hover {
  background-color: var(--ct-bg-secondary, #f8f9fa);
}

/* Checkbox column */
.checkbox-column {
  width: 40px;
  text-align: center;
  padding: 0.75rem 0.5rem;
}

.ct-checkbox {
  cursor: pointer;
  width: 18px;
  height: 18px;
  accent-color: var(--ct-primary, #3498db);
}

/* Buttons */
.ct-btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  text-decoration: none;
}

.ct-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.ct-btn-primary {
  background-color: var(--ct-primary, #3498db);
  color: white;
}

.ct-btn-primary:hover:not(:disabled) {
  background-color: var(--ct-primary-dark, #2980b9);
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.ct-btn-secondary {
  background-color: var(--ct-secondary, #6c757d);
  color: white;
}

.ct-btn-secondary:hover:not(:disabled) {
  background-color: var(--ct-secondary-dark, #5a6268);
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.ct-btn-outline {
  background: transparent;
  border: 1px solid var(--ct-primary, #3498db);
  color: var(--ct-primary, #3498db);
}

.ct-btn-outline:hover:not(:disabled) {
  background-color: rgba(52, 152, 219, 0.1);
}

.ct-btn-sm {
  padding: 0.5rem 1rem;
  font-size: 0.85rem;
}

/* Responsive Design */
@media (max-width: 1200px) {
  .table-container {
    overflow-x: auto;
  }
}

@media (max-width: 768px) {
  .controls-row {
    flex-direction: column;
    align-items: stretch;
  }

  .search-container {
    width: 100%;
    min-width: auto;
  }

  .button-group {
    justify-content: center;
  }
}
</style>
