<template>
  <div class="dashboard-container">
    <!-- Header Card -->
    <div class="dashboard-header-card">
      <div class="ct-card-header">
        <h1 class="ct-card-title">ChurchTools Dashboard</h1>
        <span class="version-badge">v{{ version }}</span>
      </div>
      <div class="ct-card-body">
        <p class="description">Zentrale Übersicht für ChurchTools Module</p>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="permissionsLoading" class="loading-state">
      <div class="loading-skeleton">
        <div v-for="i in 4" :key="i" class="skeleton-card"></div>
      </div>
      <p class="loading-text">Lade Berechtigungen...</p>
    </div>

    <!-- Error State -->
    <PermissionErrorComponent
      v-else-if="permissionsError"
      :error="permissionsError"
      :retrying="permissionsLoading"
      @retry="$emit('retry-permissions')"
    />

    <!-- Success State - Show Available Modules -->
    <div v-else-if="modules.length > 0" class="features-grid">
      <div v-for="module in modules" :key="module.id" class="module-wrapper">
        <component
          :is="module.cardComponent"
          :module="module"
          class="feature-card"
          @navigate="$emit('navigate', module.id)"
        />
      </div>
    </div>

    <!-- No Modules Available -->
    <div v-else class="no-modules">
      <div class="no-modules-content">
        <div class="no-modules-icon">🔒</div>
        <h3 class="no-modules-title">Keine Module verfügbar</h3>
        <p class="no-modules-message">
          Sie haben derzeit keine Berechtigungen für Dashboard-Module.
        </p>
        <p class="no-modules-contact">
          Kontaktieren Sie Ihren Administrator für weitere Informationen.
        </p>
      </div>
    </div>

    <!-- Permission Debugger (nur in Development) -->
    <PermissionDebugger />
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import type { DashboardModule } from '../../types/modules'
import type { PermissionError } from '../../services/permissions'
import PermissionErrorComponent from './PermissionError.vue'
import PermissionDebugger from './PermissionDebugger.vue'
import packageJson from '../../../package.json'

const version = packageJson.version

defineProps({
  modules: {
    type: Array as PropType<DashboardModule[]>,
    required: true,
  },
  permissionsLoading: {
    type: Boolean,
    default: false,
  },
  permissionsError: {
    type: Object as PropType<PermissionError | null>,
    default: null,
  },
})

defineEmits<{
  (e: 'navigate', moduleId: string): void
  (e: 'retry-permissions'): void
}>()
</script>

<style scoped>
.dashboard-container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  width: 100%;
  max-width: none;
}

.dashboard-header-card {
  text-align: center;
  background: var(--color-background-card);
  color: var(--color-text-primary);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-base);
  overflow: hidden;
}

.dashboard-header-card .ct-card-header {
  padding: var(--spacing-lg);
  border-bottom: none;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dashboard-header-card .ct-card-body {
  padding: var(--spacing-lg);
}

.dashboard-header-card .ct-card-title {
  margin: 0;
  font-size: var(--font-size-display);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
}

.description {
  font-size: var(--font-size-xl);
  color: var(--color-text-secondary);
  margin: 0;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  max-width: none;
}

.module-wrapper {
  transition: transform var(--transition-base);
}

.feature-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  transition:
    transform var(--transition-base),
    box-shadow var(--transition-base);
}

.feature-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-xl);
}

.feature-icon {
  font-size: 3rem;
  text-align: center;
  margin-bottom: var(--spacing-md);
}

.feature-description {
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-md);
  line-height: var(--line-height-relaxed);
  flex-grow: 1;
}

.feature-value {
  font-size: var(--font-size-xxl);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  text-align: center;
}

.test-card {
  background-color: var(--color-background);
  border-left: 4px solid var(--color-primary);
}

.test-button {
  margin-top: var(--spacing-md);
  padding: 0.75rem var(--spacing-lg);
  font-size: var(--font-size-base);
  border-radius: var(--border-radius-base);
  transition: all var(--transition-base);
}

