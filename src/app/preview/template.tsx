'use client'

import { motion } from 'framer-motion'

// template.tsx re-mounts on every navigation, so this plays an enter animation
// each time the visitor moves between preview pages.
export default function PreviewTemplate({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}
