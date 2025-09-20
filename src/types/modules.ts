import type { Component } from 'vue'

export interface DashboardModule {
  id: string
  title: string
  icon: string
  description: string
  cardComponent: Component
  adminComponent: Component
}
