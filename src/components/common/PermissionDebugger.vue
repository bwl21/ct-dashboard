<template>
  <div
    class="permission-debugger"
    v-if="isDevelopment && !isClosed"
    :class="{ minimized: isMinimized }"
    :style="{ top: position.y + 'px', left: position.x + 'px' }"
    @mousedown="startDrag"
  >
    <div class="debugger-header" @dblclick="toggleMinimize">
      <h3>🔍 Permission Debugger</h3>
      <div class="debugger-controls">
        <button @click="toggleMinimize" class="control-btn" title="Minimize/Maximize">
          {{ isMinimized ? '📖' : '📕' }}
        </button>
        <button @click="closeDebugger" class="control-btn" title="Close">✕</button>
      </div>
    </div>

    <div class="debugger-content" v-show="!isMinimized">
      <div class="debug-section">
        <h4>State:</h4>
        <div>Loading: {{ isLoading }}</div>
        <div>Error: {{ hasError?.type || 'none' }}</div>
        <div>
          Permissions loaded: {{ Object.keys(currentPermissions).length > 0 ? 'Yes' : 'No' }}
        </div>
      </div>

      <div class="debug-section">
        <h4>Module Access:</h4>
        <div v-for="module in testModules" :key="module" class="module-test">
          <span :class="{ 'has-access': canAccess(module), 'no-access': !canAccess(module) }">
            {{ module }}: {{ canAccess(module) ? '✅' : '❌' }}
          </span>
        </div>
      </div>

      <div class="debug-section">
        <h4>Configured Permissions:</h4>
        <div
          v-for="(config, moduleId) in modulePermissions"
          :key="moduleId"
          class="permission-config"
        >
          <strong>{{ moduleId }}:</strong>
          {{ config.module }}.{{ config.permission }} =
          <span
            :class="{
              'has-access': getConfiguredPermission(config),
              'no-access': !getConfiguredPermission(config),
            }"
          >
            {{ getConfiguredPermission(config) ? '✅' : '❌' }}
          </span>
        </div>
      </div>

      <div class="debug-section" v-if="showRawPermissions">
        <h4>Raw Permissions:</h4>
        <pre>{{
          Object.keys(currentPermissions).length > 0
            ? JSON.stringify(currentPermissions, null, 2).substring(0, 300) + '...'
            : 'No permissions loaded'
        }}</pre>
      </div>

      <div class="debug-actions">
        <button @click="showRawPermissions = !showRawPermissions" class="toggle-btn">
          {{ showRawPermissions ? 'Hide' : 'Show' }} Raw Permissions
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, ref, reactive } from 'vue'
import { hasModulePermission } from '../../services/permissions'
import type { GlobalPermissions } from '../../ct-types'
import permissionConfig from '../../config/permissions.json'

// Verwende die gleichen Permissions wie die App (über provide/inject)
const permissions = inject<any>('appPermissions')
const permissionsLoading = inject<any>('appPermissionsLoading')
const permissionsError = inject<any>('appPermissionsError')

const isDevelopment = false // Temporarily disabled
const testModules = ['automatic-groups', 'expiring-appointments', 'tags', 'loggerSummary']

// Permission configuration
const modulePermissions = permissionConfig.modulePermissions

// Debugger state
const isMinimized = ref(false)
const isClosed = ref(false)
const showRawPermissions = ref(false)
const isDragging = ref(false)

// Position state
const position = reactive({
  x: window.innerWidth - 420, // Start rechts
  y: 10, // Start oben
})

// Drag functionality
let dragOffset = { x: 0, y: 0 }

const startDrag = (event: MouseEvent) => {
  // Nur bei Header-Klick draggen
  if (!(event.target as HTMLElement).closest('.debugger-header')) return

  isDragging.value = true
  dragOffset.x = event.clientX - position.x
  dragOffset.y = event.clientY - position.y

  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', stopDrag)
  event.preventDefault()
}

const onDrag = (event: MouseEvent) => {
  if (!isDragging.value) return

  position.x = Math.max(0, Math.min(window.innerWidth - 300, event.clientX - dragOffset.x))
  position.y = Math.max(0, Math.min(window.innerHeight - 100, event.clientY - dragOffset.y))
}

const stopDrag = () => {
  isDragging.value = false
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
}

// Controls
const toggleMinimize = () => {
  isMinimized.value = !isMinimized.value
}

const closeDebugger = () => {
  isClosed.value = true
}

// Direkte Permission-Checks mit den echten Permissions
const canAccess = (moduleId: string) => {
  if (!permissions?.value || permissionsLoading?.value || permissionsError?.value) {
    return false
  }
  return hasModulePermission(permissions.value, moduleId)
}

// Computed für bessere Reaktivität
const currentPermissions = computed(() => permissions?.value || {})
const isLoading = computed(() => permissionsLoading?.value || false)
const hasError = computed(() => permissionsError?.value || null)

// Get configured permission value
const getConfiguredPermission = (config: any) => {
  if (!currentPermissions.value) return false

  const modulePermissions = currentPermissions.value[
    config.module as keyof GlobalPermissions
  ] as any
  if (!modulePermissions) return false

  return modulePermissions[config.permission] ?? false
}
</script>

<style scoped>
.permission-debugger {
  position: fixed;
  background: white;
  border: 2px solid #007bff;
  border-radius: 8px;
  max-width: 400px;
  max-height: 80vh;
  z-index: 9999;
  font-size: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  user-select: none;
  transition: all 0.2s ease;
}

.permission-debugger.minimized {
  max-height: 60px;
  overflow: hidden;
}

.debugger-header {
  background: #007bff;
  color: white;
  padding: 0.5rem 1rem;
  margin: -2px -2px 0 -2px;
  border-radius: 6px 6px 0 0;
  cursor: move;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #0056b3;
}

.debugger-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
}

.debugger-controls {
  display: flex;
  gap: 0.25rem;
}

.control-btn {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: background 0.2s ease;
}

.control-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.debugger-content {
  padding: 1rem;
  max-height: calc(80vh - 60px);
  overflow-y: auto;
}

.debug-section {
  margin-bottom: 1rem;
  border-bottom: 1px solid #eee;
  padding-bottom: 0.5rem;
}

.debug-section h4 {
  margin: 0 0 0.5rem 0;
  color: #007bff;
}

pre {
  background: #f8f9fa;
  padding: 0.5rem;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 10px;
}

.module-test {
  margin: 0.25rem 0;
}

.has-access {
  color: green;
  font-weight: bold;
}

.no-access {
  color: red;
  font-weight: bold;
}

.permission-config {
  margin: 0.25rem 0;
  font-family: monospace;
  font-size: 11px;
}

.debug-actions {
  margin-top: 1rem;
  padding-top: 0.5rem;
  border-top: 1px solid #eee;
}

.toggle-btn {
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  color: #495057;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 11px;
  transition: all 0.2s ease;
}

.toggle-btn:hover {
  background: #e9ecef;
  border-color: #adb5bd;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .permission-debugger {
    max-width: 90vw;
    font-size: 11px;
  }

  .debugger-header h3 {
    font-size: 12px;
  }
}
</style>
