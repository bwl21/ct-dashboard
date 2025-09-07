<template>
  <div class="automatic-groups-admin">
    <!-- Header Card -->
    <div class="ct-card header-card">
      <div class="ct-card-header">
        <h1 class="ct-card-title">Automatische Gruppen - Admin Panel</h1>
      </div>
      <div class="ct-card-body">
        <p class="description">Überwachung und Verwaltung aller automatischen Gruppen</p>
      </div>
    </div>

    <!-- Controls Card -->
    <div class="ct-card controls-card">
      <div class="ct-card-body">
        <div class="controls-row">
          <div class="search-container">
            <input
              v-model="searchTerm"
              type="text"
              placeholder="Gruppen durchsuchen..."
              class="ct-input search-input"
            />
          </div>
          <div class="button-group">
            <button
              @click="refreshGroups"
              class="ct-btn ct-btn-primary refresh-btn"
              :disabled="loading"
            >
              {{ loading ? 'Lädt...' : 'Aktualisieren' }}
            </button>
            <button
              @click="loadMockData"
              class="ct-btn ct-btn-outline mock-btn"
              :disabled="loading"
              title="Lädt Beispieldaten zum Testen der Oberfläche"
            >
              Mock-Daten
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Groups Table Card -->
    <div class="ct-card table-card">
      <div class="ct-card-header">
        <h3 class="ct-card-title">
          Automatische Gruppen ({{ filteredGroups.length }})
        </h3>
      </div>
      <div class="ct-card-body">
        <div v-if="loading" class="loading-state">
          <div class="loading-spinner"></div>
          <p>Lade automatische Gruppen...</p>
        </div>
        
        <div v-else-if="error" class="error-state">
          <p class="error-message">❌ {{ error }}</p>
          <div class="error-actions">
            <button @click="refreshGroups" class="ct-btn ct-btn-secondary">
              Erneut versuchen
            </button>
            <button @click="loadMockData" class="ct-btn ct-btn-outline">
              Mock-Daten laden
            </button>
          </div>
          <div v-if="isDevelopment" class="dev-info">
            <p><strong>Entwicklungsmodus:</strong></p>
            <p>Überprüfen Sie die Browser-Konsole für detaillierte Fehlermeldungen.</p>
            <p>Stellen Sie sicher, dass die ChurchTools-Verbindung konfiguriert ist.</p>
          </div>
        </div>

        <div v-else-if="filteredGroups.length === 0" class="empty-state">
          <p>Keine automatischen Gruppen gefunden.</p>
          <div class="empty-actions">
            <button @click="refreshGroups" class="ct-btn ct-btn-primary">
              Erneut laden
            </button>
            <button @click="loadMockData" class="ct-btn ct-btn-secondary">
              Mock-Daten laden (für Demo)
            </button>
          </div>
        </div>

        <div v-else class="table-container">
          <table class="groups-table" ref="tableRef">
            <thead>
              <tr>
                <th @click="sortBy('id')" class="sortable resizable" :style="{ width: columnWidths[0] + 'px' }">
                  Gruppen-ID
                  <span class="sort-indicator" v-if="sortField === 'id'">
                    {{ sortDirection === 'asc' ? '↑' : '↓' }}
                  </span>
                  <div class="resize-handle" @mousedown="startResize($event, 0)"></div>
                </th>
                <th @click="sortBy('name')" class="sortable resizable" :style="{ width: columnWidths[1] + 'px' }">
                  Name
                  <span class="sort-indicator" v-if="sortField === 'name'">
                    {{ sortDirection === 'asc' ? '↑' : '↓' }}
                  </span>
                  <div class="resize-handle" @mousedown="startResize($event, 1)"></div>
                </th>
                <th @click="sortBy('dynamicGroupStatus')" class="sortable resizable" :style="{ width: columnWidths[2] + 'px' }">
                  Konfiguration
                  <span class="sort-indicator" v-if="sortField === 'dynamicGroupStatus'">
                    {{ sortDirection === 'asc' ? '↑' : '↓' }}
                  </span>
                  <div class="resize-handle" @mousedown="startResize($event, 2)"></div>
                </th>
                <th @click="sortBy('lastExecution')" class="sortable resizable" :style="{ width: columnWidths[3] + 'px' }">
                  Letzte Ausführung
                  <span class="sort-indicator" v-if="sortField === 'lastExecution'">
                    {{ sortDirection === 'asc' ? '↑' : '↓' }}
                  </span>
                  <div class="resize-handle" @mousedown="startResize($event, 3)"></div>
                </th>
                <th @click="sortBy('executionStatus')" class="sortable resizable" :style="{ width: columnWidths[4] + 'px' }">
                  Status
                  <span class="sort-indicator" v-if="sortField === 'executionStatus'">
                    {{ sortDirection === 'asc' ? '↑' : '↓' }}
                  </span>
                  <div class="resize-handle" @mousedown="startResize($event, 4)"></div>
                </th>
                <th :style="{ width: columnWidths[5] + 'px' }">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="group in filteredGroups" :key="group.id" class="group-row">
                <td class="group-id" :style="{ width: columnWidths[0] + 'px' }">{{ group.id }}</td>
                <td class="group-name" :style="{ width: columnWidths[1] + 'px' }">
                  <strong>{{ group.name }}</strong>
                </td>
                <td class="group-config" :style="{ width: columnWidths[2] + 'px' }">
                  <span class="status-badge" :class="getConfigStatusClass(group.dynamicGroupStatus)">
                    {{ getConfigStatusText(group.dynamicGroupStatus) }}
                  </span>
                </td>
                <td class="last-execution" :style="{ width: columnWidths[3] + 'px' }">
                  {{ formatDate(group.lastExecution) }}
                </td>
                <td class="execution-status" :style="{ width: columnWidths[4] + 'px' }">
                  <span class="status-badge" :class="getExecutionStatusClass(group.executionStatus)">
                    {{ getExecutionStatusText(group.executionStatus) }}
                  </span>
                </td>
                <td class="actions" :style="{ width: columnWidths[5] + 'px' }">
                  <a
                    :href="getGroupUrl(group.id)"
                    target="_blank"
                    class="ct-btn ct-btn-sm ct-btn-outline"
                    title="Gruppe öffnen"
                  >
                    Öffnen
                  </a>
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
import { ref, computed, onMounted } from 'vue';
import { churchtoolsClient } from '@churchtools/churchtools-client';
import type { Group, DynamicGroupStatus } from '../ct-types';

