'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { DollarSign, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export interface AddFundsModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (amount: number) => void
}

// Minimum deposit amount in Naira
const MIN_DEPOSIT = 1000
const PRESET_AMOUNTS = [5000, 10000, 25000, 50000]

export function AddFundsModal({ isOpen, onClose, onSuccess }: AddFundsModalProps) {
  const [amount, setAmount] = useState<number>(10000)
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentSuccess, setPaymentSuccess] = useState(false)

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setError(null)
      setAmount(10000)
      setIsProcessing(false)
      setPaymentSuccess(false)
    }
  }, [isOpen])

  // Check for payment callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const paymentStatus = urlParams.get('payment')
    const reference = urlParams.get('reference')
    
    if (paymentStatus === 'callback' && reference) {
      // Verify payment
      verifyPayment(reference)
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  const verifyPayment = async (reference: string) => {
    try {
      const response = await fetch(`/api/payments/verify?reference=${reference}`)
      const data = await response.json()
      
      if (data.success) {
        setPaymentSuccess(true)
        onSuccess(data.amount)
        setTimeout(() => {
          onClose()
        }, 2000)
      }
    } catch (err) {
      console.error('Payment verification error:', err)
    }
  }

  const handleAmountChange = (value: string) => {
    const numValue = parseFloat(value)
    if (!isNaN(numValue) && numValue >= 0) {
      setAmount(numValue)
      setError(null)
    }
  }

  const handlePresetClick = (presetAmount: number) => {
    setAmount(presetAmount)
    setError(null)
  }

  const handlePayWithPaystack = async () => {
    if (amount < MIN_DEPOSIT) {
      setError(`Minimum deposit is ₦${MIN_DEPOSIT.toLocaleString()}`)
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      const response = await fetch('/api/payments/create-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to initialize payment')
      }

      // Redirect to Paystack checkout
      if (data.authorizationUrl) {
        window.location.href = data.authorizationUrl
      } else {
        throw new Error('No authorization URL received')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setIsProcessing(false)
    }
  }

  if (paymentSuccess) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Add Funds" size="md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-8"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
            className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center"
          >
            <CheckCircle className="w-8 h-8 text-green-500" />
          </motion.div>
          <h3 className="text-xl font-semibold text-white mb-2">Payment Successful!</h3>
          <p className="text-gray-400">
            ₦{amount.toLocaleString()} has been added to your wallet.
          </p>
        </motion.div>
      </Modal>
    )
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Funds" size="md">
      <div className="space-y-6">
        {/* Amount Input */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Deposit Amount (₦)
          </label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="number"
              value={amount}
              onChange={(e) => handleAmountChange(e.target.value)}
              min={MIN_DEPOSIT}
              step="100"
              className="pl-10 text-lg"
              placeholder="Enter amount"
            />
          </div>
        </div>

        {/* Preset Amounts */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Quick Select
          </label>
          <div className="grid grid-cols-4 gap-2">
            {PRESET_AMOUNTS.map((preset) => (
              <button
                key={preset}
                onClick={() => handlePresetClick(preset)}
                className={`py-2 px-3 rounded-lg border transition-all text-sm ${
                  amount === preset
                    ? 'border-purple-500 bg-purple-500/20 text-purple-300'
                    : 'border-white/10 bg-white/5 text-gray-300 hover:border-white/20'
                }`}
              >
                ₦{(preset / 1000).toFixed(0)}k
              </button>
            ))}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400"
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </motion.div>
        )}

        {/* Summary */}
        <div className="p-4 rounded-lg bg-white/5 border border-white/10">
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Amount to deposit</span>
            <span className="text-xl font-semibold text-white">
              ₦{amount.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Pay Button */}
        <Button
          onClick={handlePayWithPaystack}
          disabled={isProcessing || amount < MIN_DEPOSIT}
          className="w-full"
          size="lg"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Processing...
            </>
          ) : (
            'Pay with Paystack'
          )}
        </Button>

        <p className="text-xs text-gray-500 text-center">
          Minimum deposit: ₦{MIN_DEPOSIT.toLocaleString()}. Payments are processed securely via Paystack.
        </p>
      </div>
    </Modal>
  )
}
