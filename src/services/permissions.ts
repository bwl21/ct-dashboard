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
  console.log('🔍 Fetching permissions from API...')

  try {
    console.log('🔍 Trying /permissions/global...')
    const response = await churchtoolsClient.get('/permissions/global')
    console.log('🔍 Raw API Response:', response)
    console.log('🔍 Response type:', typeof response)
    console.log('🔍 Response keys:', Object.keys(response || {}))
    console.log('🔍 Response.data:', (response as any)?.data)
    console.log('🔍 Response structure:', JSON.stringify(response, null, 2))

    // ChurchTools Client entfernt data-Wrapper automatisch
    return response as GlobalPermissions
  } catch (error: any) {
    console.error('🔍 Permission API error:', error)
    console.error('🔍 Error details:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
    })

    // Fallback: Versuche andere Endpoints
    console.log('🔍 Trying fallback endpoints...')
    try {
      console.log('🔍 Trying /permissions...')
      const fallback1 = (await churchtoolsClient.get('/permissions')) as GlobalPermissions
      console.log('🔍 Fallback /permissions response:', fallback1)
      return fallback1
    } catch (fallbackError: any) {
      console.log('🔍 /permissions also failed:', fallbackError.message)
    }

    throw createPermissionError(error)
  }
}

export function hasModulePermission(permissions: GlobalPermissions, moduleId: string): boolean {
  // Konfigurierbare Permission-Prüfung mit Type-Safety
  const moduleConfig = permissionConfig.modulePermissions[moduleId as keyof typeof permissionConfig.modulePermissions]
  
  if (!moduleConfig) {
    console.warn(`No permission configuration found for module: ${moduleId}`)
    return false
  }

  const { module: permissionModule, permission: requiredPermission } = moduleConfig
  
  // Type-sichere Permission-Prüfung basierend auf Konfiguration
  switch (permissionModule) {
    case 'churchdb':
      const churchdbPermissions = permissions.churchdb
      if (!churchdbPermissions) return false
      
      // Type-sichere Prüfung der spezifischen Permission
      switch (requiredPermission) {
        case 'view':
          return churchdbPermissions.view ?? false
        case 'view tags':
          return churchdbPermissions['view tags'] ?? false
        case 'administer groups':
          return churchdbPermissions['administer groups'] ?? false
        default:
          console.warn(`Unknown churchdb permission: ${requiredPermission}`)
          return false
      }
      
    case 'churchcal':
      const churchcalPermissions = permissions.churchcal
      if (!churchcalPermissions) return false
      
      switch (requiredPermission) {
        case 'view':
          return churchcalPermissions.view ?? false
        default:
          console.warn(`Unknown churchcal permission: ${requiredPermission}`)
          return false
      }
      
    case 'churchcore':
      const churchcorePermissions = permissions.churchcore
      if (!churchcorePermissions) return false
      
      switch (requiredPermission) {
        case 'view logfile':
          return churchcorePermissions['view logfile'] ?? false
        default:
          console.warn(`Unknown churchcore permission: ${requiredPermission}`)
          return false
      }
      
    default:
      console.warn(`Unknown permission module: ${permissionModule}`)
      return false
  }
}
