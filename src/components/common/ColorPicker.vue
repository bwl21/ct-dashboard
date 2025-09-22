<template>
  <div class="color-picker">
    <!-- Color Display Button -->
    <button
      type="button"
      class="color-picker-button"
      @click="showModal = true"
      :class="{ 'has-color': selectedColor }"
    >
      <div class="color-display">
        <div
          v-if="selectedColor"
          class="color-swatch"
          :style="{ backgroundColor: getColorInfo(selectedColor).hex }"
        ></div>
        <div v-else class="no-color-swatch">
          <span>×</span>
        </div>
        <div class="color-info">
          <div class="color-name">
            {{ selectedColor ? getColorInfo(selectedColor).name : 'No Color' }}
          </div>
          <div v-if="selectedColor" class="color-hex">
            {{ getColorInfo(selectedColor).hex }}
          </div>
        </div>
      </div>
      <span class="dropdown-arrow">▼</span>
    </button>

    <!-- Color Picker Modal -->
    <div v-if="showModal" class="color-picker-modal" @click="closeModal">
      <div class="color-picker-content" @click.stop>
        <div class="color-picker-header">
          <h3>Choose a Color</h3>
          <button type="button" class="close-button" @click="closeModal">×</button>
        </div>
        <p class="color-picker-subtitle">
          Click a color to select it, or press Escape to cancel
        </p>
        
        <!-- No Color Option -->
        <div class="no-color-section">
          <div
            class="color-item no-color"
            :class="{ selected: !selectedColor }"
            @click="selectColor(null)"
          >
            <div class="color-circle no-color-circle">
              <span class="no-color-x">×</span>
            </div>
            <div class="color-info">
              <div class="color-name">No Color</div>
            </div>
          </div>
        </div>

        <!-- Color Grid -->
        <div class="color-grid">
          <div
            v-for="color in colors"
            :key="color.value"
            class="color-item"
            :class="{ selected: selectedColor === color.value }"
            @click="selectColor(color.value)"
          >
            <div
              class="color-circle"
              :style="{ backgroundColor: color.hex }"
            ></div>
            <div class="color-info">
              <div class="color-name">{{ color.name }}</div>
              <div class="color-hex">{{ color.hex }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

// Props
interface Props {
  modelValue?: string | null
  placeholder?: string
  colors?: Array<{ value: string; name: string; hex: string; tailwind?: string }>
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  placeholder: 'Select a color',
  colors: () => []
})

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: string | null]
}>()

// State
const showModal = ref(false)
const selectedColor = ref<string | null>(props.modelValue)

// ChurchTools Colors (exact mapping from ct-labelmanager)
const churchToolsColors = [
  // System Colors
  { value: 'parent', name: 'Parent', hex: '#6b7280', tailwind: 'gray-500' },
  { value: 'default', name: 'Default', hex: '#6b7280', tailwind: 'gray-500' },
  { value: 'accent', name: 'Accent', hex: '#007cba', tailwind: 'custom' },
  { value: 'basic', name: 'Basic', hex: '#6b7280', tailwind: 'gray-500' },
  
  // Standard Colors
  { value: 'amber', name: 'Amber', hex: '#f59e0b', tailwind: 'amber-500' },
  { value: 'black', name: 'Black', hex: '#000000', tailwind: 'black' },
  { value: 'blue', name: 'Blue', hex: '#3b82f6', tailwind: 'blue-500' },
  { value: 'cyan', name: 'Cyan', hex: '#06b6d4', tailwind: 'cyan-500' },
  { value: 'emerald', name: 'Emerald', hex: '#10b981', tailwind: 'emerald-500' },
  { value: 'fuchsia', name: 'Fuchsia', hex: '#d946ef', tailwind: 'fuchsia-500' },
  { value: 'gray', name: 'Gray', hex: '#6b7280', tailwind: 'gray-500' },
  { value: 'green', name: 'Green', hex: '#16a34a', tailwind: 'green-600' },
  { value: 'indigo', name: 'Indigo', hex: '#6366f1', tailwind: 'indigo-500' },
  { value: 'lime', name: 'Lime', hex: '#84cc16', tailwind: 'lime-500' },
  { value: 'orange', name: 'Orange', hex: '#f97316', tailwind: 'orange-500' },
  { value: 'pink', name: 'Pink', hex: '#ec4899', tailwind: 'pink-500' },
  { value: 'purple', name: 'Purple', hex: '#a855f7', tailwind: 'purple-500' },
  { value: 'red', name: 'Red', hex: '#dc2626', tailwind: 'red-600' },
  { value: 'rose', name: 'Rose', hex: '#f43f5e', tailwind: 'rose-500' },
  { value: 'sky', name: 'Sky', hex: '#0ea5e9', tailwind: 'sky-500' },
  { value: 'teal', name: 'Teal', hex: '#14b8a6', tailwind: 'teal-500' },
  { value: 'violet', name: 'Violet', hex: '#8b5cf6', tailwind: 'violet-500' },
  { value: 'white', name: 'White', hex: '#ffffff', tailwind: 'white' },
  { value: 'yellow', name: 'Yellow', hex: '#eab308', tailwind: 'yellow-500' },
  
  // Semantic Colors
  { value: 'critical', name: 'Critical', hex: '#dc2626', tailwind: 'red-600' },
  { value: 'constructive', name: 'Constructive', hex: '#16a34a', tailwind: 'green-600' },
  { value: 'destructive', name: 'Destructive', hex: '#dc2626', tailwind: 'red-600' },
  { value: 'danger', name: 'Danger', hex: '#dc2626', tailwind: 'red-600' },
  { value: 'error', name: 'Error', hex: '#dc2626', tailwind: 'red-600' },
  { value: 'info', name: 'Info', hex: '#3b82f6', tailwind: 'blue-500' },
  { value: 'success', name: 'Success', hex: '#16a34a', tailwind: 'green-600' },
  { value: 'warning', name: 'Warning', hex: '#f59e0b', tailwind: 'amber-500' },
  { value: 'magic', name: 'Magic', hex: '#8b5cf6', tailwind: 'violet-500' }
]

