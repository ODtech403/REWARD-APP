'use client'

import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  User,
  Mail,
  Calendar,
  Wallet,
  Edit2,
  Camera,
  CheckCircle,
  ChevronRight,
  Loader2,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useUserStore } from '@/lib/stores/userStore'
import { useThemeStore } from '@/lib/stores/themeStore'
import Link from 'next/link'

export default function ProfilePage() {
  const router = useRouter()
  const { user, walletBalance, setUser } = useUserStore()
  const { theme } = useThemeStore()
  const isDark = theme === 'dark'
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setUploadError(null)

    try {
      const formData = new FormData()
      formData.append('avatar', file)

      const response = await fetch('/api/profile/avatar', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload')
      }

      // Update user store with new avatar
      if (user) {
        setUser({ ...user, avatarUrl: data.avatarUrl })
      }
    } catch (error) {
      console.error('Upload error:', error)
      setUploadError(error instanceof Error ? error.message : 'Failed to upload image')
    } finally {
      setIsUploading(false)
      // Reset input so same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const formatDate = (date: Date | undefined) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const profileLinks = [
    { href: '/wallet', icon: Wallet, label: 'My Wallet', value: `$${walletBalance.toFixed(2)}` },
    { href: '/settings', icon: Edit2, label: 'Edit Profile', value: '' },
    { href: '/security', icon: CheckCircle, label: 'Account Security', value: 'Secure' },
  ]

  // Theme classes
  const bgClass = isDark ? 'bg-[#0a0a0a]' : 'bg-gray-100'
  const cardClass = isDark ? 'bg-[#1a1a1a] border-white/10' : 'bg-white border-gray-200'
  const textClass = isDark ? 'text-white' : 'text-gray-800'
  const textSecondaryClass = isDark ? 'text-gray-400' : 'text-gray-600'
  const borderClass = isDark ? 'border-white/10' : 'border-gray-200'
  const hoverClass = isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'

  return (
    <div className={`min-h-screen ${bgClass} pb-24`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-400 px-4 pt-6 pb-20">
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
            <h1 className="text-2xl font-bold text-white">Profile</h1>
            <p className="text-white/80 text-sm">Manage your account</p>
          </div>
        </motion.div>
      </div>

      {/* Profile Card - Overlapping Header */}
      <div className="px-4 -mt-14">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-2xl p-6 shadow-lg border ${cardClass}`}
        >
          {/* Avatar */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative mb-4">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center overflow-hidden">
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt="Profile"
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <User className="w-12 h-12 text-white" />
                )}
                {isUploading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full">
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                onClick={handleAvatarClick}
                disabled={isUploading}
                className={`absolute bottom-0 right-0 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center border-2 ${isDark ? 'border-[#1a1a1a]' : 'border-white'} shadow-md hover:bg-green-600 transition-colors disabled:opacity-50`}
              >
                <Camera className="w-4 h-4 text-white" />
              </button>
            </div>
            {uploadError && (
              <p className="text-red-400 text-sm mb-2">{uploadError}</p>
            )}
            <h2 className={`text-xl font-bold ${textClass}`}>
              {user?.displayName || 'User'}
            </h2>
            <p className={`text-sm ${textSecondaryClass}`}>{user?.email || 'No email'}</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className={`${isDark ? 'bg-green-500/10 border-green-500/20' : 'bg-green-50 border-green-200'} rounded-xl p-4 text-center border`}>
              <p className={`text-2xl font-bold ${isDark ? 'text-green-400' : 'text-green-600'}`}>${walletBalance.toFixed(2)}</p>
              <p className={`text-sm ${textSecondaryClass}`}>Balance</p>
            </div>
            <div className={`${isDark ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-50 border-blue-200'} rounded-xl p-4 text-center border`}>
              <p className={`text-2xl font-bold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                {user?.role === 'user' ? 'Member' : user?.role || 'Member'}
              </p>
              <p className={`text-sm ${textSecondaryClass}`}>Status</p>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="p-4 space-y-4 mt-4">
        {/* Account Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`rounded-2xl overflow-hidden border ${cardClass}`}
        >
          <div className={`px-5 py-4 border-b ${borderClass}`}>
            <h3 className={`font-semibold ${textClass}`}>Account Information</h3>
          </div>

          <div className="p-4 space-y-4">
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl ${isDark ? 'bg-green-500/10' : 'bg-green-50'} flex items-center justify-center`}>
                <User className={`w-5 h-5 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
              </div>
              <div className="flex-1">
                <p className={`text-sm ${textSecondaryClass}`}>Display Name</p>
                <p className={`font-medium ${textClass}`}>{user?.displayName || 'Not set'}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl ${isDark ? 'bg-blue-500/10' : 'bg-blue-50'} flex items-center justify-center`}>
                <Mail className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
              </div>
              <div className="flex-1">
                <p className={`text-sm ${textSecondaryClass}`}>Email Address</p>
                <p className={`font-medium ${textClass}`}>{user?.email || 'Not set'}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl ${isDark ? 'bg-purple-500/10' : 'bg-purple-50'} flex items-center justify-center`}>
                <Calendar className={`w-5 h-5 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
              </div>
              <div className="flex-1">
                <p className={`text-sm ${textSecondaryClass}`}>Member Since</p>
                <p className={`font-medium ${textClass}`}>{formatDate(user?.createdAt)}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Quick Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`rounded-2xl overflow-hidden border ${cardClass}`}
        >
          <div className={`px-5 py-4 border-b ${borderClass}`}>
            <h3 className={`font-semibold ${textClass}`}>Quick Links</h3>
          </div>

          {profileLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-4 p-4 ${hoverClass} transition-colors border-b ${isDark ? 'border-white/5' : 'border-gray-100'} last:border-0`}
            >
              <div className={`w-10 h-10 rounded-xl ${isDark ? 'bg-green-500/10' : 'bg-green-50'} flex items-center justify-center`}>
                <link.icon className={`w-5 h-5 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
              </div>
              <div className="flex-1">
                <p className={`font-medium ${textClass}`}>{link.label}</p>
              </div>
              {link.value && (
                <span className={`font-medium ${isDark ? 'text-green-400' : 'text-green-600'}`}>{link.value}</span>
              )}
              <ChevronRight className={`w-5 h-5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
            </Link>
          ))}
        </motion.div>
      </div>
    </div>
  )
}
