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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { churchtoolsClient } from '@churchtools/churchtools-client'
import type { Person } from './ct-types'
import type { DashboardModule } from './types/modules'
import Start from './components/Start.vue'
import AutomaticGroupsCard from './components/AutomaticGroupsCard.vue'
import AutomaticGroupsAdmin from './components/AutomaticGroupsAdmin.vue'
import ExpiringAppointmentsCard from './components/ExpiringAppointmentsCard.vue'
import ExpiringAppointmentsAdmin from './components/ExpiringAppointmentsAdmin.vue'
import BeispielCard from './components/BeispielCard.vue'

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
]

const userDisplayName = ref<string>('')
const isDevelopment = ref<boolean>(false)
const currentView = ref<'dashboard' | string>('dashboard')
const currentModuleId = ref<string>('')

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
  background-color: var(--color-text-primary);
  color: white;
  padding: var(--spacing-md) var(--spacing-xl);
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: var(--shadow-sm);
}

.ct-navbar-brand {
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-xl);
}

.ct-navbar-text {
  font-size: var(--font-size-sm);
  opacity: 0.9;
}

.ct-main {
  padding: var(--spacing-xl);
  width: 100%;
  margin: 0;
}

@media (min-width: 1400px) {
  .ct-main {
    padding: var(--spacing-xxl);
  }
}

@media (min-width: 992px) and (max-width: 1399px) {
  .ct-main {
    padding: calc(var(--spacing-xl) + var(--spacing-sm));
  }
}

@media (min-width: 769px) and (max-width: 991px) {
  .ct-main {
    padding: var(--spacing-lg);
  }
}

.admin-header {
  margin-bottom: var(--spacing-xl);
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: 0.75rem var(--spacing-lg);
  border: 1px solid var(--color-primary);
  background: transparent;
  color: var(--color-primary);
  text-decoration: none;
  border-radius: var(--border-radius-sm);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all var(--transition-base);
}

.back-btn:hover {
  background-color: var(--color-primary);
  color: white;
}

@media (max-width: 768px) {
  .ct-main {
    padding: var(--spacing-md);
  }

  .ct-navbar {
    padding: var(--spacing-md);
    flex-direction: column;
    gap: var(--spacing-sm);
  }

  .back-btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
