<template>
  <div class="expiring-appointments-admin">
    <!-- Header Card -->
    <div class="ct-card header-card" style="width: 100%; border-radius: 0;">
      <div class="ct-card-header">
        <h1 class="ct-card-title">Auslaufende Termine - Admin Panel</h1>
      </div>
      <div class="ct-card-body">
        <p class="description">Überwachung und Verwaltung aller auslaufenden Terminserien</p>
        <div class="days-in-advance">
          <label>Zeige Serientermine, die in den nächsten:</label>
          <input 
            type="number" 
            v-model.number="daysInAdvance" 
            min="1" 
            max="365"
            @change="refreshData"
            class="ct-input"
          />
          <span>Tagen enden</span>
        </div>
      </div>
    </div>

    <div class="content-container">
      <!-- Controls Card -->
      <div class="ct-card controls-card">
        <div class="ct-card-body">
          <div class="controls-row">
            <div class="button-group">
              <button
                @click="refreshData"
                class="ct-btn ct-btn-primary refresh-btn"
                :disabled="isLoading"
              >
                {{ isLoading ? 'Lädt...' : 'Aktualisieren' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="isLoading && appointments.length === 0" class="loading">
      <div class="spinner"></div>
      <p>Lade Termine...</p>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="error">
      <p>{{ error }}</p>
      <button @click="fetchData" class="btn btn-primary">
        Erneut versuchen
      </button>
    </div>

    <!-- Content -->
    <div v-else class="content">
      <!-- Stats Summary -->
      <div class="ct-card stats-card">
        <div class="ct-card-body">
          <div class="stats-summary">
            <div class="stat-card">
              <div class="stat-value">{{ filteredAppointments.length }}</div>
              <div class="stat-label">Gesamte Termine</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">{{ getCountByStatus('expiring') }}</div>
              <div class="stat-label">Laufen bald ab</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">{{ getCountByStatus('expired') }}</div>
              <div class="stat-label">Abgelaufen</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="ct-card filters-card">
        <div class="ct-card-body">
          <div class="filter-group">
            <div class="filter-item">
              <label>Status:</label>
              <select v-model="selectedStatus" class="ct-select">
                <option
                  v-for="option in statusOptions"
                  :key="option.value"
                  :value="option.value"
                >
                  {{ option.label }}
                </option>
              </select>
            </div>
            <div class="filter-item">
              <label>Kalender:</label>
              <select v-model="selectedCalendar" class="ct-select">
                <option
                  v-for="option in calendarOptions"
                  :key="option.value"
                  :value="option.value"
                >
                  {{ option.label }}
                </option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- Appointments Table -->
    <div class="ct-card table-card">
      <div class="ct-card-header">
        <h3 class="ct-card-title">
          Auslaufende Termine ({{ filteredAppointments.length }})
        </h3>
      </div>
      <div class="ct-card-body">
        <div v-if="filteredAppointments.length === 0" class="empty-state">
          <p>Keine Termine gefunden</p>
        </div>
        
        <div v-else class="table-container">
          <table>
              <thead>
                <tr>
                    <th 
                    @click="handleSort('title')" 
                    class="sortable resizable"
                    :class="{ active: sortBy === 'title' }"
                    :style="{ width: columnWidths[0] + 'px' }"
                  >
                    <div class="header-content">
                      <span>Titel</span>
                      <span v-if="sortBy === 'title'" class="sort-indicator">
                        {{ sortOrder === 'asc' ? '↑' : '↓' }}
                      </span>
                    </div>
                    <div class="resize-handle" @mousedown="startResize($event, 0)"></div>
                  </th>
                  <th 
                    @click="handleSort('calendar')" 
                    class="sortable resizable"
                    :class="{ active: sortBy === 'calendar' }"
                    :style="{ width: columnWidths[1] + 'px' }"
                  >
                    <div class="header-content">
                      <span>Kalender</span>
                      <span v-if="sortBy === 'calendar'" class="sort-indicator">
                        {{ sortOrder === 'asc' ? '↑' : '↓' }}
                      </span>
                    </div>
                    <div class="resize-handle" @mousedown="startResize($event, 1)"></div>
                  </th>
                  <th 
                    @click="handleSort('startDate')" 
                    class="sortable resizable"
                    :class="{ active: sortBy === 'startDate' }"
                    :style="{ width: columnWidths[2] + 'px' }"
                  >
                    <div class="header-content">
                      <span>Nächstes Vorkommen</span>
                      <span v-if="sortBy === 'startDate'" class="sort-indicator">
                        {{ sortOrder === 'asc' ? '↑' : '↓' }}
                      </span>
                    </div>
                    <div class="resize-handle" @mousedown="startResize($event, 2)"></div>
                  </th>
                  <th 
                    @click="handleSort('repeatUntil')" 
                    class="sortable resizable"
                    :class="{ active: sortBy === 'repeatUntil' }"
                    :style="{ width: columnWidths[3] + 'px' }"
                  >
                    <div class="header-content">
                      <span>Letztes Vorkommen</span>
                      <span v-if="sortBy === 'repeatUntil'" class="sort-indicator">
                        {{ sortOrder === 'asc' ? '↑' : '↓' }}
                      </span>
                    </div>
                    <div class="resize-handle" @mousedown="startResize($event, 3)"></div>
                  </th>
                  <th 
                    @click="handleSort('status')" 
                    class="sortable resizable"
                    :class="{ active: sortBy === 'status' }"
                    :style="{ width: columnWidths[4] + 'px' }"
                  >
                    <div class="header-content">
                      <span>Status</span>
                      <span v-if="sortBy === 'status'" class="sort-indicator">
                        {{ sortOrder === 'asc' ? '↑' : '↓' }}
                      </span>
                    </div>
                    <div class="resize-handle" @mousedown="startResize($event, 4)"></div>
                  </th>
                  <th class="actions-header" :style="{ width: columnWidths[5] + 'px' }">
                    <div class="header-content">
                      <span>Aktionen</span>
                    </div>
                    <div class="resize-handle" @mousedown="startResize($event, 5)"></div>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="appointment in filteredAppointments" :key="appointment.id" class="appointment-row">
                  <td class="appointment-title" :style="{ width: columnWidths[0] + 'px' }">
                    <strong>{{ truncateText(appointment.base.title, 40) }}</strong>
                  </td>
                  <td class="calendar-cell" :style="{ width: columnWidths[1] + 'px' }">
                    <div 
                      class="calendar-info"
                      :style="{
                        borderLeft: `3px solid ${appointment.base.calendar?.color || '#cccccc'}`,
                        paddingLeft: '8px'
                      }"
                    >
                      <span class="calendar-name">
                        {{ appointment.base.calendar?.name || 'Unbekannter Kalender' }}
                      </span>
                    </div>
                  </td>
                  <td class="date-cell" :style="{ width: columnWidths[2] + 'px' }">
                    {{ formatDate(appointment.base.startDate) }}
                  </td>
                  <td class="date-cell" :style="{ width: columnWidths[3] + 'px' }">
                    {{ appointment.base.repeatUntil ? formatDate(appointment.base.repeatUntil) : 'Kein Enddatum' }}
                  </td>
                  <td class="status-cell" :style="{ width: columnWidths[4] + 'px' }">
                    <span :class="['status-badge', getStatusClass(appointment)]">
                      {{ getStatusText(getAppointmentStatus(appointment)) }}
                    </span>
                  </td>
                  <td class="actions">
                    <button 
                      class="btn-icon extend" 
                      title="Termin verlängern" 
                      @click="extendSeries(appointment)"
                    >
                      <font-awesome-icon icon="calendar-plus" />
                    </button>
                    <button 
                      class="btn-icon view" 
                      title="Details anzeigen" 
                      @click="viewDetails(appointment)"
                    >
                      <font-awesome-icon icon="eye" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { 
  fetchCalendars,
  fetchAppointments,
  findExpiringSeries,
  identifyCalendars,
  type Appointment,
  type Calendar
} from '@/services/churchtools'; 

interface CalendarMapEntry {
  name: string;
  isGroup: boolean;
}

// State
const isLoading = ref(true);
const error = ref<string | null>(null);
const selectedStatus = ref<string>('all');
const selectedCalendar = ref<string>('all');
const sortBy = ref('endDate');

// Column resizing
const columnWidths = ref<number[]>([200, 180, 160, 160, 120, 100]);
const isResizing = ref(false);
const resizingColumn = ref(-1);
const startX = ref(0);
const startWidth = ref(0);

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
  const newWidth = Math.max(80, startWidth.value + deltaX); // Minimum width of 80px
  
  const newWidths = [...columnWidths.value];
  newWidths[resizingColumn.value] = newWidth;
  columnWidths.value = newWidths;
};

