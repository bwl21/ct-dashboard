import { useQuery } from '@tanstack/vue-query'
import { churchtoolsClient } from '@churchtools/churchtools-client'

export interface AutomaticGroup {
  id: number
  name: string
  groupTypeId: number
  groupTypeName: string
  dynamicGroupStatus: string
  lastExecution: string | null
  executionStatus: 'success' | 'error' | 'running' | 'pending' | 'unknown'
  dynamicGroupUpdateStarted: string | null
  dynamicGroupUpdateFinished: string | null
}

function determineExecutionStatus(group: any): AutomaticGroup['executionStatus'] {
  const started = group.settings?.dynamicGroupUpdateStarted
  const finished = group.settings?.dynamicGroupUpdateFinished

  if (!started && !finished) return 'pending'
  if (started && !finished) return 'running'
  if (started && finished) {
    const startedDate = new Date(started)
    const finishedDate = new Date(finished)
    if (startedDate > finishedDate) return 'running'
    return 'success'
  }

  return 'unknown'
}

async function fetchAutomaticGroups(): Promise<AutomaticGroup[]> {
  // First, fetch all group types to create a mapping
  let groupTypeMap = new Map<number, string>()

  try {
    const groupTypesResponse = await churchtoolsClient.get('/group/grouptypes')

    // Handle different response structures
    let groupTypes: any[] = []
    if (
      groupTypesResponse &&
      (groupTypesResponse as any).data &&
      Array.isArray((groupTypesResponse as any).data)
    ) {
      groupTypes = (groupTypesResponse as any).data
    } else if (Array.isArray(groupTypesResponse)) {
      groupTypes = groupTypesResponse
    } else {
      console.warn('Unexpected group types response structure:', groupTypesResponse)
    }

    groupTypes.forEach((groupType: any) => {
      if (groupType.id && groupType.name) {
        groupTypeMap.set(groupType.id, groupType.name)
      }
    })
  } catch (error) {
    console.warn('Failed to fetch group types:', error)
    // Continue without group type mapping
  }

  let allGroups: any[] = []
  let page = 1
  const limit = 100
  let hasMore = true

  // Fetch all groups with proper pagination
  while (hasMore) {
    const response = await churchtoolsClient.get(
      `/groups?include=settings,domainAttributes&limit=${limit}&page=${page}`
    )

    let pageGroups: any[] = []
    if (response && (response as any).data && Array.isArray((response as any).data)) {
      pageGroups = (response as any).data
    } else if (Array.isArray(response)) {
      pageGroups = response
    } else {
      console.warn('Unexpected groups response structure:', response)
    }

    if (pageGroups.length === 0) {
      hasMore = false
    } else {
      allGroups = allGroups.concat(pageGroups)
      if (pageGroups.length < limit) {
        hasMore = false
      } else {
        page++
        if (page > 100) break // Safety limit
      }
    }
  }

  // Filter for automatic groups
  const automaticGroups = allGroups
    .filter(
      (group) =>
        group.settings?.dynamicGroupStatus &&
        group.settings.dynamicGroupStatus !== 'none' &&
        group.settings.dynamicGroupStatus !== null
    )
    .map((group) => {
      // Try different possible locations for groupTypeId
      const groupTypeId =
        group.information?.groupTypeId ||
        group.domainAttributes?.groupTypeId ||
        group.groupTypeId ||
        0

      const groupTypeName = groupTypeMap.get(groupTypeId) || 'Unbekannter Typ'

      return {
        id: group.id,
        name: group.name || `Gruppe ${group.id}`,
        groupTypeId,
        groupTypeName,
        dynamicGroupStatus: group.settings?.dynamicGroupStatus || 'none',
        lastExecution: group.settings?.dynamicGroupUpdateFinished || null,
        executionStatus: determineExecutionStatus(group),
        dynamicGroupUpdateStarted: group.settings?.dynamicGroupUpdateStarted || null,
        dynamicGroupUpdateFinished: group.settings?.dynamicGroupUpdateFinished || null,
      }
    })

  return automaticGroups
}

export function useAutomaticGroups() {
  return useQuery({
    queryKey: ['automatic-groups'],
    queryFn: fetchAutomaticGroups,
    staleTime: 10 * 60 * 1000, // 10 minutes - group status changes moderately
    gcTime: 30 * 60 * 1000, // 30 minutes cache time
    refetchInterval: 5 * 60 * 1000, // Background update every 5 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })
}

export function useAutomaticGroupsStats(groups: AutomaticGroup[]) {
  const successfulGroups = groups.filter((group) => group.executionStatus === 'success').length
  const errorGroups = groups.filter((group) => group.executionStatus === 'error').length
  const pendingGroups = groups.filter(
    (group) =>
      group.executionStatus === 'pending' ||
      group.executionStatus === 'running' ||
      group.executionStatus === 'unknown'
  ).length

  return {
    total: groups.length,
    successful: successfulGroups,
    error: errorGroups,
    pending: pendingGroups,
  }
}