interface AutomaticGroup {
  id: number;
  name: string;
  dynamicGroupStatus: DynamicGroupStatus;
  lastExecution: string | null;
  executionStatus: 'success' | 'error' | 'running' | 'pending' | 'unknown';
  dynamicGroupUpdateStarted: string | null;
  dynamicGroupUpdateFinished: string | null;
}

const groups = ref<AutomaticGroup[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const searchTerm = ref('');
const sortField = ref<keyof AutomaticGroup>('id');
const sortDirection = ref<'asc' | 'desc'>('asc');
const isDevelopment = ref(import.meta.env.MODE === 'development');

// Column resizing
const tableRef = ref<HTMLTableElement>();
const columnWidths = ref([100, 200, 150, 180, 120, 100]); // Default widths
const isResizing = ref(false);
const resizingColumn = ref(-1);
const startX = ref(0);
const startWidth = ref(0);

const filteredGroups = computed(() => {
  let filtered = groups.value;

  // Filter by search term
  if (searchTerm.value) {
    const term = searchTerm.value.toLowerCase();
    filtered = filtered.filter(group =>
      group.name.toLowerCase().includes(term) ||
      group.id.toString().includes(term)
    );
  }

  // Sort
  filtered.sort((a, b) => {
    const aVal = a[sortField.value];
    const bVal = b[sortField.value];
    
    let comparison = 0;
    if (aVal < bVal) comparison = -1;
    if (aVal > bVal) comparison = 1;
    
    return sortDirection.value === 'asc' ? comparison : -comparison;
  });

  return filtered;
});

const sortBy = (field: keyof AutomaticGroup) => {
  if (sortField.value === field) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortField.value = field;
    sortDirection.value = 'asc';
  }
};

