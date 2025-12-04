<template>
  <div class="tag-multiselect" ref="containerRef">
    <div class="select-header" @click="toggleDropdown">
      <div class="selected-tags">
        <span v-if="selectedTags.length === 0" class="placeholder">Filter nach Tags</span>
        <div v-else class="chips-container">
          <span 
            v-for="tag in selectedTags" 
            :key="tag.id" 
            class="chip" 
            :style="{
              '--tag-bg': getTagColor(tag.color),
              '--tag-text': getContrastColor(getTagColor(tag.color))
            }"
          >
            <span class="chip-text">{{ tag.name }}</span>
            <button 
              class="chip-remove"
              @click.stop="removeTag(tag.id)"
              :style="{ color: getContrastColor(getTagColor(tag.color)) }"
              aria-label="Tag entfernen"
            >
              &times;
            </button>
          </span>
        </div>
      </div>
      <span class="dropdown-icon" :class="{ 'open': isOpen }">▼</span>
    </div>
    
    <Teleport to="body">
      <div v-if="isOpen" class="dropdown-portal">
        <div ref="dropdownRef" class="dropdown-content">
          <div class="search-container">
            <input
              ref="searchInput"
              v-model="searchQuery"
              type="text"
              placeholder="Tags durchsuchen..."
              class="search-input"
              @click.stop
            />
          </div>
          
          <div class="tags-list">
            <div 
              v-for="tag in filteredTags" 
              :key="tag.id" 
              class="tag-option" 
              @click="toggleTag(tag)"
            >
              <div class="tag-color" :style="{ backgroundColor: tag.color }"></div>
              <span class="tag-name">{{ tag.name }}</span>
              <span v-if="isSelected(tag.id)" class="checkmark">✓</span>
            </div>
            
            <div v-if="filteredTags.length === 0" class="no-results">
              Keine passenden Tags gefunden
            </div>
          </div>
          
          <div v-if="selectedTags.length > 0" class="dropdown-actions">
            <div class="action-buttons">
              <button class="action-btn select-all" @click.stop="selectAll">
                Alle auswählen
              </button>
              <button class="action-btn select-none" @click.stop="clearSelection">
                Keine auswählen
              </button>
            </div>
            <button class="clear-btn" @click.stop="clearSelection">
              Auswahl zurücksetzen
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { onClickOutside } from '@vueuse/core'

const props = defineProps({
  modelValue: {
    type: Array as () => number[], 
    default: () => []
  },
  tags: {
    type: Array as () => Array<{id: number, name: string, color: string}>,
    required: true
  }
})

const emit = defineEmits(['update:modelValue'])

const isOpen = ref(false)
const searchQuery = ref('')
const containerRef = ref<HTMLElement | null>(null)
const dropdownRef = ref<HTMLElement | null>(null)
const searchInput = ref<HTMLInputElement | null>(null)

const filteredTags = computed(() => {
  const query = searchQuery.value.toLowerCase()
  return props.tags.filter(tag => 
    tag.name.toLowerCase().includes(query)
  )
})

const selectedTags = computed(() => {
  return props.tags.filter(tag => props.modelValue.includes(tag.id))
})

const isSelected = (tagId: number) => {
  return props.modelValue.includes(tagId)
}

const toggleTag = (tag: {id: number}) => {
  const newValue = [...props.modelValue]
  const index = newValue.indexOf(tag.id)
  
  if (index === -1) {
    newValue.push(tag.id)
  } else {
    newValue.splice(index, 1)
  }
  
  emit('update:modelValue', newValue)
}

const removeTag = (tagId: number) => {
  const newValue = props.modelValue.filter(id => id !== tagId)
  emit('update:modelValue', newValue)
}

const clearSelection = () => {
  emit('update:modelValue', [])
  searchQuery.value = ''
}

const selectAll = () => {
  const allTagIds = props.tags.map(tag => tag.id)
  emit('update:modelValue', [...allTagIds])
}

