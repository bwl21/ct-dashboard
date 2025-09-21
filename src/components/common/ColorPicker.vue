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
        
        <div class="color-grid">
          <!-- No Color Option -->
          <div
            class="color-option no-color"
            :class="{ selected: !selectedColor }"
            @click="selectColor(null)"
          >
            <div class="color-swatch no-color-swatch">
              <span>×</span>
            </div>
            <div class="color-label">
              <div class="color-name">Keine Farbe</div>
              <div class="color-description">Farbe entfernen</div>
            </div>
          </div>

          <!-- Color Options -->
          <div
            v-for="color in churchToolsColors"
            :key="color.value"
            class="color-option"
            :class="{ selected: selectedColor === color.value }"
            @click="selectColor(color.value)"
          >
            <div
              class="color-swatch"
              :style="{ backgroundColor: color.hex }"
            ></div>
            <div class="color-label">
              <div class="color-name">{{ color.label }}</div>
              <div class="color-hex">{{ color.hex }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

// Props
interface Props {
  modelValue?: string | null
  placeholder?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  placeholder: 'Select a color'
})

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: string | null]
}>()

// State
const showModal = ref(false)
const selectedColor = ref<string | null>(props.modelValue)

// ChurchTools Colors (from ct-labelmanager)
const churchToolsColors = [
  { value: 'aqua', label: 'Aqua', hex: '#00FFFF' },
  { value: 'black', label: 'Black', hex: '#000000' },
  { value: 'blue', label: 'Blue', hex: '#0000FF' },
  { value: 'brown', label: 'Brown', hex: '#A52A2A' },
  { value: 'cyan', label: 'Cyan', hex: '#00FFFF' },
  { value: 'darkblue', label: 'Dark Blue', hex: '#00008B' },
  { value: 'darkcyan', label: 'Dark Cyan', hex: '#008B8B' },
  { value: 'darkgray', label: 'Dark Gray', hex: '#A9A9A9' },
  { value: 'darkgreen', label: 'Dark Green', hex: '#006400' },
  { value: 'darkmagenta', label: 'Dark Magenta', hex: '#8B008B' },
  { value: 'darkorange', label: 'Dark Orange', hex: '#FF8C00' },
  { value: 'darkred', label: 'Dark Red', hex: '#8B0000' },
  { value: 'darkviolet', label: 'Dark Violet', hex: '#9400D3' },
  { value: 'darkyellow', label: 'Dark Yellow', hex: '#B8860B' },
  { value: 'gray', label: 'Gray', hex: '#808080' },
  { value: 'green', label: 'Green', hex: '#008000' },
  { value: 'lightblue', label: 'Light Blue', hex: '#ADD8E6' },
  { value: 'lightcyan', label: 'Light Cyan', hex: '#E0FFFF' },
  { value: 'lightgray', label: 'Light Gray', hex: '#D3D3D3' },
  { value: 'lightgreen', label: 'Light Green', hex: '#90EE90' },
  { value: 'lightmagenta', label: 'Light Magenta', hex: '#FF77FF' },
  { value: 'lightorange', label: 'Light Orange', hex: '#FFE4B5' },
  { value: 'lightred', label: 'Light Red', hex: '#FFB6C1' },
  { value: 'lightviolet', label: 'Light Violet', hex: '#DDA0DD' },
  { value: 'lightyellow', label: 'Light Yellow', hex: '#FFFFE0' },
  { value: 'magenta', label: 'Magenta', hex: '#FF00FF' },
  { value: 'orange', label: 'Orange', hex: '#FFA500' },
  { value: 'red', label: 'Red', hex: '#FF0000' },
  { value: 'violet', label: 'Violet', hex: '#8A2BE2' },
  { value: 'white', label: 'White', hex: '#FFFFFF' },
  { value: 'yellow', label: 'Yellow', hex: '#FFFF00' }
]

// Methods
const getColorInfo = (colorValue: string | null) => {
  if (!colorValue) {
    return { name: 'No Color', hex: '', label: 'No Color' }
  }
  
  const color = churchToolsColors.find(c => c.value === colorValue)
  return color || { name: colorValue, hex: '#000000', label: colorValue }
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

.color-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  max-width: 640px;
}

.color-option {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border: 2px solid transparent;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  background: #f8f9fa;
  min-height: 48px;
}

.color-option:hover {
  background: #e9ecef;
  border-color: #007bff;
  transform: scale(1.05);
}

.color-option.selected {
  background: #e3f2fd;
  border-color: #007bff;
  box-shadow: 0 2px 8px rgba(0, 123, 255, 0.3);
}

.color-option.no-color {
  background: #fff;
  border-color: #ddd;
}

.color-option.no-color:hover {
  border-color: #007bff;
  background: #f8f9fa;
}

.color-option.no-color.selected {
  background: #f8f9fa;
  border-color: #007bff;
  box-shadow: 0 2px 8px rgba(0, 123, 255, 0.3);
}

.color-option .color-swatch {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
}

.color-option .no-color-swatch {
  width: 24px;
  height: 24px;
  font-size: 12px;
  font-weight: bold;
  border-radius: 4px;
  border: 1px solid #ddd;
  background: #fff;
  color: #999;
  flex-shrink: 0;
}

.color-label {
  flex: 1;
  min-width: 0;
}

.color-name {
  font-weight: 500;
  font-size: 12px;
  color: #333;
  line-height: 1.2;
  margin-bottom: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.color-hex {
  font-size: 10px;
  color: #666;
  font-family: monospace;
  line-height: 1;
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