const refreshGroups = async () => {
  loading.value = true;
  error.value = null;

  try {
    console.log('Fetching groups from ChurchTools API...');
    
    let allGroups: Group[] = [];
    let page = 1;
    const limit = 100; // ChurchTools API Standard
    let hasMore = true;

    // Fetch all groups with proper pagination
    while (hasMore) {
      console.log(`Fetching page ${page} with limit ${limit}...`);
      
      const response = await churchtoolsClient.get(`/groups?include=settings&limit=${limit}&page=${page}`);

      console.log(`API Response for page ${page}:`, response);
      console.log('Response type:', typeof response);
      console.log('Response keys:', Object.keys(response || {}));

      // Handle different possible response formats
      let pageGroups: Group[] = [];
      
      if (Array.isArray(response)) {
        // Direct array response
        pageGroups = response;
      } else if (response && response.data && Array.isArray(response.data)) {
        // Wrapped in data property
        pageGroups = response.data;
      } else if (response && Array.isArray(response.groups)) {
        // Wrapped in groups property
        pageGroups = response.groups;
      } else {
        console.error('Unexpected API response format:', response);
        throw new Error(`Invalid API response format. Expected array or object with data/groups property, got: ${typeof response}`);
      }

      console.log(`Groups found on page ${page}:`, pageGroups.length);
      
      if (pageGroups.length === 0) {
        // No more groups
        hasMore = false;
      } else {
        // Add groups to total collection
        allGroups = allGroups.concat(pageGroups);
        
        // Check if we got fewer results than the limit (indicates last page)
        if (pageGroups.length < limit) {
          hasMore = false;
        } else {
          page++;
          
          // Safety limit to prevent infinite loops
          if (page > 100) {
            console.warn('Reached safety limit of 100 pages');
            hasMore = false;
          }
        }
      }
    }

    console.log('Total groups found across all pages:', allGroups.length);

    // Filter for automatic groups (those with dynamic group rules)
    const automaticGroups = allGroups
      .filter(group => {
        const hasSettings = group.settings?.dynamicGroupStatus;
        const isAutomatic = hasSettings && 
          group.settings.dynamicGroupStatus !== 'none' &&
          group.settings.dynamicGroupStatus !== null;
        
        if (hasSettings) {
          console.log(`Group ${group.id}: ${group.information?.name}, status: ${group.settings.dynamicGroupStatus}, isAutomatic: ${isAutomatic}`);
        }
        
        return isAutomatic;
      })
      .map(group => ({
        id: group.id,
        name: group.name || `Gruppe ${group.id}`,
        dynamicGroupStatus: group.settings?.dynamicGroupStatus || 'none',
        lastExecution: group.settings?.dynamicGroupUpdateFinished || null,
        executionStatus: determineExecutionStatus(group),
        dynamicGroupUpdateStarted: group.settings?.dynamicGroupUpdateStarted || null,
        dynamicGroupUpdateFinished: group.settings?.dynamicGroupUpdateFinished || null
      }));

    console.log('Automatic groups found:', automaticGroups.length);
    groups.value = automaticGroups;
  } catch (err: any) {
    console.error('Fehler beim Laden der automatischen Gruppen:', err);
    
    let errorMessage = 'Fehler beim Laden der automatischen Gruppen.';
    
    if (err.response) {
      errorMessage += ` HTTP ${err.response.status}: ${err.response.statusText}`;
      if (err.response.status === 401) {
        errorMessage += ' (Nicht authentifiziert)';
      } else if (err.response.status === 403) {
        errorMessage += ' (Keine Berechtigung)';
      }
    } else if (err.message) {
      errorMessage += ` ${err.message}`;
    }
    
    error.value = errorMessage;
  } finally {
    loading.value = false;
  }
};

const determineExecutionStatus = (group: Group): AutomaticGroup['executionStatus'] => {
  const started = group.settings?.dynamicGroupUpdateStarted;
  const finished = group.settings?.dynamicGroupUpdateFinished;
  
  if (!started && !finished) return 'pending';
  if (started && !finished) return 'running';
  if (started && finished) {
    // Check if started is more recent than finished (indicating a running process)
    const startedDate = new Date(started);
    const finishedDate = new Date(finished);
    if (startedDate > finishedDate) return 'running';
    return 'success';
  }
  
  return 'unknown';
};

const getConfigStatusClass = (status: DynamicGroupStatus) => {
  switch (status) {
    case 'active': return 'status-active';
    case 'inactive': return 'status-inactive';
    case 'manual': return 'status-manual';
    default: return 'status-unknown';
  }
};

const getConfigStatusText = (status: DynamicGroupStatus) => {
  switch (status) {
    case 'active': return 'Aktiv';
    case 'inactive': return 'Inaktiv';
    case 'manual': return 'Manuell';
    default: return 'Unbekannt';
  }
};

const getExecutionStatusClass = (status: AutomaticGroup['executionStatus']) => {
  switch (status) {
    case 'success': return 'status-success';
    case 'error': return 'status-error';
    case 'running': return 'status-running';
    case 'pending': return 'status-pending';
    default: return 'status-unknown';
  }
};