const toggleDropdown = (event: Event) => {
  event.stopPropagation()
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    searchQuery.value = ''
    nextTick(() => {
      positionDropdown()
      searchInput.value?.focus()
    })
  }
}

const positionDropdown = () => {
  if (!dropdownRef.value || !containerRef.value) return
  
  const containerRect = containerRef.value.getBoundingClientRect()
  const dropdown = dropdownRef.value
  
  // Set the width to match the container
  dropdown.style.width = `${containerRect.width}px`
  
  // Position the dropdown directly below the container
  dropdown.style.left = `${containerRect.left + window.scrollX}px`
  dropdown.style.top = `${containerRect.bottom + window.scrollY + 4}px`
  
  // Check if there's enough space below, if not, position above
  const spaceBelow = window.innerHeight - containerRect.bottom
  const spaceAbove = containerRect.top
  
  if (spaceBelow < 300 && spaceAbove > spaceBelow) {
    // Position above if there's more space above
    dropdown.style.top = 'auto'
    dropdown.style.bottom = `${window.innerHeight - containerRect.top + window.scrollY - 4}px`
  }
}

const handleClickOutside = (event: MouseEvent) => {
  if (containerRef.value && !containerRef.value.contains(event.target as Node)) {
    isOpen.value = false
    document.removeEventListener('click', handleClickOutside, { capture: true })
  }
}

const getTagColor = (colorName: string): string => {
  // Map of color names to hex values - matching the table's color scheme
  const colorMap: Record<string, string> = {
    'basic': '#e0e0e0',
    'blue': '#2196F3',
    'green': '#4CAF50',
    'yellow': '#FFC107',
    'red': '#F44336',
    'purple': '#9C27B0',
    'orange': '#FF9800',
    'teal': '#009688',
    'pink': '#E91E63',
    'brown': '#795548',
    'gray': '#9E9E9E',
    'black': '#000000'
  }
  
  // Return the hex color if it's already a hex value
  if (colorName.startsWith('#')) {
    return colorName
  }
  
  // Return the mapped color or a default gray if not found
  return colorMap[colorName.toLowerCase()] || '#e0e0e0'
}

// Helper function to get contrasting text color based on background color
const getContrastColor = (hexColor: string) => {
  // If the color is light, return dark text color, otherwise return light text
  const r = parseInt(hexColor.slice(1, 3), 16)
  const g = parseInt(hexColor.slice(3, 5), 16)
  const b = parseInt(hexColor.slice(5, 7), 16)
  const brightness = (r * 299 + g * 587 + b * 114) / 1000
  return brightness > 128 ? '#000000' : '#ffffff'
}

// Close dropdown when clicking outside
onClickOutside(dropdownRef, () => {
  isOpen.value = false
}, { ignore: [containerRef] })

// Close dropdown when window is scrolled or resized
onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true })
  window.addEventListener('resize', handleResize, { passive: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScroll)
  window.removeEventListener('resize', handleResize)
})

const handleScroll = () => {
  if (isOpen.value) {
    isOpen.value = false
  }
}

const handleResize = () => {
  if (isOpen.value) {
    positionDropdown()
  }
}
</script>

<style scoped>
.tag-multiselect {
  position: relative;
  min-width: 250px;
  max-width: 400px; /* Maximum width for the widget */
  width: 100%;
  z-index: 1;
  font-size: 0.9375rem;
  line-height: 1.5;
}

.select-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 0.5rem 0.75rem;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  background-color: white;
  cursor: pointer;
  min-height: 42px;
  gap: 0.5rem;
  width: 100%;
  box-sizing: border-box;
  transition: border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
  overflow: hidden; /* Ensure content doesn't overflow the rounded corners */
}

.select-header:focus-within {
  border-color: #4d90fe;
  box-shadow: 0 0 0 1px #4d90fe;
  outline: none;
}

.select-header:hover {
  border-color: #b3b3b3;
}