const stopResize = () => {
  isResizing.value = false;
  resizingColumn.value = -1;
  
  document.removeEventListener('mousemove', handleResize);
  document.removeEventListener('mouseup', stopResize);
  document.body.style.cursor = '';
  document.body.style.userSelect = '';
};
const sortOrder = ref('asc');
const daysInAdvance = ref(60);

// Data
const appointments = ref<Appointment[]>([]);
const calendarMap = ref<Map<number, {name: string, isGroup: boolean}>>(new Map());

// Computed properties
const filteredAppointments = computed(() => {
  let result = [...appointments.value];
  
  // Apply status filter
  if (selectedStatus.value !== 'all') {
    result = result.filter(appointment => 
      getAppointmentStatus(appointment) === selectedStatus.value
    );
  }
  
  // Apply calendar filter
  if (selectedCalendar.value !== 'all') {
    result = result.filter(appointment => 
      appointment.base.calendar?.id?.toString() === selectedCalendar.value
    );
  }
  
  // Apply sorting
  if (sortBy.value) {
    result.sort((a, b) => {
      let valueA, valueB;
      
      if (sortBy.value === 'calendar') {
        valueA = a.base.calendar?.name?.toLowerCase() || '';
        valueB = b.base.calendar?.name?.toLowerCase() || '';
      } else if (sortBy.value === 'title') {
        valueA = a.base.title.toLowerCase();
        valueB = b.base.title.toLowerCase();
      } else if (sortBy.value === 'startDate') {
        valueA = new Date(a.base.startDate).getTime();
        valueB = new Date(b.base.startDate).getTime();
      } else if (sortBy.value === 'repeatUntil') {
        valueA = a.base.repeatUntil ? new Date(a.base.repeatUntil).getTime() : 0;
        valueB = b.base.repeatUntil ? new Date(b.base.repeatUntil).getTime() : 0;
      } else if (sortBy.value === 'status') {
        valueA = getAppointmentStatus(a);
        valueB = getAppointmentStatus(b);
      }
      
      if (typeof valueA === 'string' && typeof valueB === 'string') {
        return sortOrder.value === 'asc' 
          ? valueA.localeCompare(valueB)
          : valueB.localeCompare(valueA);
      }
      
      return sortOrder.value === 'asc' 
        ? (valueA < valueB ? -1 : valueA > valueB ? 1 : 0)
        : (valueA > valueB ? -1 : valueA < valueB ? 1 : 0);
    });
  }
  
  return result;
});

