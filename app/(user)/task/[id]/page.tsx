'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { createBrowserClient } from '@supabase/ssr'
import { ArrowLeft, Clock, Star, Coins, Play, Lock, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { CooldownTimer } from '@/components/user/CooldownTimer'
import { RewardAnimation, useRewardAnimation } from '@/components/user/RewardAnimation'
import { ConfettiCelebration, useConfetti } from '@/components/user/ConfettiCelebration'
import { PlayCelebration, usePlayCelebration } from '@/components/user/PlayCelebration'
import { useUserStore } from '@/lib/stores/userStore'
import { useTaskStore } from '@/lib/stores/taskStore'
import type { Task } from '@/lib/types'
import type { Database } from '@/lib/types/database'

type CampaignRow = Database['public']['Tables']['campaigns']['Row']
type TaskCompletionRow = Database['public']['Tables']['task_completions']['Row']

export default function TaskDetailPage() {
  const router = useRouter()
  const params = useParams()
  const taskId = params.id as string

  const [task, setTask] = useState<Task | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCompleting, setIsCompleting] = useState(false)
  const [taskStartTime, setTaskStartTime] = useState<Date | null>(null)
  const [cooldownEndsAt, setCooldownEndsAt] = useState<Date | null>(null)

  const startButtonRef = useRef<HTMLButtonElement>(null)
  const walletRef = useRef<HTMLDivElement>(null)

  const { setCooldown, updateBalance } = useUserStore()
  const { updateTask } = useTaskStore()
  const { animationState, triggerAnimation } = useRewardAnimation()
  const { isActive: isConfettiActive, triggerConfetti, onComplete: onConfettiComplete } = useConfetti()
  const { isActive: isPlayCelebrationActive, triggerCelebration: triggerPlayCelebration, onComplete: onPlayCelebrationComplete } = usePlayCelebration()

  useEffect(() => {
    const supabase = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    async function loadTask() {
      try {
        setIsLoading(true)
        setError(null)

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
          router.push('/login')
          return
        }

        const { data: campaignData, error: campaignError } = await supabase
          .from('campaigns')
          .select(`*, category:categories(*)`)
          .eq('id', taskId)
          .single()

        if (campaignError || !campaignData) {
          setError('Task not found')
          return
        }

        const campaign = campaignData as CampaignRow & { category?: Database['public']['Tables']['categories']['Row'] }

        const { data: completionData } = await supabase
          .from('task_completions')
          .select('cooldown_ends_at')
          .eq('user_id', user.id)
          .eq('campaign_id', taskId)
          .gt('cooldown_ends_at', new Date().toISOString())
          .order('completed_at', { ascending: false })
          .limit(1)
          .single()

        const completion = completionData as Pick<TaskCompletionRow, 'cooldown_ends_at'> | null
        const cooldownEnd = completion ? new Date(completion.cooldown_ends_at) : null
        setCooldownEndsAt(cooldownEnd)

        if (cooldownEnd) {
          setCooldown(taskId, cooldownEnd)
        }

        const taskData: Task = {
          ...campaign,
          userCooldownEndsAt: cooldownEnd,
          isAvailable: !cooldownEnd && campaign.status === 'active',
          userRating: 4.5,
          category: campaign.category,
        }

        setTask(taskData)
      } catch (err) {
        console.error('Failed to load task:', err)
        setError('Failed to load task')
      } finally {
        setIsLoading(false)
      }
    }

    loadTask()
  }, [taskId, router, setCooldown])

  const handleStartTask = () => {
    // Trigger the exciting celebration animation
    triggerPlayCelebration()
    setTaskStartTime(new Date())
    
    // Open the promotion URL in a new tab after a short delay
    const promotionUrl = task?.promotion_url
    if (promotionUrl) {
      setTimeout(() => {
        window.open(promotionUrl, '_blank', 'noopener,noreferrer')
      }, 1500) // Delay to let user see the celebration
    }
  }


  const handleCompleteTask = async () => {
    if (!task || !taskStartTime) return

    const timeSpent = (new Date().getTime() - taskStartTime.getTime()) / 1000
    const minTimeRequired = Math.min(task.estimated_duration_minutes * 60, 5)

    if (timeSpent < minTimeRequired) {
      setError(`Please spend at least ${minTimeRequired} seconds on this task`)
      return
    }

    setIsCompleting(true)
    setError(null)

    try {
      const response = await fetch('/api/tasks/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: task.id,
          timeSpent: Math.floor(timeSpent),
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to complete task')
      }

      const rewardAmount = task.cost_per_action * 0.75
      triggerAnimation(rewardAmount, startButtonRef.current, walletRef.current)
      triggerConfetti()

      updateBalance(result.newBalance)
      const newCooldownEnd = new Date(result.cooldownEndsAt)
      setCooldown(task.id, newCooldownEnd)
      setCooldownEndsAt(newCooldownEnd)
      updateTask(task.id, {
        userCooldownEndsAt: newCooldownEnd,
        isAvailable: false,
      })

      setTaskStartTime(null)

      setTimeout(() => {
        router.push('/dashboard')
      }, 2500)
    } catch (err) {
      console.error('Task completion error:', err)
      setError(err instanceof Error ? err.message : 'Failed to complete task')
    } finally {
      setIsCompleting(false)
    }
  }

  const handleCooldownExpire = () => {
    setCooldownEndsAt(null)
    if (task) {
      updateTask(task.id, { userCooldownEndsAt: null, isAvailable: true })
    }
  }

  const isOnCooldown = cooldownEndsAt && cooldownEndsAt > new Date()
  const rewardAmount = task ? task.cost_per_action * 0.75 : 0

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading task...</div>
      </div>
    )
  }

  if (error && !task) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-400 mb-4">{error}</p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    )
  }

  if (!task) return null


  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-20">
      <RewardAnimation {...animationState} />
      <ConfettiCelebration isActive={isConfettiActive} onComplete={onConfettiComplete} />
      <PlayCelebration isActive={isPlayCelebrationActive} onComplete={onPlayCelebrationComplete} />

      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#0a0a0a]/90 backdrop-blur-lg border-b border-white/10">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <div ref={walletRef} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30">
            <Coins className="w-4 h-4 text-yellow-400" />
            <span className="text-yellow-400 font-semibold">${rewardAmount.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Task Hero */}
      <div
        className="relative h-48 overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${task.gradient_start} 0%, ${task.gradient_end} 100%)`,
        }}
      >
        <div className="absolute inset-0 bg-black/30" />
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h1 className="text-2xl font-bold text-white drop-shadow-lg">{task.title}</h1>
          <div className="flex items-center gap-4 mt-2 text-white/80">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span className="text-sm">{task.estimated_duration_minutes} min</span>
            </div>
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm">{task.userRating.toFixed(1)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-sm"
          >
            {error}
          </motion.div>
        )}

        {isOnCooldown && cooldownEndsAt && (
          <Card className="p-4 bg-gray-800/50 border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-purple-500/20">
                <Lock className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-white font-medium">Task on Cooldown</p>
                <p className="text-gray-400 text-sm">Available again in:</p>
                <CooldownTimer endTime={cooldownEndsAt} onExpire={handleCooldownExpire} />
              </div>
            </div>
          </Card>
        )}

        <Card className="p-4 bg-gray-800/50 border-gray-700">
          <h2 className="text-lg font-semibold text-white mb-2">Description</h2>
          <p className="text-gray-300">{task.description || 'Complete this task to earn rewards!'}</p>
        </Card>

        <Card className="p-4 bg-gray-800/50 border-gray-700">
          <h2 className="text-lg font-semibold text-white mb-2">Instructions</h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-300">
            <li>Read through the task requirements carefully</li>
            <li>Click &quot;Play&quot; to open the promotion link</li>
            <li>Complete the required actions on the website/app</li>
            <li>Return here and click &quot;Complete Task&quot; to claim your reward</li>
          </ol>
        </Card>

        {/* Promotion Link Info */}
        {task.promotion_url && (
          <Card className="p-4 bg-blue-500/10 border-blue-500/30">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-blue-500/20">
                <Play className="w-5 h-5 text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium">Promotion Link</p>
                <p className="text-blue-400 text-sm truncate">{task.promotion_url}</p>
              </div>
            </div>
          </Card>
        )}

        <Card className="p-4 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Reward</p>
              <p className="text-2xl font-bold text-yellow-400">${rewardAmount.toFixed(2)}</p>
            </div>
            <div className="text-right">
              <p className="text-gray-400 text-sm">Duration</p>
              <p className="text-white font-medium">{task.estimated_duration_minutes} minutes</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Action Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#0a0a0a]/90 backdrop-blur-lg border-t border-white/10">
        {isOnCooldown ? (
          <Button disabled className="w-full py-4 opacity-50">
            <Lock className="w-5 h-5 mr-2" />
            On Cooldown
          </Button>
        ) : !taskStartTime ? (
          <Button
            ref={startButtonRef}
            onClick={handleStartTask}
            className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
          >
            <Play className="w-5 h-5 mr-2 fill-white" />
            Play Now
          </Button>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Button
              ref={startButtonRef}
              onClick={handleCompleteTask}
              disabled={isCompleting}
              className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
            >
              {isCompleting ? (
                <>
                  <div className="w-5 h-5 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Completing...
                </>
              ) : (
                <>
                  <Coins className="w-5 h-5 mr-2" />
                  Complete Task - Earn ${rewardAmount.toFixed(2)}
                </>
              )}
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  )
}
