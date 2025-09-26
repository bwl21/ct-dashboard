<template>
  <AdminTable
    ref="adminTableRef"
    :data="filteredLogs"
    :loading="loading"
    :error="error"
    :columns="tableColumns"
    row-key="id"
    title="Logger System - Admin Panel"
    description="Überwachung und Verwaltung aller Log-Einträge"
    searchable
    search-placeholder="Log-Einträge durchsuchen..."
    :search-fields="['message', 'source', 'userId', 'details']"
    default-sort-field="timestamp"
    default-sort-order="desc"
    loading-text="Lade Log-Einträge..."
    empty-text="Keine Log-Einträge gefunden."
    @retry="refreshLogs"
    @reload="refreshLogs"
  >
    <!-- Custom Actions -->
    <template #actions>
      <div class="admin-actions">
        <select v-model="selectedDays" @change="changeDaysFilter" class="ct-select">
          <option value="1">Letzter Tag</option>
          <option value="3">Letzte 3 Tage</option>
          <option value="7">Letzte 7 Tage</option>
          <option value="14">Letzte 14 Tage</option>
          <option value="30">Letzter Monat</option>
        </select>
        <select v-model="selectedCategory" @change="filterByCategory" class="ct-select">
          <option value="">Alle Kategorien</option>
          <option v-for="category in availableCategories" :key="category" :value="category">
            {{ getCategoryDisplayName(category) }}
          </option>
        </select>
        <button @click="resetFilters" class="ct-btn ct-btn-secondary" :disabled="loading">
          Filter zurücksetzen
        </button>
        <button @click="refreshLogs" class="ct-btn ct-btn-primary refresh-btn" :disabled="loading">
          {{ loading ? 'Lädt...' : 'Aktualisieren' }}
        </button>
      </div>
    </template>

    <!-- Custom Cell Rendering -->
    <template #cell-level="{ item }">
      <span class="log-level-badge" :class="getCategoryCssClass(item.category)">
        <span class="icon">{{ getCategoryIcon(item.category) }}</span>
      </span>
    </template>

    <template #cell-category="{ item }">
      <span class="category-label">{{ getCategoryDisplayName(item.category) }}</span>
    </template>

    <template #cell-message="{ item }">
      <div class="log-message">
        <div class="message-text">{{ item.message }}</div>
        <div v-if="item.userId || item.details" class="message-details">
          <small v-if="item.userId">Benutzer-ID: {{ item.userId }}</small>
          <small v-if="item.details">{{ item.details }}</small>
        </div>
      </div>
    </template>

    <template #cell-timestamp="{ item }">
      {{ formatTimestamp(item.timestamp) }}
    </template>

    <template #cell-source="{ item }">
      <code class="source-code">{{ item.source }}</code>
    </template>

    <template #cell-actions="{ item }">
      <div class="row-actions">
        <button @click="viewDetails(item)" class="ct-btn ct-btn-sm ct-btn-outline ct-btn-primary-outline" title="Details">
          Details
        </button>
      </div>
    </template>
  </AdminTable>

  <!-- Log Details Modal -->
  <div v-if="selectedLog" class="modal-overlay" @click="closeDetails">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>Log Details</h3>
        <button @click="closeDetails" class="modal-close">×</button>
      </div>
      <div class="modal-body">
        <div class="log-detail-item">
          <strong>Kategorie:</strong>
          <span class="category-detail">
            <span class="log-level-badge" :class="getCategoryCssClass(selectedLog.category)">
              <span class="icon">{{ getCategoryIcon(selectedLog.category) }}</span>
            </span>
            <span class="category-text">{{ getCategoryDisplayName(selectedLog.category) }}</span>
          </span>
        </div>
        <div class="log-detail-item">
          <strong>Zeitstempel:</strong>
          <span>{{ formatTimestamp(selectedLog.timestamp) }}</span>
        </div>
        <div class="log-detail-item">
          <strong>Quelle:</strong>
          <code>{{ selectedLog.source }}</code>
        </div>
        <div class="log-detail-item">
          <strong>Nachricht:</strong>
          <p>{{ selectedLog.message }}</p>
        </div>
        <div class="log-detail-item">
          <strong>Akteur:</strong>
          <span>{{ getActorDisplay(selectedLog) }}</span>
        </div>
        <div v-if="selectedLog.simulatePersonId" class="log-detail-item">
          <strong>Simuliert von:</strong>
          <span>Person ID: {{ selectedLog.simulatePersonId }}</span>
        </div>
        <div v-if="selectedLog.domainType" class="log-detail-item">
          <strong>Domain-Typ:</strong>
          <span>{{ selectedLog.domainType }}</span>
        </div>
        <div v-if="selectedLog.domainId" class="log-detail-item">
          <strong>Domain-ID:</strong>
          <span>{{ selectedLog.domainId }}</span>
        </div>
        <div class="log-detail-item">
          <strong>Original-Level:</strong>
          <span>{{ selectedLog.originalLevel }}</span>
        </div>
        <div v-if="selectedLog.details" class="log-detail-item">
          <strong>Details:</strong>
          <pre>{{ selectedLog.details }}</pre>
        </div>
        <div v-if="selectedLog.stackTrace" class="log-detail-item">
          <strong>Stack Trace:</strong>
          <pre class="stack-trace">{{ selectedLog.stackTrace }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import AdminTable from '../common/AdminTable.vue'
import {
  useLoggerSummary,
  type ProcessedLogEntry,
  LogCategory,
  getCategoryDisplayName,
  getCategoryIcon,
  getCategoryCssClass,
  getAllCategories,
} from './useLoggerSummary'
import { useLoggerSummary as useLoggerSummaryQuery } from '@/composables/useLoggerSummaryQuery'

// Use the ProcessedLogEntry type from the composable
type LogEntry = ProcessedLogEntry

// Props
defineProps<{
  module: {
    id: string
    title: string
    icon: string
    description: string
  }
}>()

// Use composable
const {
  loading,
  error,
  logs: logEntries,
  loadDetailedLogs,
  filterLogsByCategory,
  filterLogsBySearch,
} = useLoggerSummary()

// AdminTable reference
const adminTableRef = ref()

// Local state
const selectedCategory = ref('')
const selectedDays = ref(3)
const selectedLog = ref<LogEntry | null>(null)

// Available categories for filter dropdown
const availableCategories = getAllCategories()

// Table configuration
const tableColumns = [
  {
    key: 'level',
    label: 'Typ',
    sortable: true,
    width: 35,
    resizable: false,
    cellSlot: 'cell-level',
  },
  {
    key: 'category',
    label: 'Kategorie',
    sortable: true,
    width: 140,
    resizable: true,
    cellSlot: 'cell-category',
  },
  {
    key: 'timestamp',
    label: 'Zeitstempel',
    sortable: true,
    width: 160,
    resizable: true,
    cellSlot: 'cell-timestamp',
  },
  {
    key: 'source',
    label: 'Quelle',
    sortable: true,
    width: 120,
    resizable: true,
    cellSlot: 'cell-source',
  },
  {
    key: 'message',
    label: 'Nachricht',
    sortable: true,
    width: 400,
    resizable: true,
    cellSlot: 'cell-message',
  },
  {
    key: 'actions',
    label: 'Aktionen',
    sortable: false,
    width: 120,
    resizable: false,
    cellSlot: 'cell-actions',
  },
]

// Computed
const filteredLogs = computed(() => {
  let filtered = logEntries.value

  // Apply category filter first
  if (selectedCategory.value) {
    filtered = filterLogsByCategory(filtered, selectedCategory.value)
  }

  return filtered
})

// Methods - now using centralized functions from useLoggerSummary
// getCategoryDisplayName, getCategoryIcon, getCategoryCssClass are imported

const getActorDisplay = (log: LogEntry) => {
  if (log.personId === -1) {
    return 'System'
  } else if (log.personId) {
    return `Person ID: ${log.personId}`
  } else {
    return 'Unbekannt'
  }
}

const formatTimestamp = (timestamp: string) => {
  return new Date(timestamp).toLocaleString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

// generateMockLogs function removed - using composable instead

const refreshLogs = async () => {
  await loadDetailedLogs(selectedDays.value, {
    category: selectedCategory.value,
  })
}

const filterByCategory = async () => {
  // Reload logs with new category filter
  await refreshLogs()
}

const changeDaysFilter = async () => {
  // Reload logs with new time range
  await refreshLogs()
}

const resetFilters = async () => {
  // Reset all filters to default values
  selectedCategory.value = ''
  selectedDays.value = 3

  // Reset AdminTable search
  if (adminTableRef.value?.clearSearch) {
    adminTableRef.value.clearSearch()
  }

  // Reload logs with default settings
  await refreshLogs()
}

const viewDetails = (log: LogEntry) => {
  selectedLog.value = log
}

const closeDetails = () => {
  selectedLog.value = null
}

// Initialize
onMounted(() => {
  refreshLogs()
})
</script>

<style scoped>
.admin-actions {
  display: flex;
  gap: var(--spacing-sm);
  align-items: center;
  flex-wrap: wrap;
}

.ct-select {
  padding: 0.5rem;
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-sm);
  background: var(--color-background);
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
}

.log-level-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  width: 32px;
  height: 32px;
  text-align: center;
}

