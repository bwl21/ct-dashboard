<template>
  <BaseCard
    :title="'Auslaufende Termine'"
    :icon="'📅'"
    :is-loading="isLoading"
    :error="error"
    :main-stat="mainStat"
    :status-stats="statusStats"
    :last-update="formattedLastUpdate"
    loading-text="Lade Termine..."
    retry-text="Erneut versuchen"
    refresh-text="Aktualisieren"
    refreshing-text="Aktualisieren..."
    details-text="Details anzeigen"
    last-update-text="Letzte Aktualisierung"
    @navigate="$emit('navigate')"
    @refresh="refreshData"
    @retry="refreshData"
  />
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { findExpiringSeries, type Appointment } from '@/services/churchtools';
import BaseCard from './BaseCard.vue';

// Configuration
const DAYS_TO_SHOW = 90;

// Props
defineProps<{
  module: {
    id: string;
    title: string;
    icon: string;
    description: string;
  };
}>();

defineEmits<{
  navigate: [];
}>();

// State
const isLoading = ref(true);
const error = ref<string | null>(null);

// Data
const appointments = ref<Appointment[]>([]);

// Computed properties
const expiringCount = computed(() => {
  return appointments.value.filter(a => getAppointmentStatus(a) === 'expiring').length;
});

const expiredCount = computed(() => {
  return appointments.value.filter(a => getAppointmentStatus(a) === 'expired').length;
});

const mainStat = computed(() => ({
  value: appointments.value.length,
  label: 'Auslaufende Termine'
}));

const statusStats = computed(() => [
  {
    key: 'total',
    value: appointments.value.length,
    label: 'Gesamt',
    icon: '📊',
    type: 'info' as const
  },
  {
    key: 'expiring',
    value: expiringCount.value,
    label: 'Läuft ab',
    icon: '⏰',
    type: 'warning' as const
  },
  {
    key: 'expired',
    value: expiredCount.value,
    label: 'Abgelaufen',
    icon: '❌',
    type: 'error' as const
  }
]);

const formattedLastUpdate = computed(() => {
  if (appointments.value.length === 0) return '';
  return new Date().toLocaleString('de-DE', { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit' 
  });
});

// Get status of an appointment
const getAppointmentStatus = (appointment: Appointment): string => {
  if (!appointment.base?.repeatUntil) return 'active';
  
  const endDate = new Date(appointment.base.repeatUntil);
  const today = new Date();
  const daysUntilEnd = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  if (endDate < today) return 'expired';
  if (daysUntilEnd <= DAYS_TO_SHOW) return 'expiring';
  return 'active';
};

// Fetch data from ChurchTools API
const fetchData = async () => {
  isLoading.value = true;
  error.value = null;
  
  try {
    const expiringSeries = await findExpiringSeries(DAYS_TO_SHOW);
    
    // Log the first few appointments to debug date issues
    console.log('Fetched appointments:', expiringSeries);
    if (expiringSeries.length > 0) {
      console.log('First appointment structure:', JSON.parse(JSON.stringify(expiringSeries[0])));
    }

    appointments.value = expiringSeries;

  } catch (err) {
    console.error('Error fetching appointments:', err);
    error.value = 'Fehler beim Laden der Termine. Bitte versuchen Sie es erneut.';
  } finally {
    isLoading.value = false;
  }
};

// Refresh data
const refreshData = () => {
  fetchData();
};

// Initialize component
onMounted(() => {
  fetchData();
});
</script>