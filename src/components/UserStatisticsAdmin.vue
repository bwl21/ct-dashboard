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
  padding: 0 1rem;
}

h2 {
  color: #2c3e50;
  margin-bottom: 1.5rem;
  font-size: 1.75rem;
}

.admin-content {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
  margin-top: 1.5rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.stat-card {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 1.5rem;
  text-align: center;
  transition:
    transform 0.2s,
    box-shadow 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stat-number {
  font-size: 2rem;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.stat-title {
  color: #666;
  font-size: 0.9rem;
  line-height: 1.4;
}

.chart-container {
  margin-top: 1.5rem;
}

.chart-placeholder {
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8f9fa;
  border-radius: 4px;
  color: #666;
  text-align: center;
  padding: 2rem;
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr 1fr;
  }

  .stat-number {
    font-size: 1.75rem;
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
