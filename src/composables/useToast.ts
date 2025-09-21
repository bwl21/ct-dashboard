import { ref, readonly } from 'vue'

export interface Toast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title?: string
  message: string
  duration?: number
  dismissible?: boolean
  persistent?: boolean
}

interface ToastOptions {
  title?: string
  duration?: number
  dismissible?: boolean
  persistent?: boolean
}

const toasts = ref<Toast[]>([])
const toastTimeouts = new Map<string, NodeJS.Timeout>()

let toastIdCounter = 0

const generateToastId = (): string => {
  return `toast-${++toastIdCounter}-${Date.now()}`
}

const addToast = (
  type: Toast['type'],
  message: string,
  options: ToastOptions = {}
): string => {
  const id = generateToastId()
  
  const toast: Toast = {
    id,
    type,
    message,
    title: options.title,
    duration: options.duration ?? (type === 'error' ? 8000 : 5000),
    dismissible: options.dismissible ?? true,
    persistent: options.persistent ?? false
  }

  toasts.value.push(toast)

  // Auto-remove toast after duration (unless persistent)
  if (!toast.persistent && toast.duration && toast.duration > 0) {
    const timeout = setTimeout(() => {
      removeToast(id)
    }, toast.duration)
    
    toastTimeouts.set(id, timeout)
  }

  return id
}

const removeToast = (id: string): void => {
  const index = toasts.value.findIndex(toast => toast.id === id)
  if (index > -1) {
    toasts.value.splice(index, 1)
  }
  
  // Clear timeout if exists
  const timeout = toastTimeouts.get(id)
  if (timeout) {
    clearTimeout(timeout)
    toastTimeouts.delete(id)
  }
}

const clearAllToasts = (): void => {
  // Clear all timeouts
  toastTimeouts.forEach(timeout => clearTimeout(timeout))
  toastTimeouts.clear()
  
  // Clear all toasts
  toasts.value = []
}

const updateToast = (id: string, updates: Partial<Toast>): void => {
  const toast = toasts.value.find(t => t.id === id)
  if (toast) {
    Object.assign(toast, updates)
  }
}

// Convenience methods
const showSuccess = (message: string, options?: ToastOptions): string => {
  return addToast('success', message, options)
}

const showError = (message: string, options?: ToastOptions): string => {
  return addToast('error', message, options)
}

const showWarning = (message: string, options?: ToastOptions): string => {
  return addToast('warning', message, options)
}

const showInfo = (message: string, options?: ToastOptions): string => {
  return addToast('info', message, options)
}

// API operation helpers (like ct-labelmanager)
const showApiSuccess = (operation: string, itemName?: string): string => {
  const titles = {
    create: 'Erfolgreich erstellt',
    update: 'Erfolgreich aktualisiert',
    delete: 'Erfolgreich gelöscht',
    bulkUpdate: 'Bulk-Update abgeschlossen',
    bulkDelete: 'Bulk-Löschung abgeschlossen'
  }
  
  const messages = {
    create: itemName ? `${itemName} wurde erfolgreich erstellt` : 'Element wurde erfolgreich erstellt',
    update: itemName ? `${itemName} wurde erfolgreich aktualisiert` : 'Element wurde erfolgreich aktualisiert',
    delete: itemName ? `${itemName} wurde erfolgreich gelöscht` : 'Element wurde erfolgreich gelöscht',
    bulkUpdate: 'Alle ausgewählten Elemente wurden erfolgreich aktualisiert',
    bulkDelete: 'Alle ausgewählten Elemente wurden erfolgreich gelöscht'
  }
  
  const title = titles[operation as keyof typeof titles] || 'Erfolgreich'
  const message = messages[operation as keyof typeof messages] || `${operation} erfolgreich`
  
  return showSuccess(message, { title })
}

const showApiError = (operation: string, error?: string): string => {
  const titles = {
    create: 'Fehler beim Erstellen',
    update: 'Fehler beim Aktualisieren', 
    delete: 'Fehler beim Löschen',
    fetch: 'Fehler beim Laden',
    bulkUpdate: 'Bulk-Update fehlgeschlagen',
    bulkDelete: 'Bulk-Löschung fehlgeschlagen'
  }
  
  const baseMessages = {
    create: 'Das Element konnte nicht erstellt werden',
    update: 'Das Element konnte nicht aktualisiert werden', 
    delete: 'Das Element konnte nicht gelöscht werden',
    fetch: 'Die Daten konnten nicht geladen werden',
    bulkUpdate: 'Einige Elemente konnten nicht aktualisiert werden',
    bulkDelete: 'Einige Elemente konnten nicht gelöscht werden'
  }
  
  const title = titles[operation as keyof typeof titles] || 'Fehler'
  const baseMessage = baseMessages[operation as keyof typeof baseMessages] || `Fehler bei ${operation}`
  const fullMessage = error ? `${baseMessage}. ${error}` : baseMessage
  
  return showError(fullMessage, { title, duration: 8000 })
}

const showValidationError = (message: string): string => {
  return showError(message, { 
    title: 'Eingabe ungültig',
    duration: 6000 
  })
}

const showNetworkError = (): string => {
  return showError('Netzwerkfehler. Bitte überprüfen Sie Ihre Internetverbindung.', {
    title: 'Verbindungsfehler',
    duration: 10000
  })
}

export const useToast = () => {
  return {
    // State
    toasts: readonly(toasts),
    
    // Core methods
    addToast,
    removeToast,
    clearAllToasts,
    updateToast,
    
    // Convenience methods
    showSuccess,
    showError,
    showWarning,
    showInfo,
    
    // API helpers (like ct-labelmanager)
    showApiSuccess,
    showApiError,
    showValidationError,
    showNetworkError
  }
}

// Global toast instance for use outside of components
export const toast = {
  success: showSuccess,
  error: showError,
  warning: showWarning,
  info: showInfo,
  apiSuccess: showApiSuccess,
  apiError: showApiError,
  validationError: showValidationError,
  networkError: showNetworkError
}