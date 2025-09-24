<template>
  <div class="color-picker-example">
    <h2>ColorPicker Example</h2>
    
    <div class="example-section">
      <h3>Basic Usage</h3>
      <div class="form-group">
        <label>Tag Color:</label>
        <ColorPicker v-model="selectedColor" />
      </div>
      
      <div class="result">
        <strong>Selected Color:</strong> 
        {{ selectedColor || 'None' }}
        <div v-if="selectedColor" class="color-preview">
          <div 
            class="color-swatch" 
            :style="{ backgroundColor: getColorHex(selectedColor) }"
          ></div>
          {{ getColorName(selectedColor) }} ({{ getColorHex(selectedColor) }})
        </div>
      </div>
    </div>

    <div class="example-section">
      <h3>In Form Context</h3>
      <form @submit.prevent="handleSubmit" class="tag-form">
        <div class="form-group">
          <label for="tagName">Tag Name:</label>
          <input 
            id="tagName"
            v-model="tagForm.name" 
            type="text" 
            placeholder="Enter tag name"
            class="form-input"
          />
        </div>
        
        <div class="form-group">
          <label for="tagDescription">Description:</label>
          <textarea 
            id="tagDescription"
            v-model="tagForm.description" 
            placeholder="Enter description (optional)"
            class="form-input"
            rows="3"
          ></textarea>
        </div>
        
        <div class="form-group">
          <label>Color:</label>
          <ColorPicker v-model="tagForm.color" />
        </div>
        
        <div class="form-actions">
          <button type="submit" class="btn btn-primary">Create Tag</button>
          <button type="button" class="btn btn-secondary" @click="resetForm">Reset</button>
        </div>
      </form>
      
      <div class="form-result">
        <h4>Form Data:</h4>
        <pre>{{ JSON.stringify(tagForm, null, 2) }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ColorPicker from './ColorPicker.vue'

// State
const selectedColor = ref<string | null>('blue')

const tagForm = ref({
  name: '',
  description: '',
  color: null as string | null
})

// ChurchTools Colors mapping (same as in ColorPicker)
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
const getColorHex = (colorValue: string) => {
  const color = churchToolsColors.find(c => c.value === colorValue)
  return color?.hex || '#000000'
}

const getColorName = (colorValue: string) => {
  const color = churchToolsColors.find(c => c.value === colorValue)
  return color?.label || colorValue
}

const handleSubmit = () => {
  // Form submitted
  alert('Tag would be created with: ' + JSON.stringify(tagForm.value, null, 2))
}

const resetForm = () => {
  tagForm.value = {
    name: '',
    description: '',
    color: null
  }
}
</script>

<style scoped>
.color-picker-example {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.example-section {
  margin-bottom: 40px;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: #f8f9fa;
}

.example-section h3 {
  margin-top: 0;
  color: #333;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 4px;
  font-weight: 500;
  color: #333;
}

.form-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.form-input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.result {
  margin-top: 16px;
  padding: 12px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.color-preview {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
}

.color-swatch {
  width: 20px;
  height: 20px;
  border-radius: 3px;
  border: 1px solid #ddd;
}

.tag-form {
  background: white;
  padding: 20px;
  border-radius: 6px;
  border: 1px solid #ddd;
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: background-color 0.2s;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-primary:hover {
  background: #0056b3;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #545b62;
}

.form-result {
  margin-top: 20px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 4px;
  border: 1px solid #ddd;
}

.form-result h4 {
  margin-top: 0;
  margin-bottom: 12px;
  color: #333;
}

.form-result pre {
  background: white;
  padding: 12px;
  border-radius: 4px;
  border: 1px solid #ddd;
  font-size: 12px;
  overflow-x: auto;
}
</style>