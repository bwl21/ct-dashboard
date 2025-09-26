import { useQuery } from '@tanstack/vue-query'
import { churchtoolsClient } from '@churchtools/churchtools-client'

export interface AutomaticGroup {
  id: number
  name: string
  groupTypeId?: string
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
  let allGroups: any[] = []
  let page = 1
  const limit = 100
  let hasMore = true

  // Fetch all groups with proper pagination
  while (hasMore) {
    const response = await churchtoolsClient.get(
      `/groups?include=settings&limit=${limit}&page=${page}`
    )

    let pageGroups: any[] = []
    if (Array.isArray(response)) {
      pageGroups = response
    } else if (response && (response as any).data && Array.isArray((response as any).data)) {
      pageGroups = (response as any).data
    } else if (response && Array.isArray((response as any).groups)) {
      pageGroups = (response as any).groups
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
    .map((group) => ({
      id: group.id,
      name: group.name || `Gruppe ${group.id}`,
      groupTypeId: group.groupTypeId || group.groupType?.name || 'N/A',
      dynamicGroupStatus: group.settings?.dynamicGroupStatus || 'none',
      lastExecution: group.settings?.dynamicGroupUpdateFinished || null,
      executionStatus: determineExecutionStatus(group),
      dynamicGroupUpdateStarted: group.settings?.dynamicGroupUpdateStarted || null,
      dynamicGroupUpdateFinished: group.settings?.dynamicGroupUpdateFinished || null,
    }))

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
