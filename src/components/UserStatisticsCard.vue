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
import type { DashboardModule } from '../types/modules'

defineProps<{
  module: DashboardModule
}>()
</script>

<style scoped>
.user-stats-card {
  border-left: 4px solid var(--color-success);
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
  margin: var(--spacing-md) 0;
}

.stats-container {
  display: flex;
  justify-content: space-around;
  margin: var(--spacing-lg) 0;
  flex: 1;
}

.stat-item {
  text-align: center;
  flex: 1;
}

.stat-value {
  font-size: var(--font-size-xxl);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  line-height: var(--line-height-tight);
}

.stat-label {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin-top: var(--spacing-xs);
}

@media (max-width: 768px) {
  .stat-value {
    font-size: var(--font-size-xl);
  }

  .stat-label {
    font-size: var(--font-size-xs);
  }
}
</style>
