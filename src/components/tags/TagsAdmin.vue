<template>
  <div class="tags-admin">
    <!-- Header Card -->
    <div class="ct-card header-card">
      <div class="ct-card-header">
        <h1 class="ct-card-title">Tags - Admin Panel</h1>
      </div>
      <div class="ct-card-body">
        <p class="description">Verwaltung aller Tags in ChurchTools</p>
        <div class="stats-row">
          <div class="stat-item">
            <span class="stat-number">{{ tags.length }}</span>
            <span class="stat-label">Tags gesamt</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">{{ personTagsCount }}</span>
            <span class="stat-label">Personen-Tags</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">{{ songTagsCount }}</span>
            <span class="stat-label">Lieder-Tags</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Controls Card -->
    <div class="ct-card controls-card">
      <div class="ct-card-body">
        <div class="controls-row">
          <button @click="refreshData" class="ct-btn ct-btn-primary" :disabled="isLoading">
            {{ isLoading ? 'Laden...' : 'Aktualisieren' }}
          </button>
          <select v-model="selectedDomain" @change="refreshData" class="ct-select">
            <option value="">Alle Domains</option>
            <option value="person">Personen</option>
            <option value="song">Lieder</option>
            <option value="group">Gruppen</option>
            <option value="appointment">Termine</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Tags Table -->
    <div class="ct-card table-card">
      <div class="ct-card-body">
        <div v-if="isLoading" class="loading-state">
          <div class="loading-spinner"></div>
          <p>Lade Tags...</p>
        </div>

        <div v-else-if="error" class="error-state">
          <p class="error-message">❌ {{ error }}</p>
          <button @click="refreshData" class="ct-btn ct-btn-outline">Erneut versuchen</button>
        </div>

        <div v-else-if="tags.length === 0" class="empty-state">
          <p>Keine Tags gefunden.</p>
        </div>

        <div v-else class="table-container">
          <table class="ct-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Domain</th>
                <th>Farbe</th>
                <th>Beschreibung</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="tag in tags" :key="tag.id">
                <td>{{ tag.id }}</td>
                <td>{{ tag.name }}</td>
                <td>{{ tag.domainType }}</td>
                <td>
                  <div class="color-display" v-if="tag.color">
                    <div class="color-box" :style="{ backgroundColor: tag.color }"></div>
                    {{ tag.color }}
                  </div>
                  <span v-else>-</span>
                </td>
                <td>{{ tag.description || '-' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { churchtoolsClient } from '@churchtools/churchtools-client'

// Tag interface
interface Tag {
  id: number
  name: string
  description?: string
  color?: string
  domainType: 'person' | 'song' | 'group' | 'appointment'
}

// Props
defineProps<{
  module: {
    id: string
    title: string
    icon: string
    description: string
  }
}>()

// State
const isLoading = ref(true)
const error = ref<string | null>(null)
const selectedDomain = ref('')

// Data
const tags = ref<Tag[]>([])

// Computed properties
const personTagsCount = computed(() => {
  return tags.value.filter((tag) => tag.domainType === 'person').length
})

const songTagsCount = computed(() => {
  return tags.value.filter((tag) => tag.domainType === 'song').length
})

// Fetch data from ChurchTools API
const fetchData = async () => {
  isLoading.value = true
  error.value = null

  try {
    const domains = selectedDomain.value ? [selectedDomain.value] : ['person', 'song', 'group', 'appointment']
    
    const tagPromises = domains.map(async (domain) => {
      try {
        const response = await churchtoolsClient.get('/api/tags', { 
          params: { domain_type: domain } 
        })
        const tagData = Array.isArray(response.data) ? response.data : response.data.data || []
        return tagData.map((tag: any) => ({ ...tag, domainType: domain as const }))
      } catch (err) {
        console.warn(`Failed to fetch ${domain} tags:`, err)
        return []
      }
    })

    const results = await Promise.all(tagPromises)
    tags.value = results.flat()
  } catch (err) {
    console.error('Error fetching tags:', err)
    error.value = 'Fehler beim Laden der Tags. Bitte versuchen Sie es erneut.'
  } finally {
    isLoading.value = false
  }
}

// Refresh data
const refreshData = () => {
  fetchData()
}

// Initialize component
onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.tags-admin {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.ct-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.ct-card-header {
  padding: 1.5rem;
  border-bottom: 1px solid #e9ecef;
  background-color: #f8f9fa;
}

.ct-card-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #2c3e50;
}

.ct-card-body {
  padding: 1.5rem;
}

.description {
  margin: 0 0 1rem 0;
  color: #6c757d;
}

.stats-row {
  display: flex;
  gap: 2rem;
  flex-wrap: wrap;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.stat-number {
  font-size: 2rem;
  font-weight: 700;
  color: #007bff;
}

.stat-label {
  font-size: 0.875rem;
  color: #6c757d;
  margin-top: 0.25rem;
}

.controls-row {
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;
}

.ct-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.ct-btn-primary {
  background: #007bff;
  color: white;
}

.ct-btn-primary:hover:not(:disabled) {
  background: #0056b3;
}

.ct-btn-outline {
  background: transparent;
  color: #007bff;
  border: 1px solid #007bff;
}

.ct-btn-outline:hover {
  background: #007bff;
  color: white;
}

.ct-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.ct-select {
  padding: 0.5rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 0.875rem;
}

.loading-state,
.error-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  text-align: center;
}

.loading-spinner {
  width: 30px;
  height: 30px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-message {
  color: #dc3545;
  margin-bottom: 1rem;
}

.table-container {
  overflow-x: auto;
}

.ct-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.ct-table th,
.ct-table td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid #e9ecef;
}

.ct-table th {
  background-color: #f8f9fa;
  font-weight: 600;
  color: #495057;
}

.ct-table tbody tr:hover {
  background-color: #f8f9fa;
}

.color-display {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.color-box {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  border: 1px solid #dee2e6;
}

@media (max-width: 768px) {
  .stats-row {
    justify-content: center;
  }
  
  .controls-row {
    flex-direction: column;
    align-items: stretch;
  }
  
  .ct-btn,
  .ct-select {
    width: 100%;
  }
}
</style>