const getExecutionStatusText = (status: AutomaticGroup['executionStatus']) => {
  switch (status) {
    case 'success': return 'Erfolgreich';
    case 'error': return 'Fehler';
    case 'running': return 'Läuft';
    case 'pending': return 'Ausstehend';
    default: return 'Unbekannt';
  }
};

const formatDate = (dateString: string | null) => {
  if (!dateString) return 'Nie';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleString('de-DE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return 'Ungültiges Datum';
  }
};

const getGroupUrl = (groupId: number) => {
  // Construct URL to ChurchTools group dynamic settings page
  const baseUrl = window.location.origin;
  return `${baseUrl}/groups/${groupId}/settings/dynamic-group`;
};

const loadMockData = () => {
  console.log('Loading mock data...');
  groups.value = [
    {
      id: 1,
      name: 'Jugendgruppe Automatisch',
      dynamicGroupStatus: 'active',
      lastExecution: '2025-09-07T10:30:00Z',
      executionStatus: 'success',
      dynamicGroupUpdateStarted: '2025-09-07T10:25:00Z',
      dynamicGroupUpdateFinished: '2025-09-07T10:30:00Z'
    },
    {
      id: 2,
      name: 'Neue Mitglieder',
      dynamicGroupStatus: 'active',
      lastExecution: '2025-09-07T08:15:00Z',
      executionStatus: 'success',
      dynamicGroupUpdateStarted: '2025-09-07T08:10:00Z',
      dynamicGroupUpdateFinished: '2025-09-07T08:15:00Z'
    },
    {
      id: 3,
      name: 'Inaktive Mitglieder',
      dynamicGroupStatus: 'inactive',
      lastExecution: '2025-09-06T22:00:00Z',
      executionStatus: 'error',
      dynamicGroupUpdateStarted: '2025-09-06T21:55:00Z',
      dynamicGroupUpdateFinished: '2025-09-06T22:00:00Z'
    },
    {
      id: 4,
      name: 'Geburtstage diese Woche',
      dynamicGroupStatus: 'active',
      lastExecution: null,
      executionStatus: 'pending',
      dynamicGroupUpdateStarted: null,
      dynamicGroupUpdateFinished: null
    },
    {
      id: 5,
      name: 'Mitarbeiter Gottesdienst',
      dynamicGroupStatus: 'manual',
      lastExecution: '2025-09-07T11:45:00Z',
      executionStatus: 'running',
      dynamicGroupUpdateStarted: '2025-09-07T11:45:00Z',
      dynamicGroupUpdateFinished: null
    }
  ];
  error.value = null;
};

const startResize = (event: MouseEvent, columnIndex: number) => {
  event.preventDefault();
  event.stopPropagation();
  
  isResizing.value = true;
  resizingColumn.value = columnIndex;
  startX.value = event.clientX;
  startWidth.value = columnWidths.value[columnIndex];
  
  document.addEventListener('mousemove', handleResize);
  document.addEventListener('mouseup', stopResize);
  document.body.style.cursor = 'col-resize';
  document.body.style.userSelect = 'none';
};

const handleResize = (event: MouseEvent) => {
  if (!isResizing.value || resizingColumn.value === -1) return;
  
  const deltaX = event.clientX - startX.value;
  const newWidth = Math.max(50, startWidth.value + deltaX); // Minimum width of 50px
  
  columnWidths.value[resizingColumn.value] = newWidth;
};

const stopResize = () => {
  isResizing.value = false;
  resizingColumn.value = -1;
  
  document.removeEventListener('mousemove', handleResize);
  document.removeEventListener('mouseup', stopResize);
  document.body.style.cursor = '';
  document.body.style.userSelect = '';
};

onMounted(() => {
  refreshGroups();
});
</script>

<style scoped>
.automatic-groups-admin {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  width: 100%;
  max-width: none;
}

.header-card {
  text-align: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.header-card .ct-card-title {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
  font-weight: 700;
}

.description {
  font-size: 1.2rem;
  opacity: 0.9;
  margin: 0;
}

.controls-card {
  background-color: #f8f9fa;
}

.controls-row {
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;
}

.search-container {
  flex: 1;
  min-width: 300px;
}

.search-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.button-group {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.refresh-btn,
.mock-btn {
  white-space: nowrap;
}

.empty-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 1rem;
}

.table-container {
  overflow-x: auto;
}

.groups-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
  table-layout: fixed;
}

.groups-table th,
.groups-table td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid #e9ecef;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Resizable columns */
.groups-table th.resizable {
  position: relative;
}

