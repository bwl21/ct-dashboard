<template>
  <div class="expiring-appointments-admin">
    <div class="admin-header">
      <h1>{{ module.title }}</h1>
      <p class="module-description">Verwalten Sie hier die ablaufenden Serientermine.</p>
    </div>

    <div class="admin-content">
      <div class="filters">
        <div class="filter-group">
          <label for="timeframe">Zeitraum:</label>
          <select id="timeframe" v-model="timeframe" class="ct-select">
            <option value="7">Nächste 7 Tage</option>
            <option value="30">Nächste 30 Tage</option>
            <option value="90">Nächste 90 Tage</option>
            <option value="all">Alle anzeigen</option>
          </select>
        </div>
        
        <div class="filter-group">
          <label for="search">Suchen:</label>
          <input 
            id="search" 
            type="text" 
            v-model="searchQuery" 
            placeholder="Nach Titel suchen..."
            class="ct-input"
          >
        </div>
        
        <button 
          @click="refreshData" 
          class="ct-btn ct-btn-primary"
          :disabled="loading"
        >
          <span v-if="!loading">Aktualisieren</span>
          <span v-else class="loading-spinner"></span>
        </button>
      </div>

      <div v-if="loading" class="loading-container">
        <div class="loading-spinner"></div>
        <p>Lade Termine...</p>
      </div>
      
      <div v-else-if="error" class="error-container">
        <div class="error-message">
          <span>❌</span>
          <div>
            <p>Fehler beim Laden der Daten</p>
            <p class="error-detail">{{ error }}</p>
          </div>
        </div>
        <button @click="loadData" class="ct-btn ct-btn-outline">
          Erneut versuchen
        </button>
      </div>
      
      <div v-else class="appointments-container">
        <div v-if="filteredAppointments.length === 0" class="no-results">
          <p>Keine ablaufenden Serientermine gefunden.</p>
        </div>
        
        <div v-else class="appointments-list">
          <div v-for="appointment in filteredAppointments" :key="appointment.id" class="appointment-card">
            <div class="appointment-header">
              <h3>{{ appointment.title }}</h3>
              <span class="days-left" :class="getDaysLeftClass(appointment.daysLeft)">
                {{ formatDaysLeft(appointment.daysLeft) }}
              </span>
            </div>
            
            <div class="appointment-details">
              <div class="detail-row">
                <span class="detail-label">Endet am:</span>
                <span class="detail-value">{{ formatDate(appointment.endDate) }}</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Kategorie:</span>
                <span class="detail-value">{{ appointment.category }}</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Verantwortlich:</span>
                <span class="detail-value">{{ appointment.responsiblePerson }}</span>
              </div>
            </div>
            
            <div class="appointment-actions">
              <button 
                @click="extendSeries(appointment)" 
                class="ct-btn ct-btn-sm ct-btn-primary"
              >
                Serie verlängern
              </button>
              <button 
                @click="viewDetails(appointment)" 
                class="ct-btn ct-btn-sm ct-btn-outline"
              >
                Details
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import type { DashboardModule } from '../types/modules';

defineProps<{
  module: DashboardModule;
}>();

interface Appointment {
  id: number;
  title: string;
  endDate: string;
  daysLeft: number;
  category: string;
  responsiblePerson: string;
  location?: string;
  notes?: string;
}

const loading = ref(true);
const error = ref<string | null>(null);
const searchQuery = ref('');
const timeframe = ref('30');
const appointments = ref<Appointment[]>([]);

const filteredAppointments = computed(() => {
  let result = [...appointments.value];
  
  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(appt => 
      appt.title.toLowerCase().includes(query) ||
      appt.category.toLowerCase().includes(query) ||
      appt.responsiblePerson.toLowerCase().includes(query)
    );
  }
  
  // Filter by timeframe
  if (timeframe.value !== 'all') {
    const days = parseInt(timeframe.value);
    result = result.filter(appt => appt.daysLeft <= days);
  }
  
  // Sort by days left (ascending)
  return result.sort((a, b) => a.daysLeft - b.daysLeft);
});

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

const formatDaysLeft = (days: number): string => {
  if (days === 0) return 'Heute';
  if (days === 1) return 'Morgen';
  if (days < 0) return `Vor ${Math.abs(days)} Tagen abgelaufen`;
  return `Noch ${days} ${days === 1 ? 'Tag' : 'Tage'}`;
};

const getDaysLeftClass = (days: number): string => {
  if (days <= 0) return 'expired';
  if (days <= 7) return 'warning';
  if (days <= 30) return 'notice';
  return '';
};

