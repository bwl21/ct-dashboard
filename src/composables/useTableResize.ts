import { ref, onUnmounted } from 'vue'

export function useTableResize(initialWidths: number[]) {
  const columnWidths = ref([...initialWidths])
  const isResizing = ref(false)
  const resizingColumn = ref(-1)
  const startX = ref(0)
  const startWidth = ref(0)

  const startResize = (event: MouseEvent, columnIndex: number) => {
    event.preventDefault()
    event.stopPropagation()

    isResizing.value = true
    resizingColumn.value = columnIndex
    startX.value = event.clientX
    startWidth.value = columnWidths.value[columnIndex]

    document.addEventListener('mousemove', handleResize)
    document.addEventListener('mouseup', stopResize)
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }

  const handleResize = (event: MouseEvent) => {
    if (!isResizing.value || resizingColumn.value === -1) return

    const deltaX = event.clientX - startX.value
    const newWidth = Math.max(80, startWidth.value + deltaX) // Minimum width of 80px

    const newWidths = [...columnWidths.value]
    newWidths[resizingColumn.value] = newWidth
    columnWidths.value = newWidths
  }

  const stopResize = () => {
    isResizing.value = false
    resizingColumn.value = -1

    document.removeEventListener('mousemove', handleResize)
    document.removeEventListener('mouseup', stopResize)
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
  }

  // Cleanup on unmount
  onUnmounted(() => {
    if (isResizing.value) {
      stopResize()
    }
  })

  return {
    columnWidths,
    startResize,
    handleResize,
    stopResize,
    isResizing
  }
}