<template>
  <Teleport to="body">
    <div class="toast-container">
      <TransitionGroup name="toast" tag="div">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="toast"
          :class="[`toast-${toast.type}`, { 'toast-dismissible': toast.dismissible }]"
          @click="toast.dismissible && removeToast(toast.id)"
        >
          <div class="toast-icon">
            {{ getIcon(toast.type) }}
          </div>
          <div class="toast-content">
            <div class="toast-title" v-if="toast.title">{{ toast.title }}</div>
            <div class="toast-message">{{ toast.message }}</div>
          </div>
          <button
            v-if="toast.dismissible"
            class="toast-close"
            @click.stop="removeToast(toast.id)"
            aria-label="Close"
          >
            ×
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { useToast } from '../../composables/useToast'

const { toasts, removeToast } = useToast()

const getIcon = (type: string) => {
  const icons = {
    success: '✓',
    warning: '⚠',
    error: '✕',
    info: 'ℹ'
  }
  return icons[type as keyof typeof icons] || icons.info
}
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: 24px;
  right: 24px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 500px;
  pointer-events: none;
}

.toast {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 20px 24px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08);
  border-left: 5px solid;
  pointer-events: auto;
  min-width: 420px;
  max-width: 500px;
  transition: all 0.3s ease;
}

.toast-dismissible {
  cursor: pointer;
}

.toast-dismissible:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15), 0 4px 12px rgba(0, 0, 0, 0.1);
}

.toast-success {
  border-left-color: #16a34a;
  background: #f0fdf4;
}

.toast-success .toast-icon {
  color: #16a34a;
}

.toast-warning {
  border-left-color: #f59e0b;
  background: #fffbeb;
}

.toast-warning .toast-icon {
  color: #f59e0b;
}

.toast-error {
  border-left-color: #dc2626;
  background: #fef2f2;
}

.toast-error .toast-icon {
  color: #dc2626;
}

.toast-info {
  border-left-color: #3b82f6;
  background: #eff6ff;
}

.toast-info .toast-icon {
  color: #3b82f6;
}

.toast-icon {
  flex-shrink: 0;
  margin-top: 3px;
  font-size: 24px;
  font-weight: bold;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.toast-content {
  flex: 1;
  min-width: 0;
}

.toast-title {
  font-weight: 600;
  font-size: 16px;
  color: #1f2937;
  margin-bottom: 6px;
  line-height: 1.4;
}

.toast-message {
  font-size: 15px;
  color: #4b5563;
  line-height: 1.5;
  word-wrap: break-word;
}

.toast-close {
  flex-shrink: 0;
  background: none;
  border: none;
  font-size: 24px;
  color: #9ca3af;
  cursor: pointer;
  padding: 4px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.toast-close:hover {
  background: #f3f4f6;
  color: #6b7280;
}

/* Transitions */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.toast-move {
  transition: transform 0.3s ease;
}

/* Responsive */
@media (max-width: 768px) {
  .toast-container {
    top: 16px;
    right: 16px;
    left: 16px;
    max-width: none;
  }
  
  .toast {
    min-width: auto;
    max-width: none;
    padding: 18px 20px;
  }
  
  .toast-icon {
    font-size: 22px;
    width: 26px;
    height: 26px;
  }
  
  .toast-title {
    font-size: 15px;
  }
  
  .toast-message {
    font-size: 14px;
  }
}
</style>