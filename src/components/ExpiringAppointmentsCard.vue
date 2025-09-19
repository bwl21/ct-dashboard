<template>
  <div class="ct-card feature-card expiring-appointments-card">
    <div class="card-header">
      <div class="header-left">
        <span class="card-icon">📅</span>
        <h3>Auslaufende Termine</h3>
      </div>
      <div class="header-actions">
        <div class="days-in-advance" v-if="appointments.length > 0">
          <span>Zeige nächste</span>
          <select v-model="daysInAdvance" @change="fetchData" :disabled="isLoading">
            <option value="7">7 Tage</option>
            <option value="14">14 Tage</option>
            <option value="30" selected>30 Tage</option>
            <option value="60">60 Tage</option>
            <option value="90">90 Tage</option>
          </select>
        </div>
        <button 
          class="refresh-btn" 
          @click="refreshData" 
          :disabled="isLoading" 
          title="Aktualisieren"
          :class="{ 'refreshing': isLoading }"
        >
          <i class="fas" :class="{ 'fa-sync-alt': !isLoading, 'fa-spinner fa-spin': isLoading }"></i>
        </button>
      </div>
    </div>
    <div class="ct-card-body">
      <div class="expiring-appointments-card">
        
        <div class="card-content">
          <!-- Loading state -->
          <div v-if="isLoading && appointments.length === 0" class="loading-state">
            <div class="spinner"></div>
            <p>Lade Termine...</p>
          </div>
          
          <!-- Error state -->
          <div v-else-if="error" class="error-state">
            <i class="fas fa-exclamation-triangle"></i>
            <p>{{ error }}</p>
            <button class="retry-btn" @click="refreshData">
              <i class="fas fa-redo"></i> Erneut versuchen
            </button>
          </div>
          
          <!-- Empty state -->
          <div v-else-if="appointments.length === 0" class="empty-state">
            <i class="fas fa-calendar-check"></i>
            <p>Keine auslaufenden Terminreihen gefunden</p>
            <p class="hint">Alle wiederkehrenden Terminreihen sind aktuell</p>
          </div>
          
          <!-- Appointments list -->
          <div v-else class="appointments-list">
            <div class="stats-row">
              <div class="stat-item">
                <span class="stat-value">{{ appointments.length }}</span>
                <span class="stat-label">Gesamt</span>
              </div>
              <div class="stat-item">
                <span class="stat-value expiring">{{ expiringCount }}</span>
                <span class="stat-label">Läuft ab</span>
              </div>
              <div class="stat-item">
                <span class="stat-value expired">{{ expiredCount }}</span>
                <span class="stat-label">Abgelaufen</span>
              </div>
            </div>
            
            <div class="appointments">
              <div 
                v-for="appointment in visibleAppointments" 
                :key="appointment.id" 
                class="appointment-item"
                :class="getStatusClass(appointment)"
              >
                <div class="appointment-header">
                  <h4 class="appointment-title" :title="appointment.title">
                    {{ appointment.title }}
                  </h4>
                  <span class="calendar-tag" :style="{ backgroundColor: appointment.calendar.color }">
                    {{ appointment.calendar.name }}
                  </span>
                </div>
                
                <div class="appointment-details">
                  <div class="detail-row">
                    <i class="fas fa-calendar-alt"></i>
                    <span>{{ formatDate(appointment.startDate) }}</span>
                    <span class="time">{{ formatTime(appointment.startDate) }} - {{ formatTime(appointment.endDate) }}</span>
                  </div>
                  
                  <div v-if="appointment.series?.repeatUntil" class="detail-row">
                    <i class="fas fa-flag-checkered"></i>
                    <span>Endet am {{ formatDate(appointment.series.repeatUntil) }}</span>
                    <span class="days-left">
                      <i class="fas" :class="getDaysLeftIcon(appointment)"></i>
                      {{ getDaysLeftText(appointment) }}
                    </span>
                  </div>
                  
                  <div v-if="appointment.note" class="appointment-note">
                    <i class="fas fa-info-circle"></i>
                    <span>{{ truncateText(appointment.note, 60) }}</span>
                  </div>
                </div>
                
                <div class="appointment-actions">
                  <button 
                    class="action-btn extend" 
                    @click="$emit('extend', appointment)"
                    title="Reihe verlängern"
                  >
                    <i class="fas fa-calendar-plus"></i>
                  </button>
                  <button 
                    class="action-btn view" 
                    @click="$emit('view', appointment)"
                    title="Details anzeigen"
                  >
                    <i class="fas fa-eye"></i>
                  </button>
                </div>
              </div>
            </div>
            
            <div v-if="hasMore" class="show-more">
              <button class="show-more-btn" @click="toggleShowAll">
                {{ showAll ? 'Weniger anzeigen' : 'Mehr anzeigen' }}
                <i class="fas" :class="{ 'fa-chevron-up': showAll, 'fa-chevron-down': !showAll }"></i>
              </button>
            </div>
          </div>
        </div>
        
        <div class="card-footer">
          <button @click="$emit('navigate')" class="view-all-btn">
            Alle Termine anzeigen <i class="fas fa-arrow-right"></i>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { findExpiringSeries, type Appointment } from '@/services/churchtools';