// Available filters
const statusOptions = [
  { value: 'all', label: 'Alle Status' },
  { value: 'active', label: 'Aktiv' },
  { value: 'expiring', label: 'Läuft bald ab' },
  { value: 'expired', label: 'Abgelaufen' },
];

const calendarOptions = [
  { value: 'all', label: 'Alle Kalender' },
  { value: 'church', label: 'Gemeindekalender' },
  { value: 'groups', label: 'Gruppenkalender' },
];

// Fetch data from ChurchTools API
const fetchData = async () => {
  isLoading.value = true;
  error.value = null;
  
  try {
    // First, identify all calendars
    const { publicCalendars } = await identifyCalendars();
    
    // Create calendar map for quick lookups
    publicCalendars.forEach(cal => {
      // Annahme: Gruppenkalender können anhand des Namens oder anderer Eigenschaften identifiziert werden
      // Hier müssen wir die Logik anpassen, falls es ein anderes Kriterium gibt
      const isGroup = cal.name.includes('Gruppe') || cal.name.includes('Team');
      calendarMap.value.set(cal.id, { name: cal.name, isGroup });
    });
    
    // Fetch expiring series
    const expiringSeries = await findExpiringSeries(daysInAdvance.value);
    
    // Bereinige die Daten, um sicherzustellen, dass alle erforderlichen Felder vorhanden sind
    appointments.value = expiringSeries.map(appointment => {
      // Stelle sicher, dass das base-Objekt existiert
      if (!appointment.base) {
        appointment.base = {
          ...appointment,
          calendar: appointment.calendar || { id: 0, name: 'Unbekannt', color: '#cccccc' },
          repeatUntil: appointment.series?.repeatUntil
        };
      }
      return appointment;
    });
    
  } catch (err) {
    console.error('Error fetching appointments:', err);
    error.value = 'Fehler beim Laden der Termine. Bitte versuchen Sie es später erneut.';
  } finally {
    isLoading.value = false;
  }
};

