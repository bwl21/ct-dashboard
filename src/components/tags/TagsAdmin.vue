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
          <button type="button" @click="refreshData" class="ct-btn ct-btn-primary" :disabled="isLoading">
            {{ isLoading ? 'Laden...' : 'Aktualisieren' }}
          </button>
          <button type="button" @click="showCreateModal" class="ct-btn ct-btn-success">
            Tag erstellen
          </button>
          <select v-model="selectedDomain" @change="refreshData" class="ct-select">
            <option value="">Alle Domains</option>
            <option value="person">Personen</option>
            <option value="song">Lieder</option>
            <option value="group">Gruppen</option>

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
                <th>Aktionen</th>
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
                <td>
                  <button 
                    type="button"
                    @click="editTag(tag)" 
                    class="ct-btn ct-btn-sm ct-btn-outline"
                  >
                    Bearbeiten
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Create Tag Modal -->
    <div v-if="showTagModal" class="modal-overlay" @click="closeTagModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>{{ editingTag ? 'Tag bearbeiten' : 'Neuen Tag erstellen' }}</h3>
          <button type="button" class="close-button" @click="closeTagModal">×</button>
        </div>
        
        <form @submit.prevent="saveTag" class="tag-form">
          <div class="form-group">
            <label for="tagName">Tag Name *</label>
            <input 
              id="tagName"
              v-model="tagForm.name" 
              type="text" 
              placeholder="Tag Name eingeben"
              class="form-input"
              required
            />
          </div>
          
          <div class="form-group">
            <label for="tagDescription">Beschreibung</label>
            <textarea 
              id="tagDescription"
              v-model="tagForm.description" 
              placeholder="Beschreibung eingeben (optional)"
              class="form-input"
              rows="3"
            ></textarea>
          </div>
          
          <div class="form-group">
            <label>Farbe</label>
            <ColorPicker v-model="tagForm.color" />
          </div>

          <div class="form-group">
            <label for="tagDomain">Domain *</label>
            <select 
              id="tagDomain"
              v-model="tagForm.domainType" 
              class="form-input"
              required
            >
              <option value="">Domain auswählen</option>
              <option value="person">Personen</option>
              <option value="song">Lieder</option>
              <option value="group">Gruppen</option>
            </select>
          </div>
          
          <div v-if="tagFormError" class="error-message">
            {{ tagFormError }}
          </div>
          
          <div class="form-actions">
            <button type="submit" class="ct-btn ct-btn-primary" :disabled="isSubmitting">
              {{ isSubmitting ? 'Speichern...' : (editingTag ? 'Aktualisieren' : 'Erstellen') }}
            </button>
            <button type="button" class="ct-btn ct-btn-secondary" @click="closeTagModal">
              Abbrechen
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { churchtoolsClient } from '@churchtools/churchtools-client'
import ColorPicker from '../common/ColorPicker.vue'

// Tag interface based on ChurchTools API
interface Tag {
  id: number
  name: string
  description?: string
  color?: string
  domainType: 'person' | 'song' | 'group'
}

// API Response is directly an array of tags
type TagsApiResponse = Tag[]

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

// Modal state
const showTagModal = ref(false)
const isSubmitting = ref(false)
const tagFormError = ref<string | null>(null)
const editingTag = ref<Tag | null>(null)

// Form state
const tagForm = ref({
  name: '',
  description: '',
  color: null as string | null,
  domainType: '' as 'person' | 'song' | 'group' | ''
})

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
    const domains = selectedDomain.value ? [selectedDomain.value] : ['person', 'song', 'group']
    
    const tagPromises = domains.map(async (domain) => {
      try {
        const response = await churchtoolsClient.get<TagsApiResponse>(`/tags/${domain}`)
        const tagData = Array.isArray(response) ? response : []
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

// Modal functions
const showCreateModal = () => {
  editingTag.value = null
  tagForm.value = {
    name: '',
    description: '',
    color: null,
    domainType: selectedDomain.value as any || ''
  }
  tagFormError.value = null
  showTagModal.value = true
}

const editTag = (tag: Tag) => {
  editingTag.value = tag
  tagForm.value = {
    name: tag.name,
    description: tag.description || '',
    color: tag.color || null,
    domainType: tag.domainType
  }
  tagFormError.value = null
  showTagModal.value = true
}

const closeTagModal = () => {
  showTagModal.value = false
  editingTag.value = null
  tagFormError.value = null
}

const saveTag = async () => {
  if (!tagForm.value.name.trim()) {
    tagFormError.value = 'Tag Name ist erforderlich'
    return
  }
  
  if (!tagForm.value.domainType) {
    tagFormError.value = 'Domain ist erforderlich'
    return
  }
  
  isSubmitting.value = true
  tagFormError.value = null
  
  try {
    const tagData = {
      name: tagForm.value.name.trim(),
      description: tagForm.value.description.trim() || undefined,
      color: tagForm.value.color || undefined
    }
    
    if (editingTag.value) {
      // Update existing tag
      await churchtoolsClient.put(`/tags/${editingTag.value.id}`, tagData)
    } else {
      // Create new tag
      await churchtoolsClient.post(`/tags/${tagForm.value.domainType}`, tagData)
    }
    
    closeTagModal()
    await refreshData()
  } catch (err: any) {
    console.error('Error creating tag:', err)
    tagFormError.value = err.message || 'Fehler beim Erstellen des Tags'
  } finally {
    isSubmitting.value = false
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

.ct-btn-success {
  background: #28a745;
  color: white;
}

.ct-btn-success:hover:not(:disabled) {
  background: #1e7e34;
}

.ct-btn-secondary {
  background: #6c757d;
  color: white;
}

.ct-btn-secondary:hover:not(:disabled) {
  background: #545b62;
}

.ct-btn-sm {
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  padding: 0;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  width: 90%;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e9ecef;
  background: #f8f9fa;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #333;
}

.close-button {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}

.close-button:hover {
  background: #e9ecef;
  color: #333;
}

.tag-form {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #333;
}

.form-input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 0.875rem;
  box-sizing: border-box;
}

.form-input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.error-message {
  background: #f8d7da;
  color: #721c24;
  padding: 0.75rem;
  border-radius: 4px;
  margin-bottom: 1rem;
  border: 1px solid #f5c6cb;
}

.form-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
  padding: 1.5rem;
  border-top: 1px solid #e9ecef;
  background: #f8f9fa;
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
  
  .modal-content {
    width: 95%;
    margin: 1rem;
  }
}
</style>