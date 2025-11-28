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

// Pastel background colors for category icons
const PASTEL_COLORS = [
  '#FFE5EC', // Pink
  '#E0E7FF', // Lavender
  '#F3E8FF', // Purple
  '#E8F0FE', // Blue
  '#FEF3E8', // Peach
  '#E8FEF3', // Mint
  '#FFF8E8', // Cream
  '#F0E8FE', // Violet
]

function getCategoryColor(index: number): string {
  return PASTEL_COLORS[index % PASTEL_COLORS.length]
}

// Default category icons (emoji-based for simplicity)
function getCategoryIcon(name: string): string {
  const icons: Record<string, string> = {
    surveys: '📋',
    videos: '🎬',
    tasks: '✅',
    games: '🎮',
    offers: '🎁',
    shopping: '🛒',
    apps: '📱',
    social: '💬',
  }
  return icons[name.toLowerCase()] || '📌'
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
        {allCategories.map((category, index) => {
          const isSelected = category.id === selectedCategory
          const bgColor = category.id === null ? '#E8E8E8' : getCategoryColor(index - 1)
          
          return (
            <motion.button
              key={category.id ?? 'all'}
              onClick={() => onSelect(category.id)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex flex-col items-center gap-2 min-w-[72px]"
            >
              {/* Circular icon container */}
              <div
                className={clsx(
                  'w-16 h-16 rounded-full flex items-center justify-center text-2xl',
                  'transition-all duration-200',
                  isSelected && 'ring-2 ring-purple-500 ring-offset-2 ring-offset-[#0a0a0a]'
                )}
                style={{ backgroundColor: bgColor }}
              >
                {category.icon_url ? (
                  <Image
                    src={category.icon_url}
                    alt={category.name}
                    width={32}
                    height={32}
                    className="object-contain"
                  />
                ) : (
                  <span>{category.id === null ? '🏠' : getCategoryIcon(category.name)}</span>
                )}
              </div>
              
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
