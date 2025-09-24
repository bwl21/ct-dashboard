<template>
  <AdminTable
    :data="filteredLogs"
    :loading="loading"
    :error="error"
    :columns="tableColumns"
    row-key="id"
    title="Logger System - Admin Panel"
    description="Überwachung und Verwaltung aller Log-Einträge"
    searchable
    search-placeholder="Log-Einträge durchsuchen..."
    :search-fields="['message', 'level', 'source', 'email', 'userId']"
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
          <option value="system_error">Systemfehler</option>
          <option value="failed_login">Falsche Passwörter</option>
          <option value="email_sent">Versendete Mails</option>
          <option value="successful_login">Erfolgreiche Anmeldungen</option>
          <option value="other">Sonstige</option>
        </select>
        <button
          @click="clearLogs"
          class="ct-btn ct-btn-danger"
          :disabled="loading"
        >
          Ansicht leeren
        </button>
        <button
          @click="refreshLogs"
          class="ct-btn ct-btn-primary refresh-btn"
          :disabled="loading"
        >
          {{ loading ? 'Lädt...' : 'Aktualisieren' }}
        </button>
      </div>
    </template>

    <!-- Custom Cell Rendering -->
    <template #cell-level="{ item }">
      <span class="log-level-badge" :class="getLevelClass(item.level)">
        {{ getLevelIcon(item.level) }} {{ getCategoryLabel(item.category) }}
      </span>
    </template>

    <template #cell-message="{ item }">
      <div class="log-message">
        <div class="message-text">{{ item.message }}</div>
        <div v-if="item.email || item.userId" class="message-details">
          <small v-if="item.email">E-Mail: {{ item.email }}</small>
          <small v-if="item.userId">User ID: {{ item.userId }}</small>
          <small v-if="item.ipAddress">IP: {{ item.ipAddress }}</small>
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
        <button
          @click="viewDetails(item)"
          class="action-btn action-btn-view"
          title="Details anzeigen"
        >
          👁️
        </button>
        <button
          @click="deleteLog(item.id)"
          class="action-btn action-btn-delete"
          title="Aus Ansicht entfernen"
        >
          🗑️
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
          <span class="log-level-badge" :class="getLevelClass(selectedLog.level)">
            {{ getLevelIcon(selectedLog.level) }} {{ getCategoryLabel(selectedLog.category) }}
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
        <div v-if="selectedLog.email" class="log-detail-item">
          <strong>E-Mail:</strong>
          <span>{{ selectedLog.email }}</span>
        </div>
        <div v-if="selectedLog.userId" class="log-detail-item">
          <strong>Benutzer-ID:</strong>
          <span>{{ selectedLog.userId }}</span>
        </div>
        <div v-if="selectedLog.ipAddress" class="log-detail-item">
          <strong>IP-Adresse:</strong>
          <span>{{ selectedLog.ipAddress }}</span>
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
import { useLoggerSummary, type ProcessedLogEntry } from './useLoggerSummary'

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
  filterLogsBySearch
} = useLoggerSummary()

// Local state
const selectedCategory = ref('')
const selectedDays = ref(3)
const selectedLog = ref<LogEntry | null>(null)

// Table configuration
const tableColumns = [
  {
    key: 'level',
    label: 'Level',
    sortable: true,
    width: 100,
    resizable: true,
    cellSlot: 'cell-level',
  },
  {
    key: 'category',
    label: 'Kategorie',
    sortable: true,
    width: 140,
    resizable: true,
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
  if (!selectedCategory.value) return logEntries.value
  return filterLogsByCategory(logEntries.value, selectedCategory.value)
})

// Methods
const getLevelClass = (level: string) => {
  const classes = {
    success: 'level-success',
    info: 'level-info',
    warning: 'level-warning',
    error: 'level-error',
  }
  return classes[level as keyof typeof classes] || 'level-info'
}

const getLevelIcon = (level: string) => {
  const icons = {
    success: '✅',
    info: '📧',
    warning: '🔒',
    error: '🚨',
  }
  return icons[level as keyof typeof icons] || 'ℹ️'
}

const getCategoryLabel = (category: string) => {
  const labels = {
    system_error: 'Systemfehler',
    failed_login: 'Falsches Passwort',
    email_sent: 'E-Mail versendet',
    successful_login: 'Anmeldung erfolgreich',
  }
  return labels[category as keyof typeof labels] || category
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
    category: selectedCategory.value
  })
}

