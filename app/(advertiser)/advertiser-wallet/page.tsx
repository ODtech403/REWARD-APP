'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Wallet, Plus, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { useAdvertiserStore } from '@/lib/stores/advertiserStore'
import { AddFundsModal } from '@/components/advertiser'
import { TransactionHistory } from '@/components/user/TransactionHistory'
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/lib/types/database'
import type { Transaction } from '@/lib/types'

export default function AdvertiserWalletPage() {
  const { walletBalance, updateBalance } = useAdvertiserStore()
  const [isAddFundsOpen, setIsAddFundsOpen] = useState(false)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const fetchTransactions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      setTransactions(data || [])
    } catch (error) {
      console.error('Error fetching transactions:', error)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  const fetchBalance = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('profiles')
        .select('wallet_balance')
        .eq('id', user.id)
        .single<{ wallet_balance: number }>()

      if (error) throw error
      if (data) {
        updateBalance(data.wallet_balance)
      }
    } catch (error) {
      console.error('Error fetching balance:', error)
    }
  }

  useEffect(() => {
    fetchTransactions()
    fetchBalance()
  }, [])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await Promise.all([fetchTransactions(), fetchBalance()])
  }

  const handleAddFundsSuccess = async (amount: number) => {
    // Refresh balance and transactions after successful payment
    await handleRefresh()
    setIsAddFundsOpen(false)
  }

  return (
    <div className="min-h-screen p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-white">Wallet</h1>
          <p className="text-gray-400 mt-1">Manage your funds and view transaction history</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </motion.div>

      {/* Balance Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-8"
      >
        <Card variant="glass" className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 border-purple-500/30">
          <CardContent className="py-8">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 text-gray-400 mb-2">
                  <Wallet className="w-5 h-5" />
                  <span>Available Balance</span>
                </div>
                <p className="text-4xl font-bold text-white">
                  ${walletBalance.toFixed(2)}
                </p>
              </div>
              <Button size="lg" onClick={() => setIsAddFundsOpen(true)}>
                <Plus className="w-4 h-4" />
                Add Funds
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Transaction History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="text-xl font-semibold text-white mb-4">Transaction History</h2>
        {isLoading ? (
          <Card variant="glass">
            <CardContent className="py-12 text-center">
              <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-4" />
              <p className="text-gray-400">Loading transactions...</p>
            </CardContent>
          </Card>
        ) : (
          <TransactionHistory transactions={transactions} />
        )}
      </motion.div>

      {/* Add Funds Modal */}
      <AddFundsModal
        isOpen={isAddFundsOpen}
        onClose={() => setIsAddFundsOpen(false)}
        onSuccess={handleAddFundsSuccess}
      />
    </div>
  )
}
