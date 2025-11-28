'use client'

import { useMemo } from 'react'
import { clsx } from 'clsx'
import type { Task } from '@/lib/types'
import { TaskCard } from './TaskCard'
import { useUserStore } from '@/lib/stores/userStore'

interface TaskGridProps {
  tasks: Task[]
  selectedCategory: string | null
  onTaskSelect: (taskId: string) => void
}

export function TaskGrid({ tasks, selectedCategory, onTaskSelect }: TaskGridProps) {
  const { getCooldownEndTime, isTaskOnCooldown } = useUserStore()

  // Filter tasks by selected category and sort: active first (by budget), then expired at bottom
  const filteredTasks = useMemo(() => {
    let filtered = tasks
    if (selectedCategory) {
      filtered = tasks.filter((task) => task.category_id === selectedCategory)
    }
    
    const now = new Date()
    
    // Sort: active campaigns by budget (descending), expired/depleted at bottom
    return [...filtered].sort((a, b) => {
      const aExpired = a.expires_at && new Date(a.expires_at) < now
      const bExpired = b.expires_at && new Date(b.expires_at) < now
      const aDepleted = a.status === 'depleted' || a.status === 'paused'
      const bDepleted = b.status === 'depleted' || b.status === 'paused'
      
      // Expired/depleted campaigns go to bottom
      if ((aExpired || aDepleted) && !(bExpired || bDepleted)) return 1
      if (!(aExpired || aDepleted) && (bExpired || bDepleted)) return -1
      
      // Both active or both expired: sort by budget descending
      return b.total_budget - a.total_budget
    })
  }, [tasks, selectedCategory])

  // Determine task availability
  const getTaskAvailability = (task: Task): boolean => {
    // Task must be active
    if (task.status !== 'active') return false

    // Task must have budget remaining
    const remainingBudget = task.total_budget - task.spent_amount
    if (remainingBudget < task.cost_per_action) return false

    // Task must not be expired
    if (task.expires_at && new Date(task.expires_at) < new Date()) return false

    // Check cooldown
    if (isTaskOnCooldown(task.id)) return false

    return true
  }

  if (filteredTasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <p className="text-gray-400 text-center">
          {selectedCategory
            ? 'No tasks available in this category'
            : 'No tasks available right now'}
        </p>
        <p className="text-gray-500 text-sm mt-2">Check back soon for new opportunities!</p>
      </div>
    )
  }

  return (
    <div
      className={clsx(
        'grid grid-cols-2 gap-3 p-4',
        // Responsive: 3 columns on larger screens
        'md:grid-cols-3'
      )}
    >
      {filteredTasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          cooldownEnd={getCooldownEndTime(task.id)}
          onSelect={onTaskSelect}
          isAvailable={getTaskAvailability(task)}
        />
      ))}
    </div>
  )
}
