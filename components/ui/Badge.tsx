'use client'

import { clsx } from 'clsx'

interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
  size?: 'sm' | 'md'
  children: React.ReactNode
  className?: string
}

export function Badge({ variant = 'default', size = 'md', children, className }: BadgeProps) {
  const baseStyles = 'inline-flex items-center font-medium rounded-full'
  
  const variants = {
    default: 'bg-white/10 text-gray-300',
    success: 'bg-green-500/20 text-green-400',
    warning: 'bg-yellow-500/20 text-yellow-400',
    danger: 'bg-red-500/20 text-red-400',
    info: 'bg-blue-500/20 text-blue-400',
  }

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
  }

  return (
    <span className={clsx(baseStyles, variants[variant], sizes[size], className)}>
      {children}
    </span>
  )
}

interface StatusBadgeProps {
  status: 'active' | 'paused' | 'depleted' | 'completed' | 'draft' | 'available' | 'cooldown'
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const statusConfig = {
    active: { variant: 'success' as const, label: 'Active', dot: true },
    available: { variant: 'success' as const, label: 'Available', dot: true },
    paused: { variant: 'warning' as const, label: 'Paused', dot: true },
    depleted: { variant: 'danger' as const, label: 'Depleted', dot: false },
    completed: { variant: 'info' as const, label: 'Completed', dot: false },
    draft: { variant: 'default' as const, label: 'Draft', dot: false },
    cooldown: { variant: 'warning' as const, label: 'Cooldown', dot: true },
  }

  const config = statusConfig[status]

  return (
    <Badge variant={config.variant} className={clsx('gap-1.5', className)}>
      {config.dot && (
        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
      )}
      {config.label}
    </Badge>
  )
}