const filterByCategory = () => {
  // Filter is handled by computed property
  console.log('Filter nach Kategorie:', selectedCategory.value)
}

const changeDaysFilter = () => {
  console.log('Zeitraum geändert:', selectedDays.value, 'Tage')
  refreshLogs() // Reload logs with new time range
}

const clearLogs = async () => {
  if (!confirm('Möchten Sie wirklich alle angezeigten Log-Einträge aus der Ansicht entfernen?')) return
  
  // Clear the logs array (this doesn't delete from ChurchTools, just clears the view)
  logEntries.value = []
  console.log('Alle Logs aus der Ansicht entfernt')
}

const deleteLog = async (id: string) => {
  if (!confirm('Möchten Sie diesen Log-Eintrag aus der Ansicht entfernen?')) return
  
  logEntries.value = logEntries.value.filter(log => log.id !== id)
  console.log('Log aus Ansicht entfernt:', id)
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
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  text-transform: uppercase;
}

.level-success {
  background-color: #e8f5e8;
  color: #2e7d32;
}

.level-info {
  background-color: #e3f2fd;
  color: #1976d2;
}

.level-warning {
  background-color: #fff3e0;
  color: #f57c00;
}

.level-error {
  background-color: #ffebee;
  color: #d32f2f;
}

.log-message {
  max-width: 400px;
}

.message-text {
  font-weight: var(--font-weight-medium);
  margin-bottom: 0.25rem;
}

.message-details {
  color: var(--color-text-secondary);
  font-size: var(--font-size-xs);
}

.source-code {
  background-color: var(--color-background-muted);
  padding: 0.25rem 0.5rem;
  border-radius: var(--border-radius-sm);
  font-family: var(--font-family-mono);
  font-size: var(--font-size-xs);
}

.row-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  justify-content: center;
}

/* Action Button Styles */
.action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid var(--ct-border-color, #e0e0e0);
  border-radius: var(--border-radius-sm, 4px);
  background: var(--ct-bg-primary, #ffffff);
  color: var(--ct-text-secondary, #6c757d);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 0;
  text-decoration: none;
}

.action-btn:hover {
  border-color: var(--ct-primary, #3498db);
  background: var(--ct-bg-hover, #f8f9fa);
  color: var(--ct-primary, #3498db);
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.action-btn:active {
  transform: translateY(0);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.action-btn-view {
  border-color: var(--ct-info, #17a2b8);
  color: var(--ct-info, #17a2b8);
}

.action-btn-view:hover {
  background: var(--ct-info, #17a2b8);
  color: white;
  border-color: var(--ct-info, #17a2b8);
}

.action-btn-delete {
  border-color: var(--ct-warning, #ffc107);
  color: var(--ct-warning, #ffc107);
}

.action-btn-delete:hover {
  background: var(--ct-warning, #ffc107);
  color: white;
  border-color: var(--ct-warning, #ffc107);
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.action-btn:disabled:hover {
  background: var(--ct-bg-primary, #ffffff);
  color: var(--ct-text-secondary, #6c757d);
  border-color: var(--ct-border-color, #e0e0e0);
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
  z-index: 1000;
}

.modal-content {
  background: var(--color-background);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-lg);
  max-width: 600px;
  max-height: 80vh;
  width: 90%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-lg);
  border-bottom: 1px solid var(--color-border);
}

.modal-header h3 {
  margin: 0;
  color: var(--color-text-primary);
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--color-text-secondary);
  padding: 0;
  width: 2rem;
  height: 2rem;
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
}

.log-detail-item strong {
  display: block;
  margin-bottom: 0.25rem;
  color: var(--color-text-primary);
}

.log-detail-item p {
  margin: 0;
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
  background: var(--ct-primary, #3498db);
  border-color: var(--ct-primary, #3498db);
  color: white;
}

.ct-btn-primary:hover:not(:disabled) {
  background: var(--ct-primary-dark, #2980b9);
  border-color: var(--ct-primary-dark, #2980b9);
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
  }

  .modal-content {
    width: 95%;
    max-height: 90vh;
  }

  .log-message {
    max-width: none;
  }
}
</style>