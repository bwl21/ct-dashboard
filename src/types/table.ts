export interface TableColumn {
  key: string
  label: string
  sortable?: boolean
  resizable?: boolean
  width?: number
  cellSlot?: string // Name des Slots für Custom Rendering
}

export interface AdminTableProps {
  // Data
  data: any[]
  loading: boolean
  error: string | null
  
  // Table Configuration  
  columns: TableColumn[]
  rowKey: string
  
  // Header
  title: string
  description?: string
  
  // Search & Filtering
  searchable?: boolean
  searchPlaceholder?: string
  searchFields?: string[]
  
  // Sorting
  defaultSortField?: string
  defaultSortDirection?: 'asc' | 'desc'
  
  // Text customization
  loadingText?: string
  retryText?: string
  reloadText?: string
  emptyText?: string
}

export type SortDirection = 'asc' | 'desc'