<template>
  <div class="cts">
    <nav class="ct-navbar" v-if="isDevelopment">
      <div class="ct-navbar-brand">
        <span class="ct-navbar-title">ChurchTools Development</span>
      </div>
      <div class="ct-navbar-nav">
        <span class="ct-navbar-text">{{ userDisplayName }}</span>
      </div>
    </nav>

    <div class="ct-main">
      <div v-if="currentView === 'dashboard'">
        <Start :modules="modules" @navigate="navigateToModule" />
      </div>

      <div v-else>
        <div class="admin-header">
          <button @click="currentView = 'dashboard'" class="ct-btn ct-btn-outline back-btn">
            ← Zurück zum Dashboard
          </button>
          <h2>{{ currentModule?.title || 'Admin' }}</h2>
        </div>
        <component
          :is="currentModule?.adminComponent"
          v-if="currentModule"
          :module="currentModule"
        />
      </div>
    </div>
    
    <!-- Toast Notifications -->
    <Toast />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { churchtoolsClient } from '@churchtools/churchtools-client'
import type { Person } from './ct-types'
import type { DashboardModule } from './types/modules'
import Start from './components/common/Start.vue'
import AutomaticGroupsCard from './components/automatic-groups/AutomaticGroupsCard.vue'
import AutomaticGroupsAdmin from './components/automatic-groups/AutomaticGroupsAdmin.vue'
import ExpiringAppointmentsCard from './components/expiring-appointments/ExpiringAppointmentsCard.vue'
import ExpiringAppointmentsAdmin from './components/expiring-appointments/ExpiringAppointmentsAdmin.vue'
import TagsCard from './components/tags/TagsCard.vue'
import TagsAdmin from './components/tags/TagsAdmin.vue'
import BeispielCard from './components/beispiel/BeispielCard.vue'
import ColorPickerExample from './components/common/ColorPickerExample.vue'
import Toast from './components/common/Toast.vue'
import { useToast } from './composables/useToast'

const modules: DashboardModule[] = [
  {
    id: 'automatic-groups',
    title: 'Automatische Gruppen',
    icon: '⚙️',
    description: 'Verwaltung automatischer Gruppen',
    cardComponent: AutomaticGroupsCard,
    adminComponent: AutomaticGroupsAdmin,
  },
  {
    id: 'expiring-appointments',
    title: 'auslaufende Terminserien',
    icon: '📅',
    description: 'Verwaltung von ablaufenden Terminserienn',
    cardComponent: ExpiringAppointmentsCard,
    adminComponent: ExpiringAppointmentsAdmin,
  },
  {
    id: 'tags',
    title: 'Tags',
    icon: '🏷️',
    description: 'Verwaltung von Tags aus ChurchTools',
    cardComponent: TagsCard,
    adminComponent: TagsAdmin,
  },
  {
    id: 'colorpicker-example',
    title: 'ColorPicker Example',
    icon: '🎨',
    description: 'Beispiel für die ColorPicker-Komponente',
    cardComponent: BeispielCard,
    adminComponent: ColorPickerExample,
  },
]

const userDisplayName = ref<string>('')
const isDevelopment = ref<boolean>(false)
const currentView = ref<'dashboard' | string>('dashboard')
const currentModuleId = ref<string>('')

// Toast testing
const { showSuccess, showError, showWarning, showInfo, showApiSuccess, showApiError, showValidationError } = useToast()

// Make toast functions globally available for console testing
if (typeof window !== 'undefined') {
  (window as any).toast = {
    success: showSuccess,
    error: showError,
    warning: showWarning,
    info: showInfo,
    apiSuccess: showApiSuccess,
    apiError: showApiError,
    validationError: showValidationError
  }
}

const currentModule = computed(() => modules.find((m) => m.id === currentModuleId.value))

const navigateToModule = (moduleId: string) => {
  currentModuleId.value = moduleId
  currentView.value = moduleId
}

onMounted(async () => {
  isDevelopment.value = import.meta.env.MODE === 'development'

  try {
    const user = await churchtoolsClient.get<Person>('/whoami')
    userDisplayName.value = [user.firstName, user.lastName].filter(Boolean).join(' ') || 'Benutzer'
  } catch (error) {
    console.error('Fehler beim Laden der Benutzerdaten:', error)
    userDisplayName.value = 'Benutzer'
  }
  

})
</script>

<style scoped>
.ct-navbar {
  background-color: #2c3e50;
  color: white;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.ct-navbar-brand {
  font-weight: 600;
  font-size: 1.2rem;
}

.ct-navbar-text {
  font-size: 0.9rem;
  opacity: 0.9;
}

.ct-main {
  padding: 2rem;
  width: 100%;
  margin: 0;
}

@media (min-width: 1400px) {
  .ct-main {
    padding: 3rem;
  }
}

@media (min-width: 992px) and (max-width: 1399px) {
  .ct-main {
    padding: 2.5rem;
  }
}

@media (min-width: 769px) and (max-width: 991px) {
  .ct-main {
    padding: 1.5rem;
  }
}

.admin-header {
  margin-bottom: 2rem;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: 1px solid #007bff;
  background: transparent;
  color: #007bff;
  text-decoration: none;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.back-btn:hover {
  background-color: #007bff;
  color: white;
}

@media (max-width: 768px) {
  .ct-main {
    padding: 1rem;
  }

  .ct-navbar {
    padding: 1rem;
    flex-direction: column;
    gap: 0.5rem;
  }

  .back-btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
