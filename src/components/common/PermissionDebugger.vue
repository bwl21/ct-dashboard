<template>
  <div class="permission-debugger" v-if="isDevelopment">
    <h3>🔍 Permission Debugger</h3>

    <div class="debug-section">
      <h4>State:</h4>
      <div>Loading: {{ isLoading }}</div>
      <div>Error: {{ hasError?.type || 'none' }}</div>
      <div>Permissions loaded: {{ Object.keys(currentPermissions).length > 0 ? 'Yes' : 'No' }}</div>
    </div>

    <div class="debug-section">
      <h4>Raw Permissions:</h4>
      <pre>{{
        Object.keys(currentPermissions).length > 0
          ? JSON.stringify(currentPermissions, null, 2).substring(0, 300) + '...'
          : 'No permissions loaded'
      }}</pre>
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
      <h4>Specific Permissions:</h4>
      <div>churchdb.view: {{ currentPermissions.churchdb?.view ?? 'undefined' }}</div>
      <div>churchcal.view: {{ currentPermissions.churchcal?.view ?? 'undefined' }}</div>
      <div>
        churchcore['view logfile']:
        {{ currentPermissions.churchcore?.['view logfile'] ?? 'undefined' }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue'
import { hasModulePermission } from '../../services/permissions'
import type { GlobalPermissions } from '../../ct-types'

// Verwende die gleichen Permissions wie die App (über provide/inject)
const permissions = inject<any>('appPermissions')
const permissionsLoading = inject<any>('appPermissionsLoading')
const permissionsError = inject<any>('appPermissionsError')

const isDevelopment = import.meta.env.MODE === 'development'
const testModules = ['automatic-groups', 'expiring-appointments', 'tags', 'loggerSummary']

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
</script>

<style scoped>
.permission-debugger {
  position: fixed;
  top: 10px;
  right: 10px;
  background: white;
  border: 2px solid #007bff;
  padding: 1rem;
  border-radius: 8px;
  max-width: 400px;
  max-height: 80vh;
  overflow-y: auto;
  z-index: 9999;
  font-size: 12px;
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
</style>
