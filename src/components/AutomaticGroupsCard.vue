<template>
  <div class="ct-card feature-card automatic-groups-card" :class="{ loading: loading }">
    <div class="ct-card-header">
      <h3 class="ct-card-title">
        <span class="card-icon">{{ module.icon }}</span>
        {{ module.title }}
      </h3>
      <div class="ct-card-actions">
        <button class="ct-btn-icon" @click.stop="$emit('navigate', module.id)">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 16 16 12 12 8"></polyline>
            <line x1="8" y1="12" x2="16" y2="12"></line>
          </svg>
        </button>
      </div>
    </div>
    <div class="ct-card-body">
      
      <div v-if="loading" class="loading-content">
        <div class="loading-spinner"></div>
        <p>Lade Gruppendaten...</p>
      </div>
      
      <div v-else-if="error" class="error-content">
        <p class="error-message">❌ {{ error }}</p>
        <button @click="loadMockData" class="ct-btn ct-btn-sm ct-btn-outline">
          Mock-Daten laden
        </button>
      </div>
      
      <div v-else class="groups-stats">
        <div class="main-stat">
          <div class="stat-number">{{ totalGroups }}</div>
          <div class="stat-label">Automatische Gruppen</div>
        </div>
        
        <div class="status-breakdown">
          <div class="status-item success">
            <div class="status-icon">✅</div>
            <div class="status-info">
              <div class="status-number">{{ successfulGroups }}</div>
              <div class="status-label">Erfolgreich</div>
            </div>
          </div>
          
          <div class="status-item error">
            <div class="status-icon">❌</div>
            <div class="status-info">
              <div class="status-number">{{ errorGroups }}</div>
              <div class="status-label">Fehler</div>
            </div>
          </div>
          
          <div class="status-item pending">
            <div class="status-icon">⏳</div>
            <div class="status-info">
              <div class="status-number">{{ pendingGroups }}</div>
              <div class="status-label">Ausstehend</div>
            </div>
          </div>
        </div>
        
        <div class="last-update" v-if="lastUpdate">
          <small>Letzte Aktualisierung: {{ formatDate(lastUpdate) }}</small>
        </div>
      </div>
      
      <div class="card-actions">
        <button 
          @click="refreshData" 
          class="ct-btn ct-btn-sm ct-btn-primary"
          :disabled="loading"
        >
          {{ loading ? 'Lädt...' : 'Aktualisieren' }}
        </button>
        <button 
          @click="$emit('navigate-to-admin')" 
          class="ct-btn ct-btn-sm ct-btn-outline"
        >
          Details anzeigen
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { churchtoolsClient } from '@churchtools/churchtools-client';
import type { Group, DynamicGroupStatus } from '../ct-types';
import type { DashboardModule } from '../types/modules';

defineProps<{
  module: DashboardModule;
}>();

// Emit für Navigation
defineEmits<{
  'navigate-to-admin': []
}>();

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
const lastUpdate = ref<string | null>(null);

const totalGroups = computed(() => groups.value.length);

const successfulGroups = computed(() => 
  groups.value.filter(group => group.executionStatus === 'success').length
);

const errorGroups = computed(() => 
  groups.value.filter(group => group.executionStatus === 'error').length
);

const pendingGroups = computed(() => 
  groups.value.filter(group => 
    group.executionStatus === 'pending' || 
    group.executionStatus === 'running' ||
    group.executionStatus === 'unknown'
  ).length
);

const determineExecutionStatus = (group: Group): AutomaticGroup['executionStatus'] => {
  const started = group.settings?.dynamicGroupUpdateStarted;
  const finished = group.settings?.dynamicGroupUpdateFinished;
  
  if (!started && !finished) return 'pending';
  if (started && !finished) return 'running';
  if (started && finished) {
    const startedDate = new Date(started);
    const finishedDate = new Date(finished);
    if (startedDate > finishedDate) return 'running';
    return 'success';
  }
  
  return 'unknown';
};

const refreshData = async () => {
  loading.value = true;
  error.value = null;

  try {
    console.log('Fetching automatic groups for card...');
    
    let allGroups: Group[] = [];
    let page = 1;
    const limit = 100;
    let hasMore = true;

    while (hasMore) {
      const response = await churchtoolsClient.get(`/groups?include=settings&limit=${limit}&page=${page}`);
      
      let pageGroups: Group[] = [];
      if (Array.isArray(response)) {
        pageGroups = response;
      } else if (response && response.data && Array.isArray(response.data)) {
        pageGroups = response.data;
      } else if (response && Array.isArray(response.groups)) {
        pageGroups = response.groups;
      }
      
      if (pageGroups.length === 0) {
        hasMore = false;
      } else {
        allGroups = allGroups.concat(pageGroups);
        if (pageGroups.length < limit) {
          hasMore = false;
        } else {
          page++;
          if (page > 100) break; // Safety limit
        }
      }
    }

    // Filter for automatic groups
    const automaticGroups = allGroups
      .filter(group => 
        group.settings?.dynamicGroupStatus && 
        group.settings.dynamicGroupStatus !== 'none' &&
        group.settings.dynamicGroupStatus !== null
      )
      .map(group => ({
        id: group.id,
        name: group.name || `Gruppe ${group.id}`,
        dynamicGroupStatus: group.settings?.dynamicGroupStatus || 'none',
        lastExecution: group.settings?.dynamicGroupUpdateFinished || null,
        executionStatus: determineExecutionStatus(group),
        dynamicGroupUpdateStarted: group.settings?.dynamicGroupUpdateStarted || null,
        dynamicGroupUpdateFinished: group.settings?.dynamicGroupUpdateFinished || null
      }));

    groups.value = automaticGroups;
    lastUpdate.value = new Date().toISOString();
    console.log(`Found ${automaticGroups.length} automatic groups`);
  } catch (err: any) {
    console.error('Error loading automatic groups:', err);
    error.value = 'Fehler beim Laden der automatischen Gruppen.';
  } finally {
    loading.value = false;
  }
};

