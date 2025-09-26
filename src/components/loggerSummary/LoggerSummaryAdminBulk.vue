<template>
  <AdminTable
    ref="adminTableRef"
    :data="paginatedLogs"
    :loading="isLoading"
    :error="error?.message || null"
    :columns="tableColumns"
    row-key="id"
    title="Logger System - Admin Panel (Bulk Cache)"
    description="Überwachung und Verwaltung aller Log-Einträge"
    searchable
    search-placeholder="Log-Einträge durchsuchen..."
    :search-fields="['message', 'source', 'userId', 'details']"
    default-sort-field="level"
    default-sort-order="desc"
    loading-text="Lade Log-Einträge..."
    empty-text="Keine Log-Einträge gefunden."
    @retry="refetch"
    @reload="refetch"
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

        <select v-model="selectedCategory" @change="applyFilters" class="ct-select">
          <option value="">Alle Kategorien</option>
          <option v-for="category in categories" :key="category" :value="category">
            {{ getCategoryDisplayName(category) }}
          </option>
        </select>

        <div class="bulk-info">
          <span class="info-text">
            {{ allProcessedLogs.length }} Einträge
            <span v-if="actualDays !== selectedDays" class="limited-indicator">
              ({{ actualDays }} Tage)
            </span>
          </span>
        </div>
      </div>
    </template>

    <!-- Custom Pagination -->
    <template #pagination>
      <div class="custom-pagination">
        <button @click="prevPage" :disabled="!hasPrevPage" class="ct-btn ct-btn-outline ct-btn-sm">
          ← Zurück
        </button>

        <span class="page-info">
          Seite {{ currentPage }} von {{ totalPages }} ({{ paginatedLogs.length }} von
          {{ allProcessedLogs.length }} Einträgen)
        </span>

        <button @click="nextPage" :disabled="!hasNextPage" class="ct-btn ct-btn-outline ct-btn-sm">
          Weiter →
        </button>
      </div>
    </template>

    <!-- EXACT copy from working LoggerSummaryAdmin.vue -->
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
        <button @click="viewDetails(item)" class="ct-btn ct-btn-sm ct-btn-outline ct-btn--outline" title="Details">
          Details
        </button>
      </div>
    </template>
  </AdminTable>

  <!-- Log Details Modal - EXACT copy from working LoggerSummaryAdmin.vue -->
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
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import AdminTable from '../common/AdminTable.vue'
import {
  useLoggerBulkCache,
  usePaginatedLogs,
  getCategoryDisplayName,
  getCategoryIcon,
  getCategoryCssClass,
  getAllCategories,
  type ProcessedLogEntry,
} from '@/composables/useLoggerBulkCache'
import { useToast } from '@/composables/useToast'
import type { TableColumn } from '@/types/table'

// Props
defineProps<{
  module: {
    id: string
    title: string
    icon: string
    description: string
  }
}>()

// Toast functionality
const { showInfo, showWarning } = useToast()

// State
const selectedDays = ref(3)
const selectedCategory = ref('')
const searchTerm = ref('')

// Use bulk cache with reactive days
const {
  processedLogs: allProcessedLogs,
  statistics,
  isLoading,
  isFetching,
  error,
  refetch,
  actualDays,
  wasLimited,
  limitReason,
} = useLoggerBulkCache(selectedDays)

// Watch for limitation and show toast
watch(
  [wasLimited, limitReason],
  ([limited, reason]) => {
    if (limited && reason) {
      showWarning(reason)
    }
  },
  { immediate: true }
)

// Filter logs by category and search
const filteredLogs = computed(() => {
  let logs = allProcessedLogs.value

  // Filter by category
  if (selectedCategory.value) {
    logs = logs.filter((log) => log.category === selectedCategory.value)
  }

  // Filter by search term
  if (searchTerm.value) {
    const term = searchTerm.value.toLowerCase()
    logs = logs.filter(
      (log) =>
        log.message.toLowerCase().includes(term) ||
        log.source.toLowerCase().includes(term) ||
        log.details?.toLowerCase().includes(term)
    )
  }

  return logs
})

// Client-side pagination
const {
  paginatedLogs,
  currentPage,
  totalPages,
  hasNextPage,
  hasPrevPage,
  nextPage,
  prevPage,
  goToPage,
} = usePaginatedLogs(filteredLogs, 50)

// Categories for filter dropdown
const categories = getAllCategories()

// Table configuration
const tableColumns: TableColumn[] = [
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

// Methods
const changeDaysFilter = () => {
  // This will trigger a new query with the new days value
  // The reactivity will handle the rest
}

const applyFilters = () => {
  // Reset to first page when filters change
  goToPage(1)
}

// Modal state
const selectedLog = ref<ProcessedLogEntry | null>(null)

// Functions - EXACT copy from working LoggerSummaryAdmin.vue
const viewDetails = (log: ProcessedLogEntry) => {
  selectedLog.value = log
}

const closeDetails = () => {
  selectedLog.value = null
}

const getActorDisplay = (log: ProcessedLogEntry) => {
  if (log.personId === -1) {
    return 'System'
  }
  return `Person ID: ${log.personId}`
}

const formatTimestamp = (timestamp: string) => {
  return new Date(timestamp).toLocaleString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

// The query will automatically refetch when selectedDays changes
// due to the reactive queryKey in the composable

// Show toast when loading new data to explain wait time
watch(
  isFetching,
  (fetching) => {
    if (fetching) {
      showInfo('🔄 Logger-Daten werden aktualisiert...')
    }
  },
  { immediate: true } // Trigger immediately if already fetching
)
</script>

<style scoped>
/* EXACT copy from working LoggerSummaryAdmin.vue */
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

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: var(--color-background-card);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-lg);
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-lg);
  border-bottom: 1px solid var(--color-border);
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--color-text-secondary);
}

.modal-body {
  padding: var(--spacing-lg);
}

.log-detail-item {
  margin-bottom: var(--spacing-md);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.log-detail-item strong {
  color: var(--color-text-primary);
  font-weight: var(--font-weight-semibold);
}

.category-detail {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.category-text {
  font-weight: var(--font-weight-medium);
}

/* Bulk Cache specific styles */
.bulk-info {
  margin-left: auto;
}

.info-text {
  font-size: 14px;
  color: var(--color-text-secondary);
}

.limited-indicator {
  color: var(--color-warning);
  font-weight: 500;
}

.custom-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 16px;
  border-top: 1px solid var(--color-border);
}

.page-info {
  font-size: 14px;
  color: var(--color-text-secondary);
}

.ct-btn-primary {
  background: transparent;
  border: 1px solid #3498db;
  color: #3498db;
}

.ct-btn-primary:hover {
  background: #3498db;
  border-color: #3498db;
  color: white;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(52, 152, 219, 0.3);
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

@media (max-width: 768px) {
  .admin-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .bulk-info {
    margin-left: 0;
    margin-top: 8px;
  }
}
</style>