// Props
defineProps({
  module: {
    type: Object,
    required: true
  }
});

// State
const isLoading = ref(true);
const error = ref<string | null>(null);
const showAll = ref(false);
const daysInAdvance = ref(30);

// Data
const appointments = ref<Appointment[]>([]);

// Computed properties
const visibleAppointments = computed(() => {
  return showAll.value ? appointments.value : appointments.value.slice(0, 3);
});

const hasMore = computed(() => {
  return appointments.value.length > 3;
});

const expiringCount = computed(() => {
  return appointments.value.filter(a => getAppointmentStatus(a) === 'expiring').length;
});

const expiredCount = computed(() => {
  return appointments.value.filter(a => getAppointmentStatus(a) === 'expired').length;
});

// Get status of an appointment
const getAppointmentStatus = (appointment: Appointment): string => {
  if (!appointment.series?.repeatUntil) return 'active';
  
  const endDate = new Date(appointment.series.repeatUntil);
  const today = new Date();
  const daysUntilEnd = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  if (endDate < today) return 'expired';
  if (daysUntilEnd <= 30) return 'expiring';
  return 'active';
};

// Get days left until the appointment series ends
const getDaysLeft = (appointment: Appointment): number => {
  if (!appointment.series?.repeatUntil) return 999;
  
  const endDate = new Date(appointment.series.repeatUntil);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const diffTime = endDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Fetch data from ChurchTools API
const fetchData = async () => {
  isLoading.value = true;
  error.value = null;
  
  try {
    const expiringSeries = await findExpiringSeries(daysInAdvance.value);
    appointments.value = expiringSeries;
  } catch (err) {
    console.error('Error fetching appointments:', err);
    error.value = 'Fehler beim Laden der Termine. Bitte versuchen Sie es erneut.';
  } finally {
    isLoading.value = false;
  }
};

// Format date for display
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString();
};

// Get status class
const getStatusClass = (appointment: Appointment) => {
  const status = getAppointmentStatus(appointment);
  return `status-${status}`;
};

// Get status text
const getStatusText = (appointment: Appointment) => {
  const status = getAppointmentStatus(appointment);
  const daysLeft = getDaysLeft(appointment);
  
  if (status === 'expired') {
    return t('expiredAgo', { days: Math.abs(daysLeft) });
  } else if (status === 'expiring') {
    return t('expiresInDays', { days: daysLeft });
  } else {
    return t('active');
  }
};

// Toggle show all appointments
const toggleShowAll = () => {
  showAll.value = !showAll.value;
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

<style scoped>
.expiring-appointments-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--ct-card-bg, white);
  border-radius: var(--ct-border-radius, 8px);
  box-shadow: var(--ct-box-shadow, 0 2px 8px rgba(0, 0, 0, 0.1));
  overflow: hidden;
  transition: all 0.3s ease;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid var(--ct-border-color, #e2e8f0);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.header-left h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--ct-heading-color, #2c3e50);
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  white-space: nowrap;
}

.card-icon {
  display: inline-flex;
  align-items: center;
  font-size: 1.5rem;
  line-height: 1;
}

