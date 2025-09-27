import { ref, computed } from 'vue'
import {
  fetchUserPermissions,
  hasModulePermission,
  type PermissionError,
} from '../services/permissions'
import type { GlobalPermissions } from '../ct-types'

export function usePermissions() {
  const permissions = ref<GlobalPermissions>({})
  const loading = ref(false)
  const error = ref<PermissionError | null>(null)

  const loadPermissions = async () => {
    loading.value = true
    error.value = null

    try {
      const result = await fetchUserPermissions()
      permissions.value = result
    } catch (err) {
      error.value = err as PermissionError
      // Clear permissions on error to ensure no unauthorized access
      permissions.value = {}
    } finally {
      loading.value = false
    }
  }

  const retry = () => {
    if (error.value?.canRetry) {
      loadPermissions()
    }
  }

  const canAccessModule = (moduleId: string) => {
    // Only check permissions if successfully loaded and no error
    if (error.value || loading.value) {
      return false
    }
    return hasModulePermission(permissions.value, moduleId)
  }

  return {
    permissions: computed(() => permissions.value),
    loading: computed(() => loading.value),
    error: computed(() => error.value),
    loadPermissions,
    retry,
    canAccessModule,
  }
}