.resize-handle {
  position: absolute;
  top: 0;
  right: 0;
  width: 4px;
  height: 100%;
  background: transparent;
  cursor: col-resize;
  z-index: 10;
}

.resize-handle:hover {
  background: #007bff;
  opacity: 0.5;
}

.resize-handle:active {
  background: #007bff;
  opacity: 0.8;
}

/* Prevent text selection during resize */
.groups-table.resizing {
  user-select: none;
}

/* Ensure table cells respect the width */
.groups-table td {
  white-space: nowrap;
}

.groups-table th {
  background-color: #f8f9fa;
  font-weight: 600;
  color: #495057;
}

.groups-table th.sortable {
  cursor: pointer;
  user-select: none;
  position: relative;
}

.groups-table th.sortable:hover {
  background-color: #e9ecef;
}

.sort-indicator {
  margin-left: 0.5rem;
  font-weight: bold;
  display: inline-block;
  width: 12px;
  text-align: center;
}

.group-row:hover {
  background-color: #f8f9fa;
}

.group-id {
  font-family: monospace;
  font-weight: 600;
}

.group-name strong {
  color: #2c3e50;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 500;
  text-transform: uppercase;
}

.status-active {
  background-color: #d4edda;
  color: #155724;
}

.status-inactive {
  background-color: #f8d7da;
  color: #721c24;
}

.status-manual {
  background-color: #fff3cd;
  color: #856404;
}

.status-success {
  background-color: #d1ecf1;
  color: #0c5460;
}

.status-error {
  background-color: #f8d7da;
  color: #721c24;
}

.status-running {
  background-color: #cce5ff;
  color: #004085;
}

.status-pending {
  background-color: #e2e3e5;
  color: #383d41;
}

.status-unknown {
  background-color: #e2e3e5;
  color: #6c757d;
}

.loading-state,
.error-state,
.empty-state {
  text-align: center;
  padding: 3rem;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-message {
  color: #721c24;
  margin-bottom: 1rem;
}

.error-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-bottom: 1rem;
}

.dev-info {
  background-color: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 4px;
  padding: 1rem;
  margin-top: 1rem;
  text-align: left;
}

.dev-info p {
  margin: 0.5rem 0;
  font-size: 0.9rem;
}

/* ChurchTools Design System Classes */
.ct-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  overflow: hidden;
}

.ct-card-header {
  padding: 1.5rem;
  border-bottom: 1px solid #e9ecef;
}

.ct-card-body {
  padding: 1.5rem;
}

.ct-card-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #2c3e50;
}

.ct-input {
  display: block;
  width: 100%;
  padding: 0.375rem 0.75rem;
  font-size: 1rem;
  line-height: 1.5;
  color: #495057;
  background-color: #fff;
  border: 1px solid #ced4da;
  border-radius: 0.25rem;
  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
}

.ct-input:focus {
  color: #495057;
  background-color: #fff;
  border-color: #80bdff;
  outline: 0;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

.ct-btn {
  display: inline-block;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  text-decoration: none;
  cursor: pointer;
  font-weight: 500;
  text-align: center;
  transition: all 0.2s ease;
  font-size: 1rem;
}

.ct-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.ct-btn-primary {
  background-color: #007bff;
  color: white;
}

.ct-btn-primary:hover:not(:disabled) {
  background-color: #0056b3;
}

.ct-btn-secondary {
  background-color: #6c757d;
  color: white;
}

.ct-btn-secondary:hover:not(:disabled) {
  background-color: #545b62;
}

.ct-btn-outline {
  background-color: transparent;
  color: #007bff;
  border: 1px solid #007bff;
}

.ct-btn-outline:hover {
  background-color: #007bff;
  color: white;
}

.ct-btn-sm {
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
}

/* Responsive Design */
@media (max-width: 768px) {
  .header-card .ct-card-title {
    font-size: 2rem;
  }
  
  .description {
    font-size: 1rem;
  }
  
  .controls-row {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-container {
    min-width: auto;
  }
  
  .button-group {
    flex-direction: column;
    width: 100%;
  }
  
  .empty-actions {
    flex-direction: column;
    align-items: center;
  }
  
  .groups-table {
    font-size: 0.875rem;
  }
  
  .groups-table th,
  .groups-table td {
    padding: 0.5rem;
  }
}

@media (max-width: 576px) {
  .automatic-groups-admin {
    gap: 1rem;
  }
  
  .ct-card-header,
  .ct-card-body {
    padding: 1rem;
  }
}
</style>