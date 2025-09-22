import { ref, computed, type Ref } from 'vue'

export function useTableSearch(data: Ref<any[]>, searchFields: string[]) {
  const searchTerm = ref('')
  
  const filteredData = computed(() => {
    if (!searchTerm.value.trim() || !data.value) {
      return data.value || []
    }
    
    const term = searchTerm.value.toLowerCase().trim()
    
    return data.value.filter(item => {
      // If no specific search fields provided, search all string properties
      const fieldsToSearch = searchFields.length > 0 
        ? searchFields 
        : Object.keys(item).filter(key => typeof item[key] === 'string')
      
      return fieldsToSearch.some(field => {
        const value = getNestedValue(item, field)
        if (value == null) return false
        
        // Convert to string and search
        const stringValue = String(value).toLowerCase()
        return stringValue.includes(term)
      })
    })
  })
  
  const clearSearch = () => {
    searchTerm.value = ''
  }
  
  return {
    searchTerm,
    filteredData,
    clearSearch
  }
}

// Helper function to get nested object values (e.g., 'base.calendar.name')
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj)
}