.test-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
}

.test-result {
  margin-top: var(--spacing-md);
  padding: var(--spacing-md);
  background-color: var(--color-success-light);
  border: 1px solid var(--color-success-border);
  border-radius: var(--border-radius-base);
  color: #155724;
  font-weight: var(--font-weight-medium);
}

/* ChurchTools Design System Classes */
.ct-card {
  background: var(--color-background-card);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-base);
  overflow: hidden;
}

.ct-card-header {
  padding: var(--spacing-lg);
  border-bottom: 1px solid var(--color-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.ct-card-body {
  padding: var(--spacing-lg);
}

.ct-card-title {
  margin: 0;
  font-size: var(--font-size-xxl);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.version-badge {
  background: var(--color-primary);
  color: white;
  padding: var(--spacing-xs) 0.75rem;
  border-radius: var(--border-radius-pill);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  letter-spacing: 0.5px;
}

.ct-btn {
  display: inline-block;
  padding: var(--spacing-sm) var(--spacing-md);
  border: none;
  border-radius: var(--border-radius-sm);
  text-decoration: none;
  cursor: pointer;
  font-weight: var(--font-weight-medium);
  text-align: center;
  transition: all var(--transition-base);
}

.ct-btn-primary {
  background-color: var(--color-primary);
  color: white;
}

.ct-btn-primary:hover {
  background-color: var(--color-primary-hover);
}

/* Responsive Design */
@media (min-width: 1400px) {
  .features-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: var(--spacing-xxl);
  }

  .dashboard-container {
    padding: var(--spacing-xxl);
  }
}

@media (min-width: 992px) and (max-width: 1399px) {
  .features-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--spacing-xl);
  }

  .dashboard-container {
    padding: calc(var(--spacing-xl) + var(--spacing-sm));
  }
}

@media (min-width: 769px) and (max-width: 991px) {
  .features-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--spacing-lg);
  }

  .dashboard-container {
    padding: var(--spacing-lg);
  }
}

/* Loading State */
.loading-state {
  text-align: center;
  padding: 2rem;
}

.loading-skeleton {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-bottom: 1rem;
}

.skeleton-card {
  height: 200px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
  border-radius: var(--border-radius-lg);
}

@keyframes loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

.loading-text {
  color: var(--color-text-secondary);
  font-size: var(--font-size-lg);
  margin: 0;
}

/* No Modules State */
.no-modules {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
  padding: 2rem;
}

.no-modules-content {
  text-align: center;
  max-width: 500px;
  padding: 2rem;
  background: var(--color-background-secondary, #f8f9fa);
  border-radius: var(--border-radius-lg);
  border: 1px solid var(--color-border, #dee2e6);
}

.no-modules-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.no-modules-title {
  color: var(--color-text-primary);
  margin-bottom: 1rem;
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
}

.no-modules-message {
  color: var(--color-text-secondary);
  margin-bottom: 0.5rem;
  line-height: var(--line-height-relaxed);
}

.no-modules-contact {
  color: var(--color-text-secondary);
  margin: 0;
  font-size: var(--font-size-sm);
  line-height: var(--line-height-relaxed);
}

@media (max-width: 768px) {
  .features-grid {
    grid-template-columns: 1fr;
    gap: var(--spacing-md);
  }

  .dashboard-header-card .ct-card-title {
    font-size: var(--font-size-xxxl);
  }

  .description {
    font-size: var(--font-size-base);
  }

  .feature-icon {
    font-size: 2.5rem;
  }

  .feature-value {
    font-size: var(--font-size-xl);
  }

  .dashboard-container {
    gap: var(--spacing-lg);
    padding: var(--spacing-md);
  }

  .loading-skeleton {
    grid-template-columns: 1fr;
    gap: var(--spacing-md);
  }

  .skeleton-card {
    height: 150px;
  }

  .no-modules-content {
    padding: 1.5rem;
  }

  .no-modules-icon {
    font-size: 2.5rem;
  }
}
</style>