.card-header h3 i {
  color: var(--ct-primary-color, #3498db);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.days-in-advance {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: var(--ct-text-secondary, #6c757d);
  background: var(--ct-bg-secondary, #f1f3f5);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}

.days-in-advance select {
  padding: 0.25rem 0.5rem;
  border: 1px solid var(--ct-border-color, #ced4da);
  border-radius: 4px;
  background: var(--ct-bg-color, white);
  color: var(--ct-text-primary, #2c3e50);
  font-size: 0.85rem;
  cursor: pointer;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.days-in-advance select:focus {
  outline: none;
  border-color: var(--ct-primary-color, #3498db);
  box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
}

.refresh-btn {
  background: none;
  border: none;
  color: var(--ct-text-secondary, #6c757d);
  cursor: pointer;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  position: relative;
}

.refresh-btn:not(:disabled):hover {
  color: var(--ct-primary-color, #3498db);
  background: var(--ct-bg-hover, rgba(52, 152, 219, 0.1));
  transform: rotate(30deg);
}

.refresh-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.refresh-btn.refreshing {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.card-content {
  flex: 1;
  padding: 1.25rem;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--ct-scrollbar-thumb, #c1c1c1) var(--ct-scrollbar-track, #f1f1f1);
}

.card-content::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.card-content::-webkit-scrollbar-track {
  background: var(--ct-scrollbar-track, #f1f1f1);
  border-radius: 3px;
}

.card-content::-webkit-scrollbar-thumb {
  background: var(--ct-scrollbar-thumb, #c1c1c1);
  border-radius: 3px;
}

.card-content::-webkit-scrollbar-thumb:hover {
  background: var(--ct-scrollbar-thumb-hover, #a8a8a8);
}

.loading-state,
.error-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
  text-align: center;
  color: var(--ct-text-secondary, #6c757d);
  height: 100%;
  min-height: 200px;
}

.loading-state .spinner {
  width: 2.5rem;
  height: 2.5rem;
  border: 3px solid var(--ct-loading-spinner-track, rgba(44, 62, 80, 0.1));
  border-top-color: var(--ct-primary-color, #3498db);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

.error-state i {
  font-size: 2rem;
  color: var(--ct-danger, #e74c3c);
  margin-bottom: 1rem;
}

.empty-state i {
  font-size: 2.5rem;
  color: var(--ct-text-tertiary, #95a5a6);
  margin-bottom: 1rem;
  opacity: 0.7;
}

.empty-state .hint {
  font-size: 0.9rem;
  color: var(--ct-text-tertiary, #95a5a6);
  margin-top: 0.5rem;
  max-width: 280px;
}

.retry-btn {
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  background: var(--ct-primary-color, #3498db);
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.retry-btn:hover {
  background: var(--ct-primary-dark, #2980b9);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.retry-btn:active {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.stat-item {
  text-align: center;
  padding: 0.75rem;
  background: var(--ct-bg-secondary, #f8f9fa);
  border-radius: 8px;
  border: 1px solid var(--ct-border-color, #e9ecef);
  transition: all 0.2s;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.stat-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.08);
}

.stat-value {
  display: block;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--ct-text-primary, #2c3e50);
  line-height: 1.2;
  margin-bottom: 0.25rem;
  font-feature-settings: 'tnum';
  font-variant-numeric: tabular-nums;
}

.stat-value.expiring {
  color: var(--ct-warning, #f39c12);
}

.stat-value.expired {
  color: var(--ct-danger, #e74c3c);
}

.stat-label {
  font-size: 0.75rem;
  color: var(--ct-text-secondary, #6c757d);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 600;
}

.appointments {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.appointment-item {
  background: var(--ct-card-bg, white);
  border: 1px solid var(--ct-border-color, #e9ecef);
  border-radius: 8px;
  padding: 1.25rem;
  transition: all 0.2s;
  position: relative;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.appointment-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border-color: var(--ct-primary-light, #d0e3ff);
}

.appointment-item.status-expiring {
  border-left: 4px solid var(--ct-warning, #f39c12);
}

.appointment-item.status-expired {
  border-left: 4px solid var(--ct-danger, #e74c3c);
}

.appointment-item.status-active {
  border-left: 4px solid var(--ct-success, #2ecc71);
}

.appointment-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.75rem;
  gap: 0.75rem;
}

.appointment-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--ct-text-primary, #2c3e50);
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding-right: 0.5rem;
  line-height: 1.4;
}

.calendar-tag {
  font-size: 0.7rem;
  font-weight: 600;
  color: white;
  padding: 0.2rem 0.6rem;
  border-radius: 12px;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  max-width: 120px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.appointment-details {
  font-size: 0.85rem;
  color: var(--ct-text-secondary, #6c757d);
  line-height: 1.5;
}

.detail-row {
  display: flex;
  align-items: center;
  margin-bottom: 0.4rem;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.detail-row i {
  width: 1rem;
  text-align: center;
  color: var(--ct-text-tertiary, #95a5a6);
  font-size: 0.9em;
  opacity: 0.8;
}

.time,
.days-left {
  font-size: 0.8rem;
  color: var(--ct-text-tertiary, #95a5a6);
  margin-left: 0.25rem;
  font-feature-settings: 'tnum';
  font-variant-numeric: tabular-nums;
}

.days-left {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-weight: 500;
  padding: 0.2rem 0.5rem;
  border-radius: 10px;
  background: var(--ct-bg-secondary, #f1f3f5);
  font-size: 0.75rem;
}

.appointment-item.status-expiring .days-left {
  background: rgba(243, 156, 18, 0.1);
  color: var(--ct-warning, #f39c12);
}

.appointment-item.status-expired .days-left {
  background: rgba(231, 76, 60, 0.1);
  color: var(--ct-danger, #e74c3c);
}

.appointment-note {
  margin-top: 0.75rem;
  padding: 0.75rem;
  background: var(--ct-bg-secondary, #f8f9fa);
  border-radius: 6px;
  font-size: 0.8rem;
  color: var(--ct-text-secondary, #6c757d);
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  line-height: 1.5;
  border-left: 3px solid var(--ct-primary-light, #d0e3ff);
}

.appointment-note i {
  color: var(--ct-primary-color, #3498db);
  margin-top: 0.1rem;
  flex-shrink: 0;
}

.appointment-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--ct-border-color, #f1f1f1);
}

.action-btn {
  padding: 0.5rem 0.75rem;
  border: none;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  transition: all 0.2s;
  min-width: 32px;
  justify-content: center;
}

action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.action-btn i {
  font-size: 0.9em;
}

.action-btn.extend {
  background: var(--ct-bg-secondary, #f8f9fa);
  color: var(--ct-text-secondary, #6c757d);
}

.action-btn.extend:not(:disabled):hover {
  background: var(--ct-bg-tertiary, #e9ecef);
  color: var(--ct-text-primary, #2c3e50);
}

.action-btn.view {
  background: var(--ct-primary-color, #3498db);
  color: white;
  box-shadow: 0 1px 2px rgba(52, 152, 219, 0.2);
}

.action-btn.view:not(:disabled):hover {
  background: var(--ct-primary-dark, #2980b9);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(52, 152, 219, 0.25);
}

.action-btn.view:active {
  transform: translateY(0);
  box-shadow: 0 1px 2px rgba(52, 152, 219, 0.2);
}

.show-more {
  margin-top: 1.25rem;
  text-align: center;
}

.show-more-btn {
  background: none;
  border: none;
  color: var(--ct-primary-color, #3498db);
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  transition: all 0.2s;
}

.show-more-btn:hover {
  background: var(--ct-primary-light, rgba(52, 152, 219, 0.1));
  color: var(--ct-primary-dark, #2980b9);
}

.show-more-btn i {
  font-size: 0.8em;
  transition: transform 0.2s;
}

.show-more-btn:hover i {
  transform: translateY(1px);
}

.card-footer {
  padding: 0.75rem 1.25rem;
  background: var(--ct-card-footer-bg, #f8f9fa);
  border-top: 1px solid var(--ct-border-color, #e9ecef);
  text-align: right;
}

.view-all-btn {
  background: none;
  border: none;
  color: var(--ct-primary-color, #3498db);
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.75rem 0.4rem 0.5rem;
  border-radius: 20px;
  transition: all 0.2s;
  background: var(--ct-bg-secondary, #f1f3f5);
}

.view-all-btn:hover {
  background: var(--ct-primary-light, rgba(52, 152, 219, 0.1));
  color: var(--ct-primary-dark, #2980b9);
  transform: translateX(2px);
}

.view-all-btn i {
  font-size: 0.8em;
  transition: transform 0.2s;
}

.view-all-btn:hover i {
  transform: translateX(2px);
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }
  
  .header-actions {
    width: 100%;
    justify-content: space-between;
  }
  
  .days-in-advance {
    margin-left: auto;
  }
  
  .stats-row {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }
  
  .stat-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 1rem;
    text-align: left;
  }
  
  .stat-value {
    display: inline-block;
    font-size: 1.25rem;
    margin: 0 0 0 0.5rem;
  }
  
  .appointment-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .appointment-title {
    width: 100%;
    white-space: normal;
  }
  
  .calendar-tag {
    align-self: flex-start;
  }
  
  .appointment-actions {
    justify-content: space-between;
  }
  
  .action-btn {
    flex: 1;
    justify-content: center;
  }
}

/* Print styles */
@media print {
  .expiring-appointments-card {
    box-shadow: none;
    border: 1px solid #ddd;
    break-inside: avoid;
  }
  
  .card-header,
  .card-footer {
    display: none;
  }
  
  .appointment-item {
    break-inside: avoid;
    page-break-inside: avoid;
  }
}

/* Animation for list items */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.appointment-item {
  animation: fadeIn 0.3s ease-out forwards;
  opacity: 0;
}

.appointment-item:nth-child(1) { animation-delay: 0.05s; }
.appointment-item:nth-child(2) { animation-delay: 0.1s; }
.appointment-item:nth-child(3) { animation-delay: 0.15s; }
.appointment-item:nth-child(4) { animation-delay: 0.2s; }
.appointment-item:nth-child(5) { animation-delay: 0.25s; }
</style>
