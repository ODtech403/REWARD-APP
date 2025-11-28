'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeft, 
  Mail,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  DollarSign,
  Shield,
  Clock
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { SUPPORT_EMAIL } from '@/lib/utils/withdrawal'

interface FAQ {
  id: string
  question: string
  answer: string
  icon: typeof HelpCircle
}

export default function SupportPage() {
  const router = useRouter()
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null)

  const faqs: FAQ[] = [
    {
      id: 'how-earn',
      question: 'How do I earn money?',
      answer: 'Browse available tasks on the dashboard, complete them according to the instructions, and earn rewards instantly. Each task shows its reward amount before you start.',
      icon: DollarSign,
    },
    {
      id: 'withdrawal',
      question: 'When can I withdraw my earnings?',
      answer: 'You can withdraw once your balance reaches $5.00. Go to the Wallet section to see your progress and initiate withdrawals.',
      icon: DollarSign,
    },
    {
      id: 'cooldown',
      question: 'Why do some tasks have cooldowns?',
      answer: 'Cooldowns ensure fair distribution of tasks among all users. After completing certain tasks, you may need to wait before doing them again.',
      icon: Clock,
    },
    {
      id: 'account-security',
      question: 'How is my account secured?',
      answer: 'We use industry-standard encryption and security measures to protect your account and earnings. Enable two-factor authentication for extra security.',
      icon: Shield,
    },
    {
      id: 'payment-methods',
      question: 'What payment methods are supported?',
      answer: 'We support various payment methods including bank transfers and digital wallets. Check the withdrawal section for available options in your region.',
      icon: DollarSign,
    },
  ]

  const toggleFaq = (id: string) => {
    setExpandedFaq(expandedFaq === id ? null : id)
  }

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
            <h1 className="text-2xl font-bold text-white">Support</h1>
            <p className="text-white/80 text-sm">We&apos;re here to help</p>
          </div>
        </motion.div>
      </div>

      <div className="p-4 space-y-6">
        {/* Contact Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-green-500 to-emerald-400 rounded-2xl p-5 shadow-sm"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-white">Contact Us</h2>
              <p className="text-white/80 text-sm">Get help from our team</p>
            </div>
          </div>
          <a 
            href={`mailto:${SUPPORT_EMAIL}`}
            className="flex items-center gap-3 w-full bg-white text-green-600 font-semibold py-3 px-4 rounded-xl hover:bg-green-50 transition-colors"
          >
            <Mail className="w-5 h-5" />
            <span>{SUPPORT_EMAIL}</span>
          </a>
        </motion.div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#1a1a1a] rounded-2xl overflow-hidden border border-white/10"
        >
          <div className="px-5 py-4 border-b border-white/10 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-green-400" />
            <h2 className="font-semibold text-white">Frequently Asked Questions</h2>
          </div>
          
          {faqs.map((faq, index) => (
            <motion.div
              key={faq.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 * (index + 1) }}
              className="border-b border-white/5 last:border-0"
            >
              <button
                onClick={() => toggleFaq(faq.id)}
                className="w-full flex items-center gap-4 p-4 hover:bg-white/5 transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center flex-shrink-0">
                  <faq.icon className="w-5 h-5 text-green-400" />
                </div>
                <span className="flex-1 font-medium text-white">{faq.question}</span>
                {expandedFaq === faq.id ? (
                  <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
              </button>
              <AnimatePresence>
                {expandedFaq === faq.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <p className="px-4 pb-4 pl-18 text-gray-400 text-sm ml-14">
                      {faq.answer}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </motion.div>

        {/* Response Time */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-[#1a1a1a] rounded-2xl p-5 border border-white/10"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="font-medium text-white">Response Time</p>
              <p className="text-gray-400 text-sm">We typically respond within 24 hours</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