const loadData = async () => {
  try {
    loading.value = true;
    error.value = null;
    
    // In a real implementation, you would fetch this from the API
    // const response = await churchtoolsClient.get('/appointments/expiring-series');
    // appointments.value = response.data;
    
    // Mock data for demonstration
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const today = new Date();
    const mockCategories = [
      'Gottesdienst', 'Jugend', 'Gebet', 'Bibelkreis', 'Chor', 
      'Hauskreis', 'Senioren', 'Kinder', 'Taufe', 'Trauung'
    ];
    
    const mockNames = [
      'Max Mustermann', 'Erika Musterfrau', 'Hans Schmidt', 'Maria Weber',
      'Thomas Müller', 'Sabine Schulz', 'Peter Meyer', 'Anna Wagner'
    ];
    
    appointments.value = Array.from({ length: 12 }, (_, i) => {
      const daysInFuture = Math.floor(Math.random() * 90);
      const endDate = new Date(today);
      endDate.setDate(today.getDate() + daysInFuture);
      
      return {
        id: i + 1,
        title: `Serientermin ${i + 1}`,
        endDate: endDate.toISOString().split('T')[0],
        daysLeft: daysInFuture,
        category: mockCategories[Math.floor(Math.random() * mockCategories.length)],
        responsiblePerson: mockNames[Math.floor(Math.random() * mockNames.length)],
        location: 'Gemeindezentrum',
        notes: 'Wöchentlicher Termin'
      };
    });
    
  } catch (err) {
    console.error('Fehler beim Laden der Termine:', err);
    error.value = 'Die Termine konnten nicht geladen werden. Bitte versuchen Sie es später erneut.';
  } finally {
    loading.value = false;
  }
};

const refreshData = () => {
  searchQuery.value = '';
  loadData();
};

const extendSeries = (appointment: Appointment) => {
  console.log('Extend series:', appointment);
  // In a real implementation, this would open a modal or navigate to a form
  alert(`Serie "${appointment.title}" verlängern`);
};

const viewDetails = (appointment: Appointment) => {
  console.log('View details:', appointment);
  // In a real implementation, this would navigate to a detail view
  alert(`Details für "${appointment.title}" anzeigen`);
};

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.expiring-appointments-admin {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
}

.admin-header {
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #eee;
}

.admin-header h1 {
  margin: 0 0 0.5rem;
  color: #333;
}

.module-description {
  color: #666;
  margin: 0;
}

.filters {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  align-items: flex-end;
}

.filter-group {
  display: flex;
  flex-direction: column;
  min-width: 200px;
  flex: 1;
}

.filter-group label {
  font-size: 0.9rem;
  margin-bottom: 0.25rem;
  color: #555;
}

.ct-select,
.ct-input {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.ct-btn {
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s;
  border: 1px solid transparent;
  height: 38px; /* Match input height */
}

.ct-btn-primary {
  background-color: #4a6cf7;
  color: white;
  border-color: #4a6cf7;
}

.ct-btn-primary:hover {
  background-color: #3a5ce4;
  border-color: #3a5ce4;
}

.ct-btn-primary:disabled {
  background-color: #a0a0a0;
  border-color: #a0a0a0;
  cursor: not-allowed;
}

.ct-btn-outline {
  background-color: white;
  border-color: #4a6cf7;
  color: #4a6cf7;
}

.ct-btn-outline:hover {
  background-color: #f0f4ff;
}

.ct-btn-sm {
  padding: 0.25rem 0.75rem;
  font-size: 0.9rem;
}

.loading-container,
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  text-align: center;
  color: #666;
}

.error-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  color: #e74c3c;
  font-weight: 500;
}

.error-detail {
  font-size: 0.9rem;
  color: #999;
  margin-top: 0.25rem;
}

.loading-spinner {
  border: 3px solid #f3f3f3;
  border-top: 3px solid #4a6cf7;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.appointments-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.no-results {
  padding: 2rem;
  text-align: center;
  color: #666;
}

.appointments-list {
  display: grid;
  gap: 1rem;
  padding: 1rem;
}

.appointment-card {
  background: white;
  border: 1px solid #eee;
  border-radius: 6px;
  padding: 1rem;
  transition: transform 0.2s, box-shadow 0.2s;
}

.appointment-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.appointment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #f5f5f5;
}

.appointment-header h3 {
  margin: 0;
  font-size: 1.1rem;
  color: #333;
}

.days-left {
  font-size: 0.9rem;
  font-weight: 600;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  background-color: #f0f0f0;
}

.days-left.warning {
  background-color: #fff3e0;
  color: #e67e22;
}

.days-left.notice {
  background-color: #e3f2fd;
  color: #1976d2;
}

.days-left.expired {
  background-color: #ffebee;
  color: #d32f2f;
}

.appointment-details {
  margin-bottom: 1rem;
}

.detail-row {
  display: flex;
  margin-bottom: 0.5rem;
  font-size: 0.95rem;
}

.detail-label {
  font-weight: 500;
  color: #555;
  min-width: 120px;
}

.detail-value {
  color: #333;
}

.appointment-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  padding-top: 0.75rem;
  border-top: 1px solid #f5f5f5;
}

@media (max-width: 768px) {
  .filters {
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .filter-group {
    width: 100%;
  }
  
  .appointment-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .days-left {
    align-self: flex-start;
  }
  
  .detail-row {
    flex-direction: column;
    gap: 0.25rem;
  }
  
  .detail-label {
    min-width: auto;
  }
}
</style>
