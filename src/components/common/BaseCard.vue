<template>
  <div class="ct-card feature-card base-card" :class="{ loading: isLoading }">
    <div class="ct-card-header">
      <h3 class="ct-card-title">
        <span class="card-icon">{{ icon }}</span>
        {{ title }}
      </h3>
      <div class="ct-card-actions">
        <button type="button" class="ct-btn-icon" @click.stop="$emit('navigate')">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 16 16 12 12 8"></polyline>
            <line x1="8" y1="12" x2="16" y2="12"></line>
          </svg>
        </button>
      </div>
    </div>
    <div class="ct-card-body">
      <div v-if="isLoading" class="loading-content">
        <div class="loading-spinner"></div>
        <p>{{ loadingText }}</p>
      </div>

      <div v-else-if="error" class="error-content">
        <p class="error-message">❌ {{ error }}</p>
        <slot name="error-actions">
          <button type="button" @click="$emit('retry')" class="ct-btn ct-btn-sm ct-btn-outline">
            {{ retryText }}
          </button>
        </slot>
      </div>

      <div v-else class="card-stats">
        <div class="main-stat">
          <div class="stat-number">{{ mainStat.value }}</div>
          <div class="stat-label">{{ mainStat.label }}</div>
        </div>

        <div class="status-breakdown">
          <div v-for="stat in statusStats" :key="stat.key" class="status-item" :class="stat.type">
            <div class="status-icon">{{ stat.icon }}</div>
            <div class="status-info">
              <div class="status-number">{{ stat.value }}</div>
              <div class="status-label">{{ stat.label }}</div>
            </div>
          </div>
        </div>

        <div class="last-update" v-if="lastUpdate">{{ lastUpdateText }}: {{ lastUpdate }}</div>
      </div>

      <div class="ct-card-footer">
        <button
          type="button"
          @click="$emit('refresh')"
          class="ct-btn ct-btn-primary ct-btn-sm"
          :disabled="isLoading"
        >
          {{ isLoading ? refreshingText : refreshText }}
        </button>
        <slot name="actions">
          <button type="button" @click="$emit('navigate')" class="ct-btn ct-btn-sm ct-btn-outline">
            {{ detailsText }}
          </button>
        </slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface StatItem {
  key: string
  value: number | string
  label: string
  icon: string
  type?: 'success' | 'error' | 'warning' | 'info'
}

interface MainStat {
  value: number | string
  label: string
}

defineProps<{
  title: string
  icon: string
  isLoading?: boolean
  error?: string | null
  mainStat: MainStat
  statusStats: StatItem[]
  lastUpdate?: string
  loadingText?: string
  retryText?: string
  refreshText?: string
  refreshingText?: string
  detailsText?: string
  lastUpdateText?: string
}>()

defineEmits<{
  navigate: []
  refresh: []
  retry: []
}>()
</script>

<style scoped>
.base-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--color-background-card);
  border-radius: var(--border-radius-xl);
  box-shadow: var(--shadow-base);
  transition:
    transform var(--transition-base),
    box-shadow var(--transition-base);
  overflow: hidden;
}

.base-card .ct-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 72px;
  padding: 0 var(--spacing-lg);
  border-bottom: 1px solid var(--color-border-light);
  background-color: var(--color-background);
  box-sizing: border-box;
}

.base-card .ct-card-title {
  margin: 0;
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  display: flex;
  align-items: center;
  line-height: var(--line-height-tight);
  padding: 1.25rem 0;
}

.base-card .card-icon {
  margin-right: 0.75rem;
  font-size: 1.25rem;
  color: #4a6cf7;
}

.base-card .ct-card-actions {
  margin-left: var(--spacing-sm);
}

.base-card .ct-card-body {
  flex: 1;
  padding: var(--spacing-lg);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.base-card.loading {
  opacity: 0.8;
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  text-align: center;
  color: #6c757d;
}

.loading-spinner {
  width: 30px;
  height: 30px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.error-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  text-align: center;
}

.error-message {
  color: #dc3545;
  margin-bottom: 1rem;
}

.card-stats {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.main-stat {
  text-align: center;
  padding: 1rem 0;
}

.stat-number {
  font-size: 2.5rem;
  font-weight: 700;
  color: #2c3e50;
  line-height: 1;
}

.stat-label {
  font-size: 0.9rem;
  color: #666;
  margin-top: 0.5rem;
}

.status-breakdown {
  display: flex;
  gap: 1rem;
  justify-content: space-around;
  flex-wrap: wrap;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  min-width: 0;
}

.status-icon {
  font-size: 1.2rem;
  flex-shrink: 0;
}

.status-info {
  text-align: left;
}

.status-number {
  font-size: 1.2rem;
  font-weight: 600;
  line-height: 1;
}

.status-label {
  font-size: 0.75rem;
  color: #666;
  margin-top: 0.25rem;
}

.status-item.success .status-number {
  color: #28a745;
}

.status-item.error .status-number {
  color: #dc3545;
}

.status-item.warning .status-number {
  color: #ffc107;
}

.status-item.info .status-number {
  color: #17a2b8;
}

.last-update {
  text-align: center;
  font-size: 0.8rem;
  color: #6c757d;
  margin-top: auto;
  padding-top: 1rem;
}

.ct-card-footer {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  flex-wrap: wrap;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #f0f2f5;
}

.ct-btn {
  display: inline-block;
  padding: 0.375rem 0.75rem;
  border: none;
  border-radius: 4px;
  font-size: 0.875rem;
  font-weight: 500;
  text-align: center;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s;
}

.ct-btn-primary {
  background: #007bff;
  color: white;
}

.ct-btn-primary:hover:not(:disabled) {
  background: #0056b3;
}

.ct-btn-outline {
  background: transparent;
  color: #007bff;
  border: 1px solid #007bff;
}

.ct-btn-outline:hover {
  background: #007bff;
  color: white;
}

.ct-btn-sm {
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
}

.ct-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.ct-btn-icon {
  background: none;
  border: none;
  padding: 0.5rem;
  border-radius: 50%;
  cursor: pointer;
  color: #6c757d;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ct-btn-icon:hover {
  background: rgba(0, 0, 0, 0.05);
  color: #007bff;
}

/* Responsive Design */
@media (max-width: 768px) {
  .base-card .ct-card-header {
    padding: var(--spacing-lg) var(--spacing-lg) var(--spacing-md) var(--spacing-lg);
  }

  .base-card .ct-card-body {
    padding: var(--spacing-md) var(--spacing-lg) var(--spacing-lg) var(--spacing-lg);
  }

  .status-breakdown {
    flex-direction: column;
    gap: 0.75rem;
  }

  .status-item {
    justify-content: center;
  }

  .ct-card-footer {
    flex-direction: column;
  }

  .ct-btn {
    width: 100%;
  }
}

@media (max-width: 576px) {
  .stat-number {
    font-size: var(--font-size-xxxl);
  }

  .status-number {
    font-size: var(--font-size-base);
  }
}
</style>