// Color similarity sorting functions (from ct-labelmanager)
const hexToHsl = (hex: string) => {
  if (!hex || hex === '') return { h: 0, s: 0, l: 0 }
  
  // Remove # if present
  hex = hex.replace('#', '')
  
  // Convert to RGB
  const r = parseInt(hex.substr(0, 2), 16) / 255
  const g = parseInt(hex.substr(2, 2), 16) / 255
  const b = parseInt(hex.substr(4, 2), 16) / 255
  
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h: number, s: number, l = (max + min) / 2
  
  if (max === min) {
    h = s = 0 // achromatic
  } else {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break
      case g: h = (b - r) / d + 2; break
      case b: h = (r - g) / d + 4; break
      default: h = 0
    }
    h /= 6
  }
  
  return { h: h * 360, s: s * 100, l: l * 100 }
}



// Use provided colors or default churchtools colors
const colors = computed(() => props.colors.length > 0 ? props.colors : churchToolsColors)

// Methods
const getColorInfo = (colorValue: string | null) => {
  if (!colorValue) {
    return { name: 'No Color', hex: '', tailwind: '' }
  }
  
  const color = colors.value.find(c => c.value === colorValue)
  return color || { name: colorValue, hex: '#000000', tailwind: 'gray-500' }
}

const selectColor = (colorValue: string | null) => {
  selectedColor.value = colorValue
  emit('update:modelValue', colorValue)
  closeModal()
}

const closeModal = () => {
  showModal.value = false
}

const handleEscape = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && showModal.value) {
    closeModal()
  }
}

// Lifecycle
onMounted(() => {
  document.addEventListener('keydown', handleEscape)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleEscape)
})

// Watch for prop changes
import { watch } from 'vue'
watch(() => props.modelValue, (newValue) => {
  selectedColor.value = newValue
})
</script>

<style scoped>
.color-picker {
  position: relative;
  display: inline-block;
}

.color-picker-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  min-width: 200px;
  transition: border-color 0.2s;
}

.color-picker-button:hover {
  border-color: #007bff;
}

.color-display {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.color-swatch {
  width: 20px;
  height: 20px;
  border-radius: 3px;
  border: 1px solid #ddd;
  flex-shrink: 0;
}

.no-color-swatch {
  width: 20px;
  height: 20px;
  border-radius: 3px;
  border: 1px solid #ddd;
  background: #f8f9fa;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #666;
  flex-shrink: 0;
}

.color-info {
  flex: 1;
  text-align: left;
}

.color-name {
  font-weight: 500;
  font-size: 14px;
  color: #333;
}

.color-hex {
  font-size: 12px;
  color: #666;
  font-family: monospace;
}

.dropdown-arrow {
  color: #666;
  font-size: 12px;
}

/* Modal Styles */
.color-picker-modal {
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

.color-picker-content {
  background: white;
  border-radius: 8px;
  padding: 24px;
  max-width: 720px;
  width: 90vw;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.color-picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.color-picker-header h3 {
  margin: 0;
  font-size: 18px;
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
  background: #f8f9fa;
  color: #333;
}

.color-picker-subtitle {
  margin: 0 0 20px 0;
  color: #666;
  font-size: 14px;
}

/* No Color Section */
.no-color-section {
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e5e7eb;
}

/* Color Grid */
.color-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  max-width: 600px;
}

/* Color Items */
.color-item {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
  background: #ffffff;
  min-height: 48px;
}

.color-item:hover {
  background: #f9fafb;
  border-color: #d1d5db;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.color-item.selected {
  background: #eff6ff;
  border-color: #3b82f6;
  box-shadow: 0 1px 3px rgba(59, 130, 246, 0.3);
}

/* Color Circles */
.color-circle {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid #ffffff;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
}

.no-color-circle {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 3px solid #ffffff;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.1);
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.no-color-x {
  font-size: 20px;
  font-weight: bold;
  color: #9ca3af;
  line-height: 1;
}

/* Color Info */
.color-info {
  text-align: left;
  flex: 1;
  min-width: 0;
}

.color-name {
  font-size: 12px;
  font-weight: 500;
  color: #374151;
  line-height: 1.2;
  margin-bottom: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: block;
}

.color-hex {
  font-size: 10px;
  color: #6b7280;
  font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
  line-height: 1.2;
  text-transform: uppercase;
  display: block;
  margin-top: 1px;
}

.color-description {
  font-size: 10px;
  color: #666;
  font-style: italic;
  line-height: 1;
}

/* Responsive Design */
@media (max-width: 768px) {
  .color-grid {
    grid-template-columns: repeat(2, 1fr);
    max-width: 320px;
  }
  
  .color-picker-content {
    max-width: 95vw;
    padding: 16px;
  }
  
  .color-name {
    font-size: 11px;
  }
  
  .color-hex,
  .color-description {
    font-size: 9px;
  }
}

@media (max-width: 480px) {
  .color-grid {
    grid-template-columns: 1fr;
    max-width: 280px;
  }
  
  .color-option {
    padding: 12px;
  }
  
  .color-swatch,
  .no-color-swatch {
    width: 28px;
    height: 28px;
  }
  
  .color-name {
    font-size: 12px;
  }
  
  .color-hex,
  .color-description {
    font-size: 10px;
  }
}
</style>