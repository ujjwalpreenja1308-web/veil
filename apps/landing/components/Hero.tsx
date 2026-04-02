'use client'

import { motion } from 'framer-motion'
import { Component as EtheralShadow } from '@/components/ui/etheral-shadow'
import { MagneticButton } from '@/components/ui/magnetic-button'

const fadeUp = (delay = 0) => ({
  hidden: { opacity: 0, y: 20, filter: 'blur(4px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.9, ease: [0.25, 0.46, 0.45, 0.94], delay },
  },
})

export default function Hero() {
  return (
    <section className="relative min-h-[100dvh] flex flex-col items-center justify-center overflow-hidden">

      {/* Background */}
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        <EtheralShadow
          color="rgba(29, 78, 216, 1)"
          animation={{ scale: 100, speed: 90 }}
          noise={{ opacity: 0.6, scale: 1.2 }}
          sizing="fill"
        />
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(180deg, rgba(8,8,16,0.4) 0%, rgba(8,8,16,0.0) 25%, rgba(8,8,16,0.0) 55%, rgba(8,8,16,1) 92%)',
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse 100% 100% at 50% 50%, transparent 35%, rgba(8,8,16,0.65) 100%)',
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-4xl mx-auto px-6 flex flex-col items-center text-center">

        {/* H1 */}
        <motion.h1
          variants={fadeUp(0.05)}
          initial="hidden"
          animate="visible"
          className="text-[clamp(2.2rem,4.8vw,4.4rem)] leading-[1.05] tracking-[-0.02em] mb-8 text-white"
          style={{
            fontFamily: "'PPEditorialNew', Georgia, serif",
            fontWeight: 200,
            fontStyle: 'italic',
            filter: 'drop-shadow(0 0 28px rgba(99,155,255,0.28)) drop-shadow(0 0 72px rgba(59,130,246,0.14))',
          }}
        >
          <span className="whitespace-nowrap">Your agents silently fail in production</span>
          <br />
          We fix that
        </motion.h1>

        {/* Subhead */}
        <motion.p
          variants={fadeUp(0.15)}
          initial="hidden"
          animate="visible"
          className="text-[15px] text-white/40 leading-relaxed max-w-[44ch] mb-4"
        >
          Agents hallucinate, loop, and fail silently in production.
          Veil surfaces every failure automatically in real time.
        </motion.p>

        {/* Differentiator */}
        <motion.p
          variants={fadeUp(0.2)}
          initial="hidden"
          animate="visible"
          className="text-[12px] text-white/20 tracking-wide mb-10"
        >
          Not just logs. A failure detection layer built for AI agents.
        </motion.p>

        {/* CTA */}
        <motion.div
          variants={fadeUp(0.25)}
          initial="hidden"
          animate="visible"
          className="flex flex-col items-center gap-4"
        >
          {/* Buttons row */}
          <div className="flex items-center gap-3 flex-wrap justify-center">
            <MagneticButton href="/sign-up">
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-[#080810] font-semibold text-[13px] tracking-tight hover:bg-zinc-100 transition-all duration-200 active:scale-[0.97] active:translate-y-px cursor-pointer">
                Get started free
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M2 8L8 2M8 2H3.5M8 2V6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </MagneticButton>

            {/* pip install pill */}
            <div
              className="flex items-center gap-3 px-5 py-2.5 rounded-full cursor-pointer active:scale-[0.97] active:translate-y-px transition-transform"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
              }}
            >
              <span className="font-mono text-[12px] text-white/30">$</span>
              <code className="font-mono text-[12px] text-white/70 tracking-wide">pip install veil-sdk</code>
              <button
                onClick={() => navigator.clipboard?.writeText('pip install veil-sdk')}
                className="ml-1 p-1 rounded text-white/25 hover:text-white/60 transition-colors duration-200"
                title="Copy"
              >
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                  <rect x="1" y="3" width="9" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
                  <path d="M4 3V2.5C4 1.67157 4.67157 1 5.5 1H11.5C12.3284 1 13 1.67157 13 2.5V8.5C13 9.32843 12.3284 10 11.5 10H11" stroke="currentColor" strokeWidth="1.2"/>
                </svg>
              </button>
            </div>
          </div>

          <span className="text-[11px] text-white/15 font-mono">free tier available, no credit card</span>
        </motion.div>
      </div>

      {/* Bottom fade */}
      <div
        className="absolute bottom-0 left-0 right-0 h-40 pointer-events-none"
        style={{ background: 'linear-gradient(to top, #080810 0%, transparent 100%)', zIndex: 5 }}
      />
    </section>
  )
}
