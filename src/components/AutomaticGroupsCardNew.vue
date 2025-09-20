<template>
  <BaseCard
    :title="module.title"
    :icon="module.icon"
    :is-loading="loading"
    :error="error"
    :main-stat="mainStat"
    :status-stats="statusStats"
    :last-update="formattedLastUpdate"
    loading-text="Lade Gruppendaten..."
    retry-text="Mock-Daten laden"
    refresh-text="Aktualisieren"
    refreshing-text="Lädt..."
    details-text="Details anzeigen"
    last-update-text="Letzte Aktualisierung"
    @navigate="$emit('navigate-to-admin')"
    @refresh="refreshData"
    @retry="loadMockData"
  />
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { churchtoolsClient } from '@churchtools/churchtools-client';
import BaseCard from './BaseCard.vue';

interface Group {
  id: number;
  name: string;
  settings?: {
    dynamicGroupStatus?: DynamicGroupStatus;
    dynamicGroupUpdateStarted?: string;
    dynamicGroupUpdateFinished?: string;
  };
}

interface DynamicGroupStatus {
  active: boolean;
  lastExecution: string | null;
}

defineProps<{
  module: {
    id: string;
    title: string;
    icon: string;
    description: string;
  };
}>();

defineEmits<{
  'navigate-to-admin': [];
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

const mainStat = computed(() => ({
  value: totalGroups.value,
  label: 'Automatische Gruppen'
}));

const statusStats = computed(() => [
  {
    key: 'success',
    value: successfulGroups.value,
    label: 'Erfolgreich',
    icon: '✅',
    type: 'success' as const
  },
  {
    key: 'error',
    value: errorGroups.value,
    label: 'Fehler',
    icon: '❌',
    type: 'error' as const
  },
  {
    key: 'pending',
    value: pendingGroups.value,
    label: 'Ausstehend',
    icon: '⏳',
    type: 'warning' as const
  }
]);

const formattedLastUpdate = computed(() => {
  if (!lastUpdate.value) return '';
  return formatDate(lastUpdate.value);
});

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

const formatDate = (dateString: string): string => {
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

const fetchGroups = async () => {
  loading.value = true;
  error.value = null;
  
  try {
    console.log('Fetching automatic groups for card...');
    const response = await churchtoolsClient.get<Group[]>('/groups');
    
    if (!Array.isArray(response)) {
      throw new Error('Invalid response format');
    }

    const automaticGroups = response
      .filter(group => group.settings?.dynamicGroupStatus?.active)
      .map(group => ({
        id: group.id,
        name: group.name,
        dynamicGroupStatus: group.settings!.dynamicGroupStatus!,
        lastExecution: group.settings!.dynamicGroupStatus!.lastExecution,
        executionStatus: determineExecutionStatus(group),
        dynamicGroupUpdateStarted: group.settings?.dynamicGroupUpdateStarted || null,
        dynamicGroupUpdateFinished: group.settings?.dynamicGroupUpdateFinished || null
      }));

    groups.value = automaticGroups;
    lastUpdate.value = new Date().toISOString();
    
    console.log(`Found ${automaticGroups.length} automatic groups`);
  } catch (err) {
    console.error('Error fetching groups:', err);
    error.value = 'Fehler beim Laden der Gruppendaten';
  } finally {
    loading.value = false;
  }
};

const loadMockData = () => {
  console.log('Loading mock data for automatic groups...');
  groups.value = [
    {
      id: 1,
      name: 'Jugendgruppe Auto',
      dynamicGroupStatus: { active: true, lastExecution: '2024-01-15T10:30:00Z' },
      lastExecution: '2024-01-15T10:30:00Z',
      executionStatus: 'success',
      dynamicGroupUpdateStarted: '2024-01-15T10:25:00Z',
      dynamicGroupUpdateFinished: '2024-01-15T10:30:00Z'
    },
    {
      id: 2,
      name: 'Erwachsene Auto',
      dynamicGroupStatus: { active: true, lastExecution: '2024-01-14T09:15:00Z' },
      lastExecution: '2024-01-14T09:15:00Z',
      executionStatus: 'error',
      dynamicGroupUpdateStarted: '2024-01-14T09:10:00Z',
      dynamicGroupUpdateFinished: '2024-01-14T09:15:00Z'
    },
    {
      id: 3,
      name: 'Mitarbeiter Auto',
      dynamicGroupStatus: { active: true, lastExecution: null },
      lastExecution: null,
      executionStatus: 'pending',
      dynamicGroupUpdateStarted: null,
      dynamicGroupUpdateFinished: null
    }
  ];
  lastUpdate.value = new Date().toISOString();
  error.value = null;
};

const refreshData = () => {
  fetchGroups();
};

onMounted(() => {
  refreshData();
});
</script>