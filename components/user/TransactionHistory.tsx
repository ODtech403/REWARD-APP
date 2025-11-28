'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowDownLeft, 
  ArrowUpRight, 
  Filter,
  Coins,
  Clock,
  CheckCircle2
} from 'lucide-react'
import { clsx } from 'clsx'
import type { Transaction } from '@/lib/types'

type TransactionFilter = 'all' | 'reward' | 'withdrawal'

interface TransactionHistoryProps {
  transactions: Transaction[]
  className?: string
  isDark?: boolean
}

const filterOptions: { value: TransactionFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'reward', label: 'Rewards' },
  { value: 'withdrawal', label: 'Withdrawals' },
]

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    })
  } else if (diffDays === 1) {
    return 'Yesterday'
  } else if (diffDays < 7) {
    return date.toLocaleDateString('en-US', { weekday: 'long' })
  } else {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    })
  }
}

function getTransactionIcon(type: Transaction['transaction_type']) {
  switch (type) {
    case 'reward':
      return <Coins className="w-4 h-4" />
    case 'withdrawal':
      return <ArrowUpRight className="w-4 h-4" />
    case 'deposit':
      return <ArrowDownLeft className="w-4 h-4" />
    default:
      return <CheckCircle2 className="w-4 h-4" />
  }
}

function getTransactionColor(type: Transaction['transaction_type']) {
  switch (type) {
    case 'reward':
    case 'deposit':
      return 'text-green-400 bg-green-500/20'
    case 'withdrawal':
    case 'campaign_spend':
      return 'text-red-400 bg-red-500/20'
    case 'commission':
      return 'text-yellow-400 bg-yellow-500/20'
    default:
      return 'text-gray-400 bg-gray-500/20'
  }
}

function getTransactionLabel(type: Transaction['transaction_type']): string {
  switch (type) {
    case 'reward':
      return 'Task Reward'
    case 'withdrawal':
      return 'Withdrawal'
    case 'deposit':
      return 'Deposit'
    case 'campaign_spend':
      return 'Campaign Spend'
    case 'commission':
      return 'Commission'
    default:
      return type
  }
}

interface TransactionItemProps {
  transaction: Transaction
  index: number
  isDark?: boolean
}

function TransactionItem({ transaction, index, isDark = true }: TransactionItemProps) {
  const isCredit = transaction.transaction_type === 'reward' || transaction.transaction_type === 'deposit'
  const iconColor = getTransactionColor(transaction.transaction_type)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={clsx(
        'flex items-center justify-between p-4 rounded-xl border transition-colors',
        isDark 
          ? 'bg-white/5 border-white/5 hover:bg-white/10' 
          : 'bg-white border-gray-200 hover:bg-gray-50'
      )}
    >
      <div className="flex items-center gap-3">
        <div className={clsx('w-10 h-10 rounded-full flex items-center justify-center', iconColor)}>
          {getTransactionIcon(transaction.transaction_type)}
        </div>
        <div>
          <p className={clsx('font-medium', isDark ? 'text-white' : 'text-gray-900')}>
            {getTransactionLabel(transaction.transaction_type)}
          </p>
          <div className={clsx('flex items-center gap-2 text-sm', isDark ? 'text-gray-400' : 'text-gray-500')}>
            <Clock className="w-3 h-3" />
            <span>{formatDate(transaction.created_at)}</span>
          </div>
        </div>
      </div>
      <div className="text-right">
        <p className={clsx('font-semibold', isCredit ? 'text-green-500' : 'text-red-500')}>
          {isCredit ? '+' : '-'}${Math.abs(transaction.amount).toFixed(2)}
        </p>
        <p className={clsx('text-xs', isDark ? 'text-gray-500' : 'text-gray-400')}>
          Balance: ${transaction.balance_after.toFixed(2)}
        </p>
      </div>
    </motion.div>
  )
}

export function TransactionHistory({ transactions, className, isDark = true }: TransactionHistoryProps) {
  const [filter, setFilter] = useState<TransactionFilter>('all')

  const filteredTransactions = useMemo(() => {
    if (filter === 'all') return transactions
    return transactions.filter((t) => t.transaction_type === filter)
  }, [transactions, filter])

  return (
    <div className={clsx('space-y-4', className)}>
      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        <Filter className={clsx('w-4 h-4', isDark ? 'text-gray-400' : 'text-gray-500')} />
        <div className="flex gap-2">
          {filterOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setFilter(option.value)}
              className={clsx(
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                filter === option.value
                  ? 'bg-green-500/20 text-green-600 border border-green-500/30'
                  : isDark 
                    ? 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
                    : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Transaction List */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filteredTransactions.length > 0 ? (
            filteredTransactions.map((transaction, index) => (
              <TransactionItem
                key={transaction.id}
                transaction={transaction}
                index={index}
                isDark={isDark}
              />
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-12 text-center"
            >
              <div className={clsx(
                'w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center',
                isDark ? 'bg-white/5' : 'bg-gray-100'
              )}>
                <Coins className="w-8 h-8 text-gray-500" />
              </div>
              <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                {filter === 'all' 
                  ? 'No transactions yet' 
                  : `No ${filter === 'reward' ? 'rewards' : 'withdrawals'} yet`}
              </p>
              <p className="text-gray-500 text-sm mt-1">
                Complete tasks to earn rewards!
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