.selected-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
  flex-grow: 1;
  min-height: 1.5rem;
  align-items: center;
  min-width: 0; /* Prevents flex items from overflowing */
  overflow: hidden;
  max-height: 100px; /* Maximum height before scrolling */
  overflow-y: auto; /* Add scrollbar if content is too tall */
  padding: 0.1rem 0; /* Add some vertical padding */
  align-content: flex-start; /* Align wrapped lines to the start */
}

.placeholder {
  color: #9e9e9e;
  font-size: 0.9rem;
  line-height: 1.5;
  padding: 0.25rem 0;
}

.chips-container {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  align-items: center;
  width: 100%;
  padding: 0.2rem 0;
}

.chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 24px;
  padding: 0 10px;
  border-radius: 3px;
  font-size: 12px;
  font-weight: 500;
  line-height: 1;
  white-space: nowrap;
  background-color: var(--tag-bg, #e0e0e0);
  color: var(--tag-text, #333);
  border: 1px solid rgba(0, 0, 0, 0.1);
  position: relative;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
  cursor: default;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.chip:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}

.chip-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding-right: 0.25rem;
}

.chip-remove {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-left: 0.25rem;
  background: none;
  border: none;
  width: 14px;
  height: 14px;
  padding: 0;
  border-radius: 50%;
  cursor: pointer;
  font-size: 0.9rem;
  line-height: 1;
  opacity: 0.7;
  color: inherit;
  transition: all 0.15s ease;
}

.chip-remove:hover {
  opacity: 1;
  background-color: rgba(0, 0, 0, 0.1);
}

.chip-remove:active {
  transform: scale(0.9);
}

.dropdown-icon {
  margin-left: 0.5rem;
  font-size: 0.7rem;
  color: #666;
  transition: transform 0.2s ease;
}

.dropdown-icon.open {
  transform: rotate(180deg);
}

.dropdown-portal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 9999;
  pointer-events: none;
}

.dropdown-content {
  position: absolute;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  max-height: min(400px, 70vh);
  min-width: 250px;
  width: auto;
  overflow-y: auto;
  z-index: 9999;
  pointer-events: auto;
  transform: translateZ(0);
  -webkit-transform: translateZ(0);
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  will-change: transform;
}

.search-container {
  padding: 0.5rem;
  border-bottom: 1px solid #f0f0f0;
}

.search-input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  font-size: 0.9rem;
}

.tags-list {
  padding: 0.5rem 0;
}

.tag-option {
  display: flex;
  align-items: center;
  padding: 0.5rem 1rem;
  cursor: pointer;
  position: relative;
  transition: background-color 0.1s ease;
}

.tag-option:hover {
  background-color: #f5f5f5;
}

.tag-color {
  width: 12px;
  height: 12px;
  border-radius: 2px;
  margin-right: 0.75rem;
  flex-shrink: 0;
}

.tag-name {
  flex-grow: 1;
  margin-right: 1.5rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.checkmark {
  position: absolute;
  right: 1rem;
  color: #3498db;
  font-weight: bold;
}

.no-results {
  padding: 0.75rem 1rem;
  color: #666;
  text-align: center;
  font-style: italic;
}

.dropdown-actions {
  padding: 0.5rem;
  border-top: 1px solid #e0e0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  padding: 0.25rem 0.5rem;
  border: 1px solid #e0e0e0;
  border-radius: 3px;
  background: #f8f9fa;
  color: #2c3e50;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  background: #e9ecef;
  border-color: #ced4da;
}

.action-btn.select-all {
  background: #e8f4fd;
  border-color: #b8d8f8;
  color: #0d6efd;
}

.action-btn.select-none {
  background: #f8e8e8;
  border-color: #f8b8b8;
  color: #dc3545;
}

.action-btn.select-all:hover {
  background: #d0e7ff;
}

.action-btn.select-none:hover {
  background: #ffd6d6;
}

.clear-btn {
  background: none;
  border: none;
  color: #3498db;
  font-size: 0.8rem;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border-radius: 3px;
  transition: background-color 0.2s ease;
}

.clear-btn:hover {
  background-color: #f5f5f5;
  text-decoration: underline;
}
</style>
