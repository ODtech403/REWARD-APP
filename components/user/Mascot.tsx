'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { clsx } from 'clsx'

export type MascotState = 'idle' | 'celebrating' | 'pointing' | 'sleeping'

interface MascotProps {
  state: MascotState
  onAnimationComplete?: () => void
  className?: string
}

// SVG-based mascot character (a friendly robot/creature)
function MascotSVG({ state }: { state: MascotState }) {
  const eyeVariants = {
    idle: { scaleY: 1 },
    celebrating: { scaleY: 1 },
    pointing: { scaleY: 1 },
    sleeping: { scaleY: 0.1 },
  }

  const mouthVariants = {
    idle: { d: 'M 35 55 Q 50 65 65 55' }, // Slight smile
    celebrating: { d: 'M 30 50 Q 50 70 70 50' }, // Big smile
    pointing: { d: 'M 35 55 Q 50 60 65 55' }, // Small smile
    sleeping: { d: 'M 40 55 L 60 55' }, // Flat line
  }

  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      {/* Body */}
      <motion.ellipse
        cx="50"
        cy="60"
        rx="35"
        ry="30"
        fill="url(#bodyGradient)"
        initial={{ scale: 1 }}
        animate={
          state === 'celebrating'
            ? { scale: [1, 1.1, 1], y: [0, -5, 0] }
            : state === 'idle'
              ? { y: [0, -3, 0] }
              : { scale: 1 }
        }
        transition={{
          duration: state === 'celebrating' ? 0.5 : 2,
          repeat: state === 'idle' ? Infinity : 0,
          ease: 'easeInOut',
        }}
      />

      {/* Left Eye */}
      <motion.ellipse
        cx="38"
        cy="50"
        rx="8"
        ry="10"
        fill="white"
        variants={eyeVariants}
        animate={state}
        transition={{ duration: 0.3 }}
      />
      <motion.circle
        cx="40"
        cy="50"
        r="4"
        fill="#1a1a2e"
        animate={
          state === 'pointing'
            ? { cx: 44 }
            : state === 'sleeping'
              ? { opacity: 0 }
              : { cx: 40 }
        }
        transition={{ duration: 0.3 }}
      />

      {/* Right Eye */}
      <motion.ellipse
        cx="62"
        cy="50"
        rx="8"
        ry="10"
        fill="white"
        variants={eyeVariants}
        animate={state}
        transition={{ duration: 0.3 }}
      />
      <motion.circle
        cx="64"
        cy="50"
        r="4"
        fill="#1a1a2e"
        animate={
          state === 'pointing'
            ? { cx: 68 }
            : state === 'sleeping'
              ? { opacity: 0 }
              : { cx: 64 }
        }
        transition={{ duration: 0.3 }}
      />

      {/* Mouth */}
      <motion.path
        fill="none"
        stroke="#1a1a2e"
        strokeWidth="3"
        strokeLinecap="round"
        initial={{ d: 'M 35 55 Q 50 65 65 55' }}
        animate={mouthVariants[state]}
        transition={{ duration: 0.3 }}
      />

      {/* Blush marks */}
      <circle cx="25" cy="58" r="5" fill="#FFB6C1" opacity="0.6" />
      <circle cx="75" cy="58" r="5" fill="#FFB6C1" opacity="0.6" />

      {/* Left Arm */}
      <motion.ellipse
        cx="18"
        cy="65"
        rx="8"
        ry="12"
        fill="url(#bodyGradient)"
        animate={
          state === 'pointing'
            ? { rotate: -30, x: 5, y: -10 }
            : state === 'celebrating'
              ? { rotate: [-20, 20, -20], y: [0, -5, 0] }
              : { rotate: 0, x: 0, y: 0 }
        }
        transition={{
          duration: state === 'celebrating' ? 0.3 : 0.5,
          repeat: state === 'celebrating' ? 3 : 0,
        }}
        style={{ originX: '18px', originY: '75px' }}
      />

      {/* Right Arm */}
      <motion.ellipse
        cx="82"
        cy="65"
        rx="8"
        ry="12"
        fill="url(#bodyGradient)"
        animate={
          state === 'pointing'
            ? { rotate: -45, x: 10, y: -15 }
            : state === 'celebrating'
              ? { rotate: [20, -20, 20], y: [0, -5, 0] }
              : { rotate: 0, x: 0, y: 0 }
        }
        transition={{
          duration: state === 'celebrating' ? 0.3 : 0.5,
          repeat: state === 'celebrating' ? 3 : 0,
        }}
        style={{ originX: '82px', originY: '75px' }}
      />

      {/* Sleep Z's */}
      <AnimatePresence>
        {state === 'sleeping' && (
          <>
            <motion.text
              x="70"
              y="35"
              fontSize="12"
              fill="#8B7ECC"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: [0, 1, 0], y: [10, 0, -10] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0 }}
            >
              z
            </motion.text>
            <motion.text
              x="78"
              y="25"
              fontSize="14"
              fill="#8B7ECC"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: [0, 1, 0], y: [10, 0, -10] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
            >
              Z
            </motion.text>
            <motion.text
              x="88"
              y="15"
              fontSize="16"
              fill="#8B7ECC"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: [0, 1, 0], y: [10, 0, -10] }}
              transition={{ duration: 2, repeat: Infinity, delay: 1 }}
            >
              Z
            </motion.text>
          </>
        )}
      </AnimatePresence>

      {/* Gradient definitions */}
      <defs>
        <linearGradient id="bodyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8B7ECC" />
          <stop offset="100%" stopColor="#A99DD8" />
        </linearGradient>
      </defs>
    </svg>
  )
}

export function Mascot({ state, onAnimationComplete, className }: MascotProps) {
  return (
    <motion.div
      className={clsx('relative', className)}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5 }}
      onAnimationComplete={() => {
        if (state === 'celebrating' && onAnimationComplete) {
          // Delay callback to allow celebration animation to complete
          setTimeout(onAnimationComplete, 1500)
        }
      }}
    >
      {/* Glow effect for celebrating state */}
      <AnimatePresence>
        {state === 'celebrating' && (
          <motion.div
            className="absolute inset-0 rounded-full bg-yellow-400/30 blur-xl"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.5, repeat: 3 }}
          />
        )}
      </AnimatePresence>

      <MascotSVG state={state} />

      {/* Speech bubble for pointing state */}
      <AnimatePresence>
        {state === 'pointing' && (
          <motion.div
            className="absolute -top-2 -right-2 bg-white rounded-lg px-2 py-1 text-xs text-gray-800 shadow-lg"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          >
            <span>Try this! →</span>
            <div className="absolute -bottom-1 left-3 w-2 h-2 bg-white transform rotate-45" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
