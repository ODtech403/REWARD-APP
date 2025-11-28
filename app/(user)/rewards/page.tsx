'use client'

import { motion } from 'framer-motion'
import { 
  ArrowLeft, 
  Gift,
  Trophy,
  Star,
  Target,
  Zap,
  Crown,
  Medal,
  Award
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useUserStore } from '@/lib/stores/userStore'
import { useThemeStore } from '@/lib/stores/themeStore'

interface Achievement {
  id: string
  icon: typeof Trophy
  title: string
  description: string
  target: number
  current: number
  reward: string
  unlocked: boolean
  color: string
  bgColor: string
}

interface RewardTier {
  id: string
  name: string
  minEarnings: number
  icon: typeof Star
  benefits: string[]
  color: string
}

export default function RewardsPage() {
  const router = useRouter()
  const { walletBalance } = useUserStore()
  const { theme } = useThemeStore()
  const isDark = theme === 'dark'

  const achievements: Achievement[] = [
    {
      id: 'first-task',
      icon: Star,
      title: 'First Steps',
      description: 'Complete your first task',
      target: 1,
      current: 1,
      reward: '$0.10 bonus',
      unlocked: true,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-50',
    },
    {
      id: 'task-streak',
      icon: Zap,
      title: 'On Fire',
      description: 'Complete 5 tasks in a day',
      target: 5,
      current: 3,
      reward: '$0.50 bonus',
      unlocked: false,
      color: 'text-orange-500',
      bgColor: 'bg-orange-50',
    },
    {
      id: 'earnings-10',
      icon: Target,
      title: 'Rising Star',
      description: 'Earn $10 total',
      target: 10,
      current: Math.min(walletBalance, 10),
      reward: 'Bronze badge',
      unlocked: walletBalance >= 10,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
    },
    {
      id: 'earnings-50',
      icon: Trophy,
      title: 'Task Master',
      description: 'Earn $50 total',
      target: 50,
      current: Math.min(walletBalance, 50),
      reward: 'Silver badge',
      unlocked: walletBalance >= 50,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50',
    },
    {
      id: 'earnings-100',
      icon: Crown,
      title: 'Champion',
      description: 'Earn $100 total',
      target: 100,
      current: Math.min(walletBalance, 100),
      reward: 'Gold badge',
      unlocked: walletBalance >= 100,
      color: 'text-amber-500',
      bgColor: 'bg-amber-50',
    },
  ]

  const rewardTiers: RewardTier[] = [
    {
      id: 'bronze',
      name: 'Bronze',
      minEarnings: 0,
      icon: Medal,
      benefits: ['Access to basic tasks', 'Standard rewards'],
      color: 'from-amber-600 to-amber-700',
    },
    {
      id: 'silver',
      name: 'Silver',
      minEarnings: 25,
      icon: Award,
      benefits: ['Priority task access', '5% bonus rewards', 'Faster withdrawals'],
      color: 'from-gray-400 to-gray-500',
    },
    {
      id: 'gold',
      name: 'Gold',
      minEarnings: 100,
      icon: Crown,
      benefits: ['Exclusive tasks', '10% bonus rewards', 'VIP support', 'Early access'],
      color: 'from-yellow-400 to-yellow-500',
    },
  ]

  const getCurrentTier = () => {
    if (walletBalance >= 100) return 'gold'
    if (walletBalance >= 25) return 'silver'
    return 'bronze'
  }

  const currentTier = getCurrentTier()

  const bgClass = isDark ? 'bg-[#0a0a0a]' : 'bg-gray-100'
  const cardClass = isDark ? 'bg-[#1a1a1a] border-white/10' : 'bg-white border-gray-200'
  const textClass = isDark ? 'text-white' : 'text-gray-800'
  const textSecondaryClass = isDark ? 'text-gray-400' : 'text-gray-600'
  const borderClass = isDark ? 'border-white/10' : 'border-gray-200'

  return (
    <div className={`min-h-screen ${bgClass} pb-24`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-400 px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4"
        >
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">Rewards</h1>
            <p className="text-white/80 text-sm">Your achievements & milestones</p>
          </div>
        </motion.div>
      </div>

      <div className="p-4 space-y-6">
        {/* Current Tier Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`bg-gradient-to-r ${rewardTiers.find(t => t.id === currentTier)?.color} rounded-2xl p-5 shadow-lg`}
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
              <Trophy className="w-8 h-8 text-white" />
            </div>
            <div>
              <p className="text-white/80 text-sm">Current Tier</p>
              <h2 className="text-2xl font-bold text-white capitalize">{currentTier}</h2>
              <p className="text-white/80 text-sm">Total earned: ${walletBalance.toFixed(2)}</p>
            </div>
          </div>
        </motion.div>

        {/* Achievements */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`rounded-2xl overflow-hidden border ${cardClass}`}
        >
          <div className={`px-5 py-4 border-b ${borderClass} flex items-center gap-2`}>
            <Gift className={`w-5 h-5 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
            <h2 className={`font-semibold ${textClass}`}>Achievements</h2>
          </div>
          
          <div className="p-4 space-y-4">
            {achievements.map((achievement, index) => (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * (index + 1) }}
                className={`p-4 rounded-xl border ${achievement.unlocked ? (isDark ? 'border-green-500/30 bg-green-500/10' : 'border-green-300 bg-green-50') : (isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50')}`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl ${achievement.bgColor} flex items-center justify-center flex-shrink-0`}>
                    <achievement.icon className={`w-6 h-6 ${achievement.color}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className={`font-semibold ${textClass}`}>{achievement.title}</h3>
                      {achievement.unlocked && (
                        <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">
                          Unlocked
                        </span>
                      )}
                    </div>
                    <p className={`text-sm mb-2 ${textSecondaryClass}`}>{achievement.description}</p>
                    
                    {/* Progress Bar */}
                    <div className="mb-2">
                      <div className="flex justify-between text-xs mb-1">
                        <span className={textSecondaryClass}>Progress</span>
                        <span className={textClass}>{achievement.current}/{achievement.target}</span>
                      </div>
                      <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-gray-200'}`}>
                        <div 
                          className={`h-full rounded-full ${achievement.unlocked ? 'bg-green-500' : 'bg-gray-400'}`}
                          style={{ width: `${Math.min(100, (achievement.current / achievement.target) * 100)}%` }}
                        />
                      </div>
                    </div>
                    
                    <p className={`text-xs ${textSecondaryClass}`}>
                      Reward: <span className={`font-medium ${isDark ? 'text-green-400' : 'text-green-600'}`}>{achievement.reward}</span>
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Reward Tiers */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={`rounded-2xl overflow-hidden border ${cardClass}`}
        >
          <div className={`px-5 py-4 border-b ${borderClass} flex items-center gap-2`}>
            <Crown className={`w-5 h-5 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
            <h2 className={`font-semibold ${textClass}`}>Reward Tiers</h2>
          </div>
          
          <div className="p-4 space-y-4">
            {rewardTiers.map((tier, index) => (
              <motion.div
                key={tier.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 * (index + 1) }}
                className={`p-4 rounded-xl border ${currentTier === tier.id ? 'border-green-500/30 bg-green-500/10' : 'border-white/10'}`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${tier.color} flex items-center justify-center`}>
                    <tier.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{tier.name}</h3>
                    <p className="text-gray-500 text-xs">${tier.minEarnings}+ earned</p>
                  </div>
                  {currentTier === tier.id && (
                    <span className="ml-auto px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
                      Current
                    </span>
                  )}
                </div>
                <ul className="space-y-1">
                  {tier.benefits.map((benefit, i) => (
                    <li key={i} className="text-gray-400 text-sm flex items-center gap-2">
                      <Star className="w-3 h-3 text-yellow-500" />
                      {benefit}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