.log-level-badge .icon {
  font-size: 1.2em;
}

.category-success {
  background-color: rgba(40, 167, 69, 0.1);
  color: #28a745;
  border: 1px solid rgba(40, 167, 69, 0.2);
}

.category-info {
  background-color: rgba(52, 152, 219, 0.1);
  color: #3498db;
  border: 1px solid rgba(52, 152, 219, 0.2);
}

.category-warning {
  background-color: rgba(243, 156, 18, 0.1);
  color: #f39c12;
  border: 1px solid rgba(243, 156, 18, 0.2);
}

.category-error {
  background-color: rgba(220, 53, 69, 0.1);
  color: #dc3545;
  border: 1px solid rgba(220, 53, 69, 0.2);
}

.category-neutral {
  background-color: rgba(108, 117, 125, 0.1);
  color: #6c757d;
  border: 1px solid rgba(108, 117, 125, 0.2);
}

.category-label {
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
}

.log-message {
  max-width: calc(var(--spacing-xxl) * 13);
}

.message-text {
  font-weight: var(--font-weight-medium);
  margin-bottom: var(--spacing-xs);
}

.message-details {
  color: var(--color-text-secondary);
  font-size: var(--font-size-xs);
}

.source-code {
  background-color: var(--color-background);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius-sm);
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: var(--font-size-xs);
}

