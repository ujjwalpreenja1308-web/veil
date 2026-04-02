'use client'

import { motion } from 'framer-motion'

const items = [
  {
    title: 'Detect infinite loops',
    description: 'Catch agents stuck in repetition cycles before they drain your budget.',
    saving: '-40% avg cost',
  },
  {
    title: 'Catch redundant LLM calls',
    description: 'Surface duplicate calls and eliminate them at the source.',
    saving: '-25% API spend',
  },
  {
    title: 'Optimize token consumption',
    description: 'Per-step token attribution so you know exactly where context goes.',
    saving: '-30% tokens',
  },
]

export default function CostControl() {
  return (
    <section className="relative py-32 border-t border-white/[0.05]" id="cost">
      <div className="max-w-[1400px] mx-auto px-6 md:px-16">

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-20 items-start">

          {/* Left */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/30 mb-5">
              Cost control
            </p>
            <h2 className="text-[clamp(2rem,4vw,3.2rem)] font-bold tracking-[-0.03em] leading-[1.08] text-white mb-6" style={{ fontFamily: "'Geist', system-ui, sans-serif" }}>
              Stop paying for
              <br />
              <span className="text-white/40">agent waste</span>
            </h2>
            <p className="text-sm text-white/50 leading-relaxed max-w-[42ch] mb-10">
              Most cost overruns come from loops, duplicate calls, and runaway context.
              Veil finds them before your billing page does.
            </p>

            <div className="flex flex-col gap-2.5">
              {[
                'Budget alerts before overruns happen',
                'Per-run cost breakdown by step',
                'Step-level token attribution',
                'Week-over-week trend analysis',
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 text-[13px] text-white/55">
                  <span className="w-3.5 h-3.5 rounded-full border border-blue-500/40 flex items-center justify-center shrink-0">
                    <svg width="7" height="7" viewBox="0 0 8 8" fill="none">
                      <path d="M1.5 4L3.5 6L6.5 2" stroke="#3b82f6" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                  {item}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right — list rows */}
          <div className="flex flex-col divide-y divide-white/[0.06]">
            {items.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94], delay: i * 0.1 }}
                className="group py-8 first:pt-0 flex items-start gap-6 hover:translate-x-1 transition-transform duration-300"
              >
                <div className="flex-1">
                  <h3 className="text-white/90 font-semibold text-[15px] tracking-tight mb-2">{item.title}</h3>
                  <p className="text-white/40 text-sm leading-relaxed">{item.description}</p>
                </div>
                <span className="shrink-0 mt-0.5 font-mono text-[12px] font-bold text-blue-400/80 tracking-tight">
                  {item.saving}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
