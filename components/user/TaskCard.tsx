'use client'

import { motion } from 'framer-motion'
import { Star, Lock } from 'lucide-react'
import { clsx } from 'clsx'
import type { Task } from '@/lib/types'
import { CooldownTimer } from './CooldownTimer'

interface TaskCardProps {
  task: Task
  cooldownEnd: Date | null
  onSelect: (taskId: string) => void
  isAvailable: boolean
}

export function TaskCard({ task, cooldownEnd, onSelect, isAvailable }: TaskCardProps) {
  // Calculate user reward (75% of CPA)
  const userReward = task.cost_per_action * 0.75

  // Determine if task is on cooldown
  const isOnCooldown = cooldownEnd !== null && cooldownEnd > new Date()

  const handleClick = () => {
    if (isAvailable && !isOnCooldown) {
      onSelect(task.id)
    }
  }

  return (
    <motion.div
      onClick={handleClick}
      whileHover={isAvailable && !isOnCooldown ? { scale: 1.03, y: -4 } : undefined}
      whileTap={isAvailable && !isOnCooldown ? { scale: 0.97 } : undefined}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={clsx(
        'relative overflow-hidden rounded-[18px] cursor-pointer',
        'aspect-[3/4]', // 3:4 aspect ratio
        !isAvailable || isOnCooldown ? 'cursor-not-allowed' : ''
      )}
      style={{
        filter: isOnCooldown ? 'grayscale(70%)' : 'none',
        opacity: isOnCooldown ? 0.8 : 1,
      }}
    >
      {/* Background gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(135deg, ${task.gradient_start || '#8B7ECC'} 0%, ${task.gradient_end || '#A99DD8'} 100%)`,
        }}
      />

      {/* Thumbnail overlay if exists */}
      {task.thumbnail_url && (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${task.thumbnail_url})` }}
        />
      )}

      {/* Gradient overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

      {/* Glow effect for available tasks */}
      {isAvailable && !isOnCooldown && (
        <div
          className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300"
          style={{
            boxShadow: `inset 0 0 30px rgba(255, 255, 255, 0.1), 0 8px 32px rgba(139, 126, 204, 0.3)`,
          }}
        />
      )}

      {/* Content */}
      <div className="absolute inset-0 p-4 flex flex-col justify-end">
        {/* Rating badge */}
        <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/30 backdrop-blur-sm rounded-full px-2 py-1">
          <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
          <span className="text-white text-xs font-medium" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
            {task.userRating?.toFixed(1) || '4.5'}
          </span>
        </div>

        {/* Reward badge */}
        <div className="absolute top-3 left-3 bg-green-500/90 backdrop-blur-sm rounded-full px-3 py-1">
          <span className="text-white text-sm font-bold" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>
            ${userReward.toFixed(2)}
          </span>
        </div>

        {/* Title */}
        <h3
          className="text-white font-bold text-lg leading-tight mb-1"
          style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}
        >
          {task.title}
        </h3>

        {/* Description */}
        <p
          className="text-white/80 text-sm line-clamp-2"
          style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
        >
          {task.description || 'Complete this task to earn rewards!'}
        </p>
      </div>

      {/* Cooldown overlay */}
      {isOnCooldown && cooldownEnd && (
        <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-3">
          <Lock className="w-8 h-8 text-white/70" />
          <CooldownTimer
            endTime={cooldownEnd}
            onExpire={() => {
              // Timer expired - parent component should handle state update
            }}
          />
        </div>
      )}
    </motion.div>
  )
}
