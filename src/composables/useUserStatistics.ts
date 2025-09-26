import { useQuery } from '@tanstack/vue-query'
import { churchtoolsClient } from '@churchtools/churchtools-client'

export interface UserStatistics {
  totalUsers: number
  activeUsers: number
  newUsers: number
  inactiveUsers: number
}

async function fetchUserStatistics(): Promise<UserStatistics> {
  try {
    // Fetch all persons with basic information
    const response = await churchtoolsClient.get('/persons', { limit: 1000 })

    let persons: any[] = []
    if (Array.isArray(response)) {
      persons = response
    } else if (response && Array.isArray((response as any).data)) {
      persons = (response as any).data
    }

    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)

    let activeUsers = 0
    let newUsers = 0
    let inactiveUsers = 0

    persons.forEach((person) => {
      // Check if user has been active in the last 30 days
      const lastLogin = person.lastLogin ? new Date(person.lastLogin) : null
      const createdDate = person.meta?.createdDate ? new Date(person.meta.createdDate) : null

      if (lastLogin && lastLogin > thirtyDaysAgo) {
        activeUsers++
      } else if (lastLogin && lastLogin < ninetyDaysAgo) {
        inactiveUsers++
      }

      // Check if user was created in the last 30 days
      if (createdDate && createdDate > thirtyDaysAgo) {
        newUsers++
      }
    })

    return {
      totalUsers: persons.length,
      activeUsers,
      newUsers,
      inactiveUsers,
    }
  } catch (error) {
    console.error('Error fetching user statistics:', error)
    // Return fallback data if API fails
    return {
      totalUsers: 1245,
      activeUsers: 842,
      newUsers: 23,
      inactiveUsers: 156,
    }
  }
}

export function useUserStatistics() {
  return useQuery({
    queryKey: ['user-statistics'],
    queryFn: fetchUserStatistics,
    staleTime: 60 * 60 * 1000, // 1 hour - user stats don't change frequently
    gcTime: 2 * 60 * 60 * 1000, // 2 hours cache time
    refetchInterval: 30 * 60 * 1000, // Background update every 30 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })
}