.row-actions {
  display: flex;
  gap: var(--spacing-sm);
  align-items: center;
  justify-content: center;
}

/* ChurchTools Button Styles */
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

.ct-btn-sm {
  padding: 0.5rem 1rem;
  font-size: 0.8rem;
}

.ct-btn-outline {
  background: transparent;
  border: 1px solid var(--color-border);
  color: var(--color-text-primary);
}

.ct-btn-outline:hover {
  background: var(--color-background);
  border-color: var(--color-primary);
  color: var(--color-primary);
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* Action Button Styles */
.action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: calc(var(--spacing-xl) + var(--spacing-sm));
  height: calc(var(--spacing-xl) + var(--spacing-sm));
  border: var(--spacing-xs) solid var(--color-border);
  border-radius: var(--border-radius-sm);
  background: var(--color-background-card);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  cursor: pointer;
  transition: var(--transition-base);
  padding: 0;
  text-decoration: none;
}

.action-btn:hover {
  border-color: var(--color-primary);
  background: var(--color-background);
  color: var(--color-primary);
  transform: translateY(calc(-1 * var(--spacing-xs)));
  box-shadow: var(--shadow-sm);
}

.action-btn:active {
  transform: translateY(0);
  box-shadow: none;
}

.action-btn-view {
  border-color: var(--color-info);
  color: var(--color-info);
}

.action-btn-view:hover {
  background: var(--color-info);
  color: white;
  border-color: var(--color-info);
}

.action-btn:disabled {
  opacity: calc(var(--spacing-sm) / var(--spacing-md));
  cursor: not-allowed;
  transform: none;
}

