import { ref, computed, type Ref } from 'vue'
import type { SortDirection } from '@/types/table'

export function useTableSorting(
  data: Ref<any[]>, 
  defaultField?: string, 
  defaultDirection: SortDirection = 'asc'
) {
  const sortField = ref(defaultField || '')
  const sortDirection = ref<SortDirection>(defaultDirection)
  
  const sortBy = (field: string) => {
    if (sortField.value === field) {
      sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
    } else {
      sortField.value = field
      sortDirection.value = 'asc'
    }
  }
  
  const sortedData = computed(() => {
    if (!sortField.value || !data.value) {
      return data.value || []
    }
    
    const sorted = [...data.value].sort((a, b) => {
      const aValue = getNestedValue(a, sortField.value)
      const bValue = getNestedValue(b, sortField.value)
      
      // Handle null/undefined values
      if (aValue == null && bValue == null) return 0
      if (aValue == null) return 1
      if (bValue == null) return -1
      
      // Handle different data types
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return aValue.localeCompare(bValue, 'de', { numeric: true })
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return aValue - bValue
      }
      
      // Handle dates
      if (aValue instanceof Date && bValue instanceof Date) {
        return aValue.getTime() - bValue.getTime()
      }
      
      // Handle date strings
      if (isDateString(aValue) && isDateString(bValue)) {
        return new Date(aValue).getTime() - new Date(bValue).getTime()
      }
      
      // Fallback to string comparison
      return String(aValue).localeCompare(String(bValue), 'de', { numeric: true })
    })
    
    return sortDirection.value === 'desc' ? sorted.reverse() : sorted
  })
  
  return {
    sortField,
    sortDirection,
    sortBy,
    sortedData
  }
}

// Helper function to get nested object values (e.g., 'base.calendar.name')
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj)
}

// Helper function to check if a string is a date
function isDateString(value: any): boolean {
  if (typeof value !== 'string') return false
  const date = new Date(value)
  return !isNaN(date.getTime()) && Boolean(value.match(/^\d{4}-\d{2}-\d{2}/))
}