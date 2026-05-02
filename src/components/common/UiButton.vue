<template>
  <button
    type="button"
    :class="['ui-btn', `ui-btn-${variant}`, `ui-btn-${size}`, { 'ui-btn-icon-only': iconOnly }]"
    :disabled="disabled || loading"
    :title="title"
    @click="$emit('click', $event)"
  >
    <span v-if="loading" class="ui-btn-spinner" aria-hidden="true">⏳</span>
    <span v-else-if="icon" class="ui-btn-icon" aria-hidden="true">{{ icon }}</span>
    <span v-if="!iconOnly && (label || $slots.default)" class="ui-btn-label">
      <slot>{{ label }}</slot>
    </span>
  </button>
</template>

<script setup lang="ts">
import type { UiButtonVariant, UiButtonSize } from './uiButtonTypes'

interface Props {
  variant?: UiButtonVariant
  size?: UiButtonSize
  icon?: string
  label?: string
  iconOnly?: boolean
  disabled?: boolean
  loading?: boolean
  title?: string
}

withDefaults(defineProps<Props>(), {
  variant: 'outline',
  size: 'md',
  icon: '',
  label: '',
  iconOnly: false,
  disabled: false,
  loading: false,
  title: '',
})

defineEmits<{
  click: [event: MouseEvent]
}>()
</script>

<style scoped>
.ui-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: 1px solid #ccc;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  font-family: inherit;
  white-space: nowrap;
  transition: all 0.2s;
  background: white;
  color: #333;
}

.ui-btn:hover:not(:disabled) {
  filter: brightness(0.95);
}

.ui-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Sizes */
.ui-btn-sm {
  padding: 4px 8px;
  font-size: 0.8em;
}
.ui-btn-md {
  padding: 6px 12px;
  font-size: 0.9em;
}
.ui-btn-lg {
  padding: 8px 16px;
  font-size: 0.95em;
}

/* Icon-only buttons get square padding */
.ui-btn-icon-only.ui-btn-sm {
  padding: 4px 6px;
}
.ui-btn-icon-only.ui-btn-md {
  padding: 6px 8px;
}
.ui-btn-icon-only.ui-btn-lg {
  padding: 8px 10px;
}

.ui-btn-icon {
  line-height: 1;
}

/* Variants */
.ui-btn-primary {
  background: #2196f3;
  color: white;
  border-color: #2196f3;
}

.ui-btn-success {
  background: #4caf50;
  color: white;
  border-color: #4caf50;
}

.ui-btn-danger {
  background: #f44336;
  color: white;
  border-color: #f44336;
}

.ui-btn-warning {
  background: #ff9800;
  color: white;
  border-color: #ff9800;
}

.ui-btn-info {
  background: #2196f3;
  color: white;
  border-color: #2196f3;
}

.ui-btn-delete {
  background: #9c27b0;
  color: white;
  border-color: #9c27b0;
}

.ui-btn-outline {
  background: white;
  color: #333;
  border-color: #ccc;
}

.ui-btn-outline:hover:not(:disabled) {
  background: #f5f5f5;
  border-color: #999;
  filter: none;
}
</style>
