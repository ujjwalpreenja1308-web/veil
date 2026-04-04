'use client'

import { motion } from 'framer-motion'
import { MagneticButton } from '@/components/ui/magnetic-button'

export default function CtaSection() {
  return (
    <section className="relative py-40 overflow-hidden border-t border-white/[0.05]" id="get-started">
      {/* Stronger directional ambient */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 80% 70% at 25% 60%, rgba(59,130,246,0.08) 0%, transparent 65%)',
        }}
      />

      <div className="relative max-w-[1400px] mx-auto px-6 md:px-16">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-12 items-end">

          {/* Left — urgent copy */}
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/30 mb-6">
              Start free, no credit card
            </p>
            <h2
              className="text-[clamp(2.4rem,6vw,5rem)] font-bold tracking-[-0.04em] leading-[1.02] text-white mb-6"
              style={{ fontFamily: "'Geist', system-ui, sans-serif" }}
            >
              Your agent is failing right now
              <br />
              <span className="text-white/40">You just don't know it</span>
            </h2>
            <p className="text-[15px] text-white/50 leading-relaxed max-w-[44ch] mb-6">
              One line of code. Every failure, every trace, every dollar visible in seconds.
              The engineers not using Veil are the ones getting paged at 3am.
            </p>
            <div className="flex flex-wrap gap-6 text-[12px] font-mono text-white/25">
              <span>Free tier available</span>
              <span className="text-white/10">·</span>
              <span>No infra required</span>
              <span className="text-white/10">·</span>
              <span>Works in 60 seconds</span>
            </div>
          </motion.div>

          {/* Right — actions */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.15 }}
            className="flex flex-col gap-4 items-start md:items-end"
          >
            {/* Code snippet */}
            <div
              className="flex items-center gap-3 px-5 py-3 rounded-xl"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.09)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
              }}
            >
              <span className="font-mono text-xs text-white/25">$</span>
              <code className="font-mono text-xs text-white/70 tracking-wide">pip install veil-sdk</code>
              <button
                onClick={() => navigator.clipboard?.writeText('pip install veil-sdk')}
                className="ml-1 p-1 rounded text-white/25 hover:text-white/60 transition-colors duration-200"
                title="Copy"
              >
                <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                  <rect x="1" y="3" width="9" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
                  <path d="M4 3V2.5C4 1.67157 4.67157 1 5.5 1H11.5C12.3284 1 13 1.67157 13 2.5V8.5C13 9.32843 12.3284 10 11.5 10H11" stroke="currentColor" strokeWidth="1.2"/>
                </svg>
              </button>
            </div>

            {/* Buttons */}
            <div className="flex flex-wrap gap-3">
              <MagneticButton>
                <a
                  href="#"
                  className="inline-flex items-center gap-2.5 px-6 py-3 rounded-full bg-white text-[#080810] font-semibold text-sm tracking-tight hover:bg-zinc-100 transition-all duration-200 active:scale-[0.97] active:translate-y-px"
                >
                  Start for free
                  <span className="w-5 h-5 rounded-full bg-[#080810]/10 flex items-center justify-center">
                    <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
                      <path d="M2 8L8 2M8 2H3.5M8 2V6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                </a>
              </MagneticButton>
              <a
                href="https://docs.veil.dev"
                className="inline-flex items-center px-6 py-3 rounded-full border border-white/[0.12] text-white/60 font-semibold text-sm tracking-tight hover:border-white/25 hover:text-white/80 transition-all duration-200 active:scale-[0.97] active:translate-y-px"
              >
                View docs
              </a>
            </div>

            <p className="text-[11px] text-white/20 font-mono">
              No credit card. Cancel anytime.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
