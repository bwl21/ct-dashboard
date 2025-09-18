<template>
  <div class="ct-card feature-card expiring-appointments-card" :class="{ loading: loading }">
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
        <p>Lade Termine...</p>
      </div>
      
      <div v-else-if="error" class="error-content">
        <p class="error-message">❌ {{ error }}</p>
        <button @click="loadData" class="ct-btn ct-btn-sm ct-btn-outline">
          Erneut versuchen
        </button>
      </div>
      
      <div v-else class="appointments-content">
        <div v-if="expiringAppointments.length === 0" class="no-appointments">
          <p>Keine ablaufenden Serientermine gefunden.</p>
        </div>
        
        <div v-else class="appointments-list">
          <div v-for="appointment in expiringAppointments.slice(0, 3)" :key="appointment.id" class="appointment-item">
            <div class="appointment-title">{{ appointment.title }}</div>
            <div class="appointment-details">
              <span class="appointment-date">{{ formatDate(appointment.endDate) }}</span>
              <span class="appointment-days" :class="{ 'warning': appointment.daysLeft <= 7 }">
                (noch {{ appointment.daysLeft }} {{ appointment.daysLeft === 1 ? 'Tag' : 'Tage' }})
              </span>
            </div>
          </div>
          
          <div v-if="expiringAppointments.length > 3" class="more-appointments">
            + {{ expiringAppointments.length - 3 }} weitere
          </div>
        </div>
        
        <div class="card-actions">
          <button @click="$emit('navigate', module.id)" class="ct-btn ct-btn-sm ct-btn-outline">
            Alle anzeigen
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import type { DashboardModule } from '../types/modules';

defineProps<{
  module: DashboardModule;
}>();

const emit = defineEmits<{
  (e: 'navigate', moduleId: string): void;
}>();

interface Appointment {
  id: number;
  title: string;
  endDate: string;
  daysLeft: number;
}

const loading = ref(true);
const error = ref<string | null>(null);
const expiringAppointments = ref<Appointment[]>([]);

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

const loadData = async () => {
  try {
    loading.value = true;
    error.value = null;
    
    // In a real implementation, you would fetch this from the API
    // const response = await churchtoolsClient.get('/appointments/expiring-series');
    // expiringAppointments.value = response.data;
    
    // Mock data for demonstration
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const today = new Date();
    expiringAppointments.value = [
      {
        id: 1,
        title: 'Gottesdienst',
        endDate: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        daysLeft: 5
      },
      {
        id: 2,
        title: 'Jugendtreffen',
        endDate: new Date(today.getTime() + 12 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        daysLeft: 12
      },
      {
        id: 3,
        title: 'Bibelkreis',
        endDate: new Date(today.getTime() + 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        daysLeft: 20
      },
      {
        id: 4,
        title: 'Gebetsabend',
        endDate: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        daysLeft: 3
      }
    ].sort((a, b) => a.daysLeft - b.daysLeft);
    
  } catch (err) {
    console.error('Fehler beim Laden der ablaufenden Serientermine:', err);
    error.value = 'Fehler beim Laden der Daten';
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.expiring-appointments-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s, box-shadow 0.2s;
  overflow: hidden;
}

.expiring-appointments-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.ct-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 72px;
  padding: 0 1.5rem;
  border-bottom: 1px solid #f0f2f5;
  background-color: #f8f9fa;
  box-sizing: border-box;
}

.ct-card-title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #2c3e50;
  display: flex;
  align-items: center;
  line-height: 1.2;
  padding: 1.25rem 0;
}

.card-icon {
  margin-right: 0.75rem;
  font-size: 1.25rem;
  color: #4a6cf7;
}

.ct-card-actions {
  margin-left: 0.5rem;
}

.ct-btn {
  background: none;
  border: 1px solid #d0d5dd;
  border-radius: 6px;
  padding: 8px 12px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.ct-btn-sm {
  padding: 6px 12px;
  font-size: 0.8125rem;
}

.ct-btn-outline {
  background: #ffffff;
  color: #344054;
  border: 1px solid #d0d5dd;
}

.ct-btn-outline:hover {
  background: #f9fafb;
  border-color: #98a2b3;
  color: #1a1f36;
}

.ct-btn-primary {
  background: #4a6cf7;
  color: white;
  border: 1px solid #4a6cf7;
}

.ct-btn-primary:hover {
  background: #3a5ce4;
  border-color: #3a5ce4;
}

.ct-btn-icon {
  padding: 8px;
  border-radius: 6px;
}

.ct-btn-icon svg {
  width: 16px;
  height: 16px;
  color: #4a6cf7;
  background-color: rgba(74, 108, 247, 0.1);
}

.ct-card-body {
  padding: 1.5rem;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.appointments-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.appointments-list {
  flex: 1;
  margin: 0 -1.5rem;
  padding: 0 1.5rem;
}

.appointment-item {
  padding: 0.75rem 0;
  border-bottom: 1px solid #f0f2f5;
  transition: background-color 0.2s;
}

.appointment-item:last-child {
  border-bottom: none;
}

.appointment-item:hover {
  background-color: #f8f9fa;
}

.appointment-title {
  font-weight: 500;
  margin-bottom: 0.25rem;
  color: #2c3e50;
  font-size: 0.95rem;
}

.appointment-details {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #6c757d;
  font-size: 0.85rem;
}

.appointment-days {
  font-weight: 500;
  padding: 0.15rem 0.5rem;
  border-radius: 10px;
  font-size: 0.8rem;
  background-color: #f0f2f5;
}

.appointment-days.warning {
  color: #e67e22;
  background-color: rgba(230, 126, 34, 0.1);
}

.more-appointments {
  margin-top: 0.5rem;
  text-align: center;
  color: #6c757d;
  font-size: 0.85rem;
  padding: 0.5rem 0;
  border-top: 1px dashed #e9ecef;
  margin: 0 -1.5rem;
  padding: 0.75rem 1.5rem;
}

.no-appointments {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #6c757d;
  padding: 2rem 1rem;
  text-align: center;
  font-size: 0.9rem;
}

.no-appointments p {
  margin: 0.5rem 0 0;
  max-width: 80%;
  line-height: 1.5;
}

.loading-content,
.error-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
  text-align: center;
}

.loading-spinner {
  border: 2px solid rgba(74, 108, 247, 0.2);
  border-top-color: #4a6cf7;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

.loading-content p {
  color: #6c757d;
  font-size: 0.9rem;
  margin: 0.5rem 0 0;
}

.error-message {
  color: #dc3545;
  font-size: 0.9rem;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .ct-card-header {
    padding: 1rem;
  }
  
  .ct-card-body {
    padding: 1rem;
  }
  
  .appointments-list {
    margin: 0 -1rem;
    padding: 0 1rem;
  }
  
  .more-appointments {
    margin: 0 -1rem;
    padding: 0.5rem 1rem;
  }
}
</style>
