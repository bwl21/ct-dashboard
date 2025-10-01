import { ref, computed } from 'vue'
import { churchtoolsClient } from '@churchtools/churchtools-client'

export interface Tag {
  id: number
  name: string
  domainType: string
  color?: string
  description?: string
}

export function useTags() {
  const tags = ref<Tag[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const selectedDomain = ref('')

  // Computed properties
  const personTagsCount = computed(
    () => tags.value.filter((tag) => tag.domainType === 'person').length
  )

  const songTagsCount = computed(() => tags.value.filter((tag) => tag.domainType === 'song').length)

  const groupTagsCount = computed(
    () => tags.value.filter((tag) => tag.domainType === 'group').length
  )

  const appointmentTagsCount = computed(
    () => tags.value.filter((tag) => tag.domainType === 'appointment').length
  )

  // Note: Domain filtering is now handled at API level in fetchTags
  // No need for client-side domain filtering since we only load the selected domain

  // API functions
  const fetchTags = async () => {
    loading.value = true
    error.value = null

    try {
      const domains = selectedDomain.value
        ? [selectedDomain.value]
        : ['person', 'song', 'group', 'appointment']

      const tagPromises = domains.map(async (domain) => {
        try {
          const response = await churchtoolsClient.get(`/tags/${domain}`)
          const tagData = Array.isArray(response) ? response : []
          return tagData.map((tag: any) => ({ ...tag, domainType: domain }))
        } catch (err) {
          console.warn(`Failed to fetch ${domain} tags:`, err)
          return []
        }
      })

      const results = await Promise.all(tagPromises)
      tags.value = results.flat()
    } catch (err: any) {
      error.value = err.message || 'Fehler beim Laden der Tags'
      console.error('Error fetching tags:', err)
    } finally {
      loading.value = false
    }
  }

  const createTag = async (tagData: Partial<Tag> & { domainType: string }) => {
    try {
      const payload = {
        name: tagData.name?.trim(),
        description: tagData.description?.trim() || '',
        color: tagData.color || 'basic',
      }
      const response = await churchtoolsClient.post(`/tags/${tagData.domainType}`, payload)
      await fetchTags() // Refresh the list
      return response
    } catch (err: any) {
      console.error('Error creating tag:', err)
      throw new Error('Fehler beim Erstellen des Tags')
    }
  }

  const updateTag = async (tagId: number, tagData: Partial<Tag>) => {
    try {
      const payload = {
        name: tagData.name?.trim(),
        description: tagData.description?.trim() || '',
        color: tagData.color || 'basic',
      }
      const response = await churchtoolsClient.put(`/tags/${tagId}`, payload)
      await fetchTags() // Refresh the list
      return response
    } catch (err: any) {
      console.error('Error updating tag:', err)
      throw new Error('Fehler beim Aktualisieren des Tags')
    }
  }

  const deleteTag = async (tagId: number) => {
    try {
      // Use the correct deleteApi method from ChurchTools client
      await (churchtoolsClient as any).deleteApi(`/tags/${tagId}`)
      await fetchTags() // Refresh the list
    } catch (err: any) {
      console.error('Error deleting tag:', err)
      throw new Error('Fehler beim Löschen des Tags')
    }
  }

  const bulkUpdateTags = async (tagIds: number[], updates: Partial<Tag>) => {
    let successCount = 0
    let errorCount = 0

    for (const tagId of tagIds) {
      try {
        const tag = tags.value.find((t) => t.id === tagId)
        if (!tag) continue

        const tagData = {
          name: tag.name,
          description: tag.description || '',
          color: updates.color || tag.color || 'basic',
        }

        await churchtoolsClient.put(`/tags/${tagId}`, tagData)
        successCount++

        // Update local tag data
        if (updates.color) {
          tag.color = updates.color
        }
      } catch (err) {
        console.error(`Failed to update tag ${tagId}:`, err)
        errorCount++
      }
    }

    if (errorCount > 0) {
      throw new Error(`${errorCount} Tags konnten nicht aktualisiert werden`)
    }
  }

  const bulkDeleteTags = async (tagIds: number[]) => {
    let successCount = 0
    let errorCount = 0

    for (const tagId of tagIds) {
      try {
        // Use the correct deleteApi method from ChurchTools client
        await (churchtoolsClient as any).deleteApi(`/tags/${tagId}`)
        successCount++
      } catch (err) {
        console.error(`Failed to delete tag ${tagId}:`, err)
        errorCount++
      }
    }

    await fetchTags() // Refresh the list

    if (errorCount > 0) {
      throw new Error(`${errorCount} Tags konnten nicht gelöscht werden`)
    }
  }

  return {
    tags,
    loading,
    error,
    selectedDomain,
    personTagsCount,
    songTagsCount,
    groupTagsCount,
    appointmentTagsCount,

    fetchTags,
    createTag,
    updateTag,
    deleteTag,
    bulkUpdateTags,
    bulkDeleteTags,
  }
}
