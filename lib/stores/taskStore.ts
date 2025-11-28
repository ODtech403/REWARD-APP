import { create } from 'zustand'
import type { Task, Category } from '@/lib/types'

interface TaskState {
  tasks: Task[]
  categories: Category[]
  selectedCategory: string | null
  isLoading: boolean
  error: string | null

  // Actions
  setTasks: (tasks: Task[]) => void
  setCategories: (categories: Category[]) => void
  setSelectedCategory: (categoryId: string | null) => void
  updateTask: (taskId: string, updates: Partial<Task>) => void
  removeTask: (taskId: string) => void
  addTask: (task: Task) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  
  // Selectors
  getAvailableTasks: () => Task[]
  getFilteredTasks: () => Task[]
  getTaskById: (taskId: string) => Task | undefined
}

export const useTaskStore = create<TaskState>()((set, get) => ({
  tasks: [],
  categories: [],
  selectedCategory: null,
  isLoading: true,
  error: null,

  setTasks: (tasks) => set({ tasks, isLoading: false }),

  setCategories: (categories) => set({ categories }),

  setSelectedCategory: (categoryId) => set({ selectedCategory: categoryId }),

  updateTask: (taskId, updates) => set((state) => ({
    tasks: state.tasks.map((task) =>
      task.id === taskId ? { ...task, ...updates } : task
    ),
  })),

  removeTask: (taskId) => set((state) => ({
    tasks: state.tasks.filter((task) => task.id !== taskId),
  })),

  addTask: (task) => set((state) => {
    // Avoid duplicates
    if (state.tasks.some((t) => t.id === task.id)) {
      return state
    }
    return { tasks: [...state.tasks, task] }
  }),

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error, isLoading: false }),

  getAvailableTasks: () => {
    const { tasks } = get()
    const now = new Date()
    
    return tasks.filter((task) => {
      // Task must be active
      if (task.status !== 'active') return false
      
      // Task must have budget remaining
      const remainingBudget = task.total_budget - task.spent_amount
      if (remainingBudget < task.cost_per_action) return false
      
      // Task must not be expired
      if (task.expires_at && new Date(task.expires_at) < now) return false
      
      // Check cooldown
      if (task.userCooldownEndsAt && new Date(task.userCooldownEndsAt) > now) {
        return false
      }
      
      return true
    })
  },

  getFilteredTasks: () => {
    const { tasks, selectedCategory } = get()
    
    if (!selectedCategory) return tasks
    
    return tasks.filter((task) => task.category_id === selectedCategory)
  },

  getTaskById: (taskId) => {
    return get().tasks.find((task) => task.id === taskId)
  },
}))