// View appointment details
const viewDetails = (appointment: Appointment) => {
  // Hier können Sie eine Detailansicht öffnen oder eine Aktion ausführen
  console.log('View details for appointment:', appointment);
  
  // Erstelle eine detaillierte Meldung mit den verfügbaren Informationen
  const details = [
    `Titel: ${appointment.base.title || appointment.title || 'Kein Titel'}`,
    `Start: ${formatDate(appointment.startDate)} um ${formatTime(appointment.startDate)}`,
    `Ende: ${formatDate(appointment.endDate)} um ${formatTime(appointment.endDate)}`,
    `Kalender: ${appointment.base.calendar?.name || 'Unbekannt'}`,
    `Wiederholung: ${appointment.series ? 'Ja' : 'Nein'}`,
    `Läuft ab: ${appointment.base.repeatUntil ? formatDate(appointment.base.repeatUntil) : 'Kein Enddatum'}`,
    `Notiz: ${appointment.base.note || 'Keine Notiz'}`
  ].join('\n');
  
  alert(details);
};

// Extend appointment series
const extendSeries = async (appointment: Appointment) => {
  if (!confirm('Möchten Sie diese Terminserie wirklich verlängern?')) {
    return;
  }
  
  try {
    // Hier würden Sie die Logik zum Verlängern der Terminserie implementieren
    // Zum Beispiel einen API-Aufruf an ChurchTools
    console.log('Extending series for appointment:', appointment);
    
    // Simuliere eine API-Antwort
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    alert('Terminserie wurde erfolgreich verlängert (Simulation).');
    
    // Daten aktualisieren
    await fetchData();
  } catch (err) {
    console.error('Error extending series:', err);
    alert('Fehler beim Verlängern der Terminserie. Bitte versuchen Sie es später erneut.');
  }
};

// Get status of an appointment
const getAppointmentStatus = (appointment: Appointment): string => {
  // Verwende repeatUntil aus series oder base, je nachdem was verfügbar ist
  const repeatUntil = appointment.series?.repeatUntil || appointment.base?.repeatUntil;
  
  // Wenn es keine Wiederholung gibt, ist der Termin aktiv
  if (!repeatUntil) return 'active';
  
  const endDate = new Date(repeatUntil);
  const today = new Date();
  const daysUntilEnd = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  if (endDate < today) return 'expired';
  if (daysUntilEnd <= 30) return 'expiring';
  return 'active';
};

