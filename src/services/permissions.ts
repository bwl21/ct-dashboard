import { churchtoolsClient } from '@churchtools/churchtools-client'
import type { GlobalPermissions } from '../ct-types'
import permissionConfig from '../config/permissions.json'

export interface PermissionError {
  type: 'network' | 'unauthorized' | 'server' | 'unknown'
  message: string
  canRetry: boolean
}

export interface ModulePermissionConfig {
  module: string
  permission: string
  description: string
}

const ERROR_MESSAGES = {
  network: {
    message: 'Netzwerkverbindung fehlgeschlagen. Überprüfen Sie Ihre Internetverbindung.',
    canRetry: true,
  },
  unauthorized: {
    message: 'Ihre Sitzung ist abgelaufen. Bitte melden Sie sich erneut an.',
    canRetry: false,
  },
  server: {
    message: 'Server-Fehler beim Laden der Berechtigungen. Versuchen Sie es später erneut.',
    canRetry: true,
  },
  unknown: {
    message: 'Ein unbekannter Fehler ist aufgetreten. Kontaktieren Sie den Administrator.',
    canRetry: true,
  },
}

function createPermissionError(error: any): PermissionError {
  // Network/connection errors
  if (!navigator.onLine || error.code === 'NETWORK_ERROR' || error.message?.includes('fetch')) {
    return {
      type: 'network',
      ...ERROR_MESSAGES.network,
    }
  }

  // HTTP status codes
  if (error.response?.status) {
    const status = error.response.status

    if (status === 401 || status === 403) {
      return {
        type: 'unauthorized',
        ...ERROR_MESSAGES.unauthorized,
      }
    }

    if (status >= 500) {
      return {
        type: 'server',
        ...ERROR_MESSAGES.server,
      }
    }
  }

  // Default to unknown error
  return {
    type: 'unknown',
    ...ERROR_MESSAGES.unknown,
  }
}

export async function fetchUserPermissions(): Promise<GlobalPermissions> {
  try {
    const response = await churchtoolsClient.get('/permissions/global')
    return response as GlobalPermissions
  } catch (error: any) {
    // Fallback: Versuche andere Endpoints
    try {
      const fallback1 = (await churchtoolsClient.get('/permissions')) as GlobalPermissions
      return fallback1
    } catch (fallbackError: any) {}

    throw createPermissionError(error)
  }
}

export function hasModulePermission(permissions: GlobalPermissions, moduleId: string): boolean {
  // Konfigurierbare Permission-Prüfung mit Type-Safety
  const moduleConfig =
    permissionConfig.modulePermissions[moduleId as keyof typeof permissionConfig.modulePermissions]

  if (!moduleConfig) {
    console.warn(`No permission configuration found for module: ${moduleId}`)
    return false
  }

  const { module: permissionModule, permission: requiredPermission } = moduleConfig

  // Dynamische Permission-Prüfung basierend auf Konfiguration
  const modulePermissions = permissions[permissionModule as keyof GlobalPermissions]

  if (!modulePermissions || typeof modulePermissions !== 'object') {
    console.warn(`No permissions found for module: ${permissionModule}`)
    return false
  }

  // Dynamische Prüfung der Permission
  const hasPermissionValue = (modulePermissions as any)[requiredPermission]

  // Permission kann boolean oder object sein
  if (typeof hasPermissionValue === 'boolean') {
    return hasPermissionValue
  }

  // Wenn es ein Object ist, interpretieren wir es als "vorhanden" = true
  if (typeof hasPermissionValue === 'object' && hasPermissionValue !== null) {
    return true
  }

  // Fallback: Permission nicht gefunden
  console.warn(`Permission '${requiredPermission}' not found in module '${permissionModule}'`)
  return false
}
