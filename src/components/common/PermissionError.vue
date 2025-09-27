<template>
  <div class="permission-error">
    <div class="error-content">
      <div class="error-icon">⚠️</div>
      <h3 class="error-title">Berechtigungen konnten nicht geladen werden</h3>
      <p class="error-message">{{ error.message }}</p>

      <div class="error-actions">
        <button
          v-if="error.canRetry"
          @click="$emit('retry')"
          class="ct-btn ct-btn-primary"
          :disabled="retrying"
        >
          {{ retrying ? 'Wird wiederholt...' : 'Erneut versuchen' }}
        </button>

        <button @click="handleContactAdmin" class="ct-btn ct-btn-secondary">
          Administrator kontaktieren
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PermissionError } from '../../services/permissions'

interface Props {
  error: PermissionError
  retrying?: boolean
}

const props = defineProps<Props>()
defineEmits<{
  retry: []
}>()

const handleContactAdmin = () => {
  // Open email client with pre-filled subject
  const subject = encodeURIComponent('Dashboard Berechtigungen - Hilfe benötigt')
  const body = encodeURIComponent(`Hallo,

ich habe Probleme beim Zugriff auf das ChurchTools Dashboard. 

Fehlermeldung: ${props.error.message}
Fehlertyp: ${props.error.type}

Bitte helfen Sie mir bei der Lösung dieses Problems.

Vielen Dank!`)

  window.location.href = `mailto:admin@church.org?subject=${subject}&body=${body}`
}
</script>

<style scoped>
.permission-error {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  padding: 2rem;
}

.error-content {
  text-align: center;
  max-width: 500px;
  padding: 2rem;
  background: var(--ct-color-background-secondary, #f8f9fa);
  border-radius: 8px;
  border: 1px solid var(--ct-color-border, #dee2e6);
}

.error-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.error-title {
  color: var(--ct-color-text-primary, #212529);
  margin-bottom: 1rem;
  font-size: 1.25rem;
  font-weight: 600;
}

.error-message {
  color: var(--ct-color-text-secondary, #6c757d);
  margin-bottom: 2rem;
  line-height: 1.5;
}

.error-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.ct-btn {
  padding: 0.5rem 1rem;
  border-radius: 4px;
  border: 1px solid transparent;
  font-weight: 500;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.ct-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.ct-btn-primary {
  background-color: var(--ct-color-primary, #007bff);
  color: white;
  border-color: var(--ct-color-primary, #007bff);
}

.ct-btn-primary:hover:not(:disabled) {
  background-color: var(--ct-color-primary-dark, #0056b3);
  border-color: var(--ct-color-primary-dark, #0056b3);
}

.ct-btn-secondary {
  background-color: var(--ct-color-secondary, #6c757d);
  color: white;
  border-color: var(--ct-color-secondary, #6c757d);
}

.ct-btn-secondary:hover {
  background-color: var(--ct-color-secondary-dark, #545b62);
  border-color: var(--ct-color-secondary-dark, #545b62);
}
</style>