// Get count of appointments by status
const getCountByStatus = (status: string): number => {
  if (status === 'all') return appointments.value.length;
  return appointments.value.filter(appointment => {
    return getAppointmentStatus(appointment) === status;
  }).length;
};

// Get status display text
const getStatusText = (status: string): string => {
  switch (status) {
    case 'active':
      return 'Aktiv';
    case 'expiring':
      return 'Läuft bald ab';
    case 'expired':
      return 'Abgelaufen';
    default:
      return status;
  }
};

// Format date for display
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString();
};

// Format time for display
const formatTime = (dateString: string) => {
  return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// Truncate text to a specified length and add ellipsis if needed
const truncateText = (text: string | undefined, maxLength: number): string => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// Get status class
const getStatusClass = (appointment: Appointment) => {
  const status = getAppointmentStatus(appointment);
  return `status-${status}`;
};

// Handle sort
const handleSort = (column: string) => {
  if (sortBy.value === column) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortBy.value = column;
    sortOrder.value = 'asc';
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

<style scoped>
/* Table resizing */
.resize-handle {
  position: absolute;
  top: 0;
  right: 0;
  width: 5px;
  height: 100%;
  background: transparent;
  cursor: col-resize;
  z-index: 1;
}

.resize-handle:hover,
.resize-handle:active {
  background-color: var(--ct-primary, #3498db);
  opacity: 0.5;
}

th {
  position: relative;
  user-select: none;
}

th.sortable {
  cursor: pointer;
  transition: background-color 0.2s;
}

th.sortable:hover {
  background-color: var(--ct-bg-tertiary, #f1f3f5);
}

th.active {
  color: var(--ct-primary, #3498db);
  font-weight: 600;
}

/* Table layout */
table {
  table-layout: fixed;
  min-width: 100%;
}

th, td {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  vertical-align: middle;
}

/* Calendar info cell */
.calendar-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
}

.calendar-name {
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Status badges */
.status-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: capitalize;
  white-space: nowrap;
}

/* Action buttons */
.actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
  padding: 0.5rem;
}

/* Empty state */
.empty-state {
  padding: 2rem;
  text-align: center;
  color: var(--ct-text-secondary, #6c757d);
}

/* Responsive table */
@media (max-width: 1200px) {
  .table-container {
    width: 100%;
    max-width: 100%;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    display: block;
    padding: 0 1rem;
    margin: 0 -1rem;
  }
  
  table {
    width: 100%;
  }
}

/* ===== Reusable Table Styles ===== */
/* Table container */
.table-container {
  width: 100%;
  max-width: 100%;
  overflow-x: auto;
  border-radius: 8px;
  background: var(--ct-bg-primary, #ffffff);
  margin-bottom: 0;
  -webkit-overflow-scrolling: touch;
  display: block;
  flex: 1;
  min-height: 400px;
}

.table-card {
  background: var(--ct-bg-primary, #ffffff);
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  margin: 2rem 0;
  width: 100%;
  max-width: 100%;
  min-height: 500px;
  overflow: auto;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
}

.table-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.ct-card-header {
padding: 1.25rem 1.5rem;
border-bottom: 1px solid var(--ct-border-color, #e0e0e0);
background: var(--ct-bg-secondary, #f8f9fa);
  background: var(--ct-bg-secondary, #f8f9fa);
}

.ct-card-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--ct-text-primary, #2c3e50);
}

.ct-card-body {
  padding: 2rem;
  flex: 1;
  display: flex;
  flex-direction: column;
}

table {
  width: 100%;
  min-width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  margin: 0;
  padding: 0;
}

table th {
  text-align: left;
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--ct-text-secondary, #6c757d);
  background-color: var(--ct-bg-secondary, #f8f9fa);
  white-space: nowrap;
  position: relative;
  letter-spacing: 0.02em;
  overflow: visible;
  box-sizing: border-box;
}

th.sortable {
  cursor: pointer;
  user-select: none;
  position: relative;
}

th.sortable:hover {
  background-color: var(--ct-bg-tertiary, #e9ecef);
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.sort-indicator {
  margin-left: 0.5rem;
  font-weight: bold;
  display: inline-block;
  color: var(--ct-primary, #3498db);
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
  background: var(--ct-primary, #3498db);
  opacity: 0.5;
}

.resize-handle:active {
  background: var(--ct-primary, #3498db);
  opacity: 0.8;
}

/* Make sure the header content doesn't overlap with the resize handle */
.header-content {
  padding-right: 8px;
  position: relative;
  z-index: 1;
}

tr:not(:last-child) {
  border-bottom: 1px solid var(--ct-border-color, #e0e0e0);
}

tr:hover {
  background-color: var(--ct-bg-secondary, #f8f9fa);
}

/* Status Badges */
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

.status-expired {
  background-color: rgba(220, 53, 69, 0.1);
  color: #dc3545;
}

.status-upcoming {
  background-color: rgba(23, 162, 184, 0.1);
  color: #17a2b8;
}

/* Action Buttons */
.actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}

.btn-icon {
  width: 32px;
  height: 32px;
  border-radius: 4px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border: none;
  transition: all 0.2s ease;
  color: white;
  font-size: 14px;
  opacity: 0.8;
}

.btn-icon:hover {
  opacity: 1;
  transform: translateY(-1px);
}

.btn-icon:active {
  transform: translateY(0);
}

.btn-icon.view {
  background-color: var(--ct-success, #28a745);
}

.btn-icon.extend {
  background-color: var(--ct-danger, #dc3545);
}

/* Calendar Color Dot */
.calendar-info {
  display: flex;
  align-items: center;
  height: 100%;
}

/* Buttons */
.ct-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.ct-btn-primary {
  background-color: var(--ct-primary, #3498db);
  color: white;
}

.ct-btn-primary:hover {
  background-color: var(--ct-primary-dark, #2980b9);
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.ct-btn-outline {
  background: transparent;
  border: 1px solid var(--ct-primary, #3498db);
  color: var(--ct-primary, #3498db);
}

.ct-btn-outline:hover {
  background-color: rgba(52, 152, 219, 0.1);
}

/* Loading and error states */
.loading, .error, .no-results {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  text-align: center;
  background: var(--ct-bg-secondary, #f8f9fa);
  border-radius: 8px;
  min-height: 200px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(52, 152, 219, 0.2);
  border-radius: 50%;
  border-top-color: var(--ct-primary, #3498db);
  animation: spin 1s ease-in-out infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

error {
  color: #dc3545;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .filters {
    flex-direction: column;
    align-items: stretch;
  }
  
  .filter-group {
    width: 100%;
  }
  
  .search-box {
    width: 100%;
  }
  
  table {
    display: block;
    overflow-x: auto;
    white-space: nowrap;
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .expiring-appointments-admin {
    --ct-bg-primary: #1e1e2d;
    --ct-bg-secondary: #2a2a3c;
    --ct-text-primary: #f0f0f0;
    --ct-text-secondary: #a0a0a0;
    --ct-border-color: #3a3a4a;
    --ct-bg-hover: #2f2f3f;
  }
  
  .appointments-table {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  }
  
  input, select {
    background-color: #2a2a3c !important;
    border-color: #3a3a4a !important;
    color: #f0f0f0 !important;
  }
}
.expiring-appointments-admin {
  padding: 0;
  max-width: 100%;
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  color: var(--ct-text-primary, #2c3e50);
  line-height: 1.5;
}

.content-container {
  padding: 1.5rem;
  max-width: 1600px;
  margin: 0 auto;
  width: 100%;
}

/* Old header styles - can be removed if not needed */
.header {
  margin-bottom: 2.5rem;
  background: var(--card-bg);
  padding: 1.5rem;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.header h1 {
  margin: 0;
  color: var(--primary-color);
  font-size: 1.8rem;
  font-weight: 600;
}

.subtitle {
  margin: 0.5rem 0 1.5rem;
  color: var(--text-secondary);
  font-size: 1rem;
}

.days-in-advance {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: var(--bg-secondary);
  padding: 0.75rem 1rem;
  border-radius: 6px;
  margin-top: 1.25rem;
  max-width: fit-content;
}

.days-in-advance label {
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.days-in-advance input {
  width: 80px;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background: var(--bg-color);
  color: var(--text-primary);
  text-align: center;
}

.days-in-advance input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(var(--primary-rgb), 0.1);
}

/* Stats Summary */
.stats-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.25rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: var(--card-bg);
  border-radius: 8px;
  padding: 1.5rem;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: transform 0.2s, box-shadow 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stat-value {
  font-size: 2.2rem;
  font-weight: 700;
  color: var(--primary-color);
  line-height: 1.2;
  margin-bottom: 0.5rem;
}

.stat-label {
  font-size: 0.95rem;
  color: var(--text-secondary);
  font-weight: 500;
}

/* Filters */
.filters {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.75rem;
  flex-wrap: wrap;
  align-items: flex-end;
  background: var(--card-bg);
  padding: 1.25rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.search-box {
  position: relative;
  flex: 1;
  min-width: 280px;
}

.search-box input {
  width: 100%;
  padding: 0.65rem 1rem 0.65rem 2.75rem;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 0.95rem;
  background: var(--bg-color);
  color: var(--text-primary);
  transition: all 0.2s;
}

.search-box input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(var(--primary-rgb), 0.1);
}

.search-icon {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-tertiary);
  pointer-events: none;
}

.filter-group {
  display: flex;
  flex-direction: column;
  min-width: 180px;
}

.filter-group label {
  font-size: 0.85rem;
  margin-bottom: 0.4rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.filter-group select {
  padding: 0.65rem 1rem;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 0.95rem;
  background: var(--bg-color);
  color: var(--text-primary);
  cursor: pointer;
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  background-image: url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%236B7280%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E");
  background-repeat: no-repeat;
  background-position: right 0.7rem top 50%;
  background-size: 0.65rem auto;
}

.filter-group select:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(var(--primary-rgb), 0.1);
}

/* Appointments Table */
.appointments-table {
  background: var(--card-bg);
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  margin-bottom: 2rem;
  border: 1px solid var(--border-color);
}

table {
  width: 100%;
  min-width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  margin: 0;
  padding: 0;
}

th,
td {
  padding: 1.25rem 1.5rem;
  text-align: left;
  border-bottom: 1px solid var(--border-color);
  vertical-align: middle;
}

th {
  background-color: var(--bg-secondary);
  font-weight: 600;
  color: var(--text-primary);
  cursor: pointer;
  user-select: none;
  position: relative;
  font-size: 0.85rem;
  letter-spacing: 0.5px;
  white-space: nowrap;
}

th:last-child {
  text-align: right;
  cursor: default;
}

th:hover {
  background-color: var(--bg-hover);
}

th .sort-icon {
  margin-left: 0.5rem;
  opacity: 0.6;
  transition: opacity 0.2s;
}

th:hover .sort-icon {
  opacity: 1;
}

.sort-icon.asc::before {
  content: '↑';
}

.sort-icon.desc::before {
  content: '↓';
}

tbody tr:last-child td {
  border-bottom: none;
}

tbody tr:hover {
  background-color: var(--bg-hover);
}

/* Appointment row styles */
.appointment-title {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.appointment-title strong {
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1.4;
}

.appointment-time {
  font-size: 0.85rem;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.appointment-note {
  margin-top: 0.5rem;
  font-size: 0.85rem;
  color: var(--text-tertiary);
  display: flex;
  align-items: flex-start;
  gap: 0.4rem;
  line-height: 1.4;
}

.appointment-note i {
  color: var(--primary-color);
  margin-top: 0.2rem;
  flex-shrink: 0;
}

/* Calendar info */
.calendar-info {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.calendar-color {
  width: 12px;
  height: 12px;
  border-radius: 2px;
  display: inline-block;
  flex-shrink: 0;
}

/* Status badges */
.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.4rem 0.9rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.3px;
  white-space: nowrap;
  text-transform: capitalize;
}

.status-active {
  background-color: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.status-expiring {
  background-color: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
}

.status-expired {
  background-color: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

/* Actions */
.actions {
  display: flex;
  gap: 0.4rem;
  justify-content: flex-end;
  padding-right: 0.5rem;
}

.btn-icon {
  background: none;
  border: none;
  color: var(--text-tertiary);
  cursor: pointer;
  width: 36px;
  height: 36px;
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  font-size: 1rem;
}

.btn-icon:hover {
  background-color: var(--bg-hover);
  color: var(--primary-color);
  transform: translateY(-1px);
}

.btn-icon:active {
  transform: translateY(0);
}

/* No results */
.no-results {
  padding: 3rem 2rem;
  text-align: center;
  color: var(--text-tertiary);
  font-style: italic;
  background: var(--bg-secondary);
  border-radius: 0 0 8px 8px;
}

/* Loading and Error States */
.loading,
.error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
  background: var(--card-bg);
  border-radius: 10px;
  min-height: 300px;
  margin: 1rem 0;
}

.spinner {
  width: 3.5rem;
  height: 3.5rem;
  border: 0.35rem solid rgba(var(--primary-rgb), 0.1);
  border-top-color: var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1.5rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error .btn {
  margin-top: 1.5rem;
  padding: 0.6rem 1.5rem;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s, transform 0.2s;
}

.error .btn:hover {
  background: var(--primary-dark);
  transform: translateY(-1px);
}

/* Responsive */
@media (max-width: 1200px) {
  .expiring-appointments-admin {
    padding: 1.25rem;
  }
  
  .stats-summary {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  }
  
  th, td {
    padding: 1rem 1.25rem;
  }
}

@media (max-width: 992px) {
  .filters {
    gap: 0.75rem;
  }
  
  .filter-group {
    min-width: 160px;
  }
  
  .search-box {
    min-width: 240px;
  }
  
  table {
    display: block;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
  
  th, td {
    white-space: nowrap;
  }
}

@media (max-width: 768px) {
  .header {
    padding: 1.25rem;
  }
  
  .header h1 {
    font-size: 1.5rem;
  }
  
  .stats-summary {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .filters {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }
  
  .filter-group, 
  .search-box {
    width: 100%;
    min-width: 100%;
  }
  
  .days-in-advance {
    max-width: 100%;
  }
  
  th, td {
    padding: 0.9rem 1rem;
    font-size: 0.9rem;
  }
  
  .status-badge {
    padding: 0.3rem 0.7rem;
    font-size: 0.75rem;
  }
  
  .btn-icon {
    width: 32px;
    height: 32px;
    font-size: 0.9rem;
  }
}

/* Dark mode adjustments */
@media (prefers-color-scheme: dark) {
  .appointments-table {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  }
  
  .stat-card {
    background: var(--bg-secondary);
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  }
  
  .filters {
    background: var(--bg-secondary);
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  }
  
  .search-box input,
  .filter-group select {
    background: var(--bg-color);
    border-color: var(--border-dark);
    color: var(--text-primary);
  }
  
  .search-icon {
    color: var(--text-tertiary);
  }
}

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
