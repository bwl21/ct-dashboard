<template>
  <div v-if="selectedCount > 0" class="bulk-actions-widget">
    <div class="widget-header">
      <div class="selection-info">
        <strong>{{ selectedCount }}</strong>
        {{ itemLabel }}
      </div>
      <button @click="$emit('clear-selection')" class="clear-btn" title="Auswahl aufheben">
        ✕
      </button>
    </div>

    <div class="widget-actions">
      <slot name="actions" :selectedCount="selectedCount" :selectedIds="selectedIds">
        <!-- Default: No actions -->
        <p class="no-actions">Keine Aktionen verfügbar</p>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  selectedIds: number[]
  singularLabel: string
  pluralLabel: string
}

const props = defineProps<Props>()

defineEmits<{
  'clear-selection': []
}>()

const selectedCount = computed(() => props.selectedIds.length)

const itemLabel = computed(() => {
  return selectedCount.value === 1
    ? `${props.singularLabel} ausgewählt`
    : `${props.pluralLabel} ausgewählt`
})
</script>

<style scoped>
.bulk-actions-widget {
  position: fixed;
  top: 20px;
  right: 20px;
  background: white;
  border: 2px solid var(--ct-primary, #3498db);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 9999;
  min-width: 280px;
  max-width: 400px;
  animation: slideIn 0.3s ease-out;
}

.widget-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--ct-border-color, #e0e0e0);
  background: var(--ct-bg-secondary, #f8f9fa);
  border-radius: 6px 6px 0 0;
}

.selection-info {
  font-size: 0.95rem;
  color: var(--ct-text-primary, #2c3e50);
}

.selection-info strong {
  color: var(--ct-primary, #3498db);
  font-size: 1.2rem;
  margin-right: 0.25rem;
}

.clear-btn {
  background: transparent;
  border: none;
  font-size: 1.5rem;
  color: var(--ct-text-secondary, #6c757d);
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
}

.clear-btn:hover {
  background: rgba(220, 53, 69, 0.1);
  color: #dc3545;
}

.widget-actions {
  padding: 1rem 1.5rem;
}

.no-actions {
  margin: 0;
  color: var(--ct-text-secondary, #6c757d);
  font-size: 0.9rem;
  text-align: center;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Action button styles for slotted content */
:deep(.bulk-action-btn) {
  width: 100%;
  padding: 0.75rem 1rem;
  margin-bottom: 0.5rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

:deep(.bulk-action-btn:last-child) {
  margin-bottom: 0;
}

:deep(.bulk-action-btn:disabled) {
  opacity: 0.6;
  cursor: not-allowed;
}

:deep(.bulk-action-btn.primary) {
  background-color: var(--ct-primary, #3498db);
  color: white;
}

:deep(.bulk-action-btn.primary:hover:not(:disabled)) {
  background-color: var(--ct-primary-dark, #2980b9);
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

:deep(.bulk-action-btn.success) {
  background-color: var(--ct-success, #28a745);
  color: white;
}

:deep(.bulk-action-btn.success:hover:not(:disabled)) {
  background-color: #218838;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

:deep(.bulk-action-btn.danger) {
  background-color: var(--ct-danger, #dc3545);
  color: white;
}

:deep(.bulk-action-btn.danger:hover:not(:disabled)) {
  background-color: #c82333;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

:deep(.bulk-action-btn.secondary) {
  background-color: var(--ct-secondary, #6c757d);
  color: white;
}

:deep(.bulk-action-btn.secondary:hover:not(:disabled)) {
  background-color: var(--ct-secondary-dark, #5a6268);
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

:deep(.action-spinner) {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
