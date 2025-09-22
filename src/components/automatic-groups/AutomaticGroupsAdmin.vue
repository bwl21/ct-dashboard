<template>
  <AdminTable
    :data="groups"
    :loading="loading"
    :error="error"
    :columns="tableColumns"
    row-key="id"
    title="Automatische Gruppen - Admin Panel"
    description="Überwachung und Verwaltung aller automatischen Gruppen"
    searchable
    search-placeholder="Gruppen durchsuchen..."
    :search-fields="['name', 'groupTypeId']"
    default-sort-field="id"
    loading-text="Lade automatische Gruppen..."
    empty-text="Keine automatischen Gruppen gefunden."
    @retry="refreshGroups"
    @reload="refreshGroups"
  >
    <!-- Custom Actions -->
    <template #actions>
      <button
        @click="refreshGroups"
        class="ct-btn ct-btn-primary refresh-btn"
        :disabled="loading"
      >
        {{ loading ? 'Lädt...' : 'Aktualisieren' }}
      </button>
    </template>

    <!-- Custom Cell Rendering -->
    <template #cell-name="{ item }">
      <strong>{{ item.name }}</strong>
    </template>

    <template #cell-config="{ item }">
      <span class="status-badge" :class="getConfigStatusClass(item.dynamicGroupStatus)">
        {{ getConfigStatusText(item.dynamicGroupStatus) }}
      </span>
    </template>

    <template #cell-status="{ item }">
      <span class="status-badge" :class="getExecutionStatusClass(item.executionStatus)">
        {{ getExecutionStatusText(item.executionStatus) }}
      </span>
    </template>

    <template #cell-lastExecution="{ item }">
      {{ formatDate(item.lastExecution) }}
    </template>

    <template #cell-actions="{ item }">
      <a
        :href="getGroupUrl(item.id)"
        target="_blank"
        rel="noopener noreferrer"
        class="ct-btn ct-btn-sm ct-btn-outline"
        title="Gruppe in ChurchTools öffnen"
      >
        Öffnen
      </a>
    </template>
  </AdminTable>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import type { DashboardModule } from '@/types/modules'
import type { TableColumn } from '@/types/table'
import AdminTable from '@/components/shared/AdminTable.vue'
import { useAutomaticGroups } from '@/composables/useAutomaticGroups'

defineProps<{
  module: DashboardModule
}>()

// Use composable for data management
const { groups, loading, error, fetchAutomaticGroups } = useAutomaticGroups()

// Table configuration
const tableColumns: TableColumn[] = [
  { key: 'id', label: 'Gruppen-ID', sortable: true, resizable: true, width: 100 },
  { key: 'groupTypeId', label: 'Gruppentyp', sortable: true, resizable: true, width: 120 },
  { key: 'name', label: 'Name', sortable: true, resizable: true, width: 200, cellSlot: 'cell-name' },
  { key: 'dynamicGroupStatus', label: 'Konfiguration', sortable: true, resizable: true, width: 150, cellSlot: 'cell-config' },
  { key: 'lastExecution', label: 'Letzte Ausführung', sortable: true, resizable: true, width: 180, cellSlot: 'cell-lastExecution' },
  { key: 'executionStatus', label: 'Status', sortable: true, resizable: true, width: 120, cellSlot: 'cell-status' },
  { key: 'actions', label: 'Aktionen', resizable: false, width: 100, cellSlot: 'cell-actions' }
]

// Helper functions

const getConfigStatusClass = (status: string) => {
  switch (status) {
    case 'active':
      return 'status-active'
    case 'inactive':
      return 'status-inactive'
    case 'error':
      return 'status-error'
    default:
      return 'status-unknown'
  }
}

const getConfigStatusText = (status: string) => {
  switch (status) {
    case 'active':
      return 'Aktiv'
    case 'inactive':
      return 'Inaktiv'
    case 'error':
      return 'Fehler'
    default:
      return 'Unbekannt'
  }
}

const getExecutionStatusClass = (status: string) => {
  switch (status) {
    case 'success':
      return 'status-success'
    case 'error':
      return 'status-error'
    case 'running':
      return 'status-running'
    default:
      return 'status-unknown'
  }
}

const getExecutionStatusText = (status: string) => {
  switch (status) {
    case 'success':
      return 'Erfolgreich'
    case 'error':
      return 'Fehler'
    case 'running':
      return 'Läuft'
    default:
      return 'Unbekannt'
  }
}

const formatDate = (dateString: string | null) => {
  if (!dateString) return 'Nie'
  
  try {
    const date = new Date(dateString)
    return date.toLocaleString('de-DE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return 'Ungültiges Datum'
  }
}

const getGroupUrl = (groupId: number) => {
  const churchtoolsBaseUrl = import.meta.env.DEV
    ? import.meta.env.VITE_BASE_URL
    : window.location.origin
  return `${churchtoolsBaseUrl}?q=churchdb&view=GroupView&id=${groupId}`
}

// Data loading
const refreshGroups = () => {
  fetchAutomaticGroups()
}



// Initialize
onMounted(() => {
  fetchAutomaticGroups()
})
</script>

<style scoped>
/* Status badges */
.status-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: capitalize;
}

.status-active {
  background-color: rgba(40, 167, 69, 0.1);
  color: #28a745;
}

.status-inactive {
  background-color: rgba(108, 117, 125, 0.1);
  color: #6c757d;
}

.status-success {
  background-color: rgba(40, 167, 69, 0.1);
  color: #28a745;
}

.status-error {
  background-color: rgba(220, 53, 69, 0.1);
  color: #dc3545;
}

.status-running {
  background-color: rgba(23, 162, 184, 0.1);
  color: #17a2b8;
}

.status-unknown {
  background-color: rgba(108, 117, 125, 0.1);
  color: #6c757d;
}

/* Button styles */
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
</style>