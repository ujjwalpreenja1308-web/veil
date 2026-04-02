'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const navLinks = [
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Features', href: '#capabilities' },
  { label: 'Docs', href: 'https://docs.veil.dev' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 32)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <>
      <motion.nav
        initial={{ y: -16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="fixed top-0 left-0 right-0 z-50"
      >
        <div className="max-w-[1400px] mx-auto px-6 md:px-16 pt-5">
          <div
            className={`flex items-center justify-between h-12 px-5 rounded-2xl transition-all duration-500 ${
              scrolled
                ? 'bg-[#080810]/80 backdrop-blur-xl border border-white/[0.07] shadow-[0_8px_32px_rgba(0,0,0,0.4)]'
                : 'bg-transparent'
            }`}
          >
            {/* Logo */}
            <a href="#" className="flex items-center gap-2.5">
              <img src="/logo.svg" alt="Veil" className="w-6 h-6" />
            </a>

            {/* Desktop links */}
            <div className="hidden md:flex items-center gap-7">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-[13px] text-white/35 hover:text-white/70 transition-colors duration-200 font-medium tracking-tight"
                >
                  {link.label}
                </a>
              ))}
            </div>

            {/* CTA */}
            <div className="hidden md:flex">
              <a
                href="#get-started"
                className="group inline-flex items-center gap-2 px-4 py-1.5 rounded-xl text-[13px] font-semibold text-white/80 bg-white/[0.06] border border-white/[0.08] hover:bg-white/[0.10] hover:text-white hover:border-white/[0.14] transition-all duration-200 active:scale-[0.97] active:translate-y-px"
              >
                Get started
                <span className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center transition-transform duration-200 group-hover:translate-x-0.5">
                  <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
                    <path d="M2 8L8 2M8 2H3.5M8 2V6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
              </a>
            </div>

            {/* Mobile toggle */}
            <button
              className="md:hidden flex flex-col items-center justify-center gap-[5px] w-8 h-8 text-white/50 hover:text-white/80 transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              <motion.span
                animate={mobileOpen ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 }}
                transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="block w-5 h-px bg-current"
              />
              <motion.span
                animate={mobileOpen ? { opacity: 0 } : { opacity: 1 }}
                transition={{ duration: 0.15 }}
                className="block w-5 h-px bg-current"
              />
              <motion.span
                animate={mobileOpen ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 }}
                transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="block w-5 h-px bg-current"
              />
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-[#080810]/96 backdrop-blur-2xl flex flex-col justify-center px-8"
          >
            <nav className="flex flex-col gap-1">
              {navLinks.map((link, i) => (
                <motion.a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: i * 0.07 + 0.04, duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                  className="text-[2.4rem] font-bold text-white/70 hover:text-white py-2 tracking-tight transition-colors"
                >
                  {link.label}
                </motion.a>
              ))}
              <motion.a
                href="#get-started"
                onClick={() => setMobileOpen(false)}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: 0.28, duration: 0.3 }}
                className="mt-10 inline-flex items-center justify-center px-6 py-3.5 rounded-full bg-white text-[#080810] font-semibold text-base"
              >
                Get started
              </motion.a>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
