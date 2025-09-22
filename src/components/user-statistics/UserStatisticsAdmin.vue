<template>
  <div class="admin-container">
    <h2>{{ module?.title || 'Benutzerstatistiken' }}</h2>
    <div class="admin-content">
      <div class="ct-card">
        <div class="ct-card-header">
          <h3 class="ct-card-title">Detaillierte Statistiken</h3>
        </div>
        <div class="ct-card-body">
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-number">1,245</div>
              <div class="stat-title">Gesamte Benutzer</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">842</div>
              <div class="stat-title">Aktive Benutzer (30 Tage)</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">45</div>
              <div class="stat-title">Neue Benutzer (letzte 30 Tage)</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">156</div>
              <div class="stat-title">Inaktive Benutzer (>90 Tage)</div>
            </div>
          </div>
        </div>
      </div>

      <div class="ct-card chart-container">
        <div class="ct-card-header">
          <h3 class="ct-card-title">Aktivität der letzten 30 Tage</h3>
        </div>
        <div class="ct-card-body">
          <div class="chart-placeholder">
            <p>Diagramm zur Benutzeraktivität wird hier angezeigt</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DashboardModule } from '../types/modules'

defineProps<{
  module?: DashboardModule
}>()
</script>

<style scoped>
.admin-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--spacing-md);
}

h2 {
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-lg);
  font-size: var(--font-size-xxl);
  font-weight: var(--font-weight-semibold);
}

.admin-content {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-lg);
  margin-top: var(--spacing-lg);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--spacing-md);
}

.stat-card {
  background: var(--color-background);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-lg);
  text-align: center;
  transition:
    transform var(--transition-base),
    box-shadow var(--transition-base);
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.stat-number {
  font-size: var(--font-size-xxxl);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-sm);
}

.stat-title {
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  line-height: var(--line-height-base);
}

.chart-container {
  margin-top: var(--spacing-lg);
}

.chart-placeholder {
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-background);
  border-radius: var(--border-radius-sm);
  color: var(--color-text-secondary);
  text-align: center;
  padding: var(--spacing-xl);
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr 1fr;
  }

  .stat-number {
    font-size: var(--font-size-xxl);
  }
}

@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .stat-number {
    font-size: 1.5rem;
  }

  .chart-placeholder {
    height: 200px;
  }
}
</style>
