'use client'

import { motion } from 'framer-motion'

const before = [
  'Failures surface as user complaints, days later',
  'No logs, no traces, no context to debug with',
  'grep through stdout hoping to find something',
  'Cost spikes show up on the billing page',
  'Infinite loops run until rate limits stop them',
  'No idea which run failed, when, or why',
]

const after = [
  'Every failure classified before users ever see it',
  'Full trace: every LLM call, tool use, and decision',
  'Replay any run step by step in the dashboard',
  'Cost per run, broken down by step',
  'Loops caught and alerted within seconds',
  'Root cause surfaced in seconds, not hours',
]

export default function BeforeAfter() {
  return (
    <section className="relative py-28 border-t border-white/[0.05]">
      <div className="max-w-5xl mx-auto px-6">

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-14"
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/30 mb-5">
            The difference
          </p>
          <h2
            className="text-[clamp(1.8rem,3.5vw,2.8rem)] font-bold tracking-[-0.03em] leading-[1.08] text-white max-w-xl"
            style={{ fontFamily: "'Geist', system-ui, sans-serif" }}
          >
            Shipping blind
            <br />
            <span className="text-white/40">vs. knowing exactly what broke.</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-white/[0.06]">

          {/* Before */}
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-[#0d0a0a] p-8 flex flex-col gap-6"
          >
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-mono font-semibold tracking-[0.2em] text-red-400/50 uppercase">Without Veil</span>
              <div className="flex-1 h-px bg-red-500/[0.08]" />
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-40" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500/50" />
              </span>
            </div>
            <ul className="flex flex-col gap-3.5">
              {before.map((item, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-start gap-3 text-[13px] text-white/40 leading-relaxed"
                >
                  <span className="mt-[9px] w-3 h-px bg-red-500/25 flex-shrink-0" />
                  {item}
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* After */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="bg-[#080d10] p-8 flex flex-col gap-6"
            style={{ borderLeft: '1px solid rgba(59,130,246,0.15)' }}
          >
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-mono font-semibold tracking-[0.2em] text-blue-400/70 uppercase">With Veil</span>
              <div className="flex-1 h-px bg-blue-500/[0.12]" />
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-50" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-400/70" />
              </span>
            </div>
            <ul className="flex flex-col gap-3.5">
              {after.map((item, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 + i * 0.05 }}
                  className="flex items-start gap-3 text-[13px] text-white/80 leading-relaxed"
                >
                  <svg className="mt-[3px] flex-shrink-0" width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2.5 7L5.5 10L11.5 4" stroke="rgba(59,130,246,0.8)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {item}
                </motion.li>
              ))}
            </ul>
          </motion.div>

        </div>
      </div>
    </section>
  )
}
