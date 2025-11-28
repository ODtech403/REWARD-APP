'use client'

import { useRef } from 'react'
import { motion } from 'framer-motion'
import { clsx } from 'clsx'
import Image from 'next/image'
import type { Category } from '@/lib/types'

interface CategoryScrollProps {
  categories: Category[]
  selectedCategory: string | null
  onSelect: (categoryId: string | null) => void
}

// 3D Category Icons with beautiful gradients and illustrations
const CATEGORY_3D_ICONS: Record<string, { gradient: string; icon: React.ReactNode }> = {
  all: {
    gradient: 'linear-gradient(135deg, #FFD93D 0%, #FF6B6B 100%)',
    icon: (
      <svg viewBox="0 0 48 48" className="w-8 h-8">
        <defs>
          <linearGradient id="homeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFD93D" />
            <stop offset="100%" stopColor="#FF6B6B" />
          </linearGradient>
        </defs>
        <path d="M24 4L4 20h6v20h10V28h8v12h10V20h6L24 4z" fill="white" />
        <circle cx="24" cy="18" r="4" fill="#FFD93D" />
      </svg>
    ),
  },
  surveys: {
    gradient: 'linear-gradient(135deg, #A8E6CF 0%, #3D9970 100%)',
    icon: (
      <svg viewBox="0 0 48 48" className="w-8 h-8">
        <rect x="8" y="6" width="32" height="36" rx="4" fill="white" />
        <rect x="14" y="14" width="20" height="3" rx="1.5" fill="#3D9970" />
        <rect x="14" y="22" width="16" height="3" rx="1.5" fill="#A8E6CF" />
        <rect x="14" y="30" width="12" height="3" rx="1.5" fill="#3D9970" />
        <circle cx="36" cy="36" r="8" fill="#FFD93D" />
        <path d="M33 36l2 2 4-4" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" />
      </svg>
    ),
  },
  videos: {
    gradient: 'linear-gradient(135deg, #FF6B9D 0%, #C44569 100%)',
    icon: (
      <svg viewBox="0 0 48 48" className="w-8 h-8">
        <rect x="4" y="10" width="40" height="28" rx="4" fill="white" />
        <polygon points="20,17 20,31 32,24" fill="#C44569" />
        <circle cx="38" cy="14" r="6" fill="#FFD93D" />
        <path d="M36 14l2 2 3-3" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      </svg>
    ),
  },
  tasks: {
    gradient: 'linear-gradient(135deg, #74B9FF 0%, #0984E3 100%)',
    icon: (
      <svg viewBox="0 0 48 48" className="w-8 h-8">
        <rect x="6" y="8" width="36" height="32" rx="4" fill="white" />
        <circle cx="16" cy="18" r="3" fill="#0984E3" />
        <rect x="22" y="16" width="14" height="4" rx="2" fill="#74B9FF" />
        <circle cx="16" cy="28" r="3" fill="#0984E3" />
        <rect x="22" y="26" width="14" height="4" rx="2" fill="#74B9FF" />
        <circle cx="40" cy="8" r="6" fill="#00B894" />
        <path d="M38 8l1.5 1.5 3-3" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      </svg>
    ),
  },
  games: {
    gradient: 'linear-gradient(135deg, #A29BFE 0%, #6C5CE7 100%)',
    icon: (
      <svg viewBox="0 0 48 48" className="w-8 h-8">
        <rect x="4" y="14" width="40" height="24" rx="12" fill="white" />
        <circle cx="14" cy="26" r="4" fill="#6C5CE7" />
        <rect x="12" y="22" width="4" height="8" rx="1" fill="white" />
        <rect x="10" y="24" width="8" height="4" rx="1" fill="white" />
        <circle cx="32" cy="22" r="2.5" fill="#A29BFE" />
        <circle cx="38" cy="26" r="2.5" fill="#6C5CE7" />
        <circle cx="32" cy="30" r="2.5" fill="#A29BFE" />
        <circle cx="26" cy="26" r="2.5" fill="#6C5CE7" />
      </svg>
    ),
  },
  offers: {
    gradient: 'linear-gradient(135deg, #FDCB6E 0%, #E17055 100%)',
    icon: (
      <svg viewBox="0 0 48 48" className="w-8 h-8">
        <path d="M24 4l6 12h14l-11 8 4 14-13-10-13 10 4-14L4 16h14l6-12z" fill="white" />
        <circle cx="24" cy="22" r="6" fill="#E17055" />
        <text x="24" y="26" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">%</text>
      </svg>
    ),
  },
  apps: {
    gradient: 'linear-gradient(135deg, #55EFC4 0%, #00B894 100%)',
    icon: (
      <svg viewBox="0 0 48 48" className="w-8 h-8">
        <rect x="10" y="4" width="28" height="40" rx="4" fill="white" />
        <rect x="14" y="10" width="8" height="8" rx="2" fill="#00B894" />
        <rect x="26" y="10" width="8" height="8" rx="2" fill="#55EFC4" />
        <rect x="14" y="22" width="8" height="8" rx="2" fill="#55EFC4" />
        <rect x="26" y="22" width="8" height="8" rx="2" fill="#00B894" />
        <circle cx="24" cy="38" r="3" fill="#00B894" />
      </svg>
    ),
  },
  social: {
    gradient: 'linear-gradient(135deg, #FD79A8 0%, #E84393 100%)',
    icon: (
      <svg viewBox="0 0 48 48" className="w-8 h-8">
        <circle cx="24" cy="16" r="8" fill="white" />
        <path d="M12 40c0-8 5-12 12-12s12 4 12 12" fill="white" />
        <circle cx="36" cy="12" r="5" fill="#FD79A8" />
        <circle cx="12" cy="12" r="5" fill="#E84393" />
        <path d="M24 24l4-4M24 24l-4-4" stroke="#E84393" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  shopping: {
    gradient: 'linear-gradient(135deg, #81ECEC 0%, #00CEC9 100%)',
    icon: (
      <svg viewBox="0 0 48 48" className="w-8 h-8">
        <path d="M8 12h4l6 20h16l6-16H14" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="18" cy="38" r="4" fill="white" />
        <circle cx="34" cy="38" r="4" fill="white" />
        <circle cx="36" cy="8" r="6" fill="#FFD93D" />
        <text x="36" y="11" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">$</text>
      </svg>
    ),
  },
}

// Get 3D icon for category
function getCategory3DIcon(name: string): { gradient: string; icon: React.ReactNode } {
  const key = name.toLowerCase()
  return CATEGORY_3D_ICONS[key] || CATEGORY_3D_ICONS.tasks
}

export function CategoryScroll({ categories, selectedCategory, onSelect }: CategoryScrollProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  // Add "All" category at the beginning
  const allCategories = [
    { id: null, name: 'All', icon_url: null, color: '#E8E8E8', sort_order: -1, created_at: '' },
    ...categories,
  ]

  return (
    <div className="relative w-full">
      <div
        ref={scrollRef}
        className={clsx(
          'flex gap-4 overflow-x-auto py-4 px-4',
          'scrollbar-hide scroll-smooth',
          // Hide scrollbar across browsers
          '[&::-webkit-scrollbar]:hidden',
          '[-ms-overflow-style:none]',
          '[scrollbar-width:none]'
        )}
        style={{
          WebkitOverflowScrolling: 'touch', // Smooth momentum scrolling on iOS
        }}
      >
        {allCategories.map((category) => {
          const isSelected = category.id === selectedCategory
          const categoryKey = category.id === null ? 'all' : category.name
          const { gradient, icon } = getCategory3DIcon(categoryKey)
          
          return (
            <motion.button
              key={category.id ?? 'all'}
              onClick={() => onSelect(category.id)}
              whileHover={{ scale: 1.08, y: -4 }}
              whileTap={{ scale: 0.95 }}
              className="flex flex-col items-center gap-2 min-w-[72px]"
            >
              {/* 3D Circular icon container with gradient */}
              <motion.div
                className={clsx(
                  'w-16 h-16 rounded-full flex items-center justify-center',
                  'transition-all duration-300 shadow-lg',
                  isSelected && 'ring-3 ring-white ring-offset-2 ring-offset-[#0a0a0a]'
                )}
                style={{ 
                  background: gradient,
                  boxShadow: isSelected 
                    ? '0 8px 25px rgba(0,0,0,0.3), inset 0 -4px 8px rgba(0,0,0,0.2), inset 0 4px 8px rgba(255,255,255,0.3)'
                    : '0 4px 15px rgba(0,0,0,0.2), inset 0 -2px 4px rgba(0,0,0,0.1), inset 0 2px 4px rgba(255,255,255,0.2)'
                }}
                animate={isSelected ? { 
                  scale: [1, 1.05, 1],
                  rotate: [0, 5, -5, 0]
                } : {}}
                transition={{ duration: 0.5 }}
              >
                {category.icon_url ? (
                  <Image
                    src={category.icon_url}
                    alt={category.name}
                    width={32}
                    height={32}
                    className="object-contain drop-shadow-md"
                  />
                ) : (
                  <div className="drop-shadow-md">{icon}</div>
                )}
              </motion.div>
              
              {/* Label below circle */}
              <span
                className={clsx(
                  'text-xs font-medium transition-colors',
                  isSelected ? 'text-white' : 'text-gray-400'
                )}
              >
                {category.name}
              </span>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
