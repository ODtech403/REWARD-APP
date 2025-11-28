'use client'

import { motion } from 'framer-motion'
import { 
  ArrowLeft, 
  Gift, 
  CheckCircle, 
  DollarSign, 
  Mail,
  Star,
  Target,
  Wallet,
  Clock
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { MINIMUM_WITHDRAWAL, SUPPORT_EMAIL } from '@/lib/utils/withdrawal'

export default function AboutPage() {
  const router = useRouter()

  const sections = [
    {
      icon: Target,
      title: 'How It Works',
      description: 'Complete simple tasks to earn real money. Each task has a reward amount shown before you start.',
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
    },
    {
      icon: Gift,
      title: 'How to Earn',
      description: 'Browse available tasks, complete them according to instructions, and earn rewards instantly credited to your wallet.',
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
    },
    {
      icon: Wallet,
      title: 'How to Withdraw',
      description: `Once you reach the minimum balance of $${MINIMUM_WITHDRAWAL.toFixed(2)}, you can withdraw your earnings to your preferred payment method.`,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
    },
    {
      icon: Clock,
      title: 'Task Cooldowns',
      description: 'Some tasks have cooldown periods. After completing a task, you may need to wait before doing it again.',
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/10',
    },
  ]

  const tips = [
    'Complete tasks accurately to maintain your account standing',
    'Check back daily for new tasks and opportunities',
    'Higher reward tasks may require more effort',
    'Your earnings are tracked in real-time',
  ]

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-24">
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
            <h1 className="text-2xl font-bold text-white">About</h1>
            <p className="text-white/80 text-sm">Learn how to use the app</p>
          </div>
        </motion.div>
      </div>

      <div className="p-4 space-y-6">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#1a1a1a] rounded-2xl p-6 border border-white/10"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
              <Star className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Welcome!</h2>
              <p className="text-gray-400 text-sm">Your guide to earning rewards</p>
            </div>
          </div>
          <p className="text-gray-400">
            This app lets you earn money by completing simple tasks. Browse available tasks, 
            complete them, and watch your balance grow. It&apos;s that simple!
          </p>
        </motion.div>

        {/* How It Works Sections */}
        {sections.map((section, index) => (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * (index + 1) }}
            className="bg-[#1a1a1a] rounded-2xl p-5 border border-white/10"
          >
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-xl ${section.bgColor} flex items-center justify-center flex-shrink-0`}>
                <section.icon className={`w-6 h-6 ${section.color}`} />
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">{section.title}</h3>
                <p className="text-gray-400 text-sm">{section.description}</p>
              </div>
            </div>
          </motion.div>
        ))}

        {/* Tips Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-[#1a1a1a] rounded-2xl p-5 border border-white/10"
        >
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            Tips for Success
          </h3>
          <ul className="space-y-3">
            {tips.map((tip, index) => (
              <li key={index} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-green-400 text-xs font-bold">{index + 1}</span>
                </div>
                <span className="text-gray-400 text-sm">{tip}</span>
              </li>
            ))}
          </ul>
        </motion.div>

        {/* Contact Support */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-gradient-to-r from-green-500 to-emerald-400 rounded-2xl p-5 shadow-sm"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <Mail className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-white mb-1">Need Help?</h3>
              <p className="text-white/80 text-sm">Contact our support team</p>
            </div>
          </div>
          <a 
            href={`mailto:${SUPPORT_EMAIL}`}
            className="mt-4 block w-full bg-white text-green-600 font-semibold py-3 px-4 rounded-xl text-center hover:bg-green-50 transition-colors"
          >
            {SUPPORT_EMAIL}
          </a>
        </motion.div>
      </div>
    </div>
  )
}