.action-btn:disabled:hover {
  background: var(--color-background-card);
  color: var(--color-text-secondary);
  border-color: var(--color-border);
  transform: none;
  box-shadow: none;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.modal-content {
  background: var(--color-background-card, #ffffff);
  border-radius: var(--border-radius-lg, 12px);
  box-shadow:
    0 20px 25px -5px rgba(0, 0, 0, 0.1),
    0 10px 10px -5px rgba(0, 0, 0, 0.04);
  max-width: 800px;
  max-height: 80vh;
  width: 90%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 10000;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-lg);
  border-bottom: var(--spacing-xs) solid var(--color-border);
}

.modal-header h3 {
  margin: 0;
  color: var(--color-text-primary);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
}

.modal-close {
  background: none;
  border: none;
  font-size: var(--font-size-xl);
  cursor: pointer;
  color: var(--color-text-secondary);
  padding: 0;
  width: var(--spacing-xxl);
  height: var(--spacing-xxl);
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-close:hover {
  color: var(--color-text-primary);
}

.modal-body {
  padding: var(--spacing-lg);
  overflow-y: auto;
}

.log-detail-item {
  margin-bottom: var(--spacing-md);
  padding: var(--spacing-sm);
  background-color: var(--color-background-muted, #f8f9fa);
  border-radius: var(--border-radius-sm);
  border-left: 3px solid var(--color-primary, #3498db);
}

.category-detail {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.category-text {
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
}

.log-detail-item strong {
  display: inline-block;
  min-width: 140px;
  margin-bottom: 0.25rem;
  margin-right: 0.5rem;
  color: var(--color-text-primary);
  font-weight: 600;
}

.log-detail-item p {
  margin: 0;
  color: var(--color-text-secondary);
  display: inline;
}

.log-detail-item span {
  color: var(--color-text-secondary);
}

.log-detail-item pre {
  background-color: var(--color-background-muted);
  padding: var(--spacing-sm);
  border-radius: var(--border-radius-sm);
  font-family: var(--font-family-mono);
  font-size: var(--font-size-xs);
  overflow-x: auto;
  margin: 0;
}

.stack-trace {
  color: var(--color-error);
  white-space: pre-wrap;
}

/* Ensure ct-btn styles are available */
.ct-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 1rem;
  border: 1px solid transparent;
  border-radius: var(--border-radius-sm, 4px);
  font-size: 0.875rem;
  font-weight: 500;
  line-height: 1.5;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s ease;
  gap: 0.5rem;
}

.ct-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.ct-btn-primary {
  background: transparent;
  border-color: #3498db;
  color: #3498db;
}

.ct-btn-primary:hover:not(:disabled) {
  background: #3498db;
  border-color: #3498db;
  color: white;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(52, 152, 219, 0.3);
}

.ct-btn-danger {
  background: var(--ct-danger, #dc3545);
  border-color: var(--ct-danger, #dc3545);
  color: white;
}

.ct-btn-danger:hover:not(:disabled) {
  background: #c82333;
  border-color: #bd2130;
}

.ct-btn-secondary {
  background: var(--ct-secondary, #6c757d);
  border-color: var(--ct-secondary, #6c757d);
  color: white;
}

.ct-btn-secondary:hover:not(:disabled) {
  background: var(--ct-secondary-dark, #5a6268);
  border-color: var(--ct-secondary-dark, #5a6268);
}

.ct-btn-outline {
  background: transparent;
  border-color: var(--ct-border-color, #e0e0e0);
  color: var(--ct-text-primary, #2c3e50);
}

.ct-btn-outline:hover:not(:disabled) {
  background: var(--ct-bg-hover, #f8f9fa);
  border-color: var(--ct-primary, #3498db);
  color: var(--ct-primary, #3498db);
}

.ct-btn-sm {
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
}

.ct-select {
  padding: 0.5rem;
  border: 1px solid var(--ct-border-color, #e0e0e0);
  border-radius: var(--border-radius-sm, 4px);
  background: var(--ct-bg-primary, #ffffff);
  color: var(--ct-text-primary, #2c3e50);
  font-size: 0.875rem;
  min-width: 150px;
}

.ct-select:focus {
  outline: none;
  border-color: var(--ct-primary, #3498db);
  box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
}

/* Responsive */
@media (max-width: 768px) {
  .admin-actions {
    flex-direction: column;
    align-items: stretch;
    gap: var(--spacing-sm);
  }

  .ct-select {
    width: 100%;
  }

  .modal-content {
    width: 95%;
    max-height: 90vh;
    margin: var(--spacing-sm);
  }

  .modal-header {
    padding: var(--spacing-md);
  }

  .modal-body {
    padding: var(--spacing-md);
  }

  .log-message {
    max-width: none;
  }

  .log-detail-item strong {
    display: block;
    min-width: auto;
    margin-bottom: var(--spacing-xs);
  }

  .log-detail-item {
    padding: var(--spacing-sm);
  }
}

.ct-btn-primary-outline {
  border-color: #3498db !important;
  color: #3498db !important;
}

.ct-btn-primary-outline:hover {
  background: #3498db !important;
  border-color: #3498db !important;
  color: white !important;
}
</style>
