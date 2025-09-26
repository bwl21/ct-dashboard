import { useQuery } from '@tanstack/vue-query'
import { churchtoolsClient } from '@churchtools/churchtools-client'

// Tag interface based on ChurchTools API
export interface Tag {
  id: number
  name: string
  description?: string
  color?: string
  domainType: 'person' | 'song' | 'group'
}

type TagsApiResponse = Tag[]

async function fetchTags(): Promise<Tag[]> {
  const startTime = performance.now()
  console.log('🏷️ Fetching tags...')
  // Fetch tags from different domains using modern API endpoints
  const [personTags, songTags, groupTags] = await Promise.allSettled([
    churchtoolsClient.get<TagsApiResponse>('/tags/person').catch(() => []),
    churchtoolsClient.get<TagsApiResponse>('/tags/song').catch(() => []),
    churchtoolsClient.get<TagsApiResponse>('/tags/group').catch(() => []),
  ])

  const allTags: Tag[] = []

  // Process person tags
  if (personTags.status === 'fulfilled' && personTags.value) {
    const personTagsData = Array.isArray(personTags.value) ? personTags.value : []
    allTags.push(...personTagsData.map((tag: any) => ({ ...tag, domainType: 'person' as const })))
  }

  // Process song tags
  if (songTags.status === 'fulfilled' && songTags.value) {
    const songTagsData = Array.isArray(songTags.value) ? songTags.value : []
    allTags.push(...songTagsData.map((tag: any) => ({ ...tag, domainType: 'song' as const })))
  }

  // Process group tags
  if (groupTags.status === 'fulfilled' && groupTags.value) {
    const groupTagsData = Array.isArray(groupTags.value) ? groupTags.value : []
    allTags.push(...groupTagsData.map((tag: any) => ({ ...tag, domainType: 'group' as const })))
  }

  const endTime = performance.now()
  console.log(`🏷️ Tags fetched: ${allTags.length} tags in ${Math.round(endTime - startTime)}ms`)
  return allTags
}

export function useTags() {
  return useQuery({
    queryKey: ['tags'],
    queryFn: fetchTags,
    staleTime: 60 * 60 * 1000, // 1 hour - tags change rarely
    gcTime: 24 * 60 * 60 * 1000, // 24 hours cache time
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })
}

export function useTagsStats(tags: Tag[]) {
  const personTagsCount = tags.filter((tag) => tag.domainType === 'person').length
  const songTagsCount = tags.filter((tag) => tag.domainType === 'song').length
  const groupTagsCount = tags.filter((tag) => tag.domainType === 'group').length

  return {
    total: tags.length,
    person: personTagsCount,
    song: songTagsCount,
    group: groupTagsCount,
  }
}
