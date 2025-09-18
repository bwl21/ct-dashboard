<template>
  <div class="ct-card feature-card user-stats-card">
    <div class="ct-card-header">
      <h3 class="ct-card-title">{{ module.title }}</h3>
    </div>
    <div class="ct-card-body">
      <div class="feature-icon">👥</div>
      <div class="stats-container">
        <div class="stat-item">
          <div class="stat-value">1,245</div>
          <div class="stat-label">Benutzer</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">842</div>
          <div class="stat-label">Aktiv (30 Tage)</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DashboardModule } from '../types/modules';

defineProps<{
  module: DashboardModule;
}>();
</script>

<style scoped>
.user-stats-card {
  border-left: 4px solid #4caf50;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.ct-card-body {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.feature-icon {
  font-size: 3rem;
  text-align: center;
  margin: 1rem 0;
}

.stats-container {
  display: flex;
  justify-content: space-around;
  margin: 1.5rem 0;
  flex: 1;
}

.stat-item {
  text-align: center;
  flex: 1;
}

.stat-value {
  font-size: 1.8rem;
  font-weight: 600;
  color: #2c3e50;
  line-height: 1;
}

.stat-label {
  font-size: 0.85rem;
  color: #666;
  margin-top: 0.25rem;
}

@media (max-width: 768px) {
  .stat-value {
    font-size: 1.5rem;
  }
  
  .stat-label {
    font-size: 0.75rem;
  }
}
</style>
