'use client'

import { forwardRef } from 'react'
import { motion, HTMLMotionProps } from 'framer-motion'
import { clsx } from 'clsx'

interface CardProps extends Omit<HTMLMotionProps<'div'>, 'ref'> {
  variant?: 'default' | 'glass' | 'gradient'
  hover?: boolean
  children: React.ReactNode
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ variant = 'default', hover = false, children, className, ...props }, ref) => {
    const baseStyles = 'rounded-2xl overflow-hidden'
    
    const variants = {
      default: 'bg-white/5 border border-white/10',
      glass: 'bg-white/5 backdrop-blur-xl border border-white/10 shadow-xl',
      gradient: 'bg-gradient-to-br from-white/10 to-white/5 border border-white/10',
    }

    return (
      <motion.div
        ref={ref}
        whileHover={hover ? { scale: 1.02, y: -4 } : undefined}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className={clsx(baseStyles, variants[variant], className)}
        {...props}
      >
        {children}
      </motion.div>
    )
  }
)

Card.displayName = 'Card'

interface CardHeaderProps {
  children: React.ReactNode
  className?: string
}

function CardHeader({ children, className }: CardHeaderProps) {
  return (
    <div className={clsx('px-6 py-4 border-b border-white/10', className)}>
      {children}
    </div>
  )
}

interface CardContentProps {
  children: React.ReactNode
  className?: string
}

function CardContent({ children, className }: CardContentProps) {
  return (
    <div className={clsx('px-6 py-4', className)}>
      {children}
    </div>
  )
}

interface CardFooterProps {
  children: React.ReactNode
  className?: string
}

function CardFooter({ children, className }: CardFooterProps) {
  return (
    <div className={clsx('px-6 py-4 border-t border-white/10', className)}>
      {children}
    </div>
  )
}

export { Card, CardHeader, CardContent, CardFooter }
