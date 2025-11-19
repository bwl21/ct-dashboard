<template>
  <div class="ct-card feature-card base-card" :class="{ loading: isLoading }" :style="cardStyle">
    <div class="ct-card-header">
      <div class="header-content">
        <div class="large-icon">{{ icon }}</div>
        <div class="title-section">
          <h3 class="ct-card-title">{{ title }}</h3>
          <span class="total-count" :class="{ 'loading-placeholder': isLoading }">
            <template v-if="isLoading">... Einträge</template>
            <template v-else>{{ mainStat.value }} Einträge</template>
          </span>
        </div>
      </div>
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

      <!-- Compact Table Layout -->
      <div v-else class="table-content">
        <table class="stats-table">
          <thead>
            <tr>
              <th class="col-icon">Typ</th>
              <th class="col-category">Anzahl Kategorie</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="stat in statusStats" :key="stat.key" class="table-row">
              <td class="icon-cell">
                <span class="status-badge" :class="getStatusClass(stat.type)">
                  <span class="icon">{{ stat.icon }}</span>
                </span>
              </td>
              <td class="category-cell">
                <div class="category-info">
                  <span class="category-count">{{ stat.value }}</span>
                  <span class="category-name">{{ stat.label }}</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="ct-card-footer">
        <span class="last-update">
          <template v-if="isLoading">Lade Daten...</template>
          <template v-else-if="error">Fehler beim Laden</template>
          <template v-else-if="lastUpdate">{{ lastUpdate }}</template>
          <template v-else>&nbsp;</template>
        </span>
        <div class="footer-actions">
          <slot name="actions">
            <button
              type="button"
              @click="$emit('navigate')"
              class="ct-btn ct-btn-sm ct-btn-outline"
            >
              {{ detailsText }}
            </button>
          </slot>
          <button
            type="button"
            @click="$emit('refresh')"
            class="ct-btn ct-btn-primary ct-btn-sm"
            :disabled="isLoading"
          >
            <span v-if="isLoading" class="btn-spinner"></span>
            {{ isLoading ? refreshingText : refreshText }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

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

const props = defineProps<{
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

// Calculate card height based on number of categories
const cardStyle = computed(() => {
  const headerHeight = 80 // Large icon header
  const tableHeaderHeight = 32 // Table header
  const rowHeight = 40 // Each table row
  const footerHeight = 40 // Footer
  const padding = 16 // Card padding

  const expectedRows = props.statusStats.length
  const calculatedHeight =
    headerHeight + tableHeaderHeight + expectedRows * rowHeight + footerHeight + padding

  return {
    minHeight: `${calculatedHeight}px`,
  }
})

defineEmits<{
  navigate: []
  refresh: []
  retry: []
}>()

// Status class mapping for table layout
const getStatusClass = (type?: string) => {
  const classMap = {
    error: 'status-error',
    warning: 'status-warning',
    info: 'status-info',
    success: 'status-success',
  }
  return classMap[type as keyof typeof classMap] || 'status-neutral'
}
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
  align-items: center;
  justify-content: space-between;
  min-height: 60px;
  padding: var(--spacing-md) var(--spacing-lg);
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
}

.base-card .card-icon {
  margin-right: 0.75rem;
  font-size: 1.25rem;
  color: #4a6cf7;
}

.base-card .ct-card-actions {
  flex-shrink: 0;
  display: flex;
  align-items: center;
}

.base-card .ct-card-body {
  flex: 1;
  padding: 0;
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
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  justify-items: center;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  min-width: 0;
  justify-content: center;
}

.status-icon {
  font-size: 1.2rem;
  flex-shrink: 0;
}

.status-info {
  text-align: center;
  min-width: 0;
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
  word-wrap: break-word;
  hyphens: auto;
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

.btn-spinner {
  display: inline-block;
  width: 12px;
  height: 12px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  margin-right: 0.5rem;
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

/* Ensure header button stays on the right */
.base-card .ct-card-header .ct-card-actions {
  order: 2; /* Force to the right */
}

.base-card .ct-card-header .header-content {
  order: 1; /* Force to the left */
}

/* Header Layout */
.header-content {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  min-width: 0; /* Prevents flex item from overflowing */
  flex: 1;
}

.large-icon {
  width: 60px;
  height: 60px;
  background: var(--color-background-secondary);
  border-radius: var(--border-radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  flex-shrink: 0;
  border: 1px solid var(--color-border-light);
}

.title-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0;
}

.ct-card-title {
  margin: 0;
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  line-height: var(--line-height-tight);
}

.total-count {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  font-weight: var(--font-weight-normal);
}

.total-count.loading-placeholder {
  color: var(--color-text-tertiary, #999);
  opacity: 0.7;
}

.table-content {
  padding: 0;
  flex: 1;
}

.stats-table {
  width: 100%;
  border-collapse: collapse;
}

.stats-table th {
  text-align: left;
  padding: var(--spacing-xs) var(--spacing-sm);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
  background: var(--color-background);
  border-bottom: 1px solid var(--color-border);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  height: 32px;
}

.col-icon {
  width: 40px;
}

.col-category {
  width: auto;
}

.table-row {
  transition: var(--transition-fast);
}

.table-row:hover {
  background: var(--color-background);
}

.icon-cell {
  padding: var(--spacing-xs) var(--spacing-sm);
  width: 40px;
}

.category-cell {
  padding: var(--spacing-xs) var(--spacing-sm);
}

.status-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-sm);
}

.category-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.category-count {
  font-weight: var(--font-weight-bold);
  min-width: 40px;
  text-align: right;
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
}

.category-name {
  flex: 1;
  color: var(--color-text-primary);
  font-size: var(--font-size-xs);
}

/* Status Badge Colors */
.status-error {
  background-color: rgba(220, 53, 69, 0.1);
  color: #dc3545;
  border: 1px solid rgba(220, 53, 69, 0.2);
}

.status-warning {
  background-color: rgba(243, 156, 18, 0.1);
  color: #f39c12;
  border: 1px solid rgba(243, 156, 18, 0.2);
}

.status-info {
  background-color: rgba(52, 152, 219, 0.1);
  color: #3498db;
  border: 1px solid rgba(52, 152, 219, 0.2);
}

.status-success {
  background-color: rgba(40, 167, 69, 0.1);
  color: #28a745;
  border: 1px solid rgba(40, 167, 69, 0.2);
}

.status-neutral {
  background-color: rgba(108, 117, 125, 0.1);
  color: #6c757d;
  border: 1px solid rgba(108, 117, 125, 0.2);
}

/* Compact Footer */
.ct-card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-xs) var(--spacing-sm);
  border-top: 1px solid var(--color-border);
  background: var(--color-background);
  min-height: 40px;
}

.ct-card-footer .last-update {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}

.footer-actions {
  display: flex;
  gap: var(--spacing-sm);
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
    grid-template-columns: 1fr;
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

  .table-layout .header-left {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-xs);
  }

  .compact-footer {
    flex-direction: column;
    gap: var(--spacing-sm);
    align-items: flex-start;
  }

  .footer-actions {
    align-self: flex-end;
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
