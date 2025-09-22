<template>
  <div class="tags-admin">
    <!-- Header Card with Stats -->
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



    <!-- AdminTable -->
    <AdminTable
      ref="adminTableRef"
      :data="tags"
      :loading="isLoading"
      :error="error"
      :columns="tableColumns"
      row-key="id"
      title="Tags"
      description="Alle Tags in ChurchTools"
      searchable
      search-placeholder="Tags durchsuchen..."
      :search-fields="['name', 'domainType', 'description']"
      default-sort-field="name"
      loading-text="Lade Tags..."
      empty-text="Keine Tags gefunden."
      @retry="refreshData"
      @reload="refreshData"
    >
      <!-- Bulk Operations in Header -->
      <template #header-controls>
        <div class="bulk-operations">
          <div class="bulk-operations-header">
            <div class="bulk-title">
              <span class="bulk-icon">🔧</span>
              <span>Bulk Operations</span>
            </div>
            <div class="selection-count">
              {{ selectedTags.length }} selected
              <span v-if="filteredTagsForBulk.length < tags.length" class="filter-info">
                (von {{ filteredTagsForBulk.length }} gefilterten)
              </span>
            </div>
          </div>
          
          <div class="bulk-controls-row">
            <button 
              type="button" 
              @click="toggleSelectAll" 
              class="bulk-btn bulk-btn-outline"
            >
              Select All
            </button>
            
            <button 
              type="button" 
              @click="clearSelection" 
              class="bulk-btn bulk-btn-outline"
            >
              Clear Selection
            </button>
            
            <input 
              v-model="prefixFilter"
              type="text" 
              placeholder="e.g., L:*"
              class="prefix-input"
            />
            
            <button 
              type="button" 
              @click="selectByPrefix" 
              class="bulk-btn bulk-btn-outline"
              :disabled="!prefixFilter.trim()"
            >
              Select by Prefix
            </button>
            
            <div class="color-picker-dropdown">
              <ColorPicker 
                v-model="bulkColor" 
                :placeholder="bulkColor ? getColorDisplayName(bulkColor) : 'Select Color'"
                class="bulk-color-picker"
              />
            </div>
            
            <button 
              type="button" 
              @click="applyBulkColor" 
              class="bulk-btn bulk-btn-success"
              :disabled="!bulkColor || isBulkProcessing || selectedTags.length === 0"
            >
              {{ isBulkProcessing ? 'Applying...' : 'Apply Color' }}
            </button>
            
            <button 
              type="button" 
              @click="showBulkDeleteConfirm" 
              class="bulk-btn bulk-btn-danger"
              :disabled="isBulkProcessing || selectedTags.length === 0"
            >
              Delete Selected
            </button>
          </div>
        </div>
      </template>

      <!-- Filters -->
      <template #filters>
        <div class="filter-container">
          <label for="domainFilter" class="filter-label">Domain:</label>
          <select 
            id="domainFilter"
            v-model="selectedDomain" 
            @change="refreshData" 
            class="ct-select filter-select"
          >
            <option value="">Alle Domains</option>
            <option value="person">Personen</option>
            <option value="song">Lieder</option>
            <option value="group">Gruppen</option>
          </select>
        </div>
      </template>

      <!-- Custom Actions -->
      <template #actions>
        <button 
          type="button" 
          @click="refreshData" 
          class="ct-btn ct-btn-primary" 
          :disabled="isLoading"
        >
          {{ isLoading ? 'Laden...' : 'Aktualisieren' }}
        </button>
        <button 
          type="button" 
          @click="showCreateModal" 
          class="ct-btn ct-btn-success"
        >
          Tag erstellen
        </button>
      </template>

      <!-- Custom Cell Rendering -->
      <template #cell-checkbox="{ item }">
        <input 
          type="checkbox" 
          :checked="selectedTags.includes(item.id)"
          @change.stop="toggleTagSelection(item.id)"
          class="ct-checkbox"
        />
      </template>

      <template #cell-color="{ item }">
        <div class="color-display" v-if="item.color">
          <div 
            class="color-circle" 
            :style="{ backgroundColor: item.color }"
            :title="item.color"
          ></div>
          <span class="color-text">{{ item.color }}</span>
        </div>
        <span v-else class="no-color">Keine Farbe</span>
      </template>

      <template #cell-actions="{ item }">
        <div class="action-buttons">
          <button 
            @click.stop="editTag(item)" 
            class="ct-btn ct-btn-sm ct-btn-outline"
            title="Tag bearbeiten"
            type="button"
          >
            Bearbeiten
          </button>
          <button 
            @click.stop="deleteTagHandler(item)" 
            class="ct-btn ct-btn-sm ct-btn-danger"
            title="Tag löschen"
            type="button"
          >
            Löschen
          </button>
        </div>
      </template>
    </AdminTable>

    <!-- Create/Edit Tag Modal -->
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
              v-if="!editingTag"
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
            <input 
              v-else
              type="text"
              :value="getDomainDisplayName(tagForm.domainType)"
              class="form-input"
              readonly
              disabled
            />
          </div>

          <div v-if="tagFormError" class="error-message">
            {{ tagFormError }}
          </div>

          <div class="form-actions">
            <button type="button" @click="closeTagModal" class="ct-btn ct-btn-outline">
              Abbrechen
            </button>
            <button type="submit" class="ct-btn ct-btn-success" :disabled="isSubmitting">
              {{ isSubmitting ? 'Speichern...' : (editingTag ? 'Aktualisieren' : 'Erstellen') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import type { DashboardModule } from '@/types/modules'
import type { TableColumn } from '@/types/table'
import AdminTable from '@/components/shared/AdminTable.vue'
import ColorPicker from '@/components/common/ColorPicker.vue'
import { useToast } from '@/composables/useToast'

import { useTags } from './useTags'

defineProps<{
  module: DashboardModule
}>()

// Toast functionality
const { showSuccess, showError, showInfo } = useToast()

// Use tags composable
const {
  tags,
  loading: isLoading,
  error,
  selectedDomain,
  personTagsCount,
  songTagsCount,
  fetchTags,
  createTag,
  updateTag,
  deleteTag,
  bulkUpdateTags,
  bulkDeleteTags
} = useTags()

// Local state for UI
const selectedTags = ref<number[]>([])
const prefixFilter = ref('')
const bulkColor = ref('')
const isBulkProcessing = ref(false)

// Search term to coordinate with AdminTable
const searchTerm = ref('')
const adminTableRef = ref()

// Modal state
const showTagModal = ref(false)
const editingTag = ref<any>(null)
const isSubmitting = ref(false)
const tagFormError = ref<string | null>(null)
const tagForm = ref({
  name: '',
  description: '',
  color: null as string | null,
  domainType: ''
})

// Table configuration
const tableColumns: TableColumn[] = [
  { key: 'checkbox', label: '', sortable: false, resizable: false, width: 50, cellSlot: 'cell-checkbox' },
  { key: 'id', label: 'ID', sortable: true, resizable: true, width: 80 },
  { key: 'name', label: 'Name', sortable: true, resizable: true, width: 200 },
  { key: 'domainType', label: 'Domain', sortable: true, resizable: true, width: 120 },
  { key: 'color', label: 'Farbe', sortable: true, resizable: true, width: 150, cellSlot: 'cell-color' },
  { key: 'description', label: 'Beschreibung', sortable: true, resizable: true, width: 250 },
  { key: 'actions', label: 'Aktionen', sortable: false, resizable: false, width: 150, cellSlot: 'cell-actions' }
]

// Computed properties (now from composable)

// Filtered tags that match AdminTable search (for bulk operations)
const filteredTagsForBulk = computed(() => {
  if (!searchTerm.value.trim()) {
    return tags.value
  }
  
  const searchLower = searchTerm.value.toLowerCase()
  return tags.value.filter(tag => 
    tag.name.toLowerCase().includes(searchLower) ||
    tag.domainType.toLowerCase().includes(searchLower) ||
    (tag.description && tag.description.toLowerCase().includes(searchLower))
  )
})

// Bulk operations
const toggleSelectAll = () => {
  // Work on filtered data (respects domain + search filters)
  const availableTags = filteredTagsForBulk.value
  const availableIds = availableTags.map(tag => tag.id)
  
  // Check if all available tags are selected
  const allSelected = availableIds.every(id => selectedTags.value.includes(id))
  
  if (allSelected) {
    // Deselect all available tags
    selectedTags.value = selectedTags.value.filter(id => !availableIds.includes(id))
  } else {
    // Select all available tags (add missing ones)
    const newSelections = availableIds.filter(id => !selectedTags.value.includes(id))
    selectedTags.value = [...selectedTags.value, ...newSelections]
  }
}

const clearSelection = () => {
  selectedTags.value = []
}

const toggleTagSelection = (tagId: number) => {
  console.log('Toggle tag selection:', tagId)
  const index = selectedTags.value.indexOf(tagId)
  if (index > -1) {
    selectedTags.value.splice(index, 1)
  } else {
    selectedTags.value.push(tagId)
  }
  console.log('Selected tags:', selectedTags.value)
}

const selectByPrefix = () => {
  const prefix = prefixFilter.value.trim()
  if (!prefix) return
  
  const pattern = prefix.replace('*', '.*')
  const regex = new RegExp(pattern, 'i')
  
  // Work on filtered data (respects domain + search filters)
  selectedTags.value = filteredTagsForBulk.value
    .filter(tag => regex.test(tag.name))
    .map(tag => tag.id)
}

// Data loading
const refreshData = () => {
  fetchTags()
}

const showCreateModal = () => {
  editingTag.value = null
  tagForm.value = {
    name: '',
    description: '',
    color: null,
    domainType: selectedDomain.value || ''
  }
  tagFormError.value = null
  showTagModal.value = true
}

const editTag = (tag: any) => {
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

const deleteTagHandler = async (tag: any) => {
  try {
    console.log('Delete tag clicked:', tag)
    const confirmed = confirm(`Möchten Sie das Tag "${tag.name}" wirklich löschen?`)
    if (!confirmed) return
    
    await deleteTag(tag.id)
    showSuccess('Tag erfolgreich gelöscht')
  } catch (err: any) {
    showError('Fehler beim Löschen des Tags')
  }
}

const applyBulkColor = async () => {
  if (!bulkColor.value || selectedTags.value.length === 0) return
  
  isBulkProcessing.value = true
  try {
    await bulkUpdateTags(selectedTags.value, { color: bulkColor.value })
    showSuccess(`Farbe für ${selectedTags.value.length} Tags aktualisiert`)
    selectedTags.value = []
    bulkColor.value = ''
  } catch (err: any) {
    showError('Fehler beim Aktualisieren der Tag-Farben')
  } finally {
    isBulkProcessing.value = false
  }
}

const showBulkDeleteConfirm = async () => {
  if (selectedTags.value.length === 0) return
  
  const confirmed = confirm(`Möchten Sie wirklich ${selectedTags.value.length} Tags löschen?`)
  if (!confirmed) return
  
  isBulkProcessing.value = true
  try {
    await bulkDeleteTags(selectedTags.value)
    showSuccess(`${selectedTags.value.length} Tags erfolgreich gelöscht`)
    selectedTags.value = []
  } catch (err: any) {
    showError('Fehler beim Löschen der Tags')
  } finally {
    isBulkProcessing.value = false
  }
}

const getColorDisplayName = (color: string) => {
  return color
}

const getDomainDisplayName = (domain: string) => {
  const domainNames = {
    'person': 'Personen',
    'song': 'Lieder', 
    'group': 'Gruppen'
  }
  return domainNames[domain as keyof typeof domainNames] || domain
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
      description: tagForm.value.description.trim() || '',
      color: tagForm.value.color || 'basic'
    }
    
    if (editingTag.value) {
      // Update existing tag
      await updateTag(editingTag.value.id, tagData)
      showSuccess('Tag erfolgreich aktualisiert')
    } else {
      // Create new tag
      await createTag({ ...tagData, domainType: tagForm.value.domainType })
      showSuccess('Tag erfolgreich erstellt')
    }
    
    closeTagModal()
  } catch (err: any) {
    console.error('Error saving tag:', err)
    tagFormError.value = err.message || 'Fehler beim Speichern des Tags'
  } finally {
    isSubmitting.value = false
  }
}

// Watch AdminTable search term
watch(() => adminTableRef.value?.searchTerm, (newSearchTerm) => {
  if (newSearchTerm !== undefined) {
    searchTerm.value = newSearchTerm
  }
}, { immediate: true })

// Initialize
onMounted(() => {
  fetchTags()
})
</script>

<style scoped>
.tags-admin {
  padding: 0;
  width: 100%;
  margin: 0;
}

/* Header Card Styles */
.header-card {
  background: var(--ct-bg-primary, #ffffff);
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}

.ct-card-header {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--ct-border-color, #e0e0e0);
  background: var(--ct-bg-secondary, #f8f9fa);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.ct-card-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--ct-text-primary, #2c3e50);
}

.ct-card-body {
  padding: 1.5rem;
}

.description {
  margin: 0 0 1rem 0;
  color: var(--ct-text-secondary, #6c757d);
  font-size: 0.95rem;
}

.stats-row {
  display: flex;
  gap: 2rem;
  margin-top: 1rem;
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
  color: var(--ct-primary, #3498db);
  line-height: 1;
}

.stat-label {
  font-size: 0.875rem;
  color: var(--ct-text-secondary, #6c757d);
  margin-top: 0.25rem;
}

/* Bulk Operations */
.bulk-operations {
  margin-top: 1.5rem;
  padding: 1rem;
  background: var(--ct-bg-secondary, #f8f9fa);
  border-radius: 8px;
  border: 1px solid var(--ct-border-color, #e0e0e0);
}

.bulk-operations-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.bulk-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: var(--ct-text-primary, #2c3e50);
}

.bulk-icon {
  font-size: 1.2rem;
}

.selection-count {
  background: var(--ct-primary, #3498db);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.875rem;
  font-weight: 500;
}

.filter-info {
  opacity: 0.8;
  font-size: 0.8rem;
  font-weight: 400;
}

.bulk-controls-row {
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;
}

.bulk-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s;
}

.bulk-btn-outline {
  background: transparent;
  border: 1px solid var(--ct-border-color, #e0e0e0);
  color: var(--ct-text-primary, #2c3e50);
}

.bulk-btn-outline:hover {
  background: var(--ct-bg-secondary, #f8f9fa);
}

.bulk-btn-success {
  background: var(--ct-success, #28a745);
  color: white;
}

.bulk-btn-success:hover:not(:disabled) {
  background: #218838;
}

.bulk-btn-danger {
  background: var(--ct-danger, #dc3545);
  color: white;
}

.bulk-btn-danger:hover:not(:disabled) {
  background: #c82333;
}

.bulk-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.prefix-input {
  padding: 0.5rem;
  border: 1px solid var(--ct-border-color, #e0e0e0);
  border-radius: 4px;
  font-size: 0.875rem;
  min-width: 120px;
}

.color-picker-dropdown {
  min-width: 150px;
}

/* Filter Styles */
.filter-container {
  min-width: 180px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.filter-label {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--ct-text-primary, #2c3e50);
  white-space: nowrap;
}

.filter-select {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid var(--ct-border-color, #e0e0e0);
  border-radius: 6px;
  font-size: 0.95rem;
  background: var(--ct-bg-primary, #ffffff);
  color: var(--ct-text-primary, #2c3e50);
  transition: all 0.2s;
}

.filter-select:focus {
  outline: none;
  border-color: var(--ct-primary, #3498db);
  box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.1);
}

/* Custom Cell Styles */
.color-display {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.color-circle {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 1px solid var(--ct-border-color, #e0e0e0);
  flex-shrink: 0;
}

.color-text {
  font-family: monospace;
  font-size: 0.875rem;
}

.no-color {
  color: var(--ct-text-secondary, #6c757d);
  font-style: italic;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
  position: relative;
  z-index: 1;
}

/* Button Styles */
.ct-btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  text-decoration: none;
}

.ct-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.ct-btn-primary {
  background-color: var(--ct-primary, #3498db);
  color: white;
}

.ct-btn-primary:hover:not(:disabled) {
  background-color: var(--ct-primary-dark, #2980b9);
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.ct-btn-success {
  background-color: var(--ct-success, #28a745);
  color: white;
}

.ct-btn-success:hover:not(:disabled) {
  background-color: #218838;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.ct-btn-outline {
  background: transparent;
  border: 1px solid var(--ct-primary, #3498db);
  color: var(--ct-primary, #3498db);
}

.ct-btn-outline:hover:not(:disabled) {
  background-color: rgba(52, 152, 219, 0.1);
}

.ct-btn-danger {
  background-color: var(--ct-danger, #dc3545);
  color: white;
}

.ct-btn-danger:hover:not(:disabled) {
  background-color: #c82333;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.ct-btn-sm {
  padding: 0.5rem 1rem;
  font-size: 0.85rem;
  position: relative;
  z-index: 2;
  pointer-events: auto;
}

.ct-checkbox {
  width: 16px;
  height: 16px;
  cursor: pointer;
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
  background: var(--ct-bg-primary, #ffffff);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  padding: 1.5rem;
  border-bottom: 1px solid var(--ct-border-color, #e0e0e0);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--ct-text-primary, #2c3e50);
}

.close-button {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--ct-text-secondary, #6c757d);
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
}

.close-button:hover {
  background: var(--ct-bg-secondary, #f8f9fa);
  color: var(--ct-text-primary, #2c3e50);
}

.tag-form {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: var(--ct-text-primary, #2c3e50);
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--ct-border-color, #e0e0e0);
  border-radius: 6px;
  font-size: 0.95rem;
  background: var(--ct-bg-primary, #ffffff);
  color: var(--ct-text-primary, #2c3e50);
  transition: all 0.2s;
  box-sizing: border-box;
}

.form-input:focus {
  outline: none;
  border-color: var(--ct-primary, #3498db);
  box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.1);
}

.form-input[required] + .form-input:invalid {
  border-color: var(--ct-danger, #dc3545);
}

.form-input:disabled {
  background-color: var(--ct-bg-secondary, #f8f9fa);
  color: var(--ct-text-secondary, #6c757d);
  cursor: not-allowed;
}

.error-message {
  background: rgba(220, 53, 69, 0.1);
  color: var(--ct-danger, #dc3545);
  padding: 0.75rem;
  border-radius: 6px;
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
}

/* Responsive Design */
@media (max-width: 768px) {
  .stats-row {
    flex-direction: column;
    gap: 1rem;
  }
  
  .bulk-controls-row {
    flex-direction: column;
    align-items: stretch;
  }
  
  .action-buttons {
    flex-direction: column;
  }
  
  .modal-content {
    width: 95%;
    margin: 1rem;
  }
  
  .form-actions {
    flex-direction: column;
  }
}
</style>