const loadMockData = () => {
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
  lastUpdate.value = new Date().toISOString();
  error.value = null;
};

const formatDate = (dateString: string | null) => {
  if (!dateString) return 'Nie';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return 'Ungültiges Datum';
  }
};

onMounted(() => {
  refreshData();
});
</script>

<style scoped>
.automatic-groups-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s, box-shadow 0.2s;
  overflow: hidden;
}

.automatic-groups-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.automatic-groups-card .ct-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 72px;
  padding: 0 1.5rem;
  border-bottom: 1px solid #f0f2f5;
  background-color: #f8f9fa;
  box-sizing: border-box;
}

.automatic-groups-card .ct-card-title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #2c3e50;
  display: flex;
  align-items: center;
  line-height: 1.2;
  padding: 1.25rem 0;
}

.automatic-groups-card .card-icon {
  margin-right: 0.75rem;
  font-size: 1.25rem;
  color: #4a6cf7;
}

.automatic-groups-card .ct-card-actions {
  margin-left: 0.5rem;
}

.automatic-groups-card .ct-card-body {
  flex: 1;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.automatic-groups-card.loading {
  opacity: 0.8;
}

.feature-icon {
  font-size: 3rem;
  text-align: center;
  margin-bottom: 1rem;
}

.loading-content,
.error-content {
  text-align: center;
  padding: 1.5rem;
  margin: -1.5rem -1.5rem 0 -1.5rem;
  width: calc(100% + 3rem);
  box-sizing: border-box;
}

.loading-spinner {
  width: 30px;
  height: 30px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #007bff;
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
  font-size: 0.9rem;
}

.groups-stats {
  text-align: center;
  padding: 0 1.5rem;
  margin: 0;
  width: 100%;
  box-sizing: border-box;
}

.main-stat {
  margin: 0 -1.5rem 1.5rem -1.5rem;
  padding: 0 1.5rem;
  width: calc(100% + 3rem);
  box-sizing: border-box;
}

.stat-number {
  font-size: 2.5rem;
  font-weight: 700;
  color: #2c3e50;
  line-height: 1;
}

.stat-label {
  font-size: 0.9rem;
  color: #666;
  margin-top: 0.25rem;
}

.status-breakdown {
  display: flex;
  justify-content: space-around;
  margin: 0 -1.5rem 1.5rem -1.5rem;
  padding: 0 1.5rem;
  width: calc(100% + 3rem);
  box-sizing: border-box;
  gap: 0.5rem;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  min-width: 0;
}

.status-icon {
  font-size: 1.2rem;
  flex-shrink: 0;
}

.status-info {
  text-align: left;
  min-width: 0;
}

.status-number {
  font-size: 1.2rem;
  font-weight: 600;
  line-height: 1;
}

.status-label {
  font-size: 0.75rem;
  color: #666;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.status-item.success .status-number {
  color: #28a745;
}

.status-item.error .status-number {
  color: #dc3545;
}

.status-item.pending .status-number {
  color: #ffc107;
}

.last-update {
  margin-bottom: 1rem;
  color: #666;
  font-size: 0.8rem;
}

.card-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  flex-wrap: wrap;
}

.ct-btn {
  display: inline-block;
  padding: 0.375rem 0.75rem;
  border: none;
  border-radius: 4px;
  text-decoration: none;
  cursor: pointer;
  font-weight: 500;
  text-align: center;
  transition: all 0.2s ease;
  font-size: 0.875rem;
  white-space: nowrap;
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
  font-size: 0.8rem;
}

/* Responsive Design */
@media (max-width: 768px) {
  .automatic-groups-card .ct-card-header {
    padding: 1.5rem 1.5rem 1rem 1.5rem;
  }

  .automatic-groups-card .ct-card-body {
    padding: 1rem 1.5rem 1.5rem 1.5rem;
  }
  
  .status-breakdown {
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .status-item {
    justify-content: center;
  }
  
  .status-info {
    text-align: center;
  }
  
  .card-actions {
    flex-direction: column;
  }
  
  .ct-btn {
    width: 100%;
  }
}

@media (max-width: 576px) {
  .stat-number {
    font-size: 2rem;
  }
  
  .feature-icon {
    font-size: 2.5rem;
  }
}
</style>